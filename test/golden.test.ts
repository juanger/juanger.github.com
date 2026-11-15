// Golden test: the rendered article HTML of every post must match the frozen
// baseline (test/golden/*.html) after whitespace/entity normalization.
//
// For 14 posts the golden is the live site deployed 2022-05-04. For the 8 posts
// listed in test/golden/DIFFERENCES.md the golden was taken from a fresh render
// (the baseline predates commit 8da6e7a, or the post's sidenote markup was
// converted to the new footnote syntax); those still guard against regressions
// from the current source.

import { test, expect } from "bun:test";
import { loadContent } from "../src/content.ts";
import { render } from "../src/markdown.ts";
import { normalizeHtml } from "./normalize.ts";

const goldenDir = new URL("./golden/", import.meta.url).pathname;
const { posts } = await loadContent({});

for (const p of posts) {
  test(`golden: ${p.lang}/${p.path}`, async () => {
    const file = `${goldenDir}${p.lang}_${p.year}_${p.month}_${p.slug}.html`;
    const golden = await Bun.file(file).text();
    // Render with the post's language so figure labels and source words match the
    // real build ("Figura"/"Fuente" in Spanish). Only the two COVID posts carry
    // :::figure blocks today; every other golden is language-independent.
    expect(normalizeHtml(render(p.body, { lang: p.lang }))).toBe(normalizeHtml(golden));
  });
}
