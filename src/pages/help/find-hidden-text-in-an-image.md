---
new: true
submit: false
layout: templates/help-doc.liquid
title: "How to see hidden text in an image"
description: "Check whether a picture has a message hidden inside it, read it back in your browser, and understand why some images come back empty even when they should not."
keywords: how to see hidden text in image, find hidden text in image, reveal hidden text in photo, hidden message in picture, read hidden message image, steganography decoder, Coffee and Fun
url: help/find-hidden-text-in-an-image/
isHelp: true
product: secret-message-image-encoder
app: Hide Text in Images
category: Revealing text
img: /assets/images/social/help/find-hidden-text-in-an-image.png
date: 2026-08-10T12:00:00.000Z
updated: 2026-08-10T12:00:00.000Z
time: 3 min read
related:
  - title: "How to hide text in an image"
    url: /help/hide-text-in-an-image/
tags:
  - help
  - secret-message-image-encoder
---

## Step 1: Switch to reveal mode

Open [Hide Text in Images](/secret-message-image-encoder/) and switch to the **Reveal** tab.

Nothing is uploaded. The picture is read in your browser and never leaves your device.

## Step 2: Upload the PNG

Drag in the picture you want to check, or click to choose it.

**It has to be the original PNG.** Not a screenshot of it, not a JPG copy, not a version that has been through a social network. Those all rebuild the image and destroy the hidden data.

If you only have a screenshot or a JPG, there is nothing to recover. The message is not hiding harder, it no longer exists in that file.

## Step 3: Read the message

If a message is there, it appears along with the timestamp from when it was hidden.

If there is nothing to find, you get a message saying so. That is the honest answer rather than an error: most pictures in the world have nothing hidden in them.

## Why an image comes back empty

In rough order of how often each one is the cause:

**There was never anything in it.** By far the most common. A normal photo is just a photo.

**It was re-compressed somewhere.** Posted to a social network, sent through a chat app, saved as JPG, or screenshotted. Any of these wipes the message.

**It was hidden with a different tool.** There is no universal standard for this. A message hidden by one steganography tool is usually unreadable by another, because they use different framing and ordering. This tool reads messages made by this tool.

**The picture was edited.** Cropped, resized, filtered, rotated, or colour-corrected. All of these move or change pixels, and the message lives in the pixels.

## Try it on a picture you know has a message

The quickest way to see the difference is to make one yourself. Follow [the hiding guide](/help/hide-text-in-an-image/), download the PNG, then upload that exact file here. It comes back with your message and the timestamp.

Then try it again with a screenshot of the same image. Nothing. That comparison explains the whole tool in about a minute.

## What this cannot do

- **It does not find every kind of hidden data.** This reads messages stored the way this tool stores them. Other techniques exist and this will not see them.
- **It does not read metadata.** Camera model, GPS coordinates and timestamps live in a different part of the file. For those use the [Image Metadata Viewer](/meta-images/), or the [Video Metadata Viewer](/meta-videos/) for video.
- **It does not break encryption.** If someone encrypted their text before hiding it, you get the encrypted text back and still need the key.
