import PreviousWeeksTable from "../components/tables";
import { Layout } from "antd";
import Gfooter from "../components/Gfooter";
import Head from "next/head";
import Gheader from "../components/Gheader";

const { Content } = Layout;

export default function Dashboard() {
  return (
    <>
      <Head>
        <title>Gauntlet Bot - Previous Weeks</title>
      </Head>
      <Layout className="layout">
        <Gheader activePage="2" />
        <Content style={{ padding: "0 50px" }}>
          <h1>Previous Weeks</h1>
          <PreviousWeeksTable />
        </Content>
        <Gfooter />
      </Layout>
    </>
  );
}
