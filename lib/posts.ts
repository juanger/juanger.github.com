export type Post = {
  lang: string;
  year: string;
  month: string;
  day: string;
  slug: string;
  path: string;
};

export type MarkdownPost = {
  contents: string;
  title: string;
  categories: string[];
  comments: boolean;
  date: string;
  fileInfo: any;
};

export function parseMarkdownPost(post: any, lang: string): Post {
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
