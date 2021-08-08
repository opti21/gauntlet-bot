import prisma from "../../../util/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { Submission } from "../../../types";
import { getSession } from "@auth0/nextjs-auth0";

const submission = async (req, res: NextApiResponse) => {
  // const { user } = getSession(req, res);
  // console.log(user);
  if (req.method === "GET") {
    const { subID }: { subID: string } = req.query;
    console.log(req.query);

    const submission: Submission = await prisma.submissions.findFirst({
      where: {
        id: parseInt(subID),
      },
      include: {
        user_profile: true,
      },
    });

    // console.log(submission);
    let showButton: Boolean = false;
    let showSub: Boolean = false;
    let images: String[] = [];
    let files: File[] = [];

    if (submission) {
      if (submission.reviewed === false) {
        showButton = true;
      } else {
        showSub = true;
      }

      // console.time("submission_file_parse");
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
      // console.timeEnd("submission_file_parse");
    }

    res.status(200).json({
      submission: submission,
      images: images,
      files: files,
      show_button: showButton,
      show_sub: showSub,
    });
  } else {
    res.status(405).json({ success: false, error: "Method not allowed" });
  }
};

export default submission;
