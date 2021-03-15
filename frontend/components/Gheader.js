import { Layout, Menu } from 'antd'
const { Header } = Layout;
import Link from 'next/link'

export default function Gheader(props) {
    return (
        <div>
            <Header>
                <div className="logo" />
                <Menu theme="dark" mode="horizontal" defaultSelectedKeys={[props.activePage]}>
                    <Menu.Item key="1"><Link href="/current">Current</Link></Menu.Item>
                    <Menu.Item key="2"><Link href="/previous-weeks">Previous Weeks</Link></Menu.Item>
                </Menu>
            </Header>
        </div>
    );
}