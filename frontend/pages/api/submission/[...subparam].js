import { getSession } from "next-auth/client";
import { connectToDatabase } from "../../../util/mongodb_backend";

export default async (req, res) => {
  const { subparam } = req.query;
  const session = await getSession({ req });

  let isAdmin = false;
  if (session) {
    const { db } = await connectToDatabase();
    const user = await db
      .collection("admins")
      .find({ user: session.user.name })
      .project({ _id: 0 })
      .toArray();

    if (user.length > 0) {
      isAdmin = true;
    }
  }

  const { db } = await connectToDatabase();
  const submission = await db
    .collection("submissions")
    .find({
      user: parseInt(subparam[0]),
      week: parseInt(subparam[1]),
    })
    .project({ _id: 0 })
    .toArray();

  // console.log(submission)
  if (submission.length > 0) {
    let reviewed;
    if (submission[0].reviewed === "true") {
      reviewed = true;
    } else {
      reviewed = false;
    }

    const attachmentArray = JSON.parse(submission[0].attachments);
    console.log(attachmentArray);

    let images = [];
    let files = [];

    if (attachmentArray.length > 0) {
      attachmentArray.forEach((attachment, index) => {
        const is_image = /^(?:(?<scheme>[^:\/?#]+):)?(?:\/\/(?<authority>[^\/?#]*))?(?<path>[^?#]*\/)?(?<file>[^?#]*\.(?<extension>[Jj][Pp][Ee]?[Gg]|[Pp][Nn][Gg]|[Gg][Ii][Ff]))(?:\?(?<query>[^#]*))?(?:#(?<fragment>.*))?$/gm.test(
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

    res.status(200).json({
      session,
      isAdmin,
      submissionData: {
        exists: true,
        user: {
          id: submission[0].user,
          username: submission[0].username,
          user_pic: submission[0].user_pic,
        },
        week: submission[0].week,
        description: submission[0].description,
        reviewed: reviewed,
        images: images,
        files: files,
        vod_link: submission[0].vod_link,
      },
    });
  } else {
    res.status(200).json({
      session,
      isAdmin,
      submissionData: {
        exists: false,
      },
    });
  }
};
