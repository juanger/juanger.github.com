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

// Signature: a post signs off with the italic byline only. The byline must live
// inside <article> so it tracks the text column; anywhere else it escapes the
// centered column (a stray close tag once ejected it to the viewport edge).
test("post page has the byline inside <article>", async () => {
  const { posts } = await loadContent({});
  const post = posts[0] as Post;
  const html = postPage(post, "<p>body</p>");

  // byline present and inside the article element
  const bylineAt = html.indexOf('<footer class="byline">');
  const articleEnd = html.indexOf("</article>");
  expect(bylineAt).toBeGreaterThan(-1);
  expect(articleEnd).toBeGreaterThan(bylineAt);
});

// The footer (and its colophon) was removed from every page: Juan decided the
// colophon was the footer's only content, so no page carries a .site-foot.
test("no page has a site-foot footer or colophon", async () => {
  const { pages } = await loadContent({});
  const about = pages.find((p) => p.lang === "en") as Page;
  const { posts } = await loadContent({});
  const post = posts[0] as Post;

  for (const html of [
    indexPage("en", []),
    indexPage("es", []),
    standalonePage(about, ""),
    postPage(post, "<p>body</p>"),
  ]) {
    expect(html).not.toContain('class="site-foot"');
    expect(html).not.toContain('class="colophon"');
    expect(html).not.toContain("Written by");
    expect(html).not.toContain("Escrito por");
  }
});
