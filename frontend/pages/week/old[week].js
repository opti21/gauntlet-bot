import { useRouter } from "next/router";
import { Layout, Typography } from "antd";
const { Content } = Layout;
const { Title } = Typography;
import Gfooter from "../../components/Gfooter";
import Head from "next/head";
import Gheader from "../../components/Gheader";
import WeekTable from "../../components/WeekTable";
import prisma from "../../util/prisma";

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
          <WeekTable weekData={{ weekData }} />
        </Content>
        <Gfooter />
      </Layout>
    </>
  );
}

export async function getServerSideProps(context) {
  const { week } = context.params;
  // console.log(week);
  const selectedWeek = await prisma.gauntlet_weeks.findFirst({
    where: { week: parseInt(week) },
  });
  // console.log(activeWeek);
  const submissionsData = await prisma.submissions.findMany({
    where: { gauntlet_week: selectedWeek.week },
    include: {
      user_profile: true,
    },
    orderBy: [
      {
        createdAt: "asc",
      },
    ],
  });

  // console.log(selectedWeek);

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
        week_info: JSON.stringify(selectedWeek),
        submissions: JSON.stringify(submissions),
      },
    },
  };
}
