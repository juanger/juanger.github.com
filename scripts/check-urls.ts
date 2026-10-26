// Post-deploy smoke check: request every path in urls.txt against the freshly
// deployed site and fail if any does not answer 2xx/3xx. Run with Bun in CI
// after deploy-pages; the base URL comes from the deploy step's page_url output
// (env PAGE_URL), never a hardcoded domain, so it works before the custom
// domain is wired up.
//
//   PAGE_URL=https://example.github.io/ bun run scripts/check-urls.ts
//
// Tunables (env): CHECK_RETRIES (default 6), CHECK_RETRY_WAIT_S (5),
// CHECK_WARMUP_S (10 — one wait up front for CDN propagation).

const base = (process.env.PAGE_URL ?? "").trim().replace(/\/+$/, "");
if (!base) {
  console.error("PAGE_URL is not set (expected the deploy step's page_url output).");
  process.exit(1);
}

const RETRIES = Number(process.env.CHECK_RETRIES ?? 6);
const RETRY_WAIT_S = Number(process.env.CHECK_RETRY_WAIT_S ?? 5);
const WARMUP_S = Number(process.env.CHECK_WARMUP_S ?? 10);

const sleep = (s: number) => new Promise((r) => setTimeout(r, s * 1000));

// Read the same inventory the build test uses.
const urlsTxt = await Bun.file(new URL("../urls.txt", import.meta.url)).text();
const paths = urlsTxt
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"));

// One HEAD request, following redirects; returns the final HTTP status (0 on
// a transport error). Mirrors `curl -sIL -o /dev/null -w '%{http_code}'`.
async function status(url: string): Promise<number> {
  const proc = Bun.spawn(
    ["curl", "-sIL", "--max-time", "30", "-o", "/dev/null", "-w", "%{http_code}", url],
    { stdout: "pipe", stderr: "ignore" },
  );
  const out = (await new Response(proc.stdout).text()).trim();
  await proc.exited;
  return Number(out) || 0;
}

// Retry until a 2xx/3xx lands or attempts run out (CDN may lag right after deploy).
async function check(url: string): Promise<number> {
  let code = 0;
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    code = await status(url);
    if (code >= 200 && code < 400) return code;
    if (attempt < RETRIES) await sleep(RETRY_WAIT_S);
  }
  return code;
}

console.log(`Checking ${paths.length} URLs against ${base}`);
if (WARMUP_S > 0) {
  console.log(`Waiting ${WARMUP_S}s for CDN propagation…`);
  await sleep(WARMUP_S);
}

const failures: { path: string; code: number }[] = [];
for (const path of paths) {
  const url = base + (path.startsWith("/") ? path : "/" + path);
  const code = await check(url);
  const ok = code >= 200 && code < 400;
  console.log(`${ok ? "ok " : "FAIL"} ${code} ${path}`);
  if (!ok) failures.push({ path, code });
}

// Write a job summary when running in GitHub Actions.
const summaryFile = process.env.GITHUB_STEP_SUMMARY;
if (summaryFile) {
  let md = `## URL check — ${paths.length - failures.length}/${paths.length} OK\n\nBase: \`${base}\`\n\n`;
  if (failures.length) {
    md += `### ❌ ${failures.length} failing\n\n| Status | Path |\n|---|---|\n`;
    md += failures.map((f) => `| ${f.code || "error"} | \`${f.path}\` |`).join("\n") + "\n";
  } else {
    md += "All URLs returned 2xx/3xx. ✅\n";
  }
  await Bun.write(summaryFile, md);
}

if (failures.length) {
  console.error(`\n${failures.length} URL(s) failed.`);
  process.exit(1);
}
console.log("\nAll URLs OK.");
