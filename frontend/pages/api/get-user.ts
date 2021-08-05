import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../util/prisma";

interface UserApi extends NextApiRequest {
  query: {
    user: string | null;
  };
}

export default async function User(req: UserApi, res: NextApiResponse) {
  if (req.method === "GET") {
    const { user } = req.query;

    if (user) {
      const userInfo = await prisma.users
        .findFirst({
          where: {
            username: user,
          },
          include: {
            submissions: {
              include: {
                gauntlet_weeks: true,
              },
            },
          },
        })
        .catch((err) => {
          console.error(err);
          res.status(500).json({ success: false, error: err });
        });
      if (userInfo) {
        res.status(200).json({
          userInfo,
          success: true,
        });
      } else {
        res.status(400).json({ success: false, error: "User does not exist" });
      }
    } else {
      res.status(400).json({
        success: false,
        error: "no username provided",
      });
    }
  } else {
    res.status(405).json({ success: false, error: "Method not allowed" });
  }
}
