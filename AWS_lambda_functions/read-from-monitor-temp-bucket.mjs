import { S3Client, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

const s3Client = new S3Client({ region: process.env.aws_region });

export const handler = async (event) => {
    const bucketName = process.env.s3_bucket_name;
    const validUsername = process.env.basic_auth_username;
    const validPassword = process.env.basic_auth_password;

    const authHeader = event.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Basic ")) {
        return {
            statusCode: 401,
            headers: { "WWW-Authenticate": 'Basic realm="Restricted"' },
            body: JSON.stringify({ error: "Unauthorized: Missing or invalid Authorization header" }),
        };
    }

    const base64Credentials = authHeader.split(" ")[1];
    const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
    const [username, password] = credentials.split(":");

    if (username !== validUsername || password !== validPassword) {
        return {
            statusCode: 403,
            body: JSON.stringify({ error: "Forbidden: Invalid username or password" }),
        };
    }

    try {
        const listCommand = new ListObjectsV2Command({ Bucket: bucketName });
        const listResponse = await s3Client.send(listCommand);

        if (!listResponse.Contents || listResponse.Contents.length === 0) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: "No objects found in the bucket." }),
            };
        }

        const allData = [];
        for (const object of listResponse.Contents) {
            const key = object.Key;

            try {
                const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
                const response = await s3Client.send(command);
                const bodyString = await streamToString(response.Body);
                const data = JSON.parse(bodyString);
                allData.push({ key, data });
            } catch (err) {}
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(allData),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};

const streamToString = (stream) =>
    new Promise((resolve, reject) => {
        const chunks = [];
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
        stream.on("error", reject);
    });
