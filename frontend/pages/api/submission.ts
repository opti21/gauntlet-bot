import { getSession } from "next-auth/client";
import prisma from "../../util/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { withSentry } from "@sentry/nextjs";

const submission = async (req, res: NextApiResponse) => {
  const session = await getSession({ req });
  const { user, week }: { user: string; week: string } = req.query;
  console.log(req.query);

  const submission = await prisma.submissions.findFirst({
    where: {
      user: user,
      gauntlet_week: parseInt(week),
    },
    include: {
      user_profile: true,
    },
  });

  let images = [];
  let files = [];

  if (submission) {
    if (submission.attachments.length > 0) {
      submission.attachments.forEach((attachment, index) => {
        const is_image =
          /^(?:(?<scheme>[^:\/?#]+):)?(?:\/\/(?<authority>[^\/?#]*))?(?<path>[^?#]*\/)?(?<file>[^?#]*\.(?<extension>[Jj][Pp][Ee]?[Gg]|[Pp][Nn][Gg]|[Gg][Ii][Ff]))(?:\?(?<query>[^#]*))?(?:#(?<fragment>.*))?$/gm.test(
            attachment
          );

        const filenameRegex = /(?=\w+\.\w{3,4}$).+/gim;
        const filename = attachment.match(filenameRegex);

        if (is_image) {
          images.push({
            key: index + 1,
            is_image: is_image,
            url: attachment,
            filename: filename,
          });
        } else {
          files.push({
            key: index + 1,
            is_image: is_image,
            url: attachment,
            filename: filename,
          });
        }
      });
    }
  }

  let isAdmin = false;

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

  // console.log(submission);
  let showButton: Boolean = false;
  let showSub: Boolean = false;

  if (submission) {
    if (submission.reviewed === false) {
      showButton = true;
    } else {
      showSub = true;
    }
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

export default withSentry(submission);
