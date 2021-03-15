import { Table, Tag } from "antd"
import Link from "next/link"
import useSWR from "swr"


export default function CurrentWeekTable() {
    const fetcher = url => fetch(url).then(r => r.json())
    const { data, error } = useSWR('/api/current-week', fetcher)

    if (error) return <div>Error Loading Table</div>
    if (!data) return <div>Loading Table...</div>

    const columns = [
        {
            title: 'User',
            dataIndex: 'username',
            key: 'username'
        },
        {
            title: 'Reviewed?',
            dataIndex: 'reviewed',
            key: 'reviewed',
            render: text => (
                <>
                    {text === 'true' ?
                        <Tag color={'green'}>Reviewed</Tag> :
                        <Tag color={'red'}>Not Reviewed</Tag>
                    }
                </>
            )
        },
        {
            title: 'Action',
            dataIndex: 'action',
            render: (text, record) => (
                <Link href={`/review/${record.user}/${record.week}`}><a>View</a></Link>
            )
        }
    ]



    return (
        <Table dataSource={data.submissions} columns={columns} />
    );

}