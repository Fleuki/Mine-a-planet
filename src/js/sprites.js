/* ==========================================================================
   sprites.js — Procedural canvas art for drones, ores, planets and star badges.

   Loaded as a classic script from index.html; every top-level binding here is
   shared with the other modules. Load order matters — see index.html.
   ========================================================================== */
function drawDroneIcon(canvas2, droneId, star = 0) {
  const drone = DRONE_BY_ID[droneId];
  if (!drone) return;
  const rar = RARITIES[drone.rarity];
  const dpr = window.devicePixelRatio || 1;
  const size = canvas2.clientWidth || 64;
  canvas2.width = size * dpr;
  canvas2.height = size * dpr;
  const ctx2 = canvas2.getContext("2d");
  ctx2.scale(dpr, dpr);
  ctx2.clearRect(0, 0, size, size);
  const cx = size / 2, cy = size * 0.46, R = size * 0.2;
  ctx2.save();
  ctx2.globalCompositeOperation = "lighter";
  const haze = ctx2.createRadialGradient(cx, cy, size * 0.1, cx, cy, size * 0.46);
  haze.addColorStop(0, hexA(rar.glow, 0.22));
  haze.addColorStop(1, "rgba(0,0,0,0)");
  ctx2.fillStyle = haze;
  ctx2.beginPath();
  ctx2.arc(cx, cy, size * 0.46, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.restore();
  ctx2.save();
  ctx2.strokeStyle = hexA(rar.color, 0.8);
  ctx2.lineWidth = Math.max(1.4, size * 0.026);
  ctx2.shadowColor = rar.glow;
  ctx2.shadowBlur = size * 0.09;
  ctx2.beginPath();
  ctx2.arc(cx, cy, size * 0.35, 0, Math.PI * 2);
  ctx2.stroke();
  ctx2.restore();
  ctx2.save();
  ctx2.translate(cx, cy);
  if (!drawDroneArt(ctx2, drone, R)) {
    drawDroneChassis(ctx2, drone, rar, R, { animated: false });
    ctx2.save();
    ctx2.translate(0, R * 0.62 + R * 0.1);
    drawDrill(ctx2, drone.shape, R, 0.5, rar, false);
    ctx2.restore();
  }
  ctx2.restore();
  if (star > 0) drawStarRow(ctx2, cx, size * 0.95, star, size * 0.075);
}
function drawStarRow(ctx2, cx, cy, count, r) {
  const gap = r * 2.3;
  const totalW = (count - 1) * gap;
  ctx2.save();
  ctx2.textBaseline = "middle";
  for (let i = 0; i < count; i++) {
    star5(ctx2, cx - totalW / 2 + i * gap, cy, r);
  }
  ctx2.restore();
}
function star5(ctx2, cx, cy, r) {
  ctx2.save();
  ctx2.translate(cx, cy);
  ctx2.beginPath();
  for (let i = 0; i < 10; i++) {
    const ang = Math.PI / 5 * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    ctx2.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
  }
  ctx2.closePath();
  ctx2.fillStyle = "#ffd54a";
  ctx2.shadowColor = "rgba(0,0,0,0.6)";
  ctx2.shadowBlur = 2;
  ctx2.fill();
  ctx2.lineWidth = 0.8;
  ctx2.strokeStyle = "#b7791f";
  ctx2.shadowBlur = 0;
  ctx2.stroke();
  ctx2.restore();
}
function drawPlanetIcon(canvas2, tier) {
  const p = PLANETS[tier];
  if (!p) return;
  const dpr = window.devicePixelRatio || 1;
  const size = canvas2.clientWidth || 100;
  canvas2.width = size * dpr;
  canvas2.height = size * dpr;
  const ctx2 = canvas2.getContext("2d");
  ctx2.scale(dpr, dpr);
  ctx2.clearRect(0, 0, size, size);
  const cx = size / 2, cy = size / 2, R = size * 0.36;
  ctx2.save();
  ctx2.globalCompositeOperation = "lighter";
  const atmo = ctx2.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.35);
  atmo.addColorStop(0, hexA(p.atmos, 0));
  atmo.addColorStop(0.6, hexA(p.atmos, 0.35));
  atmo.addColorStop(1, hexA(p.atmos, 0));
  ctx2.fillStyle = atmo;
  ctx2.beginPath();
  ctx2.arc(cx, cy, R * 1.35, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.restore();
  ctx2.save();
  ctx2.beginPath();
  ctx2.arc(cx, cy, R, 0, Math.PI * 2);
  ctx2.clip();
  const pArt = PLANET_ART[tier] && getArt(PLANET_ART[tier]);
  if (pArt && pArt.ready && pArt.img.width) {
    ctx2.drawImage(pArt.img, cx - R, cy - R, R * 2, R * 2);
    const shd = ctx2.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R * 1.05);
    shd.addColorStop(0, "rgba(255,255,255,0.18)");
    shd.addColorStop(0.55, "rgba(255,255,255,0)");
    shd.addColorStop(0.85, "rgba(0,0,0,0.15)");
    shd.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx2.fillStyle = shd;
    ctx2.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx2.restore();
    ctx2.strokeStyle = hexA(p.atmos, 0.5);
    ctx2.lineWidth = 1.5;
    ctx2.beginPath();
    ctx2.arc(cx, cy, R, 0, Math.PI * 2);
    ctx2.stroke();
    return;
  }
  ctx2.fillStyle = p.core;
  ctx2.fillRect(cx - R, cy - R, R * 2, R * 2);
  const rnd = mulberry322(tier * 131 + 7);
  for (let i = 0; i < 7; i++) {
    const bx = cx - R + rnd() * R * 2, by = cy - R + rnd() * R * 2, br = R * (0.25 + rnd() * 0.35);
    const g = ctx2.createRadialGradient(bx, by, 0, bx, by, br);
    g.addColorStop(0, p.land);
    g.addColorStop(0.7, p.land);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx2.globalAlpha = 0.6;
    ctx2.fillStyle = g;
    ctx2.beginPath();
    ctx2.arc(bx, by, br, 0, Math.PI * 2);
    ctx2.fill();
  }
  ctx2.globalAlpha = 1;
  const oreColors = ORES.filter((o) => o.tier <= tier).slice(-3).map((o) => o.shine);
  for (let i = 0; i < 6; i++) {
    const bx = cx - R + rnd() * R * 2, by = cy - R + rnd() * R * 2;
    ctx2.fillStyle = oreColors[i % oreColors.length] || "#fff";
    ctx2.shadowColor = ctx2.fillStyle;
    ctx2.shadowBlur = 4;
    ctx2.beginPath();
    ctx2.arc(bx, by, R * 0.05, 0, Math.PI * 2);
    ctx2.fill();
  }
  ctx2.shadowBlur = 0;
  const shade = ctx2.createRadialGradient(cx - R * 0.35, cy - R * 0.35, R * 0.1, cx, cy, R * 1.05);
  shade.addColorStop(0, "rgba(255,255,255,0.28)");
  shade.addColorStop(0.5, "rgba(255,255,255,0)");
  shade.addColorStop(0.8, "rgba(0,0,0,0.15)");
  shade.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx2.fillStyle = shade;
  ctx2.fillRect(cx - R, cy - R, R * 2, R * 2);
  ctx2.restore();
  ctx2.strokeStyle = hexA(p.atmos, 0.5);
  ctx2.lineWidth = 1.5;
  ctx2.beginPath();
  ctx2.arc(cx, cy, R, 0, Math.PI * 2);
  ctx2.stroke();
}
function mulberry322(a) {
  return function() {
    a |= 0;
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
