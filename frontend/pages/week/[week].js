import { Layout, Typography, Statistic, Row, Col, Progress } from "antd";
const { Content } = Layout;
const { Title } = Typography;
import Gfooter from "../../components/Gfooter";
import Head from "next/head";
import Gheader from "../../components/Gheader";
import prisma from "../../util/prisma";
import WeekTable from "../../components/WeekTable";

export default function Current({ data_str }) {
  const data = JSON.parse(data_str);

  const notReviewed = data.not_reviewed;
  const reviewed = data.reviewed;

  // console.log(notReviewed);

  return (
    <>
      <Head>
        <title>Gauntlet Bot - Current Week</title>
      </Head>
      <Layout className="layout">
        <Gheader activePage={"1"} />
        <Content style={{ padding: "0 50px" }}>
          <Title style={{ marginTop: "10px" }}>Current Week</Title>
          <h2>Week: {data.week_info.week} </h2>
          <h2>Theme: {data.week_info.theme}</h2>
          <Row style={{ marginBottom: "10px" }}>
            <Col>
              <Statistic
                title="# of Submissons"
                value={data.total_num}
                style={{
                  padding: "30px",
                  margin: "0px 10px 10px 0px",
                  background: "#212121",
                }}
              />
            </Col>
            <Col>
              <div
                style={{
                  background: "#212121",
                  width: "200px",
                  height: "124px",
                }}
              >
                <Statistic
                  title="Reviewed:"
                  value={data.reviewed_num}
                  suffix={`/ ${data.total_num}`}
                  style={{ padding: "30px 10px 0px 25px", float: "left" }}
                />
                <Progress
                  type="circle"
                  percent={data.reviewed_percentage}
                  width={70}
                  style={{ padding: "30px 0px 0px 10px", float: "left" }}
                />
              </div>
            </Col>
          </Row>
          <h2>Not Reviewed</h2>
          <WeekTable data={notReviewed} />
          <br />
          <h2>Reviewed</h2>
          <WeekTable data={reviewed} />
        </Content>
        <Gfooter />
      </Layout>
    </>
  );
}

export const getServerSideProps = async (ctx) => {
  const { week } = ctx.params;

  const selectedWeek = await prisma.gauntlet_weeks.findFirst({
    where: { week: parseInt(week) },
  });

  const notReviewed = await prisma.submissions.findMany({
    where: { gauntlet_week: selectedWeek.week, reviewed: false },
    include: {
      user_profile: true,
    },
    orderBy: [
      {
        createdAt: "asc",
      },
    ],
  });

  const reviewed = await prisma.submissions.findMany({
    where: { gauntlet_week: selectedWeek.week, reviewed: true },
    include: {
      user_profile: true,
    },
    orderBy: [
      {
        createdAt: "asc",
      },
    ],
  });

  const total = notReviewed.length + reviewed.length;
  const reviewed_num = reviewed.length;
  const reviewedPercentage = Math.floor((reviewed_num / total) * 100);
  console.log(total);

  const data_str = JSON.stringify({
    week_info: {
      week: selectedWeek.week,
      theme: selectedWeek.theme,
    },
    not_reviewed: notReviewed,
    reviewed: reviewed,
    total_num: total,
    reviewed_num: reviewed_num,
    reviewed_percentage: reviewedPercentage,
  });

  return {
    props: {
      data_str: data_str,
    },
  };
};
