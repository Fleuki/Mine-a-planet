/* ==========================================================================
   render.js — WorldRenderer: the planet sphere, dock ring and drone placement layout.

   Loaded as a classic script from index.html; every top-level binding here is
   shared with the other modules. Load order matters — see index.html.
   ========================================================================== */
function mulberry32(a) {
  return function() {
    a |= 0;
    a = a + 1831565813 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var WorldRenderer = class {
  constructor() {
    this.cx = 0;
    this.cy = 0;
    this.R = 120;
    this.rot = 0;
    this.tier = -1;
    this.surface = null;
    this.clouds = null;
    this.lights = null;
    this.surfW = 0;
    this.surfH = 0;
    this.pulse = 0;
    this.impacts = [];
  }
  layout(w, h) {
    this.cx = w / 2;
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
    const R = 260;
    const W2 = Math.floor(R * 2 * 2.2);
    const H2 = R * 2;
    const c = document.createElement("canvas");
    c.width = W2;
    c.height = H2;
    const g = c.getContext("2d");
    const rnd = mulberry32(tier * 7919 + 13);
    g.fillStyle = p.core;
    g.fillRect(0, 0, W2, H2);
    const blobs = 10 + Math.floor(rnd() * 6);
    for (let i = 0; i < blobs; i++) {
      const bx = rnd() * W2, by = rnd() * H2;
      const br = (0.12 + rnd() * 0.2) * H2;
      const grad = g.createRadialGradient(bx, by, 0, bx, by, br);
      grad.addColorStop(0, p.land);
      grad.addColorStop(0.7, p.land);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      g.globalAlpha = 0.55;
      g.fillStyle = grad;
      g.beginPath();
      g.arc(bx, by, br, 0, Math.PI * 2);
      g.fill();
    }
    g.globalAlpha = 1;
    for (let i = 0; i < blobs; i++) {
      const bx = rnd() * W2, by = rnd() * H2;
      const br = (0.04 + rnd() * 0.08) * H2;
      const grad = g.createRadialGradient(bx, by, 0, bx, by, br);
      grad.addColorStop(0, hexA(p.accent, 0.5));
      grad.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grad;
      g.beginPath();
      g.arc(bx, by, br, 0, Math.PI * 2);
      g.fill();
    }
    const craters = 14 + Math.floor(rnd() * 10);
    for (let i = 0; i < craters; i++) {
      const bx = rnd() * W2, by = rnd() * H2;
      const br = (0.015 + rnd() * 0.05) * H2;
      g.save();
      g.globalAlpha = 0.4;
      g.fillStyle = "rgba(0,0,0,0.35)";
      g.beginPath();
      g.arc(bx, by, br, 0, Math.PI * 2);
      g.fill();
      g.globalAlpha = 0.5;
      g.strokeStyle = hexA(p.accent, 0.5);
      g.lineWidth = br * 0.28;
      g.beginPath();
      g.arc(bx - br * 0.15, by - br * 0.15, br * 0.9, 0, Math.PI * 2);
      g.stroke();
      g.restore();
    }
    const oreColors = ORES.filter((o) => o.tier <= tier).slice(-4).map((o) => o.shine);
    const veins = 22 + tier * 3;
    for (let i = 0; i < veins; i++) {
      const bx = rnd() * W2, by = rnd() * H2;
      const col = oreColors[Math.floor(rnd() * oreColors.length)] || "#fff";
      const s = (6e-3 + rnd() * 0.014) * H2;
      g.save();
      g.globalAlpha = 0.85;
      g.fillStyle = col;
      g.shadowColor = col;
      g.shadowBlur = s * 2;
      g.beginPath();
      g.translate(bx, by);
      g.rotate(rnd() * Math.PI);
      g.moveTo(0, -s);
      g.lineTo(s * 0.7, 0);
      g.lineTo(0, s);
      g.lineTo(-s * 0.7, 0);
      g.closePath();
      g.fill();
      g.restore();
    }
    this.surface = c;
    this.surfW = W2;
    this.surfH = H2;
    this.clouds = null;
    if (p.clouds) {
      const cc = document.createElement("canvas");
      cc.width = W2;
      cc.height = H2;
      const cg = cc.getContext("2d");
      const cn = 14 + Math.floor(rnd() * 10);
      for (let i = 0; i < cn; i++) {
        const bx = rnd() * W2, by = rnd() * H2;
        const br = (0.09 + rnd() * 0.18) * H2;
        const grad = cg.createRadialGradient(bx, by, 0, bx, by, br);
        grad.addColorStop(0, `rgba(255,255,255,${(0.5 * p.clouds).toFixed(3)})`);
        grad.addColorStop(0.5, `rgba(255,255,255,${(0.2 * p.clouds).toFixed(3)})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        cg.fillStyle = grad;
        cg.beginPath();
        cg.arc(bx, by, br, 0, Math.PI * 2);
        cg.fill();
      }
      this.clouds = cc;
    }
    this.lights = null;
    if (p.lights) {
      const lc = document.createElement("canvas");
      lc.width = W2;
      lc.height = H2;
      const lg = lc.getContext("2d");
      const ln = 100 + Math.floor(rnd() * 80);
      for (let i = 0; i < ln; i++) {
        const bx = rnd() * W2, by = rnd() * H2;
        const s = (4e-3 + rnd() * 0.011) * H2;
        lg.fillStyle = p.lights;
        lg.shadowColor = p.lights;
        lg.shadowBlur = s * 3;
        lg.beginPath();
        lg.arc(bx, by, s, 0, Math.PI * 2);
        lg.fill();
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
    const startAngle = -Math.PI / 2;
    const angle = startAngle + index / total * Math.PI * 2;
    const ringR = this.R * 1.5;
    return {
      x: this.cx + Math.cos(angle) * ringR,
      y: this.cy + Math.sin(angle) * ringR,
      angle
    };
  }
  drawPlanet(ctx2) {
    const p = PLANETS[this.tier] || PLANETS[0];
    const { cx, cy, R } = this;
    if (p.ring) this._drawRing(ctx2, cx, cy, R, p.ring, false);
    ctx2.save();
    ctx2.globalCompositeOperation = "lighter";
    const atmo = ctx2.createRadialGradient(cx, cy, R * 0.85, cx, cy, R * 1.35);
    atmo.addColorStop(0, hexA(p.atmos, 0));
    atmo.addColorStop(0.55, hexA(p.atmos, 0.28));
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
    const artPath = PLANET_ART[this.tier];
    const art = artPath && getArt(artPath);
    const custom = art && art.ready && art.img.width;
    if (custom) {
      ctx2.drawImage(art.img, cx - R, cy - R, R * 2, R * 2);
    } else if (this.surface) {
      this._drawStrip(ctx2, this.surface, R, this.rot, 1);
    } else {
      ctx2.fillStyle = p.land;
      ctx2.fillRect(cx - R, cy - R, R * 2, R * 2);
    }
    if (!custom && this.clouds) this._drawStrip(ctx2, this.clouds, R, this.rot, 1.45);
    const shade = ctx2.createRadialGradient(
      cx - R * 0.35,
      cy - R * 0.35,
      R * 0.1,
      cx,
      cy,
      R * 1.05
    );
    shade.addColorStop(0, "rgba(255,255,255,0.28)");
    shade.addColorStop(0.45, "rgba(255,255,255,0.0)");
    shade.addColorStop(0.78, "rgba(0,0,0,0.12)");
    shade.addColorStop(1, "rgba(0,0,0,0.62)");
    ctx2.fillStyle = shade;
    ctx2.fillRect(cx - R, cy - R, R * 2, R * 2);
    if (!custom && this.lights) {
      ctx2.save();
      ctx2.globalCompositeOperation = "lighter";
      const night = ctx2.createRadialGradient(cx - R * 0.4, cy - R * 0.4, R * 0.2, cx + R * 0.3, cy + R * 0.3, R * 1.3);
      this._drawStrip(ctx2, this.lights, R, this.rot, 1);
      ctx2.globalCompositeOperation = "destination-out";
      night.addColorStop(0, "rgba(0,0,0,0.85)");
      night.addColorStop(0.6, "rgba(0,0,0,0.15)");
      night.addColorStop(1, "rgba(0,0,0,0)");
      ctx2.fillStyle = night;
      ctx2.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx2.restore();
    }
    for (const im of this.impacts) {
      const a = im.life / im.maxLife;
      const ix = cx + Math.cos(im.angle) * R * 0.94;
      const iy = cy + Math.sin(im.angle) * R * 0.94;
      ctx2.globalAlpha = a;
      const gr = ctx2.createRadialGradient(ix, iy, 0, ix, iy, R * 0.13);
      gr.addColorStop(0, im.color);
      gr.addColorStop(1, "rgba(0,0,0,0)");
      ctx2.fillStyle = gr;
      ctx2.beginPath();
      ctx2.arc(ix, iy, R * 0.13, 0, Math.PI * 2);
      ctx2.fill();
    }
    ctx2.globalAlpha = 1;
    ctx2.restore();
    ctx2.save();
    ctx2.strokeStyle = hexA(p.atmos, 0.5);
    ctx2.lineWidth = 2;
    ctx2.beginPath();
    ctx2.arc(cx, cy, R - 1, 0, Math.PI * 2);
    ctx2.stroke();
    ctx2.restore();
    if (p.ring) this._drawRing(ctx2, cx, cy, R, p.ring, true);
  }
  // Draws a baked wide strip clipped to the current sphere clip, scrolling
  // horizontally by `rot * speed` for a fake rotation / parallax.
  _drawStrip(ctx2, strip, R, rot, speed) {
    const { cx, cy } = this;
    const destH = R * 2;
    const scale = destH / strip.height;
    const destW = strip.width * scale;
    const period = destW / 2;
    const offset = rot * speed * period % period;
    const top = cy - R;
    for (let k = -1; k <= 1; k++) {
      ctx2.drawImage(strip, cx - R - offset + k * period, top, destW, destH);
    }
  }
  // Draws one half of a tilted planetary ring. frontOnly=true clips to the
  // lower band (in front of the planet); false clips to the upper band (behind).
  _drawRing(ctx2, cx, cy, R, color, frontOnly) {
    ctx2.save();
    ctx2.beginPath();
    if (frontOnly) ctx2.rect(cx - R * 2.2, cy, R * 4.4, R * 1.4);
    else ctx2.rect(cx - R * 2.2, cy - R * 1.4, R * 4.4, R * 1.4);
    ctx2.clip();
    ctx2.globalCompositeOperation = "lighter";
    ctx2.strokeStyle = hexA(color, 0.4);
    ctx2.lineWidth = R * 0.2;
    ctx2.beginPath();
    ctx2.ellipse(cx, cy, R * 1.72, R * 0.5, -0.3, 0, Math.PI * 2);
    ctx2.stroke();
    ctx2.strokeStyle = hexA(color, 0.85);
    ctx2.lineWidth = R * 0.05;
    ctx2.beginPath();
    ctx2.ellipse(cx, cy, R * 1.58, R * 0.46, -0.3, 0, Math.PI * 2);
    ctx2.stroke();
    ctx2.restore();
  }
  // Draws a dock slot; if drone present, animate it mining.
  drawSlot(ctx2, slot, total, t, hovered) {
    const pos = this.slotPos(slot.index, total);
    const toCenter = Math.atan2(this.cy - pos.y, this.cx - pos.x);
    ctx2.save();
    ctx2.translate(pos.x, pos.y);
    const padR = this.R * 0.2;
    if (!slot.droneId) {
      ctx2.strokeStyle = hovered ? "rgba(120,220,255,0.9)" : "rgba(150,170,210,0.5)";
      ctx2.lineWidth = 2.5;
      ctx2.setLineDash([6, 6]);
      ctx2.beginPath();
      ctx2.arc(0, 0, padR, 0, Math.PI * 2);
      ctx2.stroke();
      ctx2.setLineDash([]);
      ctx2.globalAlpha = hovered ? 1 : 0.6;
      ctx2.strokeStyle = hovered ? "#7fe0ff" : "#9fb3d0";
      ctx2.lineWidth = 3;
      ctx2.beginPath();
      ctx2.moveTo(-padR * 0.4, 0);
      ctx2.lineTo(padR * 0.4, 0);
      ctx2.moveTo(0, -padR * 0.4);
      ctx2.lineTo(0, padR * 0.4);
      ctx2.stroke();
      ctx2.restore();
      return pos;
    }
    const drone = DRONE_BY_ID[slot.droneId];
    const rar = RARITIES[drone.rarity];
    const hover = Math.sin(t * 3 + slot.index) * 3;
    ctx2.translate(0, hover);
    ctx2.rotate(toCenter - Math.PI / 2);
    const aura = ctx2.createRadialGradient(0, 0, 0, 0, 0, padR * 1.8);
    aura.addColorStop(0, hexA(rar.glow, 0.35));
    aura.addColorStop(1, "rgba(0,0,0,0)");
    ctx2.fillStyle = aura;
    ctx2.beginPath();
    ctx2.arc(0, 0, padR * 1.8, 0, Math.PI * 2);
    ctx2.fill();
    this._drawDrone(ctx2, drone, rar, padR, t + slot.index, slot.progress);
    ctx2.restore();
    const active = !!slot.droneId;
    if (active) {
      const bx = pos.x + Math.cos(toCenter) * padR * 1.1;
      const by = pos.y + hover + Math.sin(toCenter) * padR * 1.1;
      const sx = this.cx - Math.cos(toCenter) * this.R * 0.98;
      const sy = this.cy - Math.sin(toCenter) * this.R * 0.98;
      this._drawBeam(ctx2, bx, by, sx, sy, rar, drone.shape, t + slot.index);
    }
    if (slot.oreId) {
      const ore = ORE_BY_ID[slot.oreId];
      if (ore) {
        const perp = toCenter + Math.PI / 2;
        const gx = pos.x + Math.cos(perp) * padR * 1;
        const gy = pos.y + Math.sin(perp) * padR * 1 + hover;
        drawOreGem(ctx2, gx, gy, padR * 0.32, ore, t * 2 + slot.index);
      }
    }
    if (slot.star > 0) {
      const outAng = Math.atan2(pos.y - this.cy, pos.x - this.cx);
      const sx2 = pos.x + Math.cos(outAng) * padR * 1.45;
      const sy2 = pos.y + Math.sin(outAng) * padR * 1.45 + hover;
      drawStarsAt(ctx2, sx2, sy2, slot.star, padR * 0.2);
    }
    return pos;
  }
  _drawBeam(ctx2, x1, y1, x2, y2, rar, shape, t) {
    ctx2.save();
    ctx2.globalCompositeOperation = "lighter";
    if (shape === "laser") {
      const flick = 0.6 + 0.4 * Math.sin(t * 30);
      const grad = ctx2.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, hexA(rar.glow, 0.9 * flick));
      grad.addColorStop(1, hexA(rar.color, 0.2));
      ctx2.strokeStyle = grad;
      ctx2.lineWidth = 3.5;
      ctx2.shadowColor = rar.glow;
      ctx2.shadowBlur = 10;
      ctx2.beginPath();
      ctx2.moveTo(x1, y1);
      ctx2.lineTo(x2, y2);
      ctx2.stroke();
    } else {
      const grad = ctx2.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0, hexA(rar.glow, 0.5));
      grad.addColorStop(1, hexA(rar.color, 0.1));
      ctx2.strokeStyle = grad;
      ctx2.lineWidth = 2;
      ctx2.setLineDash([3, 7]);
      ctx2.lineDashOffset = -t * 40;
      ctx2.beginPath();
      ctx2.moveTo(x1, y1);
      ctx2.lineTo(x2, y2);
      ctx2.stroke();
      ctx2.setLineDash([]);
    }
    ctx2.restore();
  }
  // Drone drawn facing "down" (+y) toward planet; drill tip at bottom.
  _drawDrone(ctx2, drone, rar, R, t, progress) {
    if (drawDroneArt(ctx2, drone, R)) return;
    const spin = t * 10;
    drawDroneChassis(ctx2, drone, rar, R, { spin, thrust: t, animated: true });
    ctx2.save();
    ctx2.translate(0, R * 0.62 + R * 0.1);
    this._drawDrill(ctx2, drone.shape, R, spin, rar, true);
    ctx2.restore();
  }
  _drawDrill(ctx2, shape, R, spin, rar, animated) {
    drawDrill(ctx2, shape, R, spin, rar, animated);
  }
};
function drawDroneChassis(ctx2, drone, rar, R, opts = {}) {
  const { thrust = 0, animated = false } = opts;
  const bodyW = R * 1.28, bodyH = R * 1.02;
  ctx2.save();
  ctx2.fillStyle = "#aeb8c9";
  roundRect(ctx2, -bodyW / 2 - R * 0.14, -R * 0.32, R * 0.32, R * 0.66, R * 0.15);
  ctx2.fill();
  roundRect(ctx2, bodyW / 2 - R * 0.18, -R * 0.32, R * 0.32, R * 0.66, R * 0.15);
  ctx2.fill();
  ctx2.fillStyle = rar.glow;
  ctx2.shadowColor = rar.color;
  ctx2.shadowBlur = 6;
  ctx2.beginPath();
  ctx2.arc(-bodyW / 2 - R * 0.14 + R * 0.16, 0, R * 0.07, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.beginPath();
  ctx2.arc(bodyW / 2 - R * 0.18 + R * 0.16, 0, R * 0.07, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.shadowBlur = 0;
  if (animated) {
    ctx2.save();
    ctx2.globalCompositeOperation = "lighter";
    const fl = 0.5 + 0.5 * Math.abs(Math.sin(thrust * 20));
    for (const fx of [-bodyW / 2 - R * 0, bodyW / 2 + R * 0]) {
      const fg = ctx2.createRadialGradient(fx, R * 0.42, 0, fx, R * 0.42, R * 0.26 * fl);
      fg.addColorStop(0, "rgba(150,215,255,0.85)");
      fg.addColorStop(1, "rgba(150,215,255,0)");
      ctx2.fillStyle = fg;
      ctx2.beginPath();
      ctx2.arc(fx, R * 0.42, R * 0.26 * fl, 0, Math.PI * 2);
      ctx2.fill();
    }
    ctx2.restore();
  }
  ctx2.shadowColor = "rgba(0,0,0,0.5)";
  ctx2.shadowBlur = 8;
  ctx2.shadowOffsetY = 3;
  roundRect(ctx2, -bodyW / 2, -bodyH / 2, bodyW, bodyH, R * 0.34);
  const bodyGrad = ctx2.createLinearGradient(0, -bodyH / 2, 0, bodyH / 2);
  bodyGrad.addColorStop(0, "#f4f8ff");
  bodyGrad.addColorStop(0.5, "#ccd7e7");
  bodyGrad.addColorStop(1, "#96a4ba");
  ctx2.fillStyle = bodyGrad;
  ctx2.fill();
  ctx2.shadowBlur = 0;
  ctx2.shadowOffsetY = 0;
  ctx2.fillStyle = "rgba(255,255,255,0.32)";
  roundRect(ctx2, -bodyW * 0.32, -bodyH / 2 + R * 0.05, bodyW * 0.64, R * 0.15, R * 0.08);
  ctx2.fill();
  const visorY = -R * 0.03;
  ctx2.fillStyle = "rgba(18,15,32,0.94)";
  roundRect(ctx2, -bodyW * 0.42, visorY - R * 0.24, bodyW * 0.84, R * 0.5, R * 0.2);
  ctx2.fill();
  for (const ex of [-R * 0.27, R * 0.27]) {
    const eg = ctx2.createRadialGradient(ex - R * 0.03, visorY - R * 0.03, 0, ex, visorY, R * 0.19);
    eg.addColorStop(0, "#ffffff");
    eg.addColorStop(0.35, rar.glow);
    eg.addColorStop(1, hexA(rar.color, 0.25));
    ctx2.fillStyle = eg;
    ctx2.beginPath();
    ctx2.ellipse(ex, visorY, R * 0.13, R * 0.16, 0, 0, Math.PI * 2);
    ctx2.fill();
  }
  ctx2.fillStyle = hexA(rar.color, 0.95);
  roundRect(ctx2, -bodyW / 2, bodyH / 2 - R * 0.13, bodyW, R * 0.13, R * 0.07);
  ctx2.fill();
  ctx2.fillStyle = "#8f9db2";
  roundRect(ctx2, -R * 0.2, bodyH / 2 - R * 0.04, R * 0.4, R * 0.2, R * 0.06);
  ctx2.fill();
  ctx2.restore();
}
function drawDrill(ctx2, shape, R, spin, rar, animated = true) {
  ctx2.save();
  if (shape === "laser") {
    ctx2.fillStyle = "#5a6577";
    roundRect(ctx2, -R * 0.18, 0, R * 0.36, R * 0.42, R * 0.09);
    ctx2.fill();
    const glow = ctx2.createRadialGradient(0, R * 0.5, 0, 0, R * 0.5, R * 0.2);
    glow.addColorStop(0, "#ffffff");
    glow.addColorStop(0.4, rar.glow);
    glow.addColorStop(1, hexA(rar.color, 0));
    ctx2.fillStyle = glow;
    ctx2.beginPath();
    ctx2.arc(0, R * 0.5, R * 0.2, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.fillStyle = rar.glow;
    ctx2.beginPath();
    ctx2.arc(0, R * 0.5, R * 0.1, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.restore();
    return;
  }
  if (shape === "saw") {
    ctx2.translate(0, R * 0.44);
    if (animated) ctx2.rotate(spin);
    ctx2.fillStyle = "#cbd5e3";
    const teeth = 10, rr = R * 0.44;
    ctx2.beginPath();
    for (let i = 0; i < teeth * 2; i++) {
      const a = i / (teeth * 2) * Math.PI * 2;
      const rad = i % 2 === 0 ? rr : rr * 0.68;
      ctx2.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx2.closePath();
    ctx2.fill();
    ctx2.fillStyle = hexA(rar.color, 0.85);
    ctx2.beginPath();
    ctx2.arc(0, 0, rr * 0.4, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.fillStyle = "#8f9db2";
    ctx2.beginPath();
    ctx2.arc(0, 0, rr * 0.2, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.restore();
    return;
  }
  const bits = shape === "twin" ? 2 : shape === "quad" ? 3 : 1;
  const spread = R * (bits > 1 ? 0.3 : 0);
  const len = bits > 1 ? R * 0.66 : R * 0.9;
  const wid = bits > 1 ? R * 0.17 : R * 0.25;
  for (let b = 0; b < bits; b++) {
    const bx = bits === 1 ? 0 : -spread + b / (bits - 1) * spread * 2;
    ctx2.save();
    ctx2.translate(bx, 0);
    ctx2.fillStyle = "#9aa7ba";
    roundRect(ctx2, -wid * 1.1, -R * 0.02, wid * 2.2, R * 0.14, R * 0.05);
    ctx2.fill();
    ctx2.beginPath();
    ctx2.moveTo(-wid, R * 0.1);
    ctx2.lineTo(wid, R * 0.1);
    ctx2.lineTo(0, R * 0.1 + len);
    ctx2.closePath();
    const cone = ctx2.createLinearGradient(-wid, 0, wid, 0);
    cone.addColorStop(0, "#5f6a7c");
    cone.addColorStop(0.5, "#eef3fb");
    cone.addColorStop(1, "#5f6a7c");
    ctx2.fillStyle = cone;
    ctx2.fill();
    ctx2.save();
    ctx2.beginPath();
    ctx2.moveTo(-wid, R * 0.1);
    ctx2.lineTo(wid, R * 0.1);
    ctx2.lineTo(0, R * 0.1 + len);
    ctx2.closePath();
    ctx2.clip();
    ctx2.strokeStyle = hexA(rar.color, 0.85);
    ctx2.lineWidth = Math.max(1.4, R * 0.05);
    const phase = animated ? spin * 0.16 % 1 : 0;
    for (let s = -1; s < 5; s++) {
      const off = (s + phase) * (len / 4);
      ctx2.beginPath();
      ctx2.moveTo(-wid, R * 0.1 + off);
      ctx2.lineTo(wid, R * 0.1 + off - len * 0.18);
      ctx2.stroke();
    }
    ctx2.restore();
    ctx2.fillStyle = "#ffffff";
    ctx2.shadowColor = rar.glow;
    ctx2.shadowBlur = 4;
    ctx2.beginPath();
    ctx2.arc(0, R * 0.1 + len, wid * 0.5, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.shadowBlur = 0;
    ctx2.restore();
  }
  ctx2.restore();
}
function drawDroneArt(ctx2, drone, R) {
  const path = DRONE_ART[drone.id];
  if (!path) return false;
  const art = getArt(path);
  if (!art || !art.ready || !art.img.width) return false;
  const h = R * 3;
  const w = h * (art.img.width / art.img.height);
  ctx2.drawImage(art.img, -w / 2, -R * 0.95, w, h);
  return true;
}
function roundRect(ctx2, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx2.beginPath();
  ctx2.moveTo(x + r, y);
  ctx2.arcTo(x + w, y, x + w, y + h, r);
  ctx2.arcTo(x + w, y + h, x, y + h, r);
  ctx2.arcTo(x, y + h, x, y, r);
  ctx2.arcTo(x, y, x + w, y, r);
  ctx2.closePath();
}
function hexA(hex, a) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = n >> 16 & 255, g = n >> 8 & 255, b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}
function drawOreGem(ctx2, cx, cy, r, ore, t) {
  const bob = Math.sin(t) * r * 0.15;
  cy += bob;
  ctx2.save();
  ctx2.globalCompositeOperation = "lighter";
  const glow = ctx2.createRadialGradient(cx, cy, 0, cx, cy, r * 2.2);
  glow.addColorStop(0, hexA(ore.shine, 0.5));
  glow.addColorStop(1, hexA(ore.shine, 0));
  ctx2.fillStyle = glow;
  ctx2.beginPath();
  ctx2.arc(cx, cy, r * 2.2, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.restore();
  ctx2.save();
  ctx2.translate(cx, cy);
  const top = -r, bot = r * 1.15, w = r * 0.85, sh = -r * 0.35;
  ctx2.beginPath();
  ctx2.moveTo(0, top);
  ctx2.lineTo(w, sh);
  ctx2.lineTo(w * 0.6, bot);
  ctx2.lineTo(-w * 0.6, bot);
  ctx2.lineTo(-w, sh);
  ctx2.closePath();
  const g = ctx2.createLinearGradient(0, top, 0, bot);
  g.addColorStop(0, ore.shine);
  g.addColorStop(0.5, ore.color);
  g.addColorStop(1, ore.color);
  ctx2.fillStyle = g;
  ctx2.strokeStyle = "rgba(0,0,0,0.35)";
  ctx2.lineWidth = 1;
  ctx2.fill();
  ctx2.stroke();
  ctx2.beginPath();
  ctx2.moveTo(0, top);
  ctx2.lineTo(w * 0.5, sh);
  ctx2.lineTo(0, sh * 0.2);
  ctx2.lineTo(-w * 0.5, sh);
  ctx2.closePath();
  ctx2.fillStyle = hexA(ore.shine, 0.7);
  ctx2.fill();
  const tw = 0.5 + 0.5 * Math.sin(t * 2.3);
  ctx2.globalAlpha = tw;
  ctx2.fillStyle = "#fff";
  ctx2.beginPath();
  ctx2.arc(-w * 0.25, sh * 0.6, r * 0.12, 0, Math.PI * 2);
  ctx2.fill();
  ctx2.restore();
}
function drawStarsAt(ctx2, cx, cy, count, r) {
  const gap = r * 2.3;
  const totalW = (count - 1) * gap;
  for (let i = 0; i < count; i++) {
    const x = cx - totalW / 2 + i * gap;
    ctx2.save();
    ctx2.translate(x, cy);
    ctx2.beginPath();
    for (let k = 0; k < 10; k++) {
      const ang = Math.PI / 5 * k - Math.PI / 2;
      const rad = k % 2 === 0 ? r : r * 0.45;
      ctx2.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
    }
    ctx2.closePath();
    ctx2.fillStyle = "#ffd54a";
    ctx2.shadowColor = "rgba(0,0,0,0.7)";
    ctx2.shadowBlur = 3;
    ctx2.fill();
    ctx2.shadowBlur = 0;
    ctx2.lineWidth = 1;
    ctx2.strokeStyle = "#b7791f";
    ctx2.stroke();
    ctx2.restore();
  }
}
