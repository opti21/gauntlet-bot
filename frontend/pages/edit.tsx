import { Alert, Button, Layout, Typography } from "antd";
const { Content } = Layout;
const { Title } = Typography;
import Gfooter from "../components/Gfooter";
import Head from "next/head";
import Gheader from "../components/Gheader";
import Loading from "../components/Loading";
import SubmitForm from "../components/SubmitForm";
import { useUser } from "@auth0/nextjs-auth0";
import { withPageAuthRequired } from "@auth0/nextjs-auth0";
import useSWR from "swr";
import { useRouter } from "next/router";
import SubEditForm from "../components/SubEditForm";
import Swal from "sweetalert2";
import { toast } from "react-toastify";

export default withPageAuthRequired(function Edit() {
  const router = useRouter();
  const { submission: subID } = router.query;
  const { user, error: userError, isLoading } = useUser();

  const { data: submissionData, error: submissionError } = useSWR(
    user ? `/api/submissions?subID=${subID}` : null
  );

  return (
    <>
      <Head>
        <title>Gauntlet Bot - Edit</title>
      </Head>
      <Layout className="layout bg">
        <Gheader activePage={"4"} />
        <Content
          style={{
            padding: "0 10%",
          }}
        >
          <Title
            style={{
              marginTop: "10px",
              textShadow: "2px 2px 13px #000000",
            }}
          >
            Edit Submission
          </Title>
          {!userError && !submissionError ? (
            !isLoading && submissionData ? (
              submissionData.submission.user === user.sub.split("|")[2] ||
              submissionData.is_admin ? (
                <SubEditForm submission={submissionData.submission} />
              ) : (
                <Alert
                  style={{ marginBottom: "20px" }}
                  type="error"
                  message="This is not your submission"
                />
              )
            ) : (
              <Loading />
            )
          ) : (
            <Alert
              style={{ marginBottom: "20px" }}
              type="error"
              message="Error fetching necessary data"
            />
          )}
        </Content>
        <Gfooter />
      </Layout>
    </>
  );
});
