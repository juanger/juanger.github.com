// Assertions over the fully built site (out/). Builds into a scratch dir and
// scans every generated .html file. Guards the revival cleanups. More checks
// are added here as later cleanups land (mixed content, image alt text).

import { test, expect, beforeAll, afterAll } from "bun:test";
import { rm } from "node:fs/promises";
import { parse } from "parse5";
import { build } from "../src/build.ts";

// --- tiny parse5 helpers: walk the real parsed tree, not the source string ---
type P5Node = { nodeName: string; tagName?: string; attrs?: { name: string; value: string }[]; childNodes?: P5Node[]; parentNode?: P5Node | null };

function attr(node: P5Node, name: string): string | undefined {
  return node.attrs?.find((a) => a.name === name)?.value;
}

// Every element with class `cls` anywhere in the tree.
function findAll(node: P5Node, cls: string, out: P5Node[] = []): P5Node[] {
  if (node.attrs && (attr(node, "class") ?? "").split(/\s+/).includes(cls)) out.push(node);
  for (const c of node.childNodes ?? []) findAll(c, cls, out);
  return out;
}

// Is any ancestor a <tag>? parse5 sets parentNode on the default tree.
function hasAncestor(node: P5Node, tag: string): boolean {
  for (let n = node.parentNode; n; n = n.parentNode) if (n.tagName === tag) return true;
  return false;
}

const OUT = new URL("./.built-out/", import.meta.url).pathname.replace(/\/$/, "");

let htmlFiles: { rel: string; text: string }[] = [];

beforeAll(async () => {
  await build({ outDir: OUT });
  const glob = new Bun.Glob("**/*.html");
  htmlFiles = [];
  for await (const rel of glob.scan({ cwd: OUT })) {
    htmlFiles.push({ rel, text: await Bun.file(`${OUT}/${rel}`).text() });
  }
});

test("built site has pages", () => {
  expect(htmlFiles.length).toBeGreaterThan(20);
});

test("no built page leaks a literal footnote reference (e.g. in a meta description)", () => {
  // Footnote refs ([^x], [^2026-x]) must render to sidenote markup, never survive
  // as text — a leak means a ref reached a meta description, title or feed verbatim.
  const re = /\[\^[0-9a-zA-Z!m:_-]+\]/;
  const offenders = htmlFiles.filter((f) => re.test(f.text)).map((f) => f.rel);
  expect(offenders).toEqual([]);
});

test("no built page links to the local-only drafts preview", () => {
  // /drafts and /__comments exist only in the dev server; the published site
  // must never point at them.
  const re = /\/drafts\b|__comments|__DRAFT__/;
  const offenders = htmlFiles.filter((f) => re.test(f.text)).map((f) => f.rel);
  expect(offenders).toEqual([]);
});

test("no built page embeds a gist script (gist.github.com/<id>.js)", () => {
  const re = /gist\.github\.com\/[^"'\s)]*\.js/;
  const offenders = htmlFiles.filter((f) => re.test(f.text)).map((f) => f.rel);
  expect(offenders).toEqual([]);
});

test("no built page loads an asset over http (mixed content)", () => {
  // src="http://…" (images, scripts). href="http://…" is allowed for archived links.
  const re = /\bsrc\s*=\s*"http:\/\//i;
  const offenders = htmlFiles.filter((f) => re.test(f.text)).map((f) => f.rel);
  expect(offenders).toEqual([]);
});

test("no built page links out over plain http", () => {
  // Every external link is https, an https Wayback snapshot, or a dead-link
  // span with no href. A bare href="http://…" means a dead link slipped back in.
  const re = /\bhref\s*=\s*"http:\/\//i;
  const offenders = htmlFiles.filter((f) => re.test(f.text)).map((f) => f.rel);
  expect(offenders).toEqual([]);
});

test("every <img> in out/ has a non-empty alt", () => {
  const imgRe = /<img\b[^>]*>/gi;
  const altRe = /\balt\s*=\s*"([^"]*)"/i;
  const offenders: string[] = [];
  for (const f of htmlFiles) {
    for (const tag of f.text.match(imgRe) ?? []) {
      const m = tag.match(altRe);
      if (!m || m[1].trim() === "") offenders.push(`${f.rel}: ${tag}`);
    }
  }
  expect(offenders).toEqual([]);
});

// Stray markup in a post can eject the byline out of <article> once the browser
// corrects the tree (a stray </div> once pushed it to the viewport edge). Parse
// every built post with a real HTML5 parser and assert the byline stays inside
// <article>. A post is any built page carrying a <footer class="byline">.
test("every built post keeps its byline inside <article>", () => {
  const posts = htmlFiles.filter((f) => f.text.includes('<footer class="byline">'));
  // EN + ES posts — guard against the filter silently matching nothing.
  expect(posts.length).toBeGreaterThan(20);

  const offenders: string[] = [];
  for (const f of posts) {
    const bylines = findAll(parse(f.text) as unknown as P5Node, "byline");
    if (bylines.length !== 1 || !hasAncestor(bylines[0], "article")) {
      offenders.push(f.rel);
    }
  }
  expect(offenders).toEqual([]);
});

afterAll(async () => {
  await rm(OUT, { recursive: true, force: true });
});
