import PreviousWeeksTable from "../components/tables";
import { Layout } from "antd";
import Gfooter from "../components/Gfooter";
import Link from "next/link";
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

// export const getServerSideProps = async (ctx) => {
//   console.log(ctx)
//   const weeks = await fetch(process.env.NEXTAUTH_URL + '/api/get-weeks')
//     .then(response => response.json())
//     .then(data => {
//       return data
//     })
//   console.log(weeks)

//   return {
//     props: {
//       weeks: weeks
//     }
//   }
// }
