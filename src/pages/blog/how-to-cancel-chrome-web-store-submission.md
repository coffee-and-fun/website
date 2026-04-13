---
new: true
submit: false
footer: true
header: true
layout: templates/post.liquid
title: How to Cancel a Chrome Web Store Submission That's Already in Review
description:
  Submitted your Chrome extension update and immediately spotted a mistake? Here's how to cancel a
  pending review from the dashboard or via the API.
keywords:
  Chrome Web Store, Cancel Review, Extension Development, Chrome Extension, Cancel Submission,
  Developer Dashboard, Chrome Web Store API, Extension Publishing, Review Process, Coffee and Fun
url: blog/how-to-cancel-chrome-web-store-submission/
isBlog: true
blog_cat: Development
youtubeId:
cardTitle: How to Cancel a Chrome Web Store Submission
blog_snip:
  Submitted your Chrome extension update and immediately regretted it? Here's exactly how to cancel
  a pending review and get your submission back to draft state.
name: Robert James Gabriel
img: /assets/images/blog/how-to-cancel-chrome-web-store-submission.png
date: 2026-04-12T00:00:00.000Z
time: 2 min
tags:
  - guide
  - development
---

You hit "Submit for Review" and immediately realize something's wrong. A stray `console.log`, a wrong version number, the wrong zip file. It happens.

Google now lets you cancel a pending review. Here's how.

---

## From the Dashboard

1. Open the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Find the extension with the pending submission.
3. Click the **three-dot menu** on the listing.
4. Click **Cancel review**.
5. Confirm.

Your submission goes back to draft. Fix it, resubmit when ready. You can also find this option under **Build > Package**.

---

## Via the API

If you use CI/CD or automated publishing, you can cancel programmatically:

```bash
curl -H "Authorization: Bearer $TOKEN" \
     -X POST \
     https://chromewebstore.googleapis.com/v2/publishers/PUBLISHER_ID/items/EXTENSION_ID:cancelSubmission
```

Replace `PUBLISHER_ID` and `EXTENSION_ID` with your values. Your OAuth token needs the Chrome Web Store API scope enabled in your Google Cloud project.

---

## Good to Know

- **Six cancellations per day** per publisher. If you're hitting that limit, add pre-submission checks to your workflow.
- Canceled submissions go back to **draft state** — nothing gets deleted.
- This only works while the submission is **still in review**. If it's already published, use the [rollback feature](/blog/how-to-rollback-chrome-extension-version/) instead.

---

*For more Chrome Web Store tips, see [how to rollback to a previous version](/blog/how-to-rollback-chrome-extension-version/) and our take on [why browser extension stores need higher standards](/blog/browser-extension-stores-need-higher-standards/).*
