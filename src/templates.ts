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
  themeLegend: string;
  system: string;
  light: string;
  dark: string;
  colophon: string;
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
    themeLegend: "Theme",
    system: "System",
    light: "Light",
    dark: "Dark",
    colophon: "Written by Juan Germán Castañeda Echevarría.",
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
    themeLegend: "Tema",
    system: "Sistema",
    light: "Claro",
    dark: "Oscuro",
    colophon: "Escrito por Juan Germán Castañeda Echevarría.",
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
  translationPath?: string; // path of the other-language version, if any
  indexLink: boolean; // show the Index link in the nav
  body: Raw;
  dev?: boolean;
}): string {
  const t = i18n[opts.lang];
  const canonical = SITE.origin + opts.canonicalPath;
  const image = SITE.origin + (opts.image ?? SITE.ogImage);
  const feed = opts.lang === "es" ? "/es/atom.xml" : "/atom.xml";

  const alternates: Raw[] = [];
  if (opts.translationPath) {
    const other: Lang = opts.lang === "en" ? "es" : "en";
    alternates.push(
      html`<link rel="alternate" hreflang="${opts.lang}" href="${canonical}" />`,
      html`<link rel="alternate" hreflang="${other}" href="${SITE.origin}/${opts.translationPath}" />`,
    );
  }

  const translationUrl = opts.translationPath ? `/${opts.translationPath}` : undefined;

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
${opts.translationPath ? html`<meta property="og:locale:alternate" content="${i18n[opts.lang === "en" ? "es" : "en"].locale}" />` : ""}
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${opts.pageTitle}" />
<meta name="twitter:description" content="${opts.description}" />
<meta name="twitter:image" content="${image}" />
<link rel="alternate" type="application/atom+xml" title="${SITE.name}" href="${feed}" />
<link rel="icon" href="/favicon.ico" />
<link rel="preload" href="/fonts/et-book-roman-old-style-figures.woff" as="font" type="font/woff" crossorigin />
<link rel="stylesheet" href="/css/site.css" />
<script>${raw(THEME_INIT)}</script>
</head>`) +
    "\n<body>\n" +
    render(html`<div class="page-layout">
<header class="site-head">
<a class="masthead" href="${homeUrl(opts.lang)}">${SITE.name}</a>
<nav class="site-nav">
${opts.indexLink ? html`<a href="${homeUrl(opts.lang)}">☰ ${t.index}</a>` : ""}
${translationUrl ? html`<a href="${translationUrl}">${t.toOther}</a>` : ""}
</nav>
</header>
<main>
${opts.body}
</main>
${raw(footer(opts.lang))}
</div>`) +
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
<form class="theme-select" aria-label="${t.themeLegend}">
<span class="legend">${t.themeLegend}</span>
<label><input type="radio" name="theme" value="system" /> ${t.system}</label>
<label><input type="radio" name="theme" value="light" /> ${t.light}</label>
<label><input type="radio" name="theme" value="dark" /> ${t.dark}</label>
</form>
<p class="colophon">${t.colophon}</p>
<script>${raw(THEME_SELECT)}</script>
</footer>`);
}

// Wires the footer radios: reads/writes localStorage["theme"], toggles data-theme.
const THEME_SELECT = `(function(){
  var form=document.currentScript.parentNode.querySelector(".theme-select");
  var saved="system";try{saved=localStorage.getItem("theme")||"system";}catch(e){}
  var r=form.querySelector('input[value="'+saved+'"]');if(r)r.checked=true;
  form.addEventListener("change",function(e){
    var v=e.target.value;
    try{if(v==="system")localStorage.removeItem("theme");else localStorage.setItem("theme",v);}catch(err){}
    if(v==="system")document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme",v);
  });
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

  const body = html`<p class="subtitle">${t.subtitle}</p>
<nav class="front-matter">
<h2>${t.frontMatter}</h2>
<ol><li><a href="${t.aboutUrl}">${t.aboutLabel}</a></li></ol>
</nav>
<section id="TOC">
${toc}</section>`;

  return layout({
    lang,
    title: SITE.name,
    pageTitle: SITE.name,
    description: t.subtitle,
    canonicalPath: homeUrl(lang),
    ogType: "website",
    translationPath: lang === "en" ? "es" : undefined,
    indexLink: false,
    body,
    dev,
  });
}

// ---- post ----
export function postPage(post: Post, renderedBody: string, dev = false): string {
  const t = i18n[post.lang];
  const body = html`<article lang="${post.lang}">
<h1>${post.title}</h1>
<p class="post-meta"><time datetime="${isoDate(post.date)}">${fullDate(post.lang, post.date)}</time></p>
<section>${raw(renderedBody)}</section>
<footer class="byline">${t.byline}</footer>
</article>`;

  return layout({
    lang: post.lang,
    title: `${post.title} · ${SITE.name}`,
    pageTitle: post.title,
    description: post.description ?? t.subtitle,
    canonicalPath: `/${post.path}`,
    ogType: "article",
    image: post.image,
    translationPath: post.translationPath,
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

  return layout({
    lang: page.lang,
    title: `${page.title} · ${SITE.name}`,
    pageTitle: page.title,
    description: (page.front.description as string) ?? i18n[page.lang].subtitle,
    canonicalPath: `/${page.name}`,
    ogType: "profile",
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
