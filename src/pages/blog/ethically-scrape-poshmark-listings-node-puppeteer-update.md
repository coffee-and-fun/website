---
new: false
submit: false
footer: true
header: true
layout: templates/post.liquid
title: Scraping 20,000 Poshmark Listings (For Real This Time)
description:
  Back last week, I wrote a blog post titled How I Scraped 20,000 Poshmark Listings Using Node.js
  and Puppeteer. The idea seemed solid, scroll through a Poshmark closet, grab every listing URL,
  and scrape each listing one by one. But in reality? The script crashed constantly. It would hang,
  freeze, or get stuck on a single listing. Chrome would balloon in memory, and Puppeteer would
  throw vague timeout errors like
keywords:
  'ethical scraping, Poshmark backup, Node.js Puppeteer tutorial, Poshmark automation, online
  listing backup, ethical scraping guide, Puppeteer project, ecommerce recovery, scraping listings
  Node.js'
url: blog/ethically-scrape-poshmark-listings-node-puppeteer-update/
isBlog: true
blog_cat: Usecase
cardTitle: Scraping 20,000 Poshmark Listings (For Real This Time)
blog_snip:
  Back last week, I wrote a blog post titled How I Scraped 20,000 Poshmark Listings Using Node.js
  and Puppeteer. The idea seemed solid, scroll through a Poshmark closet, grab every listing URL,
  and scrape each listing one by one. But in reality? The script crashed constantly. It would hang,
  freeze, or get stuck on a single listing. Chrome would balloon in memory, and Puppeteer would
  throw vague timeout errors like
name: Robert James Gabriel
img: /assets/images/blog/ethically-scrape-poshmark-listings-node-puppeteer.png
date: 2025-03-28T00:00:00.000Z
time: 6 min
tags:
  - scraping
  - guide
  - puppeteer
---

# Scraping 20,000 Poshmark Listings (For Real This Time)

Back last week, I wrote a blog post titled
_[How I Scraped 20,000 Poshmark Listings Using Node.js and Puppeteer](blog/ethically-scrape-poshmark-listings-node-puppeteer)_.
The idea seemed solid: scroll through a Poshmark closet, grab every listing URL, and scrape each
listing one by one.

But in reality? The script crashed constantly.

It would hang, freeze, or get stuck on a single listing. Chrome would balloon in memory, and
Puppeteer would throw vague timeout errors like:

```bash

Runtime.callFunctionOn timed out. Increase the 'protocolTimeout' setting in launch/connect calls...

```

After way too many failed runs, I finally figured out why — and how to actually fix it. This post is
the follow-up to that original blog, walking through what went wrong and how I made it right.

---

## 🧨 What Went Wrong

Here’s how my original scraper worked:

```js
const browser = await puppeteer.launch();
const page = await browser.newPage();

for (let url of allListingUrls) {
  await page.goto(url);
  const images = await page.$$eval(...);
  await saveImages(images);
}
```

It looked simple, but under the hood, there were big issues:

- One long browser session for 20,000 listings = eventual crash

- No timeout protection meant a single slow page could freeze everything

- No resume support, so if it crashed at item #1375, I’d have to start all over

- No skip logic, so re-running would re-scrape everything

## ✅ The New Approach: Batch It, Restart It, Skip It

I rewrote the entire scraper with resilience in mind. The result is a scraper that:

- Splits all listings into **batches of 10**
- Starts a **fresh Puppeteer browser** for each batch
- **Skips already-scraped listings**
- Handles **timeouts gracefully**
- **Saves progress** with a simple text file so I can resume anytime

### 🔁 Batching the Work

```js
const BATCH_SIZE = 10;
const totalBatches = Math.ceil(allListingUrls.length / BATCH_SIZE);

for (let b = 0; b < totalBatches; b++) {
	const batch = allListingUrls.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
	// process this batch
}
```

This keeps memory usage low and makes failures isolated and easy to recover from.

---

### 🧼 Fresh Browser Per Batch

```js
const { browser, page } = await createBrowser();
// ... scrape listings ...
await browser.close();
```

No more memory leaks, zombie tabs, or weird state.

---

### ⏱️ Timeout Safety with Promise.race

```js
await Promise.race([
	page.goto(url, { timeout: 3000 }),
	sleep(4000).then(() => {
		throw new Error('Timeout!');
	})
]);
```

If a page doesn't load quickly, we kill it and move on.

---

### 🧠 Skip Already-Scraped Listings

```js

if (fs.existsSync(folderPath)) {
  console.log("Already scraped, skipping.");
  continue;
}

```

Let’s me run the scraper over and over again without repeating work.

### 💾 Save and Resume with last_batch.txt

```js
writeLastBatchIndex(currentBatchIndex);
```

On each batch, the script saves its progress. So even if I kill it, crash it, or lose power — it’ll
pick right back up where it left off.

---

## 🤯 The Difference

| Feature                       | Old Script ❌   | New Script ✅                |
| ----------------------------- | --------------- | ---------------------------- |
| One browser for all listings  | Yes             | No — fresh browser per batch |
| Timeout handling              | No              | Yes — fast fail and move on  |
| Resume support                | No              | Yes — `last_batch.txt`       |
| Re-scrape protection          | No              | Yes — skips done folders     |
| Batching                      | No (1 big loop) | Yes — smaller and stable     |
| Reliable over 1,000+ listings | Unstable        | Solid and scalable 🚀        |

---

## 🚀 Final Thoughts

The first version was a cool proof-of-concept, but the new version is a production-grade scraper I
can actually trust. It’s crash-safe, restartable, and skips already-processed listings.

If you're trying to scrape large datasets with Puppeteer and running into crashes, batching and
timeout management will save your sanity.

Want the final working code? [DM me on Twitter](https://www.twitter.com/bycoffeeanfun) or
[email me](mailto:hello@robertgabriel.ninja), happy to share!
