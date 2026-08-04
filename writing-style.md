# Writing style

How Coffee & Fun sounds. For the visual identity see [branding.md](branding.md); for markup conventions see [style.md](style.md).

> **Read this first.** 48 of the 49 blog posts predate these rules and break them freely. Do not learn the voice by averaging the archive. The one compliant post is `src/pages/blog/snoopification.md`. Copy that, not the corpus.

---

## The non-negotiables

Lifted verbatim from `BLOG-QUEUE.md`, which is the source of truth. These were written after a batch of five posts was deleted for being, in Robert's words, well-written filler.

- **Receipts over claims.** First-person evidence: screenshots, logs, tables, costs, commit hashes. If the post could run on any dev blog, it isn't done.
- **No credential-flexing.** Never "after 15 years of publishing." The artifacts prove authority.
- **A falsifiable spine.** Say something a reader could argue with.
- **Endings land a thought**, never a product funnel.
- **One post at a time.** Never batch-publish; never cross-link a same-week mesh.
- **Never fabricate.** No invented stats, quotes, test results, or URLs. Mark evidence you cannot gather with `<!-- TODO: Robert verify/capture -->`. An honest hole beats a made-up receipt.
- **No em dashes or en dashes**, anywhere, ever. Commas, periods, colons, parentheses.
- Plain, warm, rhythmically short sentences. Dry jokes in passing, not performed.

From `tools/blog-automation/write-post.md`, which drives the weekly draft:

- Write as Robert James Gabriel. One named human, not a brand voice.
- 1500 words minimum. These are in-depth pieces, not listicles.
- Exactly one H1, and it comes from `cardTitle`. Never put a `#` heading in the body. Use `##` and `###`.
- 2 to 4 external links, each verified by actually fetching it. 2 to 4 internal links, each verified to exist.
- A draft with honest holes is correct. A draft with invented receipts is a firing offense.

---

## What the voice actually is

**A person who did a thing, showing what they found.** Not a company explaining a product. The engine of nearly every good post is that somebody poked at something and can prove it.

**Short sentences with varied rhythm.** Fragments are allowed as beats:

> More steps.
> More clutter.
> More pop-ups.

**Direct address.** "You" is everywhere in the how-tos and it should be. The reader has the problem right now.

**Self-deprecation as the closing move.** The signature is a paired question that deflates the author:

> Was this a clever hack? Not really, the door was wide open.
> Was it fun watching Microsoft scramble to fix it? Absolutely.

**Jokes in parentheses, never in the spotlight.** "(spoiler: it didn't)". "Different Snoop, no relation." A dry aside as you walk past, not a bit.

**Uncertainty gets its own section, not hedge words.** Do not sprinkle "arguably" and "it could be said" through the prose. State things flat, then quarantine the doubt somewhere honest. `snoopification.md` has a heading literally called "Where my own theory gets shaky." That is the pattern.

**Admit what you could not get.** "I cannot show you a photo of that, because every good one is a wire service image I do not have the rights to reproduce." That sentence buys more trust than a stock photo would.

---

## I or we

| Use | When |
|---|---|
| **"I"** | Investigations, reverse-engineering, how-tos, reviews, anything with a personal itch behind it |
| **"we"** | Company posts: year in review, quarterly updates, roadmap, announcements |

Roughly half the archive uses each. The split is not random and it should not be.

---

## Structure

**Open on the problem or the discovery.** No throat-clearing, no "in today's fast-paced world."

Openings that work:

> A broken update just went live and your users are feeling it.

> My wife, Courtney Hood, coined a word I have not stopped using since.

**Close on a thought.** Never a download button, never "find me on Twitter." The archive is full of funnel endings and they are the single most common rule violation.

Endings that work:

> The word is Courtney's. I am just the one who wrote it down.

> Ideas will always be copied. Tools will always be cloned.
> But people stay for care, curiosity, and genuine effort.

**Receipts belong in tables.** Hard numbers, sourced and dated, with the drift acknowledged: "checked 2 August 2026, both numbers drift."

**Cite your sources at the bottom.** `snoopification.md` ends with roughly fifteen links plus image attributions. That section is the proof, not decoration.

---

## Punctuation and mechanics

| Thing | Rule |
|---|---|
| Em dash (`&mdash;`) | **Banned site-wide.** Not just the blog: help articles, templates, page copy, UI strings, everything. |
| En dash (`&ndash;`) | Banned in sentences. Acceptable only in genuine numeric ranges like `16-32px`, and a plain hyphen is fine there too. |
| Apostrophes and quotes | Straight ASCII. Current direction, `snoopification.md` is 100% straight. |
| Oxford comma | Yes. |
| Heading case | **Sentence case.** "Where my own theory gets shaky", not "Where My Own Theory Gets Shaky". |
| Emoji in headings | No. Twelve legacy posts have them. Do not add more. |
| `---` rules | Use sparingly. Legacy posts have up to eighteen. They are noise. |
| Contractions | Fine in how-tos and help. `snoopification.md` uses none, which reads more formal. Either is acceptable; be consistent inside one piece. |

---

## Blog front matter

Every post carries the same eighteen fields. The two that matter most are easy to get wrong:

- **`title`** is the SEO `<title>`. Short, keyword front-loaded, 31 to 48 characters. The template appends ` - Coffee & Fun LLC`.
- **`cardTitle`** is what renders as the on-page `<h1>`. Longer and punchier.

They are deliberately different:

| `title` | `cardTitle` |
|---|---|
| Snoopification: Mascots and Brands on Everything | Snoopification: When a Mascot or Brand Goes on Everything |
| Enshittification: Why Tech Gets Worse | The Enshittification of Technology |
| Meta Tags in 2026: What Still Matters | What Every Meta Tag Actually Does in 2026 |

- **`description`**: 141 to 172 characters in practice, target 150 to 160.
- **`name`**: always `Robert James Gabriel`.
- **`layout`**: always `templates/post.liquid`.
- **`date`**: T12:00Z.
- **`time`**: `"8 min"` on blog, `"8 min read"` in help.
- **`blog_cat`**: pick from the existing vocabulary before inventing one. Usecase, Tools, Development, Update, Reverse Engineering, Commentary, Announcement are the established ones.

**A post is invisible until it has an entry in `src/_data/blog.json`.** This is the most common way to lose an afternoon.

---

## Help Center is a different voice, on purpose

Help articles are not blog posts and should not sound like them.

- **No narrator.** Zero "I". No origin story, no argument, no opinion.
- **No lede and no H1.** Articles open cold on `## Step 1: Install it`.
- **Imperative, second person.** "Pick your platform." "Don't panic, and don't keep typing."
- **Troubleshooting headings are the words a panicking user would type.** "A document won't save." "My notes disappeared." "Still stuck?"
- **UI paths in bold with arrows:** `**Settings → Appearance → Theme**`.
- **`<kbd>` for keys, blockquotes for callouts.**
- **Definition lists use a colon, not a dash.** `**Chrome**: free from the Chrome Web Store.` The em dash was the old house separator here and it is now banned site-wide.
- **Personality lives in the product, not the prose.** "🌴 **Vaporwave mode**: A E S T H E T I C." Help reports the joke deadpan; it does not make one.
- Contractions stay.
- Ampersands are fine in help titles where the blog would spell out "and".

---

## Two things nobody has decided yet

These are live contradictions. Worth settling rather than letting each new page pick a side.

1. **The automation points at a non-compliant exemplar.** `write-post.md:10` holds up `xbox-dvr-exploit-api-major-nelson.md` as "the blog at its best", but that post has an emoji heading, a body H1, and a Twitter funnel close, all three now banned. It is presumably cited for its front matter shape. Worth making that explicit or picking a new exemplar.

2. **19 of 49 posts have a body H1** on top of the template's `cardTitle` H1. That is a duplicate-H1 accessibility and SEO fault, and it directly violates `write-post.md:49`.

---

## Before publishing

1. Could this run on any dev blog? If yes, it isn't done.
2. Is there at least one thing a reader could argue with?
3. Does the ending land a thought rather than a download link?
4. Every number sourced, dated, and real. Holes marked `<!-- TODO: Robert verify/capture -->`.
5. No em dashes. No en dashes. Search the file.
6. Exactly one H1, from `cardTitle`. No `#` in the body.
7. Sentence case headings, no emoji.
8. Links checked: 2 to 4 external actually fetched, 2 to 4 internal confirmed to exist.
9. `title` under 48 characters, `description` 150 to 160.
10. Entry added to `src/_data/blog.json`.
11. 1200x630 social card exists.
12. `npx @11ty/eleventy` builds clean.
13. **Never push.** Robert reviews and pushes.
