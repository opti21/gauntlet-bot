import { useState } from 'react'
import { Alert, BackTop, Breadcrumb, Button, Typography } from 'antd';
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
import Sider from 'antd/lib/layout/Sider';

const { Title } = Typography


const Review = (props) => {
    const submissionData = props.submissionData

    const [showSubmission, setShowSubmission] = useState(submissionData.reviewed)

    const startReview = async () => {
        const response = await fetch(`/api/start-review/${submissionData.user.id}/${submissionData.week}`).then(r => r.json())
        console.log(response)
        if (!response.error) {
            setShowSubmission(true)
        } else {
            console.error(response)
        }
    }

    return <>
        <Head>
            <title>Gauntlet Bot - Submission</title>
        </Head>
        <Layout className="layout">
            <BackTop />
            <Gheader />
            <Content style={{ padding: '0 50px' }}>
                <Breadcrumb style={{ marginTop: "10px", marginBottom: "10px" }}>
                    <Breadcrumb.Item>
                        <Link href="/current"><a>Current Week</a></Link>
                    </Breadcrumb.Item>
                    <Breadcrumb.Item>
                        Submission
                </Breadcrumb.Item>
                </Breadcrumb>
                {submissionData.exists ? (
                    <>
                        <div style={{ width: "100%", textAlign: "center" }}>
                            <Title>{submissionData.user.username}'s submission</Title>
                            {!showSubmission ?
                                <Button type="primary" size="large" onClick={startReview}>Start Review</Button> :
                                <></>
                            }
                        </div>
                        {showSubmission ?
                            <Submission submissionData={submissionData} /> :
                            <></>
                        }
                    </>
                ) : (
                    <Alert message="Submission doesn't exist" type="error" />
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
    let reviewed
    if (submission[0].reviewed === "true") {
        reviewed = true
    } else {
        reviewed = false
    }

    const attachmentArray = JSON.parse(submission[0].attachments)
    console.log(attachmentArray)

    let images = []
    let files = []

    if (attachmentArray.length > 0) {
        attachmentArray.forEach((attachment, index) => {
            const is_image = /^(?:(?<scheme>[^:\/?#]+):)?(?:\/\/(?<authority>[^\/?#]*))?(?<path>[^?#]*\/)?(?<file>[^?#]*\.(?<extension>[Jj][Pp][Ee]?[Gg]|[Pp][Nn][Gg]|[Gg][Ii][Ff]))(?:\?(?<query>[^#]*))?(?:#(?<fragment>.*))?$/gm.test(attachment)

            const filenameRegex = /(?=\w+\.\w{3,4}$).+/gim;
            const filename = attachment.match(filenameRegex)

            if (is_image) {
                images.push(
                    {
                        key: index + 1,
                        is_image: is_image,
                        url: attachment,
                        filename: filename
                    }
                )
            } else {
                files.push(
                    {
                        key: index + 1,
                        is_image: is_image,
                        url: attachment,
                        filename: filename
                    }
                )
            }
        })
    }

    if (submission.length > 0) {
        return {
            props: {
                submissionData: {
                    exists: true,
                    user: {
                        id: submission[0].user,
                        username: submission[0].username,
                        user_pic: submission[0].user_pic
                    },
                    week: submission[0].week,
                    description: submission[0].description,
                    reviewed: reviewed,
                    images: images,
                    files: files
                }
            }
        }
    } else {
        return {
            props: {
                submissionData: {
                    exists: false
                }
            }
        }
    }

}
