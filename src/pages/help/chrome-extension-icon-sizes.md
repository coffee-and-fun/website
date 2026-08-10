---
new: true
submit: false
layout: templates/help-doc.liquid
title: "Resize your Chrome extension icons"
description: "Upload one icon and get every size a Chrome, Edge or Firefox extension needs, download them as a zip, and copy the manifest snippet that references them."
keywords: chrome extension icon generator, chrome extension icon resizer, extension icon sizes, 128x128 icon, manifest icons, extension icon 16 48 128, Coffee and Fun
url: help/chrome-extension-icon-sizes/
isHelp: true
product: chrome-extension-icon-generator
app: Chrome Extension Icon Resizer
category: Getting started
img: /assets/images/social/help/chrome-extension-icon-sizes.png
date: 2026-08-10T12:00:00.000Z
updated: 2026-08-10T12:00:00.000Z
time: 3 min read
tags:
  - help
  - chrome-extension-icon-generator
---

## Step 1: Upload one icon

Open the [Chrome Extension Icon Resizer](/chrome-extension-icon-generator/) and drop in your source image.

**Start as large and as square as you can.** Every output is scaled down from what you provide, so a 1024x1024 source gives clean results at every size and a 128x128 source does not.

Everything runs in your browser. Nothing is uploaded.

## Step 2: Get every size

Nine sizes are generated: **16, 19, 32, 38, 48, 64, 128, 512, and 1024**.

That covers what the browsers and the stores ask for:

| Size | Used for |
|---|---|
| 16 | Favicon, context menus |
| 19, 38 | Legacy toolbar action icons |
| 32 | Windows, some toolbar contexts |
| 48 | Extensions management page |
| 64 | Higher-density displays |
| 128 | Installation and the Chrome Web Store listing |
| 512, 1024 | Store artwork and future-proofing |

Download them individually, or take the lot as a zip.

## Step 3: Copy the manifest snippet

The page gives you the `icons` block to paste into your `manifest.json`, so you don't have to write the paths by hand or remember which sizes belong in there.

Drop the PNGs into your extension folder and paste the snippet in.

## Design notes that matter at 16px

The resizer handles the scaling. It can't fix an icon that doesn't survive being small.

**Test at 16 before you commit.** Almost every icon looks fine at 128. The 16px version is where detail turns to mud.

**One clear shape beats an illustration.** Fine lines, gradients and small text all disappear.

**Watch the edges.** An icon that fills its square looks cramped in a toolbar; a little padding usually reads better.

**Mind the background.** Browser toolbars come in light and dark. An icon that relies on a white background vanishes on a dark one.

## Related

Deeper background on which sizes each store actually requires is in [every icon size your Chrome extension actually needs](/blog/chrome-extension-icon-sizes-guide/).

## Still stuck?

**The upload was rejected.** It needs to be an image. Dropping a PDF or a zip on the page won't work, and the page will say so rather than failing silently.

**The zip didn't download.** The zip helper loads separately; if it fails you'll get a message saying so, and every size can still be downloaded individually.

**The output looks blurry.** Your source was too small. Nothing can add detail that wasn't there, so re-export the original artwork at 1024 and try again.
