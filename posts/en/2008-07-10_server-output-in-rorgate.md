---
layout: post
title: "Server Output in RoRGate"
date: 2008-07-10
comments: false
status: historical
reviewed: 2026-10
categories:
  - RoRGate
  - laptop $
  - RubyCocoa
---

I've added a developer menu to the resulting apps in RoRGate, if you download the 0.3 beta version you will see the change:

<a href="https://github.com/juanger/rorgate/raw/master/meta/images/RoRGate-0.3b.png"><img src="https://raw.githubusercontent.com/juanger/rorgate/master/meta/images/RoRGate-0.3b.png" alt="RoRGate 0.3 beta developer menu" width="400" /></a>
With that, you as developer can use it to see your app in action, see the server output and edit it in TextMate.

The only thing is that the server output works strange with 2.x rails apps, I don't know why, but only the error output is displayed in such rails apps.[^2026-buffer] I use the NSTask class with an NSPipe for both the standard output and error but with rails 2.x it behaves strangely.

[^2026-buffer]: My best guess now is buffering. When stdout is a pipe instead of a terminal, Ruby holds the output in a buffer, while stderr goes out right away, so only errors showed up. `$stdout.sync = true` in the app would probably have fixed it.

<a href="https://raw.githubusercontent.com/juanger/rorgate/master/meta/images/ServerOut.png"><img src="https://raw.githubusercontent.com/juanger/rorgate/master/meta/images/ServerOut.png" alt="RoRGate server output" width="400" /></a>
Also I've embedded RubyCocoa, but I can't make it work in both Leopard and Tiger because of libffi.dylib. Leopard's RubyCocoa has it installed in /usr/lib and I don't know where it is in Tiger. Maybe the solution is to create a Tiger version and a Leopard version, but I'm very lazy and I'd rather have only one.

Lastly, I need a new laptop (many of my friends will agree) and because of that, I've added a donations pledgie badge for RoRGate and some ads here in my blog. I'm a student and I own an iBook G3 which has been giving me a lot of trouble lately, so as I'm most of the time at school (school's computers ain't good either) deploying to or developing for a lot of platforms I need a new one, one in which running a single unit test doesn't seem to last forever and I hope some of you (friends or not) could help me. My-new-laptop blogthon :) has begun.
