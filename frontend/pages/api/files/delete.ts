import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../util/prisma";
import s3 from "../../../util/S3Client";

export default withApiAuthRequired(async function deleteAPI(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "DELETE") {
    const session = getSession(req, res);
    const userID = session.user.sub.split("|")[2];
    const file = req.body.file;
    try {
      const userFile = await prisma.files.findFirst({
        where: {
          id: file.response.file_id,
        },
      });

      if (userFile) {
        // Check if user owns file
        if (userFile.user_id === userID) {
          const deleteResponse = await s3
            .send(
              new DeleteObjectCommand({
                Bucket: process.env.S3_BUCKET,
                Key: userFile.filename,
              })
            )
            .catch((err) => {
              console.error(err);
              res.status(500).json({ success: false, error: "s3 error" });
            });

          const deteleDbFile = await prisma.files
            .delete({
              where: {
                id: userFile.id,
              },
            })
            .catch((e) => {
              res.status(500).json({
                success: false,
                error: "Error deleting file with prisma",
              });
              console.error(e);
            });

          res.status(200).json({ success: true, message: "File deleted" });
        } else {
          res
            .status(406)
            .json({ success: false, error: "You do not own this file" });
        }
      } else {
        res.status(404).json({ success: false, error: "File not found" });
      }
    } catch (error) {
      res.status(500).json({ success: false, error: error });
      console.error(error);
    }
  }
});
