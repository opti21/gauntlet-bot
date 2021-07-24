import { PrismaClient } from "@prisma/client";

const getWeek = async (req, res) => {
  const prisma = new PrismaClient();
  const weeks = await prisma.gauntlet_weeks.findMany({});
  // console.log(weeks);
  res.status(200).json(weeks);
};

export default getWeek;
