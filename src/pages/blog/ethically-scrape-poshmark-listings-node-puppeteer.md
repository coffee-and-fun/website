---
new: false
submit: false
footer: true
header: true
layout: templates/post.liquid
title: How I Scraped 20,000 Poshmark Listings Using Node.js and Puppeteer
description: Learn how I scraped and backed up 20,000 listings from a Poshmark store using Node.js and Puppeteer. This guide explains the full process, includes code, and helps you recover public listing data for educational or personal use.
keywords: "ethical scraping, Poshmark backup, Node.js Puppeteer tutorial, Poshmark automation, online listing backup, ethical scraping guide, Puppeteer project, ecommerce recovery, scraping listings Node.js"
url: blog/ethically-scrape-poshmark-listings-node-puppeteer/
isBlog: true
blog_cat: Usecase
cardTitle: How I Scraped 20,000 Poshmark Listings Using Node.js and Puppeteer
blog_snip: Learn how I scraped and backed up 20,000 listings from a Poshmark store using Node.js and Puppeteer. This guide explains the full process, includes code, and helps you recover public listing data for educational or personal use.
name: Robert James Gabriel
img: /assets/images/blog/ethically-scrape-poshmark-listings-node-puppeteer.png
date: 2025-03-28T00:00:00.000Z
time: 6 min
tags:
  - scraping
  - guide
  - puppeteer
---



## 🧠 What Happened

A friend of mine recently got locked out of their Poshmark store. They had built up over **20,000 listings** over the years — detailed titles, prices, photos, descriptions, the whole deal. But with no way to log in and no official export tool, they had no way to get it all back.

So I built them a script to do exactly that, ethically.

This post walks through how I used **Node.js** and **Puppeteer** to scrape and back up every listing from a public Poshmark store, complete with images, folders, and a full CSV file. You can run it for your own store, or to help a friend who needs it.

---

## 🧰 What You’ll Need

- Node.js installed
- A code editor (VS Code is great)
- A terminal
- The Poshmark store URL (like `https://poshmark.com/closet/jscola10`)

---

## 🧪 What This Script Does

This script automates the following:

1. Visits the Poshmark store
2. Scrolls to load every listing
3. Clicks each listing, one by one
4. Scrapes the title, price, description, and images
5. Saves everything to folders
6. Compiles a clean `listings.csv` with everything

It mimics human browsing and respects site structure — no flooding, no abuse, and no logins needed.

---

## 🧑‍💻 Installing Puppeteer

First, create a folder and install Puppeteer:

```bash
npm init -y
npm install puppeteer
```

Then create a file:

```bash
touch poshmark_scraper.js
```

---

## 📜 The Code

Here’s the full script:

You can download it [here](https://github.com/coffee-and-fun/poshmark_scrapper) or paste it directly into `poshmark_scraper.js`.


```js

const puppeteer = require("puppeteer");
const PAGE_TO_STEAL_FROM = "https://poshmark.com/closet/xxxxxx";
const https = require("https");



const fs = require("fs");
const path = require("path");
const csvPath = path.join(__dirname, 'listings.csv');
const maxImagesPerListing = 20; // adjust if you want more/less columns

const csvHeaders = [
    'Title',
    'URL',
    'Current Price',
    'Description',
    'Folder',
    'Image Count',
    ...Array.from({ length: maxImagesPerListing }, (_, i) => `Image ${i + 1}`)
];

const csvRows = [];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const BASE_SAVE_DIR = path.join(__dirname, "poshmark_listings");

if (!fs.existsSync(BASE_SAVE_DIR)) {
    fs.mkdirSync(BASE_SAVE_DIR);
}

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https
            .get(url, (response) => {
                response.pipe(file);
                file.on("finish", () => {
                    file.close(resolve);
                });
            })
            .on("error", (err) => {
                fs.unlink(filepath, () => { });
                reject(err);
            });
    });
}
(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(PAGE_TO_STEAL_FROM, { waitUntil: "networkidle2" });

    await sleep(5000);
    await page.waitForSelector('[data-test="closet_listings_count"]');

    const totalListings = await page.$eval(
        '[data-test="closet_listings_count"]',
        (el) => parseInt(el.innerText.replace(/[^0-9]/g, ""), 10)
    );
    console.log(`🧮 Total listings: ${totalListings}`);

    // Scroll function
    async function scrollUntilDone() {
        let prevCount = 0;
        let keepScrolling = true;

        while (keepScrolling) {
            await page.waitForSelector(".tiles_container.m--t--1");
            const visibleTiles = await page.$$eval(
                ".tiles_container.m--t--1 > div:not(.hide)",
                (tiles) => tiles.length
            );
            console.log(`📦 Loaded listings: ${visibleTiles}`);

            if (visibleTiles >= totalListings || visibleTiles === prevCount) {
                keepScrolling = false;
            } else {
                prevCount = visibleTiles;
                await page.evaluate(() =>
                    window.scrollTo(0, document.body.scrollHeight)
                );
                await sleep(3000);
            }
        }
    }

    await scrollUntilDone();

    const totalTileCount = await page.$$eval(
        ".tiles_container.m--t--1 > div:not(.hide)",
        (tiles) => tiles.length
    );

    for (let i = 0; i < totalTileCount; i++) {
        console.log(`🖱️ Clicking tile ${i + 1} of ${totalTileCount}`);

        try {
            // Refresh the list of tiles in case they’ve shifted after going back
            await scrollUntilDone();
            const tiles = await page.$$(".tiles_container.m--t--1 > div:not(.hide)");
            const tile = tiles[i];
            if (!tile) {
                console.warn(`⚠️ Tile ${i} not found, skipping...`);
                continue;
            }

            // Click and wait for listing to load
            await Promise.all([
                tile.click(),
                page.waitForNavigation({ waitUntil: "domcontentloaded" }),
            ]);

            await sleep(2000);

            // Scrape content
            const titleSelector = ".fw--light.m--r--2.listing__title-container";
            await page.waitForSelector(titleSelector, { timeout: 5000 });

            const title = await page.$eval(titleSelector, (el) =>
                el.innerText.trim()
            );
            const safeTitle = title.replace(/[\/\\?%*:|"<>]/g, "-").substring(0, 100);
            const folderPath = path.join(BASE_SAVE_DIR, safeTitle);
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath);
                console.log(`📁 Folder created: ${folderPath}`);
            }

            const priceWrapperSelector =
                ".listing__ipad-centered.d--fl.ai--c.m--t--5";
            await page.waitForSelector(`${priceWrapperSelector} .h1`, {
                timeout: 5000,
            });

            const { currentPrice } = await page.$eval(
                `${priceWrapperSelector} .h1`,
                (el) => {
                    const current = Array.from(el.childNodes)
                        .filter((node) => node.nodeType === Node.TEXT_NODE)
                        .map((node) => node.textContent.trim())
                        .join(" ")
                        .trim();

                    const original = el.querySelector("span")?.innerText.trim() || "N/A";

                    return {
                        currentPrice: current,
                    };
                }
            );

            const description = await page
                .$eval(".listing__description", (el) => el.innerText.trim())
                .catch(() => "N/A");
            const pageUrl = page.url();

            const textContent = `
Title: ${title}
URL: ${pageUrl}
Current Price: ${currentPrice}
Description:
${description}
      `.trim();

            const filePath = path.join(folderPath, `${safeTitle}.txt`);
            fs.writeFileSync(filePath, textContent, "utf-8");
            console.log(`📄 Text file saved: ${filePath}`);

            // 📸 Grab images inside the slideshow block
            // Gather local image paths
            const imageHandles = await page.$$(
                '.slideshow.slideshow--desktop .img__container--square.img__container img'
            );

            // Build full image paths (absolute)
            const imagePaths = [];

            for (let j = 0; j < imageHandles.length; j++) {
                try {
                    const imgSrc = await imageHandles[j].evaluate(img => img.getAttribute('src'));
                    const imgFileName = `${j + 1}.jpg`;
                    const imgPath = path.join(folderPath, imgFileName);
                    await downloadImage(imgSrc, imgPath);
                    imagePaths.push(imgPath); // Save full path
                    console.log(`🖼️ Saved image ${j + 1}: ${imgPath}`);
                } catch (err) {
                    console.warn(`⚠️ Could not save image ${j + 1}: ${err.message}`);
                }
            }

            // Pad missing image columns with empty strings
            const paddedImagePaths = [...imagePaths];
            while (paddedImagePaths.length < maxImagesPerListing) {
                paddedImagePaths.push('');
            }

            // Add to CSV
            csvRows.push([
                title,
                pageUrl,
                currentPrice,
                description.replace(/\n/g, ' '),
                safeTitle,
                imagePaths.length,
                ...paddedImagePaths
            ]);


            // Go back and wait for listings to reload
            await page.goBack({ waitUntil: "domcontentloaded" });
            await sleep(2000);
        } catch (err) {
            console.error(`❌ Error on tile ${i + 1}:`, err.message);
        }
    }


    // Write CSV file
    const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))
        .join('\n');

    fs.writeFileSync(csvPath, csvContent, 'utf-8');
    console.log(`📄 CSV saved: ${csvPath}`);

    console.log("🎉 All listings scraped");
    await browser.close();
})();



```




> ⚠️ Don’t forget to replace the username in the URL:
> `https://poshmark.com/closet/jscola10` with your own or the one you're backing up.

---

## ▶️ How to Run It

Just run:

```bash
node poshmark_scraper.js
```

It’ll open a browser window, scroll through the closet, click into each listing, grab the info, save the images and create the folders.

You’ll see:

- `/poshmark_listings/` with folders like `Red Nike Sneakers`
- Inside each folder:
  - A `.txt` file with the description, price, etc.
  - Images saved as `1.jpg`, `2.jpg`, etc.
- A CSV file with every listing and full image paths

---


## 🧠 How It Works (Behind the Scenes)

This script might look simple at a glance, but it actually handles some cool stuff under the hood — especially when you realize it’s mimicking human behavior in a really smooth way.

---

### 🌀 Scrolling Listings

Poshmark doesn’t load all listings at once — they load dynamically as you scroll. So the script uses this function:

```js
window.scrollTo(0, document.body.scrollHeight);
```

and does it in a loop, waiting between scrolls (`sleep(3000)`) to give the page time to load new listings. It also checks if no new tiles were added — which is a slick way of knowing, “hey, we’re done scrolling.”

This lets it work with **10 listings or 20,000** without changing anything. Super flexible.

---

### 🖱️ Clicking Each Listing

Instead of using hardcoded URLs (which don’t exist), it simulates a user clicking the listing tile. Then it waits for:

```js
page.waitForNavigation({ waitUntil: 'domcontentloaded' })
```

This tells Puppeteer to hang tight until the page is fully loaded — which is a great way to avoid scraping before the content is ready.

This also means it’ll work even if Poshmark updates their URL structure, as long as the page UI stays mostly the same.

---

### ✍️ Scraping the Data

Once inside a listing, it pulls:

- The title (used for naming folders)
- The current price (from the `.h1` that contains mixed elements)
- The description (if it exists — and gracefully skips it if not)
- The current URL (for linking back)
- All images from the slideshow (using `.img__container--square` containers)

What's neat here is how the price is scraped:
```js
Array.from(el.childNodes)
  .filter(n => n.nodeType === Node.TEXT_NODE)
  .map(n => n.textContent.trim()).join(' ')
```

That little snippet is low-key clever — it grabs just the visible price text and skips things like the original crossed-out price or embedded spans.

---

### 🖼️ Downloading Images

Instead of just copying the image URLs, it **downloads every image** and saves them into the folder with names like `1.jpg`, `2.jpg`, etc.

The download uses native Node.js `https` streams — so there are no external libraries or dependencies. Just clean, raw file writing:

```js
https.get(url, response => {
  response.pipe(file);
});
```

And it retries or skips gracefully if something fails — so the script doesn’t crash halfway through a big run.

---

### 🗂️ Organizing It All

The most satisfying part?

- A folder is created for every listing (named after the product title)
- Inside is:
  - A `.txt` file with the title, description, price, and link
  - The images
- And the CSV file includes everything, **even the full image paths** — so you can import it into a spreadsheet and sort/search easily
## 🛡️ Why It’s Ethical

All data is scraped **client-side** from publicly available listings. We don’t log in, spam, or go beyond normal use. This script is slow, respectful, and designed to help **you back up your own content** or help a friend recover theirs.

---

## 🧾 Final Thoughts

I built this tool to solve a real problem. If you're a seller on Poshmark, you deserve a way to own your own data. This script helps you do that safely and ethically — and it works.

Need help running it or want to export to Google Sheets, JSON, or even zip the folders? Let me know — happy to help.

Built with ☕️ and code by  
**The Coffee and Fun Team**