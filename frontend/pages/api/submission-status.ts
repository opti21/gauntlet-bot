import type { NextApiRequest, NextApiResponse } from "next";
import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import prisma from "../../util/prisma";

export default withApiAuthRequired(async function submissionStatus(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { user } = getSession(req, res);
  const currentWeek = await prisma.gauntlet_weeks
    .findFirst({
      where: {
        active: true,
      },
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ success: false, error: err });
    });
  console.log(currentWeek);

  if (currentWeek) {
    const userSubmission = await prisma.submissions
      .findMany({
        where: {
          user: user.sub.split("|")[2],
          gauntlet_week: currentWeek.week,
        },
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ success: false, error: err });
      });
    if (userSubmission) {
      if (userSubmission.length > 0) {
        console.log("has submission");
        res.status(200).json({ success: true, already_submitted: true });
      } else {
        res.status(200).json({ success: true, already_submitted: false });
      }
    }
  }
});
