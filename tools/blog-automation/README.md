# Coffee & Fun blog automation

Drafts one blog post once a week (Mondays, 9:00 local) using headless Claude Code and
commits it locally. It never pushes: Robert reviews each draft and publishes it himself.

## Pieces

- `write-post.md` — the instructions Claude follows to draft one post (voice rules, receipts,
  SEO, links, card, no em dashes, verify, local commit).
- `../../BLOG-QUEUE.md` (repo root) — the topic queue AND the binding voice rules. The runner takes the first unchecked `[ ]` and checks it
  off when drafted. Add or reorder ideas any time.
- `run-blog.sh` — the launchd entry point. Sets PATH, pulls latest, runs Claude headless, logs to
  `logs/`.
- `com.coffeeandfun.blog.plist` — the launchd schedule. Copy to `~/Library/LaunchAgents/`.
- `logs/` — one timestamped log per run, plus launchd's own out/err logs.

## How a run works

1. `git pull --rebase origin main`
2. Claude reads the conventions + queue, picks the next topic.
3. Researches it, verifies every external link loads and every internal link exists.
4. Writes `src/pages/blog/<slug>.md` (single H1 from `cardTitle`, no em dashes, valid YAML).
5. Generates the purple OG card with `tools/social-card.mjs` and a `.webp` via `sips`.
6. Prepends an entry to `src/_data/blog.json`, checks the idea off in `BLOG-QUEUE.md`.
7. Runs `npm run build`; if it fails, it fixes it and does not commit a broken build.
8. `git commit` locally, then stops. Robert reviews the draft and pushes when it earns it.

## Controls

- Pause:  `launchctl unload ~/Library/LaunchAgents/com.coffeeandfun.blog.plist`
- Resume: `launchctl load  ~/Library/LaunchAgents/com.coffeeandfun.blog.plist`
- Run now (test): `launchctl start com.coffeeandfun.blog`  then  `tail -f tools/blog-automation/logs/*.log`
- Change cadence/time: edit the `StartCalendarInterval` in the plist, then unload + load.
- Change topics: edit `BLOG-QUEUE.md` at the repo root.

## Cards stay consistent

`tools/social-card.mjs` now bundles the headline font (`tools/fonts/ArchivoBlack.ttf`) and draws
the soft shadow, so every card looks the same whether it is generated here, on a laptop, or by the
scheduled job.

## Note on deploy

This assumes pushing to `main` triggers your host to rebuild (the built `docs/` folder is
gitignored, so something builds from source on push). If your site instead serves a committed
`docs/` folder, tell Claude and the runner can be changed to build and commit `docs/` too.
