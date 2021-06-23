import { useState } from "react";
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

const { Title } = Typography;

export default function Review() {
  const router = useRouter();
  const { user, week } = router.query;

  const { data, error } = useSWR<SubmissionResponse>(
    user && week ? `/api/submission?user=${user}&week=${week}` : null
  );

  console.log(data);

  const startReview = async () => {
    const response = await fetch(
      `/api/start-review?user=${data.submission.user}&week=${data.submission.gauntlet_week}`
    ).then((r) => r.json());
    console.log(response);
    if (!response.error) {
      mutate(`/api/submission?user=${user}&week=${week}`);
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
        <Gheader />
        <Content style={{ padding: "30px 50px" }}>
          {data ? (
            <>
              {data.submission ? (
                <>
                  {data.isAdmin ? (
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
