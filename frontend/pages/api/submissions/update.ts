import { withApiAuthRequired } from "@auth0/nextjs-auth0";
import * as yup from "yup";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "../../../util/prisma";

interface updateAPI extends NextApiRequest {
  query: {
    subID: string;
  };
}

export default withApiAuthRequired(async function submitApi(
  req: updateAPI,
  res: NextApiResponse
) {
  if (req.method === "PUT") {
    const { subID } = req.query;
    if (subID) {
      const formSchema = yup.object().shape({
        description: yup.string().required(),
        files: yup.array().of(yup.number()),
      });

      const isValid = formSchema.validate(req.body).catch((err) => {
        console.error(err);
        res.status(400).json({ success: false, error: "Validation Error" });
      });
      if (isValid) {
        const idsForFiles = [];
        req.body.files.forEach((file) => {
          idsForFiles.push({ id: file });
        });
        const updateResponse = await prisma.submissions
          .update({
            where: {
              id: parseInt(subID),
            },
            data: {
              description: req.body.description,
              uploaded_files: {
                connect: idsForFiles,
              },
            },
          })
          .catch((e) => {
            console.error(e);
            res.status(500).json({
              success: false,
              message: "Prisma couldn't update submission",
            });
          });
        if (updateResponse) {
          res.status(200).json({
            success: true,
            sub_id: updateResponse.id,
            message: "submission updated",
          });
        }
      }
    } else {
      res.status(400).json({ success: false, error: "No subID provided" });
    }
  } else {
    res.status(405).json({ success: false, error: "Method not allowed" });
  }
});
