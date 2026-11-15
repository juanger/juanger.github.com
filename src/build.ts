// Orchestrate a full build into out/: copy public/, render posts and pages,
// write canonical pages, legacy alias stubs, feeds and the sitemap.

import { rm, mkdir, cp } from "node:fs/promises";
import { loadContent, byDateDesc, type Lang, type Post } from "./content.ts";
import { render } from "./markdown.ts";
import { indexPage, postPage, standalonePage, notFoundPage, redirectStub } from "./templates.ts";
import { atomFeed, sitemap } from "./feeds.ts";

export type BuildResult = { canonicalPaths: string[]; count: number };

async function write(outDir: string, relPath: string, contents: string): Promise<void> {
  const file = `${outDir}/${relPath}`;
  await mkdir(file.slice(0, file.lastIndexOf("/")), { recursive: true });
  await Bun.write(file, contents);
}

// Copy a source file to out/ byte-for-byte (used for the .md source copies).
async function copy(outDir: string, relPath: string, srcFile: string): Promise<void> {
  const file = `${outDir}/${relPath}`;
  await mkdir(file.slice(0, file.lastIndexOf("/")), { recursive: true });
  await Bun.write(file, Bun.file(srcFile));
}

// Map a legacy URL path to the output file that GitHub Pages would serve for it.
function aliasFile(urlPath: string): string {
  const p = urlPath.replace(/^\//, "");
  if (p.endsWith("/")) return `${p}index.html`;
  if (p.endsWith(".html")) return p;
  return `${p}.html`;
}

export async function build(opts: { outDir?: string; dev?: boolean; includeDrafts?: boolean } = {}): Promise<BuildResult> {
  const outDir = opts.outDir ?? "out";
  const dev = opts.dev ?? false;

  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  // 1. copy public/ verbatim (favicon, images, stylesheets, CNAME, css, fonts)
  await cp("public", outDir, { recursive: true });

  const { posts, pages } = await loadContent({ includeDrafts: opts.includeDrafts });

  // 2. render every post body once; reused for pages and feeds
  const renderedByPath = new Map<string, string>();
  for (const p of posts) renderedByPath.set(p.path, render(p.body, { lang: p.lang }));

  const canonicalPaths: string[] = ["/", "/es", "/about", "/acerca+de"];

  // 3. canonical post pages + legacy aliases
  const draftBanner =
    '<p style="background:#9b1b30;color:#fff;padding:.4rem .8rem;border-radius:3px;font-variant-caps:all-small-caps;letter-spacing:.08em">Draft — not published</p>';

  for (const p of posts) {
    let body = renderedByPath.get(p.path)!;
    if (dev && p.draft) body = draftBanner + body;
    await write(outDir, `${p.path}.html`, postPage(p, body, dev));
    canonicalPaths.push(`/${p.path}`);

    // Markdown source served at the same URL + ".md" (never for drafts). Images
    // use root-relative paths, so the source stays valid at its new location.
    if (!p.draft) await copy(outDir, `${p.path}.md`, p.file);

    if (p.lang === "en") {
      // /blog/YYYY/MM/slug and the trailing-slash form
      const legacy = `/blog/${p.year}/${p.month}/${p.slug}`;
      const stub = redirectStub(`/${p.path}`);
      await write(outDir, aliasFile(legacy), stub);
      await write(outDir, aliasFile(legacy + "/"), stub);
      // A meta refresh can't redirect plain text, so the .md alias is a
      // byte-identical copy of the source rather than a stub.
      if (!p.draft) await copy(outDir, `blog/${p.year}/${p.month}/${p.slug}.md`, p.file);
    }
    // explicit aliases from front matter (Octopress/Blogger URLs)
    for (const alias of p.aliases) {
      await write(outDir, aliasFile(alias), redirectStub(`/${p.path}`));
    }
  }

  // 4. index pages
  const en = posts.filter((p) => p.lang === "en");
  const es = posts.filter((p) => p.lang === "es");
  await write(outDir, "index.html", indexPage("en", en, dev));
  await write(outDir, "es.html", indexPage("es", es, dev));

  // 5. standalone pages (about / acerca+de)
  for (const page of pages) {
    const body = render(page.body, {});
    await write(outDir, `${page.name}.html`, standalonePage(page, body, dev));
  }

  // 6. 404 and a couple of section redirects
  await write(outDir, "404.html", notFoundPage(dev));
  await write(outDir, aliasFile("/about/"), redirectStub("/about"));
  await write(outDir, aliasFile("/blog/archives/"), redirectStub("/"));

  // 7. feeds + sitemap
  const sortedEn = [...en].sort(byDateDesc);
  const sortedEs = [...es].sort(byDateDesc);
  await write(outDir, "atom.xml", atomFeed("en", sortedEn, renderedByPath));
  await write(outDir, "es/atom.xml", atomFeed("es", sortedEs, renderedByPath));
  await write(outDir, "sitemap.xml", sitemap(canonicalPaths));

  return { canonicalPaths, count: posts.length };
}

// Allow `bun run src/build.ts` as a one-shot build.
if (import.meta.main) {
  const t0 = performance.now();
  const res = await build();
  console.log(`built ${res.count} posts → out/ in ${Math.round(performance.now() - t0)}ms`);
}
