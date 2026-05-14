// --- WATTIPID ESP32 HARDWARE SOURCE ---
// Place this code in your Arduino IDE
// Folder: hardware/esp32_monitor/esp32_monitor.ino

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "EmonLib.h"

// --- CONFIGURATION ---
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* serverUrl = "http://192.168.254.109/wattipid_backend/api.php";
const char* roomId = "Room 1";

// --- SENSORS & DISPLAY ---
EnergyMonitor emon1; 
Adafruit_SSD1306 display(128, 64, &Wire, -1);
float totalKWh = 0;
unsigned long lastMillis = 0;

void setup() {
  Serial.begin(115200);
  
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) { 
    Serial.println(F("OLED failed"));
  }
  display.clearDisplay();
  display.setTextColor(WHITE);
  
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  emon1.voltage(34, 234.26, 1.7); 
  emon1.current(35, 60.6); 
}

void loop() {
  emon1.calcVI(20, 2000); 
  
  float voltage = emon1.Vrms;
  float current = emon1.Irms;
  float power   = emon1.apparentPower;
  
  unsigned long now = millis();
  float seconds = (now - lastMillis) / 1000.0;
  totalKWh += (power * (seconds / 3600.0)) / 1000.0;
  lastMillis = now;

  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0,0);
  display.print("WATTIPID: "); display.println(roomId);
  display.drawLine(0, 12, 128, 12, WHITE);
  
  display.setCursor(0, 20);
  display.printf("V: %.1fV  A: %.2fA\n", voltage, current);
  display.printf("P: %.1fW\n", power);
  display.printf("E: %.4fkWh", totalKWh);
  display.display();

  if (now - lastMillis >= 5000) { 
    sendToApp(voltage, current, power, totalKWh);
  }
  
  delay(500);
}

void sendToApp(float v, float i, float p, float e) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    JsonDocument doc; 
    doc["action"] = "logConsumption";
    doc["roomId"] = roomId;
    doc["voltage"] = v;
    doc["current"] = i;
    doc["power"] = p;
    doc["energy"] = e;

    String requestBody;
    serializeJson(doc, requestBody);
    
    int httpResponseCode = http.POST(requestBody);
    Serial.print("API Result: "); Serial.println(httpResponseCode);
    http.end();
  }
}
