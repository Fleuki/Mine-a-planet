// ============================================================================
//  Animated deep-space background: layered parallax starfield + soft nebula.
//  Nebula is baked once to an offscreen canvas for performance.
// ============================================================================

export class Background {
  constructor() {
    this.stars = [];
    this.shooters = [];
    this.nebula = null;
    this.w = 0; this.h = 0;
    this.t = 0;
    this._shootTimer = 3;
  }

  resize(w, h) {
    this.w = w; this.h = h;
    this._buildStars();
    this._buildNebula();
  }

  _buildStars() {
    const count = Math.floor((this.w * this.h) / 5200);
    this.stars = [];
    for (let i = 0; i < count; i++) {
      const layer = Math.random();               // 0..1 depth
      this.stars.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        r: 0.4 + layer * 1.6,
        base: 0.25 + Math.random() * 0.6,
        tw: Math.random() * Math.PI * 2,          // twinkle phase
        twSpd: 0.6 + Math.random() * 1.8,
        depth: 0.2 + layer * 0.8,
        color: Math.random() < 0.12 ? '#bcd0ff' : (Math.random() < 0.12 ? '#ffe6c0' : '#ffffff'),
      });
    }
  }

  _buildNebula() {
    const c = document.createElement('canvas');
    c.width = this.w; c.height = this.h;
    const g = c.getContext('2d');
    const blobs = [
      { x: 0.22, y: 0.28, r: 0.5, col: [88, 40, 160] },
      { x: 0.8,  y: 0.22, r: 0.42, col: [30, 80, 150] },
      { x: 0.7,  y: 0.82, r: 0.5, col: [140, 40, 120] },
      { x: 0.15, y: 0.85, r: 0.4, col: [40, 90, 140] },
    ];
    for (const b of blobs) {
      const cx = b.x * this.w, cy = b.y * this.h, rad = b.r * Math.max(this.w, this.h);
      const grad = g.createRadialGradient(cx, cy, 0, cx, cy, rad);
      grad.addColorStop(0, `rgba(${b.col[0]},${b.col[1]},${b.col[2]},0.34)`);
      grad.addColorStop(0.5, `rgba(${b.col[0]},${b.col[1]},${b.col[2]},0.12)`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, this.w, this.h);
    }
    this.nebula = c;
  }

  update(dt, parallaxX = 0, parallaxY = 0) {
    this.t += dt;
    for (const s of this.stars) s.tw += s.twSpd * dt;

    this._shootTimer -= dt;
    if (this._shootTimer <= 0) {
      this._shootTimer = 4 + Math.random() * 7;
      const edge = Math.random();
      this.shooters.push({
        x: edge * this.w, y: -20,
        vx: (Math.random() - 0.5) * 240 - 120,
        vy: 220 + Math.random() * 160,
        life: 1.1, maxLife: 1.1,
      });
    }
    for (let i = this.shooters.length - 1; i >= 0; i--) {
      const sh = this.shooters[i];
      sh.life -= dt;
      sh.x += sh.vx * dt; sh.y += sh.vy * dt;
      if (sh.life <= 0) this.shooters.splice(i, 1);
    }
    this.px = parallaxX; this.py = parallaxY;
  }

  draw(ctx) {
    // Base vertical gradient.
    const g = ctx.createLinearGradient(0, 0, 0, this.h);
    g.addColorStop(0, '#0a0a1f');
    g.addColorStop(0.55, '#0d0a24');
    g.addColorStop(1, '#080612');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);

    if (this.nebula) {
      ctx.globalAlpha = 0.9;
      ctx.drawImage(this.nebula, (this.px || 0) * -8, (this.py || 0) * -8);
      ctx.globalAlpha = 1;
    }

    // Stars with twinkle + parallax.
    for (const s of this.stars) {
      const tw = 0.55 + 0.45 * Math.sin(s.tw);
      ctx.globalAlpha = s.base * tw;
      ctx.fillStyle = s.color;
      const ox = (this.px || 0) * s.depth * 14;
      const oy = (this.py || 0) * s.depth * 14;
      ctx.beginPath();
      ctx.arc(s.x + ox, s.y + oy, s.r, 0, Math.PI * 2);
      ctx.fill();
      if (s.r > 1.3) {
        ctx.globalAlpha = s.base * tw * 0.5;
        ctx.beginPath();
        ctx.arc(s.x + ox, s.y + oy, s.r * 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Shooting stars.
    for (const sh of this.shooters) {
      const a = Math.min(1, sh.life / sh.maxLife);
      const len = 60;
      const nx = sh.vx, ny = sh.vy;
      const mag = Math.hypot(nx, ny) || 1;
      const tx = sh.x - (nx / mag) * len, ty = sh.y - (ny / mag) * len;
      const grad = ctx.createLinearGradient(sh.x, sh.y, tx, ty);
      grad.addColorStop(0, `rgba(255,255,255,${a})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sh.x, sh.y); ctx.lineTo(tx, ty); ctx.stroke();
    }
  }
}
