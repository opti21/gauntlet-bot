import { Layout, Menu, Button } from "antd";
import { LoginOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons";
const { Header } = Layout;
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0";

export default function Gheader({ activePage }) {
  const { user, error, isLoading } = useUser();

  return (
    <div>
      <Header>
        <div style={{ float: "left", width: "150px", height: "20px" }}>
          <p style={{ fontSize: "20px" }}>Gauntlet Bot</p>
        </div>
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={[activePage]}
          style={{ float: "left" }}
        >
          <Menu.Item key="1">
            <Link href="/current">Current</Link>
          </Menu.Item>
          <Menu.Item key="2">
            <Link href="/previous-weeks">Previous Weeks</Link>
          </Menu.Item>
          <Menu.Item key="3">
            <Link href="/submit">Submit</Link>
          </Menu.Item>
        </Menu>
        <div style={{ float: "right", padding: "0 10px 0 10px" }}>
          {isLoading ? null : user ? (
            <Button
              href={`/user/${user.nickname}`}
              style={{ marginRight: "10px" }}
              icon={<UserOutlined />}
            >
              {user.nickname}
            </Button>
          ) : null}

          {isLoading ? (
            <Button type="default" loading>
              Loading
            </Button>
          ) : (
            <Button
              type="default"
              href={user ? "/api/auth/logout" : "/api/auth/login"}
              // @ts-ignore
              danger={user}
              icon={user ? <LogoutOutlined /> : <LoginOutlined />}
              alt={user ? "Log out buton" : "Log in Button"}
            >
              {user ? <>Log Out</> : <>Log In</>}
            </Button>
          )}
        </div>
      </Header>
    </div>
  );
}
