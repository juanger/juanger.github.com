import jdown from "jdown";
import { GetStaticProps, GetStaticPaths } from "next";
import Layout from "../../../../components/Layout";
import PageHeader from "../../../../components/PageHeader";
import { parseMarkdownPost } from "../../../../lib/posts";

export default function Post({
  title,
  date,
  comments,
  categories,
  contents,
  lang,
}) {
  return (
    <Layout>
      <PageHeader lang={lang}></PageHeader>
      <article>
        <h1>{title}</h1>
        <time dateTime={date}></time>
        <section dangerouslySetInnerHTML={{ __html: contents }} />
        <blockquote>
          <footer>
            <h3>– Juan German Castañeda Echevarría</h3>
            <time>{date}</time>
          </footer>
        </blockquote>
      </article>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  let slug = String(params.slug);
  let lang = String(params.lang);

  if (lang === "blog") {
    lang = "en";
  }

  let posts = await jdown("posts", { fileInfo: true });
  posts = posts[lang];

  const post = Object.values(posts).find((post) => {
    return post.fileInfo.name.endsWith(slug);
  });

  return {
    props: {
      title: post.title,
      contents: post.contents,
      categories: post.categories || [],
      comments: post.comments || false,
      date: new Date(post.date).toISOString().split("T")[0],
      lang,
    },
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const markdownPosts = await jdown("posts", { fileInfo: true });

  const posts = generatePostPaths(markdownPosts);

  return {
    paths: posts,
    fallback: false,
  };
};

function generatePostPaths(markdownPosts) {
  const postPaths = [];

  Object.entries(markdownPosts).forEach(([lang, posts]) => {
    Object.values(posts).forEach((post) => {
      const { year, month, slug } = parseMarkdownPost(post, lang);

      const postPath = {
        params: {
          slug,
          lang,
          year,
          month,
        },
      };

      postPaths.push(postPath);
      // For backwards compatibility with old blog's paths
      if (lang === "en") {
        postPaths.push({ params: { ...postPath.params, lang: "blog" } });
      }
    });
  });
  return postPaths;
}
