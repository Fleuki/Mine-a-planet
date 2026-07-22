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
// Portrait phone viewport to validate the mobile HUD layout.
const page = await browser.newPage({ viewport: { width: 390, height: 780 }, deviceScaleFactor: 2 });

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

// Give lots of drones + a deploy level so we can test picker/collection.
await page.evaluate(() => {
  const g = window.__game;
  for (let i = 0; i < 30; i++) g.spin && g.state.money < 1 ? null : null;
  // directly grant a spread of drones to the hangar
  const ids = ['scout','pebble','twin','buzz','quad','ripper','magma','hexa','nova','quantum','omega','monolith','celestia'];
  for (const id of ids) { g.addDroneToInventory(id); g.discover(id); }
  g.state.upgrades.deploy = 2;   // 3x deploy
  window.ui && window.ui.updateInventory && window.ui.updateInventory();
});

// Collection index
await page.click('#btnCollection');
await page.waitForTimeout(400);
await page.screenshot({ path: 'tools/shot_7_collection.png' });
await page.click('#collectionModal .close');
await page.waitForTimeout(200);

// Dock picker: tap an empty dock near the planet ring (bottom slot area)
await page.evaluate(() => { window.ui && window.ui.openPicker && window.ui.openPicker(0); });
await page.waitForTimeout(400);
await page.screenshot({ path: 'tools/shot_8_picker.png' });
await page.evaluate(() => document.querySelector('#pickModal').classList.remove('open'));
await page.waitForTimeout(200);

// Multi-reel roulette (rolls upgrade -> multiple reels)
await page.evaluate(() => { const g = window.__game; g.state.upgrades.rolls = 3; window.ui.updateRailCosts(); });
await page.click('#btnRoulette');
await page.waitForTimeout(400);
await page.screenshot({ path: 'tools/shot_9_multireel_idle.png' });
const canSpin2 = await page.evaluate(() => !document.querySelector('#doSpin').disabled);
if (canSpin2) { await page.click('#doSpin'); await page.waitForTimeout(2000); await page.screenshot({ path: 'tools/shot_10_multireel_spin.png' }); await page.waitForTimeout(3000); await page.screenshot({ path: 'tools/shot_11_multireel_result.png' }); }
await page.click('#rouletteModal .close');
await page.waitForTimeout(300);

await page.waitForTimeout(500);
await page.screenshot({ path: 'tools/shot_6_final.png' });

console.log('ERRORS:', errors.length ? '\n' + errors.join('\n') : 'none');
await browser.close();
server.close();
