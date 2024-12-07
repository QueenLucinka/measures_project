#include <pgmspace.h>  // Include pgmspace for storing data in program memory (useful for large constants like certificates)

/**
 * This file contains sensitive credentials for connecting to Wi-Fi and AWS IoT Core.
 * It should not be included in public repositories to ensure security.
 * The values of Wi-Fi credentials, AWS IoT endpoint, and certificates are replaced with placeholders.
 * Replace them with actual credentials before deploying the code.
 */

// Wi-Fi credentials (used to connect to the local Wi-Fi network)
const char WIFI_SSID[] = "xxxxxx"; // Replace with your Wi-Fi SSID (network name)
const char WIFI_PASSWORD[] = "xxxxxxxx"; // Replace with your Wi-Fi password

// AWS IoT Core credentials (used for secure communication with AWS IoT Core service)
const char AWS_IOT_ENDPOINT[] = "xxxxxxxxxxxxxx"; // Replace with your AWS IoT endpoint (you can find this in the AWS IoT console)


// AWS IoT Core certificates (these certificates are needed to establish secure communication between the device and AWS IoT Core)
// These certificates are typically provided when you create a "Thing" in AWS IoT Core and download the associated credentials.

// Root Certificate Authority (CA) for validating the identity of AWS IoT Core
const char* rootCA = R"EOF(
-----BEGIN CERTIFICATE-----
xxxxxxx
-----END CERTIFICATE-----
)EOF";  // Replace the placeholder with the actual root certificate of AWS IoT Core

// Device Certificate: This is the public certificate for your device (the "Thing" in AWS IoT)
const char* deviceCert = R"EOF(
-----BEGIN CERTIFICATE-----
xxxxx
-----END CERTIFICATE-----
)EOF";  // Replace the placeholder with the actual device certificate

// Private Key for the device: Used for encrypting the communication between the device and AWS IoT Core
const char* privateKey = R"EOF(
-----BEGIN RSA PRIVATE KEY-----
xxx
-----END RSA PRIVATE KEY-----
)EOF";  // Replace the placeholder with the actual private key for your device
