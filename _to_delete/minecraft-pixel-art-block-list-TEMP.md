---
new: true
submit: false
layout: templates/help-doc.liquid
title: "Does it work on Bedrock?"
description: "Yes. The Minecraft pixel art generator works for Bedrock, Java, console, and Pocket Edition, because every block in the palette exists in all of them."
keywords: minecraft pixel art generator bedrock, minecraft bedrock pixel art, pixel art minecraft bedrock, minecraft pixel art java, pocket edition pixel art, Coffee and Fun
url: help/minecraft-pixel-art-bedrock-and-java/
isHelp: true
product: minecraft-pixel-art
app: Minecraft Pixel Art Generator
category: Compatibility
img: /assets/images/social/help/minecraft-pixel-art-bedrock-and-java.png
date: 2026-08-10T12:00:00.000Z
updated: 2026-08-10T12:00:00.000Z
time: 2 min read
related:
  - title: "Turn any image into Minecraft pixel art"
    url: /help/minecraft-pixel-art-getting-started/
  - title: "Block list, block counts & stacks"
    url: /help/minecraft-pixel-art-block-list/
tags:
  - help
  - minecraft-pixel-art
---

## Short answer

Yes. There's no Bedrock mode and no Java mode, because you don't need one.

The generator outputs images and a block list, not a world file. Every block in the 94 block palette is a vanilla block that exists in Bedrock, Java, console, and Pocket Edition under the same name. Concrete, wool, terracotta, planks, stone, ores, copper, and the rest are shared across every edition.

So the build guide for a Bedrock world and the build guide for a Java world are the same file.

## Where the editions do differ

Two honest caveats, neither of which changes the plan:

**Block textures vary very slightly between editions and resource packs.** The palette is matched against vanilla Java colours. On Bedrock the difference is small enough that you won't see it in a finished build, but if you're using a resource pack that recolours blocks heavily, your build will read differently from the preview. That's the pack, not the edition.

**Newer blocks need a recent version.** Copper oxidation stages, deepslate, tuff, dripstone, mangrove, cherry, and bamboo planks are all in the palette. If you're playing an older version, some of those won't exist yet. Substitute the closest colour you do have. The [block list](/help/minecraft-pixel-art-block-list/) tells you exactly which blocks a build wants, so you can check before you start gathering.

## What about consoles and Pocket Edition

Same answer. Console and mobile Minecraft are Bedrock, so the guide works exactly the same way.

The only practical difference is reading the build guide while you play. On a console you're not going to have the PNG open on the same screen, so either print it, put it on a phone or tablet next to you, or use the spotlight feature to build one block type at a time and only glance at the guide when you switch blocks.

## What about Education Edition

The block palette works, but Education Edition restricts some blocks and adds its own. Check the guide's block list against what's actually available in your world before you plan a large build.

## What it will not give you

No edition of Minecraft can import the output directly, because the output is not a world file:

- No `.schematic`, `.nbt`, or `.mcstructure` export.
- No Litematica or WorldEdit file.
- No add-on, behaviour pack, or command block output.

You place the blocks yourself, from the numbered guide. If you need a one-click import, you want a schematic tool, and this isn't one.
