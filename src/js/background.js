/* ==========================================================================
   background.js — Parallax starfield / nebula backdrop drawn behind the planet.

   Loaded as a classic script from index.html; every top-level binding here is
   shared with the other modules. Load order matters — see index.html.
   ========================================================================== */
var Background = class {
  constructor() {
    this.stars = [];
    this.shooters = [];
    this.nebula = null;
    this.w = 0;
    this.h = 0;
    this.t = 0;
    this._shootTimer = 3;
    this.eventTheme = null;
    this.eventOn = false;
    this.eventAlpha = 0;
  }
  setEvent(theme) {
    this.eventTheme = theme;
    this.eventOn = true;
  }
  clearEvent() {
    this.eventOn = false;
  }
  resize(w, h) {
    this.w = w;
    this.h = h;
    this._buildStars();
    this._buildNebula();
  }
  _buildStars() {
    const count = Math.floor(this.w * this.h / 5200);
    this.stars = [];
    for (let i = 0; i < count; i++) {
      const layer = Math.random();
      this.stars.push({
        x: Math.random() * this.w,
        y: Math.random() * this.h,
        r: 0.4 + layer * 1.6,
        base: 0.25 + Math.random() * 0.6,
        tw: Math.random() * Math.PI * 2,
        // twinkle phase
        twSpd: 0.6 + Math.random() * 1.8,
        depth: 0.2 + layer * 0.8,
        color: Math.random() < 0.12 ? "#bcd0ff" : Math.random() < 0.12 ? "#ffe6c0" : "#ffffff"
      });
    }
  }
  _buildNebula() {
    const c = document.createElement("canvas");
    c.width = this.w;
    c.height = this.h;
    const g = c.getContext("2d");
    const blobs = [
      { x: 0.22, y: 0.28, r: 0.5, col: [88, 40, 160] },
      { x: 0.8, y: 0.22, r: 0.42, col: [30, 80, 150] },
      { x: 0.7, y: 0.82, r: 0.5, col: [140, 40, 120] },
      { x: 0.15, y: 0.85, r: 0.4, col: [40, 90, 140] }
    ];
    for (const b of blobs) {
      const cx = b.x * this.w, cy = b.y * this.h, rad = b.r * Math.max(this.w, this.h);
      const grad = g.createRadialGradient(cx, cy, 0, cx, cy, rad);
      grad.addColorStop(0, `rgba(${b.col[0]},${b.col[1]},${b.col[2]},0.34)`);
      grad.addColorStop(0.5, `rgba(${b.col[0]},${b.col[1]},${b.col[2]},0.12)`);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, this.w, this.h);
    }
    this.nebula = c;
  }
  update(dt, parallaxX = 0, parallaxY = 0) {
    var _a;
    this.t += dt;
    for (const s of this.stars) s.tw += s.twSpd * dt;
    const target = this.eventOn ? 1 : 0;
    this.eventAlpha += (target - this.eventAlpha) * Math.min(1, dt * 2.2);
    if (!this.eventOn && this.eventAlpha < 0.01) this.eventTheme = null;
    const meteorStorm = this.eventOn && ((_a = this.eventTheme) == null ? void 0 : _a.meteors);
    this._shootTimer -= dt;
    if (this._shootTimer <= 0) {
      this._shootTimer = meteorStorm ? 0.18 + Math.random() * 0.5 : 4 + Math.random() * 7;
      const edge = Math.random();
      this.shooters.push({
        x: edge * this.w,
        y: -20,
        vx: (Math.random() - 0.5) * 240 - 120,
        vy: 220 + Math.random() * 160,
        life: 1.1,
        maxLife: 1.1,
        meteor: meteorStorm
      });
    }
    for (let i = this.shooters.length - 1; i >= 0; i--) {
      const sh = this.shooters[i];
      sh.life -= dt;
      sh.x += sh.vx * dt;
      sh.y += sh.vy * dt;
      if (sh.life <= 0) this.shooters.splice(i, 1);
    }
    this.px = parallaxX;
    this.py = parallaxY;
  }
  draw(ctx2) {
    const g = ctx2.createLinearGradient(0, 0, 0, this.h);
    g.addColorStop(0, "#0a0a1f");
    g.addColorStop(0.55, "#0d0a24");
    g.addColorStop(1, "#080612");
    ctx2.fillStyle = g;
    ctx2.fillRect(0, 0, this.w, this.h);
    if (this.nebula) {
      ctx2.globalAlpha = 0.9;
      ctx2.drawImage(this.nebula, (this.px || 0) * -8, (this.py || 0) * -8);
      ctx2.globalAlpha = 1;
    }
    for (const s of this.stars) {
      const tw = 0.55 + 0.45 * Math.sin(s.tw);
      ctx2.globalAlpha = s.base * tw;
      ctx2.fillStyle = s.color;
      const ox = (this.px || 0) * s.depth * 14;
      const oy = (this.py || 0) * s.depth * 14;
      ctx2.beginPath();
      ctx2.arc(s.x + ox, s.y + oy, s.r, 0, Math.PI * 2);
      ctx2.fill();
      if (s.r > 1.3) {
        ctx2.globalAlpha = s.base * tw * 0.5;
        ctx2.beginPath();
        ctx2.arc(s.x + ox, s.y + oy, s.r * 2.4, 0, Math.PI * 2);
        ctx2.fill();
      }
    }
    ctx2.globalAlpha = 1;
    for (const sh of this.shooters) {
      const a = Math.min(1, sh.life / sh.maxLife);
      const len = sh.meteor ? 90 : 60;
      const nx = sh.vx, ny = sh.vy;
      const mag = Math.hypot(nx, ny) || 1;
      const tx = sh.x - nx / mag * len, ty = sh.y - ny / mag * len;
      const grad = ctx2.createLinearGradient(sh.x, sh.y, tx, ty);
      if (sh.meteor) {
        grad.addColorStop(0, `rgba(255,225,150,${a})`);
        grad.addColorStop(0.4, `rgba(255,130,60,${a * 0.8})`);
        grad.addColorStop(1, "rgba(255,90,40,0)");
        ctx2.lineWidth = 3.2;
      } else {
        grad.addColorStop(0, `rgba(255,255,255,${a})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx2.lineWidth = 2;
      }
      ctx2.strokeStyle = grad;
      ctx2.beginPath();
      ctx2.moveTo(sh.x, sh.y);
      ctx2.lineTo(tx, ty);
      ctx2.stroke();
      if (sh.meteor) {
        ctx2.save();
        ctx2.globalCompositeOperation = "lighter";
        const hg = ctx2.createRadialGradient(sh.x, sh.y, 0, sh.x, sh.y, 6);
        hg.addColorStop(0, `rgba(255,235,180,${a})`);
        hg.addColorStop(1, "rgba(255,140,60,0)");
        ctx2.fillStyle = hg;
        ctx2.beginPath();
        ctx2.arc(sh.x, sh.y, 6, 0, Math.PI * 2);
        ctx2.fill();
        ctx2.restore();
      }
    }
    if (this.eventTheme && this.eventAlpha > 0.01) {
      const th = this.eventTheme;
      ctx2.save();
      ctx2.globalAlpha = this.eventAlpha * 0.5;
      const g2 = ctx2.createLinearGradient(0, 0, 0, this.h);
      g2.addColorStop(0, th.top);
      g2.addColorStop(1, th.bottom);
      ctx2.fillStyle = g2;
      ctx2.fillRect(0, 0, this.w, this.h);
      ctx2.globalCompositeOperation = "lighter";
      ctx2.globalAlpha = this.eventAlpha * 0.25;
      const ag = ctx2.createRadialGradient(this.w / 2, 0, 0, this.w / 2, 0, this.h * 0.8);
      ag.addColorStop(0, th.accent || "#ffffff");
      ag.addColorStop(1, "rgba(0,0,0,0)");
      ctx2.fillStyle = ag;
      ctx2.fillRect(0, 0, this.w, this.h);
      ctx2.restore();
    }
  }
};
