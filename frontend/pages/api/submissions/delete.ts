import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import * as yup from "yup";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../util/prisma";
import s3 from "../../../util/S3Client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

interface deleteAPI extends NextApiRequest {
  query: {
    subID: string;
  };
}

export default withApiAuthRequired(async function DeleteSubmissionApi(
  req: deleteAPI,
  res: NextApiResponse
) {
  if (req.method === "DELETE") {
    const { subID } = req.query;
    const session = getSession(req, res);

    const submission = await prisma.submissions.findFirst({
      where: {
        id: parseInt(subID),
      },
    });
    if (submission.user === session.user.sub.split("|")[2]) {
      submission.images.forEach(async (imageStr) => {
        const image = JSON.parse(imageStr);
        const s3DeleteResponse = await s3
          .send(
            new DeleteObjectCommand({
              Bucket: process.env.S3_BUCKET,
              Key: image.filename,
            })
          )
          .catch((err) => {
            console.error(err);
            res.status(500).json({ success: false, error: "s3 error" });
          });

        const prismaFileDeleteRes = await prisma.files
          .deleteMany({
            where: {
              filename: image.key,
            },
          })
          .catch((err) => {
            console.error(err);
            res.status(500).json({ success: false, error: "prisma error" });
          });
      });

      await prisma.submissions
        .delete({
          where: {
            id: parseInt(subID),
          },
        })
        .then((deleteResponse) => {
          res
            .status(200)
            .json({ success: true, message: "Submission Deleted" });
        })
        .catch((err) => {
          console.error(err);
          res.status(500).json({
            success: false,
            error: "Prisma failed at deleting submission",
          });
        });
    } else {
      res.status(403).json({
        success: false,
        error: "You do not own this submission",
      });
    }
  } else {
    res.status(405).json({ success: false, error: "Method not allowed" });
  }
});
