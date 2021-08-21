import { Alert, BackTop, Button, Typography } from "antd";
import Head from "next/head";
import Gheader from "../components/Gheader";
import Gfooter from "../components/Gfooter";
import { Layout } from "antd";
const { Content } = Layout;
import SubmissionContent from "../components/Submission";
import { FrontendSubmission } from "../types";
import useSWR, { mutate } from "swr";
import Loading from "../components/Loading";
import prisma from "../util/prisma";
import { toast } from "react-toastify";
import { useRouter } from "next/router";

const { Title } = Typography;

interface reviewProps {
  isAdmin: boolean;
  isSubOwner: boolean;
  subExists: string;
  submission: FrontendSubmission;
  showReviewButton: boolean;
  showSubInit: boolean;
  subID: string;
}

export default function Review() {
  const router = useRouter();
  const { submission: subID } = router.query;
  const { data, error } = useSWR(
    subID ? `/api/submissions?subID=${subID}` : null
  );
  console.log(data);

  const startReview = async () => {
    const response = await fetch(
      `/api/start-review?user=${data?.submission.user_profile.id}&week=${data?.submission.gauntlet_week}`
    ).then((r) => r.json());
    console.log(response);
    if (!response.error) {
      mutate(`/api/submissions?subID=${subID}`);
    } else {
      toast.error("Error starting review");
      console.error(response);
    }
  };

  return (
    <>
      <Head>
        <title>Gauntlet Bot - Submission</title>
      </Head>
      <Layout className="layout bg">
        <BackTop />
        <Gheader activePage={-1} />
        <Content style={{ padding: "30px 50px" }}>
          <>
            {!subID ? (
              <Alert message="No submission ID provided" type="error" />
            ) : data ? (
              <>
                {data.is_admin ? (
                  <>
                    <div
                      style={{
                        textAlign: "center",
                      }}
                    >
                      <Title
                        style={{
                          width: "100%",
                          textShadow: "2px 2px 13px #000000",
                        }}
                      >
                        {data.submission.user_profile.username}
                        's submission
                      </Title>
                      {!data.show_sub ? (
                        <>
                          <Button
                            type="primary"
                            size="large"
                            onClick={() => startReview()}
                          >
                            Start Review
                          </Button>
                          <Button
                            type="primary"
                            size="large"
                            style={{ marginLeft: "20px" }}
                            onClick={() =>
                              router.push(
                                `/edit?submission=${data.submission.id}`
                              )
                            }
                          >
                            Edit/View
                          </Button>
                        </>
                      ) : (
                        <></>
                      )}
                    </div>
                    {data.show_sub ? (
                      <SubmissionContent
                        submission={data.submission}
                        images={data.images}
                        files={data.files}
                        isAdmin={data.is_admin}
                        isSubOwner={data.is_sub_owner}
                      />
                    ) : (
                      <></>
                    )}
                  </>
                ) : (
                  <SubmissionContent
                    submission={data.submission}
                    images={data.images}
                    files={data.files}
                    isAdmin={data.is_admin}
                    isSubOwner={data.is_sub_owner}
                  />
                )}
              </>
            ) : !error ? (
              <Loading />
            ) : (
              <Alert type="error" message="Error getting submission" />
            )}
          </>
        </Content>
        <Gfooter />
      </Layout>
    </>
  );
}

// export const getServerSideProps: GetServerSideProps = async ({
//   req,
//   res,
//   query,
// }) => {
//   const session = getSession(req, res);
//   let isAdmin = false;
//   let isSubOwner = false;
//   if (session) {
//     const adminResponse = await prisma.admins.findFirst({
//       where: {
//         discord_id: session.user.sub.split("|")[2],
//       },
//     });
//     if (adminResponse) isAdmin = true;
//   }

//   const { submission: subID } = query;

//   if (subID) {
//     const submission = await prisma.submissions.findFirst({
//       where: {
//         // @ts-ignore
//         id: parseInt(subID),
//       },
//       include: {
//         user_profile: true,
//         uploaded_files: true,
//       },
//     });
//     console.log(submission);

//     if (submission && session) {
//       // Checks if logged in user is the ownwer of the requested submission
//       if (submission.user_profile.id === session.user.sub.split("|")[2]) {
//         isSubOwner = true;
//       }
//     }

//     // console.log(submission);
//     let showReviewButton: Boolean = false;
//     let showSubInit: Boolean = false;
//     let images = [];
//     let files = [];
//     let subExists = false;

//     if (submission) {
//       subExists = true;
//       if (submission.reviewed === false) {
//         showReviewButton = true;
//       } else {
//         showSubInit = true;
//       }

//       // console.time("submission_file_parse");
//       submission.images.forEach((imageStr, index) => {
//         const image = JSON.parse(imageStr);
//         images.push(image);
//       });

//       submission.files.forEach((fileStr, index) => {
//         const file = JSON.parse(fileStr);
//         files.push(file);
//       });

//       submission.uploaded_files.forEach((file, index) => {
//         if (file.type.includes("image")) {
//           images.push(file);
//         } else {
//           files.push(file);
//         }
//       });

//       // console.timeEnd("submission_file_parse");
//     }

//     let subData = null;

//     if (subExists) {
//       subData = {
//         id: submission.id,
//         description: submission.description,
//         user_profile: {
//           id: submission.user_profile.id,
//           username: submission.user_profile.username,
//           user_pic: submission.user_profile.user_pic,
//         },
//         gauntlet_week: submission?.gauntlet_week,
//         images,
//         files,
//       };
//     }

//     return {
//       props: {
//         isAdmin,
//         isSubOwner,
//         subExists,
//         submission: subData,
//         showReviewButton,
//         showSubInit,
//         subID,
//       },
//     };
//   }
// };
