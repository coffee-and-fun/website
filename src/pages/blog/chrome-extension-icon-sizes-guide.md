---
new: true
submit: false
footer: true
header: true
layout: templates/post.liquid
title: Every Icon Size Your Chrome Extension Actually Needs (And What Each One Is For)
description:
  16, 32, 48, 128 — Chrome extension icon requirements look arbitrary until you know where each
  size shows up. A practical guide to manifest icons, action icons, store requirements, and the
  one-source-file workflow that generates them all.
keywords:
  chrome extension icon sizes, manifest v3 icons, chrome extension icons, 128x128 chrome web store,
  extension icon generator, browser extension development, action icon, chrome web store listing,
  Coffee and Fun
url: blog/chrome-extension-icon-sizes-guide/
isBlog: true
blog_cat: Development
youtubeId:
cardTitle: Every Icon Size Your Chrome Extension Actually Needs
blog_snip:
  Chrome extension icon requirements look arbitrary until you know where each size shows up.
  What 16, 32, 48, and 128 are each for — and the one-source workflow that makes them all.
name: Robert James Gabriel
img: /assets/images/blog/chrome-extension-icon-sizes-guide.png
date: 2026-07-06T00:00:00.000Z
time: 5 min
tags:
  - chrome-extension
  - development
  - icons
  - tools
  - guide
---

We've shipped a lot of browser extensions over the years — [Hide Spoilers](https://chromewebstore.google.com/detail/hide-spoilers-block-blur/dglgbepdhdpfihbiklibdcecpadcdcln), Markdown Editor, and plenty more. And every single time, the same speed bump appears right before submission: *icons*. Chrome wants a pile of sizes, the docs scatter the requirements across three pages, and the store rejects things it doesn't like with minimal explanation.

Here's the complete picture in one place — what each size is actually *for* — plus the workflow we use so icons take ninety seconds instead of an hour.

## The core four: 16, 32, 48, 128

These go in your `manifest.json` under the `icons` key, and each one has a specific job:

- **16 × 16** — the favicon-scale icon. Shows on the extension's pages and in some context menus.
- **32 × 32** — used by Windows machines and higher-DPI situations where 16 looks like gravel.
- **48 × 48** — the `chrome://extensions` management page. This is what users see when deciding whether to remove you.
- **128 × 128** — installation and the Chrome Web Store. The store listing genuinely requires this one.

```json
"icons": {
  "16": "icons/16.png",
  "32": "icons/32.png",
  "48": "icons/48.png",
  "128": "icons/128.png"
}
```

Technically Chrome will limp along with only 128 and scale down. Don't — downscaling at render time is how crisp logos become fuzzy thumbnails on the exact page where users decide to uninstall you.

## The toolbar has its own set

The icon in the browser toolbar comes from the `action` key (Manifest V3), and it wants its own sizes:

```json
"action": {
  "default_icon": { "16": "icons/16.png", "24": "icons/24.png", "32": "icons/32.png" }
}
```

Toolbar icons render at 16 CSS pixels, so 16/24/32 covers standard and high-density displays. You'll also still see **19 × 19 and 38 × 38** in older guides — those are the legacy Manifest V2 `browser_action` sizes. Harmless to include, and if you're maintaining an older extension you may still need them.

One design note that outranks any size chart: toolbar icons live next to monochrome browser chrome and get *very* small. If your logo has fine detail, make a simplified flat version for 16–32px and save the detailed art for 128. Test against both light and dark toolbar themes — the store won't catch a black logo on a black toolbar, but your reviews will.

## What the store itself wants

The Chrome Web Store listing needs the **128 × 128** icon (with about 16px of transparent padding around the actual artwork — actual mark around 96 × 96 — or it looks oversized next to every other extension), plus promotional images: a **440 × 280** small promo tile and screenshots at **1280 × 800** or 640 × 400. Icons must be PNG. Also make your icon padding *transparent*, not white — the store background isn't white everywhere, and light-mode-only icons look broken in dark mode.

Porting anywhere else? Edge Add-ons and Firefox AMO happily accept the same 16/32/48/128 set. A **512 × 512** master export covers you for stores and press kits that want something bigger.

## The one-source-file workflow

Keep exactly one master icon — **1024 × 1024 PNG**, artwork centered with breathing room — and generate everything from it, every time it changes. Never hand-edit an individual size; that's how you end up shipping an old logo at 48px and a new one at 128px (we've seen it in the wild, and yes, it looks exactly as strange as it sounds).

The generating part is why our [Chrome Extension Icon Resizer](/chrome-extension-icon-generator/) exists. Drop in your 1024 master and it produces every size above — the manifest core four, the toolbar sizes, the legacy 19/38, up to 512 — with high-quality scaling, individually downloadable or as one zip, plus a ready-to-paste manifest snippet. It runs entirely in your browser, so your unreleased logo never touches a server.

Ninety seconds, every size, no Photoshop batch scripts. Save the remaining fifty-eight minutes for the actual extension.
