// ============================================================================
//  World renderer: planet (baked, rotating), dock ring, animated mining drones.
// ============================================================================
import { PLANETS, DRONE_BY_ID, RARITIES, ORES } from './config.js';

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

    if (this.surface) {
      const destH = R * 2;
      const scale = destH / this.surfH;
      const destW = this.surfW * scale;
      const period = destW / 2;                  // strip is 2.2x wide; wrap over ~diameter
      let offset = (this.rot * period) % period;
      const top = cy - R;
      // draw two copies for seamless horizontal wrap
      for (let k = -1; k <= 1; k++) {
        ctx.drawImage(this.surface, cx - R - offset + k * period, top, destW, destH);
      }
    } else {
      ctx.fillStyle = p.land;
      ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    }

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
    ctx.rotate(toCenter + Math.PI / 2);                 // face the planet

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
    const bodyW = R * 1.1, bodyH = R * 1.2;
    const spin = t * 10;

    // Body — rounded metallic capsule with rarity trim.
    ctx.save();
    // shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    roundRect(ctx, -bodyW / 2, -bodyH / 2, bodyW, bodyH, R * 0.35);
    const bodyGrad = ctx.createLinearGradient(0, -bodyH / 2, 0, bodyH / 2);
    bodyGrad.addColorStop(0, '#eef3fb');
    bodyGrad.addColorStop(0.5, '#c2cede');
    bodyGrad.addColorStop(1, '#8b98ac');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    // Trim ring / cockpit glow by rarity.
    ctx.fillStyle = hexA(rar.color, 0.95);
    roundRect(ctx, -bodyW / 2, -bodyH / 2, bodyW, R * 0.32, R * 0.16);
    ctx.fill();
    // cockpit
    const eye = ctx.createRadialGradient(0, -R * 0.15, 0, 0, -R * 0.15, R * 0.42);
    eye.addColorStop(0, rar.glow);
    eye.addColorStop(0.6, rar.color);
    eye.addColorStop(1, hexA(rar.color, 0.2));
    ctx.fillStyle = eye;
    ctx.beginPath(); ctx.arc(0, -R * 0.12, R * 0.34, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(-R * 0.1, -R * 0.24, R * 0.09, 0, Math.PI * 2); ctx.fill();

    // Side thruster fins.
    ctx.fillStyle = '#8f9db2';
    roundRect(ctx, -bodyW / 2 - R * 0.18, -R * 0.05, R * 0.2, R * 0.5, R * 0.08); ctx.fill();
    roundRect(ctx, bodyW / 2 - R * 0.02, -R * 0.05, R * 0.2, R * 0.5, R * 0.08); ctx.fill();
    // thruster flames
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const fl = 0.5 + 0.5 * Math.abs(Math.sin(t * 20));
    for (const fx of [-bodyW / 2 - R * 0.08, bodyW / 2 + R * 0.08]) {
      const fg = ctx.createRadialGradient(fx, R * 0.5, 0, fx, R * 0.5, R * 0.3 * fl);
      fg.addColorStop(0, 'rgba(140,210,255,0.9)');
      fg.addColorStop(1, 'rgba(140,210,255,0)');
      ctx.fillStyle = fg;
      ctx.beginPath(); ctx.arc(fx, R * 0.5, R * 0.3 * fl, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();

    // Drill assembly at bottom, animated by shape.
    ctx.translate(0, bodyH / 2 - R * 0.05);
    this._drawDrill(ctx, drone.shape, R, spin, rar);
    ctx.restore();
  }

  _drawDrill(ctx, shape, R, spin, rar) {
    ctx.save();
    if (shape === 'laser') {
      // Emitter nozzle.
      ctx.fillStyle = '#5a6577';
      roundRect(ctx, -R * 0.16, 0, R * 0.32, R * 0.4, R * 0.08); ctx.fill();
      ctx.fillStyle = rar.glow;
      ctx.beginPath(); ctx.arc(0, R * 0.42, R * 0.12, 0, Math.PI * 2); ctx.fill();
      ctx.restore(); return;
    }
    if (shape === 'saw') {
      ctx.translate(0, R * 0.4);
      ctx.rotate(spin);
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
    // auger / drill / twin / quad: conical spinning bits
    const bits = shape === 'twin' ? 2 : shape === 'quad' ? 3 : 1;
    const spread = R * (bits > 1 ? 0.28 : 0);
    for (let b = 0; b < bits; b++) {
      const bx = bits === 1 ? 0 : -spread + (b / (bits - 1)) * spread * 2;
      ctx.save();
      ctx.translate(bx, 0);
      // shaft
      ctx.fillStyle = '#9aa7ba';
      roundRect(ctx, -R * 0.1, 0, R * 0.2, R * 0.25, R * 0.05); ctx.fill();
      // cone with rotating helical stripes
      const len = R * 0.55, wid = R * 0.22;
      const cone = ctx.createLinearGradient(-wid, 0, wid, 0);
      cone.addColorStop(0, '#6b7688');
      cone.addColorStop(0.5, '#dfe7f1');
      cone.addColorStop(1, '#6b7688');
      ctx.fillStyle = cone;
      ctx.beginPath();
      ctx.moveTo(-wid, R * 0.2); ctx.lineTo(wid, R * 0.2);
      ctx.lineTo(0, R * 0.2 + len); ctx.closePath(); ctx.fill();
      // helical highlight lines (animate via spin)
      ctx.strokeStyle = hexA(rar.color, 0.8);
      ctx.lineWidth = 2;
      for (let s = 0; s < 3; s++) {
        const ph = (spin * 0.5 + s / 3) % 1;
        const yy = R * 0.2 + ph * len;
        const t2 = ph;
        const half = wid * (1 - t2);
        ctx.beginPath(); ctx.moveTo(-half, yy); ctx.lineTo(half, yy); ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }
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

export { hexA, roundRect };
