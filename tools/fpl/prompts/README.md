# Copy-paste prompts

Two files, each the complete prompt for one scheduled task. Open the file, select
everything, paste it into the task's prompt field. No editing needed.

Generated from the blockquotes in `../SCHEDULED-TASK.md`, with the `>` markers
stripped. If you change the prompts, change them there and regenerate, or the two
will drift apart.

| File | Task id | Cron |
|---|---|---|
| `generate.txt` | `fpl-generate` | `17 10 * * *` |
| `publish.txt` | `fpl-publish` | `23 9 * * *` |

Both run **daily** on purpose. Deadlines are not on a fixed weekday: 2026/27 has
27 Saturdays, 4 Fridays, 2 Sundays and 5 Wednesdays. Each prompt asks
`status.mjs` first and exits quietly on the days there is nothing to do, so most
mornings both will finish in seconds having done nothing.

If you edit `SCHEDULED-TASK.md`, regenerate with:

```bash
node -e "
const fs=require('fs');
const src=fs.readFileSync('tools/fpl/SCHEDULED-TASK.md','utf8').split('\n');
const blocks=[]; let cur=null;
for(const line of src){
  if(line.startsWith('>')){ if(!cur) cur=[]; cur.push(line.replace(/^>\s?/,'')); }
  else if(cur){ if(cur.join('').trim()) blocks.push(cur); cur=null; }
}
if(cur && cur.join('').trim()) blocks.push(cur);
const trim=a=>a.join('\n').replace(/\n{3,}/g,'\n\n').trim()+'\n';
fs.writeFileSync('tools/fpl/prompts/generate.txt', trim(blocks[0]));
fs.writeFileSync('tools/fpl/prompts/publish.txt', trim(blocks[1]));
console.log('regenerated');
"
```
