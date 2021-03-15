import { Table, Tag } from 'antd'
import Link from 'next/link'
import useSWR from 'swr'

const GauntletWeeksTable = () => {
	const fetcher = url => fetch(url).then(r => r.json())
	const { data: weeks, error } = useSWR('/api/get-weeks', fetcher)

	if (error) return <div>Error Loading Table</div>
	if (!weeks) return <div>Loading Table...</div>

	const columns = [
		{
			title: 'Week',
			dataIndex: 'week',
			key: 'week'
		},
		{
			title: 'Theme',
			dataIndex: 'theme',
			key: 'theme'
		},
		{
			title: 'Description',
			dataIndex: 'description',
			key: 'description'
		}
	]

	return (
		<Table dataSource={weeks} columns={columns} />
	);
}



export default GauntletWeeksTable;

