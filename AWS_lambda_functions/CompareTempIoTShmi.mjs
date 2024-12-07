// This AWS Lambda function compares temperatures from two data sources:
// 1. IoT device data (from 'iot-data/' folder in S3)
// 2. SHMI weather data (from 'shmi-data/' folder in S3)
// The function performs basic authentication, fetches both data sources, 
// compares the IoT temperature data with the latest SMHI temperature data, 
// and returns the differences in temperature.

import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3 client using environment variables for region and bucket name
const s3Client = new S3Client({ region: process.env.aws_region });
const bucketName = process.env.s3_bucket_name;

/**
 * Lambda function handler for comparing IoT and SHMI data.
 * 
 * @param {Object} event - Event data passed by AWS Lambda (e.g., API Gateway request).
 * @returns {Object} - Response object containing comparison results or an error.
 */
export const handler = async (event) => {
  // Basic Authentication: Verify that the request includes valid credentials.
  const authHeader = event.headers?.Authorization || event.headers?.authorization;

  // If no Authorization header or invalid header, return 401 Unauthorized
  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized: Missing or invalid Authorization header" }),
    };
  }

  // Decode the Authorization header to extract the username and password
  const base64Credentials = authHeader.split(" ")[1];
  const decodedCredentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
  const [username, password] = decodedCredentials.split(":");

  // Fetch the allowed credentials from environment variables
  const allowedUser = process.env.allowedUser;
  const allowedPassword = process.env.allowedPassword;

  // If credentials do not match, return 403 Forbidden
  if (username !== allowedUser || password !== allowedPassword) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "Forbidden: Invalid credentials" }),
    };
  }

  try {
    console.log("Starting comparison function...");

    // Fetch IoT and SHMI data from S3
    const iotData = await fetchS3Data("iot-data/");
    const smhiData = await fetchS3Data("shmi-data/");

    console.log("Fetched IoT Data:", iotData);
    console.log("Fetched SMHI Data:", smhiData);

    // Get the latest SMHI data point based on the timestamp
    const latestSmhiData = smhiData.reduce((latest, current) => {
      const currentTimestamp = normalizeTimestamp(current.timestamp);
      return currentTimestamp > normalizeTimestamp(latest.timestamp) ? current : latest;
    }, smhiData[0]);

    console.log("Latest SMHI Data:", latestSmhiData);

    // Compare all IoT data with the latest SMHI data point
    const comparisons = iotData.map((iotRecord) => ({
      timestamp: iotRecord.timestamp,
      iotTemperature: iotRecord.temperature,
      smhiTemperature: latestSmhiData ? latestSmhiData.temperature : null,
      difference: latestSmhiData ? iotRecord.temperature - latestSmhiData.temperature : null,
    }));

    // Return comparison results as JSON response
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(comparisons),
    };
  } catch (error) {
    // Handle any errors that occur during the comparison process
    console.error("Error in comparison function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Unexpected error occurred", details: error.message }),
    };
  }
};

/**
 * Fetches all data from the specified S3 prefix (folder).
 * 
 * @param {string} prefix - The S3 prefix (e.g., 'iot-data/' or 'shmi-data/').
 * @returns {Array} - An array of JSON objects containing data from S3.
 */
const fetchS3Data = async (prefix) => {
  const data = [];
  const listCommand = new ListObjectsV2Command({ Bucket: bucketName, Prefix: prefix });
  const response = await s3Client.send(listCommand);

  // If no objects are found in the specified prefix, return an empty array
  if (!response.Contents || response.Contents.length === 0) {
    console.log(`No objects found in prefix: ${prefix}`);
    return data;
  }

  // Fetch each object from the list and parse the JSON data
  for (const object of response.Contents) {
    try {
      const command = new GetObjectCommand({ Bucket: bucketName, Key: object.Key });
      const getObjectResponse = await s3Client.send(command);
      const bodyString = await streamToString(getObjectResponse.Body);
      data.push(JSON.parse(bodyString));
    } catch (err) {
      console.error(`Error fetching object ${object.Key}:`, err.message);
    }
  }
  return data;
};

/**
 * Normalizes timestamps by converting to milliseconds if necessary.
 * If the timestamp is in seconds, it is multiplied by 1000 to convert it to milliseconds.
 * 
 * @param {number} timestamp - The timestamp to normalize (either in seconds or milliseconds).
 * @returns {number} - The normalized timestamp in milliseconds.
 */
const normalizeTimestamp = (timestamp) => {
  // If the timestamp is in seconds (10 digits), multiply by 1000 to convert to milliseconds
  return timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
};

/**
 * Converts a stream to a string.
 * 
 * @param {Stream} stream - The input stream (from S3 object).
 * @returns {Promise<string>} - A Promise resolving to the string representation of the stream.
 */
const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    stream.on("error", reject);
  });
