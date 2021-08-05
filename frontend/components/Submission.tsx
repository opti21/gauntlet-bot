import { Card, Avatar, Row, Col, Typography, Image } from "antd";
import Link from "next/link";
import Editor from "rich-markdown-editor";

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
                <Link href={`/user/${data.submission.user_profile.username}`}>
                  <a>
                    <Avatar
                      size={64}
                      src={data.submission.user_profile.user_pic}
                      alt={`${data.submission.user_profile.username}'s profile picture`}
                    />
                  </a>
                </Link>
                <Link href={`/user/${data.submission.user_profile.username}`}>
                  <a>
                    <h3>{data.submission.user_profile.username}</h3>
                  </a>
                </Link>
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
              fontSize: "20px",
              backgroundColor: "#181A1B",
            }}
          >
            <Editor
              dark={true}
              readOnly={true}
              value={data.submission.description}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}
