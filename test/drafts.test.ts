// KB draft previews and inline comments: draft parsing, the comment store, the
// quote locator the CLI uses, and the dev-server routes (incl. the write guard).

import { test, expect, beforeEach } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseDraft, listDrafts, handleDraftRoute } from "../src/drafts.ts";
import { addComment, loadComments, updateComment, locateInMarkdown } from "../src/comments.ts";

let drafts = "";
let store = "";

const ES_DRAFT = `---
title: La tela y el color
created: 2026-11-19
type: post
status: draft
lang: es
---

# La tela y el color

Piensen en lo que una persona cree como una *tela*.

El color puede cambiar, pero la tela de abajo sigue siendo la misma.
`;

beforeEach(() => {
  rmSync(drafts || "/nonexistent", { recursive: true, force: true });
  rmSync(store || "/nonexistent", { recursive: true, force: true });
  drafts = mkdtempSync(join(tmpdir(), "drafts-"));
  store = mkdtempSync(join(tmpdir(), "comments-"));
  process.env.BLOG_COMMENTS_DIR = store;
  writeFileSync(join(drafts, "2026-11-19-la-tela.md"), ES_DRAFT);
  writeFileSync(join(drafts, "2026-11-01-notes.md"), "---\ntitle: Review notes\n---\n\nnot a post\n");
});

test("only type: post files are drafts; the H1 is dropped and lang/date come from front matter", () => {
  const list = listDrafts(drafts);
  expect(list.map((d) => d.slug)).toEqual(["2026-11-19-la-tela"]);
  const d = list[0];
  expect(d.lang).toBe("es");
  expect(d.date).toBe("2026-11-19");
  expect(d.body.startsWith("\nPiensen")).toBe(true);
  expect(parseDraft("x", "x.md", "---\ntype: note\n---\nhi")).toBeNull();
});

test("comments: add, reply, resolve, reopen, delete; ids unique across drafts", () => {
  const a = addComment("2026-11-19-la-tela", { quote: "  tela ", prefix: "como una ", suffix: ".", text: "otra palabra" });
  expect(a.quote).toBe("tela");
  // over-long context keeps the characters next to the quote
  const long = addComment("other-draft", { quote: "q", prefix: "x".repeat(40) + "next to it ", suffix: " after" + "y".repeat(40), text: "t" });
  expect(long.prefix.endsWith("next to it ")).toBe(true);
  expect(long.suffix.startsWith(" after")).toBe(true);
  expect(long.prefix.length).toBe(32);
  expect(a.status).toBe("open");
  const b = addComment("other-draft", { quote: "x", text: "y" });
  expect(b.id).not.toBe(a.id);
  updateComment(a.id, "reply", { text: "¿así?", author: "claude" });
  const r = updateComment(a.id, "resolve", { text: "hecho", author: "claude" })!;
  expect(r.status).toBe("resolved");
  expect(r.replies.map((x) => x.text)).toEqual(["¿así?", "hecho"]);
  expect(updateComment(a.id, "reopen")!.status).toBe("open");
  expect(updateComment(a.id, "delete")).toBeNull();
  expect(loadComments("2026-11-19-la-tela").comments).toEqual([]);
  // a retried request (same rid) doesn't duplicate; a retried delete succeeds
  const once = addComment("2026-11-19-la-tela", { quote: "q", text: "t", rid: "r1" });
  expect(addComment("2026-11-19-la-tela", { quote: "q", text: "t", rid: "r1" }).id).toBe(once.id);
  updateComment(once.id, "reply", { text: "hi", rid: "r2" });
  expect(updateComment(once.id, "reply", { text: "hi", rid: "r2" })!.replies.length).toBe(1);
  expect(updateComment(once.id, "delete")).toBeNull();
  expect(updateComment(once.id, "delete")).toBeNull();
  expect(() => addComment("2026-11-19-la-tela", { quote: "", text: "y" })).toThrow();
  expect(() => updateComment(b.id, "reply", { text: "" })).toThrow();
  expect(() => loadComments("../etc/passwd")).toThrow();
});

test("the CLI locator finds a quote through markdown emphasis, prefers the matching context, and reports orphans", () => {
  const md = "---\nx: 1\n---\n\nuna *tela* roja\n\nla tela azul\n\nla tela verde\n";
  expect(locateInMarkdown(md, { quote: "una tela roja", prefix: "", suffix: "" })).toBe(5);
  // "tela" first appears on line 5, but the context points at the green one
  expect(locateInMarkdown(md, { quote: "tela", prefix: "la ", suffix: " verde" })).toBe(9);
  expect(locateInMarkdown(md, { quote: "tela morada", prefix: "", suffix: "" })).toBeNull();
});

const req = (path: string, init?: RequestInit) => new Request(`http://localhost:4000${path}`, init);
const post = (path: string, body: unknown, ct = "application/json") =>
  req(path, { method: "POST", headers: { "content-type": ct }, body: JSON.stringify(body) });

test("routes: index, draft page with the comment layer, raw markdown, unknown paths", async () => {
  const index = await (await handleDraftRoute(req("/drafts"), "127.0.0.1", drafts))!.text();
  expect(index).toContain('href="/drafts/2026-11-19-la-tela"');
  expect(index).not.toContain("Review notes");

  const page = await (await handleDraftRoute(req("/drafts/2026-11-19-la-tela"), "127.0.0.1", drafts))!.text();
  expect(page).toContain("<h1>La tela y el color</h1>");
  expect(page).toContain('<html lang="es">');
  expect(page).toContain('window.__DRAFT__={"slug":"2026-11-19-la-tela","lang":"es"}');
  expect(page).toContain("mark.cmt");
  expect(page).not.toContain("/__reload"); // no live reload eating a half-typed comment
  expect(page).toContain('href="/drafts"'); // the local-only nav link
  expect(page.match(/<h1>/g)!.length).toBe(1);

  const md = await handleDraftRoute(req("/drafts/2026-11-19-la-tela.md"), "127.0.0.1", drafts);
  expect(await md!.text()).toBe(ES_DRAFT);

  expect((await handleDraftRoute(req("/drafts/2026-11-01-notes"), "127.0.0.1", drafts))!.status).toBe(404);
  expect((await handleDraftRoute(req("/drafts/..%2f..%2fetc"), "127.0.0.1", drafts))!.status).toBe(404);
  expect(await handleDraftRoute(req("/en/2020/05/x"), "127.0.0.1", drafts)).toBeNull();
});

test("routes: comments are written from loopback with JSON only, and read back", async () => {
  const path = "/__comments/2026-11-19-la-tela";
  const body = { quote: "tela", prefix: "como una ", suffix: ".", text: "otra palabra" };
  expect((await handleDraftRoute(post(path, body), "192.168.1.20", drafts))!.status).toBe(403);
  expect((await handleDraftRoute(post(path, body), undefined, drafts))!.status).toBe(403);
  expect((await handleDraftRoute(post(path, body, "text/plain"), "127.0.0.1", drafts))!.status).toBe(415);
  expect((await handleDraftRoute(post("/__comments/nope", body), "127.0.0.1", drafts))!.status).toBe(404);

  const created = await handleDraftRoute(post(path, body), "::1", drafts);
  expect(created!.status).toBe(201);
  const { id } = (await created!.json()) as { id: string };

  const replied = await handleDraftRoute(post(`${path}/${id}/reply`, { text: "ok" }), "127.0.0.1", drafts);
  expect(((await replied!.json()) as { replies: unknown[] }).replies.length).toBe(1);
  const bad = await handleDraftRoute(post(`${path}/${id}/explode`, {}), "127.0.0.1", drafts);
  expect(bad!.status).toBe(400);

  // the page's error reports are accepted from loopback only
  expect((await handleDraftRoute(post("/__client-log", { msg: "x" }), "127.0.0.1", drafts))!.status).toBe(200);
  expect((await handleDraftRoute(post("/__client-log", { msg: "x" }), "192.168.1.20", drafts))!.status).toBe(403);

  const got = (await (await handleDraftRoute(req(path), "10.0.0.9", drafts))!.json()) as { comments: { id: string }[] };
  expect(got.comments.map((c) => c.id)).toEqual([id]);
});
