import type { NextApiRequest, NextApiResponse } from "next";
import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import prisma from "../../util/prisma";

export default withApiAuthRequired(async function submissionStatus(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
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
          res.status(200).json({ success: true, already_submitted: true });
        } else {
          res.status(200).json({ success: true, already_submitted: false });
        }
      }
    } else {
      console.error("no active week found");
      res.status(500).json({ success: false, error: "No active week found" });
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ success: false, error: "server error check logs" });
  }
});
