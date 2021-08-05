import {
  Layout,
  Typography,
  Row,
  Col,
  Progress,
  Statistic,
  Card,
  Avatar,
  Alert,
} from "antd";
const { Content } = Layout;
const { Title } = Typography;
import Gfooter from "../../components/Gfooter";
import Head from "next/head";
import Gheader from "../../components/Gheader";
import useSWR from "swr";
import { WeekApiResponse } from "../../types";
import Loading from "../../components/Loading";
import { useUser } from "@auth0/nextjs-auth0";
import { User } from "../../types";
import { useRouter } from "next/router";
import UserSubmissionTable from "../../components/UserSubmissionTable";
import { useState } from "react";
type UserError = { error: string };

type UserDataResponse = {
  userInfo: User;
};

export default function UserPage() {
  const router = useRouter();
  const { username } = router.query;
  const { data: userData, error } = useSWR<UserDataResponse>(
    username ? `/api/get-user?user=${username}` : null
  );
  const { user, error: userError, isLoading } = useUser();

  // console.log(user);
  console.log(userData);

  // console.log(isPageOwner);

  return (
    <>
      <Head>
        {/* <title>Gauntlet Bot - {userData?.userInfo.username}</title> */}
      </Head>
      <Layout className="layout bg">
        <Gheader activePage={"-1"} />
        <Content
          style={{
            padding: "0 10%",
          }}
        >
          {!isLoading ? (
            userData && !error ? (
              <>
                <Row style={{ margin: "20px" }}>
                  <Col span={12}>
                    <Card style={{ margin: "0px 10px 0px 0px" }}>
                      <div style={{ textAlign: "center" }}>
                        <Avatar size={64} src={userData.userInfo.user_pic} />
                        <Title level={4}>{userData.userInfo.username}</Title>
                      </div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="# of Submissons"
                      value={userData.userInfo.submissions.length}
                      style={{
                        padding: "30px",
                        height: "100%",
                        background: "#212121",
                      }}
                    />
                  </Col>
                </Row>
                <Row>
                  <Col style={{ padding: "0 20px 20px 20px" }} span={24}>
                    <UserSubmissionTable data={userData.userInfo.submissions} />
                  </Col>
                </Row>
              </>
            ) : (
              <Alert
                style={{ margin: "50px" }}
                type="error"
                message="Error getting user"
              />
            )
          ) : (
            <Loading />
          )}
        </Content>
        <Gfooter />
      </Layout>
    </>
  );
}
