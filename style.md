# Coffee & Fun interface style

Build on the cream palette, original artwork, handwritten display type, and generous spacing. The
objective is a familiar, coherent website that is easy to use.

Use [branding.md](branding.md) for identity, [writing-style.md](writing-style.md) for copy, and
[design-review.md](design-review.md) for the latest review.

## Source map

| Concern                                                      | Source                                               |
| ------------------------------------------------------------ | ---------------------------------------------------- |
| Shared header and section selection                          | `src/_includes/header.liquid`                        |
| Header, popover, and mobile-menu styling                     | `src/assets/css/pages/site-header.css`               |
| Popover positioning and keyboard enhancements                | `src/assets/js/pages/site-header.js`                 |
| Mobile site directory                                        | `src/_includes/modals.liquid`                        |
| Homepage content and flow                                    | `src/pages/index.liquid`                             |
| Homepage refinements                                         | `src/assets/css/pages/home.css`                      |
| Palette, fonts, and article typography                       | `src/assets/css/coco.css`                            |
| Shared handwritten styling and legacy font/token definitions | `src/_includes/sketch-styles.liquid`                 |
| Product catalog and announcement                             | `src/_data/apps.json`, `src/_data/announcement.json` |

Preserve the Eleventy, Liquid, Tailwind, and daisyUI stack. Use the existing `pageCss` and `pageJs`
shortcodes for scoped assets; they add content hashes so the service worker can fetch changed files.
Do not edit generated `docs/` files or `engine.css` as source.

## Header

Use one warm paper surface with a thin warm border and quiet shadow. Keep the logo left, navigation
in the center, and the existing fun/community actions right. Utility actions have a subtle divider
and stay visually secondary.

At 1024px and above, show the desktop navigation. Below that, use the existing modal site directory.
Small phones retain a 56px logo area and 44px utility targets. Keep the header compact without
shrinking tap targets. The current layout uses 18px to 24px corner radii depending on width.

Keep the existing destination order and menu contents. Buttons open grouped panels; links go
directly to a page. A small chevron identifies disclosures. An open trigger gets a warm fill and an
upward chevron. Current sections get a coral underline, including product and tool detail pages that
use the shared header.

Use native automatic popovers for Escape and outside-click dismissal. Position them beneath the
header and constrain their width and height to the viewport. Do not make navigation depend on CSS
anchor positioning. Browsers without popovers get direct links; small screens with JavaScript
disabled get a simple visible link list.

Keep dropdown labels in system sans serif. Use readable category labels, at least 44px link rows,
clear grouping, and one directory link at the bottom. The featured app tile is a link, with an image
and a concise description. No unsupported audience figures.

## Homepage

Preserve the existing section order and illustrated cards. Keep the signature headline in two block
spans with fluid typography. The hero uses less vertical space on phones so both primary
destinations are visible quickly.

Use one solid caramel action and one outlined coral action. Keep labels in sentence case and corners
at 12px. Use a steady shadow, not perpetual glow. Let the handwritten supporting note add
personality.

Keep supporting copy around 46 characters per line on wide screens. On small screens, let trust
statements wrap as whole phrases. Decorative notes must not overlap text or controls, introduce
horizontal scrolling, or convey essential information alone.

## Type, rhythm, and surfaces

- Body copy: generally 16px or larger, with line height around 1.5 to 1.7.
- Regular interface labels: generally 14px or larger. Reserve smaller sizes for secondary metadata.
- Controls: aim for at least 44px in both dimensions when an icon is the entire target.
- Spacing: use a small, repeatable scale such as 4, 8, 12, 16, 24, 32, 48, and 64px.
- Surfaces: cream for the page, warm paper for elevated navigation, and existing saturated imagery
  for feature cards.
- Borders and shadows: use them to establish grouping and depth, with one clear edge per component.

These are design defaults, not a claim that font size alone establishes accessibility. Check actual
text, line lengths, contrast, and interaction behavior.

## Interaction and accessibility

Use semantic links, buttons, headings, and landmarks. Keep the skip link first and visible on focus.
Never remove a focus outline without a clear replacement. A sticky header must leave enough scroll
offset for anchor targets and focused content.

Check keyboard navigation through open panels, including Tab, Shift+Tab, ArrowDown from a
disclosure, Escape, and focus restoration. The mobile menu uses a native dialog with a named close
button and focus containment. Resize an open desktop panel down to mobile and verify it closes
cleanly.

Test at 320, 390, 768, 1024, and 1440px, plus a short landscape viewport and enlarged text. Text
must wrap without hiding controls. Check reduced motion and no-JavaScript navigation. Keep static
content visible without animation or script initialization.

Use the existing color tokens rather than approximations. Check small text at 4.5:1, large text at
3:1, and meaningful non-text boundaries or indicators at 3:1 where required. Do not assume a
low-opacity version of an accessible color remains accessible.

## Validation and delivery

Run `npm run build` after shared-template or asset changes. Review the home, apps, blog, help,
support, and a tool page in a browser. Exercise both desktop popovers and the mobile menu. Run
automated accessibility checks on the changed surfaces, then manually check focus order, image
loading, and visual layout.

`npm run dev -- --port=8080` provides a local review. `npm run build` updates the sitemap ledger as
a side effect; inspect that diff and preserve unrelated in-progress work. Publish through the site's
existing workflow only when requested. Record what was actually checked and any remaining limits
instead of claiming a universal audit.
