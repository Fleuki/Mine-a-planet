import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(new URL('../src', import.meta.url).pathname);
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.png':'image/png', '.svg':'image/svg+xml' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const file = path.join(ROOT, p);
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); res.end('nf'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise(r => server.listen(0, r));
const port = server.address().port;
const base = `http://localhost:${port}`;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 900, height: 500 }, deviceScaleFactor: 2 });

const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

await page.goto(base, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.screenshot({ path: 'tools/shot_1_main.png' });

// Give money so we can test everything
await page.evaluate(() => { window.__cheat && window.__cheat(); });

// Open roulette
await page.click('#btnRoulette');
await page.waitForTimeout(500);
await page.screenshot({ path: 'tools/shot_2_roulette.png' });
// spin if possible
const canSpin = await page.evaluate(() => !document.querySelector('#doSpin').disabled);
if (canSpin) { await page.click('#doSpin'); await page.waitForTimeout(3800); await page.screenshot({ path: 'tools/shot_3_spinresult.png' }); }
await page.click('#rouletteModal .close');
await page.waitForTimeout(300);

// Open upgrades
await page.click('#btnUpgrades');
await page.waitForTimeout(400);
await page.screenshot({ path: 'tools/shot_4_upgrades.png' });
await page.click('#upgradesModal .close');
await page.waitForTimeout(200);

// Open planet
await page.click('#btnPlanet');
await page.waitForTimeout(400);
await page.screenshot({ path: 'tools/shot_5_planet.png' });
await page.click('#planetModal .close');
await page.waitForTimeout(200);

await page.waitForTimeout(500);
await page.screenshot({ path: 'tools/shot_6_final.png' });

console.log('ERRORS:', errors.length ? '\n' + errors.join('\n') : 'none');
await browser.close();
server.close();
