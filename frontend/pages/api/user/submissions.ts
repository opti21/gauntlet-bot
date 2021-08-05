import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../util/prisma";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  const { user } = req.query;

  if (user) {
    const userData = await prisma.users.findFirst({
      where: {
        //@ts-ignore
        username: user,
      },
    });

    if (userData) {
      const submissions = await prisma.submissions
        .findMany({
          where: {
            user: userData.id,
          },
        })
        .catch((err) => {
          console.error(err);
          res.status(500).json({ success: false, error: err });
        });
        
    } else {
      res.status(400).json({ success: false, error: "user doesn't exist" });
    }
  } else {
    res.status(400).json({ success: false, error: "No user provided" });
  }
};
