// markdown-it configured for the Tufte look: footnotes become sidenotes with a
// working mobile toggle, `[^m:x]` footnotes become margin notes, images alone in
// a paragraph become figures with a margin caption, and :::containers cover
// epigraphs, full-width figures and pull-quotes. Raw HTML is passed through.

import MarkdownIt from "markdown-it";
import footnote from "markdown-it-footnote";
import container from "markdown-it-container";
import type Token from "markdown-it/lib/token.mjs";
import { renderChart, type FigSize, type Lang } from "./viz/index.ts";
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

// ---- :::figure helpers (see the figure_* core rules) --------------------
const FIG_SOURCE_RE = /^(Source|Credit|Fuente)\b\s*:?\s*/i;

function parseFigureInfo(info: string): { type: FigSize; id?: string } {
  const m = /^figure(?:\s+(main|margin|full))?(?:\s+#([\w-]+))?/.exec(info.trim());
  return { type: (m?.[1] as FigSize) || "main", id: m?.[2] };
}

// Plain text of an inline token's children (for classifying source lines).
function inlinePlainText(tok: Token): string {
  return (tok.children ?? [])
    .map((c) => (c.type === "text" || c.type === "code_inline" ? c.content : c.type === "softbreak" ? " " : ""))
    .join("");
}

// The sole image in an inline token, or null if it holds anything else.
function singleImage(tok: Token): Token | null {
  const kids = (tok.children ?? []).filter(
    (c) => !(c.type === "text" && c.content.trim() === "") && c.type !== "softbreak",
  );
  return kids.length === 1 && kids[0].type === "image" ? kids[0] : null;
}

type FigMedia =
  | { kind: "chart"; body: string }
  | { kind: "svg"; html: string }
  | { kind: "image"; img: Token }
  | null;

function findFigureClose(toks: Token[], open: number): number {
  // Figures do not nest, so the next close token is ours.
  for (let j = open + 1; j < toks.length; j++) if (toks[j].type === "container_figure_close") return j;
  return -1;
}

// Split a figure's inner tokens into its media, caption and source parts.
function classifyFigure(toks: Token[], open: number, close: number): { media: FigMedia; caption: Token | null; source: Token | null } {
  let media: FigMedia = null;
  let caption: Token | null = null;
  let source: Token | null = null;
  for (let i = open + 1; i < close; i++) {
    const t = toks[i];
    if (t.type === "fence" && t.info.trim() === "chart") {
      if (!media) media = { kind: "chart", body: t.content };
    } else if (t.type === "html_block" && /^\s*<svg\b/i.test(t.content)) {
      if (!media) media = { kind: "svg", html: t.content };
    } else if (t.type === "paragraph_open") {
      const inline = toks[i + 1];
      if (inline && inline.type === "inline") {
        const img = singleImage(inline);
        if (img && !media) media = { kind: "image", img };
        else {
          const text = inlinePlainText(inline).trim();
          if (FIG_SOURCE_RE.test(text)) source = inline;
          else if (!caption) caption = inline;
        }
      }
    }
  }
  return { media, caption, source };
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
// The source keys stay English; Spanish posts show Juan's Spanish words.
const VERDICT_ES: Record<string, string> = { held: "acierto", partly: "parcial", missed: "fallo" };
const verdictLabel = (word: string, lang: unknown): string => (lang === "es" ? VERDICT_ES[word] ?? word : word);

// A sidenote (numbered) or margin note (⊕), with the Tufte label+input+span so
// it opens on tap on narrow screens. Footnote labels beginning with `2026`
// render as 2026 errata annotations instead (see noteHtml's errata branch).
function noteHtml(label: string, content: string, lang?: unknown): string {
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
      const shown = verdictLabel(word, lang);
      return (
        `<label for="${id}" class="margin-toggle verdict-toggle"><span class="verdict-word">${shown}</span>⊕</label>` +
        `<input type="checkbox" id="${id}" class="margin-toggle"/>` +
        `<span class="marginnote errata verdict" data-verdict="${word}">${ERRATA_YEAR}<span class="verdict-word">${shown}</span>${rest}</span>`
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

  // ---- :::figure [main|margin|full] [#id] — numbered figures (spec §3) ----
  // The container only marks the block; `figure_assemble` (a core rule) does the
  // real work: numbering, caption markup, chart rendering and the data table.
  // The default validate accepts it ("figure" is the first word); its render is
  // never reached because the core rule replaces the tokens before render.
  md.use(container, "figure", { render: () => "" });

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

  // ---- :::document — an embedded document (memo, report) shown as a card ----
  // Its `##` is the document's own title, not a section of the post.
  md.use(container, "document", {
    render(tokens: Token[], idx: number) {
      return tokens[idx].nesting === 1 ? '<aside class="doc-card" role="document">\n' : "</aside>\n";
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
      const w = (k: string): string => verdictLabel(k, (state.env as Record<string, unknown>).lang);
      const tally =
        `<p class="scorecard-tally">${w("held")} <span class="dots">${"●".repeat(held)}</span> ` +
        `${w("partly")} <span class="dots">${"◐".repeat(partly)}</span> ` +
        `${w("missed")} <span class="dots">${"○".repeat(missed)}</span></p>\n`;
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
      return noteHtml(meta.label, content, e.lang);
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

  // ---- :::figure numbering (pass 1): assign "Figure N" in document order ----
  // Only figures with a caption are numbered; the id→number map is stashed on
  // env for the reference pass. Runs after footnotes are inlined and before the
  // bare-image `tufte_figure` rule, so a :::figure is assembled as one unit.
  md.core.ruler.push("figure_number", (state) => {
    const env = state.env as Record<string, unknown>;
    const toks = state.tokens;
    const numbers: Record<string, number> = {};
    let count = 0;
    for (let i = 0; i < toks.length; i++) {
      if (toks[i].type !== "container_figure_open") continue;
      const close = findFigureClose(toks, i);
      if (close < 0) continue;
      const { type, id } = parseFigureInfo(toks[i].info);
      const { caption } = classifyFigure(toks, i, close);
      let num = 0;
      if (caption) {
        num = ++count;
        if (id) numbers[id] = num;
      }
      (toks[i] as Token & { meta: Record<string, unknown> }).meta = { figType: type, figId: id, figNum: num };
    }
    env.figNumbers = numbers;
  });

  // ---- [@fig-id] references (pass 2): "Figure N" linked to #fig-id ----
  md.core.ruler.push("figure_refs", (state) => {
    const env = state.env as Record<string, unknown>;
    const numbers = (env.figNumbers as Record<string, number>) ?? {};
    const label = env.lang === "es" ? "Figura" : "Figure";
    for (const tok of state.tokens) {
      if (tok.type !== "inline" || !tok.children) continue;
      const out: Token[] = [];
      for (const child of tok.children) {
        const re = /\[@([\w-]+)\]/g;
        if (child.type !== "text" || !re.test(child.content)) {
          out.push(child);
          continue;
        }
        re.lastIndex = 0;
        let last = 0;
        let m: RegExpExecArray | null;
        while ((m = re.exec(child.content))) {
          if (m.index > last) {
            const t = new state.Token("text", "", 0);
            t.content = child.content.slice(last, m.index);
            out.push(t);
          }
          const n = numbers[m[1]];
          const h = new state.Token("html_inline", "", 0);
          // A non-breaking space keeps "Figure 2" from wrapping across a line.
          h.content = n ? `<a href="#${m[1]}" class="fig-ref">${label} ${n}</a>` : `${label} ?`;
          out.push(h);
          last = m.index + m[0].length;
        }
        if (last < child.content.length) {
          const t = new state.Token("text", "", 0);
          t.content = child.content.slice(last);
          out.push(t);
        }
      }
      tok.children = out;
    }
  });

  // ---- :::figure assembly (pass 3): caption markup, chart SVG, data table ----
  md.core.ruler.push("figure_assemble", (state) => {
    const env = state.env as Record<string, unknown>;
    const lang: Lang = env.lang === "es" ? "es" : "en";
    const figLabel = lang === "es" ? "Figura" : "Figure";
    const toks = state.tokens;
    let autoId = 0;
    for (let i = 0; i < toks.length; i++) {
      if (toks[i].type !== "container_figure_open") continue;
      const close = findFigureClose(toks, i);
      if (close < 0) continue;
      const meta = (toks[i] as Token & { meta?: Record<string, unknown> }).meta ?? {};
      const type = (meta.figType as FigSize) ?? "main";
      const id = meta.figId as string | undefined;
      const num = (meta.figNum as number) ?? 0;
      const { media, caption, source } = classifyFigure(toks, i, close);

      let figcaption = "";
      if (caption) {
        const capHtml = state.md.renderer.renderInline(caption.children!, state.md.options, state.env);
        let srcHtml = "";
        if (source) {
          const s = state.md.renderer.renderInline(source.children!, state.md.options, state.env);
          srcHtml = `<span class="fig-source">` + s.replace(FIG_SOURCE_RE, (_mm, w: string) => `<span class="sc">${w}</span> `) + `</span>`;
        }
        const labelSpan = num ? `<span class="fig-label">${figLabel} ${num}</span>` : "";
        figcaption = `<figcaption>${labelSpan}<span class="fig-text">${capHtml}</span>${srcHtml}</figcaption>`;
      }

      let mediaHtml = "";
      let tableHtml = "";
      const chartId = id ?? `fig-${num || "a" + ++autoId}`;
      if (media?.kind === "chart") {
        const r = renderChart(media.body, { size: type as FigSize, lang, id: chartId });
        mediaHtml = r.media;
        tableHtml = r.table;
      } else if (media?.kind === "svg") {
        mediaHtml = media.html.trim();
      } else if (media?.kind === "image") {
        const src = media.img.attrGet("src") ?? "";
        const alt = media.img.content ?? "";
        mediaHtml = `<img src="${state.md.utils.escapeHtml(src)}" alt="${state.md.utils.escapeHtml(alt)}" loading="lazy" decoding="async"/>`;
      }

      const idAttr = id ? ` id="${state.md.utils.escapeHtml(id)}"` : "";
      const html = `<figure class="${type}"${idAttr}>\n${figcaption}${mediaHtml}${tableHtml}\n</figure>`;
      const tok = new state.Token("html_block", "", 0);
      tok.content = html + "\n";
      tok.block = true;
      toks.splice(i, close - i + 1, tok);
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
