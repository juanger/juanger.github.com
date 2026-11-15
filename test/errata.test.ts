// 2026 errata system: lettered errata sidenotes vs numbered originals, the 2026
// stamp, verdict-word parsing, the status line from front matter, the index
// label, the collapsed "today" block and the scorecard dot tally.

import { test, expect } from "bun:test";
import { render } from "../src/markdown.ts";
import { postPage, indexPage } from "../src/templates.ts";
import type { Post } from "../src/content.ts";

// A minimal Post for the template functions (only the fields they read).
function post(front: Record<string, unknown>, over: Partial<Post> = {}): Post {
  return {
    lang: "en",
    slug: "p",
    year: "2008",
    month: "03",
    day: "08",
    path: "en/2008/03/p",
    title: "A Post",
    date: "2008-03-08",
    description: "d",
    draft: false,
    aliases: [],
    front,
    body: "",
    file: "x.md",
    hasTranslation: false,
    status: typeof front.status === "string" ? (front.status as string) : undefined,
    ...over,
  };
}

test("lettered errata and numbered sidenotes coexist on a page", () => {
  const out = render("A[^1] and B[^2026-gc].\n\n[^1]: original note\n\n[^2026-gc]: a 2026 note\n");
  // original: numbered sidenote machinery
  expect(out).toContain('class="margin-toggle sidenote-number"');
  expect(out).toContain('<span class="sidenote">');
  // errata: lettered machinery, distinct class
  expect(out).toContain('class="margin-toggle errata-number"');
  expect(out).toContain('<span class="sidenote errata">');
  // the errata note never increments the numbered counter
  expect(out).not.toContain('<span class="sidenote errata"> original');
});

test("every 2026 errata note carries the 2026 stamp; the restore variant does not", () => {
  const side = render("x[^2026-a]\n\n[^2026-a]: note\n");
  expect(side).toContain('<span class="errata-year">2026</span>');
  const margin = render("x[^2026m-a]\n\n[^2026m-a]: note\n");
  expect(margin).toContain('<span class="marginnote errata"><span class="errata-year">2026</span>');
  // restoration marker is muted: plain marginnote, no stamp, no errata class
  const restore = render("x[^2026r-a]\n\n[^2026r-a]: Restored in 2026 from gist 489722.\n");
  expect(restore).toContain('<span class="marginnote">');
  expect(restore).not.toContain("errata-year");
  expect(restore).not.toContain('class="marginnote errata"');
});

test("always-visible variant adds .always", () => {
  const out = render("x[^2026!-spam]\n\n[^2026!-spam]: critical note\n");
  expect(out).toContain('<span class="sidenote errata always">');
});

test("verdict word is parsed, stamped and set as the toggle label", () => {
  const out = render("x[^2026m-v]\n\n[^2026m-v]: held: it was never eradicated\n");
  // verdict word in the note, after the stamp, colon stripped
  expect(out).toContain('data-verdict="held"');
  expect(out).toContain('<span class="verdict-word">held</span>it was never eradicated');
  expect(out).not.toContain("held: it was never");
  // mobile toggle shows the verdict word inline
  expect(out).toContain('class="margin-toggle verdict-toggle"><span class="verdict-word">held</span>⊕');
});

test("status line renders from front matter under the date", () => {
  const html = postPage(post({ status: "obsolete", status_note: "MacRuby stopped around 2012." }), "<p>b</p>");
  expect(html).toContain('<aside class="errata-status" data-status="obsolete">');
  expect(html).toContain('<span class="errata-label">Obsolete</span>');
  expect(html).toContain("MacRuby stopped around 2012.");
  // the aside sits before the body section
  expect(html.indexOf("errata-status")).toBeLessThan(html.indexOf("<section>"));
});

test("historical posts get no status line even with a note", () => {
  const html = postPage(post({ status: "historical", status_note: "some note" }), "<p>b</p>");
  expect(html).not.toContain("errata-status");
  // and a post with no status_note at all gets none
  const bare = postPage(post({ status: "obsolete" }), "<p>b</p>");
  expect(bare).not.toContain("errata-status");
});

test("index shows the status as a muted small-caps word", () => {
  const html = indexPage("en", [post({ status: "partly-wrong" })]);
  expect(html).toContain('<span class="post-status">partly wrong</span>');
  // no label for a post without a status
  const plain = indexPage("en", [post({})]);
  expect(plain).not.toContain("post-status");
});

test("today block is a collapsed details (no open attribute)", () => {
  const out = render(":::today\n\n```sh\nffmpeg\n```\n\n:::\n");
  expect(out).toContain('<details class="errata-today">');
  expect(out).toContain("How I'd do this today");
  expect(out).not.toContain("<details class=\"errata-today\" open");
  expect(out).not.toContain("<details open");
  // Spanish summary
  const es = render(":::today\n\n```sh\nx\n```\n\n:::\n", { lang: "es" });
  expect(es).toContain("Cómo lo haría hoy");
});

test("scorecard tally counts the post's verdicts", () => {
  const doc = [
    "a[^2026m-a] b[^2026m-b] c[^2026m-c] d[^2026m-d]",
    "",
    "[^2026m-a]: held: one",
    "[^2026m-b]: held: two",
    "[^2026m-c]: partly: three",
    "[^2026m-d]: missed: four",
    "",
    ":::scorecard",
    "## Scored in 2026",
    "",
    "| What | Verdict |",
    "|---|---|",
    "| x | held |",
    ":::",
    "",
  ].join("\n");
  const out = render(doc);
  expect(out).toContain('<p class="scorecard-tally">held <span class="dots">●●</span> partly <span class="dots">◐</span> missed <span class="dots">○</span></p>');
  // the tally sits after the heading, inside the scorecard section
  expect(out.indexOf("Scored in 2026")).toBeLessThan(out.indexOf("scorecard-tally"));
});
