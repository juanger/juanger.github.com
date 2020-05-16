import Head from "next/head";
import jdown from "jdown";
import Layout from "../components/Layout";
import { GetStaticProps } from "next";

export default function Home({ posts }) {
  return (
    <Layout>
      <Head>
        <title>Ruby Xocolatl</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <h1 id="blog-name">Ruby Xocolatl</h1>
      <h3>Shenanigans of my not so exciting life.</h3>

      <section id="TOC">
        {/* <h2>Front matter</h2>
        <ol>
          <li>
            <a href="/about_me">About Me</a>
          </li>
          <li>
            <a href="/projects">Projects</a>
          </li>
        </ol> */}
        {generateTOCFromPosts(posts)}
      </section>

      <footer></footer>
    </Layout>
  );
}

function generateTOCFromPosts(posts) {
  return (
    <>
      {Object.entries(postsByYear(posts))
        .sort(([yearA], [yearB]) => {
          return Number(yearB) - Number(yearA);
        })
        .map(([year, posts]) => {
          return (
            <React.Fragment key={year}>
              <h2>{year}</h2>
              <ol>
                {posts
                  .sort(({ month: a, day: dayA }, { month: b, day: dayB }) => {
                    var monthDiff = Number(b) - Number(a);
                    if (monthDiff !== 0) {
                      return monthDiff;
                    } else {
                      return Number(dayB) - Number(dayA);
                    }
                  })
                  .map((post) => {
                    const date = new Date(post.year, post.month, post.day);
                    const month = date.toLocaleString("default", {
                      month: "short",
                    });

                    return (
                      <li key={post.slug}>
                        <time>
                          <span>{month}</span>
                          <span>{post.day}</span>
                        </time>
                        <a href={post.path}>{post.title}</a>
                      </li>
                    );
                  })}
              </ol>
            </React.Fragment>
          );
        })}
    </>
  );
}

function postsByYear(posts) {
  const byYear = {};
  posts.forEach((post) => {
    byYear[post.year] = byYear[post.year] || [];
    byYear[post.year].push(post);
  });
  return byYear;
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const markdownPosts = await jdown("posts", { fileInfo: true });
  // TODO add lang param
  const lang = "en";

  const posts = Object.values(markdownPosts[lang]);

  return {
    props: {
      posts: posts.map((post) => {
        const parsed = parsePath(post, lang);

        return {
          title: post.title,
          ...parsed,
        };
      }),
    },
  };
};

export function parsePath(post, lang) {
  const fileName = post.fileInfo.name;
  const [date, slug] = fileName.split("_");
  const [year, month, day] = date.split("-");
  return {
    lang,
    year,
    month,
    day,
    slug,
    path: [lang, year, month, slug].join("/"),
  };
}
