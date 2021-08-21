import prisma from "../../../util/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { Submission, File } from "../../../types";
import { getSession } from "@auth0/nextjs-auth0";

const submission = async (req, res: NextApiResponse) => {
  if (req.method === "GET") {
    const { subID }: { subID: string } = req.query;
    const session = getSession(req, res);
    let isAdmin = false;
    let isSubOwner = false;
    if (session) {
      const adminResponse = await prisma.admins.findFirst({
        where: {
          discord_id: session.user.sub.split("|")[2],
        },
      });
      if (adminResponse) isAdmin = true;
    }

    const submission: Submission = await prisma.submissions.findFirst({
      where: {
        id: parseInt(subID),
      },
      include: {
        user_profile: true,
        uploaded_files: true,
      },
    });

    let showButton: Boolean = false;
    let showSub: Boolean = false;
    let images: File[] = [];
    let files: File[] = [];

    if (submission) {
      // Check if user is sub owner
      if (session) {
        if (session.user.sub.split("|")[2] === submission.user) {
          isSubOwner = true;
        }
      }
      if (submission.reviewed === false) {
        showButton = true;
      } else {
        showSub = true;
      }

      // console.time("submission_file_parse");
      submission.images.forEach((imageStr, index) => {
        const image = JSON.parse(imageStr);
        images.push(image);
      });

      submission.files.forEach((fileStr, index) => {
        const file = JSON.parse(fileStr);
        files.push(file);
      });

      submission.uploaded_files.forEach((file, index) => {
        if (file.type.includes("image")) {
          images.push(file);
        } else {
          files.push(file);
        }
      });
      // console.timeEnd("submission_file_parse");
    }

    res.status(200).json({
      submission: submission,
      images: images,
      files: files,
      show_button: showButton,
      show_sub: showSub,
      is_admin: isAdmin,
      is_sub_owner: isSubOwner,
    });
  } else {
    res.status(405).json({ success: false, error: "Method not allowed" });
  }
};

export default submission;
