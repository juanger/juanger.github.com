// Read and answer Juan's inline comments on KB drafts (left from /drafts on the
// dev server). Run from the blog repo:
//   bun run comments list [draft] [--all]
//   bun run comments reply <id> <text>
//   bun run comments resolve <id> [text]
//   bun run comments reopen <id>

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { allCommentFiles, locateInMarkdown, updateComment, type Action, type Comment } from "../src/comments.ts";
import { draftsDir, loadDraft } from "../src/drafts.ts";

const [cmd, ...rest] = process.argv.slice(2);
const tilde = (p: string) => p.replace(homedir(), "~");
const indent = (s: string, pad: string) => s.split("\n").map((l) => pad + l).join("\n");

function list(filter: string | undefined, all: boolean) {
  const files = allCommentFiles().filter((f) => !filter || f.draft.includes(filter));
  let shown = 0;
  for (const f of files) {
    const cs = f.comments.filter((c) => all || c.status === "open");
    if (!cs.length) continue;
    const draft = loadDraft(f.draft);
    const md = draft ? readFileSync(draft.file, "utf8") : "";
    console.log(`${f.draft}  (${draft ? tilde(draft.file) : "draft file missing"})`);
    for (const c of cs) {
      const line = md ? locateInMarkdown(md, c) : null;
      const where = line ? `line ${line}` : "ORPHANED: quote not found in the draft";
      console.log(`  [${c.id}] ${c.status === "resolved" ? "(resolved) " : ""}${where}`);
      console.log(indent(`"${c.quote}"`, "      > "));
      printMsg(c.author, c.text, c.created);
      for (const r of c.replies) printMsg(r.author, r.text, r.created);
      shown++;
    }
    console.log();
  }
  if (!shown) console.log(all ? "No comments." : "No open comments.");
}

function printMsg(author: string, text: string, created: string) {
  console.log(`      ${author} (${created.slice(0, 16).replace("T", " ")}):`);
  console.log(indent(text, "        "));
}

function act(action: Action, id: string | undefined, text: string) {
  if (!id) usage();
  let c: Comment | null;
  try {
    c = updateComment(id!, action, { text, author: "claude" });
  } catch (err) {
    console.error((err as Error).message);
    process.exit(1);
  }
  console.log(`${id}: ${action === "reply" ? "replied" : c?.status ?? "deleted"}`);
}

function usage(): never {
  console.error("usage: bun run comments list [draft] [--all] | reply <id> <text> | resolve <id> [text] | reopen <id>");
  console.error(`drafts: ${tilde(draftsDir())}`);
  process.exit(2);
}

switch (cmd) {
  case "list":
  case undefined: {
    const all = rest.includes("--all");
    list(rest.find((a) => a !== "--all"), all);
    break;
  }
  case "reply":
    act("reply", rest[0], rest.slice(1).join(" "));
    break;
  case "resolve":
    act("resolve", rest[0], rest.slice(1).join(" "));
    break;
  case "reopen":
    act("reopen", rest[0], "");
    break;
  default:
    usage();
}
