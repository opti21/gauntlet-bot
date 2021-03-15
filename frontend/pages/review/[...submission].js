import { Breadcrumb } from 'antd';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router'
import Gheader from '../../components/Gheader';
import Gfooter from '../../components/Gfooter';
import { Layout } from 'antd'
const { Content } = Layout;

const Submission = () => {
    const router = useRouter()
    const { submission } = router.query

    return <>
        <Head>
            <title>Gauntlet Bot - Submission</title>
        </Head>
        <Layout className="layout">
            <Gheader />
            <Breadcrumb>
                <Breadcrumb.Item>
                    <Link href="/current"><a>Current</a></Link>
                </Breadcrumb.Item>
                <Breadcrumb.Item>
                    Submission
                </Breadcrumb.Item>
            </Breadcrumb>
            <Content style={{ padding: '0 50px' }}>
                <h1>Submission</h1>
                <p>Submission will go here</p>
                <p>User: {submission[0]}</p>
                <p>Week: {submission[1]}</p>
            </Content>
            <Gfooter />

        </Layout>
    </>
}

export default Submission