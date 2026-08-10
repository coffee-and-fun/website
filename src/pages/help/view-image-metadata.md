---
new: true
submit: false
layout: templates/help-doc.liquid
title: "How to view image metadata"
description: "See the hidden data inside a photo: GPS location, camera model, timestamps and editing software. Runs in your browser, nothing is uploaded."
keywords: image metadata viewer, exif data viewer, photo metadata viewer, view exif data, check photo metadata, image exif, metadata viewer, Coffee and Fun
url: help/view-image-metadata/
isHelp: true
product: meta-images
app: Image Metadata Viewer & Editor
category: Viewing metadata
img: /assets/images/social/help/view-image-metadata.png
date: 2026-08-10T12:00:00.000Z
updated: 2026-08-10T12:00:00.000Z
time: 3 min read
related:
  - title: "How to remove image metadata"
    url: /help/remove-image-metadata/
  - title: "How to view video metadata"
    url: /help/view-video-metadata/
tags:
  - help
  - meta-images
---

## Step 1: Open the viewer

Go to the [Image Metadata Viewer & Editor](/meta-images/).

It runs entirely in your browser. Your photo is never uploaded, which matters more here than on most tools, because the whole point is that these files contain private information.

## Step 2: Add a photo

Drag the image in or click to choose one. JPEGs from phones and cameras carry the most metadata; PNGs and screenshots usually carry very little.

## Step 3: Read the findings

Rather than a raw dump of tag names, findings are written in plain English and **sorted by risk**, highest first.

**Location (high risk).** GPS coordinates decoded into a readable position, including altitude where the photo has it. This is the one that surprises people: a photo taken at home carries your address.

**Date and time.** When the photo was taken, and sometimes when it was digitised or last modified.

**Camera.** Make and model, and the lens where recorded. This ties a photo to a specific device.

**Software.** What edited or exported it. Quietly tells anyone which tools you use.

**Creator and copyright.** Artist, by-line, or copyright fields, which often carry a real name.

Below the plain-English findings you can expand the full tag groups if you want the raw EXIF, IPTC and XMP values.

## What to check before you post a photo

Three things, every time:

1. **Location.** If coordinates are there, decide whether the recipient should have them.
2. **Creator fields.** These carry real names more often than people expect, especially in photos exported from editing software.
3. **Timestamps.** They can contradict a story about when something happened.

If any of those are a problem, [remove the metadata](/help/remove-image-metadata/) and share the clean copy.

> **Social networks usually strip metadata on upload.** That protects you on those platforms but not when you send the original file by email, message, or cloud link. The original still carries everything.

## Still stuck?

**Nothing is found.** Common and usually correct. Screenshots, most PNGs, and images already through a social platform carry little or nothing.

**The reader couldn't load.** If the metadata reader fails, the page says so plainly, and the clean-copy function still works, so you can still strip a file you can't inspect.

**The file couldn't be read.** Very large or unusual files can fail. The clean copy still removes everything even when the preview can't parse it.
