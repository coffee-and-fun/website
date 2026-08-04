# Branding

The identity of Coffee & Fun LLC: who we are, what we look like, and the rules that keep it consistent. For *how the code implements this*, see [style.md](style.md). For *how we sound*, see [writing-style.md](writing-style.md).

---

## The company

| | |
|---|---|
| Legal name | Coffee & Fun LLC |
| Founded | 2022 |
| Site | https://www.coffeeandfun.com |
| Email | hello@coffeeandfun.com |
| Wikidata | [Q140453358](https://www.wikidata.org/wiki/Q140453358) (company), [Q140453422](https://www.wikidata.org/wiki/Q140453422) (Robert) |

We make accessible apps, browser extensions, and free web tools. Seven apps, twenty-one tools, three open-source packages, and a graveyard of thirteen retired projects that we keep online on purpose.

### The team

| Name | Role | Portrait |
|---|---|---|
| Robert James | Founder / CTO | `images/staff/robert-james.png` |
| Courtney Hood | Head of Marketing | `images/staff/courtney-hood.png` |
| Anna Brown | Support Agent | `images/staff/anna-brown.png` |

Portraits are 420x420 memoji on saturated flat backgrounds. If someone joins, match that format, a memoji on a solid colour, square, 400px or larger.

The `foundingDate` in the Organization JSON-LD must stay **2022** and match the visible "founded" stat on the About page. These drifted apart once already.

### Social accounts

These are the canonical `sameAs` set. Keep the Organization JSON-LD on `about.liquid` and `index.liquid` in sync with this list.

- X: [@bycoffeeandfun](https://x.com/bycoffeeandfun)
- GitHub: [coffee-and-fun](https://github.com/coffee-and-fun)
- Instagram: [@coffeeandfunllc](https://www.instagram.com/coffeeandfunllc)
- YouTube: [@CoffeeFunLLC](https://www.youtube.com/@CoffeeFunLLC)
- npm: [@coffeeandfun](https://www.npmjs.com/org/coffeeandfun)
- Discord: [invite](https://discord.com/invite/J6EeMvSBYg)

---

## Logo

`src/assets/images/brand/` holds the full set:

| File | Use |
|---|---|
| `coffee-and-fun-logo.png` | Primary, on light backgrounds |
| `coffee-and-fun-logo-dark.png` | On dark sections; also the JSON-LD `logo` (512x512) |
| `logo.png` | Header lockup |
| `favicon.png` | Browser tab |
| `apple-touch-icon.png` | iOS home screen |

The mark is a tilted red mug with a coffee bean on the side, steam curling off, with "Coffee & Fun" set beneath in coral script. It leans. Don't straighten it, the tilt is the character.

**Rules.** Never re-typeset the wordmark in a different font. Never recolour the mug. Never put the light logo on a dark background or vice versa. Give it clear space on all sides equal to the height of the bean.

---

## Colour

Eight brand tokens, defined once in `src/assets/css/coco.css` under `@theme`. Tailwind generates utilities from them, `bg-mocha`, `text-coral-deep`, `ring-espresso`, and so on. **Never hardcode these hexes in a page.** Use the token so one edit moves the whole site.

| Token | Hex | Character | Use for |
|---|---|---|---|
| `cream` | `#fef5ec` | Warm paper | Page background, applied to `<html>` |
| `toffee` | `#c4813a` | Light caramel | Tertiary accents, date badges |
| `mocha` | `#a36942` | Mid brown | Display headings, filter-tab active state |
| `caramel` | `#96603c` | Deep brown | **AA-safe** for white text (5.20:1) |
| `espresso` | `#7a4e31` | Dark brown | Body emphasis, focus rings, "you are here" nav |
| `cocoa` | `#3d2b1f` | Near black | Dark section backgrounds, footer |
| `coral` | `#fd6155` | Bright coral | Display accents, sketch hearts, logo script |
| `coral-deep` | `#c4413a` | Deep coral | **AA-safe** coral (4.70:1 on cream) |

Neutrals come from Tailwind's `stone` scale, never `gray` or `slate`, stone is warm and the others are not.

### The contrast rule that keeps biting

`coral` and `mocha` are **display-only**. They fail AA for body text. Every time they've been used behind white body copy the result measured between 2.4:1 and 3.5:1 against a 4.5:1 requirement.

- White body text on a brand colour → `caramel` or darker.
- Coral text on cream → `coral-deep`.
- `coral` and `mocha` → large display text and decoration only.
- Never use translucent white (`text-white/80`) on a brand background. It looks fine and fails the measurement; use solid `text-white` and darken the background instead.

Measure, don't eyeball. Anything below 4.5:1 for normal text or 3:1 for large text doesn't ship.

### Accent colours outside the palette

A few semantic colours sit outside the brand set on purpose:

- Sage `#4a7249`, Safari platform pill
- The site-menu icon tiles each get their own hue (violet, amber, sky, rose, indigo) so the menu is scannable by colour as well as label. These are deliberate and documented in `modals.liquid`.

---

## Type

Four families, each with exactly one job.

| Family | Role | Loading |
|---|---|---|
| **Pacifico** | Display headings via `.brand-heading` | Self-hosted woff2, preloaded |
| **Caveat** | Handwritten doodle annotations, nav pill | Self-hosted, weights 400/600/700 |
| System stack | All body text | `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, …`, no web font |
| System mono | Code blocks (`pre code`) | `Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace` |
| **JetBrains Mono** | One tool page that needed a real mono | Self-hosted, weights 400/700/800 |
| **Press Start 2P** | The 404 game only | Self-hosted, scoped to that page |

Everything is self-hosted. **No Google Fonts CDN calls, ever**, it's a privacy and performance commitment, not a preference. Site-wide code blocks use the system mono stack and load nothing; JetBrains Mono is a deliberate one-page exception, not the default.

Pacifico was evaluated against Grandstander, Fredoka, Baloo 2, Caveat Brush, and Permanent Marker in August 2026 and deliberately kept. It's a connected script and it is genuinely harder to read at small sizes, which is the trade we accepted for the handmade feel. **Use `.brand-heading` for large headings only.** Small headings get the system stack.

`.brand-heading` carries a coral offset shadow that scales up at `sm` and `lg` breakpoints. It's defined once in `src/_includes/sketch-styles.liquid` and mirrored in `coco.css` for pages that don't load the bundle. If you change one, change both.

---

## The doodles

The hand-drawn SVG sketch marks are the single most recognisable thing about the site. Twenty-five classes live in `sketch-styles.liquid`: arrows, hearts, squiggles, sparkles, checks, lightning, swirls, leaves, loops, zigzags, brackets, dots, crosses, dashes, underlines, and exclamation marks, plus three motion classes (`float`, `float-slow`, `wiggle`).

They are personality, not decoration. Treat them as such:

- Four to eight per section. Scatter them into negative space; never cluster.
- Vary opacity between 0.25 and 0.5 so they sit behind the content.
- Text annotations in Caveat ("the good stuff", "we're friendly!", "the boss") should point at something with a small arrow.
- They hide entirely below 640px.
- They are `aria-hidden` in markup, not by script, so assistive tech never reads them.
- They animate only when the visitor hasn't asked for reduced motion.

---

## Blog social cards

Every blog post gets one card, generated rather than designed by hand so they stay consistent:

```bash
node tools/social-card.mjs src/assets/images/blog/<slug>.png "<cardTitle>"
```

The house style, 1200x630:

| Element | Value |
|---|---|
| Background | Deep purple `#412070` |
| Text plates | Yellow `#fbf2b3`, rounded, one per line, overlapping so they merge into a single sticker |
| Headline | Red `#eb2030`, uppercase, weight 900, **Bloc Bold** (`tools/fonts/Bloc-Bold.ttf`) |
| Logo | Bottom left |
| Topic badge | Optional, bottom right in a cream circle, via `--icon` |

Pass the headline as **one argument**. Two arguments makes two separate stickers with a gap between them, which is occasionally what you want but is not the default look.

Bloc Bold is used only here, in generated images. It is not a web font and is never loaded by the site.

**You do not have to remember to run this.** The Eleventy build checks every blog post and generates a card for any whose `img` file is missing, so a new post cannot ship without one. It never overwrites a card that already exists, so hand-made artwork is safe. Run the command yourself only when you want to *replace* an existing card.

---

## Mascots

**Crash** and **Coco** are Robert's real cats. They appear as the two fighters in the 404 Tournament, drawn from the CC0 [Pixel Cats!](https://pixelfight.itch.io/cat-pack) pack. Crash is the black cat, Coco the orange one. A third fighter, **Konami**, unlocks with the Konami code.

They are cats. An older version of the About page called them "the pups" and paired them with dog photos; that section has been retired and the wording was wrong. Do not reintroduce it.

---

## Voice in one line

Warm, specific, and receipts-first. An indie studio that ships real things and shows its working. Full rules in [writing-style.md](writing-style.md).

---

## Applying the brand to something new

1. Cream background, stone text, brand tokens for everything coloured.
2. One `.brand-heading` per page, large, with the coral shadow.
3. Four to eight doodles, scattered, `aria-hidden`, hidden on mobile.
4. Contrast measured before it ships.
5. Self-hosted fonts only.
6. Two card images: 1200x630 for social, 800x420 for the apps grid.
7. Warm, plain copy with the tone in [writing-style.md](writing-style.md).
