import { useSession } from 'next-auth/client'
import Link from 'next/link'
import Head from 'next/head'

export default function Home() {
  const [session, loading] = useSession()

  if (!loading) {
    if (session) {
      return (
        <>
          <Head>
            <title>Gauntlet Bot</title>
          </Head>
          <p>Signed in as {session.user.name}</p>
          <Link href="/current">
            <a>Current</a>
          </Link>
        </>
      )
    }

    return <a href="/api/auth/signin">Sign in</a>

  } else {
    return <p>Loading...</p>
  }
}