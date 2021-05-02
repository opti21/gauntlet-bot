import { Provider } from "next-auth/client";
import "antd/dist/antd.dark.css";

export default function App({ Component, pageProps }) {
  return (
    <Provider session={pageProps.session}>
      <Component {...pageProps} />
    </Provider>
  );
}
