---
new: true
submit: false
layout: templates/help-doc.liquid
title: "How to view video metadata"
description: "See the hidden data inside a video file: GPS location, device model, timestamps and software. Runs in your browser, nothing is uploaded."
keywords: video metadata viewer, video exif viewer, view video metadata, video exif data, check video metadata, video metadata analysis, Coffee and Fun
url: help/view-video-metadata/
isHelp: true
product: meta-videos
app: Video Metadata Viewer & Remover
category: Viewing metadata
img: /assets/images/social/help/view-video-metadata.png
date: 2026-08-10T12:00:00.000Z
updated: 2026-08-10T12:00:00.000Z
time: 3 min read
related:
  - title: "How to remove video metadata"
    url: /help/remove-video-metadata/
tags:
  - help
  - meta-videos
---

## Step 1: Open the viewer

Go to the [Video Metadata Viewer & Remover](/meta-videos/).

The whole thing runs in your browser. Your video is never uploaded to a server, which matters here more than usual, because the entire point is that these files contain private information.

## Step 2: Add your video

Drag the file in or click to choose it. Read the file, and the metadata appears.

Large videos take a moment. The tool only needs to read the file's header rather than the whole thing, so it is much faster than uploading anywhere would be.

## Step 3: Read what is in there

What you find depends on what recorded it. Commonly:

**Location**: GPS coordinates, sometimes accurate to a few metres. This is the one that surprises people. A video taken at home carries your address in it.

**Device**: make and model of the phone or camera, and often the operating system version.

**Timestamps**: when it was recorded, and sometimes when it was last modified. Note these can be in UTC rather than your local time.

**Software**: what edited or exported it, which quietly tells anyone what tools you use.

**Technical details**: codec, resolution, frame rate, duration, bit rate. Harmless, and useful when you are trying to work out why a file will not play somewhere.

> **Not every video has all of this.** A file that has been through a social network usually has most of it stripped already, because the platform removed it on upload. That is the platform protecting itself, not you.

## What to check before you share a video

Three things are worth a look every time:

1. **Location.** If there are coordinates, decide whether you want whoever receives it to have them.
2. **Timestamps.** These can contradict a story you are telling about when something happened.
3. **Device.** Ties the file to a specific phone, which matters if you are sharing something anonymously.

If any of those are a problem, [remove the metadata](/help/remove-video-metadata/) and share the clean copy instead.

## Still stuck?

**Nothing appears.** The file may already be stripped, or the format may not carry readable metadata. Not every container stores it the same way.

**The file will not load.** Very large videos can run into browser memory limits. Try a shorter clip to confirm the tool works, then decide whether you need a desktop tool for the full file.

**The timestamps look wrong.** Check whether they are UTC. A video recorded at 9pm can show as 2am the next day.
