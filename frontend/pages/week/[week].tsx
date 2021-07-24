import {
  Layout,
  Typography,
  Row,
  Col,
  Progress,
  Statistic,
  Skeleton,
} from "antd";
const { Content } = Layout;
const { Title } = Typography;
import Gfooter from "../../components/Gfooter";
import Head from "next/head";
import Gheader from "../../components/Gheader";
import CurrentWeekTable from "../../components/CurrentTable";
import useSWR from "swr";
import { WeekApiResponse } from "../../types";
import { useRouter } from "next/router";

export default function Week() {
  const router = useRouter();
  const { week } = router.query;
  const { data, error } = useSWR<WeekApiResponse>(
    week ? `/api/week?week_num=${week}` : null
  );
  console.log(data);

  const notReviewed = data?.not_reviewed;
  const reviewed = data?.reviewed;

  // console.log(notReviewed);

  // return <>test</>;

  return (
    <>
      <Head>
        <title>Gauntlet Bot - Previous Week</title>
      </Head>
      <Layout className="layout">
        <Gheader activePage={-1} />
        <Content style={{ padding: "0 50px" }}>
          {data ? (
            <>
              <Title style={{ marginTop: "10px" }}>
                {data.week_info.theme} - Week {data.week_info.week}
              </Title>
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
              <CurrentWeekTable data={notReviewed} />
              <br />
              <h2>Reviewed</h2>
              <CurrentWeekTable data={reviewed} />
            </>
          ) : (
            <Skeleton></Skeleton>
          )}
        </Content>
        <Gfooter />
      </Layout>
    </>
  );
}
