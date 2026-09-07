# Coffee & Fun branding

Coffee & Fun is a small software studio making apps, browser extensions, and free web tools. The
brand should feel like thoughtful software made by approachable people with a playful streak.

Use this guide for identity and art direction, [style.md](style.md) for interface decisions, and
[writing-style.md](writing-style.md) for words. [design-review.md](design-review.md) records the
September 2026 refinements and their validation.

## The idea

**Useful software. A little everyday joy.**

Lead with what someone can do. Let the coffee, handwriting, sketches, and small surprises give that
usefulness a recognizably human character. Keep the existing homepage line, “Crafting Software, One
Brew at a Time,” as the signature. It belongs on the studio homepage; individual tools need a
practical heading about their task.

The experience should be warm, clear, curious, and considerate. Accessibility is expressed through
readable type, usable controls, and working interactions. Playfulness is expressed through small
details people can enjoy at their own pace.

## Name and identity

- Use **Coffee & Fun** in navigation, product descriptions, and everyday copy.
- Use **Coffee & Fun LLC** for the legal company name, formal attribution, and organization
  metadata.
- Preserve each product's established spelling. Check `src/_data/apps.json` and its product page
  rather than guessing capitalization.
- Use the supplied illustrated mug and wordmark. Do not reconstruct the lettering, straighten the
  cup, stretch the artwork, or invent a new mark for a page.

The header uses `src/assets/images/brand/coffee-and-fun-logo-dark.png` on a light surface. Choose
assets by their actual appearance, not the filename alone. The filename does not describe a
mandatory background color.

Keep the artwork square with `object-fit: contain`. The refined header gives it a 72px square on
desktop, 60px on tablet, and 56px on small phones. Preserve its aspect ratio and surrounding space.
The homepage link supplies the accessible name, so its nested image has empty alternative text to
avoid repetition.

## Color

The core palette lives in `src/assets/css/coco.css`. The existing `sketch-styles.liquid` also
carries these tokens for legacy pages. Keep both definitions aligned until that duplication is
removed as a separate maintenance change.

| Token        | Value     | Purpose                                                 |
| ------------ | --------- | ------------------------------------------------------- |
| `cream`      | `#fef5ec` | Main page background                                    |
| `cocoa`      | `#3d2b1f` | Deep brand ink and dark surfaces                        |
| `espresso`   | `#7a4e31` | Links, focus indicators, strong warm text               |
| `caramel`    | `#96603c` | Primary buttons with white text                         |
| `mocha`      | `#a36942` | Large display headings and illustration accents         |
| `toffee`     | `#c4813a` | Decorative details and warm accents                     |
| `coral`      | `#fd6155` | Decorative highlights and heading shadows               |
| `coral-deep` | `#c4413a` | Coral text, outlined actions, current-section underline |

The header adds four surface values in `src/assets/css/pages/site-header.css`: warm paper `#fffcf7`,
warm border `#e6d6c6`, hover fill `#f6ece2`, and secondary ink `#786d62`. These support the core
palette; they are not separate brand colors.

Use existing tokens for brand colors. Check contrast for the actual text size, background, and
opacity. Coral and toffee are accents, not default colors for small text. Do not lower the opacity
of handwritten words to make them feel decorative; keep the words readable and soften their
accompanying drawing instead.

## Typography

| Family            | Use                                                             | Avoid                                                                 |
| ----------------- | --------------------------------------------------------------- | --------------------------------------------------------------------- |
| Pacifico          | Short, distinctive display headings                             | Body text, menus, error messages, long headings at oversized settings |
| Caveat            | Navigation labels and brief handwritten notes                   | Instructions, dense lists, or content requiring extended reading      |
| System sans serif | Body copy, dropdown contents, labels, forms, help, and articles | Replacing it with a new font on each page                             |
| Monospace         | Code, technical values, and appropriate tool output             | Decorative technical styling on the studio homepage                   |

The brand fonts are self-hosted. Preserve the local files and fallback stacks. The homepage keeps
its Pacifico lettering and coral offset shadow, with fluid sizing that fits the same two-line
composition on a phone.

## Layout and imagery

Keep generous cream space, rounded corners, and the existing illustrated card imagery. The homepage
sequence remains introduction, apps/blog/support/about cards, and the existing supporting sections.
Improve rhythm and clarity within that flow.

Use the original bento images, app icons, team portraits, and product screenshots when relevant.
Give informative images meaningful alternative text; use empty alternative text for artwork already
described by the adjacent link text. Keep dimensions explicit to prevent layout shifts.

Handwritten annotations should feel like a small aside. Keep them away from controls, paragraphs,
and the reading path. Hide decorative doodles from assistive technology. Do not add sketches to
every available corner or insert illustrations into a tool's working area.

## Motion and personality

Use quiet hover feedback and short transitions. Keep the existing confetti and cursor controls
optional and secondary to navigation. Never require an animation to understand content or finish an
action. Respect reduced-motion preferences, and do not use perpetual glow to draw attention to an
ordinary call to action.

## Claims and trust

Product counts, audience figures, awards, prices, and availability need a current source. Keep
maintained counts in data rather than copying numbers across templates. If a claim cannot be
supported, describe the actual benefit instead.

Describe privacy per product and per action. The website loads analytics, so “no tracking anywhere”
would be inaccurate. A browser tool may process files locally; say that only when its implementation
supports the claim. Do not turn accessibility intent into an unsupported claim of certification or
universal compliance.
