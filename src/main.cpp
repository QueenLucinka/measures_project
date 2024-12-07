#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "secrets.h"

// Initialize secure Wi-Fi client and MQTT client
WiFiClientSecure net;  // Secure Wi-Fi client for AWS IoT communication
PubSubClient client(net); // MQTT client for publishing data to AWS IoT Core

// MQTT Topic for publishing device data
#define AWS_IOT_PUBLISH_TOPIC "deviceMAC/data_pub"

// Timer for controlling the frequency of data publishing
unsigned long lastPublish = 0;  // Last time data was published
long sendInterval = 60000; // Publish every 60 seconds (default)

// MQTT Callback Function to handle incoming messages (not used in this example but required for setup)
void messageHandler(char *topic, byte *payload, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.println(topic);

  // Convert payload to string for debugging purposes
  String payloadString;
  for (unsigned int i = 0; i < length; i++) {
    payloadString += (char)payload[i];
  }
  Serial.println("Payload: " + payloadString);
}

/**
 * Function to connect to Wi-Fi and AWS IoT Core.
 * - Establishes Wi-Fi connection
 * - Configures MQTT client with certificates
 * - Connects to AWS IoT Core with secure MQTT protocol (TLS/SSL)
 */
void connectAWS() {
  WiFi.mode(WIFI_STA); // Set Wi-Fi mode to Station (client mode)
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD); // Start Wi-Fi connection using credentials from secrets.h

  // Wait for Wi-Fi connection
  Serial.print("Connecting to Wi-Fi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000); // Delay 1 second before checking again
    Serial.print(".");
  }
  Serial.println("Connected to Wi-Fi!");

  // Configure MQTT client to use the proper security certificates for TLS
  net.setCACert(rootCA);          // Set the CA certificate (root certificate)
  net.setCertificate(deviceCert); // Set the device certificate
  net.setPrivateKey(privateKey);  // Set the device private key

  client.setServer(AWS_IOT_ENDPOINT, 8883);  // Set the AWS IoT Core endpoint and port
  client.setCallback(messageHandler);  // Set the callback for incoming MQTT messages

  // Connect to AWS IoT Core using MQTT
  Serial.print("Connecting to AWS IoT Core...");
  while (!client.connected()) {
    // Try to connect with a client ID based on the device's MAC address or unique name
    if (client.connect("deviceMAC")) {
      Serial.println("Connected to AWS IoT Core!");
    } else {
      // If connection fails, print the error state and retry after 5 seconds
      Serial.print("Failed, MQTT state: ");
      Serial.println(client.state());
      delay(5000);
    }
  }
}

/**
 * Function to simulate and publish telemetry data (temperature and humidity) to AWS IoT Core.
 * - Simulates random temperature and humidity values
 * - Creates a JSON object with the data and timestamp
 * - Publishes the data to the specified MQTT topic
 */
void publishRandomTelemetry() {
  // Simulate temperature and humidity values in a realistic range
  float randomTemperature = random(20, 35) + random(0, 100) / 100.0;  // Random temperature between 20.00 and 35.99
  float randomHumidity = random(30, 70) + random(0, 100) / 100.0;     // Random humidity between 30.00% and 70.99%

  // Create a JSON document to store telemetry data
  StaticJsonDocument<256> jsonDoc;
  jsonDoc["device_id"] = "deviceMAC";        // Add device ID
  jsonDoc["temperature"] = randomTemperature; // Add simulated temperature data
  jsonDoc["humidity"] = randomHumidity;      // Add simulated humidity data
  jsonDoc["timestamp"] = millis();           // Add the current timestamp (in milliseconds since the device started)

  // Serialize the JSON document to a string buffer
  char jsonBuffer[256];
  serializeJson(jsonDoc, jsonBuffer);

  // Publish the telemetry data to AWS IoT Core MQTT topic
  if (client.publish(AWS_IOT_PUBLISH_TOPIC, jsonBuffer)) {
    // If publishing is successful, print the message to Serial Monitor
    Serial.println("Telemetry published:");
    Serial.println(jsonBuffer);
  } else {
    // If publishing fails, print an error message
    Serial.println("Failed to publish telemetry.");
  }
}

void setup() {
  Serial.begin(115200);  // Initialize serial communication for debugging

  connectAWS(); // Connect to Wi-Fi and AWS IoT Core
}

void loop() {
  // Check if the MQTT client is still connected
  if (!client.connected()) {
    connectAWS(); // Reconnect if disconnected
  }

  client.loop(); // Keep the MQTT client active and handle any incoming messages

  unsigned long currentMillis = millis();  // Get the current time (milliseconds since device started)

  // Publish telemetry data at the specified interval (e.g., every 60 seconds)
  if (currentMillis - lastPublish > sendInterval) {
    lastPublish = currentMillis;  // Update the last published timestamp
    publishRandomTelemetry();     // Call the function to publish new telemetry data
  }
}
