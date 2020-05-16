import Head from "next/head";
import jdown from "jdown";
import Layout from "../../components/Layout";
import TableOfContents from "../../components/TableOfContents";
import { parseMarkdownPost } from "../../lib/posts";
import { GetStaticProps } from "next";

export default function Home({ posts }) {
  return (
    <Layout>
      <Head>
        <title>Ruby Xocolatl</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <h1 id="blog-name">Ruby Xocolatl</h1>
      <h3>Picardías de una vida no muy interesante.</h3>

      <TableOfContents posts={posts}>
        <h2>Front matter</h2>
        <ol>
          <li>
            <a href="/about_me">About Me</a>
          </li>
          <li>
            <a href="/projects">Projects</a>
          </li>
        </ol>
      </TableOfContents>

      <footer></footer>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const markdownPosts = await jdown("posts", { fileInfo: true });
  // TODO add lang param
  const lang = "es";

  const posts = Object.values(markdownPosts[lang]);

  return {
    props: {
      posts: posts.map((post) => {
        const parsed = parseMarkdownPost(post, lang);

        return {
          title: post.title,
          ...parsed,
        };
      }),
    },
  };
};
