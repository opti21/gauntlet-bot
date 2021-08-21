import { Upload, Button, message, Alert } from "antd";
const { Dragger } = Upload;
import { InboxOutlined } from "@ant-design/icons";
import router from "next/router";
import { Formik, Form, Field } from "formik";
import Editor from "rich-markdown-editor";
import * as yup from "yup";
import { toast } from "react-toastify";
import { v4 as uuid } from "uuid";
import Swal from "sweetalert2";
import { CSSProperties, useState } from "react";
import { mutate } from "swr";

export default function SubEditForm({ submission }) {
  const formSchema = yup.object().shape({
    description: yup.string().required(),
    files: yup.array().of(yup.number()),
  });

  const handleFileDeletion = (file) => {
    Swal.fire({
      title: "Are you sure you want to delete this file?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch("/api/files/delete", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            file: {
              response: {
                file_id: file.id,
              },
            },
          }),
        }).then((res) => {
          if (res.status === 200) {
            mutate(`/api/submissions?subID=${submission.id}`);
            toast.success("File deleted 🗑️");
            return true;
          } else {
            console.log(res);
            return false;
          }
        });
      }
    });
  };

  const handleForm = async (values: any, setSubmitting: any) => {
    fetch(`/api/submissions/update?subID=${submission.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          router.push(`/review?submission=${res.sub_id}`);
        } else {
          toast.error("Error submitting form");
          console.error(res.error);
        }
      });
    console.log(values);
  };

  const tdStyle: CSSProperties = {
    borderBottom: "1px solid #ddd",
    padding: "20px",
    textAlign: "center",
  };

  return (
    <div>
      <Formik
        initialValues={{
          description: submission.description,
          files: [],
        }}
        validate={(values) => {
          const errors = {};
          if (!values.description) {
            //@ts-ignore
            errors.description = "Description Required";
          }
          return errors;
        }}
        onSubmit={(values, { setSubmitting }) => {
          handleForm(values, setSubmitting);
        }}
        validationSchema={formSchema}
      >
        {({ isSubmitting }) => (
          <Form
            style={{
              backgroundColor: "#181A1B",
              padding: "20px",
              marginBottom: "20px",
            }}
          >
            <Field name="description" id="description">
              {({
                field,
                form: { touched, errors, setFieldValue, initialValues },
                meta,
              }) => (
                <div
                  style={{
                    padding: "20px",
                  }}
                >
                  <Editor
                    placeholder="Insert your amazing description here"
                    defaultValue={initialValues.description}
                    dark={true}
                    onChange={(getValue) => {
                      const value = getValue();
                      setFieldValue("description", value);
                      // console.log(getValue());
                    }}
                    autoFocus={true}
                    disableExtensions={["container_notice"]}
                  />
                  {meta.touched && meta.error && (
                    <Alert
                      style={{ marginTop: "10px" }}
                      message={meta.error}
                      type="error"
                      showIcon
                    />
                  )}
                </div>
              )}
            </Field>
            <Field name="files" id="files">
              {({
                field,
                form: { values, setFieldValue, initialValues },
                meta,
              }) => (
                <div style={{ paddingBottom: "20px" }}>
                  <h2> Upload New files</h2>
                  <Dragger
                    name="files"
                    multiple={true}
                    action={`/api/files/upload`}
                    accept="image/*,.pdf"
                    onChange={(info) => {
                      const { status, response } = info.file;
                      if (status === "done") {
                        toast.success("File(s) uploaded 🤩");
                        setFieldValue("files", [
                          ...field.value,
                          info.file.response.file_id,
                        ]);
                        console.log(info.file);
                      }

                      if (status === "error") {
                        toast.error("Error uploading file 😬");
                        console.error(response.error);
                      }
                      console.log(status);
                    }}
                    style={{
                      marginTop: "20px",
                    }}
                    onRemove={async (file) => {
                      console.log(file);
                      fetch("/api/files/delete", {
                        method: "DELETE",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          file: file,
                        }),
                      }).then((res) => {
                        if (res.status === 200) {
                          const removeFileFromArray = field.value.filter(
                            (file) => file.name !== file.name
                          );
                          console.log(removeFileFromArray);
                          setFieldValue("files", removeFileFromArray);
                          return true;
                        } else {
                          console.log(res);
                          return false;
                        }
                      });
                    }}
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">
                      Click or drag images or PDFs to this area to upload
                    </p>
                    <p className="ant-upload-hint">
                      any other type you can link in your description.
                    </p>
                  </Dragger>
                </div>
              )}
            </Field>
            <Button
              type="primary"
              htmlType="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              Update
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
                    fetch(`/api/submissions/delete?subID=${submission.id}`, {
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
                          "Error deleting submission 😬 let opti know if this keeps happening"
                        );
                        return false;
                      }
                    });
                  } else if (result.dismiss === Swal.DismissReason.cancel) {
                    toast.info("Submission deletion cancelled");
                  }
                });
              }}
              type="link"
              danger
              block
              style={{ width: "100px" }}
            >
              Delete Submission
            </Button>
          </Form>
        )}
      </Formik>
      {submission.uploaded_files.length > 0 ||
      submission.images.length > 0 ||
      submission.files.length > 0 ? (
        <div
          style={{
            backgroundColor: "#181A1B",
            padding: "20px",
            marginBottom: "20px",
          }}
        >
          <h2>Existing Files</h2>
          <table
            style={{
              width: "100%",
            }}
          >
            <thead>
              <tr>
                <th>File Name</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {submission.uploaded_files.length > 0
                ? submission.uploaded_files.map((file, index) => {
                    const rowID = uuid().slice(0, 8);
                    return (
                      <tr key={rowID}>
                        <td style={tdStyle}>
                          <a href={`${file.url}`} target="_blank">
                            {file.filename}
                          </a>
                        </td>
                        <td style={tdStyle}>
                          <Button
                            onClick={() => handleFileDeletion(file)}
                            type="default"
                            danger
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                : null}
              {submission.files.length > 0
                ? submission.files.map((fileStr, index) => {
                    const file = JSON.parse(fileStr);
                    const rowID = uuid().slice(0, 8);
                    return (
                      <tr key={rowID}>
                        <td style={tdStyle}>
                          <a href={`${file.url}`} target="_blank">
                            {file.filename}
                          </a>
                        </td>
                        <td style={tdStyle}>
                          <p>Unable to delete older files</p>
                        </td>
                      </tr>
                    );
                  })
                : null}
              {submission.images.length > 0
                ? submission.images.map((imageStr, index) => {
                    const file = JSON.parse(imageStr);
                    const rowID = uuid().slice(0, 8);
                    return (
                      <tr key={rowID}>
                        <td style={tdStyle}>
                          <a href={`${file.url}`} target="_blank">
                            {file.filename}
                          </a>
                        </td>
                        <td style={tdStyle}>
                          <p>Unable to delete older files</p>
                        </td>
                      </tr>
                    );
                  })
                : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
