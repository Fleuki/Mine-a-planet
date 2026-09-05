/* ==========================================================================
   particles.js — Lightweight particle + floating-text system for feedback effects.

   Loaded as a classic script from index.html; every top-level binding here is
   shared with the other modules. Load order matters — see index.html.
   ========================================================================== */
var Particles = class {
  constructor() {
    this.parts = [];
    this.texts = [];
    this.rings = [];
  }
  burst(x, y, color, count = 8, opts = {}) {
    var _a, _b, _c, _d, _e, _f;
    const spd = (_a = opts.speed) != null ? _a : 90;
    const life = (_b = opts.life) != null ? _b : 0.6;
    const size = (_c = opts.size) != null ? _c : 3;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = spd * (0.4 + Math.random() * 0.8);
      this.parts.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - ((_d = opts.lift) != null ? _d : 20),
        life,
        maxLife: life,
        size: size * (0.6 + Math.random() * 0.8),
        color,
        gravity: (_e = opts.gravity) != null ? _e : 140,
        shape: (_f = opts.shape) != null ? _f : "spark"
      });
    }
  }
  ring(x, y, color, opts = {}) {
    var _a, _b, _c, _d, _e;
    this.rings.push({
      x,
      y,
      color,
      r: (_a = opts.r0) != null ? _a : 4,
      maxR: (_b = opts.maxR) != null ? _b : 44,
      life: (_c = opts.life) != null ? _c : 0.5,
      maxLife: (_d = opts.life) != null ? _d : 0.5,
      width: (_e = opts.width) != null ? _e : 3
    });
  }
  floatText(x, y, text, color = "#fff", opts = {}) {
    var _a, _b, _c, _d, _e;
    this.texts.push({
      x,
      y,
      text,
      color,
      life: (_a = opts.life) != null ? _a : 1.1,
      maxLife: (_b = opts.life) != null ? _b : 1.1,
      vy: (_c = opts.vy) != null ? _c : -46,
      size: (_d = opts.size) != null ? _d : 18,
      bold: (_e = opts.bold) != null ? _e : true
    });
  }
  update(dt) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.parts.splice(i, 1);
        continue;
      }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - 1.5 * dt;
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      if (t.life <= 0) {
        this.texts.splice(i, 1);
        continue;
      }
      t.y += t.vy * dt;
      t.vy *= 1 - 1.2 * dt;
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      if (r.life <= 0) {
        this.rings.splice(i, 1);
        continue;
      }
      const k = 1 - r.life / r.maxLife;
      r.r = r.maxR * easeOut(k) + 4;
    }
  }
  draw(ctx2) {
    for (const r of this.rings) {
      const a = r.life / r.maxLife;
      ctx2.save();
      ctx2.globalAlpha = a * 0.7;
      ctx2.strokeStyle = r.color;
      ctx2.lineWidth = r.width * a;
      ctx2.beginPath();
      ctx2.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx2.stroke();
      ctx2.restore();
    }
    for (const p of this.parts) {
      const a = Math.max(0, p.life / p.maxLife);
      ctx2.save();
      ctx2.globalAlpha = a;
      ctx2.fillStyle = p.color;
      if (p.shape === "spark") {
        ctx2.shadowColor = p.color;
        ctx2.shadowBlur = 6;
        ctx2.beginPath();
        ctx2.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx2.fill();
      } else {
        ctx2.translate(p.x, p.y);
        ctx2.rotate(p.life * 8);
        ctx2.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
      }
      ctx2.restore();
    }
    ctx2.textAlign = "center";
    ctx2.textBaseline = "middle";
    for (const t of this.texts) {
      const a = Math.min(1, t.life / (t.maxLife * 0.5));
      ctx2.save();
      ctx2.globalAlpha = a;
      ctx2.font = `${t.bold ? "800" : "600"} ${t.size}px "Baloo 2", system-ui, sans-serif`;
      ctx2.lineWidth = 4;
      ctx2.strokeStyle = "rgba(0,0,0,0.55)";
      ctx2.strokeText(t.text, t.x, t.y);
      ctx2.fillStyle = t.color;
      ctx2.fillText(t.text, t.x, t.y);
      ctx2.restore();
    }
  }
};
function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}
