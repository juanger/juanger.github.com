// Minimal CSV reader for the pinned data snapshots in data/. The snapshots are
// plain comma-separated values with a header row and no quoted fields or commas
// inside cells, so a split is enough — no CSV dependency.

import { readFileSync } from "node:fs";

export type Row = Record<string, string>;
export type Table = { columns: string[]; rows: Row[] };

export function parseCsv(text: string): Table {
  const lines = text.replace(/\r\n/g, "\n").trim().split("\n");
  const columns = lines[0].split(",").map((c) => c.trim());
  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === "") continue;
    const cells = lines[i].split(",");
    const row: Row = {};
    for (let c = 0; c < columns.length; c++) row[columns[c]] = (cells[c] ?? "").trim();
    rows.push(row);
  }
  return { columns, rows };
}

// Data paths in a chart fence are relative to the repo's data/ directory, read
// synchronously at render (build) time.
export function readData(relPath: string): Table {
  const clean = relPath.replace(/^\/+/, "");
  return parseCsv(readFileSync(`data/${clean}`, "utf8"));
}
