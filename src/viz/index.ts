// Entry point for the `chart` fence. Parses the fence body, reads the pinned CSV,
// renders the SVG(s) in the house style and builds the collapsed data table that
// ships with every chart figure (spec §3.4). Colour is carried entirely by CSS
// classes; the output contains no hex or inline colours.

import { parseChartFence, type ChartSpec } from "./spec.ts";
import { readData, type Table } from "./csv.ts";
import { renderLine, type Variant } from "./line.ts";

export type { ChartSpec } from "./spec.ts";
export { parseChartFence } from "./spec.ts";

export type FigSize = "main" | "margin" | "full";
export type Lang = "en" | "es";

export interface ChartRender {
  media: string; // the SVG(s), ready to drop inside <figure>
  table: string; // the <details class="data"> … </details>
  alt: string; // the takeaway alt text (also the SVG <title>)
}

const esc = (s: string): string =>
  s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function sub(s: string): string {
  // "R_t" -> "R<sub>t</sub>" for the HTML data table header.
  return esc(s).replace(/_(\w)/g, "<sub>$1</sub>");
}

type TableLabels = { table: string; country: string; day: string; peak: string; date: string };
const LABELS: Record<Lang, TableLabels> = {
  en: { table: "Data table", country: "Country", day: "Day", peak: "Peak", date: "Date" },
  es: { table: "Tabla de datos", country: "País", day: "Día", peak: "Pico", date: "Fecha" },
};
const VALUE_LABEL: Record<string, Record<Lang, string>> = {
  deaths: { en: "Deaths", es: "Muertes" },
  rt: { en: "R_t", es: "R_t" },
};

function valueHeader(spec: ChartSpec, lang: Lang): string {
  const m = VALUE_LABEL[spec.y];
  return m ? m[lang] : spec.y;
}

const fmtInt = (n: number): string => Math.round(n).toLocaleString("en-US");

// --- data table ---------------------------------------------------------
function dataTable(spec: ChartSpec, table: Table, lang: Lang): string {
  const L = LABELS[lang];
  const rows: string[] = [];

  if (spec.series) {
    // multi-series: last value per labelled series, then the overall peak
    const labelled = [...(spec.focus ?? []), ...(spec.highlight ? [spec.highlight] : [])];
    let peak: { name: string; x: string; v: number } | null = null;
    for (const name of labelled) {
      const srows = table.rows.filter((r) => r[spec.series!] === name && Number(r[spec.y]) > 0);
      if (srows.length === 0) continue;
      const last = srows[srows.length - 1];
      rows.push(
        `<tr><td>${esc(name)}</td><td class="num">${esc(last[spec.x])}</td>` +
          `<td class="num">${fmtInt(Number(last[spec.y]))}</td></tr>`,
      );
      for (const r of srows) {
        const v = Number(r[spec.y]);
        if (!peak || v > peak.v) peak = { name, x: r[spec.x], v };
      }
    }
    if (peak) {
      rows.push(
        `<tr><td>${L.peak}: ${esc(peak.name)}</td><td class="num">${esc(peak.x)}</td>` +
          `<td class="num">${fmtInt(peak.v)}</td></tr>`,
      );
    }
    const head = `<tr><th>${L.country}</th><th class="num">${L.day}</th><th class="num">${sub(valueHeader(spec, lang))}</th></tr>`;
    return wrapTable(L.table, head, rows);
  }

  // single series: one row per week
  const vh = sub(valueHeader(spec, lang));
  for (let i = 0; i < table.rows.length; i += 7) {
    const r = table.rows[i];
    rows.push(`<tr><td>${esc(r[spec.x])}</td><td class="num">${Number(r[spec.y]).toFixed(2)}</td></tr>`);
  }
  const head = `<tr><th>${L.date}</th><th class="num">${vh}</th></tr>`;
  return wrapTable(L.table, head, rows);
}

function wrapTable(summary: string, head: string, rows: string[]): string {
  return (
    `<details class="data"><summary>${esc(summary)}</summary>` +
    `<table><thead>${head}</thead><tbody>${rows.join("")}</tbody></table></details>`
  );
}

// --- public render ------------------------------------------------------
export function renderChart(body: string, opts: { size: FigSize; lang: Lang; id: string }): ChartRender {
  const spec = parseChartFence(body);
  if (!spec.alt || spec.alt.trim() === "") {
    throw new Error("chart fence is missing required `alt:` takeaway text");
  }
  if (spec.type !== "line") {
    throw new Error(`unsupported chart type: ${spec.type}`);
  }
  const table = readData(spec.data);

  const warn = (ws: string[]): void => {
    for (const w of ws) console.warn(`[viz] ${spec.data}: ${w}`);
  };

  let media: string;
  if (opts.size === "main") {
    const wide = renderLine(spec, table, "mainWide", `${opts.id}-t`);
    const narrow = renderLine(spec, table, "mainNarrow", `${opts.id}-ts`);
    warn(wide.warnings);
    media =
      `<div class="viz-wrap">` +
      `<div class="viz-wide">${wide.svg}</div>` +
      `<div class="viz-narrow">${narrow.svg}</div>` +
      `</div>`;
  } else if (opts.size === "full") {
    const wide = renderLine(spec, table, "mainWide", `${opts.id}-t`);
    warn(wide.warnings);
    media = `<div class="hscroll">${wide.svg}</div>`;
  } else {
    const m = renderLine(spec, table, "margin", `${opts.id}-t`);
    warn(m.warnings);
    media = m.svg;
  }

  return { media, table: dataTable(spec, table, opts.lang), alt: spec.alt };
}
