require('dotenv').config()
import { connectToDatabase } from "../../util/mongodb_backend"
import { getSession } from 'next-auth/client'

export default async (req, res) => {
    const session = await getSession({ req })
    if (session) {
        const { db } = await connectToDatabase();
        const user = await db
            .collection("admins")
            .find({ user: session.user.name })
            .project({ _id: 0 })
            .toArray()

        let isAdmin
        if (user.length > 0) {
            isAdmin = true
        } else {
            isAdmin = false
        }

        res.status(200).json({
            is_admin: isAdmin
        })
    } else {
        res.status(401).json({ error: "Unathorized" })
    }
}