import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({ region: process.env.aws_region });
const bucketName = process.env.s3_bucket_name;

const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    stream.on("error", reject);
  });

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

export const handler = async (event) => {
  const origin = event.headers?.origin || "*";

  try {
    const iotData = await fetchS3Data("iot-data/");
    const smhiData = await fetchS3Data("shmi-data/");

    const normalizedSmhiData = smhiData.map((record) => ({
      ...record,
      timestamp: Math.floor(record.timestamp / 1000),
    }));

    const combinedData = iotData.map((iotRecord, index) => {
      const smhiRecord = normalizedSmhiData[index];
      return {
        timestamp: iotRecord.timestamp,
        iotTemperature: iotRecord.temperature,
        smhiTemperature: smhiRecord ? smhiRecord.temperature : null,
      };
    });

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
      body: JSON.stringify(combinedData),
    };
  } catch (error) {
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
