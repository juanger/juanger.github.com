// Assertions over the fully built site (out/). Builds into a scratch dir and
// scans every generated .html file. Guards the revival cleanups. More checks
// are added here as later cleanups land (mixed content, image alt text).

import { test, expect, beforeAll, afterAll } from "bun:test";
import { rm } from "node:fs/promises";
import { build } from "../src/build.ts";

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

afterAll(async () => {
  await rm(OUT, { recursive: true, force: true });
});
