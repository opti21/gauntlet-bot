import { Card, Avatar, Row, Col, Typography, Image, Button } from "antd";
import { EditOutlined } from "@ant-design/icons";
import Link from "next/link";
import Editor from "rich-markdown-editor";
import { FrontendSubmission } from "../types";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import router from "next/router";

const { Title } = Typography;

interface DataProp {
  submission: FrontendSubmission;
  isSubOwner: boolean;
  isAdmin: boolean;
}

export default function SubmissionContent({
  submission,
  isSubOwner,
  isAdmin,
}: DataProp) {
  console.log(submission);
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
                  <Button
                    onClick={(e) => {
                      Swal.fire({
                        title: "Are you sure?",
                        text: "You will not be able to recover this Submission!",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonText: "Yes, delete it!",
                        cancelButtonText: "No, keep it",
                      }).then((result) => {
                        if (result.isConfirmed) {
                          fetch("/api/submissions/delete", {
                            method: "DELETE",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              subID: submission.id,
                            }),
                          }).then((res) => {
                            if (res.status === 200) {
                              toast.success("Submission Deleted");
                              router.push(
                                `/user/${submission.user_profile.username}`
                              );
                            } else {
                              toast.error(
                                "Error deleting file 😬 let opti know if this keeps happening"
                              );
                              return false;
                            }
                          });
                        } else if (
                          result.dismiss === Swal.DismissReason.cancel
                        ) {
                          toast.info("Submission deletion cancelled");
                        }
                      });
                    }}
                    type="link"
                    danger
                    block
                  >
                    Delete Submission
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
            {submission.images.length > 0 ? (
              <Card title="Images:" style={{ margin: "10px 10px 0px 0px" }}>
                <Image.PreviewGroup>
                  {submission.images.map((image, index) => {
                    console.log("is image");
                    return (
                      <div key={index} style={{ margin: "5px", float: "left" }}>
                        <Image
                          width={75}
                          src="/preview.png"
                          preview={{
                            src: `${image.url}`,
                          }}
                          alt={image.key}
                        />
                      </div>
                    );
                  })}
                </Image.PreviewGroup>
              </Card>
            ) : (
              <></>
            )}
            {submission.files.length > 0 ? (
              <Card
                title="Files:"
                style={{
                  margin: "10px 10px 0px 0px",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                }}
              >
                {submission.files.map((file, index) => {
                  return (
                    <div key={index}>
                      <a href={file.url} key={file.key}>
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
