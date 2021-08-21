import { Layout } from "antd";
import { useEffect } from "react";
import { useState } from "react";
import useSWR from "swr";
const { Footer } = Layout;

export default function Gfooter() {
  const [nochange, setNochange] = useState(false);
  const [dadJoke, setDadJoke] = useState("");
  useEffect(() => {
    const fetchDadJoke = async () => {
      const jokeResponse = await fetch("https://icanhazdadjoke.com", {
        headers: {
          Accept: "application/json",
        },
      });
      const jokeData = await jokeResponse.json();
      setDadJoke(jokeData.joke);
    };
    fetchDadJoke();
  }, [nochange]);

  return (
    <Footer style={{ textAlign: "center" }}>
      <div>
        Not a collab <a href="https://github.com/opti21">opti21</a> ©2021
      </div>
      <div>{dadJoke ? dadJoke : null}</div>
    </Footer>
  );
}
