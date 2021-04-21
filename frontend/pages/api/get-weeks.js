require("dotenv").config();
import { connectToDatabase } from "../../util/mongodb_backend";

export default async (req, res) => {
  const { db } = await connectToDatabase();
  const weeks = await db
    .collection("gauntlet weeks")
    .find({}, { _id: 0 })
    .sort({ week: -1 })
    .toArray();

  res.status(200).json(weeks);
};
