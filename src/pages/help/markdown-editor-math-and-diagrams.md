---
new: true
submit: false
layout: templates/help-doc.liquid
title: "Math equations & Mermaid diagrams"
description: "Turn on KaTeX math and Mermaid diagrams in Settings, then render equations and flowcharts right in the preview."
keywords: markdown math, katex markdown, mermaid diagrams, latex equations, flowchart markdown, Coffee and Fun
url: help/markdown-editor-math-and-diagrams/
isHelp: true
product: markdown-editor
app: Markdown Editor
category: Writing tools
img: /assets/images/social/help/markdown-editor-math-and-diagrams.png
date: 2026-07-31T12:00:00.000Z
updated: 2026-07-31T12:00:00.000Z
time: 3 min read
related:
  - title: "Formatting toolbar & shortcuts"
    url: /help/markdown-editor-formatting-and-shortcuts/
  - title: "Export, print & share to AI"
    url: /help/markdown-editor-export-print-share/
tags:
  - help
  - markdown-editor
---

## Turn them on

Both are one toggle away — and off by default to keep the editor light:

1. Open **Settings** (gear icon).
2. Under **Writing tools**, switch on **Math (LaTeX)** and/or **Diagrams (Mermaid)**.

## Write math with KaTeX

- Inline math: wrap it in single dollars — `$e = mc^2$`
- Block math: wrap it in double dollars:

```
$$
\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}
$$
```

The preview renders it instantly — no internet needed, KaTeX ships inside the app.

## Draw diagrams with Mermaid

Use a fenced code block with the `mermaid` language tag:

````
```mermaid
graph TD
  A[Idea] --> B{Good?}
  B -->|yes| C[Write it]
  B -->|no| D[Coffee first]
```
````

- Flowcharts, sequence diagrams, pie charts, and everything else Mermaid supports.
- Diagrams render in the preview and in HTML exports.

> **Performance tip:** both engines load only when you enable them, so leaving them off keeps startup instant.
