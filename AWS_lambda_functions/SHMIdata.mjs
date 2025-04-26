import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({ region: process.env.aws_region });
const bucketName = process.env.s3_bucket_name;

export const handler = async (event) => {
  try {
    const apiUrl = "https://opendata-download-metobs.smhi.se/api/version/latest/parameter/1/station/72420/period/latest-hour/data.json";
    const response = await fetch(apiUrl);

    if (!response.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Failed to fetch data from SMHI API" }),
      };
    }

    const rJson = await response.json();

    if (!rJson || !rJson.value || rJson.value.length === 0) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Invalid or empty data from SMHI API" }),
      };
    }

    const timestamp = new Date(rJson.value[0].date).getTime();
    const smhiData = {
      device_id: `SMHI-${rJson.station.key}`,
      temperature: parseFloat(rJson.value[0].value),
      humidity: null,
      timestamp: timestamp,
      location: rJson.station.name,
    };

    const objectKey = `shmi-data/${rJson.station.key}/${timestamp}.json`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
        Body: JSON.stringify(smhiData),
        ContentType: "application/json",
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "SMHI data successfully written to S3",
        key: objectKey,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Unexpected error occurred" }),
    };
  }
};
