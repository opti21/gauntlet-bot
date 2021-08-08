import { Alert, BackTop, Breadcrumb, Button, Card, Typography } from "antd";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Gheader from "../components/Gheader";
import Gfooter from "../components/Gfooter";
import { Layout } from "antd";
const { Content } = Layout;
import SubmissionContent from "../components/Submission";
import { FrontendSubmission, Submission, SubmissionResponse } from "../types";
import useSWR, { mutate } from "swr";
import Loading from "../components/Loading";
import { getSession, useUser } from "@auth0/nextjs-auth0";
import prisma from "../util/prisma";
import { useEffect, useState } from "react";
import { GetServerSideProps } from "next";

const { Title } = Typography;

interface reviewProps {
  isAdmin: boolean;
  isSubOwner: boolean;
  subExists: string;
  submission: FrontendSubmission;
  showReviewButton: boolean;
  showSub: boolean;
  subID: string;
}

export default function Review({
  isAdmin,
  isSubOwner,
  submission,
  subID,
  subExists,
  showReviewButton,
  showSub,
}: reviewProps) {
  const { user, error: userError, isLoading } = useUser();

  const startReview = async () => {
    const response = await fetch(
      `/api/start-review?user=${submission.user_profile.id}&week=${submission.gauntlet_week}`
    ).then((r) => r.json());
    console.log(response);
    if (!response.error) {
      mutate(`/api/submission?subID=${subID}`);
    } else {
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
          {/* {error ? (
            <Alert type="error" message="Error getting submission" />
          ) : null} */}
          <>
            {subExists ? (
              <>
                {isAdmin ? (
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
                        {submission.user_profile.username}
                        's submission
                      </Title>
                      {showReviewButton ? (
                        <Button
                          type="primary"
                          size="large"
                          onClick={() => startReview()}
                        >
                          Start Review
                        </Button>
                      ) : (
                        <></>
                      )}
                    </div>
                    {showSub ? (
                      <SubmissionContent
                        submission={submission}
                        isAdmin={isAdmin}
                        isSubOwner={isSubOwner}
                      />
                    ) : (
                      <></>
                    )}
                  </>
                ) : (
                  <SubmissionContent
                    submission={submission}
                    isAdmin={isAdmin}
                    isSubOwner={isSubOwner}
                  />
                )}
              </>
            ) : (
              <Alert message="Submission doesn't exist" type="error" />
            )}
          </>
        </Content>
        <Gfooter />
      </Layout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  res,
  query,
}) => {
  const session = getSession(req, res);
  let isAdmin = false;
  let isSubOwner = false;
  // if (session) {
  //   const adminResponse = await prisma.admins.findFirst({
  //     where: {
  //       discord_id: session.user.sub.split("|")[2],
  //     },
  //   });
  //   console.log(session);
  //   console.log(adminResponse);
  //   if (adminResponse) isAdmin = true;
  // }

  const { submission: subID } = query;

  const submission: Submission = await prisma.submissions.findFirst({
    where: {
      // @ts-ignore
      id: parseInt(subID),
    },
    include: {
      user_profile: true,
    },
  });

  if (submission && session) {
    // Checks if logged in user is the ownwer of the requested submission
    if (submission.user_profile.id === session.user.sub.split("|")[2]) {
      isSubOwner = true;
    }
  }

  // console.log(submission);
  let showReviewButton: Boolean = false;
  let showSub: Boolean = false;
  let images: String[] = [];
  let files: File[] = [];
  let subExists = false;

  if (submission) {
    subExists = true;
    if (submission.reviewed === false) {
      showReviewButton = true;
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

  let subData = null;

  if (subExists) {
    subData = {
      id: submission.id,
      description: submission.description,
      user_profile: {
        id: submission.user_profile.id,
        username: submission.user_profile.username,
        user_pic: submission.user_profile.user_pic,
      },
      gauntlet_week: submission?.gauntlet_week,
      images,
      files,
    };
  }

  return {
    props: {
      isAdmin,
      isSubOwner,
      subExists,
      submission: subData,
      showReviewButton,
      showSub,
      subID,
    },
  };
};
