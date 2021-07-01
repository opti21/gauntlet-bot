import { Layout, Menu, Button } from "antd";
import { LoginOutlined, LogoutOutlined } from "@ant-design/icons";
const { Header } = Layout;
import Link from "next/link";
import { useSession } from "next-auth/client";

export default function Gheader({ activePage }) {
  const [session, loading] = useSession();

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
          {loading ? (
            <Button type="default" loading>
              Loading
            </Button>
          ) : (
            <Button
              type="default"
              href={session ? "/api/auth/signout" : "/api/auth/signin"}
              // @ts-ignore
              danger={session}
              icon={session ? <LogoutOutlined /> : <LoginOutlined />}
              alt={session ? "Log out buton" : "Log in Button"}
            >
              {session ? <>Log Out</> : <>Log In</>}
            </Button>
          )}
        </div>
      </Header>
    </div>
  );
}
