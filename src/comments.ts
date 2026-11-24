// Inline review comments on KB drafts: a JSON file per draft under .comments/
// (gitignored). Written by the dev server (Juan, from the preview page) and by
// scripts/comments.ts (Claude, from the CLI). Comments anchor to a quote plus a
// little context on each side, not to line numbers, so they survive rewrites.

import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// `rid` is a request id from the page: it retries a save when the connection
// drops, so a repeated rid returns the first result instead of a duplicate.
export type Reply = { author: string; text: string; created: string; rid?: string };

export type Comment = {
  id: string;
  quote: string;
  prefix: string;
  suffix: string;
  text: string;
  author: string;
  created: string;
  status: "open" | "resolved";
  replies: Reply[];
  rid?: string;
};

const rid = (v: unknown): string | undefined => (typeof v === "string" && v ? v.slice(0, 40) : undefined);

export type CommentFile = { draft: string; comments: Comment[] };

export const SLUG_RE = /^[a-z0-9][a-z0-9-]{0,120}$/;
export const CONTEXT_CHARS = 32;
const MAX_QUOTE = 4000;
const MAX_TEXT = 8000;

export function commentsDir(): string {
  return process.env.BLOG_COMMENTS_DIR ?? ".comments";
}

function fileFor(dir: string, slug: string): string {
  if (!SLUG_RE.test(slug)) throw new Error(`bad draft slug: ${slug}`);
  return join(dir, `${slug}.json`);
}

export function loadComments(slug: string, dir = commentsDir()): CommentFile {
  const f = fileFor(dir, slug);
  if (!existsSync(f)) return { draft: slug, comments: [] };
  return JSON.parse(readFileSync(f, "utf8")) as CommentFile;
}

export function saveComments(data: CommentFile, dir = commentsDir()): void {
  mkdirSync(dir, { recursive: true });
  const f = fileFor(dir, data.draft);
  const tmp = `${f}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(data, null, 2) + "\n");
  renameSync(tmp, f);
}

export function allCommentFiles(dir = commentsDir()): CommentFile[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith(".json"))
    .map((n) => loadComments(n.slice(0, -5), dir));
}

function newId(taken: Set<string>): string {
  for (;;) {
    const id = Math.random().toString(16).slice(2, 7);
    if (id.length === 5 && !taken.has(id)) return id;
  }
}

const clip = (s: unknown, max: number): string => (typeof s === "string" ? s.slice(0, max) : "");

export function addComment(
  slug: string,
  input: { quote?: unknown; prefix?: unknown; suffix?: unknown; text?: unknown; author?: string; rid?: unknown },
  dir = commentsDir(),
): Comment {
  const quote = clip(input.quote, MAX_QUOTE).trim();
  const text = clip(input.text, MAX_TEXT).trim();
  if (!quote || !text) throw new Error("quote and text are required");
  const data = loadComments(slug, dir);
  const r = rid(input.rid);
  const seen = r && data.comments.find((c) => c.rid === r);
  if (seen) return seen;
  const taken = new Set(allCommentFiles(dir).flatMap((f) => f.comments.map((c) => c.id)));
  const c: Comment = {
    id: newId(taken),
    quote,
    prefix: typeof input.prefix === "string" ? input.prefix.slice(-CONTEXT_CHARS) : "", // the end is what touches the quote
    suffix: clip(input.suffix, CONTEXT_CHARS),
    text,
    author: input.author ?? "juan",
    created: new Date().toISOString(),
    status: "open",
    replies: [],
    ...(r ? { rid: r } : {}),
  };
  data.comments.push(c);
  saveComments(data, dir);
  return c;
}

// Find a comment by id across every draft (ids are unique across drafts).
export function findComment(id: string, dir = commentsDir()): { file: CommentFile; comment: Comment } | null {
  for (const file of allCommentFiles(dir)) {
    const comment = file.comments.find((c) => c.id === id);
    if (comment) return { file, comment };
  }
  return null;
}

export type Action = "reply" | "resolve" | "reopen" | "delete";

// Apply an action to one comment. A reply or resolve may carry text (resolve's
// text becomes a final reply). Returns the updated comment, or null if deleted.
export function updateComment(
  id: string,
  action: Action,
  opts: { text?: unknown; author?: string; slug?: string; rid?: unknown } = {},
  dir = commentsDir(),
): Comment | null {
  const hit = findComment(id, dir);
  if (!hit && action === "delete") return null; // already gone: a retried delete succeeds
  if (!hit || (opts.slug && hit.file.draft !== opts.slug)) throw new Error(`no comment ${id}`);
  const r = rid(opts.rid);
  if (r && hit.comment.replies.some((x) => x.rid === r)) return hit.comment; // retried request, already applied
  const { file, comment } = hit;
  const text = clip(opts.text, MAX_TEXT).trim();
  const author = opts.author ?? "juan";
  if (action === "delete") {
    file.comments = file.comments.filter((c) => c.id !== id);
    saveComments(file, dir);
    return null;
  }
  if (action === "reply" && !text) throw new Error("reply needs text");
  if (text) comment.replies.push({ author, text, created: new Date().toISOString(), ...(r ? { rid: r } : {}) });
  if (action === "resolve") comment.status = "resolved";
  if (action === "reopen") comment.status = "open";
  saveComments(file, dir);
  return comment;
}

// ---- locating a quote in the markdown source (for the CLI) -----------------

// Markdown → roughly the text a reader selects: drop emphasis/code marks,
// footnote refs and link targets, collapse whitespace. Keeps a map from each
// output character back to its source offset so a hit can report a line.
export function plainWithMap(md: string): { text: string; map: number[] } {
  let text = "";
  const map: number[] = [];
  let i = 0;
  let lastSpace = false;
  while (i < md.length) {
    const rest = md.slice(i);
    const fn = rest.match(/^\[\^[^\]]+\]:?/);
    if (fn) { i += fn[0].length; continue; }
    const link = rest.match(/^\]\([^)]*\)/);
    if (link) { i += link[0].length; continue; }
    const ch = md[i];
    if (ch === "*" || ch === "_" || ch === "`" || ch === "[" || ch === "]" || ch === "#" || ch === ">") { i++; continue; }
    if (/\s/.test(ch)) {
      if (!lastSpace) { text += " "; map.push(i); lastSpace = true; }
      i++;
      continue;
    }
    text += ch;
    map.push(i);
    lastSpace = false;
    i++;
  }
  return { text, map };
}

const squash = (s: string) => s.replace(/[*_`\[\]#>]/g, "").replace(/\s+/g, " ");

// The 1-based line of the markdown where the comment's quote starts, preferring
// the hit whose neighbouring text best matches the stored context (the page's
// text and the markdown differ a little, so only the nearest 12 characters on
// each side count); null if the quote is gone (orphaned).
export function locateInMarkdown(md: string, c: Pick<Comment, "quote" | "prefix" | "suffix">): number | null {
  const { text, map } = plainWithMap(md);
  const q = squash(c.quote).trim();
  if (!q) return null;
  const pre = squash(c.prefix).slice(-12);
  const suf = squash(c.suffix).slice(0, 12);
  let best = -1;
  let bestScore = -1;
  for (let at = text.indexOf(q); at !== -1; at = text.indexOf(q, at + 1)) {
    const score =
      (pre && text.slice(0, at).endsWith(pre) ? 1 : 0) + (suf && text.slice(at + q.length).startsWith(suf) ? 1 : 0);
    if (score > bestScore) [best, bestScore] = [at, score];
  }
  if (best === -1) return null;
  return md.slice(0, map[best]).split("\n").length;
}
