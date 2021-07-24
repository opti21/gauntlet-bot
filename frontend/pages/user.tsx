import {
  Layout,
  Typography,
  Row,
  Col,
  Progress,
  Statistic,
  Card,
  Avatar,
} from "antd";
const { Content } = Layout;
const { Title } = Typography;
import Gfooter from "../components/Gfooter";
import Head from "next/head";
import Gheader from "../components/Gheader";
import useSWR from "swr";
import { WeekApiResponse } from "../types";
import Loading from "../components/Loading";
import { useUser } from "@auth0/nextjs-auth0";

export default function Current() {
  const userData = useSWR("/api/get-user");
  const { user, error: userError, isLoading } = useUser();

  console.log(reviewedNum);

  const h2Style = {
    textShadow: "2px 2px 13px #000000",
  };

  return (
    <>
      <Head>
        <title>Gaulet Bot - {}</title>
      </Head>
      <Layout className="layout bg">
        <Gheader activePage={"2"} />
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
            Current Week
          </Title>
          <Card title="Submission By:" style={{ margin: "0px 10px 0px 0px" }}>
            <div style={{ textAlign: "center" }}>
              <Avatar size={64} src={data.submission.user_profile.user_pic} />
              <Title level={4}>{data.submission.user_profile.username}</Title>
            </div>
          </Card>
        </Content>
        <Gfooter />
      </Layout>
    </>
  );
}
