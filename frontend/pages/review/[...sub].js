import { useState } from 'react'
import { Breadcrumb } from 'antd';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router'
import Gheader from '../../components/Gheader';
import Gfooter from '../../components/Gfooter';
import { Layout } from 'antd'
import useSWR from 'swr';
import { connectToDatabase } from '../../util/mongodb';
const { Content } = Layout;
import Submission from '../../components/Submission'


const Review = (props) => {
    const submission = props.submission
    const fetcher = url => fetch(url).then(r => r.json())

    const [show, setShow] = useState(false)

    return <>
        <Head>
            <title>Gauntlet Bot - Submission</title>
        </Head>
        <Layout className="layout">
            <Gheader />
            <Content style={{ padding: '0 50px' }}>
                <Breadcrumb>
                    <Breadcrumb.Item>
                        <Link href="/current"><a>Current Week</a></Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        Submission
                </Breadcrumb.Item>
                </Breadcrumb>
                <h1>Submission</h1>
                {submission.exists ? (
                    <Submission submission={submission} />
                ) : (
                    <p>Submission doesn't exist</p>
                )}
            </Content>
            <Gfooter />

        </Layout>
    </>
}

export default Review

export async function getServerSideProps(ctx) {
    const { db } = await connectToDatabase();
    const submission = await db
        .collection("submissions")
        .find({ user: parseInt(ctx.params.sub[0]), week: parseInt(ctx.params.sub[1]) })
        .project({ _id: 0 })
        .toArray()

    // console.log(submission)

    if (submission.length > 0) {
        return {
            props: {
                submission: {
                    exists: true,
                    user: {
                        username: submission[0].username,
                        user_pic: submission[0].user_pic
                    },
                    description: submission[0].description,
                    files: submission[0].attachments,
                    reviewed: submission[0].reviewed
                }
            }
        }
    } else {
        return {
            props: {
                submission: {
                    exists: false
                }
            }
        }
    }

}