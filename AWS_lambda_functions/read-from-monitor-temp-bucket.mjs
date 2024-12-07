// This AWS Lambda function shows data from an S3 bucket. 
// It requires basic authentication (username and password) which must be provided in the request headers.
// The function fetches data from S3 and returns it after verifying the user's credentials.

import { S3Client, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

// Initialize the S3 client with the region provided in environment variables
const s3Client = new S3Client({ region: process.env.aws_region });

/**
 * Lambda function handler to authenticate and fetch data from the S3 bucket.
 * 
 * @param {Object} event - Event data passed by AWS Lambda (e.g., API Gateway request).
 * @returns {Object} - Response object with either the requested data or an error message.
 */
export const handler = async (event) => {
    const bucketName = process.env.s3_bucket_name; // Retrieve S3 bucket name from environment variables
    const validUsername = process.env.basic_auth_username; // Retrieve valid username from environment variables
    const validPassword = process.env.basic_auth_password; // Retrieve valid password from environment variables

    // Validate the Authorization header (Basic Authentication)
    const authHeader = event.headers["authorization"];
    
    // If no Authorization header or invalid header, return 401 Unauthorized
    if (!authHeader || !authHeader.startsWith("Basic ")) {
        return {
            statusCode: 401,
            headers: { "WWW-Authenticate": 'Basic realm="Restricted"' },
            body: JSON.stringify({ error: "Unauthorized: Missing or invalid Authorization header" }),
        };
    }

    // Decode the Base64-encoded credentials (username and password)
    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8"); // Decode Base64
    const [username, password] = credentials.split(":"); // Split the decoded credentials into username and password

    // Validate the decoded username and password
    if (username !== validUsername || password !== validPassword) {
        return {
            statusCode: 403,
            body: JSON.stringify({ error: "Forbidden: Invalid username or password" }),
        };
    }

    // If authentication is successful, proceed with fetching data from S3
    try {
        // List all objects in the specified S3 bucket
        const listCommand = new ListObjectsV2Command({ Bucket: bucketName });
        const listResponse = await s3Client.send(listCommand);

        // If no objects are found in the S3 bucket, return 404 Not Found
        if (!listResponse.Contents || listResponse.Contents.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: "No objects found in the bucket." }),
            };
        }

        // Retrieve the content of each object in the bucket
        const allData = [];
        for (const object of listResponse.Contents) {
            const key = object.Key; // Get the key (name) of the object

            try {
                // Fetch the object content using the GetObjectCommand
                const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
                const response = await s3Client.send(command);
                
                // Convert the stream of the object content to a string
                const bodyString = await streamToString(response.Body); 
                
                // Parse the JSON content and push it into the allData array
                const data = JSON.parse(bodyString);
                allData.push({ key, data }); // Store both the key and the data

            } catch (err) {
                // Log any error encountered while fetching an object
                console.error(`Error fetching object ${key}:`, err.message);
            }
        }

        // Return the fetched data as a JSON response
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(allData),
        };
    } catch (error) {
        // Handle any errors that occur while fetching or processing the data
        console.error("Error fetching data from S3:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};

/**
 * Helper function to convert a stream into a string.
 * This function is used to process the S3 object content (which is a stream) and convert it to a string for parsing.
 * 
 * @param {Stream} stream - The input stream (from an S3 object).
 * @returns {Promise<string>} - A Promise that resolves to a string containing the stream content.
 */
const streamToString = (stream) =>
    new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk)); // Collect data chunks
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8"))); // Concatenate chunks and resolve as string
        stream.on("error", reject); // Reject the promise if an error occurs
    });
