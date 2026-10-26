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

| Post | Reason |
|------|--------|
| `en/2010/04/this-is-old-post-that-i-wrote-some` | Dead `<script src="http://gist.github.com/…js">` embeds (gists 489706/489709/489712/489715) inlined as fenced code blocks with a "Gist ↗" link. |
| `en/2008/11/screencast-with-rubycocoa` | Dead gist 489722 inlined as a `ruby` fenced block with a "Gist ↗" link. |
| `en/2008/05/textmate-ssh-and-github` | Spam `sshkeychain.org` link repointed at its 2008 Wayback snapshot with an `archived` marker; `macromates.com` upgraded to https. |
