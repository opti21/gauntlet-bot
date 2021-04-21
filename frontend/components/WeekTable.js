import {
  Alert,
  Avatar,
  Skeleton,
  Table,
  Tag,
  Statistic,
  Row,
  Col,
  Progress,
} from "antd";
import Link from "next/link";

export default function WeekTable(props) {
  const { weekData } = props;

  console.log(weekData.weekData.week_info);
  const data = {
    week_info: JSON.parse(weekData.weekData.week_info),
    submissions: JSON.parse(weekData.weekData.submissions),
  };

  let reviewedNum = 0;
  let reviewedPercentage;

  if (data) {
    if (data.submissions) {
      data.submissions.forEach((sub) => {
        if (sub.reviewed === "true") {
          ++reviewedNum;
        }
      });
      reviewedPercentage = Math.floor(
        (reviewedNum / data.submissions.length) * 100
      );
      console.log(reviewedPercentage);
    }
  }

  if (!data) return <Skeleton active />;

  const columns = [
    {
      title: "User",
      dataIndex: "username",
      render: (text, record) => (
        <div style={{ verticalAlign: "middle" }}>
          <Avatar src={record.user_pic} style={{ float: "left" }} />
          <p style={{ float: "left", fontSize: "15px", marginLeft: "10px" }}>
            {record.username}
          </p>
        </div>
      ),
    },
    {
      title: "Reviewed?",
      dataIndex: "reviewed",
      key: "reviewed",
      render: (text) => (
        <>
          {text === "true" ? (
            <Tag color={"green"}>Reviewed</Tag>
          ) : (
            <Tag color={"red"}>Not Reviewed</Tag>
          )}
        </>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (text, record) => (
        <Link href={`/review/${record.user}/${record.week}`}>
          <a>View</a>
        </Link>
      ),
    },
  ];

  return (
    <>
      <h2>Week: {data.week_info.week} </h2>
      <h2>Theme: {data.week_info.theme}</h2>
      <Row style={{ marginBottom: "10px" }}>
        <Col>
          <Statistic
            title="# of Submissons"
            value={data.submissions.length}
            style={{
              padding: "30px",
              margin: "0px 10px 10px 0px",
              background: "#212121",
            }}
          />
        </Col>
        <Col>
          <div
            style={{ background: "#212121", width: "200px", height: "124px" }}
          >
            <Statistic
              title="Reviewed:"
              value={reviewedNum}
              suffix={`/ ${data.submissions.length}`}
              style={{ padding: "30px 10px 0px 25px", float: "left" }}
            />
            <Progress
              type="circle"
              percent={reviewedPercentage}
              width={70}
              style={{ padding: "30px 0px 0px 10px", float: "left" }}
            />
          </div>
        </Col>
      </Row>
      <Table dataSource={data.submissions} columns={columns} />
    </>
  );
}
