// Cross-language linking: every EN/ES page pair must link both ways. The home
// pages are the tricky case — the English home lives at "/", a falsy path that
// must still render a language link on the Spanish index.

import { test, expect } from "bun:test";
import { indexPage, standalonePage, i18n } from "../src/templates.ts";
import { loadContent, type Page } from "../src/content.ts";

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
