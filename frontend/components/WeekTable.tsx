import { Alert, Avatar, Skeleton, Table, Tag } from "antd";
import Link from "next/link";

export default function CurrentWeekTable({ data }) {
  console.log(data);
  if (!data) return <Skeleton active />;

  const tableData = data.map((sub, index) => {
    return {
      key: index + 1,
      ...sub,
    };
  });

  const columns = [
    {
      title: "User",
      dataIndex: "username",
      key: "username",
      render: (text, record) => (
        <div style={{ verticalAlign: "middle" }}>
          <Avatar
            src={record.user_profile.user_pic}
            style={{ float: "left" }}
          />
          <p style={{ float: "left", fontSize: "15px", marginLeft: "10px" }}>
            {record.user_profile.username}
          </p>
        </div>
      ),
    },
    {
      title: "Reviewed?",
      dataIndex: "reviewed",
      key: "reviewed",
      render: (text, record) => (
        <>
          {record.reviewed ? (
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
      key: "action",
      render: (text, record) => (
        <Link href={`/review/${record.user}/${record.gauntlet_week}`}>
          <a>View</a>
        </Link>
      ),
    },
  ];

  return (
    <>
      <Table size={"small"} dataSource={tableData} columns={columns} />
    </>
  );
}
