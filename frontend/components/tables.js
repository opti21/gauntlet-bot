import { Table, Tag } from "antd";
import Link from "next/link";
import useSWR from "swr";

const PreviousWeeksTable = () => {
  const fetcher = (url) => fetch(url).then((r) => r.json());
  const { data: weeks, error } = useSWR("/api/get-weeks", fetcher);

  if (error) return <div>Error Loading Table</div>;
  if (!weeks) return <div>Loading Table...</div>;

  const columns = [
    {
      title: "Week",
      dataIndex: "week",
      key: "week",
    },
    {
      title: "Theme",
      dataIndex: "theme",
      key: "theme",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (text, record) => (
        <Link href={`/week/${record.week}`}>
          <a>View</a>
        </Link>
      ),
    },
  ];

  return <Table dataSource={weeks} columns={columns} />;
};

export default PreviousWeeksTable;
