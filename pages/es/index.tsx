import jdown from "jdown";
import Home from "../../components/Home";
import { parseMarkdownPost, MarkdownPost } from "../../lib/posts";
import { GetStaticProps } from "next";

export default function ({ posts }) {
  return (
    <Home
      lang="es"
      subtitle="Picardías de mi no muy emocionante vida"
      posts={posts}
    >
      <>
        <h2>Preliminares</h2>
        <ol>
          <li>
            <a href="/acerca+de">Sobre el autor</a>
          </li>
          {/* <li>
            <a href="/projects">Proyectos</a>
          </li> */}
        </ol>
      </>
    </Home>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const markdownPosts = await jdown("posts", { fileInfo: true });
  // TODO add lang param
  const lang = "es";

  const posts: MarkdownPost[] = Object.values(markdownPosts[lang]);

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
