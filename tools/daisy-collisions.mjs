/**
 * Find page CSS class names that accidentally collide with a daisyUI component.
 *
 * Styling a daisyUI component you are deliberately using (.btn, .card-body) is
 * normal and not reported. The hazard is reusing a daisyUI name for your own
 * component: the page rule wins only for the properties it declares, and
 * daisyUI quietly supplies the rest.
 *
 * That is how /tweet-cleanup/'s .steps broke. daisyUI's .steps is a horizontal
 * stepper (display:inline-grid, grid-auto-flow:column). The page set
 * `display:grid` and nothing else about the layout, so it inherited
 * grid-auto-flow:column and squeezed five list items into five narrow columns,
 * while the source read like an ordinary single-column list.
 *
 * So: report a collision only when both sides declare layout properties and the
 * page does not restate every layout property daisyUI sets. Those are the ones
 * that can silently inherit.
 */
import fs from 'node:fs';
import path from 'node:path';

const LAYOUT = /^(display|grid-auto-flow|grid-auto-columns|grid-auto-rows|grid-template-columns|grid-template-rows|flex-direction|flex-wrap|float|position)$/;

const engine = fs.readFileSync('docs/assets/css/engine.css', 'utf8');

// daisyUI v5 wraps each component body in a nested @layer daisyui.* block
const daisy = new Map();
for (const m of engine.matchAll(/\.([a-z][a-z0-9-]*)\{@layer daisyui[^{]*\{([^}]*)\}/g)) {
  const props = new Map();
  for (const decl of m[2].split(';')) {
    const i = decl.indexOf(':');
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    if (LAYOUT.test(prop)) props.set(prop, decl.slice(i + 1).trim());
  }
  if (props.size) daisy.set(m[1], props);
}

const markup = [];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach(e => {
  const p = path.join(d, e.name);
  if (e.isDirectory()) walk(p);
  else if (/\.(liquid|njk|html|md)$/.test(e.name)) markup.push([p, fs.readFileSync(p, 'utf8')]);
});
for (const d of ['src/pages', 'src/_includes']) if (fs.existsSync(d)) walk(d);

const cssDir = 'src/assets/css/pages';
let found = 0;

for (const file of fs.readdirSync(cssDir).filter(f => f.endsWith('.css')).sort()) {
  const css = fs.readFileSync(path.join(cssDir, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

  for (const m of css.matchAll(/(^|[\s,>+~])\.([a-z][a-z0-9-]*)\s*\{([^}]*)\}/gm)) {
    const cls = m[2];
    const dProps = daisy.get(cls);
    if (!dProps) continue;

    const own = new Map();
    for (const decl of m[3].split(';')) {
      const i = decl.indexOf(':');
      if (i < 0) continue;
      const prop = decl.slice(0, i).trim();
      if (LAYOUT.test(prop)) own.set(prop, decl.slice(i + 1).trim());
    }
    // only interesting if the page is laying this out itself
    if (!own.has('display')) continue;

    const inherited = [...dProps.keys()].filter(p => !own.has(p));
    if (!inherited.length) continue;

    const where = markup
      .filter(([, s]) => new RegExp(`class="[^"]*\\b${cls}\\b`).test(s))
      .map(([p]) => path.basename(p));
    if (!where.length) continue;

    found++;
    console.log(`  ${file.replace('.css', '')} — .${cls}`);
    console.log(`      page sets   : display:${own.get('display')}`);
    console.log(`      inherits    : ${inherited.map(p => `${p}:${dProps.get(p)}`).join('; ')}`);
    console.log(`      used in     : ${where.join(', ')}\n`);
  }
}

console.log(`  daisyUI components with layout rules: ${daisy.size}`);
console.log(`  silent-inheritance collisions: ${found}`);
