// Shared HTML normalization for the golden comparison: decode entities, collapse
// whitespace and drop whitespace between tags, so that only meaningful structural
// differences survive (marked 0.7 and markdown-it escape and space things
// differently). Attribute order is left alone — in practice the only generated
// attributes are single (`class`, `href`), and raw HTML is passed through verbatim.

const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  rsquo: "’",
  lsquo: "‘",
  ldquo: "“",
  rdquo: "”",
  copy: "©",
};

export function decodeEntities(s: string): string {
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, body: string) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X"
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return body in NAMED ? NAMED[body] : m;
  });
}

export function normalizeHtml(html: string): string {
  let s = decodeEntities(html);
  // self-closing vs not: <hr/> == <hr> , <img .../> == <img ...>
  s = s.replace(/\s*\/>/g, ">");
  // drop whitespace between tags
  s = s.replace(/>\s+</g, "><");
  // collapse remaining whitespace runs
  s = s.replace(/\s+/g, " ");
  // ignore whitespace hugging a closing tag (marked vs markdown-it differ on the
  // trailing newline inside <pre><code>…</code></pre>)
  s = s.replace(/\s+<\//g, "</");
  return s.trim();
}
