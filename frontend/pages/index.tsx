import { Layout, Typography, Row, Col, Progress, Statistic } from "antd";
const { Content } = Layout;
const { Title } = Typography;
import Gfooter from "../components/Gfooter";
import Head from "next/head";
import Gheader from "../components/Gheader";
import CurrentWeekTable from "../components/CurrentTable";
import useSWR from "swr";
import Loading from "../components/Loading";
import { useRouter } from "next/router";

export default function Current() {
  const { data, error } = useSWR("/api/");

  const router = useRouter();
  const { submission: subID } = router.query;

  const h2Style = {
    textShadow: "2px 2px 13px #000000",
  };

  // console.log(notReviewed);

  // return <>test</>;

  return (
    <>
      <Head>
        <title>Gauntlet Bot - Current Week</title>
      </Head>
      <Layout className="layout bg">
        <Gheader activePage={-1} />
        <Content
          style={{
            padding: "0 10%",
          }}
        >
          <Title
            style={{
              marginTop: "25px",
              marginBottom: "100px",
              textShadow: "2px 2px 13px #000000",
              fontSize: "100px",
            }}
          >
            Gauntlet
            <div>Bot</div>
          </Title>
        </Content>
        <Gfooter />
      </Layout>
    </>
  );
}
