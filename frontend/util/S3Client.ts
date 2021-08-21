import { S3Client } from "@aws-sdk/client-s3";

interface CustomNodeJsGlobal extends NodeJS.Global {
  s3: S3Client;
}

declare const global: CustomNodeJsGlobal;

const s3 =
  global.s3 ||
  new S3Client({
    credentials: {
      accessKeyId: process.env.S3_KEY,
      secretAccessKey: process.env.S3_SECRET,
    },
    region: process.env.S3_REGION,
    endpoint: process.env.S3_ENDPOINT,
  });

if (process.env.NODE_ENV === "development") global.s3 = s3;

export default s3;
