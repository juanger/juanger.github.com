---
layout: post
title: "'Command done' notification with zsh and growl"
date: 2013-06-02 13:07
comments: true
categories: zsh oh-my-zsh
---

<img src="/images/2013-06-02_command-done-notification-with-zsh-and-growl/notification.png" alt="Growl notification shown when a command finishes" style="float: right; width: 400px; max-width: 50%; margin: 0 0 1em 1em;" />

The little banner in bottom of the screen in this image shows what I see when a command has finished (for peace of mind, only for the ones that have been running for at least 5 seconds).

Most of the time I find myself running commands that take 1-5 minutes to complete and you know, I am not going to just stare at the screen waiting for it to finish! Then my mind starts wandering in other things that may be productive but also take my focus out of the problem I'm solving at that moment.

You know what I'm talking about, you start looking at your emails, other tickets, problems in [SPOJ](https://www.spoj.com/), your score(and possibly taking revenge) at <a href="https://web.archive.org/web/20130602015440/http://fightcodegame.com/" title="Original: http://fightcodegame.com/">Fight Code</a><span class="archived">archived</span> or my favorite: <a href="https://web.archive.org/web/20130612191539/http://getprismatic.com:80/?" title="Original: http://getprismatic.com">Prismatic</a><span class="archived">archived</span> (no, no one looks at his facebook while working, right?).

So, tired of finding out that the command I ran <strike>one hour ago</strike> has now finished and realizing that I have no clue what I was doing when I pushed that to my personal To-Do stack (because lists are so [FIFO](https://en.wikipedia.org/wiki/FIFO), ugh!), I added [this little script](https://github.com/juanger/oh-my-zsh/blob/master/custom/notifications.zsh) to my zsh configuration.

And I can customize the style of the growl notification when it fails:

<img src="/images/2013-06-02_command-done-notification-with-zsh-and-growl/notification-fail.png" alt="Growl notification styled for a failed command" style="display: block; width: 500px; max-width: 100%; margin: 1em auto;" />

Ain't it cool?
