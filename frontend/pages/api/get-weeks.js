require('dotenv').config()
import { connectToDatabase } from "../../util/mongodb"
import { getSession } from 'next-auth/client'

export default async (req, res) => {
    const session = await getSession({ req })
    if (session) {
        const { db } = await connectToDatabase();
        const weeks = await db
            .collection("gauntlet weeks")
            .find({}, { "_id": 0 })
            .sort({ "week": -1 })
            .toArray()

        res.status(200).json(weeks)
    } else {
        res.status(401).json({ error: "Unathorized" })
    }
}