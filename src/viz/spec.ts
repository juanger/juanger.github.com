// The `chart` fence body is a small key: value block (no YAML dependency). Values
// are scalars, bracketed lists ([a, b, c]) or quoted strings. Keys map onto the
// ChartSpec consumed by the renderers.

export interface ChartSpec {
  type: string;
  data: string;
  x: string;
  y: string;
  scale?: "log" | "linear";
  xUnit?: "day" | "date";
  series?: string; // grouping column for a multi-series line
  focus?: string[]; // ink focus series
  exclude?: string[]; // series left out entirely
  highlight?: string; // the single accent series
  ref?: number; // reference line y value (R = 1)
  refLabel?: string;
  band?: [string, string]; // [low, high] columns -> wash area
  split?: string; // x value where the line turns from fit (ink) to projection (accent)
  markerAt?: string; // x value for a vertical hairline
  markerLabel?: string;
  peak?: boolean; // label the peak value
  yTicks?: number[];
  yMin?: number;
  yMax?: number;
  xMax?: number;
  xFrom?: string; // drop rows before this x (a number or a YYYY-MM-DD date)
  xTickStep?: number;
  xTitle?: string;
  yTitle?: string;
  note?: string; // italic note naming the context/peaked group
  alt: string; // required: the takeaway alt text
}

function unquote(s: string): string {
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1);
  return t;
}

function parseValue(raw: string): string | number | string[] {
  const v = raw.trim();
  if (v.startsWith("[") && v.endsWith("]")) {
    return v
      .slice(1, -1)
      .split(",")
      .map((s) => unquote(s))
      .filter((s) => s !== "");
  }
  const u = unquote(v);
  if (u !== "" && !Number.isNaN(Number(u)) && /^[-+0-9.eE]+$/.test(u)) return Number(u);
  return u;
}

export function parseChartFence(body: string): ChartSpec {
  const raw: Record<string, string | number | string[]> = {};
  for (const line of body.split("\n")) {
    if (line.trim() === "" || line.trim().startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    raw[key] = parseValue(line.slice(idx + 1));
  }

  const str = (k: string): string | undefined => (raw[k] === undefined ? undefined : String(raw[k]));
  const num = (k: string): number | undefined => (raw[k] === undefined ? undefined : Number(raw[k]));
  const list = (k: string): string[] | undefined => (Array.isArray(raw[k]) ? (raw[k] as string[]) : raw[k] === undefined ? undefined : [String(raw[k])]);

  const spec: ChartSpec = {
    type: str("type") ?? "line",
    data: str("data") ?? "",
    x: str("x") ?? "",
    y: str("y") ?? "",
    scale: str("scale") === "log" ? "log" : str("scale") === "linear" ? "linear" : undefined,
    xUnit: str("xUnit") === "date" ? "date" : str("xUnit") === "day" ? "day" : undefined,
    series: str("series"),
    focus: list("focus"),
    exclude: list("exclude"),
    highlight: str("highlight"),
    ref: num("ref"),
    refLabel: str("refLabel"),
    band: Array.isArray(raw["band"]) && (raw["band"] as string[]).length === 2 ? (raw["band"] as [string, string]) : undefined,
    split: str("split"),
    markerAt: str("markerAt"),
    markerLabel: str("markerLabel"),
    peak: str("peak") === "true",
    yTicks: Array.isArray(raw["yTicks"]) ? (raw["yTicks"] as string[]).map(Number) : undefined,
    yMin: num("yMin"),
    yMax: num("yMax"),
    xMax: num("xMax"),
    xFrom: str("xFrom"),
    xTickStep: num("xTickStep"),
    xTitle: str("xTitle"),
    yTitle: str("yTitle"),
    note: str("note"),
    alt: str("alt") ?? "",
  };
  return spec;
}
