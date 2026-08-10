---
new: true
submit: false
footer: true
header: true
layout: templates/post.liquid
title: "Lost Your Chrome Extension Signing Key?"
description: "How to generate a new RSA key pair for Verified CRX Uploads, send Google the right half, and store it so you never have to do this again. With the exact commands."
keywords:
  chrome extension lost private key, verified crx upload, chrome web store key rotation,
  generate chrome extension private key, openssl chrome extension, crx signing key, Coffee & Fun LLC
url: blog/chrome-extension-lost-private-key/
isBlog: true
blog_cat: Usecase
youtubeId:
cardTitle: "We Lost Our Chrome Extension Signing Key. Here's the Fix."
name: Robert James Gabriel
img: /assets/images/blog/chrome-extension-lost-private-key.png
date: 2026-10-26T12:00:00.000Z
time: 8 min
tags:
  - usecase
  - Chrome Extensions
  - development
---

We lost the private key for one of our extensions.

Not deleted, not leaked. Just gone, in that ordinary way where a machine gets replaced and a file that lived outside the repo goes with it. The first sign was an upload being rejected for a key mismatch, which is exactly what Verified CRX Uploads is designed to do.

The good news, which took us an email exchange to learn: **this is recoverable.** Chrome Web Store support can rotate the key. You generate a new pair, send them the public half, and they swap it over.

Here is the whole process, with the commands, mostly so we have it written down the next time.

## What the key actually does

Verified CRX Uploads is an opt-in security feature. Once it's on, [any upload not signed by your key is rejected](https://developer.chrome.com/blog/verified-uploads-cws). The point is that someone who compromises your Google account still cannot ship a malicious update, because they don't have your key.

That is a genuinely good feature. It is also, by design, a feature that locks *you* out when you lose the key, because a security control that lets the owner talk their way past it isn't a security control.

**One thing worth knowing before you panic:** this signing key is not the key that determines your extension's ID. When Chrome accepts your signed upload, it [repackages it with the existing private key before publication](https://developer.chrome.com/blog/verified-uploads-cws), so the extension ID and Chrome's own signature stay put. Rotating your signing key does not orphan your users or reset your install base.

## What it looks like when it goes wrong

You won't get a helpful error. The upload is simply refused for a key mismatch, and if you've forgotten the feature is switched on, the message reads like a Web Store fault rather than a you fault.

This is the same category of problem as [needing to roll back a version](/blog/how-to-rollback-chrome-extension-version/) or [cancelling a submission that's stuck in review](/blog/how-to-cancel-chrome-web-store-submission/): entirely solvable, poorly signposted, and you learn the process at the exact moment you least want to be learning anything.

Open a support case early. The thread we were on had already been waiting since the 4th, because the first reply landed in a spam folder. Check there before you assume nobody has answered.

## Can't you just publish a new extension instead?

Technically yes, and it's almost always the wrong call.

A new listing means a new extension ID, which means:

- **Your existing users don't migrate.** They stay on the old extension, which you can no longer update. They won't get security fixes and most will never notice there's a successor.
- **Your reviews and rating reset to zero.** Years of accumulated signal, gone.
- **Your install count restarts.** Which affects ranking, which affects installs.
- **Any code referencing your extension ID breaks.** Native messaging hosts, `externally_connectable` entries in other extensions, allowlists.

Waiting a week for key rotation is cheap next to that. The only case where a fresh listing makes sense is one you were going to rebrand anyway.

## Step 1: Generate a new key pair

One command, from [Chrome's own documentation](https://developer.chrome.com/docs/webstore/update):

```bash
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out privatekey.pem
```

That's an RSA 2048-bit key. Not 4096, not an elliptic curve, and not whatever your instinct says is more secure. The CRX format expects RSA, so use what's documented.

Run it somewhere that isn't your repo. Your home directory is fine for the next five minutes.

## Step 2: Extract the public key

```bash
openssl rsa -in privatekey.pem -pubout -out publickey.pem
```

Without `-out` it prints to your terminal, which is fine if you want to look at it. With `-out` you get a file you can attach to an email.

You'll get something like this:

```
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----
```

That block is what Google asked for. Either the PEM file or the string works.

## Step 3: Know which half you are sending

Stop here for a second, because this is the step where people cause themselves a real problem.

**You send `publickey.pem`. You never send `privatekey.pem`.**

The names make this sound obvious and it is still worth checking, because the two files sit next to each other, look similar at a glance, and differ by one word in the header:

| File | Header | Who gets it |
|---|---|---|
| `publickey.pem` | `BEGIN PUBLIC KEY` | Google, and anyone else who asks |
| `privatekey.pem` | `BEGIN PRIVATE KEY` | Nobody, ever |

Open the file and read the first line before you attach it. If it says PRIVATE, you have the wrong file.

If you do send a private key to anyone, treat it as compromised, generate a fresh pair, and start this process again. There is no un-sending it.

## Step 4: Check the pair actually matches

Worth thirty seconds, because discovering a mismatch after a week of waiting would be miserable:

```bash
openssl rsa -in privatekey.pem -pubout -outform DER | openssl dgst -sha256
openssl rsa -pubin -in publickey.pem -outform DER | openssl dgst -sha256
```

Two identical hashes means the public key you're about to send belongs to the private key you're about to keep. Different hashes means you've got files from two different runs mixed up.

## Step 5: Send it and wait

Reply to your support thread with the public key attached or pasted in. In our case the reply was "once you have the new public key ready, let me know, and I will escalate this request to our team promptly."

Then wait. Chrome's docs are blunt about the timeline: lose your key and [replacement can take up to one week](https://developer.chrome.com/docs/webstore/update). Plan releases around that rather than hoping.

## Step 6: Sign your next upload with it

Once the rotation lands, every package update has to be signed with the new key. From the terminal:

```bash
google-chrome --pack-extension=/path/to/extension/root --pack-extension-key=privatekey.pem
```

That produces a `.crx` you upload instead of a zip. You can also do it from Chrome's Extensions page with **Pack extension**, pointing at the same key file.

If an upload gets rejected after this, the usual cause is signing with the old key file that's still sitting in your downloads folder. Delete the old one once the new key is live, so there's only one candidate.

## Step 7: Store it so this does not happen twice

This is the part we got wrong, so let's be specific about what "properly" means.

**Put it in your password manager.** Not a folder called `keys`, not Desktop, not a note. A password manager entry, as a file attachment or a pasted secret, with the extension name in the title. It syncs, it's encrypted, and it survives the laptop being replaced, which is the exact failure that got us here.

**Never commit it.** Add `*.pem` to `.gitignore` before you generate anything. A private key in a public repo is a live incident, not an untidy commit, and rewriting history does not help once it's been cloned.

**For CI, use a secret, not a file.** Base64 the key, store it as an encrypted secret, and decode it at build time:

```bash
base64 -i privatekey.pem | pbcopy   # macOS
base64 -w 0 privatekey.pem          # Linux
```

**Write down where it is.** In your team docs, in the repo's README, wherever you'd actually look. "The key is in 1Password under Extension Signing" is a sentence that would have saved us a fortnight.

While you're in there, this is a reasonable moment to check the rest of your extension's housekeeping. Our [icon resizer](/chrome-extension-icon-generator/) covers the sizes the store asks for, if that's the next thing on your list.

## What we would do differently

Two things, and neither of them is "turn the feature off."

**Test the recovery path when you set it up.** The moment you enable verified uploads is the moment to ask where the key lives and whether anyone else can reach it. That question has an easy answer on day one and an expensive one two years later.

**Treat it like any other credential that gates a release.** It's not extension config, it's a key that determines whether you can ship. It belongs wherever your other release credentials live, with the same backup rules.

The feature is doing its job. We'd rather have a week of downtime than an attacker with an upload path into an extension that runs on other people's browsers. But it is worth understanding, before you opt in, that "only the key holder can publish" includes the case where the key holder briefly isn't you.

---

## Sources

- [Verified uploads in the Chrome Web Store](https://developer.chrome.com/blog/verified-uploads-cws), Chrome for Developers, for how verified uploads work and the repackaging behaviour. Checked 10 August 2026.
- [Update your Chrome Web Store item](https://developer.chrome.com/docs/webstore/update), Chrome for Developers, for the key generation, public key extraction and packing commands, and the one week replacement timeline. Checked 10 August 2026.
