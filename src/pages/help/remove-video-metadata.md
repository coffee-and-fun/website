---
new: true
submit: false
layout: templates/help-doc.liquid
title: "How to remove video metadata"
description: "Strip GPS location, device details and timestamps from a video and download a clean copy. Runs in your browser, no re-encoding, no quality loss."
keywords: remove video metadata, video exif remover, remove gps from video, strip video metadata, metadata remover video, clean video file, Coffee and Fun
url: help/remove-video-metadata/
isHelp: true
product: meta-videos
app: Video Metadata Viewer & Remover
category: Removing metadata
img: /assets/images/social/help/remove-video-metadata.png
date: 2026-08-10T12:00:00.000Z
updated: 2026-08-10T12:00:00.000Z
time: 3 min read
related:
  - title: "How to view video metadata"
    url: /help/view-video-metadata/
  - title: "How to remove image metadata"
    url: /help/remove-image-metadata/
tags:
  - help
  - meta-videos
---

## Step 1: Add your video

Open the [Video Metadata Viewer & Remover](/meta-videos/) and drop your file in.

MP4, QuickTime `.mov`, AVI, MKV and WebM are all recognised. The container is detected from the file itself rather than the extension, so a mislabelled file still works.

Everything happens in your browser. The video is never uploaded, which matters here more than almost anywhere, because these files routinely carry your home coordinates.

## Step 2: Read what it found

Before removing anything you get a list of what's actually in the file, in plain English. [Viewing video metadata](/help/view-video-metadata/) covers what each finding means.

You'll also get a plan: a written list of exactly what the clean copy will blank. Worth a glance, because it tells you what you were about to share.

## Step 3: Download the clean copy

Take the clean copy. It's a new file, generated in your browser.

**Your original is never touched.** Nothing is modified in place and nothing is uploaded.

## Why there's no quality loss

This is the part that makes it different from most tools that do this.

The metadata is **blanked in place** rather than the video being re-encoded. The tool finds the specific regions holding metadata and zeroes them, leaving the actual video and audio streams untouched byte for byte.

That means:

- **No quality loss at all.** Not "minimal", none. The picture is the same data it was.
- **It's fast**, even on large files, because nothing is being recompressed.
- **The file size barely changes**, since the removed regions are blanked rather than cut out.

Re-encoding tools have to decode and recompress your whole video to strip a few hundred bytes of metadata, which costs time and quality both.

## The one thing it cannot remove

Some cameras, action cameras especially, write telemetry into a **separate track inside the video stream itself**. GoPro's GPMF format is the common example, and it can contain GPS.

That data isn't in a metadata region, it's a track alongside the video. Blanking can't touch it without re-encoding the file, so **it stays in the clean copy**.

The tool tells you when it finds one rather than letting you assume the file is clean. If you see that note and the video needs to be genuinely location-free, you'll need a re-encoding tool, and you'll take the quality hit that comes with it.

> **If it says nothing was found**, that's a real answer. Videos that have been through a social platform are usually stripped already, because the platform removed it on upload for its own reasons.

## Share the clean copy, not the original

The obvious step that goes wrong most. Check the filename before attaching, particularly when both versions are sitting in your downloads folder.

## What this does not do

- **It doesn't change the video content.** A street sign or a house number on screen is still there.
- **It doesn't affect copies you've already sent.**
- **It isn't anonymity.** It removes one identifying layer. The account you upload from and the connection you use are separate matters.
