import { getSession } from "next-auth/client";
import prisma from "../../util/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { Submission } from "../../types";

const submission = async (req, res: NextApiResponse) => {
  const session = await getSession({ req });
  const { user, week }: { user: string; week: string } = req.query;
  console.log(req.query);

  console.time("submission_review_prisma_call");
  const submission = await prisma.submissions.findFirst({
    where: {
      user: user,
      gauntlet_week: parseInt(week),
    },
    include: {
      user_profile: true,
    },
  });
  console.timeEnd("submission_review_prisma_call");

  let isAdmin = false;

  console.time("submission_review_session_check");
  if (session) {
    console.log(session);
    const admin = await prisma.admins.findFirst({
      where: {
        twitch_username: session.user.name,
      },
    });
    console.log(session.user.name);

    if (admin) {
      isAdmin = true;
    }
  }
  console.timeEnd("submission_review_session_check");

  // console.log(submission);
  let showButton: Boolean = false;
  let showSub: Boolean = false;
  let images: String[] = [];
  let files: String[] = [];

  if (submission) {
    if (submission.reviewed === false) {
      showButton = true;
    } else {
      showSub = true;
    }

    console.time("submission_file_parse");
    submission.images.forEach((imageStr, index) => {
      const image = JSON.parse(imageStr);
      const imageObj = {
        key: index + 1,
        ...image,
      };

      images.push(imageObj);
    });

    submission.files.forEach((fileStr, index) => {
      const file = JSON.parse(fileStr);
      const fileObj = {
        key: index + 1,
        ...file,
      };

      files.push(fileObj);
    });
    console.timeEnd("submission_file_parse");
  }

  res.status(200).json({
    submission: submission,
    images: images,
    files: files,
    isAdmin: isAdmin,
    show_button: showButton,
    show_sub: showSub,
  });
};

export default submission;
