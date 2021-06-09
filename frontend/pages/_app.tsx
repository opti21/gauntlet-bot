import { Provider } from "next-auth/client";
import "antd/dist/antd.dark.css";
import "../styles/pride-bg.css";
import { SWRConfig } from "swr";

const fetcher = (url: string, options: object) =>
  fetch(url, options).then((res) => res.json());

export default function App({ Component, pageProps }) {
  return (
    <Provider session={pageProps.session}>
      <SWRConfig value={{ fetcher, revalidateOnFocus: false }}>
        <Component {...pageProps} />
      </SWRConfig>
    </Provider>
  );
}
