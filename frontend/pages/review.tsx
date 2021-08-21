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

  const startReview = async () => {
    const response = await fetch(
      `/api/start-review?user=${data?.submission.user_profile.id}&week=${data?.submission.gauntlet_week}`
    ).then((r) => r.json());
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
