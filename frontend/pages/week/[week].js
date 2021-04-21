import { useRouter } from "next/router";
import { Layout, Typography } from "antd";
const { Content } = Layout;
const { Title } = Typography;
import Gfooter from "../../components/Gfooter";
import Head from "next/head";
import Gheader from "../../components/Gheader";
import WeekTable from "../../components/WeekTable";
import { connectToDatabase } from "../../util/mongodb_backend";

export default function Current({ weekData }) {
  console.log(weekData);
  return (
    <>
      <Head>
        <title>Gauntlet Bot - Week</title>
      </Head>
      <Layout className="layout">
        <Gheader activePage={"2"} />
        <Content style={{ padding: "0 50px" }}>
          <Title style={{ marginTop: "10px" }}>Current Week</Title>
          <WeekTable weekData={{ weekData }} />
        </Content>
        <Gfooter />
      </Layout>
    </>
  );
}

export async function getServerSideProps(context) {
  const { db } = await connectToDatabase();
  const { week } = context.params;
  // console.log(week);

  const selectedWeek = await db
    .collection("gauntlet weeks")
    .find({ week: parseInt(week) })
    .project({ _id: 0 })
    .toArray();

  // console.log(selectedWeek);

  const submissionsData = await db
    .collection("submissions")
    .find({
      week: parseInt(week),
      submitted: true,
    })
    .project({ _id: 0 })
    .toArray();

  let submissions = submissionsData.map((sub, index) => {
    return {
      key: index + 1,
      ...sub,
    };
  });

  // console.log(submissions);

  return {
    props: {
      weekData: {
        week_info: JSON.stringify(selectedWeek[0]),
        submissions: JSON.stringify(submissions),
      },
    },
  };
}
