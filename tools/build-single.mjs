// Bundles the multi-file game into ONE self-contained HTML file so it can be
// published as a Claude Artifact (no server, no external requests).
import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(new URL('..', import.meta.url).pathname);
const S = (p) => path.join(ROOT, p);

// 1) Bundle all JS modules into a single IIFE.
const res = await esbuild.build({
  entryPoints: [S('src/js/main.js')],
  bundle: true,
  format: 'iife',
  write: false,
  legalComments: 'none',
  target: ['es2019'],
});
let js = res.outputFiles[0].text;

// 2) Inline the celestial hero sprite as a data URI (no file server available).
const svg = fs.readFileSync(S('src/assets/drones/celestia.svg'), 'utf8');
const dataUri = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64');
js = js.split('assets/drones/celestia.svg').join(dataUri);

// 3) Read the stylesheet.
const css = fs.readFileSync(S('src/css/style.css'), 'utf8');

// 4) Take the <body> contents of index.html, minus the external scripts.
const html = fs.readFileSync(S('src/index.html'), 'utf8');
let body = html.split('<body>')[1].split('</body>')[0];
body = body.split('<!-- Yandex Games SDK')[0].trim();

// 5) Assemble the single-file page (Artifact adds <!doctype><head><body>).
const out = `<style>\n${css}\n</style>\n\n${body}\n\n<script>\n${js}\n</script>\n`;
const dest = S('tools/mine-a-planet.html');
fs.writeFileSync(dest, out);
console.log('Wrote', dest, '(' + Math.round(out.length / 1024) + ' KB)');
