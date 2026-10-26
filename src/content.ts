// Load posts and standalone pages from the filesystem, parse front matter,
// derive URLs from the filename, pair translations and filter drafts.

import { YAML } from "bun";
import { existsSync } from "node:fs";

export type Lang = "en" | "es";

export type FrontMatter = {
  title?: string;
  date?: string;
  description?: string;
  draft?: boolean;
  updated?: string;
  status?: string;
  errata?: unknown;
  note?: string;
  translation?: string;
  image?: string;
  aliases?: string[];
  categories?: string | string[];
  [key: string]: unknown;
};

export type Post = {
  lang: Lang;
  slug: string;
  year: string;
  month: string;
  day: string;
  /** canonical extensionless path, e.g. "en/2008/03/macruby" */
  path: string;
  title: string;
  /** display date string straight from front matter (never through Date) */
  date: string;
  description?: string;
  image?: string;
  draft: boolean;
  aliases: string[];
  front: FrontMatter;
  body: string; // markdown body (front matter stripped)
  file: string; // absolute source path
  hasTranslation: boolean;
  translationPath?: string; // extensionless path of the paired translation
};

export type Page = {
  lang: Lang;
  /** output path without extension, e.g. "about" or "acerca+de" */
  name: string;
  title: string;
  front: FrontMatter;
  body: string;
  file: string;
};

const FRONT_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

export function splitFrontMatter(source: string): { front: FrontMatter; body: string } {
  const match = source.match(FRONT_RE);
  if (!match) return { front: {}, body: source };
  const front = (YAML.parse(match[1]) as FrontMatter) ?? {};
  return { front, body: source.slice(match[0].length) };
}

// Normalize a YAML date (string or Date) to a plain display string without
// ever routing through new Date()/toISOString(), which can shift the day.
function normalizeDate(value: unknown, fallback: string): string {
  if (value == null) return fallback;
  if (value instanceof Date) {
    // Bun.YAML may hand back a Date for a bare YYYY-MM-DD; format in UTC.
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return String(value);
}

function firstParagraph(body: string): string {
  // crude: first non-empty, non-html, non-heading line block
  for (const block of body.split(/\r?\n\r?\n/)) {
    const t = block.trim();
    if (!t || t.startsWith("#") || t.startsWith("<") || t.startsWith(":::")) continue;
    return t.replace(/\s+/g, " ").replace(/[*_`]/g, "").trim();
  }
  return "";
}

async function loadPostsForLang(dir: string, lang: Lang): Promise<Post[]> {
  const posts: Post[] = [];
  if (!existsSync(dir)) return posts; // a root may hold only one language (e.g. draft fixtures)
  const glob = new Bun.Glob("*.md");
  for await (const name of glob.scan({ cwd: dir })) {
    const file = `${dir}/${name}`;
    const source = await Bun.file(file).text();
    const { front, body } = splitFrontMatter(source);

    const base = name.replace(/\.md$/, "");
    const underscore = base.indexOf("_");
    const datePart = base.slice(0, underscore);
    const slug = base.slice(underscore + 1);
    const [year, month, day] = datePart.split("-");

    posts.push({
      lang,
      slug,
      year,
      month,
      day,
      path: `${lang}/${year}/${month}/${slug}`,
      title: front.title ?? slug,
      date: normalizeDate(front.date, datePart),
      description: front.description ?? firstParagraph(body),
      image: front.image,
      draft: front.draft === true,
      aliases: Array.isArray(front.aliases) ? front.aliases : [],
      front,
      body,
      file,
      hasTranslation: false,
    });
  }
  return posts;
}

export type Content = {
  posts: Post[]; // built posts (drafts excluded unless includeDrafts)
  drafts: Post[];
  pages: Page[];
};

export async function loadContent(opts: { includeDrafts?: boolean; root?: string } = {}): Promise<Content> {
  const root = opts.root ?? ".";
  const en = await loadPostsForLang(`${root}/posts/en`, "en");
  const es = await loadPostsForLang(`${root}/posts/es`, "es");

  // Pair translations by identical filename slug (or explicit `translation`).
  const bySlug: Record<Lang, Map<string, Post>> = {
    en: new Map(en.map((p) => [p.slug, p])),
    es: new Map(es.map((p) => [p.slug, p])),
  };
  for (const p of [...en, ...es]) {
    const otherLang: Lang = p.lang === "en" ? "es" : "en";
    const wantSlug = typeof p.front.translation === "string" ? p.front.translation : p.slug;
    const other = bySlug[otherLang].get(wantSlug);
    if (other) {
      p.hasTranslation = true;
      p.translationPath = other.path;
    }
  }

  const all = [...en, ...es];
  const live = all.filter((p) => !p.draft);
  const drafts = all.filter((p) => p.draft);

  const pages = await loadPages(root);

  return {
    posts: opts.includeDrafts ? all : live,
    drafts,
    pages,
  };
}

async function loadPages(root: string): Promise<Page[]> {
  const specs: { file: string; lang: Lang; name: string }[] = [
    { file: `${root}/pages/about.md`, lang: "en", name: "about" },
    { file: `${root}/pages/es/acerca+de.md`, lang: "es", name: "acerca+de" },
  ];
  const pages: Page[] = [];
  for (const spec of specs) {
    const f = Bun.file(spec.file);
    if (!(await f.exists())) continue;
    const { front, body } = splitFrontMatter(await f.text());
    pages.push({
      lang: spec.lang,
      name: spec.name,
      title: front.title ?? spec.name,
      front,
      body,
      file: spec.file,
    });
  }
  return pages;
}

// Sort newest first, used for feeds and the index.
export function byDateDesc(a: Post, b: Post): number {
  const ka = `${a.year}-${a.month}-${a.day}`;
  const kb = `${b.year}-${b.month}-${b.day}`;
  return ka < kb ? 1 : ka > kb ? -1 : 0;
}
