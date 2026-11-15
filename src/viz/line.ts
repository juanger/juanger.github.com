// The `line` chart: a focus/context/highlight line chart that emits house-style
// SVG (spec §2, §6). Handles both the multi-series argument chart (all series as
// grey context, a few ink "focus" lines, one accent "highlight", direct labels
// at the line ends) and the single-series projection chart (a `split` where the
// line turns from ink to the accent, a p10–p90 `band`, a reference line, a
// vertical `marker` and a labelled peak).
//
// All colour is carried by CSS classes (.ctx/.focus/.hl/.grid/.axis/.ref/.wash/
// .dot/.dot-hl/.label/.tick/.note/.axis-title). The output contains no hex or
// inline colours, and every mark carries a <title> for the no-JS hover layer and
// screen readers.

import { scaleLinear, scaleLog } from "d3-scale";
import { line as d3line, area as d3area } from "d3-shape";
import { textWidth } from "./measure.ts";
import type { ChartSpec } from "./spec.ts";
import type { Table } from "./csv.ts";

export type Variant = "mainWide" | "mainNarrow" | "margin";

type SizeCfg = { W: number; H: number; top: number; right: number | null; bottom: number; left: number; cls: string };
const SIZES: Record<Variant, SizeCfg> = {
  mainWide: { W: 680, H: 330, top: 40, right: null, bottom: 34, left: 44, cls: "viz" },
  mainNarrow: { W: 360, H: 300, top: 36, right: null, bottom: 30, left: 36, cls: "viz viz-sm" },
  margin: { W: 272, H: 190, top: 28, right: 10, bottom: 28, left: 30, cls: "viz viz-sm" },
};

// --- small helpers -------------------------------------------------------
function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}
function r1(n: number): number {
  return Math.round(n * 10) / 10;
}
const fmtInt = (n: number): string => Math.round(n).toLocaleString("en-US");
const fmtDec = (n: number): string => n.toFixed(1);

// Axis title "R_t" / "deaths …" — a single `_x` becomes a subscript tspan.
function titleMarkup(s: string): string {
  return esc(s).replace(/_(\w)/g, '<tspan class="sub" dy="3">$1</tspan>');
}

// Parse a YYYY-MM-DD date to a UTC day number (dates are the only time unit here).
function dayNum(d: string): number {
  return Date.parse(d + "T00:00:00Z") / 86400000;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export type LineResult = { svg: string; warnings: string[] };

export function renderLine(spec: ChartSpec, table: Table, variant: Variant, titleId: string): LineResult {
  const cfg = SIZES[variant];
  const warnings: string[] = [];
  const isDate = spec.xUnit === "date";
  const log = spec.scale === "log";
  const multi = Boolean(spec.series);

  // --- group rows into series -------------------------------------------
  type Pt = { x: number; v: number };
  type Series = { name: string; pts: Pt[] };
  const xv = (row: Record<string, string>): number => (isDate ? dayNum(row[spec.x]) : Number(row[spec.x]));

  const series: Series[] = [];
  if (multi) {
    const by = new Map<string, Pt[]>();
    for (const row of table.rows) {
      const name = row[spec.series!];
      const v = Number(row[spec.y]);
      // On a log scale, a non-positive value ends the line at the last positive
      // point (Spain's 25 May revision goes negative); skip it rather than break.
      if (log && !(v > 0)) continue;
      if (!by.has(name)) by.set(name, []);
      by.get(name)!.push({ x: xv(row), v });
    }
    for (const [name, pts] of by) {
      pts.sort((a, b) => a.x - b.x);
      series.push({ name, pts });
    }
  } else {
    const pts: Pt[] = [];
    for (const row of table.rows) {
      const v = Number(row[spec.y]);
      if (log && !(v > 0)) continue;
      pts.push({ x: xv(row), v });
    }
    pts.sort((a, b) => a.x - b.x);
    series.push({ name: spec.y, pts });
  }

  // --- roles -------------------------------------------------------------
  const focusSet = new Set(spec.focus ?? []);
  const hlName = spec.highlight;
  const labelled = (name: string): boolean => multi && (focusSet.has(name) || name === hlName);

  // --- x / y domains -----------------------------------------------------
  const allX = series.flatMap((s) => s.pts.map((p) => p.x));
  const allV = series.flatMap((s) => s.pts.map((p) => p.v));
  const xMin = isDate ? Math.min(...allX) : 0;
  const xMax = spec.xMax ?? Math.max(...allX);
  const yMax = spec.yMax ?? Math.max(...allV);
  const yMin = spec.yMin ?? (log ? 5 : 0);

  // --- right margin: reserve room for the widest end label ---------------
  const labelSize = variant === "mainWide" ? 13 : 12;
  let right = cfg.right ?? 12;
  if (cfg.right === null) {
    let maxLabel = 0;
    for (const s of series) if (labelled(s.name)) maxLabel = Math.max(maxLabel, textWidth(s.name, labelSize));
    right = Math.ceil(maxLabel) + 16; // 8px gap after the dot + padding
  }

  const plotLeft = cfg.left;
  const plotRight = cfg.W - right;
  const plotTop = cfg.top;
  const axisY = cfg.H - cfg.bottom;

  const x = scaleLinear().domain([xMin, xMax]).range([plotLeft, plotRight]);
  const y = log
    ? scaleLog().domain([yMin, yMax]).range([axisY, plotTop]).clamp(true)
    : scaleLinear().domain([yMin, yMax]).range([axisY, plotTop]).clamp(true);

  const px = (p: Pt): [number, number] => [x(p.x), y(p.v)];
  const path = d3line<Pt>().x((p) => x(p.x)).y((p) => y(p.v));

  // --- build SVG pieces --------------------------------------------------
  const parts: string[] = [];
  parts.push(`<title id="${titleId}">${esc(spec.alt)}</title>`);

  // y-axis title, horizontal, top-left (never rotated)
  if (spec.yTitle) {
    const ty = Math.max(10, plotTop - (variant === "margin" ? 18 : 26));
    parts.push(`<text class="axis-title" x="${plotLeft}" y="${ty}">${titleMarkup(spec.yTitle)}</text>`);
  }

  // horizontal gridlines + right-anchored tick labels
  const yTicks = spec.yTicks ?? (log ? [10, 100, 1000] : [1, 2, 3]);
  for (const t of yTicks) {
    if (t < yMin || t > yMax) continue;
    const gy = r1(y(t));
    parts.push(`<line class="grid" x1="${plotLeft}" x2="${plotRight}" y1="${gy}" y2="${gy}"/>`);
    parts.push(`<text class="tick" x="${plotLeft - 8}" y="${gy + 4}" text-anchor="end">${fmtInt(t)}</text>`);
  }

  // reference line (e.g. R = 1)
  if (spec.ref !== undefined && spec.ref >= yMin && spec.ref <= yMax) {
    const ry = r1(y(spec.ref));
    parts.push(`<line class="ref" x1="${plotLeft}" x2="${plotRight}" y1="${ry}" y2="${ry}"/>`);
    if (spec.refLabel) parts.push(`<text class="note" x="${plotRight}" y="${ry + 14}" text-anchor="end">${esc(spec.refLabel)}</text>`);
  }

  // uncertainty band (projection only, from the split onward if present)
  if (spec.band) {
    const [lo, hi] = spec.band;
    const splitX = spec.split ? (isDate ? dayNum(spec.split) : Number(spec.split)) : xMin;
    const bandRows = table.rows.filter((row) => xv(row) >= splitX);
    const bandPts = bandRows.map((row) => ({ x: xv(row), lo: Number(row[lo]), hi: Number(row[hi]) }));
    const bandArea = d3area<{ x: number; lo: number; hi: number }>()
      .x((d) => x(d.x))
      .y0((d) => y(d.lo))
      .y1((d) => y(d.hi));
    const d = bandArea(bandPts);
    if (d) parts.push(`<path class="wash" d="${d}"><title>10–90% interval</title></path>`);
  }

  // range-frame x-axis with outward ticks
  parts.push(`<line class="axis" x1="${plotLeft}" x2="${r1(x(xMax))}" y1="${axisY}" y2="${axisY}"/>`);
  type XTick = { at: number; label: string };
  const xTicks: XTick[] = [];
  if (isDate) {
    // quarter-month ticks (Jan / Apr / Jul / Oct) inside the data range
    const start = new Date(xMin * 86400000);
    let yr = start.getUTCFullYear();
    let mo = start.getUTCMonth();
    for (let g = 0; g < 48; g++) {
      const t = dayNum(`${yr}-${String(mo + 1).padStart(2, "0")}-01`);
      if (t > xMax) break;
      if (t >= xMin && mo % 3 === 0) xTicks.push({ at: t, label: MONTHS[mo] });
      mo++;
      if (mo > 11) { mo = 0; yr++; }
    }
  } else {
    const step = spec.xTickStep ?? 20;
    for (let t = 0; t <= xMax; t += step) xTicks.push({ at: t, label: fmtInt(t) });
  }
  for (const t of xTicks) {
    const tx = r1(x(t.at));
    parts.push(`<line class="axis" x1="${tx}" x2="${tx}" y1="${axisY}" y2="${axisY + 4}"/>`);
    parts.push(`<text class="tick" x="${tx}" y="${axisY + 18}" text-anchor="middle">${esc(t.label)}</text>`);
  }
  if (spec.xTitle) parts.push(`<text class="axis-title" x="${plotRight}" y="${cfg.H - 2}" text-anchor="end">${esc(spec.xTitle)}</text>`);

  // --- the lines ---------------------------------------------------------
  // context first (behind), then focus, then highlight (front)
  const ctx = series.filter((s) => multi && !labelled(s.name));
  const foc = series.filter((s) => focusSet.has(s.name));
  const hl = series.filter((s) => s.name === hlName);

  for (const s of ctx) {
    const d = path(s.pts);
    if (d) parts.push(`<path class="ctx" d="${d}"><title>${esc(s.name)}</title></path>`);
  }

  // end-label placement for labelled series (focus + highlight)
  type EndLabel = { name: string; dotX: number; dotY: number; labelY: number; value: number; xval: number; hl: boolean };
  const ends: EndLabel[] = [];

  if (multi) {
    for (const s of [...foc, ...hl]) {
      const last = s.pts[s.pts.length - 1];
      const [dx, dy] = px(last);
      ends.push({ name: s.name, dotX: dx, dotY: dy, labelY: dy, value: last.v, xval: last.x, hl: s.name === hlName });
    }
    // de-collide labels vertically: sort by y, enforce a minimum gap downward
    const gap = variant === "mainWide" ? 14 : 12;
    ends.sort((a, b) => a.labelY - b.labelY);
    for (let i = 1; i < ends.length; i++) {
      if (ends[i].labelY - ends[i - 1].labelY < gap) ends[i].labelY = ends[i - 1].labelY + gap;
    }
  }

  for (const s of foc) {
    const d = path(s.pts);
    if (d) parts.push(`<path class="focus" d="${d}"><title>${esc(s.name)}</title></path>`);
  }
  for (const s of hl) {
    const d = path(s.pts);
    if (d) parts.push(`<path class="hl" d="${d}"><title>${esc(s.name)}</title></path>`);
  }

  // dots + direct labels (with a leader when a label was nudged off its dot)
  for (const e of ends) {
    const dayLabel = isDate ? "" : ` on day ${e.xval}`;
    const valStr = fmtInt(e.value);
    if (Math.abs(e.labelY - e.dotY) > 1.5) {
      parts.push(`<line class="ctx" x1="${r1(e.dotX + 4)}" x2="${r1(e.dotX + 8)}" y1="${r1(e.dotY)}" y2="${r1(e.labelY - 4)}"/>`);
    }
    parts.push(
      `<circle class="${e.hl ? "dot-hl" : "dot"}" cx="${r1(e.dotX)}" cy="${r1(e.dotY)}" r="${e.hl ? 4 : 3}">` +
        `<title>${esc(e.name)}: ${valStr}${dayLabel}</title></circle>`,
    );
    parts.push(
      `<text class="${e.hl ? "label-hl" : "label"}" x="${r1(e.dotX + 8)}" y="${r1(e.labelY + 4)}">${esc(e.name)}</text>`,
    );
    const rightEdge = e.dotX + 8 + textWidth(e.name, labelSize);
    if (rightEdge > cfg.W) warnings.push(`label "${e.name}" overflows the ${variant} viewBox`);
  }

  // --- single-series split (ink fit / accent projection) + peak ----------
  if (!multi) {
    const s = series[0];
    const splitX = spec.split ? (isDate ? dayNum(spec.split) : Number(spec.split)) : xMax;
    const fit = s.pts.filter((p) => p.x <= splitX);
    const proj = s.pts.filter((p) => p.x >= splitX);
    const dFit = path(fit);
    const dProj = path(proj);
    if (dFit) parts.push(`<path class="focus" d="${dFit}"><title>${esc(spec.yTitle ?? s.name)} (fit)</title></path>`);
    if (spec.split && dProj) parts.push(`<path class="hl" d="${dProj}"><title>${esc(spec.yTitle ?? s.name)} (projection)</title></path>`);
    else if (!spec.split && dFit === null && dProj) parts.push(`<path class="focus" d="${dProj}"/>`);

    // vertical marker hairline + italic label
    if (spec.markerAt) {
      const mx = r1(x(isDate ? dayNum(spec.markerAt) : Number(spec.markerAt)));
      parts.push(`<line class="axis" x1="${mx}" x2="${mx}" y1="${plotTop - 10}" y2="${axisY}"/>`);
      if (spec.markerLabel) parts.push(`<text class="note" x="${mx + 5}" y="${plotTop - 2}">${esc(spec.markerLabel)}</text>`);
    }

    // labelled peak of the projection (or of the whole line if no split)
    if (spec.peak) {
      const pool = spec.split ? proj : s.pts;
      let pk = pool[0];
      for (const p of pool) if (p.v > pk.v) pk = p;
      const [pxv, pyv] = px(pk);
      parts.push(`<circle class="dot-hl" cx="${r1(pxv)}" cy="${r1(pyv)}" r="3.5"><title>peak ${fmtDec(pk.v)}</title></circle>`);
      parts.push(`<text class="value" x="${r1(pxv + 7)}" y="${r1(pyv - 4)}">${fmtDec(pk.v)}</text>`);
    }
  }

  // --- optional italic note (names the peaked/context group) -------------
  if (spec.note) {
    const nx = (plotLeft + plotRight) / 2 - textWidth(spec.note, labelSize) / 2;
    parts.push(`<text class="note" x="${r1(Math.max(plotLeft, nx))}" y="${plotTop - 8}">${esc(spec.note)}</text>`);
  }

  const svg =
    `<svg class="${cfg.cls}" viewBox="0 0 ${cfg.W} ${cfg.H}" role="img" aria-labelledby="${titleId}" ` +
    `xmlns="http://www.w3.org/2000/svg">${parts.join("")}</svg>`;
  return { svg, warnings };
}
