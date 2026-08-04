# Architecture

How the site is built, from source file to deployed page. For visual conventions see [style.md](style.md); for identity see [branding.md](branding.md).

---

## The shape of it

A static site. Eleventy 3.1.6 renders Liquid and Markdown into `docs/`. Tailwind v4 compiles once per build through PostCSS. There is **no JavaScript bundler anywhere in the project**, and no framework build step. What you write is what ships.

| | |
|---|---|
| Generator | Eleventy 3.1.6 (ESM config) |
| Templates | Liquid (primary), Markdown, a little Nunjucks for utility files |
| CSS | Tailwind 4.3.2 + daisyUI 5.7.9, compiled by PostCSS |
| Input | `src/pages/` |
| Output | `docs/` (gitignored) |
| Node | Unconstrained. There is no `engines` field |

```
src/
  pages/        input root. 39 standalone .liquid pages, 49 blog .md, 9 help .md, 5 utility .njk
  _includes/    11 partials + templates/ (3 layouts)
  _data/        12 global data files
  assets/       copied wholesale to docs/assets/
tools/          build helpers, a static server, blog automation
eleventy.config.mjs
```

Note `dir.data` and `dir.includes` are written as `../_data` and `../_includes` because Eleventy resolves them **relative to the input dir**, not the project root.

---

## Page architecture: a hybrid, and you need to know which half you're in

This is the single most surprising thing about the codebase.

**Markdown uses layouts.** All 49 blog posts declare `layout: templates/post.liquid`. All 9 help articles declare `layout: templates/help-doc.liquid`. These behave the way you'd expect.

**Every `.liquid` page is a complete, standalone HTML document.** All 39 of them open with their own `<!DOCTYPE html>` and hand-write the entire `<head>`: title, description, canonical, Open Graph, Twitter, JSON-LD. They do not inherit from a layout. They compose by include:

```liquid
{% bundledCss %}
{% include sketch-styles.liquid %}
{% include scripts.html %}
{% include header.liquid %}
   ... page body ...
{% include modals.liquid %}
{% include footer.liquid %}
```

The consequence: **there is no single place to change a meta tag site-wide.** A change to canonical logic or OG structure is a 39-file edit. This is why metadata drifted badly enough to need a dedicated audit. If you are adding a shared head element, you are touching every page or you are introducing a partial.

Only six files carry frontmatter at all: `404.liquid` and the five utility pages (`CNAME.njk`, `robots.njk`, `sitemap.njk`, the Apple Pay verification blob, and one non-blog markdown page). Everything else relies on Eleventy's default `foo.liquid` to `/foo/index.html` mapping.

---

## `eleventy.config.mjs`

One 321-line ESM file. The interesting parts:

### Filters

| Filter | Kind | What it does |
|---|---|---|
| `json` | Liquid | `JSON.stringify` for safe embedding in JSON-LD blocks |
| `imageWidth` / `imageHeight` | Liquid | Real pixel dimensions of a local image |
| `date` | Universal | **Overrides Liquid's built-in.** Accepts `'now'`, ISO strings, or Date, and translates strftime tokens (`%Y`, `%B`, `%e`) into date-fns tokens |
| `formatDateWithOrdinal` | Universal | `MMMM do, yyyy`, e.g. "July 6th, 2026" |
| `limit`, `dateDisplay` | both | **Unused.** Nothing in `src/` calls either |

`imageWidth` / `imageHeight` are how `og:image:width` and `og:image:height` stay honest. The helper parses **PNG IHDR bytes directly**, and for other formats shells out to macOS `sips`. That is the build's only OS-specific dependency. It fails soft: any error returns null and the template omits the tags rather than lying.

### Shortcode

`{% bundledCss %}` emits `<link href="/assets/css/engine.css?v=HASH">`. The hash is the first 10 characters of the MD5 of the compiled CSS, computed during the build.

### Markdown pipeline

`markdown-it` with `html: true` and `linkify: true`, plus:

- **`@toycode/markdown-it-class`** with a 22-entry `tagMap` that injects Tailwind classes onto every generated tag. This is why raw Markdown comes out styled without a `prose` wrapper doing all the work.
- **`markdown-it-anchor`** with `permalink: false`, so headings get IDs but no anchor links.

Raw HTML in Markdown is enabled. That is only safe because every post is authored in-house.

### The `htmlmin` transform

Production only. Two settings are load-bearing and were added to fix real bugs:

- **`conservativeCollapse: true`** stops whitespace being eaten around ignored fragments, which was producing output like `"10:06 PMon Sunday"`.
- **`ignoreCustomFragments`** covers `{{ }}` and `{% %}` so the minifier does not misparse `{{ x <= 5 ? 'a' : 'b' }}` as HTML.

The whole transform is wrapped in try/catch. A failure logs `htmlmin skipped <path>` and emits the unminified original rather than breaking the build. If you see that warning, the page still shipped, just larger.

---

## The CSS build

Single source: `src/assets/css/coco.css`, 77 lines. **No `tailwind.config.js`, no `postcss.config.js`.** Tailwind v4 CSS-first config only.

Compilation happens in an `eleventy.before` hook, so it reruns on every build and every watch rebuild:

1. Read `src/assets/css/coco.css`
2. Run PostCSS with `@tailwindcss/postcss`
3. In production only, add `cssnano` with **`mergeRules: false`**
4. Write `docs/assets/css/engine.css`
5. MD5 the result, keep 10 hex chars as the cache-buster
6. Write `docs/cache-assets.json`, the service worker precache list

**`mergeRules: false` is not optional.** With it on, cssnano corrupts Tailwind v4 nested rules by swapping `&:focus-within` bodies between selectors. Leave it off.

The precache list is deliberately just seven core-shell entries (versioned CSS, four fonts, favicon, logo). Precaching all of `docs/` would make every first-time visitor download the entire site.

### Two styling systems coexist

This is real technical debt worth knowing about:

- **26 pages** call `{% bundledCss %}` and use the compiled Tailwind bundle.
- **13 pages** do not link `engine.css` at all. They self-style with one large inline `<style>` block plus `sketch-styles.liquid`.

That is why `sketch-styles.liquid` duplicates the eight brand tokens and all four `@font-face` rules that already exist in `coco.css`. **The tokens are declared twice and can silently drift.** If you change a brand colour or a font, change both files.

(One stale detail: comments in `sketch-styles.liquid` describe these as "Tailwind Play CDN tool pages", but there are zero `cdn.tailwindcss.com` references in the repo. They load no Tailwind at all.)

---

## Data

Twelve files in `src/_data/`, each becoming a global named after its basename.

| File | Shape | Notes |
|---|---|---|
| `apps.json` | 4 arrays: `apps` 7, `tools` 21, `opensource` 3, `graveyard` 13 | Entries are `{name, description, link, platform[], image, schemaType}`. See [Structured data](#structured-data) for `schemaType` |
| `blog.json` | `{ posts: [49] }` | **Hand-maintained.** See the warning below |
| `help.json` | `guides[9]` plus a `products` tree | The `products` tree drives the help sidebar |
| `site.js` | `{ url }` | Only two consumers: `robots.njk` and `sitemap.njk` |
| `emojis.json` | 5,042 entries, 1.0 MB | Inlined wholesale into `emoji.liquid`. The largest page payload on the site |
| `netflix.json` + `netflixCatalog.js` | ~1,900 codes, transformed at build time | The page ships zero of the transform work to the browser |
| `reviews.json` + `sortedReviews.js` | Coffee shop reviews, averaged and sorted | `sortedReviews.js` exports the invoked result, an array, not a function |
| `announcement.json`, `credits.json`, `forgot.json` | small config blobs | one consumer each |

> **`blog.json` is decoupled from the actual posts.** Nothing generates it. Forty-nine JSON entries sit beside forty-nine Markdown files with no link between them. **A new post is invisible on the blog index until you hand-add its entry.** This is the most reliable way to lose an afternoon in this repo.

---

## Structured data

Every one of the 103 built pages carries JSON-LD, and every page tells search engines the same three facts: who made this (Coffee & Fun LLC, founded 2022), who founded it (Robert James Gabriel), and what site it belongs to.

Those three entities are declared **once**, in `src/_includes/schema-org.liquid`, as a `@graph` of `Organization` + `Person` + `WebSite` with stable `@id`s:

```
https://www.coffeeandfun.com/#organization
https://www.coffeeandfun.com/#founder
https://www.coffeeandfun.com/#website
```

Every page includes that file. Page-specific entities never repeat the company or the founder, they **point at those `@id`s**:

```json
"publisher": { "@id": "https://www.coffeeandfun.com/#organization" },
"creator":   { "@id": "https://www.coffeeandfun.com/#founder" }
```

So the founding date, the Wikidata links and the social profiles are stated in exactly one place. Change them there and all 103 pages change.

**Type a thing as what it actually is.** A game is a `VideoGame`, not a generic app. A browser extension or native app is a `SoftwareApplication`. A browser-based tool is a `WebApplication`. An open source project is `SoftwareSourceCode`. Blog posts are `BlogPosting` authored by `#founder`, which matches the visible byline; help articles are `TechArticle`.

**Retired products stay listed but are marked dead**, via an offer with `availability: "https://schema.org/Discontinued"`. Never quietly list a closed product as though you can still get it.

### `schemaType` in `apps.json`

`/apps/` renders all 44 products, so it publishes an `ItemList` of all 44, built by `src/_includes/apps-itemlist.liquid` straight from `apps.json`. That means the list cannot drift from the cards on the page.

Each entry's `schemaType` decides how that product is typed in the list. For anything with a page on this site, the value was **read from that page's own JSON-LD**, so the two agree by construction. If you retype a product on its own page, update its `schemaType` here to match.

The include treats everything after `apps + tools + opensource` as retired and gives it the Discontinued offer, so **section order in `apps.json` is load-bearing**: `graveyard` must stay last.

### Rules that are easy to break

- **Only describe what the page actually shows.** The homepage used to declare a `SoftwareApplication` for an app it never rendered. It links to `/apps/`, so the catalogue belongs on `/apps/`.
- **One node per thing.** Four tool pages used to be a `WebApplication` that also declared the *same* product again under `mainEntity`, with two different `applicationCategory` values. One product, one node.
- `applicationCategory` is free text, schema.org enumerates nothing. This site uses one spelling per concept, `UtilitiesApplication` (not `UtilityApplication`), `GameApplication` (not `Game`). Match what is already there.

To check the whole site after a change, parse every `docs/**/*.html` and assert: no parse errors, no page missing `#organization` or `#founder`, no duplicate `Organization`, and no `@id` reference that nothing defines.

---

## Includes and templates

`footer.liquid` is included by 36 files, `sketch-styles.liquid` by 36, `scripts.html` by 26, `modals.liquid` by 24, `header.liquid` by 22.

**`header.liquid`** carries 13 `showX` feature flags that pages set before including it (`showFun`, `showTicker`, `showMiddleBadge`, and so on). It also derives `navSection` from `page.url`, which drives the "you are here" underline. Nav content is hardcoded, not data-driven.

**`scripts.html`** holds Google Tag Manager (`G-RC4JGW9PVN`) and a `loadScriptOnce()` helper that fetches third-party scripts on demand with SRI hashes and `no-referrer`. Confetti and cursor effects load only when used; highlight.js loads only if the page actually contains `pre code`.

Three layouts live in `templates/`: `post.liquid` (blog, 478 lines), `help-doc.liquid` (help, 289 lines), and `help.liquid` (409 lines, **orphaned, zero pages reference it**).

---

## Build and deploy

```bash
npm run build     # ELEVENTY_ENV=production eleventy  (the only script that minifies)
npm run dev       # eleventy --serve
npm run preview   # node tools/serve-docs.mjs
npm run clean     # rimraf docs
npm run format    # prettier
```

Output is 100 HTML files, 415 files total.

> **`docs/` is gitignored and has been since December 2023.** `git ls-files docs` returns nothing. Do not plan work around "committing the build".

### Two things to be aware of

**`ELEVENTY_ENV=development` is never set by anything.** Only `npm run build` sets the variable, and it sets it to `production`. So the localhost branch in `site.js` is unreachable, and `npm run dev` emits **production URLs** in `sitemap.xml` and `robots.txt`. Harmless in practice, surprising when you first notice it.

**The deploy path cannot be reconstructed from this repo, and I could not verify it.** The evidence is contradictory:

- `docs/` as an output dir plus a tracked root `CNAME` is the classic GitHub Pages "main branch, /docs folder" setup.
- But `docs/` is untracked, there is no `.github/` directory, no workflow, no `netlify.toml`, `vercel.json`, or `wrangler.toml`, and no `gh-pages` branch.

So nothing inside the repository actually publishes anything. Publishing is either wired up outside the repo or done manually. **Worth confirming and documenting here**, because right now a new contributor cannot deploy.

---

## Tooling

| Path | What it is |
|---|---|
| `tools/serve-docs.mjs` | Dependency-free static server for `docs/`. Default port 8743, but `.claude/launch.json` passes **8744**. Gzips text responses to mirror GitHub Pages, serves `404.html` on misses, and guards against path traversal |
| `tools/social-card.mjs` | Standalone CLI for 1200x630 cards. Bundles its own font so output is identical on any machine. Not part of the Eleventy build |
| `tools/format-title.js` | Wraps a title across one or two lines for social cards |
| `tools/blog-automation/` | A launchd job that drafts one blog post every Monday at 09:00 by running Claude Code headless, then commits locally **without pushing**. See [writing-style.md](writing-style.md) |

> The blog automation scripts hardcode `/Users/commander/Documents/Major/code/coffee/website`, a **different machine's path**. They will not run here without editing.

Formatting is Prettier with tabs, width 100, single quotes, `proseWrap: always`.

---

## Dead code inventory

Verified unused. None of it breaks anything; all of it costs reading time.

| Thing | Where | Notes |
|---|---|---|
| `createSocialImageForArticle` | `eleventy.config.mjs` (67 lines) | Never called. References `tools/images/`, which does not exist. Would fail if wired up |
| `limit`, `dateDisplay` filters | config | Nothing calls either |
| `eleventy-plugin-svg-contents` | config | Registered, no template uses its shortcode |
| `templates/help.liquid` | includes | 409 lines, zero references |
| `discord.liquid`, `tip-jar.liquid`, `ticker-trivia.html` | includes | Zero references each |
| `tools/eleventy-plugin-pwa/` | tools | A vendored copy of an npm package, not registered. The site rolls its own service worker |

Two more oddities: `package.json` still carries the repo, bugs, and homepage fields of **`marcamos/jet`**, the upstream starter template. And ESLint is installed and configured but **there is no lint script**.

### Search trap

`.claude/worktrees/admiring-raman-132346/` holds a full old copy of the repo **including a committed `docs/`**. Exclude it from repo-wide searches or you will get doubled, stale results.

---

## Adding things

**A page:** create `src/pages/thing.liquid` as a full HTML document, copy the include sequence from a neighbour, write the whole `<head>` yourself. Follow the checklist in [style.md](style.md).

**A blog post:** Markdown in `src/pages/blog/` with `layout: templates/post.liquid`, **plus an entry in `src/_data/blog.json`** or it will not appear. Full rules in [writing-style.md](writing-style.md).

**A tool:** the page, plus an entry in `apps.json` under `tools`, plus its path in the `toolPaths` list in `header.liquid`, plus two card images.

**A brand token or font:** change it in **both** `coco.css` and `sketch-styles.liquid`.
