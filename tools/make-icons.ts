// One-off generator for the site's favicon, apple-touch icon and default
// OpenGraph image. NOT part of the build — run it by hand after changing the
// mark or the font, then commit the generated files in public/:
//
//   bun run tools/make-icons.ts
//
// It turns ET Book glyphs into SVG paths with opentype.js and rasterizes them
// with @resvg/resvg-js (both devDependencies). No network, no app imports.

import opentype from "opentype.js";
import { Resvg } from "@resvg/resvg-js";

const PAPER = "#fbf8f1";
const ACCENT = "#9b1b30";
const INK_MUTED = "#5c5248";

const SITE_NAME = "Ruby Xocolatl";
const SUBTITLE = "Shenanigans of my not so exciting life.";
const MARK = "RX"; // the favicon letters; both are readable at favicon sizes in ET Book

const ROMAN = "public/fonts/et-book-roman-old-style-figures.woff";
const ITALIC = "public/fonts/et-book-display-italic-old-style-figures.woff";

async function loadFont(path: string): Promise<opentype.Font> {
  return opentype.parse(await Bun.file(path).arrayBuffer());
}

type Laid = { path: opentype.Path; x1: number; y1: number; x2: number; y2: number };

// Plain run of text on the baseline y=0.
function layout(font: opentype.Font, text: string, size: number): Laid {
  const p = font.getPath(text, 0, 0, size);
  const b = p.getBoundingBox();
  return { path: p, x1: b.x1, y1: b.y1, x2: b.x2, y2: b.y2 };
}

// Synthesized small caps (the masthead look): word-initial capitals stay full
// size, the rest render as smaller capitals, with a little tracking.
function smallCaps(font: opentype.Font, text: string, cap: number): Laid {
  const small = cap * 0.78;
  const tracking = cap * 0.06;
  const full = new opentype.Path();
  let x = 0;
  for (const ch of text) {
    if (ch === " ") { x += cap * 0.34; continue; }
    const isUpper = ch !== ch.toLowerCase() && ch === ch.toUpperCase();
    const size = isUpper ? cap : small;
    const g = ch.toUpperCase();
    full.extend(font.getPath(g, x, 0, size));
    x += font.getAdvanceWidth(g, size) + tracking;
  }
  const b = full.getBoundingBox();
  return { path: full, x1: b.x1, y1: b.y1, x2: b.x2, y2: b.y2 };
}

// A <g> that scales a baseline-0 path to `s` and places its left edge at `left`
// and baseline at `baseline`, filled with `fill`.
function place(laid: Laid, s: number, left: number, baseline: number, fill: string): string {
  const tx = left - s * laid.x1;
  return `<g transform="translate(${tx.toFixed(2)} ${baseline}) scale(${s})" fill="${fill}">` +
    `<path d="${laid.path.toPathData(2)}"/></g>`;
}

const width = (l: Laid) => l.x2 - l.x1;
const svgDoc = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">` +
  `<rect width="${w}" height="${h}" fill="${PAPER}"/>${body}</svg>`;

function rasterize(svg: string, px: number): Uint8Array {
  const r = new Resvg(svg, { fitTo: { mode: "width", value: px }, background: PAPER });
  return r.render().asPng();
}

// Wrap a single PNG as a (PNG-encoded) .ico — one 6-byte header + one 16-byte
// directory entry + the PNG payload.
function pngToIco(png: Uint8Array, size: number): Uint8Array {
  const head = new Uint8Array(22);
  const dv = new DataView(head.buffer);
  dv.setUint16(2, 1, true); // type: icon
  dv.setUint16(4, 1, true); // image count
  head[6] = size >= 256 ? 0 : size; // width
  head[7] = size >= 256 ? 0 : size; // height
  dv.setUint16(10, 1, true); // color planes
  dv.setUint16(12, 32, true); // bits per pixel
  dv.setUint32(14, png.length, true); // bytes in payload
  dv.setUint32(18, 22, true); // payload offset
  const out = new Uint8Array(22 + png.length);
  out.set(head, 0);
  out.set(png, 22);
  return out;
}

const roman = await loadFont(ROMAN);
const italic = await loadFont(ITALIC);

// ---- favicon (square): RX centered on paper ----
{
  const S = 64;
  const m = S * 0.16;
  const l = smallCaps(roman, MARK, 100); // word-initials both caps -> both full size
  const s = Math.min((S - 2 * m) / width(l), (S - 2 * m) / (l.y2 - l.y1));
  const left = (S - width(l) * s) / 2;
  // vertically center the cap band
  const baseline = (S - (l.y2 - l.y1) * s) / 2 - l.y1 * s;
  const svg = svgDoc(S, S, place(l, s, left, baseline, ACCENT));
  await Bun.write("public/favicon.svg", svg);
  const png32 = rasterize(svg, 32);
  await Bun.write("public/favicon.png", png32);
  await Bun.write("public/favicon.ico", pngToIco(png32, 32));
  await Bun.write("public/apple-touch-icon.png", rasterize(svg, 180));
  console.log("wrote favicon.svg, favicon.png (32), favicon.ico (32), apple-touch-icon.png (180)");
}

// ---- default OpenGraph image (1200×630) ----
{
  const W = 1200, H = 630, margin = 130;
  const maxW = W - 2 * margin;

  const title = smallCaps(roman, SITE_NAME, 190);
  const ts = Math.min(1, maxW / width(title));
  const titleBaseline = 320;

  const sub = layout(italic, SUBTITLE, 52);
  const ss = Math.min(1, maxW / width(sub));
  const subBaseline = 440;

  const body =
    place(title, ts, (W - width(title) * ts) / 2, titleBaseline, ACCENT) +
    place(sub, ss, (W - width(sub) * ss) / 2, subBaseline, INK_MUTED);
  const svg = svgDoc(W, H, body);
  await Bun.write("public/og.png", rasterize(svg, W));
  console.log("wrote og.png (1200×630)");
}
