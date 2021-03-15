require('dotenv').config()
import { connectToDatabase } from "../../util/mongodb"
import { getSession } from 'next-auth/client'

export default async (req, res) => {
    const session = await getSession({ req })
    if (session) {
        const { db } = await connectToDatabase();
        const activeWeek = await db
            .collection("gauntlet weeks")
            .find({ active: true })
            .project({ _id: 0 })
            .toArray()

        const submissions = await db
            .collection('submissions')
            .find({
                week: activeWeek[0].week,
                submitted: true
            })
            .toArray()

        res.status(200).json({
            week_info: activeWeek[0],
            submissions: submissions
        })
    } else {
        res.status(401).json({ error: "Unathorized" })
    }
}