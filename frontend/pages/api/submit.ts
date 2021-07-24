import {
  Claims,
  getSession,
  Session,
  withApiAuthRequired,
} from "@auth0/nextjs-auth0";
import { NextApiRequest, NextApiResponse } from "next";
import * as yup from "yup";
import prisma from "../../util/prisma";

interface formResponse extends NextApiRequest {
  body: {
    description: string;
    files: string[];
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

  const formSchema = yup.object().shape({
    description: yup.string().required(),
    files: yup.array().of(
      yup
        .object()
        .shape({
          etag: yup.string(),
          key: yup.string(),
          url: yup.string().url(),
        })
        .default([])
        .required()
    ),
  });

  const isValid = formSchema.validate(req.body).catch((err) => {
    res.status(400).json({ success: false, error: err });
  });

  console.log(user);
  console.log(req.body);

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
      const userSubmissions = await prisma.submissions.findMany({
        where: {
          gauntlet_week: currentWeek.week,
          user: user.sub.split("|")[2],
        },
      });
      if (userSubmissions.length === 0) {
        prisma.submissions
          .create({
            data: {
              description: req.body.description,
              files: req.body.files,
              gauntlet_week: currentWeek.week,
              user: user.sub.split("|")[2],
            },
          })
          .then((prismaRes) => {
            console.log(prismaRes);
            res.status(200).json({ success: true });
          });
      } else {
        res.status(400).json({
          success: false,
          error: "User has already submitted this week",
        });
      }
    }
  }
});
