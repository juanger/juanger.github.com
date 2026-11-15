# Golden baseline — accepted differences

`test/golden/*.html` holds each post's article HTML (the `<section>` innerHTML).
`test/golden.test.ts` compares the new generator's output against these files after
whitespace/entity normalization (see `test/normalize.ts`).

## Where the golden came from

For **14 posts** the golden was extracted verbatim from the site deployed on
2022-05-04 (the `_deploy` clone in `/home/enso/baseline`). These are true
regression tests against the live site.

For **8 posts** the golden was taken from a fresh render of the current source,
because the baseline is stale or the markup was intentionally changed. They still
guard against future regressions from the current source. Each is listed below.

## Build-time syntax highlighting (golden code blocks regenerated)

Fenced code is now highlighted at build time in `src/markdown.ts` (highlight.js
core, with ruby/scss/xml/objectivec/bash hand-registered; `console` gets a small
custom handler that highlights only `$ `/`% ` command lines). This is pure markup —
`hljs-*` spans baked inside the existing `<pre><code class="language-x">…</code></pre>`
wrapper, no client JS.

The golden for the **7 posts with fenced code** was regenerated for this: each
file's prose is byte-for-byte the prior baseline, and only the innards of its
`<pre><code>` blocks changed (the `hljs-*` spans were injected, block-for-block).
After entity-decoding and whitespace normalization the code text is identical to
before — the spans are the only new tokens.

| Post | Fenced languages |
|------|------------------|
| `en/2008/03/macruby` | `objc`, `ruby`, one no-language block (left plain) |
| `en/2008/05/rtranscoder-jpeg-to-mpeg` | `ruby` |
| `en/2008/05/freebsd-startup-script-with-ruby` | `ruby` |
| `en/2008/07/lucecita-rubycocoa-example` | `ruby` |
| `en/2008/11/screencast-with-rubycocoa` | `ruby` |
| `en/2010/04/this-is-old-post-that-i-wrote-some` | `console` (commands only) |
| `en/2013/01/html5-and-css3-buttons` | `scss`, `html` |

## Normalization that hides benign differences

- **HTML entities are decoded** before comparing. marked 0.7 (the old engine)
  escapes `'`→`&#39;` and `"`→`&quot;` in text; markdown-it emits them literally.
  Both decode to the same characters.
- **Whitespace is collapsed** and whitespace between/around tags is dropped.
  markdown-it adds a trailing newline inside `<pre><code>…\n</code></pre>`; marked
  does not. Insignificant for display.
- Heading `id`s are **reproduced** (marked's slugger is reimplemented in
  `src/markdown.ts`), so `#anchor` deep links still resolve — no difference there.

## Posts whose golden is a fresh render (not the 2022 baseline)

These 6 changed in commit `8da6e7a` ("Fix images and Liquid leftovers"), which
postdates the 2022 deploy. The only differences from the baseline are the image
`src` swaps / Liquid-tag removal in that commit — no prose or structural change:

| Post | Reason |
|------|--------|
| `en/2008/07/new-features-in-rorgate-30-beta` | `8da6e7a` relinked the Preferences image to a self-hosted copy. **Also converted here:** the three `<p class="marginnote shownote">` captions were rewritten as markdown figures so the margin captions open on tap on phones (text unchanged). |
| `en/2008/07/lucecita-rubycocoa-example` | `8da6e7a` relinked the Blogger image to `/images/…`. |
| `en/2008/10/lucecita-20` | `8da6e7a` relinked the Flickr image to `/images/…`. |
| `en/2009/07/one-week-till-midterm-evaluation` | `8da6e7a` relinked the Screencast image to `/images/…`. |
| `en/2013/01/html5-and-css3-buttons` | `8da6e7a` restored the CSS-buttons demo (stylesheet link, extra colour themes, inlined gist). |
| `en/2013/06/command-done-notification-with-zsh-and-growl` | `8da6e7a` replaced two Octopress `{% img %}` Liquid tags with `<img>`. |

These 2 were converted from raw-HTML sidenotes to the new footnote syntax so the
sidenotes open on tap on phones (the live site is missing the toggle checkbox):

| Post | Reason |
|------|--------|
| `en/2020/05/life-after-covid-19` | 3 sidenotes → `[^x]`, 1 figure → `![](… "caption")`, 3 pull-quotes → `:::pullquote`. Each note now emits the Tufte `<label>`+`<input>`+`<span>` triple. Prose unchanged. |
| `es/2020/05/life-after-covid-19` | Same conversion as the English version. |

## Revival cleanups (golden regenerated from current source)

These posts' golden was regenerated after the revival cleanups. The changes are
link targets, image markup / alt text and inlined code embeds only — no prose
change. Each is a fresh render of the current source.

Some of these posts already appear in the tables above (8da6e7a image relinks,
COVID sidenote conversion); the revival changes layer on top of that provenance.

| Post | Revival change |
|------|--------|
| `en/2008/05/rtranscoder-jpeg-to-mpeg` | Dead `rubyforge.org` link → 2009 Wayback snapshot + `archived` marker. Also removed a stray unmatched `</div>` at the end of the body (leftover HTML cruft) that closed `.page-layout` early in the browser, ejecting the byline and footer to the viewport edge. |
| `en/2008/05/textmate-ssh-and-github` | Spam `sshkeychain.org` → 2008 Wayback snapshot + `archived`; `macromates.com` → https. |
| `en/2008/05/freebsd-startup-script-with-ruby` | Dead `snippets.dzone.com` link → 2008 Wayback snapshot + `archived` marker. |
| `en/2008/07/rorgate` | `github.com/…/tree/master` → https; image cruft stripped + alt; `blog.jasoncrystal.com` and `code.google.com/p/rorgate` → Wayback snapshots + `archived`. |
| `en/2008/07/server-output-in-rorgate` | `tree/master%2F…?raw=true` href → `raw.githubusercontent.com`; image cruft stripped + alt + kept 400px width. |
| `en/2008/07/new-features-in-rorgate-30-beta` | Alt text added to the three figure images. |
| `en/2008/07/lucecita-rubycocoa-example` | `blog.juanger.com/…` → relative post URL; image cruft stripped + alt; dead `googlepages.com` download links → `dead-link` spans. |
| `en/2008/10/lucecita-20` | Flickr + `github.com/juanger/lucecita` → https; DMG `tree/master%2F…?raw=true` → `raw.githubusercontent.com`. |
| `en/2008/11/screencast-with-rubycocoa` | Dead gist 489722 inlined as a `ruby` fenced block with a "Gist ↗" link. |
| `en/2009/01/blogger-bundle-for-textmate-13` | `github.com/juanger/blogger.tmbundle` → https. |
| `en/2009/04/accepted-into-gsoc` | Dead `googlepages.com` download link → `dead-link` span. |
| `en/2009/07/one-week-till-midterm-evaluation` | Image cruft stripped + alt + kept 300px width; dead `juanger.heroku.com` link → `dead-link` span. |
| `en/2010/04/this-is-old-post-that-i-wrote-some` | Dead gist `<script>` embeds (489706/489709/489712/489715) inlined as fenced code blocks with "Gist ↗" links. |
| `en/2013/06/command-done-notification-with-zsh-and-growl` | `spoj.com` + `en.wikipedia.org` → https; dead `fightcodegame.com` and `getprismatic.com` → Wayback snapshots + `archived`. |
| `en/2020/05/life-after-covid-19` | Image alt text added/updated (deaths-by-country and Modeling COVID charts). |
| `es/2020/05/life-after-covid-19` | Image alt text added/updated (same two charts). |

## 2026 errata notes (golden regenerated from current source)

These posts' golden was regenerated after the 2026 errata pass. The only changes
are **inserted** 2026 annotations — `[^2026-…]` / `[^2026m-…]` / `[^2026!-…]` /
`[^2026r-…]` footnote references and their definitions, one `del`/`ins` word fix
(MacRuby), `:::today` blocks, and the status line (rendered from front matter,
not in the body). For every post below, the 2022 baseline (prior golden) is a
**subsequence** of the new render — i.e. the generator only added note markup and
altered no prose. Juan's words are byte-identical apart from the inserted
references and the single MacRuby `MRV`→`MRI` del/ins.

A few posts had prose wrapped in raw `<p>`/`<ul>` HTML blocks, which markdown-it
does not inline-parse, so a 2026 footnote reference placed inside would not
render. For those, the specific paragraphs receiving a note were unwrapped to
markdown (the `<p>` tags removed; markdown-it re-wraps them in `<p>`). This is a
markup change only — the text between the tags is unchanged, and the ADC
"Snow Leopard???" note (inside a `<ul>`) was written as a raw inline sidenote so
the list was left as raw HTML.

| Post | 2026 notes added |
|------|--------|
| `en/2008/03/macruby` | status (obsolete); `MRV`→`MRI` del/ins + sidenote; GC, POSIX-threads sidenotes; "looks promising" margin note. |
| `en/2008/05/rtranscoder-jpeg-to-mpeg` | status (obsolete); `:::today` ffmpeg one-liner. |
| `en/2008/05/textmate-ssh-and-github` | status (obsolete); TextMate-2 margin note; SSH sidenote; spam-link `always` sidenote; `:::today` ed25519 + keychain. |
| `en/2008/05/freebsd-startup-script-with-ruby` | status (obsolete); Mongrel, rc.d sidenotes; PATH margin note; `:::today` rc.subr sketch (labelled untested). |
| `en/2008/07/rorgate` | status (historical); "Gate" sidenote. |
| `en/2008/07/server-output-in-rorgate` | status (historical); stdout-buffering sidenote. |
| `en/2008/07/new-features-in-rorgate-30-beta` | status (historical); "0.3 not 3.0" sidenote; Web Inspector margin note. |
| `en/2008/07/lucecita-rubycocoa-example` | status (obsolete); zip-gone sidenote; event-tap sidenote; "screencast never happened" margin note. |
| `en/2008/10/lucecita-20` | status (historical); universal-binary (`ppc`/`i386`, verified) sidenote. |
| `en/2008/11/adc-student-member` | status (historical); ADC-membership sidenote; "Snow Leopard" sidenote (raw inline, inside `<ul>`); Developer-DVD margin note. |
| `en/2008/11/screencast-with-rubycocoa` | status (obsolete); Holydays + full-post margin notes; screencapture sidenote; muted `[^2026r-…]` gist-restore note. |
| `en/2009/01/blogger-bundle-for-textmate-13` | status (obsolete); GData-gems and ClientLogin sidenotes, Blogger-badge margin note (all raw inline, inside packed `<p>`/`<ul>` blocks). |
| `en/2009/04/accepted-into-gsoc` | status (historical); Porton/Pallet sidenote (raw inline). |
| `en/2009/07/one-week-till-midterm-evaluation` | status (historical); WWDC-videos and Heroku-tasks sidenotes (raw inline). |
| `en/2010/04/this-is-old-post-that-i-wrote-some` | status (partly-wrong); MacRoman, NFD, precomposeunicode, UFS (Lion, verified), Cocoa-NFC sidenotes; "won't be solved" **missed** verdict; muted gist-restore note (`[^2026r-…]`). Raw inline notes, since the anchors sit in packed `<p>`/`<ul>` HTML. |
| `en/2013/01/html5-and-css3-buttons` | status (obsolete); Flash and Compass-mixins margin notes; `appearance`/`accent-color` and `base-select` sidenotes; `:::today` modern-CSS block. |
| `en/2013/06/command-done-notification-with-zsh-and-growl` | status (obsolete); Prismatic, preexec/precmd, Notification-Center sidenotes; `:::today` Growl-free zsh snippet (marked "tested on macOS ___"). |
