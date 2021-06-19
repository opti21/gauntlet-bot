require("dotenv").config();
import { withSentry } from "@sentry/nextjs";
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../util/prisma";

const week = async (req, res: NextApiResponse) => {
  const { week_num }: { week_num: string } = req.query;
  const activeWeek = await prisma.gauntlet_weeks.findFirst({
    where: { week: parseInt(week_num) },
  });
  console.log(activeWeek);
  const notReviewed = await prisma.submissions.findMany({
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

  const reviewed = await prisma.submissions.findMany({
    where: { gauntlet_week: activeWeek.week, reviewed: true },
    include: {
      user_profile: true,
    },
    orderBy: [
      {
        createdAt: "asc",
      },
    ],
  });

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

export default withSentry(week);
