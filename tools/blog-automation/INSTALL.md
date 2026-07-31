# Install the weekly blog automation

Do these once on the Mac that hosts the repo (`commanders-mac-mini-local`). All commands assume the
repo at `/Users/commander/Documents/Major/code/coffee/website`.

## 1. Prerequisites (verify in Terminal)

```
which claude node git sips      # all four must print a path
claude -p "say ok"              # confirms Claude Code is installed AND signed in
cd /Users/commander/Documents/Major/code/coffee/website
git push --dry-run origin main  # confirms git can auth to GitHub non-interactively
```

- If `claude` is missing: install Claude Code and run `claude` once to sign in. The scheduled job
  reuses that signed-in session (`~/.claude/`). No API key needs to go in the plist.
- If `git push` prompts for a username/password, set up a credential helper or a Personal Access
  Token once (`git config --global credential.helper osxkeychain` and push once interactively), so
  the unattended job can push. Keep the Mac logged in so the job can reach the keychain.
- If `which claude` prints something other than `/opt/homebrew/bin` or `/usr/local/bin`, add its
  folder to the `PATH` line in both `run-blog.sh` and the plist.

## 2. Put the files in place

The repo files (`tools/social-card.mjs`, `tools/fonts/`, `tools/blog-automation/`) are already
committed. Just make the runner executable and install the launchd job:

```
cd /Users/commander/Documents/Major/code/coffee/website/tools/blog-automation
mkdir -p logs                       # launchd writes its out/err logs here
chmod +x run-blog.sh
cp com.coffeeandfun.blog.plist ~/Library/LaunchAgents/com.coffeeandfun.blog.plist
```

## 3. Test it once, before trusting the schedule

```
launchctl load ~/Library/LaunchAgents/com.coffeeandfun.blog.plist
launchctl start com.coffeeandfun.blog
tail -f /Users/commander/Documents/Major/code/coffee/website/tools/blog-automation/logs/*.log
```

Watch it write a post, build, and push. Check the new post appears on the site after the host
redeploys. If anything looks off, `launchctl unload ...` to pause and tell Claude what happened.

## 4. It's live

Once the test run looks good, leave it loaded. It will publish every Monday at 9:00. Edit
`tools/blog-automation/blog-ideas.md` whenever you want to steer topics.
