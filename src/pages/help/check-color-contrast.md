---
new: true
submit: false
layout: templates/help-doc.liquid
title: "Check your color contrast"
description: "How to test text, link and background colors against WCAG AA and AAA with the free Coffee & Fun color contrast checker, fix failing colors, and audit a whole palette at once."
keywords: check color contrast, WCAG AA checker, WCAG AAA checker, color contrast tool, fix color contrast, palette contrast matrix, accessible colors, Coffee and Fun
url: help/check-color-contrast/
isHelp: true
product: contrast-checker
app: Color Contrast Checker
category: Guides
img: /assets/images/social/help/check-color-contrast.png
date: 2026-08-08T12:00:00.000Z
updated: 2026-08-08T12:00:00.000Z
time: 4 min read
related:
  - title: "Open the Color Contrast Checker"
    url: /contrast-checker/
  - title: "All our apps & free tools"
    url: /apps/
tags:
  - help
  - contrast-checker
---

## What the tool does

The [Color Contrast Checker](/contrast-checker/) tells you whether two colors are readable together, measured against the WCAG 2.1 rules that accessibility audits and most laws reference. Everything runs in your browser. Nothing you pick is uploaded or stored anywhere.

You give it three colors: your text, your background, and your link color. It gives you a contrast ratio and a clear Pass or Fail for every level that matters.

## Check a pair of colors

1. Open the [contrast checker](/contrast-checker/).
2. Set your **text color** using the swatch, the hex field, or the eyedropper button. The eyedropper picks a color from anywhere on your screen, and appears in Chrome and Edge, which are the browsers that support it.
3. Set your **background color** the same way. The **Swap** button flips the two.
4. Set your **link color** if your design has links.

The results update as you pick. The big number is the contrast ratio between your text and background, from 1:1 (identical colors) up to 21:1 (black on white).

## What the four result cards mean

WCAG sets different bars depending on the text size and the level you are aiming for:

- **AA, normal text** needs 4.5:1. This is the level most audits check.
- **AA, large text** needs 3:1. Large means 24px and up, or 18.66px and up when bold.
- **AAA, normal text** needs 7:1. A higher bar, worth it for long reading.
- **AAA, large text** needs 4.5:1.

The preview below the checker shows your colors at six real sizes, each labelled with whether WCAG counts it as normal or large, so you can see exactly which rules apply to which text.

## Fix a failing color

When a pair fails, **Quick fixes** appears with one-click suggestions. Each one keeps your color's hue and only shifts its lightness, just far enough to pass the level named on the chip.

Sometimes no text color can reach a level on your chosen background. Mid-grey backgrounds are the classic case: nothing reaches 7:1 on them, not even pure black. The tool says so honestly instead of pretending, and the fix in that situation is changing the background.

## Check your links

Links get two checks of their own:

- **Link on background** works like any other text, 4.5:1 for AA.
- **Link against surrounding text** matters when links are not underlined. If color is the only thing marking a link as a link, it needs at least 3:1 against the text around it.

There is an underline toggle in the checker, and the guidance under the link results changes to match it. Keeping links underlined is the simplest way to stay safe.

## Audit a whole palette

The **palette contrast matrix** checks every combination in your design system at once:

1. Paste your colors into the palette box, one per line or comma separated.
2. Select **Check palette**.
3. Read the grid: every cell is one foreground and background pair, color coded from AAA green down to failing red, with a legend underneath.
4. Select any cell to load that exact pair into the checker above.

## Share your results

The share link updates as you change colors, so the URL always describes exactly what you are looking at, palette included. Copy it and whoever opens it sees the same colors, the same results, everything. Handy for design reviews and bug reports.

## Why another tool shows a slightly different number

Ratios are displayed to two decimals, but Pass or Fail is judged on the full precision value. A pair at 4.4996:1 displays as 4.50:1 and still fails AA, because it is below 4.5. Some other checkers round first and pass it, which is how two tools can disagree about the same pair. This one matches what an auditor's tooling will report.
