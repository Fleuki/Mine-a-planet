/**
 * Headless boot check for Mine a Planet.
 *
 * The game has no test framework and no build step, so the thing worth
 * guarding is simply: does index.html still load every module, boot the Game,
 * remove the loader and open a modal without throwing? Anything that breaks
 * the script order in index.html trips this.
 *
 * Usage:  python3 -m http.server 8123 &   node tools/smoke.mjs [url]
 */
import { chromium } from 'playwright';

const url = process.argv[2] || 'http://localhost:8123/index.html';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 420, height: 840 } });

const errors = [];
const missingArt = [];

// A 404 under assets/ is by design, not a failure: DRONE_ART / PLANET_ART /
// ORE_ART may name art that has not landed yet, and getArt() marks it failed so
// the renderer falls back to the procedural sprite. Surface those separately so
// a genuinely broken page still fails the run.
page.on('response', (r) => {
  if (r.status() === 404 && r.url().includes('/assets/')) missingArt.push(r.url().split('/').slice(-2).join('/'));
});
page.on('console', (m) => {
  if (m.type() !== 'error') return;
  const t = m.text();
  if (/Failed to load resource/.test(t) && missingArt.length) return;
  errors.push(`console: ${t}`);
});
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);

const state = await page.evaluate(() => ({
  loaderGone: !document.getElementById('loader'),
  gameBooted: typeof game !== 'undefined' && !!game,
  uiBooted: typeof ui !== 'undefined' && !!ui,
  canvasSized: document.getElementById('game').width > 0,
  money: document.getElementById('moneyVal')?.textContent ?? null,
}));

// The roulette modal exercises config + sprites + ui together.
await page.click('#btnRoulette');
await page.waitForTimeout(500);
state.rouletteOpen = await page.evaluate(
  () => document.getElementById('rouletteModal').classList.contains('open'),
);

await browser.close();

console.log(JSON.stringify(state, null, 2));

if (missingArt.length) {
  console.log(`\nNote: ${missingArt.length} optional art file(s) not present, ` +
    `procedural fallback in use: ${missingArt.join(', ')}`);
}

const failures = Object.entries(state)
  .filter(([k, v]) => k !== 'money' && !v)
  .map(([k]) => `expected ${k} to be true`)
  .concat(errors);

if (failures.length) {
  console.error('\nSmoke test FAILED:');
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log('\nSmoke test passed.');
