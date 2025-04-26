import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({ region: process.env.aws_region });
const bucketName = process.env.s3_bucket_name;

export const handler = async (event) => {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: "Unauthorized: Missing or invalid Authorization header" }),
    };
  }

  const base64Credentials = authHeader.split(" ")[1];
  const decodedCredentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
  const [username, password] = decodedCredentials.split(":");

  const allowedUser = process.env.allowedUser;
  const allowedPassword = process.env.allowedPassword;

  if (username !== allowedUser || password !== allowedPassword) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: "Forbidden: Invalid credentials" }),
    };
  }

  try {
    const iotData = await fetchS3Data("iot-data/");
    const smhiData = await fetchS3Data("shmi-data/");

    const latestSmhiData = smhiData.reduce((latest, current) => {
      const currentTimestamp = normalizeTimestamp(current.timestamp);
      return currentTimestamp > normalizeTimestamp(latest.timestamp) ? current : latest;
    }, smhiData[0]);

    const comparisons = iotData.map((iotRecord) => ({
      timestamp: iotRecord.timestamp,
      iotTemperature: iotRecord.temperature,
      smhiTemperature: latestSmhiData ? latestSmhiData.temperature : null,
      difference: latestSmhiData ? iotRecord.temperature - latestSmhiData.temperature : null,
    }));

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(comparisons),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Unexpected error occurred", details: error.message }),
    };
  }
};

const fetchS3Data = async (prefix) => {
  const data = [];
  const listCommand = new ListObjectsV2Command({ Bucket: bucketName, Prefix: prefix });
  const response = await s3Client.send(listCommand);

  if (!response.Contents || response.Contents.length === 0) {
    return data;
  }

  for (const object of response.Contents) {
    try {
      const command = new GetObjectCommand({ Bucket: bucketName, Key: object.Key });
      const getObjectResponse = await s3Client.send(command);
      const bodyString = await streamToString(getObjectResponse.Body);
      data.push(JSON.parse(bodyString));
    } catch (err) {}
  }
  return data;
};

const normalizeTimestamp = (timestamp) => {
  return timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
};

const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    stream.on("error", reject);
  });
