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

<div>
<label class="text">
<span>Text Field:</span><input type="text" class="btn-grey" value="Edit me"/>
</label>
<input type="submit" class="btn-grey" value="Button"/>
<input type="submit" class="btn-grey" value="Button" disabled="disabled"/>
<label class="checkbox">
<input type="checkbox" class="btn-grey" checked/><span>Checkbox</span>
</label>
<label class="radio">
<input type="radio" name="radio-grey" value="radio_1" class="btn-grey" checked/><span>Option 1</span>
</label>
<label class="radio">
<input type="radio" name="radio-grey" value="radio_2" class="btn-grey"/><span>Option 2</span>
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
</div>

<div>
<label class="text">
<span>Text Field:</span><input type="text" class="btn-black" value="Edit me"/>
</label>
<input type="submit" class="btn-black" value="Button"/>
<input type="submit" class="btn-black" value="Button" disabled="disabled"/>
<label class="checkbox">
<input type="checkbox" class="btn-black" checked/><span>Checkbox</span>
</label>
<label class="radio">
<input type="radio" name="radio-black" value="radio_1" class="btn-black" checked/><span>Option 1</span>
</label>
<label class="radio">
<input type="radio" name="radio-black" value="radio_2" class="btn-black"/><span>Option 2</span>
</label>
<label class="select">
<span>Select:</span>
<select class="btn-black">
  <option value="volvo">Option 1</option>
  <option value="saab">Option 2</option>
  <option value="mercedes">Option 3</option>
  <option value="audi">Option 4</option>
</select>
</label>
</div>

<div>
<label class="text">
<span>Text Field:</span><input type="text" class="btn-blue" value="Edit me"/>
</label>
<input type="submit" class="btn-blue" value="Button"/>
<input type="submit" class="btn-blue" value="Button" disabled="disabled"/>
<label class="checkbox">
<input type="checkbox" class="btn-blue" checked/><span>Checkbox</span>
</label>
<label class="radio">
<input type="radio" name="radio-blue" value="radio_1" class="btn-blue" checked/><span>Option 1</span>
</label>
<label class="radio">
<input type="radio" name="radio-blue" value="radio_2" class="btn-blue"/><span>Option 2</span>
</label>
<label class="select">
<span>Select:</span>
<select class="btn-blue">
  <option value="volvo">Option 1</option>
  <option value="saab">Option 2</option>
  <option value="mercedes">Option 3</option>
  <option value="audi">Option 4</option>
</select>
</label>
</div>

The full source is also in [this gist](https://gist.github.com/juanger/4582253).

### button.scss

```scss
@mixin button($bg-image,
              $color,
              $border-color,
              $bg-hover: linear-gradient(#e8e8e8, #d1cfcf),
              $color-hover: #555454,
              $border-color-hover: #bebdbd,
              $bg-disabled: linear-gradient(#CACACA, #ABABAB),
              $color-disabled: #EEE,
              $border-color-disabled: #bebdbd,
              $border-radius: 5px) {

    @include border-radius($border-radius);
    @include background-image($bg-image);
    @include single-box-shadow(#555, 0px, 1px, 2px);
    color: $color;
    border: 1px solid $border-color;

    &:hover {
        @include background-image($bg-hover);
        cursor: pointer;
        border: 1px solid $border-color-hover;
    }

    &[disabled="disabled"] {
        color: $color-disabled;
        cursor: default;
        @include background-image($bg-disabled);
        border: 1px solid $border-color-disabled;
        &:hover {
            @include background-image($bg-disabled);
            border: 1px solid $border-color-disabled;
        }
    }
}
```

### buttons.css.scss

```scss
.btn-grey {
    @include button(linear-gradient(#F7F7F7, #DFDFDF), #555454, #bebdbd);
}

label {
    position: relative;
    
    span {
      position: relative;
      height: 16px;
      display: inline-block;
      margin: 2px;
      @include user-select(none);
    }
}

input {
    &[type="submit"] {
        padding: 4px 10px;
        @include border-radius(5px);
    }

    &[type="text"] {
        padding: 9px;
        @include border-radius(5px);
        @include single-box-shadow(none);
        border: 1px solid #CDCDCD;
    }

    &[type="checkbox"] {
        @include opacity(0);
        position: static\9; // fallback for IE < 9

        & + span::before {
            @include border-radius(2px);
            content: "";
            display: inline-block;
            width: 15px;
            height: 16px;
            margin-right: 5px;
            margin-top: -4px;
            vertical-align: middle;
        }

        &.btn-grey + span::before {
            @extend .btn-grey;
            @include border-radius(2px);
        }

        &:checked + span::after {
            content: "\2713\0020";
            font-size: 1em;
            position: absolute;
            top: 1px;
            left: 2px;
            color: #888;
        }
    }

    &[type="radio"] {
        @extend input[type="checkbox"];

        & + span::before {
            @include border-radius(8px);
            width: 16px;
        }

        &.btn-grey + span::before {
            @include border-radius(8px);
        }

        &:checked + span::after {
            position: absolute;
            content: "";
            top: 11px;
            left: 6px;
            width: 4px;
            height: 4px;
            border: 1px solid #888;
            @include border-radius(6px);
            background-color: #888;
        }
    }
}

select {
  @include user-select(none);
  @include border-radius(5px);
  padding: 9px;
  @include single-box-shadow(none);
  border: 1px solid #CDCDCD;

  -webkit-appearance: button;
  -moz-appearance: button;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

### buttons.html

```html
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
  <option value="one">Option 1</option>
  <option value="two">Option 2</option>
  <option value="three">Option 3</option>
  <option value="four">Option 4</option>
  </select>
</label>
```
