---
new: true
submit: false
footer: true
header: true
layout: templates/post.liquid
title: 🧹 How to Deep Clean and Optimize Your Mac Using Mole
description: Learn how to safely install and use Mole, a powerful open-source tool to clean, uninstall, and optimize your Mac all from the terminal for free.
keywords:
  - mac cleaner
  - uninstall apps mac
  - optimize mac
  - deep clean mac
  - mole mac
  - remove cache
  - delete junk mac
  - speed up mac
  - free up mac storage
url: blog/deep-clean-optimize-mac-with-mole/
isBlog: true
blog_cat: How-To
youtubeId:
cardTitle: How to Deep Clean and Optimize Your Mac Using Mole
blog_snip: Want to free up space and speed up your Mac? Mole is a free, open-source tool that safely deletes junk, uninstalls apps, and more—right from Terminal.
name: Robert James Gabriel
img: /assets/images/blog/deep-clean-optimize-mac-with-mole.png
date: 2026-01-20T00:00:00.000Z
time: 6 min
tags:
  - mac
  - tools
  - terminal
  - how-to
  - apps
  - performance
---

# 🧹 How to Deep Clean and Optimize Your Mac Using Mole

If your Mac is running out of space, heating up, or just feeling sluggish, it's time for a cleanup. Meet **Mole**—a free, open-source tool that removes leftover app junk, browser caches, unused data, and even helps you uninstall apps cleanly. Think of it as a powerful, no-fluff alternative to CleanMyMac and AppCleaner.

This guide walks you through installing and using Mole to safely clean and optimize your Mac using **Terminal**, **brew**, or **script**. Let’s dig in.

---

## 🚀 What is Mole?

Mole is a command-line tool that helps you:

- 🧼 **Deep clean**: Reclaim gigabytes by deleting app caches, logs, browser junk, and system leftovers.
- 🗑️ **Smart uninstall**: Remove apps completely—including hidden files and launch agents.
- 💾 **Analyze disk usage**: See what’s eating up space.
- ⚙️ **Optimize macOS**: Clear system caches, reset services, and rebuild indexes.
- 📊 **Live monitor**: Track CPU, memory, disk, and network stats in real-time.

It combines features from tools like **CleanMyMac**, **AppCleaner**, **DaisyDisk**, and **iStat**, all in one handy terminal app.

🔗 GitHub: [tw93/Mole](https://github.com/tw93/Mole)

---

## 🧪 What is Terminal (and Why Use It)?

Terminal is your Mac’s command-line interface—like a direct chat with your system. You can find it in:

```
Applications → Utilities → Terminal
```

Or use Spotlight: `Cmd + Space`, then type “Terminal”.

Mole runs inside Terminal. If you're new to it, don’t worry—this guide makes it super easy.

---

## 🍺 What is Homebrew (and Why You Need It)?

[Homebrew](https://brew.sh) is a package manager for macOS. Think of it like an App Store for Terminal—but for developer tools, utilities, and open-source apps.

To install it, open Terminal and paste:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Once installed, you can use it to install Mole, Node.js, wget, and more with a single command.

---

## 🔧 How to Install Mole

You’ve got two ways to install Mole:

### ✅ Option 1: Using Homebrew (Recommended)

If you already have [Homebrew](https://brew.sh) installed:

```bash
brew install mole
```

### 💡 Option 2: Install via Script

This works even if you're on an older macOS or want the latest version.

```bash
curl -fsSL https://raw.githubusercontent.com/tw93/mole/main/install.sh | bash
```

You can customize the version with flags:

- `-s latest` → Latest release
- `-s dev` → Development version
- `-s 1.17.0` → Specific version

---

## 💥 First Run (Safe Mode)

Before you do anything destructive, Mole lets you **preview** what it'll clean:

```bash
mo clean --dry-run
```

It’ll scan your system and show how much space it can free, without deleting anything. Perfect for peace of mind.

---

## 🧼 Cleaning with Mole

### 🧹 Deep System Cleanup

```bash
mo clean
```

This will remove:

- App caches (Spotify, Slack, etc.)
- System logs and temp files
- Developer build junk (Xcode, Node.js, etc.)
- Browser leftovers (Safari, Chrome)
- Trash

💡 Want to see what’s protected from deletion?

```bash
mo clean --whitelist
```

Add paths you want to keep safe.

---

## 🧽 Smart App Uninstaller

Want to fully remove an app (plus all its hidden gunk)?

```bash
mo uninstall
```

You’ll see a list of apps. Mole removes:

- App files
- Launch agents
- System daemons
- Preferences
- Extensions and more

---

## ⚡ System Optimization

Speed up your Mac by cleaning swap files, refreshing Finder/Dock, and clearing hidden system crud:

```bash
mo optimize
```

For a preview:

```bash
mo optimize --dry-run
```

---

## 📊 Visual Disk Analyzer

Find the biggest space hogs:

```bash
mo analyze
```

Navigate with arrow keys and open/delete files as needed.

---

## 📈 Live System Status Dashboard

Check your Mac’s health live:

```bash
mo status
```

Shows:

- CPU load
- RAM usage
- Disk I/O
- Network activity
- Battery + temperature

---

## 🧹 Purge Build Artifacts

Delete leftover folders like `node_modules`, `build`, `dist`, and more:

```bash
mo purge
```

Especially useful for devs with lots of project folders.

---

## 📦 Remove Leftover Installers

Clear large `.dmg`, `.pkg`, and `.zip` files from:

- Downloads
- iCloud
- Homebrew caches
- Desktop

```bash
mo installer
```

---

## ✨ Pro Tips

- 🧪 **Preview first** with `--dry-run`
- 🔐 **Enable Touch ID** for sudo commands: `mo touchid`
- 🧾 **Shell Completion**: Enable tab autocomplete with `mo completion`
- 🔍 **Detailed Logs**: Use `--debug` for full file paths and risk levels
- ✅ **Safe by default**: Mole won’t nuke anything critical

---

## 🛑 A Word of Caution

Mole is powerful. Be careful when cleaning or uninstalling, especially in dev environments.

Use `--dry-run` to preview. Always review before confirming deletion.

---

## 🧰 Bonus: Quick Launchers

Add Mole commands to Raycast or Alfred:

```bash
curl -fsSL https://raw.githubusercontent.com/tw93/Mole/main/scripts/setup-quick-launchers.sh | bash
```

---

## 🐾 Final Thoughts

Mole is like a digital mole that digs deep into your Mac to clear out the junk. It’s fast, safe, and open source—plus it can easily free up **tens of gigabytes** in just a few seconds.

Try it today and give your Mac the tune-up it deserves.

> ✨ Visit Mole on GitHub: [tw93/Mole](https://github.com/tw93/Mole)