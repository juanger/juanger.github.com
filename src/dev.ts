// Single-process dev server: build once into out/, watch content, serve out/
// with GitHub-Pages-like resolution and live-reload over SSE. No workers, no
// child builds. (Edits to src/ need a manual restart; content edits hot-reload.)

import { watch, existsSync, statSync } from "node:fs";
import { build } from "./build.ts";

const OUT = "out";
const PORT = Number(process.env.PORT ?? 3000);

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

async function rebuild(reason: string) {
  const t0 = performance.now();
  try {
    await build({ outDir: OUT, dev: true, includeDrafts: true });
    console.log(`rebuilt (${reason}) in ${Math.round(performance.now() - t0)}ms`);
    notifyReload();
  } catch (err) {
    console.error("build failed:", err);
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

// Watch content directories; debounce a full rebuild.
let timer: ReturnType<typeof setTimeout> | null = null;
function onChange() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => rebuild("change"), 120);
}
const watched: string[] = [];
for (const dir of ["posts", "public", "pages"]) {
  if (existsSync(dir)) {
    watch(dir, { recursive: true }, onChange);
    watched.push(dir);
  }
}

const watchList = watched.map((d) => `${d}/`).join(", ");
console.log(`dev server on http://localhost:${server.port}  (watching ${watchList})`);
