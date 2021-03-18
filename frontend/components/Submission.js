import {
  Card,
  Avatar,
  Row,
  Col,
  Affix,
  Typography,
  Image,
  Skeleton,
} from "antd";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";

const { Title } = Typography;

export default function Submission(props) {
  const { submissionData } = props;
  console.log(submissionData.files);
  return (
    <>
      <Row>
        <Col span={6}>
          <Affix offsetTop={10}>
            <Card title="Submission By:" style={{ margin: "0px 10px 0px 0px" }}>
              <div style={{ textAlign: "center" }}>
                <Avatar size={64} src={submissionData.user.user_pic} />
                <Title level={4}>{submissionData.user.username}</Title>
              </div>
            </Card>
            {submissionData.images.length > 0 ? (
              <Card title="Images:" style={{ margin: "10px 10px 0px 0px" }}>
                <Image.PreviewGroup width>
                  {submissionData.images.map((image) => {
                    console.log("is image")
                    return (
                      <div style={{ margin: "10px", float: "left" }}>
                        <Image
                          width={75}
                          height={75}
                          src={image.url}
                          preview={
                            <Skeleton.Avatar size={100} shape={"square"} />
                          }
                          alt={image.filename}
                        />
                      </div>
                    );
                  })}
                </Image.PreviewGroup>
              </Card>
            ) : (
              <></>
            )}
            {submissionData.files.length > 0 ? (
              <Card title="Files:" style={{ margin: "10px 10px 0px 0px" }}>
                <ul>
                  {submissionData.files.map(file => {
                    return <li><a href={file.url} key={file.key}>{file.filename}</a></li>
                  })}

                </ul>
              </Card>
            ) : (
              <></>
            )}
          </Affix>
        </Col>
        <Col span={18}>
          <Card>
            <div style={{ whiteSpace: "pre-line" }}>
              <ReactMarkdown
                plugins={[gfm]}
                children={submissionData.description}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </>
  );
}
