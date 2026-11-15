// Unit tests for the build-time chart module (src/viz). They exercise the output
// contract (no inline colours, a <title> per mark, required alt text), log ticks
// and the range frame, plus the two chart shapes used by the COVID post.

import { test, expect } from "bun:test";
import { renderChart, parseChartFence } from "../src/viz/index.ts";

const DEATHS = `
type: line
data: 2020-05-30/covid-deaths.csv
x: day
y: deaths
scale: log
xUnit: day
series: country
focus: [Brazil, India, Chile, Colombia]
highlight: Mexico
yTicks: [10, 100, 1000]
xTickStep: 20
yTitle: deaths per day · 7-day average · log scale
xTitle: days since 5 daily deaths first reported
note: past their peak: US, UK, France, Italy, Spain …
alt: Daily COVID-19 deaths by country, log scale.
`;

const RT = `
type: line
data: 2020-05-30/ca-rt.csv
x: date
y: rt
scale: linear
xUnit: date
yMin: 0
yMax: 4
yTicks: [1, 2, 3]
band: [p10, p90]
split: 2020-05-16
markerAt: 2020-05-20
markerLabel: reopening
ref: 1
refLabel: R = 1
peak: true
yTitle: R_t
alt: Modelled Rt for California.
`;

const deaths = renderChart(DEATHS, { size: "main", lang: "en", id: "fig-deaths" });
const rt = renderChart(RT, { size: "margin", lang: "en", id: "fig-rt" });

test("fence parser reads scalars, lists and the required alt", () => {
  const spec = parseChartFence(DEATHS);
  expect(spec.type).toBe("line");
  expect(spec.scale).toBe("log");
  expect(spec.focus).toEqual(["Brazil", "India", "Chile", "Colombia"]);
  expect(spec.highlight).toBe("Mexico");
  expect(spec.yTicks).toEqual([10, 100, 1000]);
});

test("a missing alt throws (takeaway text is required)", () => {
  expect(() => renderChart("type: line\ndata: 2020-05-30/ca-rt.csv\nx: date\ny: rt", { size: "margin", lang: "en", id: "x" })).toThrow(/alt/);
});

test("output carries no inline colours — every colour is a CSS class", () => {
  for (const out of [deaths.media, rt.media]) {
    expect(out).not.toMatch(/#[0-9a-fA-F]{3,6}\b/); // no hex
    expect(out).not.toMatch(/rgb\(/); // no rgb()
    expect(out).not.toMatch(/\s(fill|stroke)="/); // no fill=/stroke= attributes at all
  }
});

test("every <path> carries a <title> (the no-JS hover layer)", () => {
  for (const out of [deaths.media, rt.media]) {
    const paths = out.match(/<path\b/g)?.length ?? 0;
    const withTitle = out.match(/<path\b[^>]*><title>/g)?.length ?? 0;
    expect(paths).toBeGreaterThan(0);
    expect(withTitle).toBe(paths);
  }
});

test("the SVG is accessible: role=img + aria-labelledby a real <title id>", () => {
  const svg = deaths.media.match(/<svg[^>]*>/)![0];
  expect(svg).toContain('role="img"');
  const idm = svg.match(/aria-labelledby="([^"]+)"/)!;
  expect(deaths.media).toContain(`<title id="${idm[1]}">`);
});

test("log scale: gridline ticks at 10 / 100 / 1,000 with a thousands separator", () => {
  const svg = deaths.media;
  expect(svg).toMatch(/<text class="tick"[^>]*>10<\/text>/);
  expect(svg).toMatch(/<text class="tick"[^>]*>100<\/text>/);
  expect(svg).toMatch(/<text class="tick"[^>]*>1,000<\/text>/);
  expect(svg).toContain('<line class="grid"');
});

test("range frame: an x-axis line and outward ticks, no plot box, no y-axis line", () => {
  const svg = deaths.media;
  expect(svg).toContain('<line class="axis"'); // x axis + ticks
  expect(svg).not.toContain("<rect"); // never box the plot
  // x ticks every 20 up to the data max (China's last positive day is 119)
  for (const t of ["0", "20", "40", "60", "80", "100"]) {
    expect(svg).toMatch(new RegExp(`<text class="tick"[^>]*text-anchor="middle">${t}</text>`));
  }
});

test("roles: highlight series is .hl, focus is .focus, the crowd is .ctx", () => {
  const svg = deaths.media;
  expect(svg).toMatch(/<path class="hl"[^>]*><title>Mexico<\/title>/);
  expect(svg).toMatch(/<path class="focus"[^>]*><title>Brazil<\/title>/);
  expect(svg).toMatch(/<path class="ctx"[^>]*><title>United States<\/title>/);
  // direct labels at the line ends, highlight label bold
  expect(svg).toContain('<text class="label-hl"');
  expect(svg).toContain(">Mexico</text>");
});

test("per-mark <title> tooltips carry the value and day", () => {
  // Mexico ends day 57 at 346.6 -> 347; Brazil day 66 at 975.7 -> 976.
  expect(deaths.media).toContain("Mexico: 347 on day 57");
  expect(deaths.media).toContain("Brazil: 976 on day 66");
});

test("data table: last value per labelled series plus the peak", () => {
  const t = deaths.table;
  expect(t).toContain("<summary>Data table</summary>");
  expect(t).toMatch(/Mexico<\/td><td class="num">57<\/td><td class="num">347/);
  expect(t).toMatch(/Brazil<\/td><td class="num">66<\/td><td class="num">976/);
  expect(t).toMatch(/Peak/);
});

test("Rt chart: reference line, wash band, fit/projection split and a labelled peak", () => {
  const svg = rt.media;
  expect(svg).toContain('<line class="ref"'); // R = 1
  expect(svg).toContain('<path class="wash"'); // p10–p90 band
  expect(svg).toContain('<path class="focus"'); // observed fit
  expect(svg).toContain('<path class="hl"'); // projection
  expect(svg).toMatch(/<text class="value"[^>]*>2\.4<\/text>/); // peak 2.4
  expect(svg).toContain(">reopening</text>"); // vertical marker label
  expect(rt.table).toContain("<summary>Data table</summary>");
});

test("Spanish data table localises the summary and headers", () => {
  const es = renderChart(DEATHS, { size: "main", lang: "es", id: "f" });
  expect(es.table).toContain("<summary>Tabla de datos</summary>");
  expect(es.table).toContain("<th>País</th>");
  expect(es.table).toContain("Muertes");
});

test("main charts ship a wide and a narrow SVG variant", () => {
  expect(deaths.media).toContain('class="viz-wide"');
  expect(deaths.media).toContain('class="viz-narrow"');
  expect(deaths.media).toContain('viewBox="0 0 680 330"');
  expect(deaths.media).toContain('viewBox="0 0 360 300"');
});
