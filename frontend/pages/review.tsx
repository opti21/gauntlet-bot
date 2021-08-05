import { Alert, BackTop, Breadcrumb, Button, Typography } from "antd";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Gheader from "../components/Gheader";
import Gfooter from "../components/Gfooter";
import { Layout } from "antd";
const { Content } = Layout;
import Submission from "../components/Submission";
import { SubmissionResponse } from "../types";
import useSWR, { mutate } from "swr";
import Loading from "../components/Loading";
import { getSession, useUser } from "@auth0/nextjs-auth0";
import prisma from "../util/prisma";
import { useEffect, useState } from "react";
import { GetServerSideProps } from "next";

const { Title } = Typography;

export default function Review({ isAdmin }) {
  const { user, error: userError, isLoading } = useUser();
  console.log(isAdmin);

  console.log(user);
  const router = useRouter();
  const { submission: subID } = router.query;

  const { data, error } = useSWR<SubmissionResponse>(
    subID ? `/api/submission?subID=${subID}` : null
  );

  console.log(data);

  const startReview = async () => {
    const response = await fetch(
      `/api/start-review?user=${data.submission.user}&week=${data.submission.gauntlet_week}`
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
          {error ? (
            <Alert type="error" message="Error getting submission" />
          ) : null}
          {data ? (
            <>
              {data.submission ? (
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
                          {data.submission.user_profile.username}
                          's submission
                        </Title>
                        {data.show_button ? (
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
                      {data.show_sub ? <Submission data={data} /> : <></>}
                    </>
                  ) : (
                    <Submission data={data} />
                  )}
                </>
              ) : (
                <Alert message="Submission doesn't exist" type="error" />
              )}
            </>
          ) : (
            <Loading />
          )}
        </Content>
        <Gfooter />
      </Layout>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = getSession(req, res);
  let isAdmin = false;
  let isSubOwner = false;
  if (session) {
    const adminResponse = await prisma.admins.findFirst({
      where: {
        discord_id: session.user.sub.split("|")[2],
      },
    });
    console.log(session);
    console.log(adminResponse);
    if (adminResponse) isAdmin = true;
  }
  return {
    props: {
      isAdmin,
    },
  };
};
