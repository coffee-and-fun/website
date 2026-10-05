// Representative rendered-page audit; Lighthouse also reports unscored accessibility findings.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
const pages = process.argv.slice(2);
const urls = pages.length ? pages : ['/', '/apps/', '/stillkeys/', '/markdown-editor/', '/immersive-reader/', '/procrastinot/', '/hide-spoilers-extension/', '/instant-incognito/', '/flash-cards/', '/resources/', '/accessibility/', '/receipt-generator/', '/focus-timer/', '/private-line/', '/drop-dungeon/', '/word-clock/', '/citizenship-test/', '/blog/', '/help/', '/blog/how-we-score-game-accessibility/', '/help/markdown-editor-getting-started/'];
const run = url => new Promise(resolve => {
 const child = spawn(path.resolve('node_modules/.bin/lighthouse'), ['http://localhost:8743'+url,'--only-categories=seo,accessibility','--output=json','--output-path=stdout','--chrome-flags=--headless=new --no-sandbox --disable-gpu','--quiet'], {stdio:['ignore','pipe','ignore']});
 let output='';child.stdout.on('data',chunk=>output+=chunk);
 child.on('error',error=>resolve({url,error:error.message}));
 child.on('close',()=>{try {
  const r=JSON.parse(output);
  const refs=new Set([...r.categories.seo.auditRefs,...r.categories.accessibility.auditRefs].map(a=>a.id));
  resolve({url,seo:r.categories.seo.score,accessibility:r.categories.accessibility.score,findings:Object.entries(r.audits).filter(([id,a])=>refs.has(id)&&a.score!==null&&a.score<1).map(([id,a])=>({id,title:a.title,items:a.details?.items}))});
 } catch {resolve({url,error:'Could not read Lighthouse output'});} });
});
const results=[];
for(let i=0;i<urls.length;i+=4){results.push(...await Promise.all(urls.slice(i,i+4).map(run)));console.log(`Audited ${results.length}/${urls.length} pages`);}
fs.mkdirSync('audits',{recursive:true});
const file=process.env.AUDIT_OUTPUT || 'audits/rendered-pages.json';
fs.writeFileSync(file,JSON.stringify(results,null,2)+'\n');
for(const r of results)console.log(r.url, r.error || `SEO ${Math.round(r.seo*100)}, accessibility ${Math.round(r.accessibility*100)}; ${r.findings.map(f=>f.id).join(', ')||'no automated findings'}`);
process.exitCode=results.some(r=>r.error||r.findings.length)?1:0;
