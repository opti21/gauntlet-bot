import { Avatar, Skeleton, Table, Tag } from "antd";
import Link from "next/link";
import { Submission } from "../types";
import * as removeMd from "remove-markdown";

export default function UserSubmissionTable({ data }: { data: Submission[] }) {
  if (!data) return <Skeleton active />;

  const tableData = data.map((sub, index) => {
    return {
      key: index + 1,
      ...sub,
    };
  });

  const pagination: object = { position: ["bottomRight", "topRight"] };

  const columns = [
    {
      title: "Week",
      dataIndex: "week",
      key: "week",
      render: (text, record) => (
        <p style={{ float: "left", fontSize: "15px", marginLeft: "10px" }}>
          {record.gauntlet_week}
        </p>
      ),
    },
    {
      title: "Theme",
      dataIndex: "theme",
      key: "theme",
      render: (text, record) => <p>{record.gauntlet_weeks.theme}</p>,
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
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text, record) => (
        <>
          <p>{removeMd(record.description.slice(0, 50)) + "..."}</p>
        </>
      ),
    },
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (text, record) => (
        <Link href={`/review?submission=${record.id}`}>
          <a>View</a>
        </Link>
      ),
    },
  ];

  return (
    <>
      <Table
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          borderRadius: "25px",
          padding: "10px 0px 10px 0px",
        }}
        size={"small"}
        dataSource={tableData}
        columns={columns}
        pagination={pagination}
      />
    </>
  );
}
