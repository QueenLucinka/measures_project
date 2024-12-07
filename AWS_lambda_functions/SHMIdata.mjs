// This AWS Lambda function fetches weather data from the SMHI API and writes the data to an S3 bucket.
// The function retrieves the latest weather data (temperature) from a specific station and stores it in the S3 bucket.

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Initialize the S3 client using the AWS region provided in environment variables
const s3Client = new S3Client({ region: process.env.aws_region });
const bucketName = process.env.s3_bucket_name; // S3 bucket name from environment variables

/**
 * Lambda function handler that fetches data from the SMHI API and writes it to an S3 bucket.
 * 
 * @param {Object} event - The event data passed by AWS Lambda (e.g., API Gateway request).
 * @returns {Object} - A response object indicating success or failure.
 */
export const handler = async (event) => {
  try {
    // Define the SMHI API URL to fetch the latest weather data for a specific station
    const apiUrl = "https://opendata-download-metobs.smhi.se/api/version/latest/parameter/1/station/72420/period/latest-hour/data.json";
    
    // Fetch the data from the SMHI API using the built-in fetch function
    const response = await fetch(apiUrl);

    // If the API response is not OK, log an error and return a 500 response
    if (!response.ok) {
      console.error(`Failed to fetch data from SMHI API: ${response.statusText}`);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to fetch data from SMHI API" }),
      };
    }

    // Parse the JSON response from the SMHI API
    const rJson = await response.json();

    // Validate the response data to ensure it contains valid information
    if (!rJson || !rJson.value || rJson.value.length === 0) {
      console.error("Invalid or empty data from SMHI API");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Invalid or empty data from SMHI API" }),
      };
    }

    // Extract the relevant temperature data and other properties
    const timestamp = new Date(rJson.value[0].date).getTime(); // Convert date to timestamp (milliseconds)
    const smhiData = {
      device_id: `SMHI-${rJson.station.key}`, // Assign a device ID using the station key
      temperature: parseFloat(rJson.value[0].value), // Parse temperature as a float
      humidity: null, // No humidity data available in the current API response
      timestamp: timestamp, // Timestamp of the recorded data
      location: rJson.station.name, // Location name of the station
    };

    // Define the object key (path) for the data file in S3
    const objectKey = `shmi-data/${rJson.station.key}/${timestamp}.json`;

    // Upload the SMHI data to the S3 bucket
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey, // Set the S3 object key
        Body: JSON.stringify(smhiData), // Convert data to JSON and send it as the body
        ContentType: "application/json", // Set the content type to JSON
      })
    );

    // Log success and return a response indicating that the data was successfully written to S3
    console.log(`SMHI data successfully written to S3: ${objectKey}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "SMHI data successfully written to S3",
        key: objectKey, // Return the key of the uploaded object
      }),
    };
  } catch (error) {
    // Handle any unexpected errors during the execution
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Unexpected error occurred" }),
    };
  }
};
