import Image from "next/image";

export default function Loading() {
  return (
    <div
      style={{
        width: "100%",
        height: "200px",
        textAlign: "center",
        padding: "0px 0px 300px 0px",
      }}
    >
      <Image
        height="200px"
        width="200px"
        src="/gauntlet_loading.gif"
        alt="Church of Chill loading gif"
      />
      <h2>Fricking Loading...</h2>
    </div>
  );
}
