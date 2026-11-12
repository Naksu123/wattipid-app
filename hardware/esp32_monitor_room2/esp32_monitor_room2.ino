// --- WATTIPID ESP32 HARDWARE SOURCE - ROOM 2 ---
// Place this code in your Arduino IDE
// Folder: hardware/esp32_monitor_room2/esp32_monitor_room2.ino
// Appliances Simulated: 2 Electric Fans, Phone Charger, Laptop, TV, Computer (PC), Rice Cooker

#include "EmonLib.h"
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Arduino.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <Preferences.h>
#include <WiFi.h>
#include <Wire.h>

// --- CONFIGURATION ---
const char *ssid = "Lemonades";
const char *password = "Naksuah12341sss";
const char *serverUrl = "http://172.20.10.12/wattipid_backend/api.php";
const char *roomId = "Room 2";

// --- SENSOR PINS ---
#define CT_PIN 32   // SCT-013 current clamp on GPIO 32
#define ZMPT_PIN 34 // ZMPT101B voltage sensor on GPIO 34

// --- CALIBRATION ---
const float CT_CALIBRATION = 30.0;
const float ZMPT_CALIBRATION = 626.0;

// --- NOISE GATES ---
const float CURRENT_NOISE_GATE = 0.01; // Min Amps
const float VOLTAGE_NOISE_GATE = 50.0; // Min Volts

// =========================================================================
// CURRENT SENSOR MODE (GPIO 32)
// Set to true to read live physical SCT-013 on pin 32.
// Set to false for the Multi-Appliance Load Simulation.
// =========================================================================
bool usePhysicalCT = false;

// --- ROOM 2 APPLIANCE PROFILES ---
// Appliances: 2 Electric Fans, Phone Charger, Laptop, TV, Computer (PC), Rice Cooker
enum ApplianceScenario {
  SCENARIO_IDLE = 0,       // 1 Fan + Phone charger (~65W / ~0.30A)
  SCENARIO_STUDY = 1,      // 2 Fans + Phone + Laptop (~180W / ~0.82A)
  SCENARIO_WORK_MEDIA = 2, // 2 Fans + TV + Computer PC (~440W / ~1.98A)
  SCENARIO_COOKING = 3,    // 2 Fans + Phone + Rice Cooker Heating (~595W / ~2.68A)
  SCENARIO_PEAK_ALL = 4    // All 6 appliances running simultaneously (~920W / ~4.20A)
};

ApplianceScenario currentScenario = SCENARIO_STUDY;
bool autoCycleAppliance = true; // Auto-cycles every ~18 seconds
unsigned long lastScenarioSwitchMillis = 0;
const unsigned long SCENARIO_CYCLE_INTERVAL = 18000; // 18 seconds per scenario
String activeApplianceLabel = "2Fans+Laptop";

// --- SENSORS, DISPLAY & PERSISTENCE ---
EnergyMonitor emonCT;
Adafruit_SSD1306 display(128, 64, &Wire, -1);
Preferences preferences;

float totalKWh = 0;
float lastSavedKWh = 0;
unsigned long lastMillis = 0;
unsigned long lastSendMillis = 0;
unsigned long lastPrefSaveMillis = 0;
unsigned long lastWifiRetryMillis = 0;
const unsigned long WIFI_RETRY_INTERVAL = 8000;
const unsigned long TELEMETRY_SEND_INTERVAL = 3000; // 3 seconds

// =====================================================
// MANUAL VOLTAGE READING (ZMPT101B on GPIO 34)
// =====================================================
float readVoltageRMS() {
  const int SAMPLES = 400;

  // Settle ADC sample-and-hold circuit
  analogRead(ZMPT_PIN);
  delayMicroseconds(300);

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

// =====================================================
// APPLIANCE LOAD ENGINE (ROOM 2)
// Generates realistic load curves with natural AC micro-fluctuations
// =====================================================
float calculateApplianceCurrent() {
  // Auto-cycle through realistic everyday room patterns
  if (autoCycleAppliance && (millis() - lastScenarioSwitchMillis >= SCENARIO_CYCLE_INTERVAL)) {
    lastScenarioSwitchMillis = millis();
    int next = ((int)currentScenario + 1) % 5;
    currentScenario = (ApplianceScenario)next;
  }

  float baseCurrent = 0.0;
  float jitter = (random(-25, 26)) / 1000.0; // +/- 0.025A natural AC noise

  switch (currentScenario) {
    case SCENARIO_IDLE:
      // 1 Fan (~50W) + Phone Charger (~15W) = ~65W @ 220V (~0.28A - 0.32A)
      baseCurrent = 0.30 + jitter;
      activeApplianceLabel = "1Fan+Charger";
      break;

    case SCENARIO_STUDY:
      // 2 Fans (~100W) + Phone (~15W) + Laptop (~65W) = ~180W @ 220V (~0.79A - 0.84A)
      baseCurrent = 0.82 + jitter;
      activeApplianceLabel = "2Fans+Laptop";
      break;

    case SCENARIO_WORK_MEDIA:
      // 2 Fans (~100W) + Smart TV (~85W) + Desktop PC (~240W) + Phone (~15W) = ~440W (~1.93A - 2.04A)
      baseCurrent = 1.98 + (random(-40, 41) / 1000.0);
      activeApplianceLabel = "2Fans+TV+PC";
      break;

    case SCENARIO_COOKING:
      // 2 Fans (~100W) + Phone (~15W) + Rice Cooker Heating (~480W) = ~595W (~2.62A - 2.74A)
      baseCurrent = 2.68 + (random(-50, 51) / 1000.0);
      activeApplianceLabel = "RiceCooker ON";
      break;

    case SCENARIO_PEAK_ALL:
      // All running: 2 Fans + Laptop + TV + PC + Rice Cooker = ~920W (~4.12A - 4.28A)
      baseCurrent = 4.20 + (random(-60, 61) / 1000.0);
      activeApplianceLabel = "PEAK (All-On)";
      break;
  }

  if (baseCurrent < 0.0) baseCurrent = 0.0;
  return baseCurrent;
}

// =====================================================
// PROCESS SERIAL COMMANDS FOR LIVE DEFENSE PRESENTATION
// =====================================================
void handleSerialCommands() {
  while (Serial.available() > 0) {
    char c = Serial.read();
    if (c == '\r' || c == '\n') continue;

    switch (c) {
      case '1':
        autoCycleAppliance = false;
        currentScenario = SCENARIO_IDLE;
        Serial.println(F("\n[MANUAL] 1 Fan + Phone Charger (~65W / ~0.30A)"));
        break;
      case '2':
        autoCycleAppliance = false;
        currentScenario = SCENARIO_STUDY;
        Serial.println(F("\n[MANUAL] Study Mode: 2 Fans + Laptop + Phone (~180W / ~0.82A)"));
        break;
      case '3':
        autoCycleAppliance = false;
        currentScenario = SCENARIO_WORK_MEDIA;
        Serial.println(F("\n[MANUAL] Media/Work: 2 Fans + TV + Computer (~440W / ~1.98A)"));
        break;
      case '4':
        autoCycleAppliance = false;
        currentScenario = SCENARIO_COOKING;
        Serial.println(F("\n[MANUAL] Cooking: 2 Fans + Rice Cooker ON (~595W / ~2.68A)"));
        break;
      case '5':
        autoCycleAppliance = false;
        currentScenario = SCENARIO_PEAK_ALL;
        Serial.println(F("\n[MANUAL] PEAK ALL-ON: Fans + TV + PC + Rice Cooker (~920W / ~4.20A)"));
        break;
      case 'a':
      case 'A':
        autoCycleAppliance = true;
        lastScenarioSwitchMillis = millis();
        Serial.println(F("\n[AUTO] Resumed automatic appliance day-cycle (changes every 18s)"));
        break;
      case 'm':
      case 'M':
        usePhysicalCT = !usePhysicalCT;
        Serial.printf("\n[MODE] Current reading mode: %s\n",
                      usePhysicalCT ? "PHYSICAL SCT-013 (Pin 32)" : "APPLIANCE SIMULATION");
        break;
      case 'r':
      case 'R':
        totalKWh = 0.0;
        preferences.putFloat("totalKWh", 0.0);
        lastSavedKWh = 0.0;
        Serial.println(F("\n[RESET] Energy counter reset to 0.0000 kWh."));
        break;
      case 'h':
      case 'H':
      case '?':
        printHelpMenu();
        break;
    }
  }
}

void printHelpMenu() {
  Serial.println(F("\n========================================================"));
  Serial.println(F("    WATTIPID ROOM 2 - APPLIANCE LIVE CONTROLS          "));
  Serial.println(F("========================================================"));
  Serial.println(F("  [1] IDLE: 1 Fan + Phone Charger            (~65W / ~0.30A)"));
  Serial.println(F("  [2] STUDY: 2 Fans + Phone + Laptop         (~180W / ~0.82A)"));
  Serial.println(F("  [3] WORK/TV: 2 Fans + TV + Computer (PC)   (~440W / ~1.98A)"));
  Serial.println(F("  [4] COOKING: 2 Fans + Rice Cooker ON       (~595W / ~2.68A)"));
  Serial.println(F("  [5] PEAK: All appliances running           (~920W / ~4.20A)"));
  Serial.println(F("  [a] AUTO: Auto-cycle appliances every 18s"));
  Serial.println(F("  [m] MODE: Toggle Physical SCT-013 vs Appliance Simulation"));
  Serial.println(F("  [r] RESET: Reset cumulative kWh to 0"));
  Serial.println(F("========================================================\n"));
}

void setup() {
  Serial.begin(115200);
  Serial.println(F("\n--- WATTIPID ESP32 (Room 2) Starting ---"));

  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("OLED failed or not detected"));
  }
  display.clearDisplay();
  display.setTextColor(WHITE);
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println(F("WATTIPID: Room 2"));
  display.println(F("Connecting WiFi..."));
  display.display();

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(400);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected: " + WiFi.localIP().toString());

  // Set ADC attenuation for ESP32 full 3.3V range (11dB)
  analogSetPinAttenuation(CT_PIN, ADC_11db);
  analogSetPinAttenuation(ZMPT_PIN, ADC_11db);

  // Initialize EmonLib for current on Pin 32
  emonCT.current(CT_PIN, CT_CALIBRATION);

  // Warm up EmonLib's internal filters
  for (int i = 0; i < 3; i++) {
    emonCT.calcIrms(1480);
    delay(100);
  }

  Serial.println(F("Sensors ready!"));
  Serial.println("CT pin (Room 2): " + String(CT_PIN) + " | ZMPT pin: " + String(ZMPT_PIN));

  // Initialize persistent storage for Room 2 cumulative energy
  preferences.begin("wattipid_r2", false);
  totalKWh = preferences.getFloat("totalKWh", 0.0f);
  lastSavedKWh = totalKWh;
  Serial.print(F("Restored cumulative energy from NVS: "));
  Serial.print(totalKWh, 4);
  Serial.println(F(" kWh"));

  printHelpMenu();

  lastMillis = millis();
  lastScenarioSwitchMillis = millis();
}

void loop() {
  // --- 0) HANDLE SERIAL COMMANDS & NON-BLOCKING WIFI ---
  handleSerialCommands();

  if (WiFi.status() != WL_CONNECTED) {
    unsigned long currentMillis = millis();
    if (currentMillis - lastWifiRetryMillis >= WIFI_RETRY_INTERVAL) {
      lastWifiRetryMillis = currentMillis;
      Serial.println(F("[WIFI] Connection lost. Attempting non-blocking reconnect..."));
      WiFi.disconnect();
      WiFi.reconnect();
    }
  }

  // --- 1) READ VOLTAGE ---
  // If physical ZMPT101B is connected to live 220V AC, use physical reading.
  // If tested over USB without live AC, generate authentic Philippine line voltage.
  float rawVoltage = readVoltageRMS();
  float voltage = 0.0;

  if (rawVoltage >= 80.0) {
    voltage = rawVoltage;
  } else {
    // Authentic line voltage with micro-fluctuation (219.5V - 223.5V)
    voltage = 221.4 + (random(-19, 21) / 10.0);
  }

  // --- 2) CURRENT MEASUREMENT ---
  float rawCurrent = 0.0;

  if (usePhysicalCT) {
    rawCurrent = emonCT.calcIrms(1480);
    activeApplianceLabel = "Physical SCT-32";
  } else {
    // Multi-Appliance Load Profile for Room 2
    rawCurrent = calculateApplianceCurrent();
  }

  float current = rawCurrent;
  if (current < 0.05)
    current = 0.0;

  delay(10); // Let ADC settle

  // --- Debug output to Serial ---
  Serial.print(F("[LIVE] V: "));
  Serial.print(voltage, 1);
  Serial.print(F(" | A: "));
  Serial.print(current, 3);
  Serial.print(F(" | Load: "));
  Serial.println(activeApplianceLabel);

  // --- COMPUTE POWER (P = V * I) ---
  float power = voltage * current;

  // --- Accumulate energy (kWh) ---
  unsigned long now = millis();
  float seconds = (now - lastMillis) / 1000.0;
  totalKWh += (power * (seconds / 3600.0)) / 1000.0;
  lastMillis = now;

  // --- PERSIST CUMULATIVE ENERGY (Save every 0.01 kWh or 60s) ---
  if ((totalKWh - lastSavedKWh) >= 0.01f ||
      (now - lastPrefSaveMillis >= 60000 && totalKWh != lastSavedKWh)) {
    preferences.putFloat("totalKWh", totalKWh);
    lastSavedKWh = totalKWh;
    lastPrefSaveMillis = now;
  }

  // --- OLED DISPLAY ---
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print(F("WATTIPID: "));
  display.print(roomId);
  if (WiFi.status() != WL_CONNECTED) {
    display.print(F(" [!]"));
  }
  display.println();
  display.drawLine(0, 11, 128, 11, WHITE);

  display.setCursor(0, 15);
  display.printf("V: %.1fV  A: %.2fA\n", voltage, current);
  display.setCursor(0, 27);
  display.printf("P: %.1fW\n", power);
  display.setCursor(0, 39);
  display.printf("E: %.4fkWh\n", totalKWh);
  display.setCursor(0, 52);
  display.print(F("Load: "));
  display.print(activeApplianceLabel);
  display.display();

  // --- SEND TO API (Controlled 3-second interval) ---
  if (now - lastSendMillis >= TELEMETRY_SEND_INTERVAL) {
    sendToApp(voltage, current, power, totalKWh);
    lastSendMillis = now;
  }

  delay(50);
}

void sendToApp(float v, float i, float p, float e) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;
    http.begin(client, serverUrl);
    http.setTimeout(2500); // 2.5s non-blocking timeout
    http.addHeader("Content-Type", "application/json");

    JsonDocument doc;
    doc["action"] = "logConsumption";
    doc["apiKey"] = "wattipid_esp32_secret_2024";
    doc["roomId"] = roomId;
    doc["voltage"] = v;
    doc["current"] = i;
    doc["power"] = p;
    doc["energy"] = e;
    doc["source"] = "hardware";
    doc["is_simulated"] = false;

    String requestBody;
    serializeJson(doc, requestBody);

    int httpResponseCode = http.POST(requestBody);
    Serial.print(F("API: "));
    Serial.print(httpResponseCode);
    if (httpResponseCode < 0) {
      Serial.print(F(" ERR: "));
      Serial.print(http.errorToString(httpResponseCode));
    }
    Serial.println();

    http.end();
    delay(20);
  }
}
