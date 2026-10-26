// Build-time syntax highlighting: fences are highlighted in src/markdown.ts via
// markdown-it's `highlight` hook (highlight.js core, hand-registered languages).
// No client JS is shipped — the spans are baked into the HTML.

import { test, expect } from "bun:test";
import { render } from "../src/markdown.ts";

test("a ruby fence produces hljs-keyword spans", () => {
  const out = render("```ruby\ndef foo\n  return 1\nend\n```\n");
  expect(out).toContain('<pre><code class="language-ruby">');
  expect(out).toContain('class="hljs-keyword"');
});

test("an unknown-language fence is escaped and has no spans", () => {
  const out = render("```nosuchlang\nlet x = 1 < 2 && 3 > 2;\n```\n");
  expect(out).not.toContain("hljs-");
  expect(out).not.toContain("<span");
  expect(out).toContain("1 &lt; 2 &amp;&amp; 3 &gt; 2;");
});

test("highlighting adds no <script> to post output", () => {
  const out = render("```ruby\nputs 'hi'\n```\n");
  expect(out).not.toContain("<script");
});

test("console highlights only the commands, output stays plain", () => {
  const out = render("```console\n$ ls -la\ntotal 0\n```\n");
  // the command after the prompt is highlighted...
  expect(out).toContain('<span class="hljs-built_in">ls</span>');
  // ...but the prompt and the output line carry no spans.
  expect(out).toContain(">$ ");
  expect(out).toContain("total 0");
  expect(out).not.toContain('<span class="hljs-built_in">total');
});
