import jdown from "jdown";
import { GetStaticProps, GetStaticPaths } from "next";
import Layout from "../../../../components/Layout";
import PageHeader from "../../../../components/PageHeader";
import { parseMarkdownPost, MarkdownPost } from "../../../../lib/posts";

export default function Post({
  title,
  date,
  year,
  month,
  comments,
  categories,
  contents,
  lang,
  slug,
  hasTranslation,
}) {
  let translationUrl = hasTranslation
    ? `/${lang === "en" ? "es" : "en"}/${year}/${month}/${slug}`
    : false;

  return (
    <Layout>
      <PageHeader lang={lang} translationUrl={translationUrl}></PageHeader>
      <article>
        <h1>{title}</h1>
        <time dateTime={date}>
          <h3>{date}</h3>
        </time>
        <section dangerouslySetInnerHTML={{ __html: contents }} />
        <footer>
          <h3>– Juan German Castañeda Echevarría</h3>
        </footer>
      </article>
      <footer>
        <section>
          <div className="fullwidth" id="disqus_thread"></div>
        </section>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              /**
              *  RECOMMENDED CONFIGURATION VARIABLES: EDIT AND UNCOMMENT THE SECTION BELOW TO INSERT DYNAMIC VALUES FROM YOUR PLATFORM OR CMS.
              *  LEARN WHY DEFINING THESE VARIABLES IS IMPORTANT: https://disqus.com/admin/universalcode/#configuration-variables*/
              
              var disqus_config = function () {
                this.page.url = 'http://blog.juanger.com/${lang}/${year}/${month}/${slug}';  // Replace PAGE_URL with your page's canonical URL variable
                this.page.identifier = '${lang}/${date}/${slug}'; // Replace PAGE_IDENTIFIER with your page's unique identifier variable
                this.language = '${lang == "es" ? "es_MX" : "en_US"}';
              };
              
              (function() { // DON'T EDIT BELOW THIS LINE
              var d = document, s = d.createElement('script');
              s.src = 'https://xocoruby.disqus.com/embed.js';
              s.setAttribute('data-timestamp', +new Date());
              (d.head || d.body).appendChild(s);
              })();
            `,
          }}
        />
        <noscript>
          Please enable JavaScript to view the{" "}
          <a href="https://disqus.com/?ref_noscript">
            comments powered by Disqus.
          </a>
        </noscript>
      </footer>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async ({ params }) => {
  let slug = String(params.slug);
  let lang = String(params.lang);

  if (lang === "blog") {
    lang = "en";
  }

  let allPosts = await jdown("posts", { fileInfo: true });
  let posts: MarkdownPost[] = allPosts[lang];

  let hasTranslation = !!translatedPost(slug, lang, allPosts);

  const post: MarkdownPost = findPost(posts, slug);

  return {
    props: {
      title: post.title,
      contents: post.contents,
      categories: post.categories || [],
      comments: post.comments || false,
      date: new Date(post.date).toISOString().split("T")[0],
      year: params.year,
      month: params.month,
      slug,
      lang,
      hasTranslation,
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

function translatedPost(slug, lang, posts) {
  let otherLang = lang === "es" ? "en" : "es";

  return findPost(posts[otherLang], slug);
}

function findPost(posts: MarkdownPost[], slug) {
  return Object.values(posts).find((post) => {
    return post.fileInfo.name.endsWith(slug);
  });
}
