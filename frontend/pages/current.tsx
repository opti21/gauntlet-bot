import { Layout, Typography, Row, Col, Progress, Statistic } from "antd";
const { Content } = Layout;
const { Title } = Typography;
import Gfooter from "../components/Gfooter";
import Head from "next/head";
import Gheader from "../components/Gheader";
import CurrentWeekTable from "../components/CurrentTable";
import useSWR from "swr";
import { WeekApiResponse } from "../types";
import Loading from "../components/Loading";

export default function Current() {
  const { data, error } = useSWR<WeekApiResponse>("/api/current-week");

  const notReviewed = data ? data.not_reviewed : [];
  const reviewed = data ? data.reviewed : [];
  const notReviewedNum = data ? data.not_reviewed.length : 0;
  const reviewedNum = data ? data.reviewed_num : 0;

  const h2Style = {
    textShadow: "2px 2px 13px #000000",
  };

  return (
    <>
      <Head>
        <title>Gauntlet Bot - Current Gauntlet</title>
      </Head>
      <Layout className="layout bg">
        <Gheader activePage={"1"} />
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
          {data ? (
            <>
              <h2 style={h2Style}>Week: {data.week_info.week} </h2>
              <h2 style={h2Style}>Theme: {data.week_info.theme}</h2>
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
                      value={data.reviewed_num || 0}
                      suffix={`/ ${data.total_num || 0}`}
                      style={{
                        padding: "30px 10px 0px 25px",
                        float: "left",
                      }}
                    />
                    <Progress
                      type="circle"
                      percent={data.reviewed_percentage || 0}
                      width={70}
                      style={{
                        padding: "30px 0px 0px 10px",
                        float: "left",
                      }}
                    />
                  </div>
                </Col>
              </Row>
              {notReviewedNum > 0 ? (
                <>
                  <h2 style={h2Style}>Not Reviewed</h2>
                  <CurrentWeekTable data={notReviewed} />
                </>
              ) : (
                <></>
              )}
              <br />
              {reviewedNum > 0 ? (
                <div style={{ paddingBottom: "20px" }}>
                  <h2 style={h2Style}>Reviewed</h2>
                  <CurrentWeekTable data={reviewed} />
                </div>
              ) : (
                <></>
              )}
            </>
          ) : (
            <Loading />
          )}
        </Content>
        <Gfooter />
      </Layout>
    </>
  );
}
