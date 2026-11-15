// Label-width measurement with the repo's ET Book line-figures woff (the same
// face the charts render ticks and labels in), used for collision checks, leader
// decisions and right-margin sizing. opentype.js is already a devDependency (the
// OG image uses it). If the font can't be loaded for any reason we fall back to
// a crude per-character estimate so the build never fails on a measurement.

import { parse } from "opentype.js";
import type { Font } from "opentype.js";
import { readFileSync } from "node:fs";

let font: Font | null = null;
let tried = false;

function getFont(): Font | null {
  if (tried) return font;
  tried = true;
  try {
    const buf = readFileSync("public/fonts/et-book-roman-line-figures.woff");
    font = parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  } catch {
    font = null;
  }
  return font;
}

// Advance width of `text` at `size` px in the chart label face.
export function textWidth(text: string, size: number): number {
  const f = getFont();
  if (f) {
    try {
      return f.getAdvanceWidth(text, size);
    } catch {
      /* fall through to estimate */
    }
  }
  // Rough fallback: ET Book runs ~0.5em average advance.
  return text.length * size * 0.5;
}
