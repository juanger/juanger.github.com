// markdown-it configured for the Tufte look: footnotes become sidenotes with a
// working mobile toggle, `[^m:x]` footnotes become margin notes, images alone in
// a paragraph become figures with a margin caption, and :::containers cover
// epigraphs, full-width figures and pull-quotes. Raw HTML is passed through.

import MarkdownIt from "markdown-it";
import footnote from "markdown-it-footnote";
import container from "markdown-it-container";
import type Token from "markdown-it/lib/token.mjs";

function slugifyLabel(label: string): string {
  return label.replace(/[^a-zA-Z0-9_-]/g, "-");
}

// A sidenote (numbered) or margin note (⊕), with the Tufte label+input+span so
// it opens on tap on narrow screens.
function noteHtml(label: string, content: string): string {
  const isMargin = label.startsWith("m:");
  if (isMargin) {
    const id = "mn-" + slugifyLabel(label.slice(2));
    return (
      `<label for="${id}" class="margin-toggle">⊕</label>` +
      `<input type="checkbox" id="${id}" class="margin-toggle"/>` +
      `<span class="marginnote">${content}</span>`
    );
  }
  const id = "sn-" + slugifyLabel(label);
  return (
    `<label for="${id}" class="margin-toggle sidenote-number"></label>` +
    `<input type="checkbox" id="${id}" class="margin-toggle"/>` +
    `<span class="sidenote">${content}</span>`
  );
}

export function createMarkdown(): MarkdownIt {
  const md = new MarkdownIt({
    html: true,
    linkify: false,
    typographer: false,
    breaks: false,
  });

  md.use(footnote);

  // ---- containers ----
  md.use(container, "epigraph", {
    render(tokens: Token[], idx: number) {
      return tokens[idx].nesting === 1 ? '<div class="epigraph">\n' : "</div>\n";
    },
  });
  md.use(container, "fullwidth", {
    render(tokens: Token[], idx: number) {
      return tokens[idx].nesting === 1 ? '<figure class="fullwidth">\n' : "</figure>\n";
    },
  });
  md.use(container, "pullquote", {
    render(tokens: Token[], idx: number) {
      return tokens[idx].nesting === 1
        ? '<blockquote class="fullwidth">\n<hr/>\n'
        : "<hr/>\n</blockquote>\n";
    },
  });

  // ---- ^^new thought^^ inline rule ----
  md.inline.ruler.before("emphasis", "newthought", (state, silent) => {
    const start = state.pos;
    if (state.src.charCodeAt(start) !== 0x5e /* ^ */) return false;
    if (state.src.charCodeAt(start + 1) !== 0x5e) return false;
    const close = state.src.indexOf("^^", start + 2);
    if (close < 0) return false;
    if (silent) return true;
    const inner = state.src.slice(start + 2, close);
    let token = state.push("newthought_open", "span", 1);
    token.attrSet("class", "newthought");
    const tokens = state.md.parseInline(inner, state.env);
    if (tokens[0]) state.tokens.push(...tokens[0].children!);
    token = state.push("newthought_close", "span", -1);
    state.pos = close + 2;
    return true;
  });
  md.renderer.rules.newthought_open = () => '<span class="newthought">';
  md.renderer.rules.newthought_close = () => "</span>";

  // ---- heading ids, matching marked 0.7's slugger (so old #anchors survive) ----
  const SLUG_STRIP =
    /[ -⁯⸀-⹿\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~]/g;
  function slug(value: string, seen: Record<string, number>): string {
    let s = value.toLowerCase().trim().replace(SLUG_STRIP, "").replace(/\s/g, "-");
    if (Object.prototype.hasOwnProperty.call(seen, s)) {
      const base = s;
      do {
        seen[base]++;
        s = `${base}-${seen[base]}`;
      } while (Object.prototype.hasOwnProperty.call(seen, s));
    }
    seen[s] = 0;
    return s;
  }
  md.core.ruler.push("heading_ids", (state) => {
    const seen: Record<string, number> = {};
    const toks = state.tokens;
    for (let i = 0; i < toks.length; i++) {
      if (toks[i].type !== "heading_open") continue;
      const inline = toks[i + 1];
      if (!inline || inline.type !== "inline") continue;
      const text = (inline.children ?? [])
        .filter((c) => c.type === "text" || c.type === "code_inline")
        .map((c) => c.content)
        .join("");
      toks[i].attrSet("id", slug(text, seen));
    }
  });

  // ---- capture footnote definition content before footnote_tail moves it ----
  md.core.ruler.before("footnote_tail", "capture_footnote_defs", (state) => {
    const env = state.env as any;
    env.sidenoteDefs = env.sidenoteDefs || {};
    const toks = state.tokens;
    for (let i = 0; i < toks.length; i++) {
      if (toks[i].type !== "footnote_reference_open") continue;
      const label: string = toks[i].meta.label;
      let j = i + 1;
      const inner: Token[] = [];
      while (j < toks.length && toks[j].type !== "footnote_reference_close") {
        inner.push(toks[j]);
        j++;
      }
      let rendered = state.md.renderer.render(inner, state.md.options, state.env).trim();
      // unwrap a single wrapping <p>…</p>
      const m = rendered.match(/^<p>([\s\S]*)<\/p>$/);
      if (m && !m[1].includes("<p>")) rendered = m[1];
      env.sidenoteDefs[label] = rendered;
      i = j;
    }
  });

  // ---- footnote_ref -> sidenote/marginnote inline ----
  md.renderer.rules.footnote_ref = (tokens, idx, options, env, slf) => {
    const meta = tokens[idx].meta;
    const e = env as any;
    if (typeof meta.label === "string") {
      const content = (e.sidenoteDefs && e.sidenoteDefs[meta.label]) ?? "";
      return noteHtml(meta.label, content);
    }
    // inline footnote: ^[ … ] — content held as inline tokens on the list
    const entry = e.footnotes?.list?.[meta.id];
    const content = entry?.tokens ? slf.renderInline(entry.tokens, options, env).trim() : "";
    return noteHtml("sn-inline-" + (meta.id + 1), content);
  };

  // ---- drop the whole end-of-post footnote block (we inline the notes) ----
  md.core.ruler.after("footnote_tail", "strip_footnote_block", (state) => {
    const toks = state.tokens;
    let start = -1;
    for (let i = 0; i < toks.length; i++) {
      if (toks[i].type === "footnote_block_open") start = i;
      else if (toks[i].type === "footnote_block_close") {
        if (start >= 0) toks.splice(start, i - start + 1);
        start = -1;
        i = start;
      }
    }
  });

  // ---- images alone in a paragraph -> <figure> with a margin caption ----
  md.core.ruler.push("tufte_figure", (state) => {
    const toks = state.tokens;
    for (let i = 0; i + 2 < toks.length; i++) {
      if (toks[i].type !== "paragraph_open") continue;
      const inline = toks[i + 1];
      if (inline.type !== "inline" || toks[i + 2].type !== "paragraph_close") continue;
      const kids = (inline.children ?? []).filter(
        (c) => !(c.type === "text" && c.content.trim() === "" ) && c.type !== "softbreak",
      );
      if (kids.length !== 1 || kids[0].type !== "image") continue;

      const img = kids[0];
      const src = img.attrGet("src") ?? "";
      const alt = img.content ?? "";
      const title = img.attrGet("title") ?? "";
      const fig =
        "<figure>\n" +
        (title ? noteHtml("m:fig-" + (i + 1), state.md.utils.escapeHtml(title)) + "\n" : "") +
        `<img src="${state.md.utils.escapeHtml(src)}" alt="${state.md.utils.escapeHtml(alt)}"/>\n` +
        "</figure>";

      const token = new state.Token("html_block", "", 0);
      token.content = fig + "\n";
      token.block = true;
      toks.splice(i, 3, token);
    }
  });

  return md;
}

const shared = createMarkdown();

export function render(markdown: string, env: Record<string, unknown> = {}): string {
  return shared.render(markdown, env);
}
