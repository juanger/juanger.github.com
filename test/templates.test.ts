// Cross-language linking: every EN/ES page pair must link both ways. The home
// pages are the tricky case — the English home lives at "/", a falsy path that
// must still render a language link on the Spanish index.

import { test, expect } from "bun:test";
import { indexPage, standalonePage, postPage, i18n } from "../src/templates.ts";
import { loadContent, type Page, type Post } from "../src/content.ts";

// The nav renders <a href="URL">LABEL</a> for the translation link.
function navLink(html: string, url: string, label: string): boolean {
  return html.includes(`<a href="${url}">${label}</a>`);
}

test("both index pages link to each other", () => {
  const en = indexPage("en", []);
  const es = indexPage("es", []);
  // English index → Spanish home; Spanish index → English home ("/").
  expect(navLink(en, "/es", i18n.en.toOther)).toBe(true);
  expect(navLink(es, "/", i18n.es.toOther)).toBe(true);
});

test("about and acerca+de pages link to each other", async () => {
  const { pages } = await loadContent({});
  const about = pages.find((p) => p.lang === "en") as Page;
  const acerca = pages.find((p) => p.lang === "es") as Page;
  expect(about).toBeDefined();
  expect(acerca).toBeDefined();

  const aboutHtml = standalonePage(about, "");
  const acercaHtml = standalonePage(acerca, "");
  expect(navLink(aboutHtml, "/acerca+de", i18n.en.toOther)).toBe(true);
  expect(navLink(acercaHtml, "/about", i18n.es.toOther)).toBe(true);
});

// Signature: a post signs off with the italic byline only — the site-foot
// colophon (which repeats the author's name) is dropped, so the name never
// appears twice. The byline must live inside <article> so it tracks the text
// column; anywhere else it escapes the centered column (a stray close tag once
// ejected it to the viewport edge).
test("post page has the byline inside <article> and no colophon", async () => {
  const { posts } = await loadContent({});
  const post = posts[0] as Post;
  const html = postPage(post, "<p>body</p>");

  // byline present and inside the article element
  const bylineAt = html.indexOf('<footer class="byline">');
  const articleEnd = html.indexOf("</article>");
  expect(bylineAt).toBeGreaterThan(-1);
  expect(articleEnd).toBeGreaterThan(bylineAt);

  // the only footer is the byline — no site-foot colophon on a post
  expect(html).not.toContain('class="site-foot"');
  expect(html).not.toContain(i18n[post.lang].colophon);
});

// The index/about/404 pages carry no byline, so they keep the colophon.
test("index and standalone pages keep the colophon", async () => {
  const { pages } = await loadContent({});
  const about = pages.find((p) => p.lang === "en") as Page;
  expect(indexPage("en", [])).toContain(i18n.en.colophon);
  expect(standalonePage(about, "")).toContain(i18n.en.colophon);
});
