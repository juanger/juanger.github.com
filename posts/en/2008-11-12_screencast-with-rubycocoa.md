---
layout: post
title: "Screencast with RubyCocoa"
date: 2008-11-12
comments: false
status: obsolete
reviewed: 2026-10
status_note: >
  The code below uses QTKit, which Apple deprecated in 2013 in favour of
  AVFoundation. It's here as a 2008 snapshot, and you can record your screen
  today without writing any code.
categories:
  - ruby
  - MacRuby
  - code
  - cocoa
  - screencast
  - RubyCocoa
---

I know I promised a screencast about Lucecita, but that will be in the Holydays,[^2026m-holydays] now I post a little code that captures the screen and creates a video.

[^2026m-holydays]: It wasn't.

The not so good thing is that the frame rate isn't controlled by my code and it is very slow, but maybe with MacRuby and some threads we could make that code very fast[^2026-screencapture] and even parallelize the capturing and the creation of the movie (the other option is to use Objective-C) but MacRuby is under development and it doesn't have all the things we need.

[^2026-screencapture]: MacRuby never got there. Today `screencapture -v out.mov` records the screen from the terminal, and ScreenCaptureKit (macOS 12.3 and later) is the API if you want to do it in code.

What do you think? Can we improve it with a ruby/cocoa hack?

Leave any idea or comment, the code is in the full post:[^2026m-fullpost]

[^2026m-fullpost]: And now it really is, see above.

```ruby
require 'osx/cocoa'
include OSX
require_framework 'QTKit'

class Screen
  def self.capture
    screenshot = OSX::CGWindowListCreateImage(OSX::NSScreen.mainScreen.frame, OSX::KCGWindowListOptionOnScreenOnly, OSX::KCGNullWindowID, OSX::KCGWindowImageDefault)
    screenshot.retain
  end
  
  def self.to_nsimage(cgimage)
    bitmapRep = NSBitmapImageRep.alloc.initWithCGImage(cgimage)
    blob = bitmapRep.representationUsingType_properties(NSJPEGFileType, nil)
    nsimage = NSImage.alloc.initWithData(blob)
    nsimage
  end
end

  error = nil
  mMovie = QTMovie.alloc.initToWritableData_error(NSMutableData.data, error)
  images = []
  
  80.times {
    images << Screen.capture
  }
    
  puts "Now encoding..."
  
  images.each do |img|
    mMovie.objc_send :addImage, Screen.to_nsimage(img),
                 :forDuration, QTMakeTime(1,20),
                 :withAttributes, {:QTAddImageCodecType => "mp4v"}
    img.release
  end
  
  mMovie.objc_send :writeToFile, "screencast.mov",
                  :withAttributes, {:QTMovieFlatten => true}
                  
  puts "Done!!"
```

<small>[Gist ↗](https://gist.github.com/juanger/489722)</small>[^2026r-gist]

[^2026r-gist]: Restored in 2026 from gist 489722, the embed stopped rendering when the blog moved.
