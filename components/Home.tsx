import Layout from "../components/Layout";
import Head from "next/head";
import TableOfContents from "../components/TableOfContents";

export default function Home({ subtitle, posts, lang, children }) {
  return (
    <Layout>
      <Head>
        <meta property="og:title" content="Ruby Xocolatl" />
        <meta property="og:type" content="website" />
        <meta property="og:description" content={subtitle} />
        <meta
          property="og:image"
          content="https://blog.juanger.com/blog-og-image.png"
        />
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
