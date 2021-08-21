import { NextApiRequest, NextApiResponse } from "next";
import * as formidable from "formidable";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v4 as uuid } from "uuid";
import * as fs from "fs";
import s3 from "../../../util/S3Client";
import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import prisma from "../../../util/prisma";
import checkUser from "../../../util/checkUser";

export default withApiAuthRequired(async function UploadFile(
  req,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { user } = getSession(req, res);
    checkUser(user);

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
          const etag = upload.ETag.slice(1, -1);

          const userID = user.sub.split("|")[2];
          const createFile = await prisma.files
            .create({
              data: {
                etag: etag,
                url: `https://s3.${process.env.S3_REGION}.wasabisys.com/${process.env.S3_BUCKET}/${key}`,
                filename: key,
                user_id: userID,
                type: files.files.type,
              },
            })
            .catch((err) => {
              console.error(err);
              res.status(500).json({
                success: false,
                error: "Prisma failed at making file",
              });
            });

          if (createFile) {
            res.status(200).json({
              file_id: createFile.id,
            });
          }
        } catch (e) {
          console.error(e);
          res.status(500).send(e);
        }
      })
      .catch((err) => {
        res.status(500).json(err);
        console.error(err);
      });
  } else {
    res.status(405).json({ success: false, error: "Method not allowed" });
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};
