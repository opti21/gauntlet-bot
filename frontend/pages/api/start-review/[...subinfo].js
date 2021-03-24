require('dotenv').config()
const axios = require('axios').default;
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import duration from 'dayjs/plugin/duration'
dayjs.extend(utc)
dayjs.extend(duration)
import { connectToDatabase } from "../../../util/mongodb_backend"
import { getSession } from 'next-auth/client'

export default async (req, res) => {
    const { db } = await connectToDatabase();
    const session = await getSession({ req })
    // console.log(session)


    let tokenResponse = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT}&client_secret=${process.env.TWITCH_SECRET}&grant_type=client_credentials`)
    const tokenData = tokenResponse.data

    const tokenDoc = {
        access_token: tokenData.access_token,
        expires: tokenData.expires_in
    }


    // let dbResponse = await db.collection("twitch_creds")
    //     .insertOne(tokenDoc)

    // console.log(dbResponse.insertedCount)

    // 441355780

    let response = await fetch('https://api.twitch.tv/helix/videos?user_id=29158331', {
        headers: {
            Authorization: 'Bearer ' + tokenData.access_token,
            'Client-ID': `${process.env.TWITCH_CLIENT}`
        }
    })

    let { data: videos } = await response.json()
    console.log(videos[0])

    console.log('Now: ' + dayjs().utc().format())
    console.log('Started: ' + videos[0].published_at)
    console.log('Formatted: ' + dayjs(videos[0].published_at).utc().format())

    const started_at = dayjs(videos[0].published_at).utc()
    const now = dayjs().utc()

    const difference = now.diff(started_at)
    const offset = dayjs.duration(difference).format('HH[h]mm[m]ss[s]')
    console.log(offset)

    const vod_link = videos[0].url + '?t=' + offset

    console.log(vod_link)

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
                res.status(200).json({
                    updated: false,
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