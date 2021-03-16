import { Card, Avatar, Descriptions } from 'antd';
import ReactMarkdown from 'react-markdown'
import gfm from 'remark-gfm'

const { Meta } = Card;

export default function Submission(props) {
    const { submission } = props
    // console.log(submission)
    return (
        <>
            <Descriptions bordered>
                <Descriptions.Item label="User" span={3}>
                    <Avatar src={submission.user.user_pic} style={{ float: "left" }} />
                    <span style={{ float: "left", marginLeft: "10px" }}>{submission.user.username}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Description">
                    <div style={{ whiteSpace: "pre-line" }}>
                        <ReactMarkdown plugins={[gfm]} children={submission.description} />
                    </div>
                    {/* <p style={{ whiteSpace: "pre-line" }}>{submission.description}</p> */}
                </Descriptions.Item>
            </Descriptions>
        </>
    );
}