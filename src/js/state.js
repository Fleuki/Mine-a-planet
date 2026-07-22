// ============================================================================
//  Game state + economy logic. Pure-ish: mutates `state` and emits events.
// ============================================================================
import {
  ORES, DRONES, DRONE_BY_ID, DRONES_BY_RARITY, RARITIES, RARITY_ORDER,
  PLANETS, UPGRADES, ROULETTE, planetUpgradeCost,
  BOOST, ACHIEVEMENTS, DAILY_REWARDS, FUSION, GEM_SHOP,
} from './config.js';

let _uid = 1;
const uid = () => _uid++;

export function createDefaultState() {
  return {
    version: 1,
    money: 50,
    gems: 0,                     // premium-ish currency from ad rewards
    planetTier: 0,
    ore: 0,                      // total ore units in cargo
    oreValueAccum: 0,            // accumulated sell value of ore in cargo
    slots: makeSlots(5),         // drone dock slots
    inventory: [],               // drones owned but not placed: [{uid, droneId}]
    upgrades: Object.fromEntries(Object.keys(UPGRADES).map(k => [k, 0])),
    autosellUnlocked: false,
    spins: 0,
    stats: { totalEarned: 0, totalSpins: 0, bestRarity: 'common', dronesPlaced: 0, totalFused: 0 },
    achievements: {},                 // id -> true
    daily: { lastClaimDay: null, streak: 0 },
    boost: { until: 0 },              // ms timestamp
    settings: { sound: true, music: true },
    lastSeen: Date.now(),
    createdAt: Date.now(),
  };
}

function makeSlots(n) {
  return Array.from({ length: n }, (_, i) => ({ index: i, droneId: null, uid: null, progress: 0 }));
}

// --- Event bus --------------------------------------------------------------
const listeners = {};
export function on(evt, fn) { (listeners[evt] ||= []).push(fn); }
export function emit(evt, payload) { (listeners[evt] || []).forEach(fn => fn(payload)); }

// ============================================================================
//  Game class
// ============================================================================
export class Game {
  constructor(state) {
    this.state = state || createDefaultState();
    this._migrateSlots();
    this._autosellTimer = 0;
  }

  // Ensure the number of slots matches the docks upgrade.
  _migrateSlots() {
    const want = UPGRADES.docks.value(this.state.upgrades.docks);
    const s = this.state.slots;
    if (s.length < want) {
      for (let i = s.length; i < want; i++) s.push({ index: i, droneId: null, uid: null, progress: 0 });
    }
    s.forEach((slot, i) => slot.index = i);
  }

  // --- Derived getters ------------------------------------------------------
  get planet() { return PLANETS[this.state.planetTier]; }
  get miningSpeedMult() { return UPGRADES.miningSpeed.value(this.state.upgrades.miningSpeed); }
  get oreValueMult() { return UPGRADES.oreValue.value(this.state.upgrades.oreValue); }
  get storageCap() { return Math.floor(UPGRADES.storage.value(this.state.upgrades.storage)); }
  get luckLevel() { return this.state.upgrades.luck; }
  get rollCount() { return UPGRADES.rolls.value(this.state.upgrades.rolls); }
  get slotCount() { return UPGRADES.docks.value(this.state.upgrades.docks); }
  get planetValueMult() { return this.planet.valueMult; }

  // Ores available at the current planet tier (weighted toward the top tier).
  availableOres() {
    return ORES.filter(o => o.tier <= this.state.planetTier);
  }

  // Pick an ore for this planet: mostly the richest few tiers unlocked.
  rollOre() {
    const avail = this.availableOres();
    // Weight higher-tier ores more heavily so upgrading the planet feels good,
    // but keep some spread for visual variety.
    let total = 0;
    const weights = avail.map(o => {
      const dist = this.state.planetTier - o.tier;      // 0 = newest ore
      const w = Math.pow(0.45, dist) + 0.05;
      total += w;
      return w;
    });
    let r = Math.random() * total;
    for (let i = 0; i < avail.length; i++) {
      r -= weights[i];
      if (r <= 0) return avail[i];
    }
    return avail[avail.length - 1];
  }

  oreSellValue(ore) {
    return ore.value * this.oreValueMult * this.planetValueMult * this.incomeMult();
  }

  // --- Boost ----------------------------------------------------------------
  boostActive() { return Date.now() < (this.state.boost?.until || 0); }
  boostRemaining() { return Math.max(0, Math.floor(((this.state.boost?.until || 0) - Date.now()) / 1000)); }
  incomeMult() { return this.boostActive() ? BOOST.mult : 1; }
  activateBoost(seconds = BOOST.duration) {
    const now = Date.now();
    const base = Math.max(now, this.state.boost?.until || 0);
    this.state.boost.until = base + seconds * 1000;
    emit('boost');
  }

  // --- Simulation tick ------------------------------------------------------
  // dt in seconds. Advances drone mining, accrues ore, runs auto-sell.
  tick(dt) {
    const speed = this.miningSpeedMult;
    const cap = this.storageCap;
    let mined = null;

    for (const slot of this.state.slots) {
      if (!slot.droneId) continue;
      const drone = DRONE_BY_ID[slot.droneId];
      if (!drone) continue;
      slot.progress += (dt * speed) / drone.interval;
      while (slot.progress >= 1) {
        slot.progress -= 1;
        if (this.state.ore >= cap) { slot.progress = 1; break; } // cargo full
        const ore = this.rollOre();
        const amount = drone.power;
        const room = cap - this.state.ore;
        const add = Math.min(amount, room);
        this.state.ore += add;
        this.state.oreValueAccum += this.oreSellValue(ore) * add;
        mined = { slot, ore, amount: add, drone };
        emit('mined', mined);
      }
    }

    // Auto-sell
    if (this.state.autosellUnlocked && this.state.upgrades.autosell > 0) {
      const interval = Math.max(0.4, 6 - this.state.upgrades.autosell * 0.6);
      this._autosellTimer += dt;
      if (this._autosellTimer >= interval && this.state.ore > 0) {
        this._autosellTimer = 0;
        this.sellAll(true);
      }
    }
    return mined;
  }

  // --- Selling --------------------------------------------------------------
  sellAll(auto = false) {
    if (this.state.ore <= 0) return 0;
    const value = Math.floor(this.state.oreValueAccum);
    this.state.money += value;
    this.state.stats.totalEarned += value;
    const soldOre = this.state.ore;
    this.state.ore = 0;
    this.state.oreValueAccum = 0;
    emit('sold', { value, ore: soldOre, auto });
    emit('money', this.state.money);
    return value;
  }

  // --- Roulette -------------------------------------------------------------
  spinCost() {
    const owned = this.state.inventory.length + this.state.slots.filter(s => s.droneId).length;
    return Math.floor(ROULETTE.baseCost * Math.pow(ROULETTE.costGrowth, Math.min(owned, 120)));
  }

  canSpin() { return this.state.money >= this.spinCost(); }

  // Returns array of drones rolled (rollCount of them), or null if can't afford.
  spin() {
    const cost = this.spinCost();
    if (this.state.money < cost) return null;
    this.state.money -= cost;
    emit('money', this.state.money);
    this.state.spins++;
    this.state.stats.totalSpins++;

    const results = [];
    for (let i = 0; i < this.rollCount; i++) {
      results.push(this._rollOneDrone());
    }
    // Track best rarity.
    for (const d of results) {
      if (RARITIES[d.rarity].order > RARITIES[this.state.stats.bestRarity].order) {
        this.state.stats.bestRarity = d.rarity;
      }
    }
    return results;
  }

  _rollOneDrone() {
    const luck = 1 + this.luckLevel * ROULETTE.luckPerLevel;
    // Build weighted rarity table; luck multiplies weights of rarer tiers.
    let total = 0;
    const table = RARITY_ORDER.map(rid => {
      const base = RARITIES[rid].weight;
      const boost = RARITIES[rid].order === 0 ? 1 : Math.pow(luck, RARITIES[rid].order);
      const w = base * boost;
      total += w;
      return { rid, w };
    });
    let r = Math.random() * total;
    let chosen = 'common';
    for (const t of table) { r -= t.w; if (r <= 0) { chosen = t.rid; break; } }
    const pool = DRONES_BY_RARITY[chosen];
    const drone = pool[Math.floor(Math.random() * pool.length)];
    return drone;
  }

  addDroneToInventory(droneId) {
    this.state.inventory.push({ uid: uid(), droneId });
  }

  // Guaranteed Epic-or-better drone, paid with gems.
  luckySpin() {
    if (this.state.gems < GEM_SHOP.luckySpinCost) return null;
    this.state.gems -= GEM_SHOP.luckySpinCost;
    emit('gems', this.state.gems);
    this.state.stats.totalSpins++;
    // weight epic/legendary/mythic
    const tiers = ['epic', 'legendary', 'mythic'];
    const weights = [70, 25, 5];
    let total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total, chosen = 'epic';
    for (let i = 0; i < tiers.length; i++) { r -= weights[i]; if (r <= 0) { chosen = tiers[i]; break; } }
    const pool = DRONES_BY_RARITY[chosen];
    const drone = pool[Math.floor(Math.random() * pool.length)];
    if (RARITIES[drone.rarity].order > RARITIES[this.state.stats.bestRarity].order) {
      this.state.stats.bestRarity = drone.rarity;
    }
    return drone;
  }

  // --- Slot management ------------------------------------------------------
  placeDrone(invUid, slotIndex) {
    const invIdx = this.state.inventory.findIndex(d => d.uid === invUid);
    if (invIdx < 0) return false;
    const slot = this.state.slots[slotIndex];
    if (!slot || slot.droneId) return false;
    const inv = this.state.inventory[invIdx];
    slot.droneId = inv.droneId;
    slot.uid = inv.uid;
    slot.progress = 0;
    this.state.inventory.splice(invIdx, 1);
    this.state.stats.dronesPlaced++;
    emit('slots');
    return true;
  }

  // Auto-place a drone into the first free slot; returns slot index or -1.
  autoPlace(droneId, droneUid) {
    const slot = this.state.slots.find(s => !s.droneId);
    if (!slot) {
      this.state.inventory.push({ uid: droneUid ?? uid(), droneId });
      return -1;
    }
    slot.droneId = droneId;
    slot.uid = droneUid ?? uid();
    slot.progress = 0;
    this.state.stats.dronesPlaced++;
    emit('slots');
    return slot.index;
  }

  removeDrone(slotIndex) {
    const slot = this.state.slots[slotIndex];
    if (!slot || !slot.droneId) return false;
    this.state.inventory.push({ uid: slot.uid ?? uid(), droneId: slot.droneId });
    slot.droneId = null;
    slot.uid = null;
    slot.progress = 0;
    emit('slots');
    return true;
  }

  // Sells a drone from a slot for a fraction of an implied value.
  sellDrone(slotIndex) {
    const slot = this.state.slots[slotIndex];
    if (!slot || !slot.droneId) return 0;
    const drone = DRONE_BY_ID[slot.droneId];
    const value = Math.floor(this.droneScrapValue(drone));
    this.state.money += value;
    emit('money', this.state.money);
    slot.droneId = null; slot.uid = null; slot.progress = 0;
    emit('slots');
    return value;
  }

  droneScrapValue(drone) {
    return (drone.power / drone.interval) * 15 * (RARITIES[drone.rarity].order + 1);
  }

  // --- Upgrades -------------------------------------------------------------
  upgradeCost(key) {
    const def = UPGRADES[key];
    const lv = this.state.upgrades[key];
    if (lv >= def.max) return Infinity;
    return def.cost(lv);
  }

  canUpgrade(key) {
    return this.state.money >= this.upgradeCost(key);
  }

  buyUpgrade(key) {
    const cost = this.upgradeCost(key);
    if (!isFinite(cost) || this.state.money < cost) return false;
    this.state.money -= cost;
    this.state.upgrades[key]++;
    if (key === 'autosell') this.state.autosellUnlocked = true;
    if (key === 'docks') this._migrateSlots();
    emit('money', this.state.money);
    emit('upgrade', key);
    return true;
  }

  // --- Planet ---------------------------------------------------------------
  planetCost() {
    if (this.state.planetTier >= PLANETS.length - 1) return Infinity;
    return planetUpgradeCost(this.state.planetTier);
  }

  canUpgradePlanet() { return this.state.money >= this.planetCost(); }

  upgradePlanet() {
    const cost = this.planetCost();
    if (!isFinite(cost) || this.state.money < cost) return false;
    this.state.money -= cost;
    this.state.planetTier++;
    emit('money', this.state.money);
    emit('planet', this.state.planetTier);
    return true;
  }

  // --- Gems -----------------------------------------------------------------
  addGems(n) { this.state.gems += n; emit('gems', this.state.gems); }
  addMoney(n) { this.state.money += n; emit('money', this.state.money); }

  // --- Fusion (Fuse Machine) ------------------------------------------------
  // How many drones of each rarity are available to fuse (inventory only).
  fusionCounts() {
    const counts = {};
    for (const r of RARITY_ORDER) counts[r] = 0;
    for (const it of this.state.inventory) {
      const d = DRONE_BY_ID[it.droneId];
      if (d) counts[d.rarity]++;
    }
    return counts;
  }

  canFuse(rarity) {
    return this.fusionCounts()[rarity] >= FUSION.need;
  }

  // Fuse `need` drones of a rarity. Returns { result, gems } or null.
  fuse(rarity) {
    if (!this.canFuse(rarity)) return null;
    // consume the first `need` matching drones from inventory
    let removed = 0;
    for (let i = this.state.inventory.length - 1; i >= 0 && removed < FUSION.need; i--) {
      const d = DRONE_BY_ID[this.state.inventory[i].droneId];
      if (d && d.rarity === rarity) { this.state.inventory.splice(i, 1); removed++; }
    }
    this.state.stats.totalFused = (this.state.stats.totalFused || 0) + 1;

    const order = RARITIES[rarity].order;
    if (order >= RARITY_ORDER.length - 1) {
      // Mythic recycle -> gems
      this.addGems(FUSION.mythicGemReward);
      emit('fuse', { gems: FUSION.mythicGemReward });
      return { gems: FUSION.mythicGemReward };
    }
    const nextRarity = RARITY_ORDER[order + 1];
    const pool = DRONES_BY_RARITY[nextRarity];
    const result = pool[Math.floor(Math.random() * pool.length)];
    if (RARITIES[result.rarity].order > RARITIES[this.state.stats.bestRarity].order) {
      this.state.stats.bestRarity = result.rarity;
    }
    emit('fuse', { result });
    return { result };
  }

  // --- Achievements ---------------------------------------------------------
  // Evaluate all locked achievements; unlock newly-satisfied ones. Returns list.
  evaluateAchievements() {
    const newly = [];
    for (const a of ACHIEVEMENTS) {
      if (this.state.achievements[a.id]) continue;
      let ok = false;
      try { ok = a.check(this); } catch (e) { ok = false; }
      if (ok) {
        this.state.achievements[a.id] = true;
        if (a.reward?.money) this.state.money += a.reward.money;
        if (a.reward?.gems) this.state.gems += a.reward.gems;
        newly.push(a);
      }
    }
    if (newly.length) {
      emit('money', this.state.money);
      emit('gems', this.state.gems);
      for (const a of newly) emit('achievement', a);
    }
    return newly;
  }

  achievementProgress() {
    const total = ACHIEVEMENTS.length;
    const done = ACHIEVEMENTS.filter(a => this.state.achievements[a.id]).length;
    return { done, total };
  }

  // --- Daily rewards --------------------------------------------------------
  _todayKey() {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }
  _dayNumber(date = new Date()) {
    return Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 86400000);
  }

  dailyStatus() {
    const daily = this.state.daily || (this.state.daily = { lastClaimDay: null, streak: 0 });
    const today = this._todayKey();
    const canClaim = daily.lastClaimDay !== today;
    // What day index (1..7) would this claim be?
    let streak = daily.streak || 0;
    if (canClaim) {
      // continued streak only if last claim was yesterday
      const todayNum = this._dayNumber();
      const lastNum = daily.lastClaimDayNum ?? null;
      if (lastNum === todayNum - 1) streak = streak; // continue
      else streak = 0;                               // reset
    }
    const dayIndex = (streak % DAILY_REWARDS.length);
    return { canClaim, dayIndex, streak, rewards: DAILY_REWARDS };
  }

  claimDaily() {
    const st = this.dailyStatus();
    if (!st.canClaim) return null;
    const reward = DAILY_REWARDS[st.dayIndex];
    if (reward.money) this.state.money += reward.money;
    if (reward.gems) this.state.gems += reward.gems;
    if (reward.boost) this.activateBoost(BOOST.duration);
    const daily = this.state.daily;
    daily.streak = (st.streak || 0) + 1;
    daily.lastClaimDay = this._todayKey();
    daily.lastClaimDayNum = this._dayNumber();
    emit('money', this.state.money);
    emit('gems', this.state.gems);
    emit('daily');
    return { reward, day: st.dayIndex + 1 };
  }

  // --- Offline earnings -----------------------------------------------------
  // Called on load. Returns {seconds, earned} if meaningful.
  applyOffline() {
    const lv = this.state.upgrades.offline;
    const eff = UPGRADES.offline.value(lv);
    const now = Date.now();
    const elapsed = Math.max(0, (now - (this.state.lastSeen || now)) / 1000);
    this.state.lastSeen = now;
    if (eff <= 0 || elapsed < 30) return null;
    const capped = Math.min(elapsed, 8 * 3600); // max 8h
    // Estimate ore/sec across all placed drones.
    let orePerSec = 0;
    for (const slot of this.state.slots) {
      if (!slot.droneId) continue;
      const d = DRONE_BY_ID[slot.droneId];
      orePerSec += (d.power / d.interval) * this.miningSpeedMult;
    }
    if (orePerSec <= 0) return null;
    // Approx average ore value.
    const avail = this.availableOres();
    const avgVal = avail.reduce((s, o) => s + this.oreSellValue(o), 0) / avail.length;
    const earned = Math.floor(orePerSec * capped * avgVal * eff * 0.5);
    if (earned <= 0) return null;
    this.state.money += earned;
    this.state.stats.totalEarned += earned;
    emit('money', this.state.money);
    return { seconds: capped, earned };
  }

  touch() { this.state.lastSeen = Date.now(); }
}
