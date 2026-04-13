---
new: true
submit: false
footer: true
header: true
layout: templates/post.liquid
title: How to Rollback Your Chrome Extension to a Previous Version
description:
  Pushed a bad update to your Chrome extension? The Chrome Web Store lets you roll back to the
  previous published version without waiting for a new review. Here's how.
keywords:
  Chrome Web Store, Rollback, Extension Development, Chrome Extension, Revert Version, Developer
  Dashboard, Chrome Web Store API, Extension Publishing, Version Control, Bug Fix, Coffee and Fun
url: blog/how-to-rollback-chrome-extension-version/
isBlog: true
blog_cat: Development
youtubeId:
cardTitle: How to Rollback Your Chrome Extension Version
blog_snip:
  Pushed a bad update to your Chrome extension? Here's how to use the Chrome Web Store rollback
  feature to revert to your previous published version without waiting for a new review.
name: Robert James Gabriel
img: /assets/images/blog/how-to-rollback-chrome-extension-version.png
date: 2026-04-12T00:00:00.000Z
time: 2 min
tags:
  - guide
  - development
---

A broken update just went live and your users are feeling it. Before rollback existed, you'd have to fix the bug, resubmit, and wait days for review. Now you can revert in minutes.

The rollback feature re-publishes your previous version under a new version number — and **skips the review queue** because that code already passed review.

---

## How to Rollback

1. Open the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Select the broken extension.
3. Click the **three-dot menu** on the listing, or go to **Build > Package**.
4. Click **Roll back to previous version**.
5. Enter a **new version number** (e.g., if the broken version is 2.5.0, use 2.5.1).
6. Enter a **reason** for the rollback.
7. Confirm.

The previous version goes live under the new version number. Verify under **Build > Package** that the old code is now active.

---

## Good to Know

- **One version back only.** You can't skip back multiple versions. For anything older, manually re-upload the zip.
- **Pending submissions get discarded.** Anything in the review queue or staged for release is wiped when you rollback.
- **Partial rollouts too.** If you were at 30% rollout, rollback reverts everyone to the previous 100%-deployed version.

---

## Cancel vs. Rollback

| Situation | What to do |
|-----------|------------|
| Still in review, not yet live | [Cancel the review](/blog/how-to-cancel-chrome-web-store-submission/) |
| Already published and live | **Rollback** to previous version |
| Partial rollout going badly | **Rollback** (discards the partial rollout) |
| Need to go back 2+ versions | Re-upload the older zip manually |

Between cancel and rollback, you're covered for both "caught it early" and "it's already out there" scenarios.

---

*For more Chrome Web Store tips, see [how to cancel a submission](/blog/how-to-cancel-chrome-web-store-submission/).*
