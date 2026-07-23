// ============================================================================
//  World renderer: planet (baked, rotating), dock ring, animated mining drones.
// ============================================================================
import { PLANETS, DRONE_BY_ID, RARITIES, ORES, ORE_BY_ID, DRONE_ART, PLANET_ART } from './config.js';
import { getArt } from './assets.js';

// Deterministic pseudo-random for stable planet features per tier.
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class WorldRenderer {
  constructor() {
    this.cx = 0; this.cy = 0; this.R = 120;
    this.rot = 0;
    this.tier = -1;
    this.surface = null;      // baked wide surface strip
    this.clouds = null;       // baked drifting cloud strip
    this.lights = null;       // baked emissive city/ember strip
    this.surfW = 0; this.surfH = 0;
    this.pulse = 0;
    this.impacts = [];        // transient surface impact glints
  }

  layout(w, h) {
    this.cx = w / 2;
    // Planet sits slightly above vertical center to leave room for the hotbar.
    this.cy = h * 0.46;
    this.R = Math.max(70, Math.min(w, h) * 0.19);
  }

  setTier(tier) {
    if (tier === this.tier) return;
    this.tier = tier;
    this._bakeSurface(tier);
  }

  _bakeSurface(tier) {
    const p = PLANETS[tier];
    const R = 260;                          // bake at fixed high-res
    const W = Math.floor(R * 2 * 2.2);      // wide strip for horizontal wrap
    const H = R * 2;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    const rnd = mulberry32(tier * 7919 + 13);

    // Base land fill.
    g.fillStyle = p.core;
    g.fillRect(0, 0, W, H);

    // Continents / regions — soft radial blobs of the land colour.
    const blobs = 10 + Math.floor(rnd() * 6);
    for (let i = 0; i < blobs; i++) {
      const bx = rnd() * W, by = rnd() * H;
      const br = (0.12 + rnd() * 0.2) * H;
      const grad = g.createRadialGradient(bx, by, 0, bx, by, br);
      grad.addColorStop(0, p.land);
      grad.addColorStop(0.7, p.land);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.globalAlpha = 0.55;
      g.fillStyle = grad;
      g.beginPath(); g.arc(bx, by, br, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;

    // Accent highlights (ridges / bright terrain).
    for (let i = 0; i < blobs; i++) {
      const bx = rnd() * W, by = rnd() * H;
      const br = (0.04 + rnd() * 0.08) * H;
      const grad = g.createRadialGradient(bx, by, 0, bx, by, br);
      grad.addColorStop(0, hexA(p.accent, 0.5));
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.beginPath(); g.arc(bx, by, br, 0, Math.PI * 2); g.fill();
    }

    // Craters.
    const craters = 14 + Math.floor(rnd() * 10);
    for (let i = 0; i < craters; i++) {
      const bx = rnd() * W, by = rnd() * H;
      const br = (0.015 + rnd() * 0.05) * H;
      g.save();
      g.globalAlpha = 0.4;
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.beginPath(); g.arc(bx, by, br, 0, Math.PI * 2); g.fill();
      g.globalAlpha = 0.5;
      g.strokeStyle = hexA(p.accent, 0.5);
      g.lineWidth = br * 0.28;
      g.beginPath(); g.arc(bx - br * 0.15, by - br * 0.15, br * 0.9, 0, Math.PI * 2); g.stroke();
      g.restore();
    }

    // Ore veins — glints of the richest available ore colours.
    const oreColors = ORES.filter(o => o.tier <= tier).slice(-4).map(o => o.shine);
    const veins = 22 + tier * 3;
    for (let i = 0; i < veins; i++) {
      const bx = rnd() * W, by = rnd() * H;
      const col = oreColors[Math.floor(rnd() * oreColors.length)] || '#fff';
      const s = (0.006 + rnd() * 0.014) * H;
      g.save();
      g.globalAlpha = 0.85;
      g.fillStyle = col;
      g.shadowColor = col; g.shadowBlur = s * 2;
      g.beginPath();
      // small diamond
      g.translate(bx, by); g.rotate(rnd() * Math.PI);
      g.moveTo(0, -s); g.lineTo(s * 0.7, 0); g.lineTo(0, s); g.lineTo(-s * 0.7, 0);
      g.closePath(); g.fill();
      g.restore();
    }

    this.surface = c; this.surfW = W; this.surfH = H;

    // Drifting cloud layer (soft white puffs on transparent).
    this.clouds = null;
    if (p.clouds) {
      const cc = document.createElement('canvas'); cc.width = W; cc.height = H;
      const cg = cc.getContext('2d');
      const cn = 14 + Math.floor(rnd() * 10);
      for (let i = 0; i < cn; i++) {
        const bx = rnd() * W, by = rnd() * H;
        const br = (0.09 + rnd() * 0.18) * H;
        const grad = cg.createRadialGradient(bx, by, 0, bx, by, br);
        grad.addColorStop(0, `rgba(255,255,255,${(0.5 * p.clouds).toFixed(3)})`);
        grad.addColorStop(0.5, `rgba(255,255,255,${(0.2 * p.clouds).toFixed(3)})`);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        cg.fillStyle = grad;
        cg.beginPath(); cg.arc(bx, by, br, 0, Math.PI * 2); cg.fill();
      }
      this.clouds = cc;
    }

    // Emissive city / ember lights (bright dots on transparent).
    this.lights = null;
    if (p.lights) {
      const lc = document.createElement('canvas'); lc.width = W; lc.height = H;
      const lg = lc.getContext('2d');
      const ln = 100 + Math.floor(rnd() * 80);
      for (let i = 0; i < ln; i++) {
        const bx = rnd() * W, by = rnd() * H;
        const s = (0.004 + rnd() * 0.011) * H;
        lg.fillStyle = p.lights;
        lg.shadowColor = p.lights; lg.shadowBlur = s * 3;
        lg.beginPath(); lg.arc(bx, by, s, 0, Math.PI * 2); lg.fill();
      }
      this.lights = lc;
    }
  }

  update(dt) {
    this.rot += dt * 0.05;
    this.pulse += dt;
    for (let i = this.impacts.length - 1; i >= 0; i--) {
      this.impacts[i].life -= dt;
      if (this.impacts[i].life <= 0) this.impacts.splice(i, 1);
    }
  }

  addImpact(angle, color) {
    this.impacts.push({ angle, color, life: 0.35, maxLife: 0.35 });
  }

  // Screen position of a dock slot (ring around the planet).
  slotPos(index, total) {
    const startAngle = -Math.PI / 2;             // first slot at top
    const angle = startAngle + (index / total) * Math.PI * 2;
    const ringR = this.R * 1.5;
    return {
      x: this.cx + Math.cos(angle) * ringR,
      y: this.cy + Math.sin(angle) * ringR,
      angle,
    };
  }

  drawPlanet(ctx) {
    const p = PLANETS[this.tier] || PLANETS[0];
    const { cx, cy, R } = this;

    // Planetary ring — far (back) half behind the planet.
    if (p.ring) this._drawRing(ctx, cx, cy, R, p.ring, false);

    // Atmosphere glow (additive).
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const atmo = ctx.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.35);
    atmo.addColorStop(0, hexA(p.atmos, 0.0));
    atmo.addColorStop(0.55, hexA(p.atmos, 0.28));
    atmo.addColorStop(1, hexA(p.atmos, 0));
    ctx.fillStyle = atmo;
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.35, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // Clip to sphere and draw scrolling surface strip (fake rotation).
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.clip();

    const artPath = PLANET_ART[this.tier];
    const art = artPath && getArt(artPath);
    const custom = art && art.ready && art.img.width;
    if (custom) {
      ctx.drawImage(art.img, cx - R, cy - R, R * 2, R * 2);   // custom static art
    } else if (this.surface) {
      this._drawStrip(ctx, this.surface, R, this.rot, 1);
    } else {
      ctx.fillStyle = p.land;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    }

    // Drifting clouds (parallax: slightly faster than the surface).
    if (!custom && this.clouds) this._drawStrip(ctx, this.clouds, R, this.rot, 1.45);

    // Limb darkening + light from upper-left.
    const shade = ctx.createRadialGradient(
      cx - R * 0.35, cy - R * 0.35, R * 0.1,
      cx, cy, R * 1.05);
    shade.addColorStop(0, 'rgba(255,255,255,0.28)');
    shade.addColorStop(0.45, 'rgba(255,255,255,0.0)');
    shade.addColorStop(0.78, 'rgba(0,0,0,0.12)');
    shade.addColorStop(1, 'rgba(0,0,0,0.62)');
    ctx.fillStyle = shade;
    ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

    // Emissive city / ember lights — additive, brighter on the night side.
    if (!custom && this.lights) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      // Night-side mask: dimmer toward the lit upper-left.
      const night = ctx.createRadialGradient(cx - R * 0.4, cy - R * 0.4, R * 0.2, cx + R * 0.3, cy + R * 0.3, R * 1.3);
      // Draw lights, then knock them back on the day side.
      this._drawStrip(ctx, this.lights, R, this.rot, 1);
      ctx.globalCompositeOperation = 'destination-out';
      night.addColorStop(0, 'rgba(0,0,0,0.85)');
      night.addColorStop(0.6, 'rgba(0,0,0,0.15)');
      night.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = night;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx.restore();
    }

    // Surface impact glints from active mining.
    for (const im of this.impacts) {
      const a = im.life / im.maxLife;
      const ix = cx + Math.cos(im.angle) * R * 0.94;
      const iy = cy + Math.sin(im.angle) * R * 0.94;
      ctx.globalAlpha = a;
      const gr = ctx.createRadialGradient(ix, iy, 0, ix, iy, R * 0.13);
      gr.addColorStop(0, im.color);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(ix, iy, R * 0.13, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // Crisp rim highlight.
    ctx.save();
    ctx.strokeStyle = hexA(p.atmos, 0.5);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, R - 1, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();

    // Planetary ring — near (front) half over the planet.
    if (p.ring) this._drawRing(ctx, cx, cy, R, p.ring, true);
  }

  // Draws a baked wide strip clipped to the current sphere clip, scrolling
  // horizontally by `rot * speed` for a fake rotation / parallax.
  _drawStrip(ctx, strip, R, rot, speed) {
    const { cx, cy } = this;
    const destH = R * 2;
    const scale = destH / strip.height;
    const destW = strip.width * scale;
    const period = destW / 2;
    const offset = (rot * speed * period) % period;
    const top = cy - R;
    for (let k = -1; k <= 1; k++) {
      ctx.drawImage(strip, cx - R - offset + k * period, top, destW, destH);
    }
  }

  // Draws one half of a tilted planetary ring. frontOnly=true clips to the
  // lower band (in front of the planet); false clips to the upper band (behind).
  _drawRing(ctx, cx, cy, R, color, frontOnly) {
    ctx.save();
    ctx.beginPath();
    if (frontOnly) ctx.rect(cx - R * 2.2, cy, R * 4.4, R * 1.4);
    else ctx.rect(cx - R * 2.2, cy - R * 1.4, R * 4.4, R * 1.4);
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = hexA(color, 0.4);
    ctx.lineWidth = R * 0.2;
    ctx.beginPath(); ctx.ellipse(cx, cy, R * 1.72, R * 0.5, -0.3, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = hexA(color, 0.85);
    ctx.lineWidth = R * 0.05;
    ctx.beginPath(); ctx.ellipse(cx, cy, R * 1.58, R * 0.46, -0.3, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }

  // Draws a dock slot; if drone present, animate it mining.
  drawSlot(ctx, slot, total, t, hovered) {
    const pos = this.slotPos(slot.index, total);
    const toCenter = Math.atan2(this.cy - pos.y, this.cx - pos.x);

    // Dock pad.
    ctx.save();
    ctx.translate(pos.x, pos.y);
    const padR = this.R * 0.2;

    if (!slot.droneId) {
      // Empty dock: dashed ring + plus.
      ctx.strokeStyle = hovered ? 'rgba(120,220,255,0.9)' : 'rgba(150,170,210,0.5)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.arc(0, 0, padR, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = hovered ? 1 : 0.6;
      ctx.strokeStyle = hovered ? '#7fe0ff' : '#9fb3d0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-padR * 0.4, 0); ctx.lineTo(padR * 0.4, 0);
      ctx.moveTo(0, -padR * 0.4); ctx.lineTo(0, padR * 0.4);
      ctx.stroke();
      ctx.restore();
      return pos;
    }

    const drone = DRONE_BY_ID[slot.droneId];
    const rar = RARITIES[drone.rarity];
    const hover = Math.sin(t * 3 + slot.index) * 3;     // bob
    ctx.translate(0, hover);
    ctx.rotate(toCenter - Math.PI / 2);                 // drill points at the planet

    // Glow aura by rarity.
    const aura = ctx.createRadialGradient(0, 0, 0, 0, 0, padR * 1.8);
    aura.addColorStop(0, hexA(rar.glow, 0.35));
    aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura;
    ctx.beginPath(); ctx.arc(0, 0, padR * 1.8, 0, Math.PI * 2); ctx.fill();

    this._drawDrone(ctx, drone, rar, padR, t + slot.index, slot.progress);
    ctx.restore();

    // Mining beam from drone toward planet surface.
    const active = !!slot.droneId;
    if (active) {
      const bx = pos.x + Math.cos(toCenter) * padR * 1.1;
      const by = pos.y + hover + Math.sin(toCenter) * padR * 1.1;
      const sx = this.cx - Math.cos(toCenter) * this.R * 0.98;
      const sy = this.cy - Math.sin(toCenter) * this.R * 0.98;
      this._drawBeam(ctx, bx, by, sx, sy, rar, drone.shape, t + slot.index);
    }

    // Ore gem — shows which ore this drone is currently mining (to one side).
    if (slot.oreId) {
      const ore = ORE_BY_ID[slot.oreId];
      if (ore) {
        const perp = toCenter + Math.PI / 2;
        const gx = pos.x + Math.cos(perp) * padR * 1.0;
        const gy = pos.y + Math.sin(perp) * padR * 1.0 + hover;
        drawOreGem(ctx, gx, gy, padR * 0.32, ore, t * 2 + slot.index);
      }
    }

    // Star pips (outward from the planet, in screen space).
    if (slot.star > 0) {
      const outAng = Math.atan2(pos.y - this.cy, pos.x - this.cx);
      const sx2 = pos.x + Math.cos(outAng) * padR * 1.45;
      const sy2 = pos.y + Math.sin(outAng) * padR * 1.45 + hover;
      drawStarsAt(ctx, sx2, sy2, slot.star, padR * 0.2);
    }
    return pos;
  }

  _drawBeam(ctx, x1, y1, x2, y2, rar, shape, t) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    if (shape === 'laser') {
      const flick = 0.6 + 0.4 * Math.sin(t * 30);
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, hexA(rar.glow, 0.9 * flick));
      grad.addColorStop(1, hexA(rar.color, 0.2));
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3.5;
      ctx.shadowColor = rar.glow; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    } else {
      // dust/energy dashes traveling to the surface
      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, hexA(rar.glow, 0.5));
      grad.addColorStop(1, hexA(rar.color, 0.1));
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 7]);
      ctx.lineDashOffset = -t * 40;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  // Drone drawn facing "down" (+y) toward planet; drill tip at bottom.
  _drawDrone(ctx, drone, rar, R, t, progress) {
    // Custom sprite override (Claude-designed / hand-made art).
    if (drawDroneArt(ctx, drone, R)) return;
    const spin = t * 10;
    drawDroneChassis(ctx, drone, rar, R, { spin, thrust: t, animated: true });
    // Drill assembly at bottom, animated by shape.
    ctx.save();
    ctx.translate(0, R * 0.62 + R * 0.1);
    this._drawDrill(ctx, drone.shape, R, spin, rar, true);
    ctx.restore();
  }

  _drawDrill(ctx, shape, R, spin, rar, animated) {
    drawDrill(ctx, shape, R, spin, rar, animated);
  }
}

// ============================================================================
//  Shared drone drawing — used by the world renderer and the UI sprite icons
//  so both stay in visual sync. Drone faces "down" (+y): head up, drill below.
// ============================================================================
// Draws the head/chassis centred at the origin. Options:
//   spin      - drill/animation phase
//   thrust    - time for thruster flicker
//   animated  - whether to draw animated thruster flames
export function drawDroneChassis(ctx, drone, rar, R, opts = {}) {
  const { thrust = 0, animated = false } = opts;
  const bodyW = R * 1.28, bodyH = R * 1.02;

  ctx.save();

  // Side pods ("ears") with rarity light — sit behind the head.
  ctx.fillStyle = '#aeb8c9';
  roundRect(ctx, -bodyW / 2 - R * 0.14, -R * 0.32, R * 0.32, R * 0.66, R * 0.15); ctx.fill();
  roundRect(ctx,  bodyW / 2 - R * 0.18, -R * 0.32, R * 0.32, R * 0.66, R * 0.15); ctx.fill();
  ctx.fillStyle = rar.glow;
  ctx.shadowColor = rar.color; ctx.shadowBlur = 6;
  ctx.beginPath(); ctx.arc(-bodyW / 2 - R * 0.14 + R * 0.16, 0, R * 0.07, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc( bodyW / 2 - R * 0.18 + R * 0.16, 0, R * 0.07, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;

  // Animated downward thrusters from the pods (keeps the world lively).
  if (animated) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const fl = 0.5 + 0.5 * Math.abs(Math.sin(thrust * 20));
    for (const fx of [-bodyW / 2 - R * 0.0, bodyW / 2 + R * 0.0]) {
      const fg = ctx.createRadialGradient(fx, R * 0.42, 0, fx, R * 0.42, R * 0.26 * fl);
      fg.addColorStop(0, 'rgba(150,215,255,0.85)');
      fg.addColorStop(1, 'rgba(150,215,255,0)');
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.arc(fx, R * 0.42, R * 0.26 * fl, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // Head — rounded metallic body.
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
  roundRect(ctx, -bodyW / 2, -bodyH / 2, bodyW, bodyH, R * 0.34);
  const bodyGrad = ctx.createLinearGradient(0, -bodyH / 2, 0, bodyH / 2);
  bodyGrad.addColorStop(0, '#f4f8ff');
  bodyGrad.addColorStop(0.5, '#ccd7e7');
  bodyGrad.addColorStop(1, '#96a4ba');
  ctx.fillStyle = bodyGrad; ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  // Top dome highlight.
  ctx.fillStyle = 'rgba(255,255,255,0.32)';
  roundRect(ctx, -bodyW * 0.32, -bodyH / 2 + R * 0.05, bodyW * 0.64, R * 0.15, R * 0.08); ctx.fill();

  // Dark visor with two glowing rarity eyes.
  const visorY = -R * 0.03;
  ctx.fillStyle = 'rgba(18,15,32,0.94)';
  roundRect(ctx, -bodyW * 0.42, visorY - R * 0.24, bodyW * 0.84, R * 0.5, R * 0.2); ctx.fill();
  for (const ex of [-R * 0.27, R * 0.27]) {
    const eg = ctx.createRadialGradient(ex - R * 0.03, visorY - R * 0.03, 0, ex, visorY, R * 0.19);
    eg.addColorStop(0, '#ffffff');
    eg.addColorStop(0.35, rar.glow);
    eg.addColorStop(1, hexA(rar.color, 0.25));
    ctx.fillStyle = eg;
    ctx.beginPath(); ctx.ellipse(ex, visorY, R * 0.13, R * 0.16, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Rarity trim strip along the jaw.
  ctx.fillStyle = hexA(rar.color, 0.95);
  roundRect(ctx, -bodyW / 2, bodyH / 2 - R * 0.13, bodyW, R * 0.13, R * 0.07); ctx.fill();

  // Neck connector down to the drill.
  ctx.fillStyle = '#8f9db2';
  roundRect(ctx, -R * 0.2, bodyH / 2 - R * 0.04, R * 0.4, R * 0.2, R * 0.06); ctx.fill();

  ctx.restore();
}

// Draws a drill of the given shape, tip pointing +y, top at the origin.
export function drawDrill(ctx, shape, R, spin, rar, animated = true) {
  ctx.save();
  if (shape === 'laser') {
    ctx.fillStyle = '#5a6577';
    roundRect(ctx, -R * 0.18, 0, R * 0.36, R * 0.42, R * 0.09); ctx.fill();
    const glow = ctx.createRadialGradient(0, R * 0.5, 0, 0, R * 0.5, R * 0.2);
    glow.addColorStop(0, '#ffffff');
    glow.addColorStop(0.4, rar.glow);
    glow.addColorStop(1, hexA(rar.color, 0));
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, R * 0.5, R * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = rar.glow;
    ctx.beginPath(); ctx.arc(0, R * 0.5, R * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.restore(); return;
  }
  if (shape === 'saw') {
    ctx.translate(0, R * 0.44);
    if (animated) ctx.rotate(spin);
    ctx.fillStyle = '#cbd5e3';
    const teeth = 10, rr = R * 0.44;
    ctx.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const a = (i / (teeth * 2)) * Math.PI * 2;
      const rad = i % 2 === 0 ? rr : rr * 0.68;
      ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = hexA(rar.color, 0.85);
    ctx.beginPath(); ctx.arc(0, 0, rr * 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8f9db2';
    ctx.beginPath(); ctx.arc(0, 0, rr * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore(); return;
  }
  // auger / drill / twin / quad — tapered striped cones with a bright tip.
  const bits = shape === 'twin' ? 2 : shape === 'quad' ? 3 : 1;
  const spread = R * (bits > 1 ? 0.3 : 0);
  const len = bits > 1 ? R * 0.66 : R * 0.9;
  const wid = bits > 1 ? R * 0.17 : R * 0.25;
  for (let b = 0; b < bits; b++) {
    const bx = bits === 1 ? 0 : -spread + (b / (bits - 1)) * spread * 2;
    ctx.save();
    ctx.translate(bx, 0);
    // collar
    ctx.fillStyle = '#9aa7ba';
    roundRect(ctx, -wid * 1.1, -R * 0.02, wid * 2.2, R * 0.14, R * 0.05); ctx.fill();
    // cone
    ctx.beginPath();
    ctx.moveTo(-wid, R * 0.1); ctx.lineTo(wid, R * 0.1); ctx.lineTo(0, R * 0.1 + len); ctx.closePath();
    const cone = ctx.createLinearGradient(-wid, 0, wid, 0);
    cone.addColorStop(0, '#5f6a7c'); cone.addColorStop(0.5, '#eef3fb'); cone.addColorStop(1, '#5f6a7c');
    ctx.fillStyle = cone; ctx.fill();
    // diagonal auger stripes, clipped to the cone, animated by spin
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-wid, R * 0.1); ctx.lineTo(wid, R * 0.1); ctx.lineTo(0, R * 0.1 + len); ctx.closePath();
    ctx.clip();
    ctx.strokeStyle = hexA(rar.color, 0.85);
    ctx.lineWidth = Math.max(1.4, R * 0.05);
    const phase = animated ? (spin * 0.16) % 1 : 0;
    for (let s = -1; s < 5; s++) {
      const off = (s + phase) * (len / 4);
      ctx.beginPath();
      ctx.moveTo(-wid, R * 0.1 + off);
      ctx.lineTo(wid, R * 0.1 + off - len * 0.18);
      ctx.stroke();
    }
    ctx.restore();
    // bright ball tip
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = rar.glow; ctx.shadowBlur = 4;
    ctx.beginPath(); ctx.arc(0, R * 0.1 + len, wid * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
  ctx.restore();
}

// Draws a custom drone sprite (if one exists and is loaded) centred at the
// origin, facing +y. Returns true when it drew, false to fall back to
// procedural art. `R` is the procedural body-unit so art scales to match.
export function drawDroneArt(ctx, drone, R) {
  const path = DRONE_ART[drone.id];
  if (!path) return false;
  const art = getArt(path);
  if (!art || !art.ready || !art.img.width) return false;
  const h = R * 3.0;
  const w = h * (art.img.width / art.img.height);
  ctx.drawImage(art.img, -w / 2, -R * 0.95, w, h);
  return true;
}

// Draws a custom planet sprite clipped to the disc. Returns true when drawn.
export function drawPlanetArt(ctx, tier, cx, cy, R) {
  const path = PLANET_ART[tier];
  if (!path) return false;
  const art = getArt(path);
  if (!art || !art.ready || !art.img.width) return false;
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
  ctx.drawImage(art.img, cx - R, cy - R, R * 2, R * 2);
  ctx.restore();
  return true;
}

// --- helpers ---------------------------------------------------------------
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

// A small faceted gem in the ore's colour, with a bob + sparkle.
function drawOreGem(ctx, cx, cy, r, ore, t) {
  const bob = Math.sin(t) * r * 0.15;
  cy += bob;
  ctx.save();
  // glow
  ctx.globalCompositeOperation = 'lighter';
  const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.2);
  glow.addColorStop(0, hexA(ore.shine, 0.5));
  glow.addColorStop(1, hexA(ore.shine, 0));
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(cx, cy, r * 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(cx, cy);
  // gem body: hexagonal cut
  const top = -r, bot = r * 1.15, w = r * 0.85, sh = -r * 0.35;
  ctx.beginPath();
  ctx.moveTo(0, top);
  ctx.lineTo(w, sh);
  ctx.lineTo(w * 0.6, bot);
  ctx.lineTo(-w * 0.6, bot);
  ctx.lineTo(-w, sh);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, top, 0, bot);
  g.addColorStop(0, ore.shine);
  g.addColorStop(0.5, ore.color);
  g.addColorStop(1, ore.color);
  ctx.fillStyle = g;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1;
  ctx.fill(); ctx.stroke();
  // table facet highlight
  ctx.beginPath();
  ctx.moveTo(0, top); ctx.lineTo(w * 0.5, sh); ctx.lineTo(0, sh * 0.2); ctx.lineTo(-w * 0.5, sh); ctx.closePath();
  ctx.fillStyle = hexA(ore.shine, 0.7); ctx.fill();
  // twinkle
  const tw = 0.5 + 0.5 * Math.sin(t * 2.3);
  ctx.globalAlpha = tw;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-w * 0.25, sh * 0.6, r * 0.12, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// A small horizontal row of gold stars in screen space.
function drawStarsAt(ctx, cx, cy, count, r) {
  const gap = r * 2.3;
  const totalW = (count - 1) * gap;
  for (let i = 0; i < count; i++) {
    const x = cx - totalW / 2 + i * gap;
    ctx.save();
    ctx.translate(x, cy);
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const ang = (Math.PI / 5) * k - Math.PI / 2;
      const rad = k % 2 === 0 ? r : r * 0.45;
      ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
    }
    ctx.closePath();
    ctx.fillStyle = '#ffd54a';
    ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 3;
    ctx.fill();
    ctx.shadowBlur = 0; ctx.lineWidth = 1; ctx.strokeStyle = '#b7791f'; ctx.stroke();
    ctx.restore();
  }
}

export { hexA, roundRect };
