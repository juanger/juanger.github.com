// Guards on the shipped stylesheet (public/css/site.css). Parsed as flat rule
// blocks — no CSS engine — which is enough for the structural checks we need.

import { test, expect } from "bun:test";

const cssPath = new URL("../public/css/site.css", import.meta.url).pathname;
const css = await Bun.file(cssPath).text();

// Strip comments, then split into `selector { body }` rule blocks. Nested
// at-rules (@media) keep their inner rules as separate blocks because we match
// the innermost `selector{...}` greedily per block.
function rules(src: string): { selector: string; body: string }[] {
  const noComments = src.replace(/\/\*[\s\S]*?\*\//g, "");
  const out: { selector: string; body: string }[] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(noComments))) {
    out.push({ selector: m[1].trim(), body: m[2].trim() });
  }
  return out;
}

test("no CSS rule dims a bare <img> with a filter", () => {
  // A dark-mode filter on bare `img` greys out screenshots and charts, whose
  // colours are evidence. Filters must be scoped to photos (figure.photo img,
  // img.photo). Offender: any filtered rule whose last compound selector is a
  // bare `img` element with no class/id/attribute qualifier.
  const offenders: string[] = [];
  for (const { selector, body } of rules(css)) {
    if (!/\bfilter\s*:/.test(body)) continue;
    for (const sel of selector.split(",")) {
      const key = sel.trim().split(/[\s>+~]+/).pop() ?? "";
      // `img` with no qualifier on itself; allowed only when a `.photo` scope
      // (figure.photo img / img.photo) restricts it to photos.
      if (key === "img" && !/\.photo\b/.test(sel)) offenders.push(sel.trim());
    }
  }
  expect(offenders).toEqual([]);
});

test("photos are dimmed in dark mode via a scoped selector", () => {
  // Positive check: the photo-dimming rule exists, so the fix is not just the
  // deletion of the blanket rule.
  const hasPhotoFilter = rules(css).some(
    ({ selector, body }) =>
      /\bfilter\s*:/.test(body) && /\bfigure\.photo\s+img\b|\bimg\.photo\b/.test(selector),
  );
  expect(hasPhotoFilter).toBe(true);
});
