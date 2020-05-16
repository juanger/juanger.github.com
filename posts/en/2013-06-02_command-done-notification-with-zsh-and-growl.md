---
layout: post
title: "'Command done' notification with zsh and growl"
date: 2013-06-02 13:07
comments: true
categories: zsh oh-my-zsh
---

{% img right /images/notification.png 400 350 'image' 'images' %}

The little banner in bottom of the screen in this image shows what I see when a command has finished (for peace of mind, only for the ones that have been running for at least 5 seconds).

Most of the time I find myself running commands that take 1-5 minutes to complete and you know, I am not going to just stare at the screen waiting for it to finish! Then my mind starts wandering in other things that may be productive but also take my focus out of the problem I'm solving at that moment.

You know what I'm talking about, you start looking at your emails, other tickets, problems in [SPOJ](http://www.spoj.com/), your score(and possibly taking revenge) at [Fight Code](http://fightcodegame.com/) or my favorite: [Prismatic](http://getprismatic.com) (no, no one looks at his facebook while working, right?).

So, tired of finding out that the command I ran <strike>one hour ago</strike> has now finished and realizing that I have no clue what I was doing when I pushed that to my personal To-Do stack (because lists are so [FIFO](http://en.wikipedia.org/wiki/FIFO), ugh!), I added [this little script](https://github.com/juanger/oh-my-zsh/blob/master/custom/notifications.zsh) to my zsh configuration.

And I can customize the style of the growl notification when it fails:

{% img center /images/notification-fail.png 500 350 'image' 'images' %}

Ain't it cool?
