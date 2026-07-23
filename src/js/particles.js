// ============================================================================
//  Lightweight particle + floating-text system.
// ============================================================================

export class Particles {
  constructor() {
    this.parts = [];
    this.texts = [];
    this.rings = [];
  }

  burst(x, y, color, count = 8, opts = {}) {
    const spd = opts.speed ?? 90;
    const life = opts.life ?? 0.6;
    const size = opts.size ?? 3;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = spd * (0.4 + Math.random() * 0.8);
      this.parts.push({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - (opts.lift ?? 20),
        life, maxLife: life,
        size: size * (0.6 + Math.random() * 0.8),
        color,
        gravity: opts.gravity ?? 140,
        shape: opts.shape ?? 'spark',
      });
    }
  }

  ring(x, y, color, opts = {}) {
    this.rings.push({
      x, y, color,
      r: opts.r0 ?? 4,
      maxR: opts.maxR ?? 44,
      life: opts.life ?? 0.5,
      maxLife: opts.life ?? 0.5,
      width: opts.width ?? 3,
    });
  }

  floatText(x, y, text, color = '#fff', opts = {}) {
    this.texts.push({
      x, y, text, color,
      life: opts.life ?? 1.1,
      maxLife: opts.life ?? 1.1,
      vy: opts.vy ?? -46,
      size: opts.size ?? 18,
      bold: opts.bold ?? true,
    });
  }

  update(dt) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt;
      if (p.life <= 0) { this.parts.splice(i, 1); continue; }
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= (1 - 1.5 * dt);
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      if (t.life <= 0) { this.texts.splice(i, 1); continue; }
      t.y += t.vy * dt;
      t.vy *= (1 - 1.2 * dt);
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      if (r.life <= 0) { this.rings.splice(i, 1); continue; }
      const k = 1 - r.life / r.maxLife;
      r.r = r.maxR * easeOut(k) + 4;
    }
  }

  draw(ctx) {
    // rings
    for (const r of this.rings) {
      const a = r.life / r.maxLife;
      ctx.save();
      ctx.globalAlpha = a * 0.7;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = r.width * a;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // particles
    for (const p of this.parts) {
      const a = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      if (p.shape === 'spark') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // shard
        ctx.translate(p.x, p.y);
        ctx.rotate(p.life * 8);
        ctx.fillRect(-p.size, -p.size, p.size * 2, p.size * 2);
      }
      ctx.restore();
    }
    // floating text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const t of this.texts) {
      const a = Math.min(1, t.life / (t.maxLife * 0.5));
      ctx.save();
      ctx.globalAlpha = a;
      ctx.font = `${t.bold ? '800' : '600'} ${t.size}px "Baloo 2", system-ui, sans-serif`;
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }
  }
}

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
