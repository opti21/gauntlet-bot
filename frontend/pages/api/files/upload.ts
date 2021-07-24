import { NextApiRequest, NextApiResponse } from "next";
import * as formidable from "formidable";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v4 as uuid } from "uuid";
import * as fs from "fs";
import s3 from "../../../util/S3Client";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const data = new Promise((resolve, reject) => {
      const form = new formidable.IncomingForm({
        multiple: true,
        keepExtensions: true,
      });

      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });

    return data
      .then(async ({ fields, files }) => {
        // console.log({ fields, files });
        // console.log(files.files);
        // throw new Error("Not implemented");

        try {
          const key = "gauntlet_" + uuid() + "_" + files.files.name;

          const upload = await s3.send(
            new PutObjectCommand({
              Bucket: process.env.S3_BUCKET,
              Key: key,
              Body: fs.createReadStream(files.files.path),
              ContentType: files.files.type,
              ACL: "public-read",
            })
          );
          console.log(upload);
          const regex = /^"(.*)"$/;
          const etag = regex.exec(upload.ETag)[1];

          res.status(200).json({
            etag,
            key,
            url: `https://s3.${process.env.S3_REGION}.wasabisys.com/${process.env.S3_BUCKET}/${key}`,
            type: files.files.type,
          });
        } catch (e) {
          console.log(e);
          res.status(500).send(e);
        }
      })
      .catch((err) => {
        res.status(500).json(err);
        console.error(err);
      });
  }
};

export const config = {
  api: {
    bodyParser: false,
  },
};
