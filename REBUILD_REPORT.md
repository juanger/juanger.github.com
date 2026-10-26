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
