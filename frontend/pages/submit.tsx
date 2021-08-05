import { Alert, Layout, Typography } from "antd";
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

export default withPageAuthRequired(function Submit() {
  const { user, error: userError, isLoading } = useUser();
  const { data, error: statusError } = useSWR(
    user ? "/api/submission-status" : null
  );

  return (
    <>
      <Head>
        <title>Gauntlet Bot - Submit</title>
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
            Submit
          </Title>
          {!userError && !statusError ? (
            !isLoading && data ? (
              !data.already_submitted ? (
                <SubmitForm user={user} />
              ) : (
                <Alert
                  style={{ marginBottom: "20px" }}
                  type="info"
                  message="You have already submitted this week"
                />
              )
            ) : (
              <Loading />
            )
          ) : (
            <Alert
              style={{ marginBottom: "20px" }}
              type={"error"}
              message="Error fetching necessary data"
            />
          )}
        </Content>
        <Gfooter />
      </Layout>
    </>
  );
});
