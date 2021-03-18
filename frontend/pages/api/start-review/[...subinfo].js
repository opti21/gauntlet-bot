require('dotenv').config()
import { connectToDatabase } from "../../../util/mongodb"
import { getSession } from 'next-auth/client'

export default async (req, res) => {
    const { db } = await connectToDatabase();
    const session = await getSession({ req })

    if (session) {
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
        if (isAdmin) {
            const { subinfo } = req.query
            console.log(subinfo)

            const updated = await db.collection("submissions")
                .updateOne({
                    user: parseInt(subinfo[0]),
                    week: parseInt(subinfo[1])
                }, {
                    $set: {
                        reviewed: "true"
                    }
                })
            if (updated.result.nModified === 1) {
                res.status(200).json({
                    updated: true
                })
            } else {
                res.status(501).json({
                    updated: false,
                    error: "Document not updated or already updated"
                })
            }

        } else {
            res.status(401).json({
                error: "Unathorized"
            })
        }

    } else {
        res.status(401).json({ error: "Unathorized" })
    }
}