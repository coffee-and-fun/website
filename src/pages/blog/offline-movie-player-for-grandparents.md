---
new: true
submit: false
footer: true
header: true
layout: templates/post.liquid
title: "Offline Movie Player for Elderly Parents"
description: How I built an offline media player for two 85 year olds with no home internet. Kodi, Projectivy Launcher and a USB stick. One button, 48 films, no data used.
keywords:
  offline media player for elderly parents, Kodi offline setup, Google TV without internet,
  watch movies without internet, Projectivy Launcher setup, simple TV interface for seniors,
  Kodi local information only, Android TV replace launcher, offline movie player, yt-dlp,
  TMDb API artwork, Kodi nfo files, onn 4K Pro, accessible TV for older people
url: blog/offline-movie-player-for-grandparents/
isBlog: true
blog_cat: Usecase
youtubeId:
cardTitle: I Built an Offline Movie Player for My Wife's Grandparents
name: Robert James Gabriel
img: /assets/images/blog/offline-movie-player-for-grandparents.png
date: 2026-08-08T12:00:00.000Z
time: 15 min
tags:
  - accessibility
  - usecase
  - media
  - hardware
---

My wife's grandparents are 85. They have no home broadband, and they do not want any.

What they do have is a phone with a data allowance, and for about a year they had been tethering the television to it and watching old mystery films on YouTube. Charlie Chan. Sherlock Holmes. Black and white, 1930s and 1940s, the same twenty or so titles on rotation. Every month they went through their data. Every month someone had to sort it out.

Here is the thing that took me embarrassingly long to notice: they were not using the internet. They were using it to reach eight films. The internet was the toll road, not the destination.

So the brief was small and specific. A box that turns on, shows the films as posters, and plays them when you press the big round button. No apps. No accounts. No menus. No data. Nothing that breaks when the wrong thing gets pressed, because at 85 the wrong thing does get pressed, and then the television is "gone" and it is a phone call.

This post is how I built that. The films are interchangeable. The method is the useful part.

## Why the streaming box was the wrong shape

If you have set up a television for an older relative lately you know the problem. Modern TV interfaces are not designed to show you your things. They are designed to sell you a subscription. Every home screen is recommendations, autoplaying trailers, "continue watching" for something nobody watched, and a carousel of services you do not have. It is the [enshittification](/blog/the-enshittification-of-technology/) pattern applied to a living room.

For someone comfortable with technology that is annoying. For someone who is 85 and nervous about pressing anything, it is disabling. Every extra row is a chance to end up somewhere unfamiliar with no idea how to get back.

The goal was not a nicer media centre. It was **one screen, and no way to leave it**.

## The hardware

I used the [onn 4K Pro Streaming Device](https://www.walmart.com/ip/4K-PRO-STREAMING/18382213962), the 2026 Google TV model. It is cheap, which mattered: if this went wrong I wanted to be out very little.

What made it the right box:

- **32GB storage and 3GB RAM.** Enough headroom to install what I needed without it crawling.
- **A USB port.** This rules most streaming sticks out. The films live on a stick in the back, not in the cloud.
- **It runs Android TV underneath Google TV**, which means the home screen can be replaced. That is the whole trick.

Then the feature that mattered more than any spec: **there is a find-my-remote button on the box, and the remote is backlit.** Press it, the remote chirps until you find it down the side of the chair, and the buttons glow when you pick it up in a dim room.

I did not choose the box for that. It has been the most appreciated part of the entire build. If you are picking hardware for an older relative, weight it higher than you think you should.

## The two pieces of software

### Kodi makes the films look like a library

[Kodi](https://github.com/xbmc/xbmc) is free, open source media centre software. GPLv2, and it is on the Play Store.

Point it at a folder of video files and it builds a browsable library: posters, titles, year, plot, artwork. A shelf of films rather than a file manager.

Normally Kodi fetches all that from the internet. It does not have to. You can tell it to read everything from local files sitting next to the video, which means the library works with the network unplugged. That setting is the reason this project is possible.

### Projectivy Launcher makes Kodi the only thing they see

[Projectivy Launcher](https://play.google.com/store/apps/details?id=com.spocky.projengmenu) is a replacement home screen for Android TV and Google TV.

The stock Google TV home screen cannot be meaningfully cleaned up. You can nudge rows around, but the recommendations and sign-up prompts are the product.

Projectivy replaces it with a home screen you configure: you pick which apps appear, and everything else is not there. Crucially, it can **auto-launch an app on boot**.

That one feature turns a general purpose streaming box into a single purpose appliance. Power on, and Kodi is already open. There is no home screen to get lost on, because they never see one.

Kodi makes the films look right. Projectivy makes sure Kodi is all there is.

## Before you start

Gather these first. None of it is expensive.

| What | Why |
|---|---|
| The streaming box | The device itself |
| A USB stick, 32GB or larger | Where the films live. Format it FAT32, and read the 4GB gotcha before you do |
| A computer | For downloading and organising. I used a Mac |
| A Google account | Unavoidable, see step 1 |
| A free TMDb API key | For posters and backdrops |
| `yt-dlp` and `ffmpeg` | The downloader and the file checker |

On a Mac both tools are one command: `brew install yt-dlp ffmpeg`. `ffprobe`, which you need in step 5, comes with ffmpeg.

Budget an evening. Downloading is the slow part, and most of that is waiting.

## The build, step by step

### Step 1. Set up the box and strip it back

1. Run through the normal Google TV setup and sign in. **You cannot skip the Google account.** There is no way around it on this platform, so use an account you control rather than theirs.
2. Open the account settings and turn off every sync option.
3. Turn off personalised results and ad personalisation.
4. Turn off the screensaver.

That last one is not obvious and it matters. If Kodi dims while they are still deciding which film to watch, it looks exactly like the box has died. That is a phone call.

### Step 2. Install the two apps

1. From the Play Store, install **Kodi**.
2. From the Play Store, install **Projectivy Launcher**.
3. Open Projectivy and set it as the default launcher when prompted.

### Step 3. Make Kodi the only thing they ever see

This is the step that does the accessibility work.

1. In **Projectivy**, hide every app except Kodi. Anything still visible is somewhere an 85 year old can end up by accident.
2. In **Projectivy**, set Kodi to **launch on boot**.
3. In **Kodi**, set the startup window to the **Movies** library.

That third one is easy to miss. Without it Kodi opens on its own home screen, which has its own menu down the side, and you have carefully rebuilt the problem you were solving.

<!-- TODO: Robert, add the exact menu paths for the Projectivy auto-start setting and Kodi's startup window setting. You have the box in front of you and I would rather name the real paths than describe them. -->

### Step 4. Download the films

1. Find each film on YouTube or the [Internet Archive](https://archive.org/details/movies).
2. Download it with [yt-dlp](https://github.com/yt-dlp/yt-dlp), a command line downloader that pulls video from YouTube and thousands of other sites.
3. Pace yourself. Bulk downloading gets you rate limited, see the gotchas.

**Prefer the Archive.** Better quality copies, no rate limiting, and many of these titles are there precisely because they are public domain or long out of print.

### Step 5. Check that every file is actually the film

This is the most useful practical thing in this post.

**A successful download tells you nothing about what is inside the file.**

Several of mine completed perfectly and turned out to be two or three minute clips. A trailer. A scene someone uploaded. A "full movie" that was the first reel.

1. Run `ffprobe` on every file to get its duration.
2. Compare it against the film's real runtime.
3. Reject anything under 45 minutes.

That caught every bad file I had. Skip it and you find out when a grandparent selects Sherlock Holmes and gets 150 seconds of it.

### Step 6. Organise into Kodi's layout

One folder per film, with the video file inside named the same as the folder.

```
Sherlock Holmes/
  01 - The Hound of the Baskervilles (1939)/
    01 - The Hound of the Baskervilles (1939).mp4
    01 - The Hound of the Baskervilles (1939).en.srt
    poster.jpg
    fanart.jpg
    movie.nfo
```

This is not cosmetic tidiness. Without an NFO, Kodi identifies a film by parsing the folder name, so getting it wrong means a wrong match or no match.

I kept the leading series number on the folders, as above, because these are two long series and I wanted them in release order on disk. That is safe here only because every folder has a `movie.nfo` and the scraper is set to local files, so Kodi reads the NFO and never has to guess from the folder name. The number gets stripped from the title inside the NFO, which is what actually shows on screen. If you are not writing NFOs, drop the numbers and name the folders plain `Title (Year)`.

### Step 7. Generate the metadata and artwork

1. Get a free [TMDb API key](https://developer.themoviedb.org/docs/getting-started). It takes about two minutes from your account settings.
2. For each film, fetch the poster and the backdrop and save them into the film's folder as `poster.jpg` and `fanart.jpg`.
3. Write a `movie.nfo` in each folder with the title, year, plot, rating and the **TMDb ID**.

I used Claude Code to do all three across 48 folders. The prompt is in the next section.

That TMDb ID matters more than it looks. With it written into the NFO, Kodi cannot mis-match the film. There are four different films called *The Hound of the Baskervilles*. The ID removes the guessing.

### Step 8. Copy to the stick and point Kodi at it

1. Copy the whole folder tree to the USB stick.
2. Run `dot_clean /Volumes/YOURDRIVE` if you are on a Mac, then eject it. See the gotchas for why.
3. Plug the stick into the back of the box.
4. In Kodi, add the folder as a video source.
5. Set the content type to **Movies**.
6. Set the information provider to **Local information only**. This is the setting the whole project depends on. It tells Kodi: do not go online, everything you need is already in the folder.
7. Set **Movies are in separate folders** to **Yes**.
8. Let it scan.

**Result:** power on, Kodi opens, a wall of posters, pick one, it plays. 48 films. 16GB. Zero internet.

## The prompt I used

Adapt this. Your file naming will differ, but the shape holds.

```
I have a folder of film files, one per movie, named like
"12 - The Film Title (1946).mp4". Organise them into a Kodi-compatible
library:

- One folder per film named "Title (Year)", with the video file inside
  named identically. Strip the leading number from the visible title,
  it breaks Kodi's matching, but preserve the series order in a
  <sorttitle> tag so the films still list in release order.
- Write a movie.nfo in each folder with title, originaltitle, sorttitle,
  year, and a <set> tag grouping the series into a collection.
- Verify every file with ffprobe first: check the duration against the
  film's real runtime and flag anything that is not a full feature.
- The destination is a FAT32 USB drive, so skip any file of 4GB or more
  and ignore macOS ._ files.
- Then fetch real posters and backdrops from the TMDb API, save them as
  poster.jpg and fanart.jpg in each folder, and add the TMDb ID to each
  NFO as <uniqueid type="tmdb"> so the match is locked in.
```

## The gotchas

This was harder than it should have been, and almost none of the difficulty was the part I expected.

**FAT32 will not take a file of 4GB or more.** One film was a 4.2GB upload that simply could not be written to the stick. It was not a better copy, it was a badly encoded one. I replaced it with a 345MB version of the same film and it looks identical. A 1940s black and white film at 10 Mbps is about ten times the bitrate it has any use for.

**macOS scatters hidden `._` files across FAT32 drives.** I had nearly 250. Kodi can try to scan them as if they were films, so you get phantom entries with no artwork. That is what `dot_clean` in step 8 is for.

**Kodi caches artwork in a database, and Refresh does not clear it.** This cost me an evening. I had scanned once with the online scraper before switching to local files, and the wrong artwork stuck. Refreshing did nothing. Changing the setting did nothing. The fix is to **remove the source from the library entirely**, say yes when it asks whether to remove the movies too, then add it back. Nothing less will do it.

**Leaving "Movies are in separate folders" on No** makes Kodi look for artwork under a different naming convention. It finds none, and you get a grid of blank tiles with correct titles under them.

**Bulk downloading gets you rate limited.** After roughly 50 files, YouTube started returning "Sign in to confirm you're not a bot" for everything, including things that had worked minutes earlier. Pace the requests and use the Archive where you can.

**Some films are simply not out there.** Three Charlie Chan titles I could not find complete anywhere: *Shadows Over Chinatown* (1946), *The Feathered Serpent* (1948) and *Sky Dragon* (1949). Clips exist, full versions do not, at least not anywhere I could reach. Sometimes the answer is that the film is unavailable, and you say so rather than shipping a two minute clip.

## Frequently asked questions

**Does this need internet?**
No. You need it during setup, to sign in and install the two apps. After that the box can live with no network at all. Nothing phones home, nothing expires, nothing checks a licence.

**Can I add more films later?**
Yes. Add the new folder to the stick in the same layout, put it back in the box, and in Kodi choose to update the library. That is the whole process, and it is the only maintenance this thing needs.

**Do I need a Google account?**
Yes, and it is the one unavoidable compromise. Google TV will not complete setup without one. You can turn off every sync and personalisation option afterwards, which is what I did.

**What about subtitles?**
Kodi reads `.srt` files placed next to the video with a matching name. The films I downloaded came with `.vtt` tracks, which ffmpeg converts in one line: `ffmpeg -i subtitles.vtt subtitles.srt`.

**Will this work on other hardware?**
Any Android TV or Google TV device with a USB port and enough storage.

## What actually happened

They turn on the television. The posters come up. They pick a film with the big round button. It plays.

No data used. Nothing to sign into. Nothing to accidentally subscribe to. When they want more films, I put more on the stick.

I have written before about [what happens when the thing you paid for stops being yours](/blog/testing-redbox-kiosk-offline-hack-for-free-dvds/), and this sits in the same place. These films are 80 years old. They have outlived the studios that made them, several formats, and by now probably a few streaming services. Putting them on a USB stick in a cheap plastic box is not a clever hack. It is the arrangement with the fewest things that can fail.

None of the difficulty was technical. The hard problems were a file size limit from 1996, hidden files my own laptop created, and a cache that would not clear. The actual idea, put the films on a stick and show them as posters, took an afternoon.

If you are building something like this for someone who finds modern interfaces overwhelming, the films are interchangeable. Swap in whatever they actually watch. The method holds: get the content local, make it look like a library, then remove every screen that is not the one they need.
