// Single-process dev server: build once into out/, watch content, serve out/
// with GitHub-Pages-like resolution and live-reload over SSE. No workers, no
// child builds. (Edits to src/ need a manual restart; content edits hot-reload.)

import { watch, existsSync, statSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { build } from "./build.ts";

const OUT = "out";
const PORT = Number(process.env.PORT ?? 3000);

// How long after a build finishes we keep ignoring watch events. Copying
// public/ into out/ makes APFS fire FSEvents on the *source* tree (clonefile /
// metadata reads), which the recursive watcher would otherwise see as a change.
const QUIET_WINDOW_MS = 300;
const DEBOUNCE_MS = 120;

// ---- Pure helpers (unit-tested in test/dev.test.ts) -------------------------

export interface FileEntry {
  path: string;
  mtimeMs: number;
  size: number;
}

// A cheap, stable signature of a set of files. Two scans of the same tree whose
// files have identical path/mtime/size produce the same string, so a rebuild
// triggered by copy-induced FSEvents (which don't change source mtimes) is a
// no-op. Order-independent: entries are sorted by path first.
export function treeSignature(entries: FileEntry[]): string {
  return entries
    .slice()
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
    .map((e) => `${e.path}\0${e.mtimeMs}\0${e.size}`)
    .join("\n");
}

// Whether a watch event should be dropped without scheduling a rebuild: during
// a build (the public/ copy is in flight) or within QUIET_WINDOW_MS of one
// finishing (trailing copy events).
export function shouldIgnoreEvent(opts: {
  now: number;
  building: boolean;
  lastBuildEnd: number;
  quietWindowMs: number;
}): boolean {
  if (opts.building) return true;
  return opts.now - opts.lastBuildEnd < opts.quietWindowMs;
}

// Recursively collect file entries under the given directories. Missing dirs
// and transient stat failures are skipped rather than thrown.
export function scanTrees(dirs: string[]): FileEntry[] {
  const out: FileEntry[] = [];
  const walk = (dir: string) => {
    let ents: ReturnType<typeof readdirSync>;
    try {
      ents = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of ents) {
      const full = join(dir, ent.name);
      if (ent.isDirectory()) {
        walk(full);
      } else if (ent.isFile()) {
        try {
          const st = statSync(full);
          out.push({ path: full, mtimeMs: st.mtimeMs, size: st.size });
        } catch {
          // file vanished between readdir and stat; ignore
        }
      }
    }
  };
  for (const dir of dirs) walk(dir);
  return out;
}

// ---- Live-reload plumbing ---------------------------------------------------

const clients = new Set<ReadableStreamDefaultController<Uint8Array>>();
const encoder = new TextEncoder();

function notifyReload() {
  for (const c of clients) {
    try {
      c.enqueue(encoder.encode("data: reload\n\n"));
    } catch {
      clients.delete(c);
    }
  }
}

// Rebuild state, shared between the watcher and the build runner.
let building = false;
let lastBuildEnd = 0;

async function rebuild(reason: string) {
  const t0 = performance.now();
  building = true;
  try {
    await build({ outDir: OUT, dev: true, includeDrafts: true });
    console.log(`rebuilt (${reason}) in ${Math.round(performance.now() - t0)}ms`);
    notifyReload();
  } catch (err) {
    console.error("build failed:", err);
  } finally {
    building = false;
    lastBuildEnd = performance.now();
  }
}

const CONTENT_TYPES: Record<string, string> = {
  html: "text/html; charset=utf-8",
  css: "text/css; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  ico: "image/x-icon",
  woff: "font/woff",
  woff2: "font/woff2",
  txt: "text/plain; charset=utf-8",
  // Serve markdown as plain text so browsers (incl. iOS WKWebView) display it
  // inline instead of downloading it.
  md: "text/plain; charset=utf-8",
};

function isFile(path: string): boolean {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

// Mirror GitHub Pages static resolution: /x -> x.html -> x/index.html.
function resolveFile(pathname: string): string | null {
  const p = decodeURIComponent(pathname).replace(/^\//, "");
  if (p === "" || p.endsWith("/")) {
    const idx = `${OUT}/${p}index.html`;
    return isFile(idx) ? idx : null;
  }
  if (isFile(`${OUT}/${p}`)) return `${OUT}/${p}`;
  if (isFile(`${OUT}/${p}.html`)) return `${OUT}/${p}.html`;
  if (isFile(`${OUT}/${p}/index.html`)) return `${OUT}/${p}/index.html`;
  return null;
}

// ---- Server bootstrap (only when run directly, not when imported by tests) ---

if (import.meta.main) {
  await rebuild("initial");

  const server = Bun.serve({
    port: PORT,
    async fetch(req) {
      const url = new URL(req.url);

      if (url.pathname === "/__reload") {
        // This response stays open for the life of the page. Disable Bun's 10s
        // idle timeout so the live-reload stream isn't cut out from under it.
        // (The client only reloads on a `data: reload` event, so the `: connected`
        // handshake sent on each reconnect never triggers a reload.)
        server.timeout(req, 0);
        const stream = new ReadableStream<Uint8Array>({
          start(controller) {
            clients.add(controller);
            controller.enqueue(encoder.encode(": connected\n\n"));
          },
          cancel() {
            // controller removed lazily in notifyReload on error
          },
        });
        return new Response(stream, {
          headers: {
            "content-type": "text/event-stream",
            "cache-control": "no-cache",
            connection: "keep-alive",
          },
        });
      }

      const file = resolveFile(url.pathname);
      if (!file) {
        const nf = `${OUT}/404.html`;
        const body = existsSync(nf) ? Bun.file(nf) : "Not found";
        return new Response(body, { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
      }
      const ext = file.slice(file.lastIndexOf(".") + 1).toLowerCase();
      return new Response(Bun.file(file), {
        headers: { "content-type": CONTENT_TYPES[ext] ?? "application/octet-stream" },
      });
    },
  });

  // Watch content directories; debounce a full rebuild, but only when the
  // watched trees actually changed (see treeSignature / shouldIgnoreEvent).
  const watched: string[] = [];
  for (const dir of ["posts", "public", "pages"]) {
    if (existsSync(dir)) watched.push(dir);
  }

  let lastSignature = treeSignature(scanTrees(watched));
  let timer: ReturnType<typeof setTimeout> | null = null;

  function onDebouncedChange() {
    const sig = treeSignature(scanTrees(watched));
    if (sig === lastSignature) return; // copy-induced event, or nothing real changed
    lastSignature = sig;
    void rebuild("change");
  }

  function onChange() {
    if (
      shouldIgnoreEvent({
        now: performance.now(),
        building,
        lastBuildEnd,
        quietWindowMs: QUIET_WINDOW_MS,
      })
    ) {
      return;
    }
    if (timer) clearTimeout(timer);
    timer = setTimeout(onDebouncedChange, DEBOUNCE_MS);
  }

  for (const dir of watched) {
    watch(dir, { recursive: true }, onChange);
  }

  const watchList = watched.map((d) => `${d}/`).join(", ");
  console.log(`dev server on http://localhost:${server.port}  (watching ${watchList})`);
}
