import { useState } from "react";
import { Alert, BackTop, Breadcrumb, Button, Typography } from "antd";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import Gheader from "../../components/Gheader";
import Gfooter from "../../components/Gfooter";
import { Layout } from "antd";
const { Content } = Layout;
import Submission from "../../components/Submission";
import prisma from "../../util/prisma";
import { getSession } from "next-auth/client";

const { Title } = Typography;

export default function Review({ data_str }) {
  const data = JSON.parse(data_str);
  console.log(data);

  const [showSubmission, setShowSubmission] = useState(data.show_sub);
  const [showReviewButton, setShowReviewButton] = useState(data.show_button);

  const startReview = async () => {
    setShowSubmission(true);
    setShowReviewButton(false);
    const response = await fetch(
      `/api/start-review/${data.submission.user}/${data.submission.gauntlet_week}`
    ).then((r) => r.json());
    console.log(response);
    if (!response.error) {
      setShowSubmission(true);
      setShowReviewButton(false);
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
                      {showSubmission ? <Submission data={data} /> : <></>}
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

export const getServerSideProps = async (ctx) => {
  const session = await getSession(ctx);
  console.log(session);
  const params = ctx.params.sub;
  const submission = await prisma.submissions.findFirst({
    where: {
      user: params[0],
      gauntlet_week: parseInt(params[1]),
    },
    include: {
      user_profile: true,
    },
  });

  let images = [];
  let files = [];

  if (submission) {
    if (submission.attachments.length > 0) {
      submission.attachments.forEach((attachment, index) => {
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
  }

  let isAdmin = false;

  if (session) {
    const admin = await prisma.admins.findFirst({
      where: {
        twitch_username: session.user.name,
      },
    });
    console.log(session.user.name);

    if (admin) {
      isAdmin = true;
    }
  }

  // console.log(submission);
  let showButton = false;
  let showSub = false;

  if (submission) {
    if (submission.reviewed === false) {
      showButton = true;
    } else {
      showSub = true;
    }
  }

  return {
    props: {
      data_str: JSON.stringify({
        submission: submission,
        images: images,
        files: files,
        isAdmin: isAdmin,
        show_button: showButton,
        show_sub: showSub,
      }),
    },
  };
};
