---
new: true
submit: false
layout: templates/help-doc.liquid
title: "Fix common Markdown Editor problems"
description: "Document won't save, import fails, preview looks wrong, or a feature seems missing? Quick fixes for the usual suspects."
keywords: markdown editor not saving, import failed, troubleshooting, markdown preview broken, Coffee and Fun
url: help/markdown-editor-troubleshooting/
isHelp: true
product: markdown-editor
app: Markdown Editor
category: Troubleshooting
img: /assets/images/social/help/markdown-editor-troubleshooting.png
date: 2026-07-31T12:00:00.000Z
updated: 2026-07-31T12:00:00.000Z
time: 4 min read
related:
  - title: "Recover lost notes"
    url: /help/recover-markdown-editor-notes/
  - title: "Documents, saving & backups"
    url: /help/markdown-editor-documents-and-backups/
tags:
  - help
  - markdown-editor
---

## A document won't save

- Look for an error toast. The editor **tells you** when a save fails instead of failing silently.
- The usual cause is **full browser storage**. Export a `.zip` backup, then delete documents you no longer need.
- Copy your current text somewhere safe before troubleshooting further.

## My notes disappeared

- Don't panic, and don't keep typing. Follow the dedicated guide: [Recover lost notes](/help/recover-markdown-editor-notes/).

## Import fails

- Only markdown files are accepted. The file must end in `.md` (any capitalization is fine).
- Exports from other apps sometimes use `.txt`. Rename the file to `.md` and try again.

## Math or diagrams don't render

- Both are **off by default**. Turn them on in **Settings → Writing tools**.
- Check delimiters: `$...$` for inline math, ```` ```mermaid ```` fenced blocks for diagrams.

## The preview looks different from GitHub

- The editor renders GitHub-flavored markdown plus extras (footnotes, front matter, highlights). Front matter between `---` fences is shown as metadata, not text.

## A feature seems missing on my platform

- It isn't. Every feature ships on every platform. If something looks absent, update to the latest version from your store; older versions predate the newer tools.

## Still stuck?

- Email us at [hello@coffeeandfun.com](mailto:hello@coffeeandfun.com) or use the [support page](/support/). A human reads everything.
