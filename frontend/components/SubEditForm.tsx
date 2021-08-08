import { Upload, Button, message, Alert } from "antd";
const { Dragger } = Upload;
import { InboxOutlined } from "@ant-design/icons";
import router from "next/router";
import { Formik, Form, Field } from "formik";
import Editor from "rich-markdown-editor";
import * as yup from "yup";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

export default function SubEditForm({ submission }) {
  const formSchema = yup.object().shape({
    description: yup.string().required(),
    files: yup.array().of(
      yup.object().shape({
        etag: yup.string(),
        key: yup.string(),
        url: yup.string(),
      })
    ),
  });

  const uploadedFiles = [];
  const mappedImages = submission.images.map((image) => {
    const imageData = JSON.parse(image);
    return {
      name: imageData.key,
      url: imageData.url,
    };
  });
  const mappedFiles = submission.files.map((file) => {
    const fileData = JSON.parse(file);
    return {
      name: fileData.key,
      url: fileData.url,
    };
  });
  mappedImages.forEach((image) => {
    uploadedFiles.push(image);
  });

  mappedFiles.forEach((file) => {
    uploadedFiles.push(file);
  });
  console.log(uploadedFiles);

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
          router.push("/");
        } else {
          toast.error("Error submitting form");
          console.error(res.error);
        }
      });
    console.log(values);
  };

  return (
    <div>
      <Formik
        initialValues={{
          description: submission.description,
          files: uploadedFiles,
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
                  <Dragger
                    name="files"
                    multiple={true}
                    fileList={values.files}
                    action="/api/files/upload"
                    accept="image/*,.pdf"
                    onChange={(info) => {
                      const { status } = info.file;
                      if (status === "done") {
                        setFieldValue("files", [
                          ...field.value,
                          info.file.response,
                        ]);
                        console.log(info.file);
                      }
                      console.log(status);
                    }}
                    style={{
                      marginTop: "20px",
                    }}
                    onRemove={async (file) => {
                      console.log(file);
                      Swal.fire({
                        title: "Are you sure?",
                        text: "You will not be able to recover this imaginary file!",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonText: "Yes, delete it!",
                        cancelButtonText: "No, keep it",
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
                                  key: file.name,
                                },
                              },
                            }),
                          }).then((res) => {
                            if (res.status === 200) {
                              const removeFileFromArray = values.files.filter(
                                (currentFile) => {
                                  return currentFile.name !== file.name;
                                }
                              );
                              console.log(removeFileFromArray);
                              setFieldValue("files", removeFileFromArray);
                              toast.success("🗑️ The file has been deleted!");
                              return true;
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
                          toast.info("File deletion cancelled");
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
              Submit
            </Button>
          </Form>
        )}
      </Formik>
      {/* <div
        style={{
          backgroundColor: "#181A1B",
          padding: "20px",
          marginBottom: "20px",
        }}
      >
        {uploadedFiles.map((file, index) => {
          return (
            <a key={index + 1} href={`${file.url}`}>
              {file.filename}
            </a>
          );
        })}
      </div> */}
    </div>
  );
}
