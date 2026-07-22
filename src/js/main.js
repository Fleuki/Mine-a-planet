// ============================================================================
//  Bootstrap + main loop. Wires SDK, save/load, rendering, input.
// ============================================================================
import { platform } from './sdk.js';
import { Game, createDefaultState, on } from './state.js';
import { Background } from './background.js';
import { WorldRenderer } from './render.js';
import { Particles } from './particles.js';
import { UI } from './ui.js';
import { audio } from './audio.js';
import { RARITIES, formatShort, EVENT_BY_ID } from './config.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let W = 0, H = 0, DPR = 1;
const bg = new Background();
const world = new WorldRenderer();
const particles = new Particles();

let game, ui;
let pointer = { x: -999, y: -999 };

// --- Resize -----------------------------------------------------------------
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W * DPR; canvas.height = H * DPR;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  bg.resize(W, H);
  world.layout(W, H);
}
window.addEventListener('resize', resize);

// --- Mining feedback --------------------------------------------------------
on('mined', ({ slot, ore, amount }) => {
  const total = game.slotCount;
  const pos = world.slotPos(slot.index, total);
  const toCenter = Math.atan2(world.cy - pos.y, world.cx - pos.x);
  world.addImpact(toCenter, ore.shine);
  const sx = world.cx - Math.cos(toCenter) * world.R * 0.95;
  const sy = world.cy - Math.sin(toCenter) * world.R * 0.95;
  particles.burst(sx, sy, ore.color, 5, { speed: 70, life: 0.5, size: 2.5, gravity: 90 });
  particles.burst(sx, sy, ore.shine, 3, { speed: 40, life: 0.4, size: 2 });
  audio.mine();
});

on('sold', ({ value }) => {
  if (value <= 0) return;
  particles.floatText(world.cx, world.cy - world.R * 1.15, '+' + '₡' + formatShort(value), '#ffd54a', { size: 22 });
  particles.ring(world.cx, world.cy, '#ffd54a', { maxR: world.R * 1.4, life: 0.6 });
});

// --- Cosmic events ----------------------------------------------------------
function handleEvent(evt) {
  if (evt.type === 'start') {
    bg.setEvent(evt.event.theme);
    audio.boost();
    ui.onEventStart(evt.event);
  } else if (evt.type === 'end') {
    bg.clearEvent();
    ui.onEventEnd(evt.event, evt.gems);
  }
}

// --- Input: tap drones/slots on the planet ring -----------------------------
function handleTap(x, y) {
  const total = game.slotCount;
  for (let i = 0; i < total; i++) {
    const pos = world.slotPos(i, total);
    const padR = world.R * 0.34;
    if (Math.hypot(x - pos.x, y - pos.y) <= padR) {
      const slot = game.state.slots[i];
      if (slot.droneId) {
        ui.openManageSlot(i);
      } else {
        // Let the player choose which drone fills this dock.
        ui.openPicker(i);
      }
      return true;
    }
  }
  return false;
}

canvas.addEventListener('pointerdown', (e) => {
  const x = e.clientX, y = e.clientY;
  pointer.x = x; pointer.y = y;
  handleTap(x, y);
});
canvas.addEventListener('pointermove', (e) => {
  // track for parallax + hover only when not touching
  pointer.x = e.clientX; pointer.y = e.clientY;
});
canvas.addEventListener('pointerleave', () => { pointer.x = -999; pointer.y = -999; });

// --- Main loop --------------------------------------------------------------
let last = performance.now();
let saveTimer = 0;
let uiTimer = 0;
function loop(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.1) dt = 0.1;               // clamp after tab switch

  // parallax factor from pointer
  const px = pointer.x > -900 ? (pointer.x / W - 0.5) : 0;
  const py = pointer.y > -900 ? (pointer.y / H - 0.5) : 0;

  bg.update(dt, px, py);
  world.update(dt);
  world.setTier(game.state.planetTier);
  const mined = game.tick(dt);
  particles.update(dt);

  // update HUD reactively (cheap; cargo/money change every frame while mining)
  if (mined) { ui.updateCargo(); }

  // --- draw ---
  ctx.clearRect(0, 0, W, H);
  bg.draw(ctx);
  world.drawPlanet(ctx);

  // hovered slot highlight
  const total = game.slotCount;
  let hoveredIdx = -1;
  for (let i = 0; i < total; i++) {
    const pos = world.slotPos(i, total);
    if (Math.hypot(pointer.x - pos.x, pointer.y - pos.y) <= world.R * 0.34) { hoveredIdx = i; break; }
  }
  const t = now / 1000;
  for (let i = 0; i < total; i++) {
    world.drawSlot(ctx, game.state.slots[i], total, t, i === hoveredIdx);
  }

  particles.draw(ctx);

  // periodic UI heartbeat (boost timer, events, badges, achievements)
  uiTimer += dt;
  if (uiTimer > 1) {
    uiTimer = 0;
    if (ui) {
      const evt = game.updateEvents();
      if (evt) handleEvent(evt);
      ui.updateBoostTimer();
      ui.updateEventBanner();
      ui.updateBadges();
      game.evaluateAchievements();
    }
  }

  // periodic autosave
  saveTimer += dt;
  if (saveTimer > 12) { saveTimer = 0; save(); }

  requestAnimationFrame(loop);
}

// --- Save / load ------------------------------------------------------------
async function save() {
  game.touch();
  await platform.save(game.state);
}
window.addEventListener('visibilitychange', () => {
  if (document.hidden) save();
});
window.addEventListener('pagehide', save);

// --- Boot -------------------------------------------------------------------
async function boot() {
  await platform.init();

  let saved = null;
  try { saved = await platform.load(); } catch (e) {}
  const state = saved ? migrate(saved) : createDefaultState();
  game = new Game(state);
  // Debug hook (harmless in production; handy for tuning).
  window.__game = game;
  window.__cheat = () => { game.state.money += 1e7; game.state.gems += 500; ui && ui.updateMoney(); };
  window.__forceEvent = (id = 'meteor') => {
    const ev = EVENT_BY_ID[id]; if (!ev) return;
    game.state.event = { id, until: Date.now() + ev.duration * 1000 };
    handleEvent({ type: 'start', event: ev });
  };

  resize();
  world.setTier(game.state.planetTier);
  ui = new UI(game, particles, platform);
  ui.onPlanetChange = (tier) => { world.setTier(tier); };
  window.__ui = window.ui = ui;      // debug/test hook

  // Restore an in-progress event's sky theme after a reload.
  if (game.eventActive()) { bg.setEvent(game.currentEvent().theme); ui.updateEventBanner(); }

  // hook money/upgrade/planet events to refresh HUD
  on('money', () => ui.updateMoney());
  on('gems', () => ui.updateMoney());
  on('boost', () => ui.updateBoostTimer());
  on('achievement', (a) => ui.onAchievement(a));
  on('dex', (p) => ui.onDex(p));
  on('slots', () => { /* handled inline */ });

  // Resume audio on first user gesture (browser autoplay policy).
  const kick = () => { audio.resume(); window.removeEventListener('pointerdown', kick); };
  window.addEventListener('pointerdown', kick);

  // Evaluate achievements shortly after load (offline progress may unlock some).
  setTimeout(() => game.evaluateAchievements(), 500);

  // offline earnings
  const off = game.applyOffline();
  if (off) { ui.updateMoney(); ui.updateCargo(); ui.showOffline(off); }

  // hide loader
  const loader = document.getElementById('loader');
  loader.classList.add('hide');
  setTimeout(() => loader.remove(), 600);

  platform.gameReady();
  platform.gameplayStart();

  last = performance.now();
  requestAnimationFrame(loop);
}

// Merge saved state with any newly-added default fields (forward-compat).
function migrate(saved) {
  const def = createDefaultState();
  const merged = { ...def, ...saved };
  merged.upgrades = { ...def.upgrades, ...(saved.upgrades || {}) };
  merged.stats = { ...def.stats, ...(saved.stats || {}) };
  merged.achievements = { ...(saved.achievements || {}) };
  merged.daily = { ...def.daily, ...(saved.daily || {}) };
  merged.boost = { ...def.boost, ...(saved.boost || {}) };
  merged.settings = { ...def.settings, ...(saved.settings || {}) };
  merged.dex = { ...(saved.dex || {}) };
  merged.dexSets = { ...(saved.dexSets || {}) };
  if (!Array.isArray(merged.slots) || merged.slots.length === 0) merged.slots = def.slots;
  if (!Array.isArray(merged.inventory)) merged.inventory = [];
  // Seed the index from drones the player already owns (pre-index saves).
  for (const s of merged.slots) if (s && s.droneId) merged.dex[s.droneId] = true;
  for (const it of merged.inventory) if (it && it.droneId) merged.dex[it.droneId] = true;
  return merged;
}

boot().catch(err => {
  console.error('Boot failed', err);
  // Fail-safe: start a fresh game so the player is never stuck on the loader.
  game = new Game(createDefaultState());
  resize();
  world.setTier(0);
  ui = new UI(game, particles, platform);
  ui.onPlanetChange = (tier) => world.setTier(tier);
  document.getElementById('loader')?.remove();
  last = performance.now();
  requestAnimationFrame(loop);
});
