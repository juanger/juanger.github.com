---
layout: post
title: "RTranscoder: jpeg to mpeg"
date: 2008-05-15
comments: false
status: obsolete
reviewed: "2026-10"
status_note: >
  RubyForge closed in 2014, and ffmpeg won over MEncoder a long time ago. Today
  I'd skip the Ruby wrapper and call ffmpeg directly, see the end of the post.
categories:
  - ruby
  - code
---

Some days ago I made some tests using mencoder to create a mpeg4 video with some jpeg images.

Then I tried to use RTranscoder to achieve the same result with ruby but it's kind of tricky to get it running correctly, because you can get an "error parsing command line" error if you don't give RTranscoder the correct information.

After a lot of attempts, my code got like this:

```ruby
 MEncoder.encode do |mencoder|
   mencoder.input = "mf://*.jpg"
   mencoder.mf.fps = 25
   mencoder.mf.type = "jpg"
   mencoder.output_video_codec = :lavc
   mencoder.lavc.vcodec = "mpeg4"
   mencoder.lavc.mbd = 2
   mencoder.lavc.trell = true
   mencoder.output_audio_codec = 'copy'

   mencoder.output = 'output.avi'
 end
```

As you can see, instead of doing something like `mencoder.mf = "fps=25:type=jpg"` (my error) you have to do it with `mencoder.mf.fps` and `mencoder.mf.type` respectively, the same with lavc and every time you need to pass an argument with suboptions separated by ":".

Here is the page of <a href="https://web.archive.org/web/20090101041307/http://rtranscoder.rubyforge.org:80/" title="Original: http://rtranscoder.rubyforge.org/">RTranscoder</a><span class="archived">archived</span>.

:::today

One line of ffmpeg does what the whole Ruby block does. The `-pix_fmt yuv420p` part is what makes the video play in QuickTime and browsers.

```sh
ffmpeg -framerate 25 -pattern_type glob -i '*.jpg' -c:v libx264 -pix_fmt yuv420p out.mp4
```

:::
