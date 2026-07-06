---
new: true
submit: false
footer: true
header: true
layout: templates/post.liquid
title: How Image Steganography Actually Works (In Plain English)
description:
  Our Hide Text in Images tool can tuck a whole paragraph inside a photo without changing how it
  looks. Here's exactly how that trick works — pixels, bits, and why a change of one in 255 is
  invisible to the human eye. No math degree required.
keywords:
  steganography, image steganography, hide text in image, LSB steganography, least significant bit,
  hidden message in picture, how steganography works, secret message encoder, PNG steganography,
  privacy tools, Coffee and Fun
url: blog/how-image-steganography-works/
isBlog: true
blog_cat: Tools
youtubeId:
cardTitle: How Image Steganography Actually Works
blog_snip:
  A picture can carry a whole paragraph of hidden text without looking any different. Here's the
  pixel-level trick behind our Hide Text in Images tool, explained in plain English.
name: Robert James Gabriel
img: /assets/images/blog/how-image-steganography-works.png
date: 2026-07-06T00:00:00.000Z
time: 6 min
tags:
  - steganography
  - privacy
  - tools
  - explainer
  - web
---

One of the most popular free tools on this site is [Hide Text in Images](/secret-message-image-encoder/). You type a message, drop in a photo, and get back a picture that looks *identical* — but carries your words invisibly inside it. People regularly ask me if it's magic, encryption, or some kind of invisible watermark.

It's none of those. It's a very old idea called **steganography**, and once you see how it works, you'll be able to explain it at a dinner party in about two minutes. Here's the whole trick.

## Hiding vs. scrambling

First, a distinction that matters:

- **Cryptography** scrambles a message so it can't be *read*. Everyone can see there's a secret; they just can't open it.
- **Steganography** hides a message so nobody knows it's *there*. The best hiding place is one nobody thinks to search.

The word comes from the Greek *steganos* (covered) and *graphein* (to write). People have been doing this forever — invisible ink between the lines of innocent letters, messages tattooed under hair, wartime microdots the size of a printed full stop. Hiding text in a digital image is just the modern version, and it turns out pixels are a spectacular hiding place.

## A pixel is just three numbers

Every pixel on your screen is a mix of red, green, and blue light, and each of those channels is stored as a number from 0 to 255. A warm cream color might be:

```
Red: 246   Green: 242   Blue: 236
```

Here's the key insight: **your eyes cannot tell the difference between 246 and 247.** Not side by side, not zoomed in, not on the best monitor money can buy. A one-step change in a single color channel is far below what human vision can detect.

That last, tiniest step of each number is called the **least significant bit** — the LSB. Flip it and the number changes by exactly one. Which means every color channel of every pixel has one bit of storage that is, for all practical purposes, *free*.

## Writing with bits nobody can see

Text is also just numbers. The letter `H` is 72, `i` is 105, and in binary those are `01001000` and `01101001`. So the recipe writes itself:

1. Turn your message into a long string of 1s and 0s.
2. Walk through the image pixel by pixel.
3. For each red, green, and blue value, overwrite its last bit with the next bit of your message.
4. Save the result.

Each pixel quietly stores three bits. The picture that comes out is mathematically different — thousands of color values have shifted by one — but visually it is a perfect twin of the original. To read the message back, you walk the pixels in the same order, collect the last bit of every channel, and glue the bits back into letters.

Our tool also writes a tiny "envelope" before your message — the message's length and a timestamp — so the decoder knows exactly how much to read and can tell you when the secret was hidden. Everything, including emoji, is stored as UTF-8, which is why "meet me at noon ☕" survives the round trip intact.

## How much can a photo hold?

More than you'd think. Three bits per pixel means eight pixels carry three bytes — three characters of text.

- A small **720 × 480** picture holds about **129,000 characters** — roughly a 20,000-word novella.
- A **12-megapixel phone photo** can hold about **4.5 million characters** — the collected Sherlock Holmes stories, with room to spare.

The [tool](/secret-message-image-encoder/) shows you the exact capacity the moment you drop a picture in.

## Why PNG survives and screenshots-of-screenshots don't

There's one catch, and it's the thing that trips most people up: **the message only survives if every pixel survives.**

PNG is a *lossless* format — what you save is exactly what you get back, bit for bit. JPEG is *lossy*: it recompresses the image by subtly rearranging pixel values your eyes won't miss. That's normally a feature, but "subtly rearranging pixel values" is precisely where your message lives. One pass through JPEG compression and the secret is gone.

This is also why some chat apps wipe hidden messages — they recompress every image you send to save bandwidth. If you want the secret to arrive, send the PNG as a *file* (or through a service that doesn't touch it), not as an inline compressed photo.

## Try it on a real secret

Reading about it is one thing; catching a real hidden message is more fun. On the [Reveal side of the tool](/secret-message-image-encoder/) there's a sample picture — a calm little coffee-ripple image that looks like nothing at all. Load it, press **Reveal hidden message**, and see what we tucked inside.

Then hide one of your own. Everything runs locally in your browser — your pictures and your secrets never touch a server.

## The honest fine print

Steganography is hiding, not locking. Anyone who suspects there's a message and knows the technique (or simply uses the same tool) can read it. If your secret genuinely matters, encrypt it first and *then* hide it — scramble, then conceal. For everything else — treasure hunts, puzzle games, love notes, digital time capsules — plain steganography is exactly the right amount of magic.

*Built something fun with it? I'd genuinely love to hear about it — [say hello](/support/).*
