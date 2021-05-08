import { useSession } from 'next-auth/client'
import Link from 'next/link'
import Head from 'next/head'
import { Layout, Button } from 'antd'
import Title from 'antd/lib/typography/Title'

const { Content } = Layout

export default function Home() {
  const [session, loading] = useSession()

  if (!loading) {
    return (
      <Layout>
        <Head>
          <title>Gauntlet Bot</title>
        </Head>
        <Content style={{ padding: '0 50px' }}>
          <Title>Gauntlet Bot</Title>
          {session ? (
            <>
              <p>Signed in as {session.user.name}</p>
              <Link href="/current">
                <a>Current</a>
              </Link>
            </>
          ) : (
            <Button type="primary" size="large" >
              <Link href={"/api/auth/signin"}>Sign In</Link>
            </Button>
          )}

        </Content>
      </Layout>
    )

  } else {
    return <p>Loading...</p>
  }
}
