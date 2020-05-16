import jdown from "jdown";
import Home from "../components/Home";
import { parseMarkdownPost } from "../lib/posts";
import { GetStaticProps } from "next";

export default function ({ posts }) {
  return (
    <Home
      lang="en"
      subtitle="Shenanigans of my not so exciting life."
      posts={posts}
    >
      <>
        <h2>Front matter</h2>
        <ol>
          <li>
            <a href="/about">About Me</a>
          </li>
          {/* <li>
            <a href="/projects">Projects</a>
          </li> */}
        </ol>
      </>
    </Home>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const markdownPosts = await jdown("posts", { fileInfo: true });
  // TODO add lang param
  const lang = "en";

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
