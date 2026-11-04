// ============================================================================
// WATTIPID ESP32 ELECTRICITY MONITORING & SIMULATION FIRMWARE
// Room 2 Configuration
// ============================================================================
// Simulation Mode: Generates random Voltage and Current each reading.
//   W = V * I  (mathematically consistent, always)
//   kWh accumulated over time.
// Hardware Mode: Reads physical SCT-013 & ZMPT101B sensors.
// ============================================================================

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "EmonLib.h"

// --- WI-FI & BACKEND CONFIGURATION ---
const char *WIFI_SSID = "Lemonades";
const char *WIFI_PASS = "Naksuah12341sss";
const char *SERVER_URL = "http://172.20.10.12/wattipid_backend/api.php";
const char *ROOM_ID = "Room 2";
const char *API_KEY = "wattipid_esp32_secret_2024";

// --- SENSOR PINS & CALIBRATION (HARDWARE MODE) ---
#define CT_PIN 32    // SCT-013 current clamp on GPIO 32
#define ZMPT_PIN 34  // ZMPT101B voltage sensor on GPIO 34
const float CT_CALIBRATION = 30.0;
const float ZMPT_CALIBRATION = 626.0;
const float CURRENT_NOISE_GATE = 0.02; // Amps
const float VOLTAGE_NOISE_GATE = 50.0; // Volts

// --- OPERATING MODES ---
enum OperatingMode {
  MODE_SIMULATION = 0,
  MODE_HARDWARE = 1
};
OperatingMode currentMode = MODE_SIMULATION;

// --- SIMULATION LIMITS ---
const float MAX_TOTAL_POWER = 300.0;  // Max watts cap

// --- TELEMETRY INTERVAL ---
unsigned long telemetryInterval = 1000; // 1 second

// --- HARDWARE OBJECTS & PERSISTENCE ---
EnergyMonitor emonCT;
Adafruit_SSD1306 display(128, 64, &Wire, -1);
Preferences preferences;

bool hasOled = false;
float totalKWh = 0.0;
float lastSavedKWh = 0.0;
unsigned long lastLoopMillis = 0;
unsigned long lastSendMillis = 0;
unsigned long lastPrefSaveMillis = 0;
unsigned long lastWifiRetryMillis = 0;
const unsigned long WIFI_RETRY_INTERVAL = 8000;

// Live Electrical Variables
float liveVoltage = 0.0;
float liveCurrent = 0.0;
float livePower = 0.0;

// ============================================================================
// HARDWARE SENSOR READINGS (ZMPT101B & SCT-013)
// ============================================================================
float readHardwareVoltageRMS() {
  const int SAMPLES = 400;
  long sum = 0;
  for (int i = 0; i < SAMPLES; i++) {
    sum += analogRead(ZMPT_PIN);
    delayMicroseconds(150);
  }
  float dcOffset = (float)sum / SAMPLES;

  double sumSquared = 0;
  for (int i = 0; i < SAMPLES; i++) {
    float sample = (float)analogRead(ZMPT_PIN) - dcOffset;
    sumSquared += sample * sample;
    delayMicroseconds(150);
  }
  float adcRms = sqrt(sumSquared / SAMPLES);
  return adcRms * (3.3 / 4095.0) * ZMPT_CALIBRATION;
}

// ============================================================================
// SIMULATION: RANDOM VOLTAGE & CURRENT GENERATION
// ============================================================================
// Generates a fresh random Voltage (220V-240V) and Current (0.08A-1.30A)
// every call. Watts = V * I, always consistent. No smoothing, no standby,
// no appliance logic. Each reading is unique and varies widely.
// ============================================================================
void runSimulationModel() {
  // Random Voltage: 220.0V to 240.0V (Philippine-range AC)
  // Generate in tenths for 1-decimal precision: 2200..2400 -> /10.0
  liveVoltage = random(2200, 2401) / 10.0;

  // Random Current: 0.080A to 1.300A
  // This gives power range of ~17W to ~312W, capped at 300W
  // Generate in thousandths: 80..1300 -> /1000.0
  liveCurrent = random(80, 1301) / 1000.0;

  // Watts = Voltage x Current (always mathematically exact)
  livePower = liveVoltage * liveCurrent;

  // Cap at 300W max — if over, reduce current to fit
  if (livePower > MAX_TOTAL_POWER) {
    livePower = MAX_TOTAL_POWER;
    liveCurrent = livePower / liveVoltage;
  }

  // Round for clean display (rounding done AFTER the math)
  livePower   = round(livePower * 10.0) / 10.0;
  liveCurrent = round(liveCurrent * 1000.0) / 1000.0;
  liveVoltage = round(liveVoltage * 10.0) / 10.0;
}

// ============================================================================
// SEND TELEMETRY TO WATTIPID BACKEND API
// ============================================================================
void sendTelemetryToAPI(float v, float i, float p, float e) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println(F("[API] Skipped: Wi-Fi not connected"));
    return;
  }

  WiFiClient client;
  HTTPClient http;
  http.begin(client, SERVER_URL);
  http.setReuse(true);
  http.setTimeout(1000);
  http.addHeader("Content-Type", "application/json");

  // Create JSON Payload
  JsonDocument doc;
  doc["action"] = "logConsumption";
  doc["apiKey"] = API_KEY;
  doc["roomId"] = ROOM_ID;
  doc["voltage"] = round(v * 10.0) / 10.0;
  doc["current"] = round(i * 1000.0) / 1000.0;
  doc["power"] = round(p * 10.0) / 10.0;
  doc["energy"] = round(e * 10000.0) / 10000.0;
  doc["source"] = (currentMode == MODE_SIMULATION) ? "simulation" : "hardware";
  doc["is_simulated"] = (currentMode == MODE_SIMULATION);

  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  if (httpCode == HTTP_CODE_OK || httpCode == 201) {
    Serial.printf(" -> API [HTTP %d] Synced: V=%.1fV, A=%.3fA, W=%.1fW, kWh=%.4f\n",
                  httpCode, v, i, p, e);
  } else {
    Serial.printf(" -> API [HTTP %d] ERR: %s\n", httpCode, http.errorToString(httpCode).c_str());
  }
  http.end();
}

// ============================================================================
// OLED DISPLAY UPDATE
// ============================================================================
void updateOledDisplay() {
  if (!hasOled) return;

  display.clearDisplay();
  display.setTextColor(WHITE);

  // Header
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print(ROOM_ID);
  display.print(currentMode == MODE_SIMULATION ? " [SIM]" : " [REAL]");
  if (WiFi.status() != WL_CONNECTED) {
    display.print(" !");
  }
  display.drawLine(0, 10, 128, 10, WHITE);

  // Voltage & Current
  display.setCursor(0, 14);
  display.printf("V: %.1fV\n", liveVoltage);
  display.printf("I: %.3fA\n", liveCurrent);

  // Power in large font
  display.setCursor(0, 34);
  display.setTextSize(2);
  display.printf("%.1fW\n", livePower);

  // kWh
  display.setTextSize(1);
  display.setCursor(0, 54);
  display.printf("%.4f kWh", totalKWh);

  display.display();
}

// ============================================================================
// PROCESS USER COMMANDS FROM SERIAL MONITOR
// ============================================================================
void handleSerialCommands() {
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '\r' || c == '\n') continue;

    switch (c) {
      case 'm':
      case 'M':
        if (currentMode == MODE_SIMULATION) {
          currentMode = MODE_HARDWARE;
          Serial.println(F("\n[CMD] Switched to MODE_HARDWARE (Physical Sensors)"));
        } else {
          currentMode = MODE_SIMULATION;
          Serial.println(F("\n[CMD] Switched to MODE_SIMULATION (Random V*I)"));
        }
        break;

      case 's':
      case 'S':
        if (telemetryInterval == 1000) {
          telemetryInterval = 500;
          Serial.println(F("\n[CMD] Speed -> FAST (500 ms)"));
        } else if (telemetryInterval == 500) {
          telemetryInterval = 2000;
          Serial.println(F("\n[CMD] Speed -> STANDARD (2 seconds)"));
        } else {
          telemetryInterval = 1000;
          Serial.println(F("\n[CMD] Speed -> SMOOTH (1 second)"));
        }
        break;

      case 'r':
      case 'R':
        totalKWh = 0.0;
        preferences.putFloat("totalKWh", 0.0);
        lastSavedKWh = 0.0;
        Serial.println(F("\n[CMD] Energy counter reset to 0.0000 kWh."));
        break;

      case 'h':
      case 'H':
      case '?':
        Serial.println(F("\n============================================"));
        Serial.println(F("  WATTIPID Room 2 - Serial Commands"));
        Serial.println(F("============================================"));
        Serial.println(F("  [m] Toggle Simulation / Hardware mode"));
        Serial.println(F("  [s] Cycle speed (1s / 500ms / 2s)"));
        Serial.println(F("  [r] Reset energy counter"));
        Serial.println(F("  [h] Show this help"));
        Serial.println(F("============================================\n"));
        break;

      default:
        break;
    }
  }
}

// ============================================================================
// ARDUINO SETUP
// ============================================================================
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println(F("\n============================================"));
  Serial.println(F("  WATTIPID ESP32 Room 2 - Initializing"));
  Serial.println(F("============================================"));

  // Initialize OLED (SSD1306) if present
  if (display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    hasOled = true;
    display.clearDisplay();
    display.setTextColor(WHITE);
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.println("WATTIPID Room 2");
    display.println("Connecting WiFi...");
    display.display();
  } else {
    Serial.println(F("[OLED] Not detected (headless mode)"));
  }

  // Set ADC Attenuation for ESP32 analog pins
  analogSetPinAttenuation(CT_PIN, ADC_11db);
  analogSetPinAttenuation(ZMPT_PIN, ADC_11db);

  // Initialize EmonLib for SCT-013 current clamp
  emonCT.current(CT_PIN, CT_CALIBRATION);

  // Non-Volatile Storage for Cumulative Energy
  preferences.begin("wattipid_r2", false);
  totalKWh = preferences.getFloat("totalKWh", 0.0f);
  lastSavedKWh = totalKWh;
  Serial.printf("[NVS] Restored Energy: %.4f kWh\n", totalKWh);

  // Wi-Fi Connection
  Serial.print(F("[WIFI] Connecting to "));
  Serial.print(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(400);
    Serial.print(F("."));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print(F("\n[WIFI] Connected! IP: "));
    Serial.println(WiFi.localIP());
  } else {
    Serial.println(F("\n[WIFI] Timed out; will retry in background."));
  }

  lastLoopMillis = millis();
  lastSendMillis = millis() - telemetryInterval; // Send first reading immediately

  Serial.println(F("\n[READY] Type 'h' for commands."));
  Serial.println(F("  Simulation: random V * I = W each reading\n"));
}

// ============================================================================
// ARDUINO MAIN LOOP
// ============================================================================
void loop() {
  unsigned long now = millis();

  // 1. Process Serial Commands
  handleSerialCommands();

  // 2. Non-blocking Wi-Fi Reconnect
  if (WiFi.status() != WL_CONNECTED) {
    if (now - lastWifiRetryMillis >= WIFI_RETRY_INTERVAL) {
      lastWifiRetryMillis = now;
      Serial.println(F("[WIFI] Reconnecting..."));
      WiFi.disconnect();
      WiFi.reconnect();
    }
  }

  // 3. Periodic Telemetry (every telemetryInterval ms)
  if (now - lastSendMillis >= telemetryInterval) {
    lastSendMillis = now;

    // Generate readings based on mode
    if (currentMode == MODE_SIMULATION) {
      runSimulationModel();
    } else {
      // Hardware Mode: Physical Sensors
      float rawV = readHardwareVoltageRMS();
      float rawI = emonCT.calcIrms(1480);
      liveVoltage = (rawV < VOLTAGE_NOISE_GATE) ? 0.0 : rawV;
      liveCurrent = (rawI < CURRENT_NOISE_GATE) ? 0.0 : rawI;
      livePower = liveVoltage * liveCurrent;
    }

    // Energy Accumulation (kWh)
    float deltaSeconds = (now - lastLoopMillis) / 1000.0;
    if (deltaSeconds > 0.0) {
      totalKWh += (livePower * (deltaSeconds / 3600.0)) / 1000.0;
    }
    lastLoopMillis = now;

    // Print to Serial (only V, A, W, kWh)
    Serial.printf("[Room 2] V: %.1fV | A: %.3fA | W: %.1fW | kWh: %.4f\n",
                  liveVoltage, liveCurrent, livePower, totalKWh);

    // Send to API
    sendTelemetryToAPI(liveVoltage, liveCurrent, livePower, totalKWh);

    // Update OLED
    updateOledDisplay();
  }

  // NVS Energy Persistence (save periodically)
  if ((totalKWh - lastSavedKWh) >= 0.005f || (now - lastPrefSaveMillis >= 60000 && totalKWh != lastSavedKWh)) {
    preferences.putFloat("totalKWh", totalKWh);
    lastSavedKWh = totalKWh;
    lastPrefSaveMillis = now;
  }
}
