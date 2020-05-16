---
layout: post
title: "Lucecita: RubyCocoa example"
date: 2008-07-25
comments: false
categories:
  - ruby
  - Lucecita
  - code
  - RubyCocoa
---

<p><span style="font-weight:bold;">UPDATE:</span> Version 2.0 of Lucecita is out. <a href="http://blog.juanger.com/2008/10/lucecita-20.html">Lucecita 2.0</a></p>

<p>There are some applications like Mouseposé, OmniDazzle or RemoteBuddy that allow you to have a rally nice light effect with your mouse. But as I have stated before, I am a poor student :) and since  I am saving money to buy a new laptop(by the way, please support me with the ads and with donations!!) I have written a little app called "Lucecita". For the impatient: <a href="http://juanger.googlepages.com/Lucecita.zip">Lucecita.app</a>.</p>

<p>
  <img style="display:block; margin:0px auto 10px; text-align:center;cursor:pointer; cursor:hand;" src="http://bp1.blogger.com/\_WeoTLD0cYR0/SIqywKYJFoI/AAAAAAAAAB0/SIHWBCG1acA/s400/LucecitaInAction.png" border="0" alt="" id="BLOGGER_PHOTO_ID_5227186858005960322" />
</p>

<h3>DarkWindow.rb</h3>

```ruby
require 'osx/cocoa'
include OSX

class DarkWindow < NSWindow

  def initWithContentRect_styleMask_backing_defer(contentRect, aStyle, bufferingType, flag)
    result = super_initWithContentRect_styleMask_backing_defer(NSScreen.mainScreen.frame,
                  NSBorderlessWindowMask,
                  bufferingType,
                  flag)
    if result
      result.setBackgroundColor(NSColor.clearColor)
      result.setOpaque(false)
      result.setIgnoresMouseEvents(true)
      result.setLevel(NSScreenSaverWindowLevel)
      result.setCollectionBehavior(NSWindowCollectionBehaviorCanJoinAllSpaces)
    end

    result
  end

end
```

<h3>LightView.rb</h3>

```ruby
require 'osx/cocoa'
include OSX

class LuzView <  OSX::NSView

  attr_accessor :center, :rect, :radius, :transparency, :enabled

  def initialize
    @radius = 50
    @transparency = 0.5
    @enabled = false
  end

  def initWithFrame(frame)
    self.setNeedsDisplay true
    return self
  end

  def drawRect(rect)
    if @enabled
    NSGraphicsContext.currentContext.setCompositingOperation NSCompositeSourceOut
    context = NSGraphicsContext.currentContext.graphicsPort
    @center = NSEvent.mouseLocation
    CGContextSetRGBFillColor(context, 0.0, 0.0, 0.0, @transparency)
    CGContextFillRect(context, rect)

    drawLight
    end
  end

  def drawLight
    context = NSGraphicsContext.currentContext.graphicsPort
    NSColor.colorWithCalibratedRed_green_blue_alpha(1.0,1.0,1.0,0.0).set

    CGContextSetGrayStrokeColor(context, 0, 1)
    CGContextSetLineWidth(context, 0)

    @rect = NSRect.new(@center.x - @radius, @center.y - @radius, @radius*2, @radius*2)
    CGContextAddEllipseInRect(context, @rect)
    CGContextDrawPath(context, KCGPathFill)
  end

end
```

<h3>LightController.rb</h3>

```ruby
require 'osx/cocoa'

class LuzController < OSX::NSObject

  ib_outlets :luz_view
  ib_outlets :menu, :size, :size_lbl, :alpha, :alpha_lbl, :enabled

  def awakeFromNib
    activateStatusMenu()
    @callback = lambda { |p,t,e,r|
      if (t == KCGEventOtherMouseDown &&
        CGEventGetFlags(e) & KCGEventFlagMaskControl == KCGEventFlagMaskControl)
        toggle(self)
        return
      end
      if @luz_view.enabled
        @luz_view.center = CGEventGetLocation(e)
        @luz_view.setNeedsDisplayInRect NSInsetRect(@luz_view.rect, -30, -30)
      end
      e
    }
    start_tapping()
  end

  ib_action :change_alpha do |sender|
    @luz_view.transparency = @alpha.floatValue
    @alpha_lbl.setStringValue "#{(@alpha.floatValue*100).to_i}%"
    @luz_view.setNeedsDisplay true
  end

  ib_action :change_size do |sender|
    @luz_view.radius = @size.floatValue
    @size_lbl.setStringValue "#{(@size.intValue)}px"
    @luz_view.setNeedsDisplay true
  end

  ib_action :toggle do |sender|
    @luz_view.enabled = !@luz_view.enabled
    @enabled.setState(@luz_view.enabled ? 1 : 0)
    @luz_view.setNeedsDisplay true
  end

  def activateStatusMenu()
      statusItem = NSStatusBar.systemStatusBar.statusItemWithLength(NSVariableStatusItemLength)
      statusItem.retain
      icon = NSImage.alloc.initWithContentsOfFile("#{NSBundle.mainBundle.resourcePath}/Lucecita.png")
      statusItem.setImage icon
      statusItem.setHighlightMode true
      statusItem.setMenu @menu
  end

  def start_tapping
    eventMask = 167772384 # Magic Number: LeftMouseDragged MouseMoved RightMouseDragged OtherMouseDragged OtherMouseDown
    eventTap = CGEventTapCreate(KCGSessionEventTap, KCGHeadInsertEventTap,
                                0, eventMask, @callback, nil)
    eventSrc = CFMachPortCreateRunLoopSource(nil, eventTap, 0)
    CFRelease(eventTap)
    CFRunLoopAddSource(CFRunLoopGetCurrent(),  eventSrc, KCFRunLoopCommonModes)
    CFRelease(eventSrc)
  end

  def applicationShouldTerminate
    CFRunLoopRemoveSource(CFRunLoopGetCurrent(), mEventSrc, KCFRunLoopCommonModes)
  end

end
```

<p>And the application is here: <a href="http://juanger.googlepages.com/Lucecita.zip">Lucecita.app</a></p>

<p>You can activate it with the menu or with ctrl-Button3Click or ctrl-Button4Click if you have a three button mouse or a Mighty Mouse.</p>

<p>I am preparing a screencast to show yo how I coded it but that will be later, until then you can see inside the app package and check  the ruby code.</p>
