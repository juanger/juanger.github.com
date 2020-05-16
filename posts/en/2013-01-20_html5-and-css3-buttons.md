---
layout: post
title: "CSS3 styled buttons with compass"
date: 2012-06-20 11:42
comments: true
categories: html5 sass compass css3
colors: ["grey", "black", "blue"]
---

<link rel="stylesheet" type="text/css" href="/stylesheets/css_buttons.css">

**These input tags were styled entirely with css.**

<label class="text">
  <span>Text Field:</span><input type="text" class="btn-grey" value="Edit me"/>
</label>
<input type="submit" class="btn-grey" value="Button"/>
<input type="submit" class="btn-grey" value="Button" disabled="disabled"/>
<label class="checkbox">
  <input type="checkbox" class="btn-grey" checked/><span>Checkbox</span>
</label>
<label class="radio">
  <input type="radio" name="radio" value="radio_1" class="btn-grey" checked/><span>Option 1</span>
</label>
<label class="radio">
  <input type="radio" name="radio" value="radio_2" class="btn-grey"/><span>Option 2</span>
</label>
<label class="select">
  <span>Select:</span>
  <select class="btn-grey">
  <option value="volvo">Option 1</option>
  <option value="saab">Option 2</option>
  <option value="mercedes">Option 3</option>
  <option value="audi">Option 4</option>
  </select>
</label>

## Why?

Just because. Consider this piece of code as leisure programming.

## What is the problem with images?

Well, metainformation can be tracked in a very efficient way with a version control system, it can be generated programatically, your html code is cleaner and you don't have to send another asset to your clients.

CSS can be generated with compass making the source code much more manageable and you can even create animations and effects that were once only doable with Flash.

## Code

The code may look huge because I had to do some tricks to get it working, like hiding the browser's original input images and replacing them with pseudo-elements and styling them to make them look like checkboxes and radio buttons. The select tag cannot be styled very well just with css because of how the browser displays it and because if you try to hide the original, then you can't see the selected option.

The interesting part of the code is when I create the before and after pseudo-elements and style them to create the buttons. If you use the code remember to follow the structure of the html (input next to span, both inside the label).

If you want to add more themes, you can do so by creating a new button style with the mixin and change each input type style as you need like this ones:

{% for color in page.colors %}
<label class="text">
<span>Text Field:</span><input type="text" class="btn-{{ color }}" value="Edit me"/>
</label>
<input type="submit" class="btn-{{ color }}" value="Button"/>
<input type="submit" class="btn-{{ color }}" value="Button" disabled="disabled"/>
<label class="checkbox">
<input type="checkbox" class="btn-{{ color }}" checked/><span>Checkbox</span>
</label>
<label class="radio">
<input type="radio" name="radio-{{ color }}" value="radio_1" class="btn-{{ color }}" checked/><span>Option 1</span>
</label>
<label class="radio">
<input type="radio" name="radio-{{ color }}" value="radio_2" class="btn-{{ color }}"/><span>Option 2</span>
</label>
<label class="select">
<span>Select:</span>
<select class="btn-{{ color }}">

  <option value="volvo">Option 1</option>
  <option value="saab">Option 2</option>
  <option value="mercedes">Option 3</option>
  <option value="audi">Option 4</option>
  </select>
</label>
{% endfor %}

{% gist 4582253 %}
