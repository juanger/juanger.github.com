// Page templates as plain tagged-template literals. One layout() builds the head
// (per-page <title>, OpenGraph, canonical, hreflang, theme script); the rest build
// the index, post, standalone page, 404 and redirect-stub bodies.

import { html, raw, render_to_string, type Raw } from "./html.ts";
import type { Lang, Post, Page } from "./content.ts";

export const SITE = {
  origin: "https://blog.juanger.com",
  name: "Ruby Xocolatl",
  ogImage: "/images/blog-og-image.png",
};

type Strings = {
  subtitle: string;
  frontMatter: string;
  aboutLabel: string;
  aboutUrl: string;
  index: string;
  toOther: string; // label on the link to the other language
  byline: string;
  months: string[];
  monthsFull: string[];
  locale: string;
  themeToDark: string; // aria-label when the click switches to the dark theme
  themeToLight: string; // aria-label when the click switches to the light theme
  colophon: string;
  viewSource: string;
};

export const i18n: Record<Lang, Strings> = {
  en: {
    subtitle: "Shenanigans of my not so exciting life.",
    frontMatter: "Front matter",
    aboutLabel: "About Me",
    aboutUrl: "/about",
    index: "Index",
    toOther: "🇲🇽 Español",
    byline: "– Juan Germán Castañeda Echevarría",
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    monthsFull: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    locale: "en_US",
    themeToDark: "Switch to dark theme",
    themeToLight: "Switch to light theme",
    colophon: "Written by Juan Germán Castañeda Echevarría.",
    viewSource: "View source (.md)",
  },
  es: {
    subtitle: "Picardías de mi no muy emocionante vida",
    frontMatter: "Preliminares",
    aboutLabel: "Sobre el autor",
    aboutUrl: "/acerca+de",
    index: "Índice",
    toOther: "🇺🇸 English",
    byline: "– Juan Germán Castañeda Echevarría",
    months: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
    monthsFull: ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"],
    locale: "es_MX",
    themeToDark: "Cambiar a tema oscuro",
    themeToLight: "Cambiar a tema claro",
    colophon: "Escrito por Juan Germán Castañeda Echevarría.",
    viewSource: "Ver fuente (.md)",
  },
};

export const homeUrl = (lang: Lang) => (lang === "es" ? "/es" : "/");

// Parse "YYYY-MM-DD[ HH:MM]" into parts, no Date() (avoids timezone day-shift).
function dateParts(s: string): { y: string; m: string; d: string } {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return { y: "", m: "", d: "" };
  return { y: m[1], m: m[2], d: m[3] };
}

function fullDate(lang: Lang, dateStr: string): string {
  const { y, m, d } = dateParts(dateStr);
  const name = i18n[lang].monthsFull[Number(m) - 1] ?? m;
  const day = String(Number(d));
  return lang === "es" ? `${day} de ${name} de ${y}` : `${name} ${day}, ${y}`;
}

const isoDate = (dateStr: string) => {
  const { y, m, d } = dateParts(dateStr);
  return `${y}-${m}-${d}`;
};

// A quiet <head> with per-page title, OpenGraph/Twitter, canonical and hreflang.
export function layout(opts: {
  lang: Lang;
  title: string; // document title (already includes site name where wanted)
  pageTitle: string; // human title for OG (post/page title or site name)
  description: string;
  canonicalPath: string; // e.g. "/en/2008/03/macruby"
  ogType: "website" | "article" | "profile";
  image?: string;
  // The other-language version, if one exists. Its presence (not a truthy
  // string) is the signal that a translation exists — the English home lives at
  // "/", a falsy path that must still count as a real translation target.
  translation?: { url: string }; // full path incl. leading slash, e.g. "/es" or "/en/2008/03/macruby"
  mdPath?: string; // path to the markdown source (e.g. "/en/2008/03/macruby.md")
  indexLink: boolean; // show the Index link in the nav
  home?: boolean; // the index page itself — enlarges the masthead to read as the title
  body: Raw;
  dev?: boolean;
}): string {
  const t = i18n[opts.lang];
  const canonical = SITE.origin + opts.canonicalPath;
  const image = SITE.origin + (opts.image ?? SITE.ogImage);
  const feed = opts.lang === "es" ? "/es/atom.xml" : "/atom.xml";

  const other: Lang = opts.lang === "en" ? "es" : "en";
  const alternates: Raw[] = [];
  if (opts.translation) {
    alternates.push(
      html`<link rel="alternate" hreflang="${opts.lang}" href="${canonical}" />`,
      html`<link rel="alternate" hreflang="${other}" href="${SITE.origin}${opts.translation.url}" />`,
    );
  }

  return (
    "<!doctype html>\n" +
    `<html lang="${opts.lang}">\n` +
    render(html`<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${opts.title}</title>
<meta name="description" content="${opts.description}" />
<link rel="canonical" href="${canonical}" />
${alternates}
<meta property="og:site_name" content="${SITE.name}" />
<meta property="og:title" content="${opts.pageTitle}" />
<meta property="og:type" content="${opts.ogType}" />
<meta property="og:description" content="${opts.description}" />
<meta property="og:url" content="${canonical}" />
<meta property="og:image" content="${image}" />
<meta property="og:locale" content="${t.locale}" />
${opts.translation ? html`<meta property="og:locale:alternate" content="${i18n[other].locale}" />` : ""}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${opts.pageTitle}" />
<meta name="twitter:description" content="${opts.description}" />
<meta name="twitter:image" content="${image}" />
<link rel="alternate" type="application/atom+xml" title="${SITE.name}" href="${feed}" />
${opts.mdPath ? html`<link rel="alternate" type="text/markdown" href="${opts.mdPath}" />` : ""}
<link rel="icon" href="/favicon.ico" />
<link rel="preload" href="/fonts/et-book-roman-old-style-figures.woff" as="font" type="font/woff" crossorigin />
<link rel="stylesheet" href="/css/site.css" />
<script>${raw(THEME_INIT)}</script>
</head>`) +
    "\n<body>\n" +
    render(html`<div class="page-layout">
<header class="site-head${opts.home ? " site-head--home" : ""}">
<a class="masthead" href="${homeUrl(opts.lang)}">${SITE.name}</a>
<nav class="site-nav">
${opts.indexLink ? html`<a href="${homeUrl(opts.lang)}">☰ ${t.index}</a>` : ""}
${opts.translation ? html`<a href="${opts.translation.url}">${t.toOther}</a>` : ""}
${raw(themeToggle(opts.lang))}
</nav>
</header>
<main>
${opts.body}
</main>
${raw(footer(opts.lang))}
</div>
<script>${raw(THEME_TOGGLE)}</script>`) +
    (opts.dev ? `\n<script>${DEV_RELOAD}</script>` : "") +
    "\n</body>\n</html>\n"
  );
}

const render = render_to_string;

// Applied before first paint so a saved choice doesn't flash. JS off → CSS
// @media(prefers-color-scheme) still drives the theme.
const THEME_INIT =
  `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t);}catch(e){}`;

function footer(lang: Lang): string {
  const t = i18n[lang];
  return render(html`<footer class="site-foot">
<p class="colophon">${t.colophon}</p>
</footer>`);
}

// The header theme toggle. Rendered `hidden` and unhidden by THEME_TOGGLE, so
// with JS off it stays out of the way and CSS @media(prefers-color-scheme)
// drives the theme. Which icon shows is pure CSS (resolved theme); the
// localized aria-label is set by the script from the data-* labels. Both SVGs
// are ~1em and inherit currentColor so they match the nav ink.
function themeToggle(lang: Lang): string {
  const t = i18n[lang];
  return render(html`<button type="button" class="theme-toggle" hidden aria-label="${t.themeToDark}" data-to-dark="${t.themeToDark}" data-to-light="${t.themeToLight}">
<svg class="icon icon-moon" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
<svg class="icon icon-sun" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6"/></svg>
</button>`);
}

// Wires the header toggle: flips between light/dark, writing the choice to
// localStorage["theme"] and data-theme. The icon follows the resolved theme in
// CSS; here we only unhide the button and keep the aria-label in sync (on load,
// on click, and — while there's no saved choice — on a system theme change).
const THEME_TOGGLE = `(function(){
  var btn=document.querySelector(".theme-toggle");if(!btn)return;
  var root=document.documentElement;
  var mq=window.matchMedia("(prefers-color-scheme: dark)");
  function saved(){try{return localStorage.getItem("theme");}catch(e){return null;}}
  function resolved(){var s=saved();return (s==="light"||s==="dark")?s:(mq.matches?"dark":"light");}
  function sync(){btn.setAttribute("aria-label",resolved()==="dark"?btn.dataset.toLight:btn.dataset.toDark);}
  btn.hidden=false;sync();
  btn.addEventListener("click",function(){
    var next=resolved()==="dark"?"light":"dark";
    try{localStorage.setItem("theme",next);}catch(e){}
    root.setAttribute("data-theme",next);sync();
  });
  mq.addEventListener("change",function(){if(saved()===null)sync();});
})();`;

const DEV_RELOAD = `new EventSource("/__reload").onmessage=function(){location.reload()};`;

// ---- index ----
export function indexPage(lang: Lang, posts: Post[], dev = false): string {
  const t = i18n[lang];
  const byYear = new Map<string, Post[]>();
  for (const p of posts) {
    (byYear.get(p.year) ?? byYear.set(p.year, []).get(p.year)!).push(p);
  }
  const years = [...byYear.keys()].sort((a, b) => Number(b) - Number(a));

  const toc = years.map((year) => {
    const inYear = byYear
      .get(year)!
      .sort((a, b) => Number(b.month) - Number(a.month) || Number(b.day) - Number(a.day));
    return html`<h2>${year}</h2>
<ol>
${inYear.map(
      (p) => html`<li><time datetime="${p.year}-${p.month}-${p.day}"><span>${t.months[Number(p.month) - 1]}</span> <span>${p.day}</span></time> <a href="/${p.path}">${p.title}</a></li>
`,
    )}</ol>
`;
  });

  // Same centered column as a post <article>, so the masthead, subtitle and
  // year headings share one left edge (see the `article, .index` rule in CSS).
  const body = html`<div class="index">
<p class="subtitle">${t.subtitle}</p>
<nav class="front-matter">
<h2>${t.frontMatter}</h2>
<ol><li><a href="${t.aboutUrl}">${t.aboutLabel}</a></li></ol>
</nav>
<section id="TOC">
${toc}</section>
</div>`;

  return layout({
    lang,
    title: SITE.name,
    pageTitle: SITE.name,
    description: t.subtitle,
    canonicalPath: homeUrl(lang),
    ogType: "website",
    // Both index pages always exist, so each links to the other — including
    // English → "/es" and Spanish → "/" (the root, a falsy path).
    translation: { url: homeUrl(lang === "en" ? "es" : "en") },
    indexLink: false,
    home: true,
    body,
    dev,
  });
}

// ---- post ----
export function postPage(post: Post, renderedBody: string, dev = false): string {
  const t = i18n[post.lang];
  const mdPath = `/${post.path}.md`;
  const body = html`<article lang="${post.lang}">
<h1>${post.title}</h1>
<p class="post-meta"><time datetime="${isoDate(post.date)}">${fullDate(post.lang, post.date)}</time></p>
<section>${raw(renderedBody)}</section>
<footer class="byline">${t.byline}
<a class="view-source" href="${mdPath}">${t.viewSource}</a>
</footer>
</article>`;

  return layout({
    lang: post.lang,
    title: `${post.title} · ${SITE.name}`,
    pageTitle: post.title,
    description: post.description ?? t.subtitle,
    canonicalPath: `/${post.path}`,
    ogType: "article",
    image: post.image,
    // Use the explicit pairing flag, not the truthiness of the path.
    translation: post.hasTranslation ? { url: `/${post.translationPath}` } : undefined,
    mdPath,
    indexLink: true,
    body,
    dev,
  });
}

// ---- standalone page (about / acerca+de) ----
export function standalonePage(page: Page, renderedBody: string, dev = false): string {
  const body = html`<article lang="${page.lang}">
<h1>${page.title}</h1>
<section>${raw(renderedBody)}</section>
</article>`;

  const otherLang: Lang = page.lang === "en" ? "es" : "en";
  return layout({
    lang: page.lang,
    title: `${page.title} · ${SITE.name}`,
    pageTitle: page.title,
    description: (page.front.description as string) ?? i18n[page.lang].subtitle,
    canonicalPath: `/${page.name}`,
    ogType: "profile",
    // about ⇄ acerca+de are a fixed pair; each links to the other.
    translation: { url: i18n[otherLang].aboutUrl },
    indexLink: true,
    body,
    dev,
  });
}

// ---- 404 (bilingual) ----
export function notFoundPage(dev = false): string {
  const body = html`<article>
<h1>404</h1>
<p>This page could not be found. / No se encontró la página.</p>
<p><a href="/">Index</a> · <a href="/es">Índice</a></p>
</article>`;
  return layout({
    lang: "en",
    title: `404 · ${SITE.name}`,
    pageTitle: "404",
    description: "Page not found",
    canonicalPath: "/404.html",
    ogType: "website",
    indexLink: false,
    body,
    dev,
  });
}

// ---- redirect stub for legacy URLs: meta refresh + rel=canonical ----
export function redirectStub(targetPath: string): string {
  const url = SITE.origin + targetPath;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Redirecting…</title>
<meta http-equiv="refresh" content="0; url=${targetPath}" />
<link rel="canonical" href="${url}" />
<meta name="robots" content="noindex" />
</head>
<body>
<p>This page has moved to <a href="${targetPath}">${targetPath}</a>.</p>
</body>
</html>
`;
}
