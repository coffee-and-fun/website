---
new: true
submit: false
footer: true
header: true
layout: templates/post.liquid
title: "Apple Passwords in Chrome: Setup and the Catch"
description: "How to use Apple Passwords in Chrome on Windows and Mac, why the official extension has 2.3 stars from six million users, and the requirement nobody mentions."
keywords:
  apple passwords chrome extension, icloud passwords chrome, apple password manager review,
  apple passwords app, icloud keychain chrome, apple passwords windows, Coffee & Fun LLC
url: blog/apple-passwords-chrome-extension/
isBlog: true
blog_cat: Recommendation
youtubeId:
cardTitle: "Apple Passwords in Chrome, and the Requirement Nobody Mentions"
name: Robert James Gabriel
img: /assets/images/blog/apple-passwords-chrome-extension.png
date: 2026-10-19T12:00:00.000Z
time: 8 min
tags:
  - recommendation
  - Apple
  - privacy
---

Apple's iCloud Passwords extension for Chrome has **six million users and a 2.3 star rating**.

That is a remarkable combination. Six million people install something. Two and a half thousand of them stop to leave a review, and the average lands just above one in five stars. Products that bad usually don't get six million users, and products with six million users are usually not that bad.

We [recommended Apple's Passwords app](/blog/apple-passwords-app-review-coffee-and-fun/) last year and still do. But that post was 400 words and skipped the part that actually trips people up, which is what happens when you leave Apple's own browser. So here is the full version, including the requirement that explains most of those one-star reviews.

## What the extension is for

Apple's Passwords app holds your logins, your two-factor codes and your passkeys. On an iPhone, iPad or Mac using Safari, it fills them in and you never think about it.

The moment you open Chrome, or sit down at a Windows machine, none of that is available. The iCloud Passwords extension is the bridge. It lets Chrome read from and write to the same store your Apple devices use.

It's made by Apple, it's free, and it's the only official way to do this.

## The requirement nobody mentions

Here is the thing that is buried in Apple's documentation and mentioned in approximately none of the guides.

To use iCloud Passwords on Windows, [Apple's own support page states](https://support.apple.com/guide/icloud-windows/set-up-icloud-passwords-icw2babf5e03/icloud) that either Advanced Data Protection must be enabled on your account, **or your Apple device must be within Bluetooth range of your Windows PC**.

Read that again, because it's genuinely unusual.

Unless you have turned on Advanced Data Protection, your iPhone has to be physically near your computer for your passwords to work in Chrome. Not on the same network. Not signed into the same account. Within Bluetooth range.

If you have ever installed this, wondered why it kept asking for codes or refusing to connect, and eventually given up, that is very likely what happened. You left your phone in another room.

That single requirement explains a large share of the 2.3 stars. It is not a bug, it is a security design decision, and it is a defensible one. It's just one that most people meet without warning, in the middle of trying to log into something.

## What you need before you start

**An Apple Account with two-factor authentication turned on.** Not optional. The feature does not work without it.

**A trusted device running iOS 14, iPadOS 14, macOS 11 or later** to receive security codes.

**On Windows:** the iCloud for Windows app, from the Microsoft Store.

**On Mac:** macOS Sonoma or later, per the extension's own listing.

**And either** Advanced Data Protection enabled, **or** your Apple device physically near the computer.

## Setting it up on Windows

1. Install **iCloud for Windows** from the Microsoft Store and sign in.
2. In iCloud for Windows, click the arrow next to **Passwords and Keychain**.
3. Turn it on. You'll be asked to click **Approve** and enter a security code sent to a trusted device.
4. Still in that panel, choose **Install Extension** for Chrome. Edge and Firefox are also offered.
5. Follow the prompts and click **Done**.

Passwords are then managed through the **iCloud Passwords** app on Windows, and the extension fills them in Chrome.

## Setting it up on a Mac

Install the extension from the Chrome Web Store and sign in. You need macOS Sonoma or later.

Worth saying plainly: on a Mac, ask yourself why. If you're in Chrome because of a work requirement, fine. If you're in Chrome by habit, Safari already does all of this with no extension, no Bluetooth requirement and no setup, and it is the configuration Apple actually tests.

## The thing it does that you should know about

> **When you enable the iCloud Passwords browser extension, the browser's built-in password-saving feature is turned off.**

That's from [Apple's support documentation](https://support.apple.com/guide/icloud-windows/set-up-icloud-passwords-icw2babf5e03/icloud), and it's the right behaviour. Two password managers fighting over the same login form is a genuinely miserable experience.

But be aware of what it means: **passwords already saved in Chrome do not move.** They stay in Chrome's store, which is now switched off for saving. You have two collections in two places, and the one you can see is not the one you spent years filling.

Export from Chrome and import into Passwords before you flip the switch, or you'll spend the next month discovering logins you thought you had.

While you're auditing what's stored about you, it's a reasonable moment to check [what your photos are quietly carrying too](/blog/what-your-photos-reveal-exif-data/). Different kind of leak, same habit of never looking.

## Where it works, and where it doesn't

Laid out plainly, because this is the whole decision:

| Where you are | How it goes |
|---|---|
| Safari on iPhone, iPad, Mac | Built in. Nothing to install, nothing to configure. |
| Chrome on a Mac | Extension, macOS Sonoma or later. Works. |
| Chrome or Edge on Windows | Extension plus iCloud for Windows, plus the Bluetooth or Advanced Data Protection condition. |
| Firefox on Windows | Same as above, extension offered. |
| Android | Not supported. |
| A Linux machine, a Chromebook, a friend's computer | No. |

The pattern is consistent: it degrades one step every time you move away from Apple's own stack, and it stops entirely at Android.

## What about passkeys

Passwords handles passkeys, and this is the part of the story that gets better rather than worse.

A passkey replaces the password with a key pair, so there is nothing to phish and nothing to leak in a breach. Apple syncs them through iCloud Keychain the same way it syncs passwords, and the Chrome extension carries them across.

Two practical notes. **Passkey support depends on the site, not on you.** You can only use one where the site offers it, and adoption is patchy. And **keep the password as a fallback** where a site allows both, because passkey recovery paths are still inconsistent and you do not want to discover yours is broken while locked out.

If you're weighing password managers in 2026, passkey handling is the thing worth comparing, and Apple's is solid inside its own ecosystem.

## Should you use Apple Passwords at all

Yes, with a real caveat.

**The case for it.** It's already there. It costs nothing. It handles passwords, 2FA codes and passkeys in one place. It's backed by a company whose business model isn't advertising. And the single biggest factor in password manager security is whether you actually use one, which makes "already on your device" a genuine advantage over anything you have to be persuaded to install. It is the same argument we made about [why we recommend it to friends](/blog/apple-passwords-app-review-coffee-and-fun/), and it still holds.

**The case against it.** It is built for people who live in Safari on Apple hardware. Every step outside that is worse than the alternatives. Chrome needs an extension with a Bluetooth requirement. Android is not supported at all. Sharing with someone on a different platform is awkward.

The honest test is this: **if all your devices are Apple and you mostly use Safari, it's excellent and free.** If you're on Windows, or Android, or you switch browsers constantly, a cross-platform manager will annoy you less, and you should pay the few pounds a month rather than fight this.

## About that 2.3 rating

A closing thought about what the number actually measures.

An extension's rating is not a measure of its security or its engineering. It's a measure of how often it surprised someone badly enough that they went back to the store to complain. A password manager that silently works gets no review. One that fails at the exact moment you needed to log into something gets one star and a paragraph.

The Bluetooth requirement guarantees a steady supply of those moments, because it fails intermittently and for a reason you cannot see. Your phone was upstairs. Nothing in the interface says so.

So: six million users, 2.3 stars, and both numbers are telling the truth about different things. The product is fine. The failure mode is invisible, and invisible failure modes are how good software earns bad ratings.

If you set it up, turn on Advanced Data Protection at the same time. It removes the Bluetooth condition entirely, and it's a stronger security posture anyway.

---

## Sources

- [Set up iCloud Passwords on your Windows computer](https://support.apple.com/guide/icloud-windows/set-up-icloud-passwords-icw2babf5e03/icloud), Apple Support, for the two-factor, Advanced Data Protection and Bluetooth range requirements and the setup steps. Checked 10 August 2026.
- [Autofill iCloud passwords in a web browser on your Windows computer](https://support.apple.com/guide/icloud-windows/autofill-passwords-in-a-web-browser-icw76039ec0f/icloud), Apple Support. Checked 10 August 2026.
- [iCloud Passwords on the Chrome Web Store](https://chromewebstore.google.com/detail/icloud-passwords/pejdijmoenmkgeppbflobdenhhabjlaj), for the version, user count, rating and stated compatibility. Checked 10 August 2026, and these numbers move.
