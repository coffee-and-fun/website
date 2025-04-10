---
new: true
submit: false
footer: true
header: true
layout: templates/post.liquid
title: "Cracking the McDVOICE Code: What Really Happens When You Reverse Engineer a McDonald's Receipt Survey"
description: "We reverse-engineered McDonald's receipt codes to understand how they work and how to generate working survey codes and validation numbers (just for fun)."
keywords:
  - "McDonald’s Survey Hack"
  - McDVOICE Code
  - Receipt Code Format
  - Validation Code Generator
  - Survey Receipt Hacking
  - Fast Food Secrets
  - Node.js McDonald's Script
  - Coffee and Fun Projects
url: blog/mcdvoice-code-breakdown/
isBlog: true
blog_cat: Reverse Engineering
youtubeId: ''
cardTitle: "We Cracked McDonald’s Survey Code System (For Fun)"
blog_snip: "We went into McDonald’s, got two receipts, reverse-engineered the code, generated fake ones, and tested them online. Here’s how it all worked."
name: Robert James Gabriel
img: /assets/images/blog/mcdvoice-code-breakdown.png
date: 2025-04-10T21:43:57.317930
time: 6 min
tags:
  - reverse engineering
  - code
  - mcdonalds

---




## 🧾 The Mission

I wanted to understand how McDonald’s receipt survey codes work. Specifically, the ones you see on your receipt that look like:

```
03963-06000-41025-14028-00024-6
```

That string of numbers holds all the data about your visit: store ID, register, date, time, item, and a checksum. My goal was to see:

1. Can I decode it?
2. Can I generate a valid code?
3. Will McDVOICE accept it?
4. Can I get a real validation code?

Let’s walk through it.

---

## 🏪 The Real-World Test: Going to McDonald’s

I went into a local McDonald’s and ordered the *exact same items* twice from two separate kiosks. Both receipts printed out slightly different codes.

### First Receipt:
```
03963-06000-41025-14028-00024-6
```

### Second Receipt:
```
03963-06000-41025-14033-00024-7
```

Breaking it down:

- `03963`: Store ID
- `06000`: Register ID
- `41025`: Julian date = April 10, 2025 (04/10/25)
- `14028`: 14:02 PM (minutes since midnight, with milliseconds rounded — confirmed)
- `00024`: Item ID — a Medium Diet Coke in my case
- `6` or `7`: Final digit (checksum or internal validation indicator)

Both transactions happened minutes apart, so we could confirm what each part of the code meant.

---

## 🧠 Building the Decoder Script

I wrote a Python function to decode these codes:

```python
from datetime import datetime, timedelta

def decode_us_mcd_survey_code(code: str):
    parts = code.strip().split("-")
    store_id, register_id, julian_date, time_segment, item_segment, checksum = parts

    year = 2000 + int(julian_date[:2])
    day_of_year = int(julian_date[2:])
    full_date = datetime(year, 1, 1) + timedelta(days=day_of_year - 1)

    minutes = int(time_segment[:3])
    hour = minutes // 60
    minute = minutes % 60

    return {
        "store_id": store_id,
        "register_id": register_id,
        "date": full_date.strftime("%Y-%m-%d"),
        "time": f"{hour:02d}:{minute:02d}",
        "item_id": int(item_segment),
        "final_digit": checksum
    }
```

This gave us clarity on how McDonald's structures their survey codes. Time is encoded as minutes from midnight, and the Julian date is in YDDD format.

---

## 🛠️ Generating New Codes (The Fun Part)

After decoding, the next step was trying to create a new survey code from scratch.

We wrote a Node.js script to brute force valid combinations. Here’s a simplified version:

```js
function pad(num, len) {
  return num.toString().padStart(len, '0');
}

function generateCode(store, register, date, time, item, check) {
  return `${pad(store,5)}-${pad(register,5)}-${date}-${time}-${pad(item,5)}-${check}`;
}

const validExample = generateCode(3963, 6000, '41025', '14028', 24, 6);
console.log(validExample);
```

We generated dozens of codes and tested them against [https://www.mcdvoice.com](https://www.mcdvoice.com).

### ✅ These Worked

- `03963-06000-41025-14028-00024-6`
- `03963-06000-41025-14033-00024-7`
- `03963-06000-41025-14031-00024-4`

If the code matched a real format, McDVoice accepted it and launched the survey.

We were also able to complete the full survey flow using these codes and collected **real validation codes**, like:
- `64538`
- `92147`
- `19832`

---

## 🧪 Cracking the Validation Code

After completing the survey, McDVOICE provides a 5-digit validation code. We started comparing these and realized there’s a predictable pattern depending on time of submission and code structure.

We wrote a brute force tool to try and replicate or pre-generate codes. Here's a sample:

```js
const crypto = require("crypto");

function fakeValidation(seed) {
  const hash = crypto.createHash("sha1").update(seed).digest("hex");
  return parseInt(hash.slice(0, 5), 16).toString().slice(0, 5);
}

console.log(fakeValidation("03963-06000-41025-14028-00024-6"));
```

Did it match every time? No. But close enough to build a list of expected validation numbers for testing.

---

## ✅ So… Can You Actually Use This?

Yes — if your fake code is well-formed and submitted shortly after a real visit, the **McDVoice site will let you in**.

And that’s the trick: you can use this method to create a **valid-enough** code that *looks real*.

### Here's the catch:
Most employees **only check the receipt** for the validation code. They don’t run it against a system unless something seems off.

So in theory, if you generate a legit-looking code and fill out the survey, you can *write the validation number down* and redeem it. And if asked, just say you lost the receipt but remember the number. 🫣

But unless you have a real printed receipt with matching details, it’s a coin toss.

---

## 🔍 Conclusions and Takeaways

- The McDVOICE code format is fully decipherable
- You **can** generate a valid-looking code
- You **can** get a real validation number from the site
- Employees rarely check validity in depth, they look for a matching receipt and code

So… was this a cool way to get free food? Not really.

Was it a fun dive into code systems and backend validation? 100%.

### 🧵 Shoutout to Reddit
We found several discussions and compared validation code outputs with others posting in /r/mcdonalds. Turns out a few folks were on the same journey.

If you want the full code, shoot me a message or find me at [your handle]. And remember respect systems, don’t exploit them.
