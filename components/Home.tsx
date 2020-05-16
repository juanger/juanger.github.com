import Layout from "../components/Layout";
import Head from "next/head";
import TableOfContents from "../components/TableOfContents";

export default function Home({ subtitle, posts, lang, children }) {
  return (
    <Layout>
      <Head>
        <title>Ruby Xocolatl</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header>
        <a href={lang === "es" ? "/" : "/es"}>
          {lang === "es" ? "🇺🇸 English" : "🇲🇽 Español"}
        </a>
      </header>

      <h1 id="blog-name">Ruby Xocolatl</h1>
      <h3>{subtitle}</h3>

      <TableOfContents posts={posts}>{children}</TableOfContents>

      <footer></footer>
      <style jsx>{`
        header {
          float: right;
        }

        header a {
          margin-right: 15px;
        }
      `}</style>
    </Layout>
  );
}
