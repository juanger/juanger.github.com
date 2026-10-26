// Hand-written Atom feeds (one per language) and a sitemap, no dependencies.

import type { Lang, Post } from "./content.ts";
import { SITE, i18n, homeUrl } from "./templates.ts";

const AUTHOR = "Juan Germán Castañeda Echevarría";

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// RFC-3339 from a plain date string, forced to UTC (never through new Date()).
function rfc3339(s: string): string {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) return "1970-01-01T00:00:00+00:00";
  const [, y, mo, d, hh = "00", mm = "00"] = m;
  return `${y}-${mo}-${d}T${hh}:${mm}:00+00:00`;
}

export function atomFeed(lang: Lang, posts: Post[], rendered: Map<string, string>): string {
  const feedPath = lang === "es" ? "/es/atom.xml" : "/atom.xml";
  const self = SITE.origin + feedPath;
  const home = SITE.origin + homeUrl(lang);
  const recent = [...posts].slice(0, 20);
  const updated = recent.length ? rfc3339(recent[0].front.updated ?? recent[0].date) : rfc3339("1970-01-01");

  const entries = recent
    .map((p) => {
      const url = `${SITE.origin}/${p.path}`;
      const body = rendered.get(p.path) ?? "";
      return `  <entry>
    <title>${xmlEscape(p.title)}</title>
    <link href="${url}" />
    <id>${url}</id>
    <published>${rfc3339(p.date)}</published>
    <updated>${rfc3339((p.front.updated as string) ?? p.date)}</updated>
    <summary>${xmlEscape(p.description ?? "")}</summary>
    <content type="html">${xmlEscape(body)}</content>
  </entry>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="${lang}">
  <title>${xmlEscape(SITE.name)}</title>
  <subtitle>${xmlEscape(i18n[lang].subtitle)}</subtitle>
  <link href="${self}" rel="self" />
  <link href="${home}" />
  <id>${self}</id>
  <updated>${updated}</updated>
  <author><name>${xmlEscape(AUTHOR)}</name></author>
${entries}
</feed>
`;
}

export function sitemap(canonicalPaths: string[]): string {
  const urls = canonicalPaths
    .map((p) => `  <url><loc>${xmlEscape(SITE.origin + p)}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="utf-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
