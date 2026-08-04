# Style

How the brand is implemented in markup and CSS: components, spacing, class conventions, and the accessibility floor. For *what the brand is*, see [branding.md](branding.md). For *how the build works*, see [architecture.md](architecture.md).

---

## The stack

- **Tailwind CSS v4**, CSS-first config. There is no `tailwind.config.js`, everything lives in `src/assets/css/coco.css` via `@theme`, `@source`, and `@plugin`.
- **daisyUI v5** for component primitives, themes `light --default, retro`.
- **@tailwindcss/typography** for `prose` blocks in blog and help articles.
- Light mode only. `data-theme="light"` on `<html>`.
- **No build step for JavaScript.** Marketing and content pages are vanilla JS. Interactive tools are a different story: **19 of the 39 standalone pages load Vue 3 from a CDN** and use the options API against a `#app` root. That's the established pattern for a tool page, not a wart. It does mean tool pages depend on a third-party CDN at runtime, which is worth revisiting.

Two things in `coco.css` are load-bearing and easy to break:

```css
@source "../../pages";
@source "../../_includes";
@source "../../_data";
```

Tailwind's auto-detection misses `.liquid` files. Without these, utilities silently vanish from the build. If a class stops working for no reason, check this first.

```css
@plugin "daisyui" {
	themes: light --default, retro;
}
```

Keep this block minimal. An empty option such as `prefix: ;` parses as `0`, generates an invalid `input.0theme-controller` selector, and silently kills every theme variable on the site.

---

## Class naming, and the collision that will bite you

**daisyUI owns a large namespace. Never name a custom class after a daisyUI component.**

This has broken the site at least twice. `.menu-title` is a real daisyUI class that applies `padding-inline: 0.75rem`. Our site-menu rows used the same name, so every row title sat 12px right of its own description for weeks before anyone spotted it.

**The rule: prefix every custom component class with `cf-`.** The header and modals already follow this, `cf-mm-panel`, `cf-menu-link`, `cf-mm-trigger`, `cf-navfallback`.

Known landmines, non-exhaustive: `.hero` (turns the element into a stacked grid and overlaps its children), `.card`, `.menu-title`, `.step`, `.modal`, `.toast`, `.badge`, `.btn`, `.divider`, `.label`, `.link`, `.stat`, `.tab`, `.drawer`, `.navbar`, `.footer`, `.alert`, `.avatar`, `.range`, `.swap`.

Before naming a class, check it against daisyUI. When in doubt, `cf-` it.

---

## Spacing and containers

| Purpose | Class |
|---|---|
| Default content | `max-w-5xl` |
| Full-width grids (apps, blog) | `max-w-7xl` |
| Focused reading, forms, team | `max-w-3xl` |
| Horizontal padding | `px-4 sm:px-6 lg:px-8` |
| Major section rhythm | `py-16 sm:py-24` |
| Subsection rhythm | `py-10 sm:py-14` |
| Compact hero | `py-12 sm:py-16` |

Always `mx-auto`. Sections holding doodles need `relative` and `overflow-visible`.

Stick to the Tailwind scale. Arbitrary values (`p-[13px]`) are a smell. If the scale doesn't have it, the design probably doesn't need it.

---

## Components

### Cards

```html
<a class="group bg-white rounded-2xl border border-stone-200 overflow-hidden
          transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
```

Image in a `figure` with `px-4 pt-4 pb-1`, content in `p-4 pt-3`, title `text-lg font-semibold text-stone-900`, description `text-sm text-stone-500 line-clamp-2`, platform pills in `flex flex-wrap gap-1.5 mt-4`.

The whole card is one `<a>`. Because the title repeats inside the link, **card images use `alt=""`**, otherwise screen readers announce the name twice.

### Buttons

- Primary: `btn btn-lg rounded-lg px-8 font-semibold text-white border-0 shadow-lg`, background `var(--color-mocha)`.
- Outline: `btn btn-lg btn-outline rounded-lg px-8 font-semibold border-2`, coral border and text, fills on hover.
- Never `focus:outline-none` without a replacement. Use `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-espresso`.

### Platform pills

`text-xs font-medium px-2.5 py-1 rounded-full text-white`, background assigned per platform in a Liquid conditional:

| Platform | Background |
|---|---|
| Chrome, macOS | `--color-caramel` |
| Safari | `#4a7249` |
| Web | `--color-espresso` |
| iOS | `--color-coral-deep` |
| anything else | `--color-mocha` |

All are AA-safe against white text. If you add a platform, measure before you pick.

### Navigation

Three navs coexist, on purpose:

1. **Mega menu** (`cf-megawrap`), desktop, `md` and up. Uses CSS anchor positioning plus the Popover API, so it is gated behind `@supports (anchor-name: --a)`.
2. **Fallback pill nav** (`cf-navfallback`), shown where anchor positioning isn't supported (currently Firefox).
3. **Modal menu**, works everywhere, the only nav on mobile.

Top level: Company, Blog, Apps, Tools, Help, Support.

Current section gets `cf-mm-cur` (an espresso underline) plus `aria-current`. The section is derived from `page.url` at the top of `header.liquid`. **Tool pages are matched against a hardcoded path list**, add new tool pages to it or they won't highlight.

---

## Accessibility floor

This is a company that ships accessibility software. The site failing an audit is a credibility problem, not just a bug. Non-negotiables:

- **Contrast measured, not eyeballed.** 4.5:1 normal text, 3:1 large text and UI. See the palette rules in [branding.md](branding.md).
- **One `h1` per page**, no skipped heading levels. *Currently violated: 19 blog posts render two `h1`s (the page title and the post title). Known debt, not yet fixed.*
- **Visible focus on everything interactive.** `focus-visible` with an offset outline.
- **Decorative SVG is `aria-hidden` in markup**, not applied later by script. Script runs late; screen readers don't wait.
- **`prefers-reduced-motion` is respected everywhere**, doodle animation, daisyUI `aura` (its built-in reduced-motion handling only slows the glow from 6s to 24s, which still violates WCAG 2.2.2, so we stop it outright), and any canvas animation.
- **Explicit `width` and `height` on every image**, for CLS.
- **Never lazy-load an LCP image.** Hero images load eagerly.
- **`alt=""` for decorative images**, real descriptions for informative ones, never a bare Liquid variable that might render empty.
- Skip link first in the DOM.
- `aria-modal="true"` and a labelled heading on every dialog.

`html, body { overflow-x: clip; }` is deliberate. Absolutely positioned doodles can poke past the viewport; `clip` stops the stray horizontal scrollbar without creating a scroll container, which would break the sticky header. `hidden` would break it.

---

## Effects worth knowing

- **`aura`** (daisyUI), a soft animated halo, used on the About team portraits and one homepage element. `--aura-radius` controls the corner rounding. Killed under reduced motion.
- **`.brand-heading`**, Pacifico with a coral offset shadow that grows at `sm` and `lg`. Defined in `sketch-styles.liquid` and mirrored in `coco.css`; keep them in sync.
- **Breadcrumbs**, on every blog post, with matching `BreadcrumbList` JSON-LD.

---

## Images

| Purpose | Size |
|---|---|
| Social / OG card | 1200x630 |
| Apps grid card | 800x420 |
| Staff portrait | 420x420 |
| Logo (JSON-LD) | 512x512 |

Assets live under `src/assets/images/` in eight folders by purpose: `apps`, `bento`, `blog`, `brand`, `forgotten`, `games`, `screenshots`, `social`, `staff`.

`og:image:width` and `og:image:height` are emitted from real file dimensions by the `imageWidth` / `imageHeight` filters, don't hardcode them, the values genuinely vary across posts.

---

## Adding a page: the checklist

1. **Don't reuse a daisyUI class name.** `cf-` prefix for anything custom.
2. Include `sketch-styles.liquid` for `.brand-heading` and doodles; `footer.liquid` for the footer.
3. One `h1`. Logical heading order.
4. Both card images (1200x630 social, 800x420 grid).
5. Register tools in `src/_data/apps.json` under the right group, two-space indent.
6. Add tool pages to the `toolPaths` list in `header.liquid` so the nav highlights.
7. Title under 60 characters *including* the ` - Coffee & Fun LLC` suffix; description 140-160.
8. Canonical, OG, and Twitter tags that agree with each other.
9. Measure contrast.
10. `ELEVENTY_ENV=production npx @11ty/eleventy` and check it in a browser.

## Known traps

- Tailwind v4 preflight strips the browser default `dialog { margin: auto }`. Dialogs render pinned top-left until you add it back.
- Preflight also removes link underlines. Re-add `text-decoration: underline` on prose links, colour alone fails WCAG 1.4.1.
- A `<dialog>` closed by a `method="dialog"` submit did not reliably fire its `close` event in testing. Bind to the form's `submit` as well.
- Global single-key shortcuts need an off switch (WCAG 2.1.4) and must bail when focus is in a form control.
- daisyUI is JIT, a component's CSS only exists if some scanned file uses the class. Adding markup that references it is what makes it appear.
