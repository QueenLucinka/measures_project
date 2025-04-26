#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "secrets.h"

WiFiClientSecure net;
PubSubClient client(net);

#define AWS_IOT_PUBLISH_TOPIC "deviceMAC/data_pub"

unsigned long lastPublish = 0;
long sendInterval = 60000;

void messageHandler(char *topic, byte *payload, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.println(topic);

  String payloadString;
  for (unsigned int i = 0; i < length; i++) {
    payloadString += (char)payload[i];
  }
  Serial.println("Payload: " + payloadString);
}

void connectAWS() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  Serial.print("Connecting to Wi-Fi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }
  Serial.println("Connected to Wi-Fi!");

  net.setCACert(rootCA);
  net.setCertificate(deviceCert);
  net.setPrivateKey(privateKey);

  client.setServer(AWS_IOT_ENDPOINT, 8883);
  client.setCallback(messageHandler);

  Serial.print("Connecting to AWS IoT Core...");
  while (!client.connected()) {
    if (client.connect("deviceMAC")) {
      Serial.println("Connected to AWS IoT Core!");
    } else {
      Serial.print("Failed, MQTT state: ");
      Serial.println(client.state());
      delay(5000);
    }
  }
}

void publishRandomTelemetry() {
  float randomTemperature = random(20, 35) + random(0, 100) / 100.0;
  float randomHumidity = random(30, 70) + random(0, 100) / 100.0;

  StaticJsonDocument<256> jsonDoc;
  jsonDoc["device_id"] = "deviceMAC";
  jsonDoc["temperature"] = randomTemperature;
  jsonDoc["humidity"] = randomHumidity;
  jsonDoc["timestamp"] = millis();

  char jsonBuffer[256];
  serializeJson(jsonDoc, jsonBuffer);

  if (client.publish(AWS_IOT_PUBLISH_TOPIC, jsonBuffer)) {
    Serial.println("Telemetry published:");
    Serial.println(jsonBuffer);
  } else {
    Serial.println("Failed to publish telemetry.");
  }
}

void setup() {
  Serial.begin(115200);
  connectAWS();
}

void loop() {
  if (!client.connected()) {
    connectAWS();
  }

  client.loop();

  unsigned long currentMillis = millis();
  if (currentMillis - lastPublish > sendInterval) {
    lastPublish = currentMillis;
    publishRandomTelemetry();
  }
}
