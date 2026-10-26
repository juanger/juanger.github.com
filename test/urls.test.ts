// URL-inventory test: every path in urls.txt must resolve to a file in out/,
// using GitHub Pages resolution (/x → x.html → x/index.html). Builds into a
// throwaway directory so the test is self-contained regardless of CI ordering.

import { test, expect, beforeAll, afterAll } from "bun:test";
import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { build } from "../src/build.ts";
import { loadContent } from "../src/content.ts";

const OUT = new URL("./.urls-out/", import.meta.url).pathname.replace(/\/$/, "");

beforeAll(async () => {
  await build({ outDir: OUT });
});

// Mirror GitHub Pages static resolution.
function resolves(urlPath: string): boolean {
  let p = urlPath.split(/[?#]/)[0].replace(/^\//, "");
  if (p === "" || p.endsWith("/")) return existsSync(`${OUT}/${p}index.html`);
  if (existsSync(`${OUT}/${p}`)) return true;
  if (existsSync(`${OUT}/${p}.html`)) return true;
  if (existsSync(`${OUT}/${p}/index.html`)) return true;
  return false;
}

const urlsTxt = await Bun.file(new URL("../urls.txt", import.meta.url).pathname).text();
const urls = urlsTxt
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"));

test("urls.txt is non-empty", () => {
  expect(urls.length).toBeGreaterThan(50);
});

for (const url of urls) {
  test(`resolves: ${url}`, () => {
    expect(resolves(url)).toBe(true);
  });
}

test("drafts exist as fixtures but never leak into out/", async () => {
  const { drafts } = await loadContent({ includeDrafts: true });
  expect(drafts.length).toBeGreaterThan(0); // the draft-example fixture
  for (const d of drafts) {
    expect(existsSync(`${OUT}/${d.path}.html`)).toBe(false);
  }
});

test("every non-draft post has a byte-identical .md at its URL + .md", async () => {
  const { posts } = await loadContent({});
  expect(posts.length).toBeGreaterThan(0);
  for (const p of posts) {
    const mdPath = `${OUT}/${p.path}.md`;
    expect(existsSync(mdPath)).toBe(true);
    const source = await Bun.file(p.file).text();
    expect(await Bun.file(mdPath).text()).toBe(source);
  }
});

test("each legacy /blog/... English post also has a byte-identical .md alias", async () => {
  const { posts } = await loadContent({});
  const en = posts.filter((p) => p.lang === "en");
  expect(en.length).toBeGreaterThan(0);
  for (const p of en) {
    const aliasPath = `${OUT}/blog/${p.year}/${p.month}/${p.slug}.md`;
    expect(existsSync(aliasPath)).toBe(true);
    const source = await Bun.file(p.file).text();
    expect(await Bun.file(aliasPath).text()).toBe(source);
  }
});

test("no draft .md is published", async () => {
  const { drafts } = await loadContent({ includeDrafts: true });
  for (const d of drafts) {
    expect(existsSync(`${OUT}/${d.path}.md`)).toBe(false);
    if (d.lang === "en") {
      expect(existsSync(`${OUT}/blog/${d.year}/${d.month}/${d.slug}.md`)).toBe(false);
    }
  }
});

afterAll(async () => {
  await rm(OUT, { recursive: true, force: true });
});
