# Coffee & Fun design review

Review date: September 7, 2026 (UTC). Scope: the Coffee & Fun LLC website in this repository.

## Direction

Keep the cream palette, illustrated coffee logo, Pacifico headings, Caveat annotations, playful
utilities, and existing homepage flow. Refine how those elements fit together, especially in the
shared header.

## Findings and changes

| Finding                                                                             | Refinement                                                                                                            |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| The logo, navigation pill, and utility pill felt like three separate objects.       | A single warm paper bar aligns them, with a light border and restrained shadow.                                       |
| Small header icons had tight targets; desktop navigation appeared early on tablets. | Utility targets are at least 44px, with a compact modal-menu layout below 1024px.                                     |
| Rich dropdowns depended on CSS anchor positioning and daisyUI's megamenu layout.    | Native popovers use a shared viewport-constrained layout, with direct-link fallback for older browsers.               |
| An open disclosure did not show a reliable visual state.                            | Open triggers expose `aria-expanded`, receive a warm fill, and turn the chevron upward.                               |
| Product pages did not consistently identify their parent navigation section.        | Product detail pages using the shared header mark Apps; additional existing tool routes mark Tools.                   |
| Mobile hero lettering wrapped to four lines and pushed actions down the screen.     | Fluid two-line lettering, tighter hero spacing, and side-by-side actions at typical phone widths.                     |
| The primary action had an endless animated glow.                                    | A steady button shadow and the existing handwritten annotation provide emphasis.                                      |
| Some copy relied on broad claims or unsupported numbers.                            | Homepage and featured-app copy describe useful behavior; the supporting note now reads “Made with care (and coffee).” |
| Two small handwritten homepage notes had low contrast.                              | Removed their extra opacity so the text stays readable.                                                               |
| The mobile directory used a cooler white than the desktop navigation.               | Its surface and border now match the shared warm palette, with larger secondary text and a 44px close button.         |

The catalog data, existing imagery, product capabilities, and homepage section order were preserved.
Existing unrelated working-tree changes were left in place. The Markdown Editor repository was not
edited.

## Brand documentation

- [branding.md](branding.md): positioning, names, logo, palette, typography, imagery, motion, and
  claims.
- [writing-style.md](writing-style.md): voice, tone by situation, interface copy, examples,
  evidence, and article conventions.
- [style.md](style.md): component rules, responsive behavior, accessibility, implementation
  locations, and verification workflow.

## Validation

- Production build: passed, writing 157 files. No new dependencies.
- Browser: Google Chrome on macOS, against the locally built site.
- Automated accessibility: 14 axe-core scans with no violations for the selected WCAG A/AA rules.
  These covered the desktop and mobile homepage; Company, Apps, and Tools popovers; the mobile
  dialog at 320, 390, and 768px; and the shared headers on Apps, Blog, Help, Support, Immersive
  Reader, and Contrast Checker.
- Responsive layout: no page overflow or header controls outside the viewport at 320, 390, 768,
  1024, and 1440px. The mobile dialog fits an 844 by 390px landscape viewport. The desktop header
  also fits with the root text size enlarged to 200% at 1440px.
- Keyboard: skip link clears the header; ArrowDown enters each panel; Escape closes it and restores
  focus; Tab can leave a panel; mobile dialog closing returns focus to its trigger.
- Interaction: outside-click dismissal, switching between panels, and resizing an open desktop menu
  to mobile all passed.
- Navigation: 34 internal header destinations returned HTTP 200. Desktop native popovers and the
  small-screen direct-link fallback remain usable with JavaScript disabled.
- Reduced motion: header transitions stop under the preference. The homepage primary action no
  longer has a continuous aura animation.
- Runtime: no page JavaScript errors during the navigation checks.
- Visual inspection: desktop and mobile homepage, open Apps panel, mobile directory, and the Apps,
  Blog, and Help pages.

These checks cover the changed surfaces, not every tool workflow or a complete accessibility
certification. Safari, Firefox, and assistive-technology sessions were not run. The dedicated
Markdown Editor product page has its own header and was preserved. Changes are local; no production
deployment was made.
