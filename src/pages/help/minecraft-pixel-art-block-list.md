---
new: true
submit: false
layout: templates/help-doc.liquid
title: "Block list, block counts & stacks"
description: "How to read the Minecraft pixel art block list, work out how many stacks you need, and cut the block count down before you start gathering materials."
keywords: minecraft pixel art generator with block count, minecraft block list, how many blocks pixel art, minecraft pixel art stacks, block shopping list, Coffee and Fun
url: help/minecraft-pixel-art-block-list/
isHelp: true
product: minecraft-pixel-art
app: Minecraft Pixel Art Generator
category: Building
img: /assets/images/social/help/minecraft-pixel-art-block-list.png
date: 2026-08-10T12:00:00.000Z
updated: 2026-08-10T12:00:00.000Z
time: 3 min read
related:
  - title: "Grid overlay & the numbered build guide"
    url: /help/minecraft-pixel-art-grid-and-build-guide/
  - title: "Does it work on Bedrock?"
    url: /help/minecraft-pixel-art-bedrock-and-java/
tags:
  - help
  - minecraft-pixel-art
---

## See the block count before you build

Two numbers appear as soon as your image converts:

**Total blocks**: grid width multiplied by grid height. This is every block in the build, and it's the number that decides whether this is an afternoon or a month.

**Unique block types**: how many different blocks the palette matched your image to. This is the number that decides how much running around you're doing.

Both update live when you change the grid size or toggle dithering, so you can shop for a size before you commit to it.

## Download the shopping list

**Block list TXT** saves a plain text file with every block type, its number, how many you need, and the same count expressed in stacks.

It looks like this:

```
MINECRAFT PIXEL ART - BLOCK SHOPPING LIST
==========================================
Grid: 48 x 48 (2,304 blocks)
Unique block types: 23
Numbers match the build guide PNG.

# 1  Black Concrete        412 blocks  (6 × 64 + 28)
# 2  White Concrete        377 blocks  (5 × 64 + 57)
```

Plain text on purpose. It opens on anything, you can paste it into a chat with whoever is helping you build, and it prints without fighting you.

## Read the stacks column

The number in brackets is the same count written the way you'll actually carry it. A stack is 64 blocks, so `6 × 64 + 28` means six full stacks and 28 spare.

An inventory slot holds one stack. Nine slots is one shulker box row, 27 slots fills a single chest. If a block shows `40 × 64`, that's 40 stacks, which is more than a full single chest of that one block. Worth knowing before you set off.

Round up when you gather. Miscounting a row and having to go back for eleven more blocks is the single most annoying way to lose twenty minutes.

## Cut the block count down

If the totals are frightening, you have three levers.

**Drop the grid size.** This is the big one. Block count scales with the square, so going from 96 wide to 48 wide is not half the blocks, it's a quarter of them.

**Turn dithering off.** Dithering scatters extra block types through areas that would otherwise be solid, which pushes up your unique block count and sends you gathering four blocks for a patch of sky instead of one.

**Crop before you upload.** Empty background costs exactly as many blocks as the subject does. Crop tight in any image editor first and every block you gather goes into the part people are looking at.

## Substitute blocks if you need to

The palette is 94 vanilla blocks: the full sixteen colours each of concrete, wool, and terracotta, plus planks, stone, ores, copper in all four oxidation stages, and a spread of the newer blocks.

Nothing stops you swapping one for another when you build. If the guide asks for Blue Concrete and you're in survival with no dye, wool in the same colour reads almost identically from a distance. The list is a plan, not a rule.

> **Concrete needs powder plus water.** Concrete powder placed next to water turns solid. If your list is mostly concrete and you're in survival, sort dye and sand first, and bring a bucket.
