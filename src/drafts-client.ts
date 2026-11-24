// The inline-comment layer for draft previews, inlined by drafts.ts into pages
// served from /drafts only. Plain ES2017, no template literals (this file holds
// it inside one). Talks to /__comments/<slug> on the dev server.

export const CLIENT_CSS = `
mark.cmt { background: rgba(186, 132, 22, 0.28); color: inherit; border-radius: 2px; cursor: pointer; }
mark.cmt.resolved { background: none; text-decoration: underline dotted rgba(186, 132, 22, 0.8); }
.cmt-bar { position: fixed; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom)); z-index: 50; display: flex; gap: 8px; }
.cmt-bar button, .cmt-sheet button { font: inherit; font-size: 15px; padding: 8px 14px; border-radius: 18px; border: 1px solid var(--rule); background: var(--paper); color: var(--ink); box-shadow: 0 1px 4px rgba(0,0,0,.18); }
.cmt-bar button.primary, .cmt-sheet button.primary { background: var(--accent); color: var(--paper); border-color: var(--accent); }
.cmt-banner { position: fixed; left: 0; right: 0; top: 0; z-index: 60; padding: 10px 16px; background: var(--accent); color: var(--paper); text-align: center; font-size: 15px; }
.cmt-pick p:hover, .cmt-pick li:hover { outline: 1px dashed var(--accent); }
.cmt-sheet { position: fixed; left: 0; right: 0; bottom: 0; z-index: 70; max-height: 75vh; overflow: auto; background: var(--paper); color: var(--ink); border-top: 1px solid var(--rule); box-shadow: 0 -4px 18px rgba(0,0,0,.2); padding: 14px 16px calc(14px + env(safe-area-inset-bottom)); font-size: 16px; }
.cmt-sheet .inner { max-width: 640px; margin: 0 auto; }
.cmt-sheet blockquote { margin: 0 0 10px; padding-left: 10px; border-left: 3px solid rgba(186, 132, 22, 0.8); color: var(--ink-muted); font-style: italic; }
.cmt-sheet textarea { box-sizing: border-box; width: 100%; min-height: 5.5em; font: inherit; font-size: 16px; padding: 8px; border: 1px solid var(--rule); border-radius: 6px; background: var(--paper); color: var(--ink); }
.cmt-sheet .row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.cmt-sheet .msg { margin: 6px 0; }
.cmt-sheet .who { font-variant: small-caps; letter-spacing: .04em; color: var(--ink-muted); margin-right: 6px; }
.cmt-sheet .item { padding: 8px 0; border-bottom: 1px solid var(--rule); cursor: pointer; }
.cmt-sheet .item .q { color: var(--ink-muted); font-style: italic; }
.cmt-sheet .flag { color: var(--accent); font-size: 14px; margin-left: 6px; }
.cmt-sheet h3 { margin: 4px 0 8px; font-size: 17px; }
.cmt-sheet button:disabled { opacity: .6; }
.cmt-toast { position: fixed; left: 12px; right: 12px; top: calc(12px + env(safe-area-inset-top)); z-index: 80; padding: 10px 14px; border-radius: 8px; background: var(--ink); color: var(--paper); font-size: 15px; text-align: center; opacity: 0; pointer-events: none; transition: opacity .2s; }
.cmt-toast.show { opacity: 1; }
.cmt-toast.error { background: #9d2a39; color: #fff; }
`;

export const CLIENT_JS = `(function(){
var D = window.__DRAFT__;
var root = document.querySelector("article"); // the whole post, title and meta line included
if (!D || !root) return;
var API = "/__comments/" + D.slug;
var CTX = 32;
var comments = [];
var lastJson = "";
var lastSel = null, collapsedAt = 0, pickMode = false, sheet = null;

function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function clip(s, n) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }
function when(iso) { var d = new Date(iso); return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }); }

function offsetOf(node, off) { var r = document.createRange(); r.setStart(root, 0); r.setEnd(node, off); return r.toString().length; }
function anchorAt(full, start, quote) {
  var lead = quote.length - quote.replace(/^\\s+/, "").length;
  var q = quote.trim(); start += lead;
  return { quote: q, prefix: full.slice(Math.max(0, start - CTX), start), suffix: full.slice(start + q.length, start + q.length + CTX) };
}

// ---- feedback ----
// No alert()/confirm(): in-app browsers (WKWebView) may drop them silently.
var toastEl = null, toastTimer = 0;
function toast(text, isError) {
  if (!toastEl) { toastEl = el("div", "cmt-toast"); document.body.appendChild(toastEl); }
  toastEl.textContent = text;
  toastEl.className = "cmt-toast show" + (isError ? " error" : "");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { toastEl.className = "cmt-toast"; }, isError ? 8000 : 2500);
}
// Errors also go to the dev server's log, where Claude can read them.
function report(text) {
  send("/__client-log", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: D.slug, msg: text, ua: navigator.userAgent }) }, 3).catch(function () {});
}
function fail(e) { var t = "Couldn't save: " + (e && e.message || e); toast(t, true); report(t); }
window.addEventListener("error", function (e) { var t = "Page error: " + e.message + " (line " + e.lineno + ")"; toast(t, true); report(t); });
window.addEventListener("unhandledrejection", function (e) { var t = "Page error: " + (e.reason && e.reason.message || e.reason); toast(t, true); report(t); });

// ---- api ----
// fetch() that retries when the connection itself fails (a TypeError, not an
// HTTP error). Through Carcinos's SSH tunnel a kept-alive connection can be
// dead by the time a comment is typed, and WebKit retries GETs but not POSTs.
// Writes carry a request id (rid) so the server ignores a duplicate.
function send(url, opts, tries) {
  return fetch(url, opts).catch(function (e) {
    if (tries <= 0) throw new Error("connection failed (" + e.message + ")");
    return new Promise(function (ok) { setTimeout(ok, 400); }).then(function () { return send(url, opts, tries - 1); });
  });
}
function newRid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
function api(method, path, body) {
  if (method === "POST") { body = body || {}; body.rid = newRid(); }
  return send(API + path, { method: method, headers: { "content-type": "application/json" }, body: body ? JSON.stringify(body) : undefined }, 3)
    .then(function (r) {
      return r.text().then(function (t) {
        var j = {};
        try { j = JSON.parse(t); } catch (e) { if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 120)); }
        if (!r.ok) throw new Error(j.error || "HTTP " + r.status);
        return j;
      });
    });
}
// Disable a button while its request runs, so a double tap can't post twice.
function busy(b, label, p) {
  var old = b.textContent; b.disabled = true; b.textContent = label;
  return p.then(function (v) { b.disabled = false; b.textContent = old; return v; }, function (e) { b.disabled = false; b.textContent = old; throw e; });
}
function refresh(force) {
  return api("GET", "").then(function (j) {
    var s = JSON.stringify(j.comments);
    if (!force && s === lastJson) return;
    var sel = window.getSelection();
    if (!force && sel && !sel.isCollapsed && root.contains(sel.anchorNode)) return; // don't break a selection in progress
    lastJson = s; comments = j.comments; draw();
  }).catch(function (e) { if (force) fail(e); });
}

// ---- anchoring ----
function locate(c, full) {
  var first = full.indexOf(c.quote), i = first;
  while (i !== -1) {
    if (full.slice(Math.max(0, i - c.prefix.length), i) === c.prefix && full.slice(i + c.quote.length, i + c.quote.length + c.suffix.length) === c.suffix) return i;
    i = full.indexOf(c.quote, i + 1);
  }
  return first;
}
function wrap(start, end, c) {
  var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), node, pos = 0, hits = [];
  while ((node = walker.nextNode())) {
    var len = node.data.length, a = Math.max(start, pos), b = Math.min(end, pos + len);
    if (a < b) hits.push([node, a - pos, b - pos]);
    pos += len; if (pos >= end) break;
  }
  hits.forEach(function (h) {
    var n = h[0];
    if (!n.data.slice(h[1], h[2]).trim()) return;
    if (h[2] < n.data.length) n.splitText(h[2]);
    if (h[1] > 0) n = n.splitText(h[1]);
    var m = el("mark", "cmt" + (c.status === "resolved" ? " resolved" : ""));
    m.dataset.id = c.id;
    n.parentNode.insertBefore(m, n); m.appendChild(n);
  });
}
function draw() {
  root.querySelectorAll("mark.cmt").forEach(function (m) { var p = m.parentNode; while (m.firstChild) p.insertBefore(m.firstChild, m); p.removeChild(m); });
  root.normalize();
  var full = root.textContent;
  comments.forEach(function (c) {
    var at = locate(c, full);
    c._orphan = at === -1;
    if (at !== -1) wrap(at, at + c.quote.length, c);
  });
  var open = comments.filter(function (c) { return c.status === "open"; }).length;
  listBtn.textContent = open + " open" + (comments.length > open ? " · " + (comments.length - open) + " done" : "");
  if (sheet && sheet.dataset.kind === "thread") showThread(sheet.dataset.id);
  else if (sheet && sheet.dataset.kind === "list") showList();
}

// ---- selection capture ----
document.addEventListener("selectionchange", function () {
  var s = window.getSelection();
  if (!s || s.isCollapsed || !s.rangeCount) { if (lastSel) collapsedAt = Date.now(); syncBtn(); return; }
  var r = s.getRangeAt(0);
  if (!root.contains(r.commonAncestorContainer)) return;
  var q = r.toString();
  if (!q.trim()) return;
  lastSel = anchorAt(root.textContent, offsetOf(r.startContainer, r.startOffset), q);
  collapsedAt = 0; syncBtn();
});
function liveSel() { return lastSel && (!collapsedAt || Date.now() - collapsedAt < 1500) ? lastSel : null; }

// ---- ui ----
var bar = el("div", "cmt-bar");
var listBtn = el("button", "", "0 open");
var addBtn = el("button", "primary", "Comment");
bar.appendChild(listBtn); bar.appendChild(addBtn);
document.body.appendChild(bar);
function syncBtn() { addBtn.textContent = liveSel() ? "Comment on selection" : "Comment"; }

// Keep the selection when the button is touched (iOS clears it on tap otherwise).
addBtn.addEventListener("mousedown", function (e) { e.preventDefault(); });
addBtn.addEventListener("click", function () {
  var s = liveSel();
  if (s) { lastSel = null; syncBtn(); compose(s); return; }
  startPick();
});
listBtn.addEventListener("click", function () { if (sheet && sheet.dataset.kind === "list") closeSheet(); else showList(); });

var banner = null;
function startPick() {
  pickMode = true; document.body.classList.add("cmt-pick");
  banner = el("div", "cmt-banner", "Tap the paragraph to comment on (tap here to cancel)");
  banner.addEventListener("click", stopPick);
  document.body.appendChild(banner);
}
function stopPick() { pickMode = false; document.body.classList.remove("cmt-pick"); if (banner) banner.remove(); banner = null; }

root.addEventListener("click", function (e) {
  if (pickMode) {
    var block = e.target.closest("p, li, blockquote, h2, h3, h4, figcaption, td, pre");
    if (!block || !root.contains(block)) { toast("Tap a paragraph of the post (or the banner to cancel)"); return; }
    e.preventDefault(); e.stopPropagation(); stopPick();
    compose(anchorAt(root.textContent, offsetOf(block, 0), block.textContent));
    return;
  }
  var m = e.target.closest("mark.cmt");
  if (m && !(window.getSelection() && !window.getSelection().isCollapsed)) { e.preventDefault(); showThread(m.dataset.id); }
}, true);

function openSheet(kind, id) {
  closeSheet();
  sheet = el("div", "cmt-sheet"); sheet.dataset.kind = kind; if (id) sheet.dataset.id = id;
  var inner = el("div", "inner"); sheet.appendChild(inner);
  document.body.appendChild(sheet);
  return inner;
}
function closeSheet() { if (sheet) sheet.remove(); sheet = null; }
function button(label, cls, fn) { var b = el("button", cls, label); b.type = "button"; b.addEventListener("click", fn); return b; }

function compose(anchor) {
  var inner = openSheet("compose");
  inner.appendChild(el("blockquote", "", clip(anchor.quote, 280)));
  var ta = el("textarea"); ta.placeholder = "What should change?";
  inner.appendChild(ta);
  var row = el("div", "row");
  row.appendChild(button("Save", "primary", function (e) {
    if (!ta.value.trim()) { toast("Write the comment first"); ta.focus(); return; }
    busy(e.currentTarget, "Saving…", api("POST", "", { quote: anchor.quote, prefix: anchor.prefix, suffix: anchor.suffix, text: ta.value }))
      .then(function () { closeSheet(); window.getSelection().removeAllRanges(); toast("Saved"); return refresh(true); }).catch(fail);
  }));
  row.appendChild(button("Cancel", "", closeSheet));
  inner.appendChild(row);
  ta.focus();
}

function msg(author, text, created) {
  var p = el("p", "msg");
  p.appendChild(el("span", "who", author + " · " + when(created)));
  p.appendChild(document.createElement("br"));
  text.split("\\n").forEach(function (line, i) { if (i) p.appendChild(document.createElement("br")); p.appendChild(document.createTextNode(line)); });
  return p;
}

function showThread(id) {
  var c = comments.filter(function (x) { return x.id === id; })[0];
  if (!c) { closeSheet(); return; }
  var draft = sheet && sheet.dataset.kind === "thread" && sheet.dataset.id === id ? sheet.querySelector("textarea").value : "";
  var inner = openSheet("thread", id);
  var h = el("h3", "", (c.status === "resolved" ? "Resolved" : "Open") + " · " + c.id);
  if (c._orphan) h.appendChild(el("span", "flag", "text no longer found"));
  inner.appendChild(h);
  inner.appendChild(el("blockquote", "", clip(c.quote, 280)));
  inner.appendChild(msg(c.author, c.text, c.created));
  c.replies.forEach(function (r) { inner.appendChild(msg(r.author, r.text, r.created)); });
  var ta = el("textarea"); ta.placeholder = "Reply…"; ta.value = draft;
  inner.appendChild(ta);
  var row = el("div", "row");
  row.appendChild(button("Reply", "primary", function (e) {
    if (!ta.value.trim()) { toast("Write the reply first"); ta.focus(); return; }
    busy(e.currentTarget, "Sending…", api("POST", "/" + id + "/reply", { text: ta.value }))
      .then(function () { ta.value = ""; toast("Sent"); return refresh(true); }).catch(fail);
  }));
  var toggle = c.status === "open" ? "resolve" : "reopen";
  row.appendChild(button(c.status === "open" ? "Resolve" : "Reopen", "", function (e) {
    busy(e.currentTarget, "…", api("POST", "/" + id + "/" + toggle, { text: ta.value }))
      .then(function () { ta.value = ""; toast(toggle === "resolve" ? "Resolved" : "Reopened"); return refresh(true); }).catch(fail);
  }));
  // Two taps instead of confirm(), which in-app browsers may ignore.
  var armed = 0;
  row.appendChild(button("Delete", "", function (e) {
    var b = e.currentTarget;
    if (Date.now() - armed > 3000) { armed = Date.now(); b.textContent = "Tap again to delete"; setTimeout(function () { b.textContent = "Delete"; }, 3000); return; }
    busy(b, "Deleting…", api("POST", "/" + id + "/delete"))
      .then(function () { closeSheet(); toast("Deleted"); return refresh(true); }).catch(fail);
  }));
  row.appendChild(button("Close", "", closeSheet));
  inner.appendChild(row);
}

function showList() {
  var inner = openSheet("list");
  var open = comments.filter(function (c) { return c.status === "open"; });
  var done = comments.filter(function (c) { return c.status !== "open"; });
  inner.appendChild(el("h3", "", open.length ? "Open comments" : "No open comments"));
  function item(c) {
    var d = el("div", "item");
    d.appendChild(el("div", "q", "“" + clip(c.quote, 90) + "”"));
    var t = el("div", "", clip(c.text, 160));
    if (c.replies.length) t.appendChild(el("span", "flag", c.replies.length + (c.replies.length === 1 ? " reply" : " replies")));
    if (c._orphan) t.appendChild(el("span", "flag", "text no longer found"));
    d.appendChild(t);
    d.addEventListener("click", function () {
      var m = root.querySelector('mark.cmt[data-id="' + c.id + '"]');
      if (m) m.scrollIntoView({ block: "center" });
      showThread(c.id);
    });
    return d;
  }
  open.forEach(function (c) { inner.appendChild(item(c)); });
  if (done.length) { inner.appendChild(el("h3", "", "Resolved")); done.forEach(function (c) { inner.appendChild(item(c)); }); }
  var row = el("div", "row"); row.appendChild(button("Close", "", closeSheet)); inner.appendChild(row);
}

refresh(true);
setInterval(function () { if (document.visibilityState === "visible") refresh(false); }, 20000);
window.addEventListener("focus", function () { refresh(false); });
document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") refresh(false); });
})();`;
