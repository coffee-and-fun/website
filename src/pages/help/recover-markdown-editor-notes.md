---
new: true
submit: false
footer: true
header: true
layout: templates/help.liquid
title: Recovering Lost Notes in Markdown Editor
description:
  Opened Markdown Editor and your documents are gone? Breathe. They're usually still there. Here's
  how to check the extension storage, pull them out, and stop it happening again.
keywords:
  Markdown Editor, recover notes, Firefox extension storage, Chrome extension storage, restore
  markdown documents, Markdown Editor Android, Markdown Editor backup, about:debugging, Coffee and
  Fun
url: help/recover-markdown-editor-notes/
isHelp: true
app: Markdown Editor
category: Recovery
cardTitle: Recovering Lost Notes in Markdown Editor
intro:
  Documents list empty? Welcome text back? Breathe. In most cases your notes are still there — the
  extension just can't see them. This guide walks every recovery path, easiest first.
name: Coffee & Fun Team
date: 2026-04-20T00:00:00.000Z
time: 8 min read
tags:
  - help
  - recovery
  - markdown-editor
---

> **Stop typing first.** Markdown Editor auto-saves the editor pane to `markdownCurrentDoc`. Typing now risks overwriting recoverable content. Take any fresh notes elsewhere.

## What likely happened

Markdown Editor stores everything locally in your browser's extension storage under two keys:

- `markdownDocuments` — your full document list (titles, content, timestamps).
- `markdownCurrentDoc` — the raw text last shown in the editor pane.

Common causes when the list looks empty:

- **Storage was cleared** — often Firefox for Android's *Delete browsing data on quit* or site-data cleanup.
- **Extension was reinstalled or moved profile** — sideload, new profile, or cleared via debug tools.
- **Storage is unreadable** — if the JSON can't parse, the editor silently falls back to empty. Your data may still be on disk.
- **You're in a different profile** — private browsing, a synced device, or a second install.

Work through the steps in order — easiest first.

---

## Step 1 — Freeze the extension

Close the tab. Don't save, don't create, don't clear. If you're on a phone, put it down.

---

## Step 2 — Look for a backup file

If you ever used **Export All Documents**, there's a file like `markdown-docs-2025-09-14.json` in Downloads (or iCloud / Drive / Dropbox).

Found one? Open the extension → **Import** → pick the file. Even an old export recovers most of the work.

---

## Step 3 — Check other browsers and devices

Extension storage doesn't sync between devices — but a separate copy may exist on another one.

1. Open Markdown Editor everywhere you've used it.
2. If you find intact documents, **Export All Documents immediately**.
3. Import that JSON on the broken device.

---

## Step 4 — Inspect storage directly (desktop Firefox)

This recovers the most cases.

1. Open `about:debugging#/runtime/this-firefox`.
2. Find **Markdown Editor** → click **Inspect**.
3. In DevTools, open the **Storage** tab (hit **»** if hidden).
4. Expand **Extension Storage → Local**.
5. Look for `markdownDocuments` and `markdownCurrentDoc`.

**If `markdownDocuments` has data:**

1. Expand it, right-click → **Copy Value**.
2. Wrap it like this and save as `markdown-recovery.json`:

```json
{
  "version": "2.0",
  "exportDate": "2026-04-20T00:00:00.000Z",
  "documents": [ ...paste your array here... ]
}
```

3. Re-open the extension → **Import** → pick the file.

**If only `markdownCurrentDoc` has data:** copy the string into a new document. That's your most recent session, at least.

---

## Step 5 — Firefox for Android (USB debugging)

Android Firefox has no `about:debugging` — drive it from a desktop instead.

1. Phone: Firefox → **Settings → About Firefox** → tap the logo 5× to unlock *Secret Settings*.
2. Back in Settings → turn on **Remote debugging via USB**.
3. Enable **USB debugging** in Android *Developer options*.
4. Connect the phone to a computer running desktop Firefox.
5. Desktop: `about:debugging` → **USB Devices** → **Connect**.
6. Click **Inspect** next to Markdown Editor → follow Step 4.

> **Heads up:** match channels. If the phone runs Firefox Beta, use Firefox Beta on the desktop too.

---

## Step 6 — Dig into the profile folder (advanced)

If the extension won't load at all, or Step 4 is empty, data may still be on disk.

1. Go to `about:profiles` → click **Open Folder** next to *Root Directory* on the active profile.
2. Look inside:
   - `storage/default/moz-extension+++…/idb/` — IndexedDB files.
   - `browser-extension-data/{extension-id}/storage.js` — older storage file.
3. Search for chunks of your text.
4. Found something? **Copy the whole folder elsewhere** before touching it, then email filenames (not contents) to [hello@coffeeandfun.com](mailto:hello@coffeeandfun.com).

> Never edit profile files in place — a corrupted one stops Firefox from starting.

---

## Step 7 — Chrome, Edge, and Safari

Same idea, different menus.

**Chrome / Edge**

1. Open `chrome://extensions` (or `edge://extensions`) → enable **Developer mode**.
2. Find Markdown Editor → click **Inspect views: service worker** (or *background page*).
3. In the Console, run:

```js
chrome.storage.local.get(['markdownDocuments', 'markdownCurrentDoc'], d => console.log(JSON.stringify(d, null, 2)))
```

4. Copy the output, wrap it in the Step 4 JSON format, import.

**Safari (macOS)**

1. Safari → **Settings → Advanced** → enable *Show features for web developers*.
2. Open Markdown Editor → right-click → **Inspect Element**.
3. **Storage** tab → look for `markdownDocuments` and `markdownCurrentDoc`.

---

## Step 8 — Stop it happening again

- **Export monthly.** *Export All Documents* → save to iCloud / Drive / Dropbox. The file is tiny.
- **Check "clear on quit" settings.** Firefox Android → *Delete browsing data on quit* — make sure **Site data** and **Cookies** are off. Same idea in Chrome / Edge.
- **Don't uninstall to "reset".** Uninstalling wipes storage. Email us first — we can almost always fix it in place.
- **Split long documents.** Extension storage caps around 5 MB. Ten small files survive better than one huge one.

---

## A small promise

Markdown Editor stays out of your way — no accounts, no cloud, no telemetry. The trade-off: the data lives on your device, and device storage can get cleared. That's what the Export button is for. Open the editor and find it — takes two seconds.

---

## Still stuck?

Email [hello@coffeeandfun.com](mailto:hello@coffeeandfun.com) with:

- Browser and version (e.g. Firefox 127 on Android 14).
- Roughly when the documents disappeared.
- Any recent updates, reinstalls, or browser changes.
- What you tried from this guide and what happened.

A real person reads every message. You're not yelling into a void.
