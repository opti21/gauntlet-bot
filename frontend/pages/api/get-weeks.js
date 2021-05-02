require("dotenv").config();
import { connectToDatabase } from "../../util/mongodb_backend";
import { PrismaClient } from "@prisma/client";

export default async (req, res) => {
  const prisma = new PrismaClient();
  const weeks = await prisma.gauntlet_weeks.findMany({});
  console.log(weeks);
  res.status(200).json(weeks);
};
