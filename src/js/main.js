/* ==========================================================================
   main.js — Entry point: canvas setup, input, the game loop and boot sequence.

   Loaded as a classic script from index.html; every top-level binding here is
   shared with the other modules. Load order matters — see index.html.
   ========================================================================== */
var canvas = document.getElementById("game");
var ctx = canvas.getContext("2d");
var W = 0;
var H = 0;
var DPR = 1;
var bg = new Background();
var world = new WorldRenderer();
var particles = new Particles();
var game;
var ui;
var pointer = { x: -999, y: -999 };
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * DPR;
  canvas.height = H * DPR;
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  bg.resize(W, H);
  world.layout(W, H);
}
window.addEventListener("resize", resize);
on("mined", ({ slot, ore, amount }) => {
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
on("sold", ({ value }) => {
  if (value <= 0) return;
  particles.floatText(world.cx, world.cy - world.R * 1.15, "+\u20A1" + formatShort(value), "#ffd54a", { size: 22 });
  particles.ring(world.cx, world.cy, "#ffd54a", { maxR: world.R * 1.4, life: 0.6 });
});
function handleEvent(evt) {
  if (evt.type === "start") {
    bg.setEvent(evt.event.theme);
    audio.boost();
    ui.onEventStart(evt.event);
  } else if (evt.type === "end") {
    bg.clearEvent();
    ui.onEventEnd(evt.event, evt.gems);
  }
}
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
        ui.openPicker(i);
      }
      return true;
    }
  }
  return false;
}
canvas.addEventListener("pointerdown", (e) => {
  const x = e.clientX, y = e.clientY;
  pointer.x = x;
  pointer.y = y;
  handleTap(x, y);
});
canvas.addEventListener("pointermove", (e) => {
  pointer.x = e.clientX;
  pointer.y = e.clientY;
});
canvas.addEventListener("pointerleave", () => {
  pointer.x = -999;
  pointer.y = -999;
});
var last = performance.now();
var saveTimer = 0;
var uiTimer = 0;
function loop(now) {
  let dt = (now - last) / 1e3;
  last = now;
  if (dt > 0.1) dt = 0.1;
  const px = pointer.x > -900 ? pointer.x / W - 0.5 : 0;
  const py = pointer.y > -900 ? pointer.y / H - 0.5 : 0;
  bg.update(dt, px, py);
  world.update(dt);
  world.setTier(game.state.planetTier);
  const mined = game.tick(dt);
  particles.update(dt);
  if (mined) {
    ui.updateCargo();
  }
  ctx.clearRect(0, 0, W, H);
  bg.draw(ctx);
  world.drawPlanet(ctx);
  const total = game.slotCount;
  let hoveredIdx = -1;
  for (let i = 0; i < total; i++) {
    const pos = world.slotPos(i, total);
    if (Math.hypot(pointer.x - pos.x, pointer.y - pos.y) <= world.R * 0.34) {
      hoveredIdx = i;
      break;
    }
  }
  const t = now / 1e3;
  for (let i = 0; i < total; i++) {
    world.drawSlot(ctx, game.state.slots[i], total, t, i === hoveredIdx);
  }
  particles.draw(ctx);
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
  saveTimer += dt;
  if (saveTimer > 12) {
    saveTimer = 0;
    save();
  }
  requestAnimationFrame(loop);
}
async function save() {
  game.touch();
  await platform.save(game.state);
}
window.addEventListener("visibilitychange", () => {
  if (document.hidden) save();
});
window.addEventListener("pagehide", save);
async function boot() {
  await platform.init();
  preloadArt([...Object.values(DRONE_ART), ...Object.values(PLANET_ART)]);
  let saved = null;
  try {
    saved = await platform.load();
  } catch (e) {
  }
  const state = saved ? migrate(saved) : createDefaultState();
  game = new Game(state);
  window.__game = game;
  window.__cheat = () => {
    game.state.money += 1e7;
    game.state.gems += 500;
    ui && ui.updateMoney();
  };
  window.__forceEvent = (id = "meteor") => {
    const ev = EVENT_BY_ID[id];
    if (!ev) return;
    game.state.event = { id, until: Date.now() + ev.duration * 1e3 };
    handleEvent({ type: "start", event: ev });
  };
  resize();
  world.setTier(game.state.planetTier);
  ui = new UI(game, particles, platform);
  ui.onPlanetChange = (tier) => {
    world.setTier(tier);
  };
  window.__ui = window.ui = ui;
  if (game.eventActive()) {
    bg.setEvent(game.currentEvent().theme);
    ui.updateEventBanner();
  }
  on("money", () => ui.updateMoney());
  on("gems", () => ui.updateMoney());
  on("boost", () => ui.updateBoostTimer());
  on("achievement", (a) => ui.onAchievement(a));
  on("dex", (p) => ui.onDex(p));
  on("slots", () => {
  });
  const kick = () => {
    audio.resume();
    window.removeEventListener("pointerdown", kick);
  };
  window.addEventListener("pointerdown", kick);
  setTimeout(() => game.evaluateAchievements(), 500);
  const off = game.applyOffline();
  if (off) {
    ui.updateMoney();
    ui.updateCargo();
    ui.showOffline(off);
  }
  const loader = document.getElementById("loader");
  loader.classList.add("hide");
  setTimeout(() => loader.remove(), 600);
  platform.gameReady();
  platform.gameplayStart();
  last = performance.now();
  requestAnimationFrame(loop);
}
function migrate(saved) {
  const def = createDefaultState();
  const merged = { ...def, ...saved };
  merged.upgrades = { ...def.upgrades, ...saved.upgrades || {} };
  merged.stats = { ...def.stats, ...saved.stats || {} };
  merged.achievements = { ...saved.achievements || {} };
  merged.daily = { ...def.daily, ...saved.daily || {} };
  merged.boost = { ...def.boost, ...saved.boost || {} };
  merged.settings = { ...def.settings, ...saved.settings || {} };
  merged.dex = { ...saved.dex || {} };
  merged.dexSets = { ...saved.dexSets || {} };
  if (!Array.isArray(merged.slots) || merged.slots.length === 0) merged.slots = def.slots;
  if (!Array.isArray(merged.inventory)) merged.inventory = [];
  for (const s of merged.slots) if (s && s.droneId) merged.dex[s.droneId] = true;
  for (const it of merged.inventory) if (it && it.droneId) merged.dex[it.droneId] = true;
  return merged;
}
boot().catch((err) => {
  var _a;
  console.error("Boot failed", err);
  game = new Game(createDefaultState());
  resize();
  world.setTier(0);
  ui = new UI(game, particles, platform);
  ui.onPlanetChange = (tier) => world.setTier(tier);
  (_a = document.getElementById("loader")) == null ? void 0 : _a.remove();
  last = performance.now();
  requestAnimationFrame(loop);
});
