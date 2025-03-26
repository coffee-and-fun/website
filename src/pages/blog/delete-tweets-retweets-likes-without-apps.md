---
new: true
submit: false
footer: true
header: true
layout: templates/post.liquid
title: 🧼 Delete Your Tweets, Retweets & Likes Without Installing Anything
description: Want to clean up your Twitter without giving access to third-party apps? This simple script lets you delete tweets, unretweet, and unlike right from Chrome — and it even pauses to avoid rate limits.
keywords: Twitter Cleanup, JavaScript Tools, Chrome Console, Delete Tweets, Unretweet, Unlike Tweets, Coffee and Fun, Social Media Tools, Clean Timeline, Rate Limit Safe, Local Tools, No Apps Needed
url: blog/delete-tweets-retweets-likes-without-apps/
isBlog: true
blog_cat: Tools
youtubeId:
cardTitle: 🧼 Delete Your Tweets, Retweets & Likes Without Installing Anything
blog_snip: A simple, browser based script that lets you delete tweets, unretweet, and unlike, no installs, no apps, just your browser and a little Coffee & Fun magic.
name: Robert James Gabriel
img: /assets/images/blog/delete-tweets-retweets-likes-without-apps.png
date: 2025-03-25T00:00:00.000Z
time: 6 min
tags:
  - tools
  - code
  - twitter
  - cleanup
  - productivity
  - browser
---



Alright. So sometimes you just want to clean house on Twitter. Not delete your whole account or go full digital detox. Just quietly remove some old tweets, un-retweet some stuff, maybe clean out your likes.

You know, like a vibe reset.

The problem is, Twitter doesn’t make that easy. There’s no bulk unlike or tweet deletion tool, and the third-party apps that offer it usually want full access to your account. That didn’t sit right with us.

So we made a little script.

You can run it directly in Chrome, no installs, no logins, no weird extensions. And it’ll quietly start unliking, un-retweeting, and deleting your tweets while scrolling your profile for you.

And now? It’s even smart enough to pause when it hits Twitter’s action limit **or** when it sees those “try again later” warnings.

---

## ☕ What this script actually does

It works right inside your browser and mimics the clicks you’d normally do by hand. Here’s what it handles:

💔 **Unlikes tweets** you’ve previously liked  

🔁 **Un-retweets** any tweets you’ve shared  

🗑️ **Deletes** your original tweets (not retweets)  

⏬ **Scrolls the page** automatically so it keeps finding more stuff  

🧠 **Pauses after 50 actions** to avoid rate limits  

👀 **Watches for rate-limit messages** in the UI and pauses if needed

This is 100% local. It doesn’t send data anywhere, doesn’t log in to your account.

---

## 🛠️ How to use it in Chrome

### 1. Go to your Twitter profile  
Head to your own profile page. Where all your tweets, retweets, and likes are shown.

### 2. Open the Console  
Right-click anywhere on the page, click **Inspect**, then click the **Console** tab.

### 3. If Chrome blocks pasting code  
Type this into the console first and hit Enter:

```js

allow pasting

```

That just tells Chrome you’re cool with pasting code.


### 4. Paste in the script  
Now copy and paste the full script (below) into the console and press Enter. It’ll start doing its thing automatically  scanning, clicking, scrolling, and waiting when needed.


```js

// ☕ Coffee & Fun Twitter Cleanup Script (Now with Rate Limit Awareness!)

(async function cleanUpTwitter() {
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  const MAX_REQUESTS_PER_WINDOW = 50;
  const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  let requestCount = 0;
  let cycles = 0;
  const maxCycles = 20;

  async function waitForElement(selector, timeout = 5000) {
    const pollInterval = 100;
    let elapsed = 0;
    while (elapsed < timeout) {
      const el = document.querySelector(selector);
      if (el) return el;
      await delay(pollInterval);
      elapsed += pollInterval;
    }
    return null;
  }

  async function scrollPage() {
    window.scrollBy(0, 2000);
    await delay(1000);
  }

  async function handleRateLimit() {
    if (requestCount >= MAX_REQUESTS_PER_WINDOW) {
      console.log(`⏸️ You've hit about 50 actions. Twitter might rate-limit more. Taking a 15 minute break just to be safe.`);
      await delay(RATE_LIMIT_WINDOW_MS);
      requestCount = 0;
      console.log(`🔄 Back at it! Resuming cleanup now.`);
    }
  }

  async function processTweets() {
    const tweets = document.querySelectorAll(`[data-testid="cellInnerDiv"]`);
    console.log(`📦 Found ${tweets.length} tweets on screen. Scanning through them...`);

    for (const tweet of tweets) {
      try {
        const unlikeBtn = tweet.querySelector(`[data-testid="unlike"]`);
        if (unlikeBtn) {
          unlikeBtn.click();
          console.log("💔 Unliked a tweet");
          requestCount++;
          await delay(500);
          await handleRateLimit();
        }

        const unretweetBtn = tweet.querySelector(`[data-testid="unretweet"]`);
        if (unretweetBtn) {
          unretweetBtn.click();
          await delay(600);

          const dropdownItems = document.querySelectorAll(`[data-testid="Dropdown"] [role="menuitem"]`);
          if (dropdownItems.length > 0) {
            dropdownItems[0].click();
            console.log("↩️ Removed a retweet");
            requestCount++;
            await delay(1000);
            await handleRateLimit();
          }
        }

        const caretBtn = tweet.querySelector(`[data-testid="caret"]`);
        if (caretBtn) {
          caretBtn.click();
          await delay(600);
          const dropdown = await waitForElement(`[data-testid="Dropdown"]`);
          const menuItems = dropdown?.querySelectorAll(`[role="menuitem"]`);
          if (menuItems && menuItems.length > 0) {
            menuItems[0].click();
            console.log("🗑️ Clicked delete, waiting for confirmation...");
            const confirmDialog = await waitForElement(`[data-testid="confirmationSheetDialog"]`);
            const confirmBtn = confirmDialog?.querySelector(`[data-testid="confirmationSheetConfirm"]`);
            if (confirmBtn) {
              confirmBtn.click();
              console.log("✅ Deleted tweet");
              requestCount++;
              await delay(1000);
              await handleRateLimit();
            }
          }
        }
      } catch (err) {
        console.warn("🛑 Something went wrong while processing a tweet", err);
      }
    }
  }

  console.log("🚨 Starting your Twitter cleanup. This will automatically pause if you hit around 50 actions to avoid getting rate-limited.");

  while (cycles < maxCycles) {
    console.log(`📦 Cycle ${cycles + 1} of ${maxCycles}`);
    await processTweets();
    await scrollPage();
    cycles++;
    console.log(`✅ Done with cycle ${cycles}. Moving on...`);
  }

  console.log("🎉 All done! Your profile should be looking way cleaner now. Grab a coffee and enjoy.");
})();



```


### ⚠️ Quick heads-up
Twitter rate-limits around 50 actions per 15 minutes. This script auto-detects that and pauses.

You can stop the script at any time by refreshing the page.

Got a lot of tweets? Run it again later or let it chill for a bit between runs.

---


### Why we built this

We just wanted a way to clean up our Twitter without giving some random app full access to our account. This does everything locally, safely, and quietly.

You don’t have to delete your entire account to feel fresh. Sometimes just clearing out the old stuff is enough.

If it helped, feel free to share it or bookmark it for later.
And if you want an Instagram version next? Let us know, it might already be brewing.

Catch you next cleanup

**The Coffee & Fun crew ☕**