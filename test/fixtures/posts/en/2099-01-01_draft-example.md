---
title: Draft example (never published)
date: 2099-01-01
draft: true
---

This post has `draft: true`, so `bun run build` must never emit it. It shows up
only in `bun run dev` with a DRAFT banner. A test asserts it stays out of `out/`.
