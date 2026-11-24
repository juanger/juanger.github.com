// Dev-only preview of the KB blog drafts (~/Vault/agents/blog/*.md with
// `type: post`), rendered with the real post template plus the inline-comment
// layer from drafts-client.ts. Files are re-read on every request; nothing here
// is part of the production build.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { splitFrontMatter, type FrontMatter, type Lang, type Post } from "./content.ts";
import { render } from "./markdown.ts";
import { html } from "./html.ts";
import { layout, postPage } from "./templates.ts";
import { addComment, loadComments, updateComment, SLUG_RE, type Action } from "./comments.ts";
import { CLIENT_CSS, CLIENT_JS } from "./drafts-client.ts";

export type Draft = {
  slug: string; // the file name without .md, e.g. "2026-11-19-la-tela-y-el-color"
  file: string;
  front: FrontMatter;
  body: string; // markdown with the leading "# Title" removed
  title: string;
  lang: Lang;
  date: string; // YYYY-MM-DD
  status: string;
};

export function draftsDir(): string {
  return process.env.BLOG_DRAFTS_DIR ?? join(homedir(), "Vault/agents/blog");
}

const ymd = (v: unknown): string =>
  v instanceof Date ? v.toISOString().slice(0, 10) : typeof v === "string" ? v.slice(0, 10) : "";

export function parseDraft(slug: string, file: string, source: string): Draft | null {
  const { front, body } = splitFrontMatter(source);
  if (front.type !== "post") return null;
  // KB drafts carry their title twice (front matter and an H1); the template
  // prints the title, so drop a leading H1.
  const h1 = body.match(/^\s*# (.+)\r?\n/);
  const title = typeof front.title === "string" ? front.title : h1?.[1] ?? slug;
  return {
    slug,
    file,
    front,
    body: h1 ? body.slice(h1[0].length) : body,
    title,
    lang: front.lang === "es" ? "es" : "en",
    date: ymd(front.date) || ymd(front.created) || slug.slice(0, 10),
    status: typeof front.status === "string" ? front.status : "draft",
  };
}

export function loadDraft(slug: string, dir = draftsDir()): Draft | null {
  if (!SLUG_RE.test(slug)) return null;
  const file = join(dir, `${slug}.md`);
  if (!existsSync(file)) return null;
  return parseDraft(slug, file, readFileSync(file, "utf8"));
}

export function listDrafts(dir = draftsDir()): Draft[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith(".md"))
    .map((n) => loadDraft(n.slice(0, -3), dir))
    .filter((d): d is Draft => d !== null)
    .sort((a, b) => (a.slug < b.slug ? 1 : -1));
}

// A draft as a Post, so postPage() can render it like a published one.
function asPost(d: Draft, all: Draft[]): Post {
  const [year, month, day] = d.date.split("-");
  const other = typeof d.front.translation === "string" ? all.find((x) => x.slug === d.front.translation) : undefined;
  return {
    lang: d.lang,
    slug: d.slug,
    year,
    month,
    day,
    path: `drafts/${d.slug}`,
    title: d.title,
    date: d.date,
    description: d.title,
    status: d.status,
    draft: true,
    aliases: [],
    front: d.front,
    body: d.body,
    file: d.file,
    hasTranslation: !!other,
    translationPath: other ? `drafts/${other.slug}` : undefined,
  };
}

export function draftPage(d: Draft, dir = draftsDir()): string {
  const page = postPage(asPost(d, listDrafts(dir)), render(d.body, { lang: d.lang }), false, true);
  const boot = `window.__DRAFT__=${JSON.stringify({ slug: d.slug, lang: d.lang }).replace(/</g, "\\u003c")};`;
  const inject = `<style>${CLIENT_CSS}</style>\n<script>${boot}</script>\n<script>${CLIENT_JS}</script>\n`;
  return page.replace("</body>", `${inject}</body>`);
}

export function draftsIndex(dir = draftsDir()): string {
  const drafts = listDrafts(dir);
  const row = (d: Draft) => {
    const open = loadComments(d.slug).comments.filter((c) => c.status === "open").length;
    return html`<li><time datetime="${d.date}"><span>${d.date.slice(5)}</span></time> <span><a href="/drafts/${d.slug}">${d.title}</a><span class="post-status">${d.lang} · ${d.status}${open ? ` · ${open} open` : ""}</span></span></li>
`;
  };
  const live = drafts.filter((d) => d.status !== "superseded" && d.status !== "published");
  const done = drafts.filter((d) => d.status === "published");
  const old = drafts.filter((d) => d.status === "superseded");
  const body = html`<div class="index">
<p class="subtitle">Drafts from the KB (${dir.replace(homedir(), "~")}). Preview only, never published from here.</p>
<section id="TOC">
<h2>Drafts</h2>
<ol>
${live.map(row)}</ol>
${done.length ? html`<h2>Published</h2>
<ol>
${done.map(row)}</ol>` : ""}
${old.length ? html`<h2>Superseded</h2>
<ol>
${old.map(row)}</ol>` : ""}
</section>
</div>`;
  return layout({
    lang: "en",
    title: "Drafts · Ruby Xocolatl",
    pageTitle: "Drafts",
    description: "Draft preview",
    canonicalPath: "/drafts",
    ogType: "website",
    indexLink: true,
    body,
  });
}

// ---- dev-server routes -------------------------------------------------------

const LOOPBACK = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
const ACTIONS = new Set<Action>(["reply", "resolve", "reopen", "delete"]);
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } });
const page = (body: string, status = 200) =>
  new Response(body, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });

// Handles /drafts… and /__comments/… ; returns null for anything else. Reads are
// open to whoever can reach the dev server; writes need a loopback client (the
// Mac, or Carcinos through its SSH tunnel) and a JSON body, so neither the LAN
// nor a cross-site form can post comments.
export async function handleDraftRoute(req: Request, clientIP: string | undefined, dir = draftsDir()): Promise<Response | null> {
  const { pathname } = new URL(req.url);

  if (pathname === "/drafts" || pathname === "/drafts/") return page(draftsIndex(dir));

  const d = pathname.match(/^\/drafts\/([^/]+?)(\.md)?$/);
  if (d) {
    const draft = loadDraft(d[1], dir);
    if (!draft) return page("Draft not found", 404);
    if (d[2]) return new Response(readFileSync(draft.file, "utf8"), { headers: { "content-type": "text/plain; charset=utf-8" } });
    return page(draftPage(draft, dir));
  }

  // Errors the draft page caught (failed saves, script errors), so they show up
  // in the dev server's output instead of only on the phone.
  if (pathname === "/__client-log" && req.method === "POST") {
    if (!clientIP || !LOOPBACK.has(clientIP)) return json({ error: "localhost only" }, 403);
    const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    log(`client error on ${String(b.slug ?? "?").slice(0, 120)}: ${String(b.msg ?? "").slice(0, 500)} [${String(b.ua ?? "").slice(0, 160)}]`);
    return json({ ok: true });
  }

  const c = pathname.match(/^\/__comments\/([^/]+)(?:\/([0-9a-f]{5})\/([a-z]+))?$/);
  if (!c) return null;
  const [, slug, id, action] = c;
  if (!loadDraft(slug, dir)) return json({ error: "no such draft" }, 404);
  if (req.method === "GET" && !id) return json(loadComments(slug));
  const what = `${req.method} ${pathname} from ${clientIP ?? "?"}`;
  const refuse = (error: string, status: number) => {
    log(`comments: ${what} → ${status} ${error}`);
    return json({ error }, status);
  };
  if (req.method !== "POST") return refuse("method not allowed", 405);
  if (!clientIP || !LOOPBACK.has(clientIP)) return refuse("comments can only be written from localhost", 403);
  if (!(req.headers.get("content-type") ?? "").startsWith("application/json")) return refuse("expected JSON", 415);
  let body: Record<string, unknown> = {};
  try {
    body = ((await req.json()) as Record<string, unknown>) ?? {};
  } catch {
    // an empty body is fine for resolve/reopen/delete
  }
  try {
    if (!id) {
      const added = addComment(slug, body);
      log(`comments: ${slug} + ${added.id}`);
      return json(added, 201);
    }
    if (!ACTIONS.has(action as Action)) return refuse(`unknown action ${action}`, 400);
    const updated = updateComment(id, action as Action, { text: body.text, slug, rid: body.rid });
    log(`comments: ${slug} ${action} ${id}`);
    return json(updated ?? { deleted: id });
  } catch (err) {
    return refuse((err as Error).message, 400);
  }
}

// Quiet under `bun test` (NODE_ENV=test); the dev server prints these.
function log(line: string) {
  if (process.env.NODE_ENV !== "test") console.log(line);
}
