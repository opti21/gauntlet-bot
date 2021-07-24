import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextApiRequest, NextApiResponse } from "next";
import s3 from "../../../util/S3Client";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "DELETE") {
    const file = req.body.file;
    try {
      const deleteResponse = await s3.send(
        new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: file.response.key,
        })
      );
      console.log(deleteResponse);
      res.status(200).json({ message: "File deleted" });
      console.log(req.body);
    } catch (error) {
      res.status(500).json({ error: error });
    }
  }
};
