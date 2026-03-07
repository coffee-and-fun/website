# Website Design Prompt

Use this prompt when asking an AI to build a new website matching the Coffee & Fun design language. Replace the brand-specific details (company name, colors, copy) with your own while keeping the structural patterns, layout philosophy, and interaction design intact.

---

## The Prompt

You are building a website for [COMPANY NAME]. Follow this design system exactly. The site should feel warm, handcrafted, and playful while remaining clean and professional. Think indie studio, not corporate. Every page should feel like someone who loves what they do made it by hand.

### Tech Stack

- **Static site generator:** Eleventy (11ty) with Liquid templates
- **CSS:** Tailwind CSS v4 + DaisyUI v5 for component primitives
- **Typography plugin:** @tailwindcss/typography for prose content
- **Theme:** Light mode only (`data-theme="light"`)
- **Fonts:** Self-hosted (no external CDN calls)
- **No JavaScript frameworks.** Vanilla JS only. Keep it simple.

### Color Palette

Every color should feel like it belongs in the same warm family. No cold blues or stark grays.

| Role | Hex | Where it goes |
|------|-----|---------------|
| Primary | `#a36942` | Headings, buttons, active states, links |
| Accent | `#fd6155` | Highlights, secondary CTAs, sketch hearts, coral pops |
| Background | `#fef5ec` | Page background, applied to `<html>` |
| Dark Brown | `#7a4e31` | Dark text, dark section backgrounds |
| Darkest | `#3d2b1f` | Footer backgrounds, very dark accents |
| Medium Brown | `#96603c` | Secondary text, sketch annotation color |
| Golden | `#c4813a` | Tertiary elements, lighter accents, date badges |
| Warm Taupe | `#8b6f4e` | Muted secondary text |
| Sage Green | `#5b8c5a` | Platform badges (Safari, iOS), nature accents |

Neutral text uses Tailwind's `stone` scale: `stone-400` for muted, `stone-500` for body, `stone-600` for emphasis, `stone-900` for headings.

### Typography

Three font layers, no more:

1. **Display font** (headings only): A script or handwritten font like Pacifico. Self-hosted TTF. Used sparingly for hero headings and page titles only. Applied via a `.brand-heading` utility class with a colored text-shadow for depth:
   ```css
   .brand-heading {
       font-family: 'Pacifico', cursive;
       color: #a36942;
       text-shadow: 1.5px 2.5px 0px #fd6155;
   }
   @media (min-width: 640px) { .brand-heading { text-shadow: 2px 3.5px 0px #fd6155; } }
   @media (min-width: 1024px) { .brand-heading { text-shadow: 3px 5px 0px #fd6155; } }
   ```

2. **Handwriting font** (doodle annotations): A casual handwriting font like Caveat. Used for sketch-note labels scattered around the page. Loaded in weights 400, 600, 700.

3. **System font stack** (everything else): `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`. Set directly on the `<html>` tag. No web font loading for body text.

Responsive text sizing uses Tailwind classes, not clamp. Hero: `text-4xl sm:text-5xl lg:text-6xl`. Body: `text-lg sm:text-xl`. Keep line heights relaxed (`leading-relaxed`).

### The Sketch Doodle System

This is the signature design element. Every page has hand-drawn SVG doodles scattered around content using absolute positioning. They add personality without getting in the way.

**How it works:**

- A `.sketch-note` base class handles positioning:
  ```css
  .sketch-note {
      font-family: 'Caveat', cursive;
      color: #96603c;
      position: absolute;
      pointer-events: none;
      white-space: nowrap;
      z-index: 10;
  }
  ```

- Each doodle is an inline SVG inside a `.sketch-note` div, positioned with inline styles (`top`, `left`, `right`, `bottom`, `transform: rotate()`).

- SVG paths use stroke classes for consistent styling:
  - `.sketch-arrow` — brown directional pointers (`#a36942`, stroke-width 2)
  - `.sketch-heart` — coral outline hearts (`#fd6155`, opacity 0.5)
  - `.sketch-squiggle` — organic wavy lines (`#a36942`, opacity 0.35)
  - `.sketch-sparkle` — starburst lines (`#fd6155`, opacity 0.4)
  - `.sketch-circle` — dashed circles (`#fd6155`, dash pattern 6-4)
  - `.sketch-check` — checkmarks (`#a36942`, opacity 0.45)
  - `.sketch-lightning` — lightning bolts (`#c4813a`, opacity 0.35)
  - `.sketch-swirl` — spiral decorations (`#a36942`, opacity 0.3)
  - `.sketch-leaf` — nature shapes (`#a36942`, opacity 0.3)
  - Plus: dots, crosses, zigzags, loops, dashes, underlines, brackets, exclamation marks

- Some doodles are text annotations with the handwriting font: `"fresh off the press"`, `"we do love coffee!"`, `"dive in!"`. These have small SVG arrows pointing toward relevant content.

- Three animation classes for gentle motion:
  - `.sketch-float` — 4s ease-in-out vertical bob (translateY 0 to -4px)
  - `.sketch-float-slow` — 6s ease-in-out vertical bob
  - `.sketch-wiggle` — 3s ease-in-out rotation wobble (+/- 3deg)
  - Use CSS custom property `--sketch-rotate` for base rotation

- **Hidden on mobile** (`max-width: 639px`) — doodles disappear cleanly on small screens.

- Parent sections need `overflow: visible` and `position: relative` for doodles to appear outside bounds.

- Place 4-8 doodles per section. Mix types. Vary opacity (0.25-0.5). Don't cluster them. Scatter around edges and negative space.

- All SVG strokes use `stroke-linecap: round` and `stroke-linejoin: round` for the hand-drawn feel.

### Layout Patterns

**Page structure:** Each page is a self-contained HTML document. No shared layout file. Each includes header, footer, modals, scripts, and sketch-styles via Liquid `{% include %}` tags.

**Container widths:**
- `max-w-5xl` — default content sections
- `max-w-7xl` — full-width grids (blog, apps)
- `max-w-3xl` — narrow content (forms, focused reading)
- Always centered with `mx-auto`
- Responsive horizontal padding: `px-4 sm:px-6 lg:px-8`

**Hero sections:**
- Centered text with `.brand-heading` title
- Subtitle in `text-stone-500`
- One or two CTA buttons (primary solid + outline)
- Generous vertical padding: `pt-20 sm:pt-28 pb-10 sm:pb-14`
- Sketch doodles scattered around the hero

**Grid layouts:**
- Always responsive: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Gap: `gap-8` for cards
- Items are links (`<a>` wrapping the entire card)

**Section spacing:**
- Between major sections: `py-16 sm:py-24`
- Between subsections: `py-10 sm:py-14`
- Between elements: `mb-5`, `mb-8`, `mt-4`

### Component Library

**Cards:**
```
bg-white rounded-2xl border border-stone-200 overflow-hidden
transition-all duration-200 hover:-translate-y-1 hover:shadow-lg
```
- Image at top with `rounded-xl` inside `px-4 pt-4 pb-1` figure
- Content area: `p-4 pt-3`
- Title: `text-lg font-semibold text-stone-900`
- Description: `text-sm text-stone-500 line-clamp-2`
- Platform pills at bottom with `flex flex-wrap gap-1.5 mt-4`

**Buttons:**
- Primary: `btn btn-lg rounded-lg px-8 font-semibold text-white border-0 shadow-lg` with `background-color: #a36942` and hover shadow
- Outline: `btn btn-lg btn-outline rounded-lg px-8 font-semibold border-2` with `border-color: #fd6155; color: #fd6155` and hover fill
- Circular (header): `btn btn-circle btn-sm sm:btn-md` with DaisyUI color variants

**Filter tabs:**
```
padding: 0.5rem 1.25rem; border-radius: 9999px; font-size: 0.875rem;
font-weight: 500; border: 1.5px solid #d6d3d1; color: #78716c;
```
- Hover: `border-color: #a36942; color: #a36942`
- Active: `background-color: #a36942; color: white`

**Platform/category pills:**
- Base: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white`
- Each category gets its own background color from the palette
- Use Liquid conditionals to assign colors based on category name

**Search input:**
- DaisyUI `input input-lg` with `rounded-xl`
- Focus ring: `box-shadow: 0 0 0 3px rgba(163, 105, 66, 0.2)`
- SVG search icon at `opacity-40`

**Modals:**
- DaisyUI `.modal` with `.modal-box`
- White background, generous padding (`py-8 px-4`)
- Close button: `btn btn-sm btn-circle btn-ghost` in top-right corner
- Add `aria-modal="true"` for accessibility

### Navigation

**Header:** Minimal. Logo on the left, circular action buttons on the right. No traditional nav bar. Navigation lives in a hamburger menu modal.

- Logo: Image with `width="80" height="80"`
- Action buttons: Colored circles (`btn-primary`, `btn-secondary`, `btn-warning`, `btn-info`) with SVG icons
- Buttons scale on hover: `hover:scale-110 transition-all duration-200`
- Include a skip-to-content link for accessibility

**Footer:**
- Company logo centered
- Tagline below logo
- Social links as SVG icons in a horizontal row
- Copyright notice
- Sketch doodles scattered throughout
- Background: warm brown or dark section

### Blog System

- Individual markdown files with YAML frontmatter
- Separate `blog.json` data file for the index page grid
- Blog post template includes: OG/Twitter meta tags, JSON-LD structured data, featured image, author/date/reading-time badges, prose content, share buttons
- Author badge: primary color background
- Date badge: golden color background
- Reading time badge: coral color background

### Social Graph Images

- 800x420 pixels
- Warm cream background (#fef5ec)
- Title in the display font (Pacifico-style) with brown color and golden outline/shadow
- Subtitle in lighter brown
- Company logo bottom-left
- Relevant icon bottom-right
- Sketch doodle decorations scattered (stars, hearts, lightning bolts)
- A colored pill badge for context (e.g. "Part 1")

### Accessibility

- Skip-to-content link as first element in header
- `aria-hidden="true"` on all decorative SVGs (automated via JS)
- `aria-label` on all links and buttons that lack visible text
- `aria-modal="true"` on all dialog elements
- `type="button"` on all non-submit buttons
- `.sr-only` labels on search inputs
- Explicit `width` and `height` on all images
- Color contrast: minimum 4.5:1 ratio for text (WCAG AA)
- Focus ring color: `#a36942` with offset

### Performance

- Self-host all fonts (no Google Fonts CDN)
- Preload primary fonts
- `defer` on all non-critical scripts
- `loading="lazy"` on all images below the fold
- CSS minified via PostCSS + cssnano
- Only load what you need (no full libraries for single features)

### The Vibe

The site should feel like walking into a cozy independent coffee shop that happens to make great software. Warm colors, hand-drawn touches, playful copy, but the actual product content is clear and well-organized. Nothing should feel corporate or template-y. Every detail should feel intentional and human.

The doodles aren't decoration — they're personality. They make the site feel alive, like someone just sketched in the margins while having their morning coffee. They guide the eye, add humor, and make people smile. Use them generously but not chaotically.

White space is your friend. Let content breathe. The warm background does a lot of the heavy lifting — you don't need to fill every pixel. Keep cards clean, keep text readable, keep interactions delightful but not distracting.
