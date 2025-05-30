---
new: false
submit: false
footer: true
header: true
layout: templates/post.liquid
title: How to Ethically Hack Woobox Voting with Node.js and Puppeteer
description:
  Learn how to ethically automate voting on Woobox using Node.js and Puppeteer. This guide walks you
  through creating a voting script for educational purposes, exploring the mechanics of online
  voting and best practices for securing platforms.
keywords:
  'ethical hacking, Woobox voting automation, Node.js Puppeteer tutorial, automate online voting,
  Node.js scripting, Puppeteer guide, voting script tutorial, online voting security, ethical
  hacking guide, automate Woobox votes'
url: blog/ethically-hack-woobox-voting-node-puppeteer/
isBlog: true
blog_cat: Usecase
youtubeId: HqSjk8fC1tA
cardTitle: How to Ethically Hack Woobox Voting with Node.js and Puppeteer
blog_snip:
  Learn how to ethically automate voting on Woobox using Node.js and Puppeteer. This guide walks you
  through creating a voting script for educational purposes, exploring the mechanics of online
  voting and best practices for securing platforms.
name: Robert James Gabriel
img: /assets/images/blog/woobox.png
date: 2024-11-06T00:00:00.000Z
time: 5 min
tags:
  - social
  - guide
---

## Introduction

Online voting platforms like Woobox play a significant role in digital competitions and
community-driven events. In this blog, I'll walk through how I used [Node.js](https://nodejs.org/en)
and [Puppeteer](https://developer.chrome.com/docs/puppeteer) to explore a public voting system for a
cat photo contest hosted by Woobox.

This project demonstrates the use of automation to understand how online voting works, including URL
masking, vote management, and basic security measures. I left no stone unturned looking for an
exploit, as all winnings were going to support animal shelters.

## Understanding the URL Structure and Masking

One of the first things I noticed was that the voting platform was integrated into another site.
**Your Cat Backpack** but the actual voting page was hosted on [Woobox](https://woobox.com/). This
is a common practice, where a branded competition page (like
[https://yourcatbackpack.com/pages/entry-form-fhh-contest](https://yourcatbackpack.com/pages/entry-form-fhh-contest))
masks the original URL (in this case,
[https://woobox.com/rvm7pj/gallery](https://woobox.com/rvm7pj/gallery)). This practice allows a
brand to keep users on their own website, even though the voting system is managed by an external
provider.

The URL structure itself offered valuable clues

### Main Gallery

The URL [https://woobox.com/rvm7pj/gallery](https://woobox.com/rvm7pj/gallery) displays the entire
gallery of photos for the contest.

### Specific Photo URL

Each photo in the contest had a unique identifier, such as
[https://woobox.com/rvm7pj/gallery/xxxxxxxx](https://woobox.com/rvm7pj/gallery/xxxxxxxx), where
xxxxxxxx represents the specific photo ID.

Navigating to **https://woobox.com/rvm7pj/gallery/xxxxxxxx** directly loads a specific photo,
allowing us to vote for it without having to navigate through the entire gallery. This structure
made it easier to target specific entries.

## Using goto to Interact with Dynamic URLs

In Puppeteer, **page.goto(url)** is the core function to navigate to a URL. Because each photo had
its unique URL, I used **page.goto()** with a specific photo ID, which allowed the script to load a
particular photo’s voting page directly. This meant I could target multiple entries with different
photo IDs, making the process flexible for automating votes across several contestants.

Here’s how goto works in this context:

```js
await page.goto('https://woobox.com/rvm7pj/gallery/xxxxxxx');
```

By changing the URL in goto to include a different photo ID, the script can switch between entries,
automating votes for multiple photos without navigating back to the main gallery each time. This
saves time and reduces server requests, which helps avoid detection.

## Automating the Voting Process with Random Data

Woobox required a name and email address for each vote, but there was no login required, meaning
anyone could submit a vote with minimal information. Here’s how I automated this process:

### Generate Random Names and Emails

To simulate unique users, I created a function to generate random first and last names, along with
randomized email addresses.

```js
function generateRandomData() {
	const firstNames = ['Alice', 'Bob', 'Charlie'];
	const lastNames = ['Smith', 'Johnson', 'Williams'];
	const emailProviders = ['gmail.com', 'yahoo.com', 'outlook.com'];

	const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
	const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
	const emailProvider = emailProviders[Math.floor(Math.random() * emailProviders.length)];
	const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}+${Math.floor(
		Math.random() * 1000
	)}@${emailProvider}`;

	return { firstName, lastName, email };
}
```

Each time the script runs, it generates a new name and email, which are then entered into the voting
form.

### Interacting with Form Elements

After navigating to the specific photo URL, I used Puppeteer’s **page.waitForSelector()** and
**page.type()** functions to fill in the form fields and submit the vote. Here’s how the core voting
automation looked:

```js
// Wait for the form, type in the generated data, and submit
const { firstName, lastName, email } = generateRandomData();
await page.type('input[name="voter_first"]', firstName);
await page.type('input[name="voter_last"]', lastName);
await page.type('input[name="voter_email"]', email);
await page.click('.vote-submit');
```

## Clearing Cookies, Cache, and Local Storage

Woobox attempted to limit voting frequency by storing data in cookies, cache, and localStorage,
which Puppeteer could clear before each vote. Clearing this data helps mimic the behavior of a fresh
user session.

### Clearing Cookies and Cache

Puppeteer provides commands to clear cookies and cache, which can be done via the Chrome DevTools
Protocol.

```js
const client = await page.target().createCDPSession();
await client.send('Network.clearBrowserCookies');
await client.send('Network.clearBrowserCache');
```

### Clearing Local Storage

I used **page.evaluate()** to clear **localStorage** and **sessionStorage** each time a vote was
submitted, bypassing local session restrictions.

```js
await page.evaluate(() => {
	localStorage.clear();
	sessionStorage.clear();
});
```

## How Woobox Could Strengthen Their Voting Security

After automating the process, a few areas where Woobox could add extra protections became clear:

### CAPTCHA Integration

A CAPTCHA system, such as Google’s reCAPTCHA, could effectively differentiate between automated and
genuine votes. By requiring a CAPTCHA, Woobox could limit automated access significantly.

### Email Verification

By verifying each email before counting a vote, Woobox could prevent users from using randomized or
throwaway emails. This could be done with a one-time password (OTP) or email confirmation.

### IP-Based Rate Limiting

Rate limiting based on IP addresses could prevent high volumes of requests from a single IP.
Additionally, implementing fingerprinting could help track users across sessions and limit repeated
votes.

### Session Timeouts and Browser Fingerprinting

Implementing session timeouts and advanced fingerprinting techniques (like analyzing screen
resolution, device type, etc.) could help identify repeat visitors or automated scripts, flagging
votes that appear automated.

## Conclusion

This project demonstrated how to automate form interactions with [Node.js](https://nodejs.org/en)
and [Puppeteer](https://developer.chrome.com/docs/puppeteer) while highlighting the security
limitations in online voting systems. In environments where voting is public and unrestricted,
automation can exploit these open structures if there are no safeguards like email verification or
CAPTCHA in place.

Using [Puppeteer](https://developer.chrome.com/docs/puppeteer) to interact with URLs, manage page
navigation, and simulate different user inputs offers a practical way to study web automation. By
implementing security best practices, voting platforms like Woobox can ensure fair participation and
prevent automation abuse, fostering a more trustworthy user experience.

```js
const puppeteer = require('puppeteer');
const LIMIT = 12;
const TARGET = 'https://woobox.com/rvm7pj/gallery/xxxxxxxx';
// Function to generate random name and email data
function generateRandomData() {
	const firstNames = [
		'Alice',
		'Bob',
		'Charlie',
		'Diana',
		'Eve',
		'Frank',
		'Grace',
		'Hank',
		'Ivy',
		'Jack',
		'Karen',
		'Liam',
		'Mona',
		'Nathan',
		'Olivia',
		'Paul',
		'Quincy',
		'Rachel',
		'Steve',
		'Tina',
		'Uma',
		'Victor',
		'Wendy',
		'Xander',
		'Yasmine',
		'Zane',
		'Aiden',
		'Bella',
		'Caleb',
		'Daisy',
		'Ethan',
		'Fiona',
		'George',
		'Holly',
		'Isla',
		'Jonas',
		'Kylie',
		'Leo',
		'Maya',
		'Noah',
		'Ophelia',
		'Piper',
		'Ronan',
		'Sophie',
		'Tristan',
		'Ursula',
		'Violet',
		'Wyatt',
		'Xena',
		'Yara',
		'Zara',
		'Abigail',
		'Brandon',
		'Charlotte',
		'Daniel',
		'Elena',
		'Finn',
		'Gina',
		'Hunter',
		'Irene',
		'Jordan',
		'Kara',
		'Logan',
		'Mason',
		'Nina',
		'Oscar',
		'Paige',
		'Reed',
		'Sara',
		'Theo',
		'Ulysses',
		'Vanessa',
		'Willow',
		'Xiomara',
		'Yosef',
		'Zoey'
	];

	const lastNames = [
		'Smith',
		'Johnson',
		'Williams',
		'Brown',
		'Jones',
		'Garcia',
		'Miller',
		'Davis',
		'Martinez',
		'Lopez',
		'Wilson',
		'Anderson',
		'Taylor',
		'Thomas',
		'Hernandez',
		'Moore',
		'Martin',
		'Jackson',
		'Thompson',
		'White',
		'Harris',
		'Clark',
		'Lewis',
		'Walker',
		'Hall',
		'Allen',
		'Young',
		'King',
		'Scott',
		'Green',
		'Adams',
		'Baker',
		'Gonzalez',
		'Nelson',
		'Carter',
		'Mitchell',
		'Perez',
		'Roberts',
		'Turner',
		'Phillips',
		'Campbell',
		'Parker',
		'Evans',
		'Edwards',
		'Collins',
		'Stewart',
		'Sanchez',
		'Morris',
		'Rogers',
		'Reed',
		'Cook',
		'Morgan',
		'Bell',
		'Murphy',
		'Bailey',
		'Rivera',
		'Cooper',
		'Richardson',
		'Cox',
		'Howard',
		'Ward',
		'Torres',
		'Peterson',
		'Gray',
		'Ramirez',
		'James',
		'Watson',
		'Brooks',
		'Kelly',
		'Sanders',
		'Price',
		'Bennett',
		'Wood',
		'Barnes',
		'Ross',
		'Henderson',
		'Coleman',
		'Jenkins',
		'Perry',
		'Powell',
		'Long',
		'Patterson',
		'Hughes',
		'Flores',
		'Washington',
		'Butler',
		'Simmons',
		'Foster',
		'Gonzales'
	];

	const emailProviders = [
		'gmail.com',
		'yahoo.com',
		'outlook.com',
		'hotmail.com',
		'mail.com',
		'aol.com',
		'protonmail.com',
		'icloud.com',
		'gmx.com'
	];

	const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
	const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
	const emailProvider = emailProviders[Math.floor(Math.random() * emailProviders.length)];
	const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}+${Math.floor(
		Math.random() * 1000
	)}@${emailProvider}`;

	return { firstName, lastName, email };
}

// Delay function for random wait times
function delay(time) {
	return new Promise((resolve) => setTimeout(resolve, time));
}

// Main function to automate the voting process
async function automateVoting() {
	const browser = await puppeteer.launch({
		headless: true, // Set to true to run in the background
		args: ['--start-fullscreen', '--window-size=1920,1080']
	});

	for (let i = 1; i <= LIMIT; i++) {
		const page = await browser.newPage(); // Open a new page in the default context
		await page.setViewport({ width: 1920, height: 1080 });

		try {
			console.log(`Starting vote #${i}`);

			// Clear cookies, cache, and storage manually
			const client = await page.target().createCDPSession();
			await client.send('Network.clearBrowserCookies');
			await client.send('Network.clearBrowserCache');

			// Attempt to clear localStorage and sessionStorage, with a try-catch for restricted access
			try {
				await page.evaluate(() => {
					localStorage.clear();
					sessionStorage.clear();
				});
			} catch (error) {
				console.warn(`Unable to clear localStorage/sessionStorage for vote #${i}:`, error.message);
			}

			// Go to the target URL
			await page.goto(TARGET);

			// Wait for the vote button link to be visible and click it
			await page.waitForSelector('#gallery-media-container .btn.vote-button.gallery-media-vote', {
				visible: true
			});
			await page.evaluate(() => {
				const voteButton = document.querySelector(
					'#gallery-media-container .btn.vote-button.gallery-media-vote'
				);
				if (voteButton) voteButton.click();
			});

			// Random wait before interacting with the form
			await delay(1000);

			// Generate random form data
			const { firstName, lastName, email } = generateRandomData();

			// Fill out the form fields
			await page.type('input[name="voter_first"]', firstName);
			await page.type('input[name="voter_last"]', lastName);
			await page.type('input[name="voter_email"]', email);

			// Submit the form
			await page.click('.vote-submit');

			// Wait a few seconds to allow submission to process
			await delay(500);

			console.log(`Vote #${i} submitted successfully`);
		} catch (error) {
			console.error(`An error occurred on vote #${i}:`, error);
		} finally {
			// Close the page after each vote
			await page.close();
		}

		// Wait 30 seconds between votes to avoid detection
		//   await delay(1000);
	}

	// Close the browser after completing all votes
	await browser.close();
}

// Run the voting automation
automateVoting();
```
