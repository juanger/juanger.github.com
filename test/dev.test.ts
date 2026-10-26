// Unit tests for the dev-server watch guards: the signature that lets us skip
// rebuilds when nothing really changed, and the window that ignores the
// FSEvents our own public/ copy fires on the source tree.

import { test, expect } from "bun:test";
import { treeSignature, shouldIgnoreEvent, type FileEntry } from "../src/dev.ts";

test("treeSignature is stable across entry order", () => {
  const a: FileEntry[] = [
    { path: "public/site.css", mtimeMs: 10, size: 100 },
    { path: "posts/a.md", mtimeMs: 20, size: 200 },
  ];
  const b: FileEntry[] = [a[1], a[0]];
  expect(treeSignature(a)).toBe(treeSignature(b));
});

test("treeSignature changes when mtime or size changes", () => {
  const base: FileEntry[] = [{ path: "public/site.css", mtimeMs: 10, size: 100 }];
  const sig = treeSignature(base);
  expect(treeSignature([{ path: "public/site.css", mtimeMs: 11, size: 100 }])).not.toBe(sig);
  expect(treeSignature([{ path: "public/site.css", mtimeMs: 10, size: 101 }])).not.toBe(sig);
});

test("treeSignature is unchanged when a copy leaves source mtimes intact", () => {
  // The loop bug: copying public/ fires watch events but never touches source
  // mtime/size, so re-scanning the tree yields the same signature -> no rebuild.
  const before: FileEntry[] = [
    { path: "public/site.css", mtimeMs: 10, size: 100 },
    { path: "posts/a.md", mtimeMs: 20, size: 200 },
  ];
  const afterCopy: FileEntry[] = [
    { path: "posts/a.md", mtimeMs: 20, size: 200 },
    { path: "public/site.css", mtimeMs: 10, size: 100 },
  ];
  expect(treeSignature(afterCopy)).toBe(treeSignature(before));
});

test("shouldIgnoreEvent drops events while a build is running", () => {
  expect(
    shouldIgnoreEvent({ now: 1_000_000, building: true, lastBuildEnd: 0, quietWindowMs: 300 }),
  ).toBe(true);
});

test("shouldIgnoreEvent drops events within the quiet window after a build", () => {
  expect(
    shouldIgnoreEvent({ now: 1100, building: false, lastBuildEnd: 1000, quietWindowMs: 300 }),
  ).toBe(true);
});

test("shouldIgnoreEvent allows events after the quiet window passes", () => {
  expect(
    shouldIgnoreEvent({ now: 1400, building: false, lastBuildEnd: 1000, quietWindowMs: 300 }),
  ).toBe(false);
});
