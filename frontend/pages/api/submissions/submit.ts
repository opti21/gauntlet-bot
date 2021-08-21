import { getSession, withApiAuthRequired } from "@auth0/nextjs-auth0";
import { NextApiRequest, NextApiResponse } from "next";
import * as yup from "yup";
import { File } from "../../../types";
import checkUser from "../../../util/checkUser";
import prisma from "../../../util/prisma";

interface formResponse extends NextApiRequest {
  body: {
    description: string;
    files: number[];
  };
}

interface auth0User {
  nickname: string;
  name: string;
  picture: string;
  updated_at: string;
  email: string;
  email_verified: string;
}

export default withApiAuthRequired(async function submitApi(
  req: formResponse,
  res: NextApiResponse
) {
  const { user } = getSession(req, res);
  checkUser(user);

  const formSchema = yup.object().shape({
    description: yup.string().required(),
    files: yup.array().of(yup.number()),
  });

  const isValid = formSchema.validate(req.body).catch((err) => {
    res.status(400).json({ success: false, error: err });
  });

  if (req.method === "POST") {
    if (isValid) {
      const userID = user.sub.split("|")[2];

      await prisma.users.upsert({
        where: { id: userID },
        //@ts-ignore
        create: {
          id: userID,
          username: user.nickname,
          user_pic: user.picture,
        },
        update: {
          username: user.nickname,
          user_pic: user.picture,
        },
      });
      const currentWeek = await prisma.gauntlet_weeks
        .findFirst({
          where: {
            active: true,
          },
        })
        .then((weekRes) => {
          return weekRes;
        })
        .catch((err) => {
          console.error(err);
          res.status(500).json({ success: false, error: err });
        });

      if (currentWeek) {
        // Checks if user has already submitted
        const userSubmissions = await prisma.submissions.findMany({
          where: {
            gauntlet_week: currentWeek.week,
            user: user.sub.split("|")[2],
          },
        });
        if (userSubmissions.length === 0) {
          const idsForFiles = req.body.files.map((file) => {
            return { id: file };
          });
          const createSubmission = await prisma.submissions
            .create({
              data: {
                description: req.body.description,
                gauntlet_week: currentWeek.week,
                user: user.sub.split("|")[2],
                uploaded_files: {
                  connect: idsForFiles,
                },
              },
            })
            .catch((err) => {
              res.status(500).json({ success: false, error: err });
              console.error(err);
            });

          if (createSubmission) {
            await fetch(process.env.SUBMISSION_WEBHOOK, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                embeds: [
                  {
                    type: "rich",
                    color: 14371023,
                    title: `${user.nickname} uploaded a submission check it out!`,
                    description: `${process.env.APP_URL}/review?submission=${createSubmission.id}`,
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
            res
              .status(200)
              .json({ success: true, sub_id: createSubmission.id });
          }
        } else {
          res.status(400).json({
            success: false,
            error: "User has already submitted this week",
          });
        }
      }
    }
  } else {
    res.status(405).json({ success: false, error: "Method not allowed" });
  }
});
