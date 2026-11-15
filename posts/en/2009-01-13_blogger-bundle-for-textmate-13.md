---
layout: post
title: "Blogger Bundle for TextMate"
date: 2009-01-13
comments: false
status: obsolete
reviewed: 2026-10
status_note: >
  This bundle doesn't work anymore. Google turned off the GData API and
  ClientLogin years ago, and Blogger's v3 API needs OAuth 2.0. The repo stays on
  GitHub as a museum piece.
categories:
  - TextMate
  - blogger.tmbundle
aliases:
  - /blog/2009/01/blogger-bundle-for-textmate_13/
  - /2009/01/blogger-bundle-for-textmate_13.html
---

<p>Yes, that’s right, I’ve been working in getting TextMate to love Blogger. Some time ago I realized that the Blogger <span class='caps'>API</span> is no longer compatible with the TextMate’s blogging bundle and I really wanted it to work.</p>
<p>It’s still in a very incomplete state, but at least I can post to my blog from my favourite text editing program, preview my post and add categories to it.</p>
<p>Now I can have a “blogged from TextMate” badge in blogger!!<label for="e26-badge" class="margin-toggle">⊕</label><input type="checkbox" id="e26-badge" class="margin-toggle"/><span class="marginnote errata"><span class="errata-year">2026</span>This blog left Blogger for Octopress and is now plain markdown files built by a small Bun generator, so no badge anymore.</span></p>
<p>You can download the bundle from github: <a href='https://github.com/juanger/blogger.tmbundle'>blogger.tmbundle</a>.</p>
<p>The extended post also works (if you have the hack for it):</p>

<h3>Setup</h3>
<ul>
	<li>Make sure you have the GData, hpricot and RedCloth gems<label for="e26-gems" class="margin-toggle errata-number"></label><input type="checkbox" id="e26-gems" class="margin-toggle"/><span class="sidenote errata"><span class="errata-year">2026</span>Of the three, only RedCloth is still on RubyGems in working shape. Hpricot gave way to Nokogiri, and the GData gem went away with the API.</span></li>
	<li>You must set the GDATA_USER variable in TextMate:Preferences:Advanced:Shell Variables</li>
	<li>Open a Post file from Blogger template</li>
	<li>Use the publish command, select your blog and type any categories you want in the "Categories "token field.</li>
</ul>

<p>The template is identical to the ones in the blogging bundle. All you have to do is write the title, the contents and call the Publish command, your password can be saved in the keychain<label for="e26-clientlogin" class="margin-toggle errata-number"></label><input type="checkbox" id="e26-clientlogin" class="margin-toggle"/><span class="sidenote errata"><span class="errata-year">2026</span>That was ClientLogin, which sent your actual Google password around. Google shut it down in 2015 (nobody should miss it).</span> and you’ll be able to see your post after publish it.</p>

<p>I’m waiting for comments, suggestions, errors you encounter and why not, collaboration :)</p>

<p>Happy blogging and new year.</p>
