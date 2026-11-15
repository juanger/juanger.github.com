// Rebuilds data/2020-05-30/*.csv for the "Life after COVID-19" charts from pinned
// upstream snapshots, so the figures show what was known when the post was written.
//
//   bun run scripts/covid-data.ts
//
// deaths: Our World in Data's copy of the European CDC data, as committed on 30 May 2020.
// rt: Modeling COVID's California run of 16 May 2020, "Normal" scenario (the last run
// published in their repo; the post's screenshot came from a slightly later run).

const OWID = "https://raw.githubusercontent.com/owid/covid-19-data/9ef1a9ad2ed1eafba3f634ddfa693a5713b6be48/public/data/ecdc/full_data.csv";
const MODEL = "https://raw.githubusercontent.com/modelingcovid/covidmodel/27bf43d3f1acff2e2c38b1829baa5fadfb12e1fb/public/json/CA/scenario4";
const OUT = new URL("../data/2020-05-30/", import.meta.url).pathname;

const DAY = 86_400_000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);

// ---- daily deaths, 7-day average, aligned on the first day the average reached 5 ----
const AGGREGATES = new Set(["World", "International"]);
const byCountry = new Map<string, { date: string; deaths: number }[]>();
for (const line of (await (await fetch(OWID)).text()).trim().split("\n").slice(1)) {
  const [date, location, , newDeaths] = line.split(",");
  if (AGGREGATES.has(location) || date > "2020-05-30") continue;
  if (!byCountry.has(location)) byCountry.set(location, []);
  byCountry.get(location)!.push({ date, deaths: Number(newDeaths) || 0 });
}
const deaths = ["country,day,date,deaths"];
for (const [country, rows] of [...byCountry].sort(([a], [b]) => a.localeCompare(b))) {
  rows.sort((a, b) => a.date.localeCompare(b.date));
  let start = -1;
  rows.forEach((r, i) => {
    if (i < 6) return;
    const avg = rows.slice(i - 6, i + 1).reduce((s, x) => s + x.deaths, 0) / 7;
    if (start < 0 && avg >= 5) start = i;
    if (start >= 0) deaths.push(`${country.includes(",") ? `"${country}"` : country},${i - start},${r.date},${avg.toFixed(1)}`);
  });
}
await Bun.write(OUT + "covid-deaths.csv", deaths.join("\n") + "\n");
console.log(`covid-deaths.csv: ${deaths.length - 1} rows`);

// ---- California Rt, "return to normal" scenario ----
// Series index i is model day 35 + i, and model day 0 is 2019-12-31 (lib/date.js upstream).
const rt = (await (await fetch(`${MODEL}/rt.json`)).json()) as Record<string, number>[];
const dist = (await (await fetch(`${MODEL}/distancing.json`)).json()) as { expected: number }[];
const DAY0 = Date.UTC(2019, 11, 31);
const rows = ["date,rt,p10,p90,distancing"];
for (let i = 0; i < rt.length; i++) {
  const date = iso(DAY0 + (35 + i) * DAY);
  if (date >= "2021-01-01") break;
  const r = rt[i];
  rows.push([date, r.expected.toFixed(3), r.percentile10.toFixed(3), r.percentile90.toFixed(3), (1 - dist[i].expected).toFixed(3)].join(","));
}
await Bun.write(OUT + "ca-rt.csv", rows.join("\n") + "\n");
console.log(`ca-rt.csv: ${rows.length - 1} rows`);
