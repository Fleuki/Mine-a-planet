// ============================================================================
//  Static sprite drawing for UI thumbnails (drones, planets).
// ============================================================================
import { DRONE_BY_ID, RARITIES, PLANETS, ORES, PLANET_ART } from './config.js';
import { roundRect, hexA, drawDroneChassis, drawDrill, drawDroneArt } from './render.js';
import { getArt } from './assets.js';

// Draw a drone icon into a canvas element, upright, with a neon rarity ring.
export function drawDroneIcon(canvas, droneId, star = 0) {
  const drone = DRONE_BY_ID[droneId];
  if (!drone) return;
  const rar = RARITIES[drone.rarity];
  const dpr = window.devicePixelRatio || 1;
  const size = canvas.clientWidth || 64;
  canvas.width = size * dpr; canvas.height = size * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, size, size);

  const cx = size / 2, cy = size * 0.46, R = size * 0.2;

  // Soft rarity haze.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const haze = ctx.createRadialGradient(cx, cy, size * 0.1, cx, cy, size * 0.46);
  haze.addColorStop(0, hexA(rar.glow, 0.22));
  haze.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = haze; ctx.beginPath(); ctx.arc(cx, cy, size * 0.46, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Crisp neon rarity ring behind the drone.
  ctx.save();
  ctx.strokeStyle = hexA(rar.color, 0.8); ctx.lineWidth = Math.max(1.4, size * 0.026);
  ctx.shadowColor = rar.glow; ctx.shadowBlur = size * 0.09;
  ctx.beginPath(); ctx.arc(cx, cy, size * 0.35, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // Custom sprite if present, else procedural chassis + static drill.
  ctx.save();
  ctx.translate(cx, cy);
  if (!drawDroneArt(ctx, drone, R)) {
    drawDroneChassis(ctx, drone, rar, R, { animated: false });
    ctx.save();
    ctx.translate(0, R * 0.62 + R * 0.1);
    drawDrill(ctx, drone.shape, R, 0.5, rar, false);
    ctx.restore();
  }
  ctx.restore();

  if (star > 0) drawStarRow(ctx, cx, size * 0.95, star, size * 0.075);
}

// A centered row of gold stars (used on icons + world drones).
export function drawStarRow(ctx, cx, cy, count, r) {
  const gap = r * 2.3;
  const totalW = (count - 1) * gap;
  ctx.save();
  ctx.textBaseline = 'middle';
  for (let i = 0; i < count; i++) {
    star5(ctx, cx - totalW / 2 + i * gap, cy, r);
  }
  ctx.restore();
}

function star5(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
  }
  ctx.closePath();
  ctx.fillStyle = '#ffd54a';
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 2;
  ctx.fill();
  ctx.lineWidth = 0.8; ctx.strokeStyle = '#b7791f'; ctx.shadowBlur = 0; ctx.stroke();
  ctx.restore();
}

// Draw a small planet icon for a given tier.
export function drawPlanetIcon(canvas, tier) {
  const p = PLANETS[tier];
  if (!p) return;
  const dpr = window.devicePixelRatio || 1;
  const size = canvas.clientWidth || 100;
  canvas.width = size * dpr; canvas.height = size * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, size, size);
  const cx = size / 2, cy = size / 2, R = size * 0.36;

  // atmosphere
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const atmo = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.35);
  atmo.addColorStop(0, hexA(p.atmos, 0)); atmo.addColorStop(0.6, hexA(p.atmos, 0.35)); atmo.addColorStop(1, hexA(p.atmos, 0));
  ctx.fillStyle = atmo; ctx.beginPath(); ctx.arc(cx, cy, R * 1.35, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // body
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
  // Custom static planet art overrides the procedural disc when present.
  const pArt = PLANET_ART[tier] && getArt(PLANET_ART[tier]);
  if (pArt && pArt.ready && pArt.img.width) {
    ctx.drawImage(pArt.img, cx - R, cy - R, R * 2, R * 2);
    const shd = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R * 1.05);
    shd.addColorStop(0, 'rgba(255,255,255,0.18)'); shd.addColorStop(0.55, 'rgba(255,255,255,0)');
    shd.addColorStop(0.85, 'rgba(0,0,0,0.15)'); shd.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = shd; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.restore();
    ctx.strokeStyle = hexA(p.atmos, 0.5); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
    return;
  }
  ctx.fillStyle = p.core; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
  // land blobs
  const rnd = mulberry32(tier * 131 + 7);
  for (let i = 0; i < 7; i++) {
    const bx = cx - R + rnd() * R * 2, by = cy - R + rnd() * R * 2, br = R * (0.25 + rnd() * 0.35);
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
    g.addColorStop(0, p.land); g.addColorStop(0.7, p.land); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.6; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  // ore glints
  const oreColors = ORES.filter(o => o.tier <= tier).slice(-3).map(o => o.shine);
  for (let i = 0; i < 6; i++) {
    const bx = cx - R + rnd() * R * 2, by = cy - R + rnd() * R * 2;
    ctx.fillStyle = oreColors[i % oreColors.length] || '#fff';
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 4;
    ctx.beginPath(); ctx.arc(bx, by, R * 0.05, 0, Math.PI * 2); ctx.fill();
  }
  ctx.shadowBlur = 0;
  // shading
  const shade = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R * 1.05);
  shade.addColorStop(0, 'rgba(255,255,255,0.28)'); shade.addColorStop(0.5, 'rgba(255,255,255,0)');
  shade.addColorStop(0.8, 'rgba(0,0,0,0.15)'); shade.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = shade; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
  ctx.restore();

  // rim
  ctx.strokeStyle = hexA(p.atmos, 0.5); ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
