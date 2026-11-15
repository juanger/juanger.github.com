// markdown-it configured for the Tufte look: footnotes become sidenotes with a
// working mobile toggle, `[^m:x]` footnotes become margin notes, images alone in
// a paragraph become figures with a margin caption, and :::containers cover
// epigraphs, full-width figures and pull-quotes. Raw HTML is passed through.

import MarkdownIt from "markdown-it";
import footnote from "markdown-it-footnote";
import container from "markdown-it-container";
import type Token from "markdown-it/lib/token.mjs";
import hljs from "highlight.js/lib/core";
import ruby from "highlight.js/lib/languages/ruby";
import scss from "highlight.js/lib/languages/scss";
import xml from "highlight.js/lib/languages/xml";
import objectivec from "highlight.js/lib/languages/objectivec";
import bash from "highlight.js/lib/languages/bash";

// Register only the languages our posts actually use. Each module brings its own
// aliases: xml covers `html`, objectivec covers `objc`, bash covers `sh`. We never
// auto-detect — an unregistered language falls through to plain, escaped text.
hljs.registerLanguage("ruby", ruby);
hljs.registerLanguage("scss", scss);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("objectivec", objectivec);
hljs.registerLanguage("bash", bash);

// markdown-it's own HTML escaping (& < > "), so an unknown-language fence looks
// exactly as it would with no highlight hook at all.
const HTML_REPLACEMENTS: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
};
function mdEscape(s: string): string {
  return s.replace(/[&<>"]/g, (ch) => HTML_REPLACEMENTS[ch]);
}

function slugifyLabel(label: string): string {
  return label.replace(/[^a-zA-Z0-9_-]/g, "-");
}

// Build-time syntax highlighting (ships no client JS). Returns the inner HTML for
// <code>; markdown-it adds the `language-x` class and the <pre><code> wrapper.
function highlightCode(code: string, lang: string): string {
  // `console` is a shell session, not a single language: highlight only the
  // commands (lines starting with "$ " or "% "); output lines stay plain ink.
  if (lang === "console") {
    return code
      .split("\n")
      .map((line) => {
        const m = /^([$%] )(.*)$/.exec(line);
        if (!m) return mdEscape(line);
        return mdEscape(m[1]) + hljs.highlight(m[2], { language: "bash" }).value;
      })
      .join("\n");
  }
  // A known language (directly or via alias). Never auto-detect.
  if (lang && hljs.getLanguage(lang)) {
    return hljs.highlight(code, { language: lang }).value;
  }
  // Unknown or missing language: escape and leave plain, no spans.
  return mdEscape(code);
}

// The small-caps "2026" stamp that opens every 2026 errata annotation.
const ERRATA_YEAR = `<span class="errata-year">2026</span>`;
// A verdict note's text starts with one of these words + a colon.
const VERDICT_RE = /^(held|partly|missed):\s*/i;

// A sidenote (numbered) or margin note (⊕), with the Tufte label+input+span so
// it opens on tap on narrow screens. Footnote labels beginning with `2026`
// render as 2026 errata annotations instead (see noteHtml's errata branch).
function noteHtml(label: string, content: string): string {
  // ---- plain margin note (unchanged): [^m:key] ----
  if (label.startsWith("m:")) {
    const id = "mn-" + slugifyLabel(label.slice(2));
    return (
      `<label for="${id}" class="margin-toggle">⊕</label>` +
      `<input type="checkbox" id="${id}" class="margin-toggle"/>` +
      `<span class="marginnote">${content}</span>`
    );
  }

  // ---- 2026 errata family: [^2026-…], [^2026m-…], [^2026!-…], [^2026r-…] ----
  if (/^2026/.test(label)) {
    const id = "e26-" + slugifyLabel(label);

    // Restoration marker ([^2026r-…]): a muted, plain margin note with no accent
    // stamp — link rot and lost embeds are routine, not a correction.
    if (label.startsWith("2026r")) {
      return (
        `<label for="${id}" class="margin-toggle">⊕</label>` +
        `<input type="checkbox" id="${id}" class="margin-toggle"/>` +
        `<span class="marginnote">${content}</span>`
      );
    }

    // Verdict ([^held:/partly:/missed:]): the verdict word is the toggle label on
    // mobile ("held ⊕") and sits in accent small-caps after the 2026 stamp.
    const vm = VERDICT_RE.exec(content);
    if (vm) {
      const word = vm[1].toLowerCase();
      const rest = content.slice(vm[0].length);
      return (
        `<label for="${id}" class="margin-toggle verdict-toggle"><span class="verdict-word">${word}</span>⊕</label>` +
        `<input type="checkbox" id="${id}" class="margin-toggle"/>` +
        `<span class="marginnote errata verdict" data-verdict="${word}">${ERRATA_YEAR}<span class="verdict-word">${word}</span>${rest}</span>`
      );
    }

    // Unlettered errata margin note ([^2026m-…]): ⊕ toggle, 2026 stamp, hairline.
    if (label.startsWith("2026m")) {
      return (
        `<label for="${id}" class="margin-toggle">⊕</label>` +
        `<input type="checkbox" id="${id}" class="margin-toggle"/>` +
        `<span class="marginnote errata">${ERRATA_YEAR}${content}</span>`
      );
    }

    // Lettered errata sidenote ([^2026-…], or [^2026!-…] always-visible on mobile).
    const always = label.startsWith("2026!") ? " always" : "";
    return (
      `<label for="${id}" class="margin-toggle errata-number"></label>` +
      `<input type="checkbox" id="${id}" class="margin-toggle"/>` +
      `<span class="sidenote errata${always}">${ERRATA_YEAR}${content}</span>`
    );
  }

  // ---- numbered sidenote (unchanged): [^key] ----
  const id = "sn-" + slugifyLabel(label);
  return (
    `<label for="${id}" class="margin-toggle sidenote-number"></label>` +
    `<input type="checkbox" id="${id}" class="margin-toggle"/>` +
    `<span class="sidenote">${content}</span>`
  );
}

// Tally a post's verdict notes (held / partly / missed) from the captured
// footnote definitions, for the scorecard's word-sized dot graphic.
function verdictCounts(env: Record<string, unknown>): { held: number; partly: number; missed: number } {
  const defs = (env.sidenoteDefs as Record<string, string> | undefined) ?? {};
  let held = 0, partly = 0, missed = 0;
  for (const key in defs) {
    const m = VERDICT_RE.exec(defs[key]);
    if (!m) continue;
    const w = m[1].toLowerCase();
    if (w === "held") held++;
    else if (w === "partly") partly++;
    else missed++;
  }
  return { held, partly, missed };
}

export function createMarkdown(): MarkdownIt {
  const md = new MarkdownIt({
    html: true,
    linkify: false,
    typographer: false,
    breaks: false,
    highlight: highlightCode,
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

  // ---- :::today — a collapsed "how I'd do this today" block (code only) ----
  md.use(container, "today", {
    render(tokens: Token[], idx: number, _opts: unknown, env: Record<string, unknown>) {
      if (tokens[idx].nesting !== 1) return "</details>\n";
      const label = env.lang === "es" ? "Cómo lo haría hoy" : "How I'd do this today";
      return `<details class="errata-today">\n<summary>${ERRATA_YEAR} · ${label}</summary>\n`;
    },
  });

  // ---- :::scorecard — heading + verdict dot tally + markdown table ----
  md.use(container, "scorecard", {
    render(tokens: Token[], idx: number) {
      return tokens[idx].nesting === 1 ? '<section class="scorecard">\n' : "</section>\n";
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
  // Plus ¡ (added in 2026), so "¡Aplanamos la curva!" keeps its 2020 #aplanamos-la-curva. ¿ stays, like marked kept it.
  const SLUG_STRIP =
    /[ -⁯⸀-⹿\\'!"#$%&()*+,./:;<=>?@[\]^`{|}~¡]/g;
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

  // ---- inject the scorecard dot tally after its heading ----
  // Runs after the defs are captured (so verdict notes can be counted) and emits
  // a "word-sized graphic": held ●… partly ◐… missed ○… from the post's verdicts.
  md.core.ruler.after("capture_footnote_defs", "scorecard_tally", (state) => {
    const toks = state.tokens;
    for (let i = 0; i < toks.length; i++) {
      if (toks[i].type !== "container_scorecard_open") continue;
      let j = i + 1;
      while (j < toks.length && toks[j].type !== "heading_close") j++;
      if (j >= toks.length) continue;
      const { held, partly, missed } = verdictCounts(state.env as Record<string, unknown>);
      const tally =
        `<p class="scorecard-tally">held <span class="dots">${"●".repeat(held)}</span> ` +
        `partly <span class="dots">${"◐".repeat(partly)}</span> ` +
        `missed <span class="dots">${"○".repeat(missed)}</span></p>\n`;
      const tok = new state.Token("html_block", "", 0);
      tok.content = tally;
      tok.block = true;
      toks.splice(j + 1, 0, tok);
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
