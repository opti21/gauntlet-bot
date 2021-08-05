import "antd/dist/antd.dark.css";
import "../styles/bg.css";
import { SWRConfig } from "swr";
import { UserProvider } from "@auth0/nextjs-auth0";

interface fetcherError extends Error {
  info?: string;
  status?: number;
}

const fetcher = async (url) => {
  const res = await fetch(url);

  // If the status code is not in the range 200-299,
  // we still try to parse and throw it.
  if (!res.ok) {
    const error: fetcherError = new Error(
      "An error occurred while fetching the data."
    );
    // Attach extra info to the error object.
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }

  return res.json();
};

export default function App({ Component, pageProps }) {
  return (
    <UserProvider>
      <SWRConfig value={{ fetcher, revalidateOnFocus: false }}>
        <Component {...pageProps} />
      </SWRConfig>
    </UserProvider>
  );
}
