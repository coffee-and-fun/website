---
new: true
submit: false
layout: templates/help-doc.liquid
title: "Turn any image into Minecraft pixel art"
description: "Upload a picture, pick a grid size, and get a Minecraft pixel art plan you can build. Free, runs in your browser, nothing gets uploaded to a server."
keywords: minecraft pixel art generator, image to minecraft pixel art, minecraft pixel art maker, minecraft image converter, picture to minecraft blocks, Coffee and Fun
url: help/minecraft-pixel-art-getting-started/
isHelp: true
product: minecraft-pixel-art
app: Minecraft Pixel Art Generator
category: Getting started
img: /assets/images/social/help/minecraft-pixel-art-getting-started.png
date: 2026-08-10T12:00:00.000Z
updated: 2026-08-10T12:00:00.000Z
time: 3 min read
related:
  - title: "Grid overlay & the numbered build guide"
    url: /help/minecraft-pixel-art-grid-and-build-guide/
  - title: "Block list, block counts & stacks"
    url: /help/minecraft-pixel-art-block-list/
tags:
  - help
  - minecraft-pixel-art
---

## Step 1: Open the generator

Go to the [Minecraft Pixel Art Generator](/minecraft-pixel-art/). There's nothing to install and no account to make.

Everything runs in your browser. Your image is never uploaded to a server, which also means the tool works with the tab open and offline once it has loaded.

## Step 2: Add your image

Either drag a picture onto the drop zone, or click it to open a file picker. PNG and JPG both work.

Portraits, logos, and anything with big flat areas of colour convert best. Photos with a lot of fine detail will lose that detail, because a 48 block wide build only has 48 pixels of horizontal resolution to work with.

> **No image handy?** There's a sample button that loads a test pattern, so you can see how the output works before you commit to a picture.

## Step 3: Pick a grid size

**Grid size** is how many blocks wide your build will be. The height is worked out automatically from your image's aspect ratio, so a wide photo stays wide.

Your options are 16, 32, 48, 64, 96, and 128 blocks wide. It starts at 48.

| Grid width | Roughly what you get | Good for |
|---|---|---|
| 16 | A tiny icon, a few hundred blocks | Signs, banners over a door |
| 32 | Recognisable shapes, chunky | A wall in a small base |
| 48 | The default, detail without the sprawl | Most builds |
| 64 | Faces and text start reading properly | A feature wall |
| 96 | Serious detail | Big survival projects |
| 128 | Maximum detail, tens of thousands of blocks | Creative mode, mostly |

Double the grid width and you roughly quadruple the block count. A 128 wide build off a square image is over sixteen thousand blocks. Check the block total before you decide you're doing it in survival.

## Step 4: Turn dithering on or off

**Dithering** mixes two block colours in a speckled pattern to fake a colour the palette doesn't have. It's off by default.

- **Off**: cleaner, flatter areas of solid colour. Easier to build, easier to read from a distance.
- **On**: smoother gradients and more accurate skin tones, at the cost of a noisier, speckled look up close.

Try both. Skies, sunsets, and photos of people usually look better dithered. Logos and cartoons usually don't.

## Step 5: Save what you need

Three separate downloads sit under the preview:

**Pixel art PNG**: the finished image, rendered in Minecraft block colours.

**Build guide PNG**: the same image with every cell numbered, plus grid coordinates around the edge. This is the one you actually build from.

**Block list TXT**: a plain text shopping list of every block type and how many you need.

The numbers in the build guide match the numbers in the block list, so `#1` on the guide is the first block on the list.

## What the tool does not do

Being straight with you about the limits:

- It doesn't export a schematic, `.nbt`, or Litematica file. The output is images and a text list, so you place the blocks yourself.
- It doesn't handle transparency. Transparent areas get matched to the nearest block colour like everything else.
- It doesn't do maps or map art. This is for block builds.
- It doesn't animate, and it won't split a build into sections for you.

## Still stuck?

If the preview stays blank after you add an image, the file may not be a format your browser can decode. Re-save it as a standard PNG or JPG and try again.

If the page feels slow at 96 or 128, that's the colour matching working through tens of thousands of cells. Give it a second. Dropping to a smaller grid while you experiment, then going large once you like the result, is much faster.
