import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import * as yup from "yup";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../util/prisma";

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
          res
            .status(500)
            .json({
              success: false,
              error: "Prisma failed at deleting submission",
            });
        });
    } else {
      res.status(403).json({
        success: false,
        error:
          "User who tried to delete this submission is not the owner of this submission",
      });
    }
  } else {
    res.status(405).json({ success: false, error: "Method not allowed" });
  }
});
