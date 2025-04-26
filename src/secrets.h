#include <pgmspace.h>

const char WIFI_SSID[] = "xxxxxx";
const char WIFI_PASSWORD[] = "xxxxxxxx";
const char AWS_IOT_ENDPOINT[] = "xxxxxxxxxxxxxx";

const char* rootCA = R"EOF(
-----BEGIN CERTIFICATE-----
xxxxxxx
-----END CERTIFICATE-----
)EOF";

const char* deviceCert = R"EOF(
-----BEGIN CERTIFICATE-----
xxxxx
-----END CERTIFICATE-----
)EOF";

const char* privateKey = R"EOF(
-----BEGIN RSA PRIVATE KEY-----
xxx
-----END RSA PRIVATE KEY-----
)EOF";
