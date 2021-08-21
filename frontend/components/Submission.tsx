import { Card, Avatar, Row, Col, Typography, Image, Button } from "antd";
import { EditOutlined } from "@ant-design/icons";
import Link from "next/link";
import Editor from "rich-markdown-editor";
import { File, FrontendSubmission } from "../types";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import router from "next/router";

const { Title } = Typography;

interface DataProp {
  submission: FrontendSubmission;
  isSubOwner: boolean;
  isAdmin: boolean;
  images: File[];
  files: File[];
}

export default function SubmissionContent({
  submission,
  images,
  files,
  isSubOwner,
  isAdmin,
}: DataProp) {
  return (
    <>
      <Row>
        <Col span={6}>
          <div>
            {isAdmin || isSubOwner ? (
              <div>
                <Card
                  style={{
                    margin: "0px 10px 10px 0px",
                    textAlign: "center",
                  }}
                  bodyStyle={{
                    backgroundColor: "#181A1B",
                  }}
                >
                  <Button
                    href={`/edit?submission=${submission.id}`}
                    type="default"
                    icon={<EditOutlined />}
                    style={{ marginBottom: "20px" }}
                    block
                  >
                    Edit
                  </Button>
                </Card>
              </div>
            ) : null}
            <Card title="Submission By:" style={{ margin: "0px 10px 0px 0px" }}>
              <div style={{ textAlign: "center" }}>
                <Link href={`/user/${submission.user_profile.username}`}>
                  <a>
                    <Avatar
                      size={64}
                      src={submission.user_profile.user_pic}
                      alt={`${submission.user_profile.username}'s profile picture`}
                    />
                  </a>
                </Link>
                <Link href={`/user/${submission.user_profile.username}`}>
                  <a>
                    <h3>{submission.user_profile.username}</h3>
                  </a>
                </Link>
              </div>
            </Card>
            {images.length > 0 ? (
              <Card title="Images:" style={{ margin: "10px 10px 0px 0px" }}>
                <Image.PreviewGroup>
                  {images.map((image, index) => {
                    return (
                      <div
                        key={index + 1}
                        style={{ margin: "5px", float: "left" }}
                      >
                        <Image
                          width={75}
                          src="/preview.png"
                          preview={{
                            src: `${image.url}`,
                          }}
                        />
                      </div>
                    );
                  })}
                </Image.PreviewGroup>
              </Card>
            ) : (
              <></>
            )}
            {files.length > 0 ? (
              <Card
                title="Files:"
                style={{
                  margin: "10px 10px 0px 0px",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                {files.map((file, index) => {
                  return (
                    <div key={index}>
                      <a href={file.url} key={index + 1} target="_blank">
                        {file.filename}
                      </a>
                    </div>
                  );
                })}
              </Card>
            ) : (
              <></>
            )}
            {/* {submission.submission.vod_link ? (
              <Card title="Vod Link:" style={{ margin: "10px 10px 0px 0px" }}>
                <a href={submission.submission.vod_link}>Watch Review</a>
              </Card>
            ) : (
              <></>
            )} */}
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
              value={submission.description}
            />
          </Card>
        </Col>
      </Row>
    </>
  );
}
