require("dotenv").config();
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../util/prisma";
import { withSentry } from "@sentry/nextjs";

const currentWeek = async (req: NextApiRequest, res: NextApiResponse) => {
  const activeWeek = await prisma.gauntlet_weeks.findFirst({
    where: { active: true },
  });
  console.log(activeWeek);

  console.time("submission_prisma_call");
  const submissions = await prisma.submissions.findMany({
    where: { gauntlet_week: activeWeek.week, reviewed: false },
    include: {
      user_profile: true,
    },
    orderBy: [
      {
        createdAt: "asc",
      },
    ],
  });
  console.timeEnd("submission_prisma_call");

  let notReviewed = [];
  let reviewed = [];

  console.time("submission_sort");
  submissions.forEach((submission) => {
    if (submission.reviewed === false) {
      notReviewed.push(submission);
    } else {
      reviewed.push(submission);
    }
  });
  console.timeEnd("submission_sort");

  const total = notReviewed.length + reviewed.length;
  const reviewed_num = reviewed.length;
  const reviewedPercentage = Math.floor((reviewed_num / total) * 100);
  console.log(total);

  res.json({
    week_info: {
      week: activeWeek.week,
      theme: activeWeek.theme,
    },
    not_reviewed: notReviewed,
    reviewed: reviewed,
    total_num: total,
    reviewed_num: reviewed_num,
    reviewed_percentage: reviewedPercentage,
  });
};

export default withSentry(currentWeek);
