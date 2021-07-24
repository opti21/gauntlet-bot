import "antd/dist/antd.dark.css";
import "../styles/bg.css";
import { SWRConfig } from "swr";
import { UserProvider } from "@auth0/nextjs-auth0";

const fetcher = (url: string, options: object) =>
  fetch(url, options).then((res) => res.json());

export default function App({ Component, pageProps }) {
  return (
    <UserProvider>
      <SWRConfig value={{ fetcher, revalidateOnFocus: false }}>
        <Component {...pageProps} />
      </SWRConfig>
    </UserProvider>
  );
}
