# Rebuild report — Bun + TypeScript generator

Replaced the Next 9.4 / React 16 / jdown stack with a small Bun + TypeScript static
generator and a new ET Book stylesheet. Posts, URLs and the authoring flow are kept.
All work is on the `rebuild` branch (off `source`); `source`, `main` and `master`
are untouched.

## What was built

### Generator (`src/`, 3 runtime deps: markdown-it, -footnote, -container)

| File | Lines | Purpose |
|------|------:|---------|
| `src/html.ts` | 41 | `html\`\`` tagged template (auto-escaping) + `raw()` |
| `src/content.ts` | 191 | Load posts/pages, split front matter (`Bun.YAML`), derive URL from filename, pair translations, filter drafts |
| `src/markdown.ts` | 201 | markdown-it config: footnote→sidenote (+mobile toggle), `[^m:]`→margin note, image→figure, `:::` containers, `^^newthought^^`, marked-compatible heading ids |
| `src/templates.ts` | 329 | layout/head (title, OG, Twitter, canonical, hreflang), index (TOC by year), post, standalone page, 404, redirect stub, i18n table, header theme toggle + pre-paint script |
| `src/feeds.ts` | 70 | Atom per language + sitemap (hand-written, no deps) |
| `src/build.ts` | 99 | Orchestrate: clean `out/`, copy `public/`, write pages + aliases + feeds |
| `src/dev.ts` | 120 | Single-process build + watch + `Bun.serve` (Pages resolution) + SSE reload |
| `src/types.d.ts` | 3 | Ambient decls for the untyped plugins |

Total generator source: **1054 lines**.

### Stylesheet + fonts
- `public/css/site.css` — **331 lines**, replacing the ~450-line inlined Tufte fork.
  ET Book body (self-hosted), IBM Plex Mono code, light/dark tokens, grana
  cochinilla `#9b1b30` / cacao `#d69a6f` accents, fluid rem scale, 34em measure,
  real underlines, A2 synthesized small caps, CSS-only sidenote toggle.
- `public/fonts/` — 4 ET Book `.woff` (roman old-style, display italic old-style,
  bold line, roman line) + 6 IBM Plex Mono `.woff2` (latin + latin-ext × 400/italic/600).

### Tests
- `test/golden.test.ts` (24) + `test/normalize.ts` (48) — per-post article HTML vs
  the frozen baseline, normalized.
- `test/urls.test.ts` (53) — builds into a scratch dir and asserts every line of
  `urls.txt` (83 URLs) resolves via Pages resolution; also asserts no draft leaks.
- `test/golden/` — 22 golden files + `DIFFERENCES.md`.

### Other
- `.github/workflows/pages.yml` (42) — push to `source` → install/test/build →
  upload-pages-artifact → deploy-pages, all actions pinned to full tags.
- `README.md` (90) — authoring cheat-sheet.
- `urls.txt` (99) — URL inventory.
- `pages/about.md`, `pages/es/acerca+de.md` — the TSX about pages as markdown.
- `public/CNAME` (`blog.juanger.com`), restored `public/favicon.png`.

### Content edits (markup only, prose unchanged)
- Both COVID posts (en + es): sidenotes → `[^x]`, pull-quotes → `:::pullquote`,
  figure → `![](… "caption")`. Each note now emits the `<label>`+`<input>`+`<span>`
  toggle, so sidenotes open on tap on phones (the live site is missing the checkbox).
- `new-features-in-rorgate-30-beta` (en): the three `shownote` figure captions
  converted to markdown figures so the captions open on tap too.
- `aliases` front matter added to `html5-and-css3-buttons`, `blogger-bundle-for-textmate-13`,
  `lucecita-20` for their Octopress/Blogger URLs.
- `test/fixtures/posts/en/2099-01-01_draft-example.md` — a `draft: true` fixture for the
  draft tests, kept out of `posts/` so it never shows in the real build or dev index.

### Removed old stack
`pages/*.tsx`, `pages/[lang]/…`, `components/`, `lib/`, `.themes/`, `.gitmodules`,
`.babelrc`, `next-env.d.ts`, `package-lock.json`. `package.json` rewritten (Bun
scripts, 3 deps), `tsconfig.json` rewritten for Bun, `.gitignore` updated
(`out/`, `node_modules/`, `test/.urls-out/`).

## Test results

```
bun test → 112 pass, 0 fail (golden 22, urls 83, cross-language links 2, plus fixtures/draft + .md checks)
bun run build → 22 posts, 147 files in out/ (42 of them .md), ~30 ms
bunx tsc --noEmit → clean
bun install --frozen-lockfile → clean (CI-ready)
```

## .md serving

Every post page also has its markdown source at the same URL + `.md`
(`/en/2020/05/life-after-covid-19` → `…/life-after-covid-19.md`, same for `/es`).
The `.md` is the source file **exactly as written** (front matter included),
copied byte-for-byte into `out/<lang>/YYYY/MM/slug.md`. Images use root-relative
`/images/…` paths, so the markdown stays valid at its new location — it is not
rewritten. Drafts are never copied.

- Each legacy `/blog/YYYY/MM/slug` English alias also gets a byte-identical
  `.md` copy (a meta-refresh stub can't redirect plain text).
- Each post `<head>` gets `<link rel="alternate" type="text/markdown" href="…/slug.md">`,
  and the post footer gets a quiet "View source (.md)" link (`.view-source`,
  styled with the muted footer ink; "Ver fuente (.md)" in Spanish).
- **Dev server** serves `.md` with `Content-Type: text/plain; charset=utf-8` so
  browsers (including iOS WKWebView) display it inline instead of downloading it.
- **Production (GitHub Pages):** an empty `public/.nojekyll` (copied with the rest
  of `public/`, dotfiles included) stops Jekyll from processing the `.md` files, so
  they publish as files. Pages sets the content type itself and **may serve `.md` as
  `text/markdown`, which some browsers download rather than display** — Juan should
  check this after cutover; if it matters, a `_headers`/content-type override would
  be the next step.
- Tests (`test/urls.test.ts`): every non-draft post has a `.md` whose bytes equal
  the source; the `.md` alias exists and matches for every `/blog/…` English post;
  no draft `.md` is published.

## Golden differences accepted

Full list with reasons in `test/golden/DIFFERENCES.md`. Summary:

- **14 posts** compare byte-for-byte (after whitespace/entity normalization) against
  the 2022-05-04 deploy.
- **6 posts** changed in commit `8da6e7a` (image relinks, Liquid-tag removal) which
  postdates the deploy; their golden is a fresh render of the current source. Diffs
  verified to be only those image/Liquid changes.
- **2 posts** (COVID en/es) were converted to the new sidenote syntax; their golden
  is a fresh render. The only structural change is the added mobile-toggle markup.
- Normalization decodes entities (`&#39;`↔`'`), collapses whitespace, and ignores
  the trailing newline markdown-it adds inside `<pre><code>`. Heading `id`s are
  reproduced (marked's slugger reimplemented) so `#anchor` links still resolve.

## Deviations / judgment calls

- **ET Book figures.** Design decision 1 lists `roman-line-figures` as a body face,
  but decision 8 wants old-style figures in running text. ET Book has no OpenType
  figure toggle (separate files), so the two can't both hold. I made the body roman
  face `roman-old-style-figures` (decision 8 — the more specific instruction and the
  one matching `oldstyle-nums`), and kept `roman-line-figures` as `"ET Book LF"` for
  tables (lining/tabular numerals). All four files are downloaded and used.
- **About pages** use a plain labelled link list, not the FontAwesome SVG icons from
  the old TSX (which pulled a dependency). Worth a visual pass if Juan wants icons.
- **Dev `src/` edits** need a manual restart. I kept `bun run dev` a single plain
  process (no `bun --watch` self-restart) to honor "single process, no spawning
  itself" unambiguously. Content edits hot-reload.

## Not done (out of scope per the task) / for Juan

- **Errata system** — intentionally skipped (no banners, 2026 notes, scorecards,
  index labels or `/errata`). The extra front-matter fields are parsed but nothing
  is rendered from them.
- **Gist inlining** — the dead `<script src="http://gist.github.com/…">` embeds in
  the HFS+ and screencast posts are left as-is (a separate content fix).
- **No push/deploy performed** — no credentials; Juan cuts over himself.

### Needs Juan's eye
- **Visual check** of the new stylesheet on desktop and at ~375px, light and dark,
  especially: ET Book sidenote legibility on low-density screens, the A2 small-caps
  masthead weight, and the COVID post's margin notes/figure on a phone. I could not
  render in a real browser here.
- **At cutover**, in repo Settings → Pages: switch the source to **"GitHub Actions"**
  and set the custom domain to **`blog.juanger.com`** (Actions deploys take the
  domain from settings; `public/CNAME` is also committed). Keep `master` as rollback.
- First deploy briefly serves nothing if the workflow fails — do the Pages-source
  switch right after a green run, or flip back to `master` to roll back.

## Review round 3 (follow-ups)

- **Cross-language links now go both ways.** `layout()` takes an explicit
  `translation?: { url }` instead of a truthy `translationPath` string, so the
  Spanish index links back to the English home at `/` (a falsy path that was
  being dropped). hreflang + `og:locale:alternate` are emitted for the root too.
  Posts use the explicit `hasTranslation` flag; the about ⇄ acerca+de pair links
  both ways; the 404 (no counterpart) shows no language link.
  `test/templates.test.ts` guards the index and about pairs.
- **Theme switch moved to the header.** The footer System/Light/Dark radios are
  gone; a single icon `<button>` sits in the nav (moon in light, sun in dark, as
  ~1em inline SVG with `currentColor`). It toggles `data-theme`, persists to
  `localStorage["theme"]` (all access in try/catch), keeps the pre-paint head
  script, updates its icon/aria-label on a system change while unset, is rendered
  `hidden` (unhidden by JS) so with JS off CSS follows the system, and carries a
  localized `aria-label` and a visible focus ring.

## Revival cleanups

A batch of eight link/markup/asset fixes on `rebuild` (one commit per item).
Juan's prose is unchanged throughout — only link targets, markup, alt text, code
embeds and generated assets changed. `bun test` and `bun run build` pass at every
commit. Golden files for touched posts were regenerated from the current source
(see `test/golden/DIFFERENCES.md`).

**0. Thinner theme icons.** The header moon/sun are now outline icons (`fill:none`,
`stroke:currentColor`, 1.25 stroke in a 24 viewBox, round caps/joins) — a slim
crescent and a small sun with short rays, to match ET Book's thin strokes.

**1. Inlined the dead gists.** The HFS+ post (gists 489706/489709/489712/489715)
and the screencast post (489722) embedded `<script src="http://gist.github.com/…js">`,
which browsers block as mixed content. Each is now a fenced code block (console /
ruby) with a small "Gist ↗" link to the gist page. Fetched once at edit time; no
network at build. `test/built-html.test.ts` asserts no built page embeds a gist
`.js`.

**2. Removed the spam link.** `www.sshkeychain.org` (now redirects to spam) points
at its 2008-05-12 Wayback snapshot, as an archived link (see item 5).

**3. https where it works.** Upgraded links whose host serves the same page over
https (each checked with `curl -sIL`). The two GitHub `tree/master%2F…?raw=true`
download URLs became working `raw.githubusercontent.com` URLs; the old
`blog.juanger.com/2008/10/lucecita-20.html` self-reference became the relative post
URL. `test/built-html.test.ts` asserts no built page has `src="http://…"` (and, as
a stronger guard, no bare `href="http://…"` either).

**4. Old Blogger image markup.** Stripped inline `style`, `border`, `cursor`,
`id="BLOGGER_PHOTO_ID_…"` and the dead `deselectBloggerImageGracefully` `onblur`
from post `<img>`/`<a>` tags; dropped the fixed heights that squashed images on
phones (the stylesheet's `max-width:100%; height:auto` now sizes them). Deliberate
small widths (497/400/300 px) kept as plain `width` attributes. Every image got a
short factual `alt`. `test/built-html.test.ts` asserts every `<img>` in `out/` has a
non-empty `alt`. No image exceeds the text column at 375 px (the global
`max-width:100%` is not overridden).

**5. Dead links → Wayback.** See the table below.

**6. Post-deploy URL check.** A new `check-urls` job runs after `deploy-pages` and
requests every path in `urls.txt` against the deployed site, using the deploy
step's `page_url` output (exposed as a job output) rather than a hardcoded domain.
The logic is `scripts/check-urls.ts` (Bun): `curl -sIL` per URL with a CDN warm-up
wait and per-URL retries, fails the job on any non-2xx/3xx, and writes a pass/fail
table to the job summary.

**7. Favicon + social image.** `tools/make-icons.ts` (opentype.js → SVG paths,
`@resvg/resvg-js` → PNG; devDependencies, never run by the build) generates the "RX"
mark in `#9b1b30` on `#fbf8f1` as `public/favicon.svg`, `favicon.ico`, `favicon.png`
(32 px) and `apple-touch-icon.png` (180 px), plus `public/og.png` (1200×630:
"Ruby Xocolatl" in synthesized small caps, subtitle in italic muted ink). The head
links the SVG icon first; `og.png` is the single `og:image`/`twitter:image` for
every page (no per-post images). README documents regeneration.

### Item 5 — links changed (old → new)

| Post | Original link | New target |
|------|---------------|-----------|
| rtranscoder-jpeg-to-mpeg | `http://rtranscoder.rubyforge.org/` | Wayback `20090101041307` + `archived` |
| freebsd-startup-script-with-ruby | `http://snippets.dzone.com/posts/show/2594` | Wayback `20080602152255` + `archived` |
| rorgate | `http://blog.jasoncrystal.com/?p=7` | Wayback `20080705060925` + `archived` |
| rorgate | `http://code.google.com/p/rorgate/` | Wayback `20080705131540` + `archived` |
| command-done…growl | `http://fightcodegame.com/` | Wayback `20130602015440` + `archived` |
| command-done…growl | `http://getprismatic.com` | Wayback `20130612191539` + `archived` |
| lucecita-rubycocoa-example | `http://juanger.googlepages.com/Lucecita.zip` (×2) | no snapshot → `dead-link` span |
| accepted-into-gsoc | `http://juanger.googlepages.com/Porton-app.zip` | no snapshot → `dead-link` span |
| one-week-till-midterm-evaluation | `http://juanger.heroku.com/gsoc-09` | no snapshot → `dead-link` span |

(Item 2's `www.sshkeychain.org` → Wayback `20080512090802` is the same archived
pattern.) All Wayback links use the `https://web.archive.org/` host (verified 200),
so none is a mixed-content or bare-`http` link. Archived markers are styled
`.archived` (small caps, `--ink-muted`, thin space before); Spanish posts would use
"archivado" (none occur here). Dead links are `.dead-link` muted spans with a
`title`.

### Couldn't do / for Juan's eye

- **spoj.com** answers `403` to automated `HEAD`/`GET` over both http and https
  (bot protection); the http URL already redirects to https, so https is the correct
  same-page target and was used. A link checker may still report 403 for it.
- **No Wayback snapshot** exists for the three `googlepages.com` download files or
  `juanger.heroku.com/gsoc-09`, so those are muted `dead-link` spans, per the spec.
- **Favicon at 16 px.** The "RX" mark is crisp at 32 px and 180 px; a real 16-px
  check on device is worth a glance (the spec allowed falling back to "R" — I judged
  "RX" readable).
- **`@resvg/resvg-js`** ships a platform-specific native binary; the lockfile pins
  the linux-x64 build CI uses. It is a devDependency and never runs in the build, so
  a missing binary on another platform would not affect `bun run build`.
- The earlier report's "Gist inlining" under *Not done* is now **done** (item 1).

## Code highlighting + index spacing

### Item 1 — build-time syntax highlighting (variant C)

Fenced code is now highlighted at build time in `src/markdown.ts` via markdown-it's
`highlight` hook — **no client JS**. Uses `highlight.js` (pinned `11.11.1`),
importing `highlight.js/lib/core` and registering only the languages the posts use:
ruby, scss, xml (covers `html`), objectivec (covers `objc`), bash. Unknown or
missing languages are escaped and left plain; there is **no auto-detection**.
`console` blocks get a small custom handler: only command lines (starting `$ ` or
`% `) are highlighted as bash, output lines stay plain ink. Output keeps the
`<pre><code class="language-x">…</code></pre>` shape with `hljs-*` spans inside.

Styles live in `public/css/site.css` ("C · Accent keywords": ink by default, the
accent for keywords/meta, italic muted comments). Added an `--ink-soft` token
(`#8a7d70` light / `#7f7366` dark) in all four token blocks. The IBM Plex Mono 600
face for `.hljs-title` was already self-hosted, so no new font was needed.

Tests in `test/highlight.test.ts`: a ruby fence emits `hljs-keyword` spans; an
unknown-language fence is escaped with no spans; rendered code adds no `<script>`;
`console` highlights commands only. The 7 posts with fenced code had their golden
code blocks regenerated (prose byte-for-byte unchanged) — see
`test/golden/DIFFERENCES.md`.
