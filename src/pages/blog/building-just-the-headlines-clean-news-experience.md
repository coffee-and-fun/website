---
new: false
submit: false
footer: true
header: true
layout: templates/post.liquid
title: Building Just the Headlines - Why I Created a Clean News Experience
description:
  I got tired of modern news websites with their ads, pop-ups, and information overload. So I built something different - a clean, minimal news site that shows just the headlines without all the noise. Here's how I did it with Node.js, Eleventy, and free APIs.
keywords:
  'clean news website, minimal news aggregator, Node.js news scraper, Reddit API news, Hacker News API, static site generator, Eleventy news site, Vue.js news app, GitHub Actions automation, ad-free news, news without ads, simple news reader, headlines only news site, Coffee and Fun'
url: blog/building-just-the-headlines-clean-news-experience/
isBlog: true
blog_cat: Development
cardTitle: Building Just the Headlines - A Clean News Experience
blog_snip:
  "I got tired of modern news websites with their ads, pop-ups, and information overload. So I built something different - a clean, minimal news site that shows just the headlines without all the noise. Here's the technical story of how I built it with Node.js, free APIs, and static site generation."
name: Robert James Gabriel
img: /assets/images/blog/just-the-headlines.png
date: 2025-07-01T00:00:00.000Z
time: 8 min
tags:
  - development
  - nodejs
  - web
  - news
  - minimal
---


I got tired of modern news websites. You know what I'm talking about - you click on a headline and suddenly you're drowning in ads, pop-ups, cookie banners, newsletter signup forms, and autoplay videos. All you wanted was to read the news, but instead you're playing digital whack-a-mole with intrusive elements.

So I built something different: **Just the Headlines**.

## The Problem with News Today

Modern news consumption is broken. Here's what frustrated me:

**Information Overload**: Most news sites bombard you with dozens of stories, infinite scroll, and related articles that pull you into rabbit holes. Sometimes you just want to catch up quickly.

**Ad Hell**: News sites are basically advertising platforms that happen to have some journalism sprinkled in. The ads often take up more screen space than the actual content.

**Clickbait Everything**: Headlines are written to generate clicks, not inform. You end up clicking through multiple articles just to find out what actually happened.

**Slow and Bloated**: News sites load slowly because they're packed with tracking scripts, ad networks, and unnecessary features.

I wanted something simpler. Just give me the headlines. Let me decide what's worth my time.

## What I Built

Just the Headlines is exactly what it sounds like - a clean, minimal website that shows you news headlines without all the noise. Here's what makes it different:

### Clean Design
No ads. No pop-ups. No autoplay videos. Just headlines in a simple, readable format with plenty of white space. It loads instantly and gets out of your way.

### Smart Categorization
Instead of overwhelming you with everything at once, I organized news into clear categories:
- 🌍 General world news
- 💻 Technology updates
- 🏈 NFL, 🏀 Basketball, ⚽ Soccer, ⚾ Baseball
- 🎬 Entertainment, 🎵 Music, 🎮 Gaming
- And more

You can filter to exactly what interests you, or view everything at once.

### Quality Sources
I pull from trusted sources like Hacker News for tech content and Reddit communities for different topics. Each source gets a credibility score so you know what you're reading.

### Smart Features
The site automatically identifies trending stories and popular articles. It shows you how long ago something was posted and estimates reading time. Articles that are actually breaking news get highlighted.

## How It Actually Works (The Technical Details)

The whole system is built around a simple Node.js script that collects news and a static website that displays it. Here's how each piece works:

### The Node.js News Scraper

The heart of the system is a Node.js script (`news-scraper.js`) that runs every few hours to collect fresh headlines. Here's what it does:

**Data Sources**: Instead of paying for expensive news APIs, I use free sources:
- Hacker News API for quality tech content
- Reddit's JSON endpoints for different communities
- Each source covers different categories (tech, sports, entertainment, etc.)

**Smart Fetching**: The script includes built-in protections:
- Rate limiting to avoid getting blocked
- Retry logic for failed requests
- Browser-like headers to appear human
- Different delays for different sources (Reddit needs more time between requests)

**Data Processing**: Raw data gets cleaned up:
- Filters out self-posts and Reddit internal links
- Standardizes the format (headline, link, source, category, timestamp)
- Removes duplicates based on URL
- Adds metadata like when it was fetched

**Output**: Everything gets saved as a single `news.json` file with about 225 articles across 14 categories.

### The Configuration

The scraper is configurable without touching code:

```javascript
const CONFIG = {
  OUTPUT_DIR: './src/_data',     // Where to save the JSON
  ARTICLES_PER_SOURCE: 15,       // How many per source
  DELAY_BETWEEN_REQUESTS: 2000,  // Rate limiting
  REQUEST_TIMEOUT: 15000         // How long to wait
};
```

### Source Management

Each news source is defined as an object with:
- **URL**: Where to fetch data from
- **Parser**: Function to convert raw data into our format
- **Category**: What type of news this represents

For example, here's how Hacker News works:

```javascript
{
  name: 'Hacker News',
  url: 'https://hacker-news.firebaseio.com/v0/topstories.json',
  parser: async (data) => {
    // Gets list of story IDs, then fetches each story individually
    // Filters for stories with external URLs
    // Returns formatted article objects
  }
}
```

Reddit sources are simpler since they provide everything in one request:

```javascript
{
  name: 'Reddit Technology',
  url: 'https://old.reddit.com/r/technology/hot.json?limit=25',
  parser: async (data) => {
    // Filters out self-posts and Reddit links
    // Maps Reddit data to our article format
  }
}
```

### Error Handling

The script is designed to keep working even when things go wrong:
- If one source fails, others continue
- Network errors trigger automatic retries
- Rate limiting gets detected and handled gracefully
- The script logs everything so you can see what happened

### The Website Integration

The brilliant part is how this connects to the website. Instead of building a complex backend, I use **Eleventy** (a static site generator) with the `_data` folder approach:

1. **Scraper saves** to `src/_data/news.json`
2. **Eleventy builds** the site with that data pre-loaded
3. **Website renders** with all articles instantly available
4. **No API calls** needed when users visit

This means:
- Lightning fast loading (no waiting for API calls)
- Works offline once loaded
- Costs almost nothing to host
- No complex server infrastructure needed

### The Frontend

The website uses Vue.js for interactivity, but all the data is pre-loaded:

```javascript
// Data comes from Eleventy's _data processing
allArticles: {{ news | json }}, // Direct from news.json

// No loading states needed!
isLoading: false,
```

The Vue app handles:
- Category filtering
- Trending article detection
- Time formatting ("2h ago")
- Credibility scores for sources
- Smart sorting (trending first, then by date)

### Automation

The whole thing runs automatically using GitHub Actions:

1. **Scheduled trigger** runs every 3 hours
2. **Scraper runs** and collects fresh headlines
3. **Eleventy builds** the updated site
4. **Netlify deploys** the new version automatically

The workflow file is simple:
```yaml
- name: Run news scraper
  run: npm run scrape

- name: Build site
  run: npm run build

- name: Deploy
  uses: netlify/actions/build@master
```

## Why This Architecture Works

### Performance
- Static files load instantly
- No database queries during page loads
- CDN can cache everything aggressively
- Works great on slow connections

### Reliability
- If the scraper fails, the old version keeps working
- No moving parts during user visits
- Static sites rarely go down
- Simple systems break less often

### Cost
- GitHub Actions: Free for public repos
- Netlify hosting: Free tier handles this easily
- APIs: All free (Hacker News, Reddit)
- Total monthly cost: $0

### Maintenance
- No servers to patch or maintain
- No databases to backup
- Simple code is easy to debug
- Set it up once and it keeps working

## What I Learned Building This

### Start Simple, Stay Simple
I could have built user accounts, personalization, comments, and social features. But the core value is "clean headlines without distractions." Every feature I didn't add keeps it focused.

### Static Sites Are Powerful
Modern static site generators give you dynamic features without the complexity. Pre-generating everything means users get instant loading without sacrificing functionality.

### Free Doesn't Mean Limited
Using free services forced creative solutions that ended up being better than paid alternatives. Constraints often lead to better design.

### Performance Is a Feature
A site that loads in under a second feels magical compared to bloated news websites. Users absolutely notice the difference.

### Automation Saves Time
Setting up proper automation meant I could build it once and forget about it. The site updates itself without any manual work.

## The Results

Just the Headlines does exactly what I wanted:
- Loads in under a second
- Shows ~225 fresh headlines across 14 categories
- No ads or distractions
- Works perfectly on phones and desktops
- Updates automatically throughout the day
- Costs nothing to run

More importantly, it changed how I consume news. Instead of getting sucked into endless scrolling, I can quickly scan headlines, click on what interests me, and move on with my day.

## Try It Yourself

You can check out Just the Headlines at [coffeeandfun.com/headlines](https://coffeeandfun.com/headlines).

The code concepts are all standard web technologies - Node.js for data collection, static site generation, and basic automation. The key insight is that sometimes the best solution to information overload is just presenting less information, but presenting it really well.

If you want to build something similar:
1. Start with a simple Node.js scraper for your data sources
2. Use a static site generator (Eleventy, Next.js, Gatsby, etc.)
3. Set up automation with GitHub Actions
4. Deploy to a free hosting service
5. Focus on making it fast and simple

The whole thing can be built in a weekend and will keep working for years with minimal maintenance.
