/**
 * Turns an image with a baked transparency checkerboard into a real PNG with an
 * alpha channel, then downscales it to the size the game actually draws.
 *
 * Image models hand back a flattened raster — a JPEG especially, which cannot
 * carry alpha at all — so the checkerboard the preview showed ends up as
 * pixels. drawDroneArt() and drawOreGem() composite over the planet, so that
 * background has to go or the sprite renders inside a visible grey box.
 *
 * The two checker greys are strictly neutral (R=G=B), which is what separates
 * them from the art. Cutting is a flood fill inward from the borders rather
 * than a global colour match, so neutral greys *inside* the subject survive.
 *
 * Usage: node tools/dechecker.mjs <in> <out.png> <targetW> <targetH>
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const [input, output, tw, th] = process.argv.slice(2);
if (!input || !output) {
  console.error('usage: node tools/dechecker.mjs <in> <out.png> [targetW] [targetH]');
  process.exit(1);
}

const dataUrl = `data:image/${path.extname(input).slice(1).replace('jpg', 'jpeg')};base64,` +
  fs.readFileSync(input).toString('base64');

const browser = await chromium.launch();
const page = await browser.newPage();

const png = await page.evaluate(async ({ src, tw, th }) => {
  const img = new Image();
  await new Promise((ok, no) => { img.onload = ok; img.onerror = no; img.src = src; });

  const W = img.width, H = img.height;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0);
  const im = g.getImageData(0, 0, W, H);
  const d = im.data;

  // Learn the checker levels from the border, counting only neutral pixels.
  const levels = {};
  const isNeutral = (i, tol) => {
    const r = d[i], gg = d[i + 1], b = d[i + 2];
    return Math.max(Math.abs(r - gg), Math.abs(gg - b), Math.abs(r - b)) <= tol;
  };
  const note = (x, y) => {
    const i = (y * W + x) * 4;
    if (isNeutral(i, 10)) { const k = Math.round(d[i] / 4) * 4; levels[k] = (levels[k] || 0) + 1; }
  };
  for (let x = 0; x < W; x++) { note(x, 0); note(x, H - 1); }
  for (let y = 0; y < H; y++) { note(0, y); note(W - 1, y); }
  const top = Object.entries(levels).sort((a, b) => b[1] - a[1]).slice(0, 2).map(e => +e[0]);
  if (top.length === 0) return null;

  const isBg = (i) => {
    if (!isNeutral(i, 14)) return false;
    const v = d[i];
    return top.some(L => Math.abs(v - L) <= 30);
  };

  // Flood fill from every border pixel that looks like checker.
  const bg = new Uint8Array(W * H);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const p = y * W + x;
    if (bg[p]) return;
    if (!isBg(p * 4)) return;
    bg[p] = 1; stack.push(p);
  };
  for (let x = 0; x < W; x++) { push(x, 0); push(x, H - 1); }
  for (let y = 0; y < H; y++) { push(0, y); push(W - 1, y); }
  while (stack.length) {
    const p = stack.pop(), x = p % W, y = (p / W) | 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }

  // Grow the cut by one pixel to eat the JPEG ringing that haloes the edge.
  const grown = bg.slice();
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const p = y * W + x;
      if (bg[p]) continue;
      if ((bg[p - 1] || bg[p + 1] || bg[p - W] || bg[p + W]) && isNeutral(p * 4, 26)) grown[p] = 1;
    }
  }
  for (let p = 0; p < W * H; p++) if (grown[p]) d[p * 4 + 3] = 0;
  g.putImageData(im, 0, 0);

  // Soften the cut edge so it does not alias when scaled down.
  const soft = document.createElement('canvas'); soft.width = W; soft.height = H;
  const sg = soft.getContext('2d');
  sg.filter = 'blur(1px)'; sg.drawImage(c, 0, 0); sg.filter = 'none';
  const blurred = sg.getImageData(0, 0, W, H);
  for (let p = 0; p < W * H; p++) {
    const a = im.data[p * 4 + 3], ab = blurred.data[p * 4 + 3];
    im.data[p * 4 + 3] = a === 0 ? 0 : Math.min(a, ab < a ? (a + ab) >> 1 : a);
  }
  g.putImageData(im, 0, 0);

  // Downscale in halving steps; a single big jump loses the thin outlines.
  let cur = c;
  const targetW = +tw || W, targetH = +th || H;
  while (cur.width > targetW * 2) {
    const n = document.createElement('canvas');
    n.width = Math.max(targetW, cur.width >> 1);
    n.height = Math.max(targetH, cur.height >> 1);
    const ng = n.getContext('2d');
    ng.imageSmoothingQuality = 'high';
    ng.drawImage(cur, 0, 0, n.width, n.height);
    cur = n;
  }
  const fin = document.createElement('canvas'); fin.width = targetW; fin.height = targetH;
  const fg = fin.getContext('2d');
  fg.imageSmoothingQuality = 'high';
  fg.drawImage(cur, 0, 0, targetW, targetH);

  // Report how much actually became transparent — a near-zero cut means the
  // detection missed and the sprite still has its box.
  const fd = fg.getImageData(0, 0, targetW, targetH).data;
  let clear = 0;
  for (let i = 3; i < fd.length; i += 4) if (fd[i] < 8) clear++;
  return { url: fin.toDataURL('image/png'), levels: top, cutPct: (clear / (targetW * targetH) * 100).toFixed(1) };
}, { src: dataUrl, tw, th });

await browser.close();
if (!png) { console.error('no neutral border found — is there a checkerboard at all?'); process.exit(1); }
fs.writeFileSync(output, Buffer.from(png.url.split(',')[1], 'base64'));
console.log(`${output}  checker levels ${png.levels.join('/')}  transparent ${png.cutPct}%  ` +
  `${(fs.statSync(output).size / 1024).toFixed(0)}KB`);
