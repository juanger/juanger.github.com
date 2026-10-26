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

afterAll(async () => {
  await rm(OUT, { recursive: true, force: true });
});
