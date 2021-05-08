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

const { Title } = Typography;

export default function Review() {
  const router = useRouter();
  const { user, week } = router.query;

  const { data, error } = useSWR<SubmissionResponse>(
    user && week ? `/api/submission?user=${user}&week=${week}` : null
  );

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
      <Layout className="layout">
        <BackTop />
        <Gheader />
        <Content style={{ padding: "30px 50px" }}>
          {/* <Breadcrumb style={{ marginTop: "10px", marginBottom: "10px" }}>
            <Breadcrumb.Item>
              <Link href="/current">
                <a>Current Week</a>
              </Link>
            </Breadcrumb.Item>
            <Breadcrumb.Item>Submission</Breadcrumb.Item>
          </Breadcrumb> */}
          {data ? (
            <>
              {data.submission ? (
                <>
                  {data.isAdmin ? (
                    <>
                      <div style={{ width: "100%", textAlign: "center" }}>
                        <Title>
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
            <p> Loading...</p>
          )}
        </Content>
        <Gfooter />
      </Layout>
    </>
  );
}
