import { useSession } from 'next-auth/client'
import { Layout } from 'antd'
const { Content } = Layout;
import Gfooter from '../components/Gfooter';
import Link from 'next/link';
import Head from 'next/head'
import Gheader from '../components/Gheader';
import CurrentWeekTable from '../components/CurrentTable'


export default function Current() {

  const [session, loading] = useSession()
  // console.log("isAdmin? " + session.isAdmin)

  return <>
    <Head>
      <title>Gauntlet Bot - Current Week</title>
    </Head>
    <Layout className="layout">
      <Gheader activePage={'1'} />
      <Content style={{ padding: '0 50px' }}>
        <h1>Current Week</h1>
        {session ?
          <CurrentWeekTable /> :
          <Link href="/api/auth/signin"><a>Sign in</a></Link>
        }
      </Content>
      <Gfooter />

    </Layout>
  </>


}

// export const getServerSideProps = async (ctx) => {
//   console.log(ctx)
//   const weeks = await fetch(process.env.NEXTAUTH_URL + '/api/get-weeks')
//     .then(response => response.json())
//     .then(data => {
//       return data
//     })
//   console.log(weeks)

//   return {
//     props: {
//       weeks: weeks
//     }
//   }
// }