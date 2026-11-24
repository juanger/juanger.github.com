---
layout: post
title: "TextMate, SSH and github"
date: 2008-05-20
comments: false
status: obsolete
reviewed: "2026-10"
status_note: >
  The SSHKeychain link went bad, so it now points to an archived copy. You don't
  need the app anymore: macOS keeps SSH keys in the Keychain by itself, and
  GitHub stopped accepting passwords for git in 2021.
categories:
  - SSH
  - TextMate
  - Mac OS X
---

<a href="https://macromates.com/">TextMate</a> is a flexible Mac OS X text editor,[^2026m-tm] it has everything I need, but some days ago I found that it can't prompt me for my password when needed (like when I want to push my changes to github) and that's not cool.

[^2026m-tm]: TextMate 2 went open source in 2012.

Fortunately, github uses ssh keys[^2026-ssh] and with <a href="https://web.archive.org/web/20080512090802/http://www.sshkeychain.org/" title="Original: http://www.sshkeychain.org/">SSHKeychain</a><span class="archived">archived</span>[^2026!-spam] installed you can forget about passwords and it helps TextMate to pull and push to github (or any other server) without pubkey authentication errors. Now that's cool.

[^2026-ssh]: Still true, and now it's SSH or a token, nothing else. GitHub dropped password auth for git in August 2021, stopped accepting RSA signatures made with SHA-1 in 2022 and rotated its RSA host key in March 2023 (if ssh suddenly complains about a changed host key, that's why).

[^2026!-spam]: The old sshkeychain.org domain now redirects to a hotel spam site, so this link goes to the 2008 snapshot on the Wayback Machine instead.

:::today

Create a modern key and let macOS store the passphrase in the Keychain:

```sh
ssh-keygen -t ed25519 -C "you@example.com"
ssh-add --apple-use-keychain ~/.ssh/id_ed25519
```

Then in `~/.ssh/config`:

```
Host github.com
  AddKeysToAgent yes
  UseKeychain yes
  IdentityFile ~/.ssh/id_ed25519
```

:::
