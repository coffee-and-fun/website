---
new: true
submit: false
layout: templates/help-doc.liquid
title: "Add an email signature in Outlook"
description: "Paste a signature into Outlook on the web, Windows, or Mac, set it for new messages and replies, and fix the spacing problems Outlook is known for."
keywords: outlook signature generator, how to add signature in outlook, outlook email signature, outlook 365 signature, html signature outlook, Coffee and Fun
url: help/add-email-signature-in-outlook/
isHelp: true
product: email-signature-generator
app: Email Signature Generator
category: Setting it up
img: /assets/images/social/help/add-email-signature-in-outlook.png
date: 2026-08-10T12:00:00.000Z
updated: 2026-08-10T12:00:00.000Z
time: 3 min read
related:
  - title: "Build your signature"
    url: /help/build-an-email-signature/
  - title: "Add an email signature in Gmail"
    url: /help/add-email-signature-in-gmail/
tags:
  - help
  - email-signature-generator
---

## Step 1: Build and copy it

Open the [Email Signature Generator](/email-signature-generator/), fill in your details, pick a template, and copy the signature. The generator's setup panel has an Outlook tab covering these steps too.

> **Paste, don't retype.** Signature editors accept formatted content pasted in. Typing it out by hand loses the layout, the links and the spacing.

## Outlook on the web

Go to **Settings (gear icon) → Mail → Compose and reply**.

Paste into the signature box, then set the two toggles underneath for whether it goes on new messages and on replies. Click **Save**.

## Outlook on Windows

Go to **File → Options → Mail → Signatures**, or start a new message and use **Signature → Signatures** on the toolbar.

Click **New**, name it, and paste into the **Edit signature** box. On the right, set **New messages** and **Replies/forwards** to your signature, then click **OK**.

## Outlook on Mac

Go to **Outlook → Settings → Signatures**, click **+**, name it, and paste into the editing window. Close it, then set the default signature per account underneath.

## Why Outlook is fussier than other clients

Outlook on Windows renders mail using Word's engine rather than a browser one. It's stricter about layout, and this is why the templates are built on tables rather than modern CSS layout. Tables are the thing Outlook has always rendered predictably.

Two consequences worth knowing:

**Extra space can appear between rows.** Usually harmless, occasionally ugly. Reducing the number of lines in your signature is the reliable fix.

**Some styling is ignored.** Rounded corners on a photo, for example, may render square. The signature still works, it just looks slightly plainer.

## Troubleshooting

**It pasted as plain text.** Make sure you're pasting into the formatted signature editor, not a plain text field, and that you copied the signature rather than the HTML code.

**The image is missing or shows a red X.** The photo must be at a public URL. Outlook is also more likely than most clients to block remote images until the recipient allows them, so don't put anything essential in the image alone.

**Links aren't clickable.** Usually a sign the content arrived as plain text. Re-copy and paste again.

**It looks fine to you and broken to a colleague.** Different Outlook versions render differently. Send a test to one person on Windows Outlook and one on the web before rolling it out to a team.
