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
import { PrismaClient } from "@prisma/client";

const { Title } = Typography;

export default function Submission({ data }) {
  console.log(data);
  return (
    <>
      <Row>
        <Col span={6}>
          <div>
            <Card title="Submission By:" style={{ margin: "0px 10px 0px 0px" }}>
              <div style={{ textAlign: "center" }}>
                <Avatar size={64} src={data.submission.user_profile.user_pic} />
                <Title level={4}>{data.submission.user_profile.username}</Title>
              </div>
            </Card>
            {data.images.length > 0 ? (
              <Card title="Images:" style={{ margin: "10px 10px 0px 0px" }}>
                <Image.PreviewGroup>
                  {data.images.map((image, index) => {
                    console.log("is image");
                    return (
                      <div key={index} style={{ margin: "5px", float: "left" }}>
                        <Image
                          width={75}
                          src="/preview.png"
                          preview={{
                            src: `${image.url}`,
                          }}
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
            {data.files.length > 0 ? (
              <Card title="Files:" style={{ margin: "10px 10px 0px 0px" }}>
                <ul>
                  {data.files.map((file, index) => {
                    return (
                      <li key={index}>
                        <a href={file.url} key={file.key}>
                          {file.filename}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            ) : (
              <></>
            )}
            {data.submission.vod_link ? (
              <Card title="Vod Link:" style={{ margin: "10px 10px 0px 0px" }}>
                <a href={data.submission.vod_link}>Watch Review</a>
              </Card>
            ) : (
              <></>
            )}
          </div>
        </Col>
        <Col span={18}>
          <Card
            bodyStyle={{
              fontSize: "13px",
            }}
          >
            <div style={{ whiteSpace: "pre-line", fontSize: "20px" }}>
              <ReactMarkdown
                plugins={[gfm]}
                children={data.submission.description}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </>
  );
}
