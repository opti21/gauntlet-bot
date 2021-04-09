require("dotenv").config();
const Discord = require("discord.js");
const dClient = new Discord.Client();
dClient.login(process.env.DISCORD_TOKEN);
const axios = require("axios").default;
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import duration from "dayjs/plugin/duration";
dayjs.extend(utc);
dayjs.extend(duration);
import { connectToDatabase } from "../../../util/mongodb_backend";
import { getSession } from "next-auth/client";

export default async (req, res) => {
  const { db } = await connectToDatabase();
  const session = await getSession({ req });
  // console.log(session)
  const { subinfo } = req.query;
  console.log(subinfo);

  if (session) {
    const submission = await db
      .collection("submissions")
      .find({
        user: parseInt(subinfo[0]),
        week: parseInt(subinfo[1]),
      })
      .toArray();

    if (submission.length > 0) {
      if (submission[0].reviewed === "true") {
        res.status(400).json({
          error: "Review already started",
        });
      } else {
        const user = await db
          .collection("admins")
          .find({ user: session.user.name })
          .project({ _id: 0 })
          .toArray();

        let isAdmin;
        if (user.length > 0) {
          isAdmin = true;
        } else {
          isAdmin = false;
        }
        if (isAdmin) {
          const token_db = await db.collection("twitch_creds").find().toArray();

          let TWITCH_TOKEN;

          if (token_db.length === 0) {
            let tokenResponse = await axios.post(
              `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT}&client_secret=${process.env.TWITCH_SECRET}&grant_type=client_credentials`
            );
            const tokenData = tokenResponse.data;

            const tokenDoc = {
              access_token: tokenData.access_token,
              expires: tokenData.expires_in,
            };

            let dbResponse = await db
              .collection("twitch_creds")
              .insertOne(tokenDoc);

            console.log(dbResponse.insertedCount);

            TWITCH_TOKEN = tokenData.access_token;
          } else {
            TWITCH_TOKEN = token_db[0].access_token;
          }

          // 441355780

          let vidFetch = await fetch(
            "https://api.twitch.tv/helix/videos?user_id=441355780",
            {
              headers: {
                Authorization: "Bearer " + TWITCH_TOKEN,
                "Client-ID": `${process.env.TWITCH_CLIENT}`,
              },
            }
          );

          let vod_link;

          if (vidFetch.status === 200) {
            const vidJSON = await vidFetch.json();
            const { data: videos } = vidJSON;

            console.log("Now: " + dayjs().utc().format());
            console.log("Started: " + videos[0].published_at);
            console.log(
              "Formatted: " + dayjs(videos[0].published_at).utc().format()
            );

            const started_at = dayjs(videos[0].published_at).utc();
            const now = dayjs().utc();

            const difference = now.diff(started_at);
            const offset = dayjs.duration(difference).format("HH[h]mm[m]ss[s]");
            console.log(offset);

            vod_link = videos[0].url + "?t=" + offset;

            console.log(vod_link);
          } else {
            const vidError = await vidFetch.json();
            console.error(vidError);
          }

          const updated = await db.collection("submissions").findOneAndUpdate(
            {
              user: parseInt(subinfo[0]),
              week: parseInt(subinfo[1]),
            },
            {
              $set: {
                reviewed: "true",
                vod_link: vod_link,
              },
            },
            {
              returnOriginal: false,
            },
            async (err, document) => {
              if (err) {
                console.error(err);
                res.status(501).json({
                  error: err,
                });
              }
              // update discord message
              let doc = document.value;
              let attachments = JSON.parse(doc.attachments);
              let SUBMISSION_CHANNEL = "761805260691865600";

              let fileStr = "";

              if (attachments.length > 0) {
                attachments.forEach((file) => {
                  fileStr += `${file}\n`;
                });
              }

              const updatedEmbed = new Discord.MessageEmbed()
                .setColor("#db48cf")
                .setTitle(`${doc.username}'s week ${doc.week} submission`)
                .setDescription(`
    						**Description:** ${doc.description}

								Vod Link: ${doc.vod_link}

 								${fileStr}
    					`);

              const response = await fetch(process.env.DISCORD_WEBHOOK, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  embeds: [
                    {
                      type: "rich",
                      color: 14371023,
                      title: `Billy's review of ${doc.username}'s week ${doc.week} submission`,
                      description: doc.vod_link,
                    },
                  ],
                }),
              });

              console.log(response);
            }
          );
          res.status(200).json({
            review_started: true,
          });
        } else {
          res.status(401).json({
            error: "Unathorized",
          });
        }
      }
    } else {
      res.status(400).json({
        error: "Submision doesn't exist",
      });
    }
  } else {
    res.status(401).json({ error: "Unathorized" });
  }
};
