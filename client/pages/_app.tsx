import type { AppProps } from "next/app";
import Head from "next/head";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>EcoEvolution — 생태계 먹이그물 서바이벌</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
        <meta
          name="description"
          content="100종 생물 먹이그물 기반 실시간 멀티플레이 생존 게임"
        />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
