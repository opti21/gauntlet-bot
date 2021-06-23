require("dotenv").config();
const axios = require("axios").default;
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import duration from "dayjs/plugin/duration";
dayjs.extend(utc);
dayjs.extend(duration);
import { getSession } from "next-auth/client";
import prisma from "../../util/prisma";
import { NextApiResponse } from "next";
import { submissions } from "@prisma/client";

let DISCORD_WEBHOOK: string;

if (process.env.NODE_ENV === "development") {
  DISCORD_WEBHOOK = process.env.TEST_DISCORD_WEBHOOK;
} else {
  DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;
}

const startReview = async (req, res: NextApiResponse) => {
  const session = await getSession({ req });
  // console.log(session)
  const { user, week }: { user: string; week: string } = req.query;

  if (session) {
    const submission = await prisma.submissions
      .findFirst({
        where: {
          user: user,
          gauntlet_week: parseInt(week),
        },
      })
      .catch((e) => {
        console.error(e);
        res.status(500).json({
          error: e,
        });
      });

    if (submission) {
      if (submission.reviewed) {
        res.status(400).json({
          error: "Review already started",
        });
      } else {
        const isAdmin = await prisma.admins
          .findFirst({
            where: {
              twitch_username: session.user.name,
            },
          })
          .catch((e) => {
            console.error(e);
            res.status(500).json({
              error: e,
            });
          });

        if (isAdmin) {
          await prisma.submissions
            .update({
              where: {
                id: submission.id,
              },
              data: {
                reviewed: true,
              },
            })
            .then((response) => {
              res.status(200).json({
                review_started: true,
              });
            });

          // generateVodLink(submission)
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

const generateVodLink = async (submission: submissions) => {
  const token_db = await prisma.twitch_creds
    .findUnique({
      where: {
        id: 1,
      },
    })
    .catch((e) => {
      console.error(e);
    });

  let TWITCH_TOKEN: string;

  if (!token_db) {
    let tokenResponse = await axios.post(
      `https://id.twitch.tv/oauth2/token?client_id=${process.env.TWITCH_CLIENT}&client_secret=${process.env.TWITCH_SECRET}&grant_type=client_credentials`
    );
    const tokenData = tokenResponse.data;

    const tokenDoc = {
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
    };

    await prisma.twitch_creds
      .create({
        data: tokenDoc,
      })
      .then((response) => {
        console.log("Token Created");
      })
      .catch((e) => {
        console.error(e);
      });

    TWITCH_TOKEN = tokenData.access_token;
  } else {
    TWITCH_TOKEN = token_db.access_token;
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

  let vod_link: string;

  if (vidFetch.status === 200) {
    console.log("VOD FETCH SUCCESS");
    const vidJSON = await vidFetch.json();
    const { data: videos } = vidJSON;

    // console.log("Now: " + dayjs().utc().format());
    // console.log("Started: " + videos[0].published_at);
    // console.log(
    //   "Formatted: " + dayjs(videos[0].published_at).utc().format()
    // );

    const started_at = dayjs(videos[0].published_at).utc();
    const now = dayjs().utc();

    const difference = now.diff(started_at);
    const offset = dayjs.duration(difference).format("HH[h]mm[m]ss[s]");
    // console.log(offset);

    vod_link = videos[0].url + "?t=" + offset;

    console.log(vod_link);
  } else {
    const vidError = await vidFetch.json();
    console.error(vidError);
  }

  // Update submission with vod link

  await prisma.submissions
    .update({
      where: {
        id: submission.id,
      },
      data: {
        vod_link: vod_link,
      },
      include: {
        user_profile: true,
      },
    })
    .then(async (doc) => {
      console.log(doc);
      await fetch(DISCORD_WEBHOOK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          embeds: [
            {
              type: "rich",
              color: 14371023,
              title: `Billy's review of ${doc.user_profile.username}'s week ${doc.gauntlet_week} submission`,
              description: doc.vod_link,
            },
          ],
        }),
      })
        .then((res) => {
          console.log("WEBHOOK POSTED");
        })
        .catch((e) => {
          console.error(e);
        });
    })
    .catch((e) => {
      console.error(e);
    });
};

export default startReview;
