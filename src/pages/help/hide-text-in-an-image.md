---
new: true
submit: false
layout: templates/help-doc.liquid
title: "How to hide text in an image"
description: "Hide a secret message inside a picture in your browser. Nothing is uploaded, the image looks identical, and only someone with the file can read it back."
keywords: how to hide text in an image, hide text in picture, hide words in pictures, hidden message in image, steganography, secret message image, Coffee and Fun
url: help/hide-text-in-an-image/
isHelp: true
product: secret-message-image-encoder
app: Hide Text in Images
category: Hiding text
img: /assets/images/social/help/hide-text-in-an-image.png
date: 2026-08-10T12:00:00.000Z
updated: 2026-08-10T12:00:00.000Z
time: 3 min read
related:
  - title: "How to see hidden text in an image"
    url: /help/find-hidden-text-in-an-image/
tags:
  - help
  - secret-message-image-encoder
---

## Step 1: Open the tool in hide mode

Go to [Hide Text in Images](/secret-message-image-encoder/). It opens in **Hide** mode by default. The other tab is **Reveal**, which does the opposite.

Everything runs in your browser. Your picture and your message are never uploaded anywhere.

## Step 2: Add a picture

Drag in a photo or click to pick one. Most common image formats work as the starting picture.

Bigger pictures hold more text. The tool shows you the **capacity** for whatever you upload, measured in characters, and warns you if your message is too long for the image you chose.

> **Why capacity varies:** the message is stored across the image's pixels, three bits per pixel. More pixels, more room. A phone photo holds a novel. A small icon holds a sentence.

## Step 3: Type your message

Write whatever you want to hide. The character counter fills up as you type, and turns into a warning if you go past what the picture can hold.

If you run out of room, either shorten the message or start from a larger picture.

## Step 4: Download the PNG

Click to hide the message, then download the result.

**The download must stay a PNG.** This is the one rule that matters, and the reason is worth understanding:

- **PNG is lossless.** Every pixel is preserved exactly, so the hidden bits survive.
- **JPG is lossy.** It rebuilds the image approximately to save space, which quietly destroys the hidden message.

If you convert the file to JPG, screenshot it, or send it through something that re-compresses images, the message is gone. Not corrupted. Gone.

## Step 5: Send it in one piece

Anything that re-encodes the picture will strip the message out. In practice that means:

**Usually safe**: sending the PNG as a file attachment, an email attachment, a direct file transfer, a download link.

**Usually destroys it**: posting to most social networks, most chat apps that compress images, screenshotting it, saving it as JPG.

If you are not sure whether a service re-compresses, send it to yourself first and check it in [Reveal mode](/help/find-hidden-text-in-an-image/).

## What this is not

Being honest about the limits:

- **This is not encryption.** There is no password. Anyone who suspects a message is there and runs the picture through the same kind of tool can read it.
- **It hides that a message exists**, which is a different thing from making it unreadable. If you need real secrecy, encrypt the text first and hide the encrypted version.
- **It does not survive editing.** Crop it, filter it, resize it, or re-save it, and the message goes with it.
