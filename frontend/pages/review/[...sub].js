import { useState } from "react";
import { Alert, BackTop, Breadcrumb, Button, Typography } from "antd";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Gheader from "../../components/Gheader";
import Gfooter from "../../components/Gfooter";
import { Layout } from "antd";
import useSWR, { mutate } from "swr";
const { Content } = Layout;
import Submission from "../../components/Submission";

const { Title } = Typography;

export default function Review() {
  const router = useRouter();
  const { sub } = router.query;
  console.log(sub);
  const fetcher = (url) => fetch(url).then((r) => r.json());

  const { data, error } = useSWR(
    sub ? `/api/submission/${sub[0]}/${sub[1]}` : null,
    fetcher
  );

  if (data) {
    console.log(data);
  }

  const startReview = async () => {
    const response = await fetch(
      `/api/start-review/${data.submissionData.user.id}/${data.submissionData.week}`
    ).then((r) => r.json());
    console.log(response);
    if (!response.error) {
      mutate(`/api/submission/${sub[0]}/${sub[1]}`);
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
              {data.submissionData.exists ? (
                <>
                  {data.isAdmin ? (
                    <>
                      <div style={{ width: "100%", textAlign: "center" }}>
                        <Title>
                          {data.submissionData.user.username}'s submission
                        </Title>
                        {!data.submissionData.reviewed ? (
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
                      {data.submissionData.reviewed ? (
                        <Submission submissionData={data.submissionData} />
                      ) : (
                        <></>
                      )}
                    </>
                  ) : (
                    <Submission submissionData={data.submissionData} />
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
