// ============================================================================
//  Static sprite drawing for UI thumbnails (drones, planets).
// ============================================================================
import { DRONE_BY_ID, RARITIES, PLANETS, ORES } from './config.js';
import { roundRect, hexA } from './render.js';

// Draw a drone icon into a canvas element, upright, with rarity glow.
export function drawDroneIcon(canvas, droneId) {
  const drone = DRONE_BY_ID[droneId];
  if (!drone) return;
  const rar = RARITIES[drone.rarity];
  const dpr = window.devicePixelRatio || 1;
  const size = canvas.clientWidth || 64;
  canvas.width = size * dpr; canvas.height = size * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, size, size);

  // radial rarity backdrop
  const bg = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  bg.addColorStop(0, hexA(rar.glow, 0.28));
  bg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, size, size);

  const R = size * 0.24;
  ctx.save();
  ctx.translate(size / 2, size * 0.42);
  drawDroneBody(ctx, drone, rar, R);
  ctx.restore();
}

function drawDroneBody(ctx, drone, rar, R) {
  const bodyW = R * 1.1, bodyH = R * 1.2;
  // body
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 2;
  roundRect(ctx, -bodyW / 2, -bodyH / 2, bodyW, bodyH, R * 0.35);
  const bodyGrad = ctx.createLinearGradient(0, -bodyH / 2, 0, bodyH / 2);
  bodyGrad.addColorStop(0, '#eef3fb'); bodyGrad.addColorStop(0.5, '#c2cede'); bodyGrad.addColorStop(1, '#8b98ac');
  ctx.fillStyle = bodyGrad; ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  // trim
  ctx.fillStyle = rar.color;
  roundRect(ctx, -bodyW / 2, -bodyH / 2, bodyW, R * 0.32, R * 0.16); ctx.fill();
  // cockpit
  const eye = ctx.createRadialGradient(0, -R * 0.12, 0, 0, -R * 0.12, R * 0.4);
  eye.addColorStop(0, rar.glow); eye.addColorStop(0.6, rar.color); eye.addColorStop(1, hexA(rar.color, 0.2));
  ctx.fillStyle = eye;
  ctx.beginPath(); ctx.arc(0, -R * 0.12, R * 0.32, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.arc(-R * 0.1, -R * 0.22, R * 0.08, 0, Math.PI * 2); ctx.fill();
  // fins
  ctx.fillStyle = '#8f9db2';
  roundRect(ctx, -bodyW / 2 - R * 0.18, -R * 0.05, R * 0.2, R * 0.5, R * 0.08); ctx.fill();
  roundRect(ctx, bodyW / 2 - R * 0.02, -R * 0.05, R * 0.2, R * 0.5, R * 0.08); ctx.fill();

  // drill
  ctx.translate(0, bodyH / 2 - R * 0.05);
  drawDrillStatic(ctx, drone.shape, R, rar);
  ctx.restore();
}

function drawDrillStatic(ctx, shape, R, rar) {
  ctx.save();
  if (shape === 'laser') {
    ctx.fillStyle = '#5a6577';
    roundRect(ctx, -R * 0.16, 0, R * 0.32, R * 0.4, R * 0.08); ctx.fill();
    ctx.fillStyle = rar.glow;
    ctx.shadowColor = rar.glow; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(0, R * 0.42, R * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.restore(); return;
  }
  if (shape === 'saw') {
    ctx.translate(0, R * 0.4);
    ctx.fillStyle = '#c8d2e0';
    const teeth = 10, rr = R * 0.42;
    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const a = (i / (teeth * 2)) * Math.PI * 2;
      const rad = i % 2 === 0 ? rr : rr * 0.7;
      ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8f9db2';
    ctx.beginPath(); ctx.arc(0, 0, rr * 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.restore(); return;
  }
  const bits = shape === 'twin' ? 2 : shape === 'quad' ? 3 : 1;
  const spread = R * (bits > 1 ? 0.28 : 0);
  for (let b = 0; b < bits; b++) {
    const bx = bits === 1 ? 0 : -spread + (b / (bits - 1)) * spread * 2;
    ctx.save(); ctx.translate(bx, 0);
    ctx.fillStyle = '#9aa7ba';
    roundRect(ctx, -R * 0.1, 0, R * 0.2, R * 0.25, R * 0.05); ctx.fill();
    const len = R * 0.55, wid = R * 0.22;
    const cone = ctx.createLinearGradient(-wid, 0, wid, 0);
    cone.addColorStop(0, '#6b7688'); cone.addColorStop(0.5, '#dfe7f1'); cone.addColorStop(1, '#6b7688');
    ctx.fillStyle = cone;
    ctx.beginPath();
    ctx.moveTo(-wid, R * 0.2); ctx.lineTo(wid, R * 0.2); ctx.lineTo(0, R * 0.2 + len); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = hexA(rar.color, 0.8); ctx.lineWidth = 1.5;
    for (let s = 1; s <= 2; s++) {
      const yy = R * 0.2 + (s / 3) * len; const half = wid * (1 - s / 3);
      ctx.beginPath(); ctx.moveTo(-half, yy); ctx.lineTo(half, yy); ctx.stroke();
    }
    ctx.restore();
  }
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
