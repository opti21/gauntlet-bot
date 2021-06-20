require("dotenv").config();
import type { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../util/prisma";
import { withSentry } from "@sentry/nextjs";
import { performance } from "perf_hooks";

const currentWeek = async (req: NextApiRequest, res: NextApiResponse) => {
  const t0 = performance.now();
  const activeWeek = await prisma.gauntlet_weeks.findFirst({
    where: { active: true },
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

  const t1 = performance.now();
  console.log(`Current Week API took ${t1 - t0} milliseconds`);
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
