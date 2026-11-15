// Unit tests for the :::figure container (src/markdown.ts): build-time numbering,
// ids, [@fig-id] cross-references, the caption + source markup, Spanish labels,
// nesting inside a list item, and that bare images / :::fullwidth are untouched.

import { test, expect } from "bun:test";
import { render } from "../src/markdown.ts";

const CHART = `\`\`\`chart
type: line
data: 2020-05-30/ca-rt.csv
x: date
y: rt
scale: linear
xUnit: date
yMin: 0
yMax: 4
alt: takeaway
\`\`\``;

function fig(size: string, id: string, caption = "A caption.", source = "Source: somewhere.") {
  return `:::figure ${size} #${id}\n${CHART}\n\n${caption}\n\n${source}\n:::`;
}

test("figures are numbered in document order, only when captioned", () => {
  const html = render(`${fig("main", "a")}\n\n${fig("margin", "b")}`, { lang: "en" });
  expect(html).toContain('<span class="fig-label">Figure 1</span>');
  expect(html).toContain('<span class="fig-label">Figure 2</span>');
});

test("an uncaptioned figure is not numbered and does not consume a number", () => {
  const uncaptioned = `:::figure main #u\n${CHART}\n:::`;
  const html = render(`${uncaptioned}\n\n${fig("main", "a")}`, { lang: "en" });
  // the only label is Figure 1, belonging to the captioned figure
  expect(html.match(/fig-label/g)?.length).toBe(1);
  expect(html).toContain("Figure 1");
  expect(html).not.toContain("Figure 2");
});

test("the figure id and size class are written to the <figure>", () => {
  const html = render(fig("full", "deaths"), { lang: "en" });
  expect(html).toContain('<figure class="full" id="deaths">');
});

test("[@fig-id] renders as a linked 'Figure N'", () => {
  const html = render(`See [@b] below.\n\n${fig("main", "a")}\n\n${fig("main", "b")}`, { lang: "en" });
  // a non-breaking space keeps the reference from wrapping
  expect(html).toContain('<a href="#b" class="fig-ref">Figure 2</a>');
});

test("caption markup: label, italic text span and a small-caps source line", () => {
  const html = render(fig("main", "a", "What is plotted.", "Source: European CDC, CC BY."), { lang: "en" });
  expect(html).toContain('<span class="fig-text">What is plotted.</span>');
  expect(html).toContain('<span class="fig-source"><span class="sc">Source</span> European CDC, CC BY.</span>');
});

test("Spanish posts use Figura and Fuente", () => {
  const html = render(fig("margin", "a", "Un pie.", "Fuente: alguien."), { lang: "es" });
  expect(html).toContain('<span class="fig-label">Figura 1</span>');
  expect(html).toContain('<span class="sc">Fuente</span>');
});

test("the figcaption comes first in the DOM (reading order), before the media", () => {
  const html = render(fig("main", "a"), { lang: "en" });
  expect(html.indexOf("<figcaption>")).toBeLessThan(html.indexOf("viz-wrap"));
});

test("a :::figure may be nested inside a list item", () => {
  const md = `- An item with a figure.\n\n  ${fig("margin", "rt").split("\n").join("\n  ")}`;
  const html = render(md, { lang: "en" });
  const li = html.match(/<li>[\s\S]*?<\/li>/)![0];
  expect(li).toContain('<figure class="margin" id="rt">');
  expect(li).toContain("svg");
});

test("every chart figure ships a collapsed data table", () => {
  const html = render(fig("main", "a"), { lang: "en" });
  expect(html).toContain('<details class="data">');
});

test("bare images and :::fullwidth are left untouched", () => {
  // bare image -> old marginnote figure (no fig-label, no figcaption)
  const bare = render(`![alt text](/img.png "a title")`, { lang: "en" });
  expect(bare).toContain("<figure>");
  expect(bare).toContain('class="marginnote"');
  expect(bare).not.toContain("fig-label");
  // :::fullwidth stays a plain fullwidth figure
  const full = render(`:::fullwidth\ncontent\n:::`, { lang: "en" });
  expect(full).toContain('<figure class="fullwidth">');
});
