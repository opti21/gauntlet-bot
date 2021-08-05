import { Upload, Button, message, Alert } from "antd";
const { Dragger } = Upload;
import { InboxOutlined } from "@ant-design/icons";
import router from "next/router";
import { Formik, Form, Field } from "formik";
import Editor from "rich-markdown-editor";
import * as yup from "yup";
import { toast } from "react-toastify";

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
    const imageData = JSON.parse(file);
    return {
      name: imageData.key,
      url: imageData.url,
    };
  });
  mappedImages.forEach((image) => {
    uploadedFiles.push(image);
  });

  mappedFiles.forEach((file) => {
    uploadedFiles.push(file);
  });

  const handleForm = async (values: any, setSubmitting: any) => {
    fetch("/api/submission", {
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
                    defaultFileList={initialValues.files}
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
              Submit
            </Button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
