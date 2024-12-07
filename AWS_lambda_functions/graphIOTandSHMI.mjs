// This AWS Lambda function is designed to be used with a React app.
// It fetches IoT and SMHI temperature data from S3, normalizes the SHMI timestamps,
// combines both datasets, and returns the combined data for visualization.

import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

// Initialize S3 client using environment variables for region and bucket name
const s3Client = new S3Client({ region: process.env.aws_region });
const bucketName = process.env.s3_bucket_name;

/**
 * Helper function to convert S3 object data (stream) to a string.
 * This is required to read the contents of the S3 object before parsing it.
 * 
 * @param {Stream} stream - The input stream (from an S3 object).
 * @returns {Promise<string>} - A Promise resolving to the string representation of the stream.
 */
const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    stream.on("error", reject);
  });

/**
 * Fetches data from a specific S3 prefix (folder).
 * This function lists all objects in the given prefix, retrieves each object, 
 * and parses the contents as JSON.
 * 
 * @param {string} prefix - The S3 prefix (folder name, e.g., 'iot-data/' or 'shmi-data/').
 * @returns {Array} - An array of parsed JSON objects from S3.
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
      data.push(JSON.parse(bodyString)); // Assuming the objects are JSON
    } catch (err) {
      console.error(`Error fetching object ${object.Key}:`, err.message);
    }
  }
  return data;
};

/**
 * Lambda function handler that fetches and combines IoT and SMHI data.
 * The function:
 * - Fetches IoT data from 'iot-data/' prefix and SHMI data from 'shmi-data/' prefix.
 * - Normalizes SHMI timestamps to seconds.
 * - Combines the IoT data with the SHMI data based on matching positions (indexes).
 * 
 * @param {Object} event - Event data passed by AWS Lambda (e.g., API Gateway request).
 * @returns {Object} - Response object containing the combined data or an error message.
 */
export const handler = async (event) => {
  const origin = event.headers?.origin || "*"; // Dynamic CORS origin for frontend requests

  try {
    // Fetch IoT and SMHI data from S3
    const iotData = await fetchS3Data("iot-data/");
    const smhiData = await fetchS3Data("shmi-data/");

    console.log("Fetched IoT Data:", iotData);
    console.log("Fetched SMHI Data:", smhiData);

    // Normalize SHMI timestamps to seconds (SHMI timestamps are in milliseconds)
    const normalizedSmhiData = smhiData.map((record) => ({
      ...record,
      timestamp: Math.floor(record.timestamp / 1000), // Convert milliseconds to seconds
    }));

    // Combine IoT data with normalized SHMI data based on their respective positions (indexes)
    const combinedData = iotData.map((iotRecord, index) => {
      const smhiRecord = normalizedSmhiData[index]; // Match IoT and SMHI data by index
      console.log(`IoT Record: ${iotRecord}, SMHI Record: ${smhiRecord}`);
      return {
        timestamp: iotRecord.timestamp,
        iotTemperature: iotRecord.temperature,
        smhiTemperature: smhiRecord ? smhiRecord.temperature : null,
      };
    });

    console.log("Combined Data:", combinedData);

    // Return the combined data as a JSON response
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": origin, // Allow cross-origin requests
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
      body: JSON.stringify(combinedData), // Return combined data in the response body
    };
  } catch (error) {
    // Handle any errors that occur during the fetching or processing of data
    console.error("Error fetching or processing data:", error);
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
      body: JSON.stringify({ error: "Failed to process data", details: error.message }),
    };
  }
};
