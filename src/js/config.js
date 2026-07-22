// ============================================================================
//  Mine a Planet — game configuration & balance data
//  All tunable numbers live here so the design can be balanced in one place.
// ============================================================================

// --- Rarities ---------------------------------------------------------------
// Order matters (index used for comparisons / sorting).
export const RARITIES = {
  common:    { id: 'common',    name: 'Обычный',      color: '#9fb3c8', glow: '#c4d3e0', weight: 1000, order: 0 },
  uncommon:  { id: 'uncommon',  name: 'Необычный',    color: '#4ade80', glow: '#86efac', weight: 420,  order: 1 },
  rare:      { id: 'rare',      name: 'Редкий',       color: '#38bdf8', glow: '#7dd3fc', weight: 150,  order: 2 },
  epic:      { id: 'epic',      name: 'Эпический',    color: '#c084fc', glow: '#e9d5ff', weight: 44,   order: 3 },
  legendary: { id: 'legendary', name: 'Легендарный',  color: '#fbbf24', glow: '#fde68a', weight: 9,    order: 4 },
  mythic:    { id: 'mythic',    name: 'Мифический',    color: '#fb7185', glow: '#fecdd3', weight: 1.4,  order: 5 },
};

export const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];

// --- Ores -------------------------------------------------------------------
// tier = which planet level starts producing this ore. value = base sell price.
export const ORES = [
  { id: 'dust',      name: 'Пыль',       tier: 0,  value: 1,      color: '#8a8f9c', shine: '#c3c8d4' },
  { id: 'copper',    name: 'Медь',       tier: 0,  value: 4,      color: '#d98a4b', shine: '#f4b184' },
  { id: 'iron',      name: 'Железо',     tier: 1,  value: 11,     color: '#a7b0bd', shine: '#dfe6ef' },
  { id: 'silver',    name: 'Серебро',    tier: 1,  value: 28,     color: '#c8d4e0', shine: '#ffffff' },
  { id: 'gold',      name: 'Золото',     tier: 2,  value: 72,     color: '#f4c542', shine: '#fff3b0' },
  { id: 'amethyst',  name: 'Аметист',    tier: 3,  value: 190,    color: '#a855f7', shine: '#e9d5ff' },
  { id: 'emerald',   name: 'Изумруд',    tier: 4,  value: 480,    color: '#22c55e', shine: '#bbf7d0' },
  { id: 'sapphire',  name: 'Сапфир',     tier: 5,  value: 1250,   color: '#3b82f6', shine: '#bfdbfe' },
  { id: 'ruby',      name: 'Рубин',      tier: 6,  value: 3200,   color: '#ef4444', shine: '#fecaca' },
  { id: 'diamond',   name: 'Алмаз',      tier: 7,  value: 8600,   color: '#67e8f9', shine: '#ffffff' },
  { id: 'plasma',    name: 'Плазма',     tier: 8,  value: 24000,  color: '#e879f9', shine: '#fbcfe8' },
  { id: 'voidstone', name: 'Пустокамень',tier: 9,  value: 68000,  color: '#7c3aed', shine: '#c4b5fd' },
];

// --- Planet tiers -----------------------------------------------------------
// Each tier restyles the planet and raises the global ore-value multiplier.
export const PLANETS = [
  { name: 'Пустошь',    core: '#5b6472', land: '#7c8797', accent: '#9aa6b6', atmos: '#8fa5c0', valueMult: 1 },
  { name: 'Рудник',     core: '#6b5644', land: '#8a6f52', accent: '#b98c5a', atmos: '#c9a06a', valueMult: 1.8 },
  { name: 'Тундра',     core: '#3f5b63', land: '#5b8894', accent: '#8fd0d8', atmos: '#a7e8f0', valueMult: 3.2 },
  { name: 'Джунгли',    core: '#2f5233', land: '#3f7a45', accent: '#6fce68', atmos: '#9dffa0', valueMult: 5.6 },
  { name: 'Лазурит',    core: '#243a6b', land: '#3556a8', accent: '#5f8fff', atmos: '#8fb4ff', valueMult: 9.8 },
  { name: 'Магма',      core: '#5b1e1e', land: '#a83535', accent: '#ff6b3d', atmos: '#ff9d5c', valueMult: 17 },
  { name: 'Кристалл',   core: '#4a2f6b', land: '#7b4fb0', accent: '#c98fff', atmos: '#e0b0ff', valueMult: 30 },
  { name: 'Пепел',      core: '#2b2b30', land: '#4a4a52', accent: '#8a8a96', atmos: '#c0c0cc', valueMult: 52 },
  { name: 'Неон',       core: '#0f3b3b', land: '#0f8a7a', accent: '#2affd5', atmos: '#7fffe8', valueMult: 92 },
  { name: 'Пустота',    core: '#1a0f2e', land: '#3d1f6b', accent: '#a855f7', atmos: '#d8b4fe', valueMult: 160 },
];

// --- Drones -----------------------------------------------------------------
// power = ore units mined per cycle. interval = seconds per cycle.
// Effective ore/sec = power / interval, scaled by global mining-speed upgrade.
export const DRONES = [
  // Common
  { id: 'scout',    name: 'Скаут',        rarity: 'common',    power: 1,   interval: 1.6, shape: 'auger' },
  { id: 'pebble',   name: 'Галечник',     rarity: 'common',    power: 2,   interval: 1.5, shape: 'drill' },
  { id: 'rustbit',  name: 'Ржавый Бит',   rarity: 'common',    power: 3,   interval: 1.7, shape: 'auger' },
  // Uncommon
  { id: 'twin',     name: 'Твин-Авгер',   rarity: 'uncommon',  power: 6,   interval: 1.4, shape: 'twin' },
  { id: 'copperjaw',name: 'Медный Клык',  rarity: 'uncommon',  power: 9,   interval: 1.4, shape: 'drill' },
  { id: 'buzz',     name: 'Баззсоу',      rarity: 'uncommon',  power: 12,  interval: 1.2, shape: 'saw' },
  // Rare
  { id: 'quad',     name: 'Квад-Дрилл',   rarity: 'rare',      power: 22,  interval: 1.2, shape: 'quad' },
  { id: 'ionlance', name: 'Ион-Ланс',     rarity: 'rare',      power: 32,  interval: 1.1, shape: 'laser' },
  { id: 'ripper',   name: 'Риппер',       rarity: 'rare',      power: 44,  interval: 1.0, shape: 'saw' },
  // Epic
  { id: 'magma',    name: 'Магма-Бур',    rarity: 'epic',      power: 85,  interval: 1.0, shape: 'drill' },
  { id: 'plasmator',name: 'Плазматор',    rarity: 'epic',      power: 120, interval: 0.9, shape: 'laser' },
  { id: 'hexa',     name: 'Гекса-Корер',  rarity: 'epic',      power: 165, interval: 0.9, shape: 'quad' },
  // Legendary
  { id: 'nova',     name: 'Нова-Авгер',   rarity: 'legendary', power: 340, interval: 0.8, shape: 'twin' },
  { id: 'singular', name: 'Сингулярность',rarity: 'legendary', power: 520, interval: 0.75,shape: 'laser' },
  // Mythic
  { id: 'quantum',  name: 'Квант-Жнец',   rarity: 'mythic',    power: 1300,interval: 0.7, shape: 'quad' },
  { id: 'devourer', name: 'Пожиратель',   rarity: 'mythic',    power: 2100,interval: 0.65,shape: 'laser' },
];

export const DRONE_BY_ID = Object.fromEntries(DRONES.map(d => [d.id, d]));
export const DRONES_BY_RARITY = RARITY_ORDER.reduce((acc, r) => {
  acc[r] = DRONES.filter(d => d.rarity === r);
  return acc;
}, {});

// --- Roulette ---------------------------------------------------------------
export const ROULETTE = {
  baseCost: 50,          // cost of one spin
  costGrowth: 1.09,      // cost multiplied per spin owned-drone count milestone
  // luck shifts probability mass toward higher rarities. Each luck level adds
  // a small multiplier to the weight of every rarity above common.
  luckPerLevel: 0.14,
};

// --- Upgrade definitions ----------------------------------------------------
// cost(level) returns the price to go from `level` -> `level+1`.
// effect is applied in state logic; described here for the UI.
export const UPGRADES = {
  miningSpeed: {
    id: 'miningSpeed', name: 'Скорость бурения', icon: 'speed',
    desc: 'Все дроны бурят быстрее',
    max: 40,
    cost: (lv) => Math.floor(30 * Math.pow(1.35, lv)),
    value: (lv) => 1 + lv * 0.15,          // multiplier
    format: (lv) => `x${(1 + lv * 0.15).toFixed(2)}`,
    branch: 'mining',
  },
  oreValue: {
    id: 'oreValue', name: 'Ценность руды', icon: 'gem',
    desc: 'Руда продаётся дороже',
    max: 40,
    cost: (lv) => Math.floor(45 * Math.pow(1.38, lv)),
    value: (lv) => 1 + lv * 0.12,
    format: (lv) => `x${(1 + lv * 0.12).toFixed(2)}`,
    branch: 'mining',
  },
  storage: {
    id: 'storage', name: 'Хранилище', icon: 'crate',
    desc: 'Больше руды помещается в трюм',
    max: 30,
    cost: (lv) => Math.floor(40 * Math.pow(1.4, lv)),
    value: (lv) => 200 * Math.pow(1.55, lv), // capacity in ore units
    format: (lv) => `${formatShort(200 * Math.pow(1.55, lv))}`,
    branch: 'logistics',
  },
  docks: {
    id: 'docks', name: 'Доки', icon: 'dock',
    desc: 'Больше слотов для дронов',
    max: 11,                                 // 5 -> 16 slots
    cost: (lv) => Math.floor(500 * Math.pow(1.7, lv)),
    value: (lv) => 5 + lv,                    // total slots
    format: (lv) => `${5 + lv} слотов`,
    branch: 'logistics',
  },
  luck: {
    id: 'luck', name: 'Удача', icon: 'clover',
    desc: 'Выше шанс редких дронов в рулетке',
    max: 30,
    cost: (lv) => Math.floor(120 * Math.pow(1.42, lv)),
    value: (lv) => lv,
    format: (lv) => `+${(lv * ROULETTE.luckPerLevel * 100).toFixed(0)}%`,
    branch: 'fortune',
  },
  rolls: {
    id: 'rolls', name: 'Мульти-ролл', icon: 'dice',
    desc: 'Дронов за один спин рулетки',
    max: 4,                                   // 1 -> 5 rolls
    cost: (lv) => Math.floor(2500 * Math.pow(2.6, lv)),
    value: (lv) => 1 + lv,
    format: (lv) => `${1 + lv}x`,
    branch: 'fortune',
  },
  autosell: {
    id: 'autosell', name: 'Авто-продажа', icon: 'auto',
    desc: 'Трюм продаётся сам, всё быстрее',
    max: 20,
    cost: (lv) => lv === 0 ? 1500 : Math.floor(300 * Math.pow(1.45, lv)),
    value: (lv) => lv,                        // 0 = locked, >=1 sell interval shrinks
    format: (lv) => lv === 0 ? 'Выкл' : `${(Math.max(0.4, 6 - lv * 0.6)).toFixed(1)}с`,
    branch: 'logistics',
  },
  offline: {
    id: 'offline', name: 'Оффлайн-добыча', icon: 'moon',
    desc: 'Дроны работают, пока вы вне игры',
    max: 10,
    cost: (lv) => lv === 0 ? 5000 : Math.floor(1200 * Math.pow(1.5, lv)),
    value: (lv) => Math.min(0.9, lv * 0.09),  // efficiency 0..0.9
    format: (lv) => `${Math.round(Math.min(0.9, lv * 0.09) * 100)}%`,
    branch: 'fortune',
  },
};

export const UPGRADE_BRANCHES = {
  mining:    { name: 'Добыча',    color: '#fb923c' },
  logistics: { name: 'Логистика', color: '#38bdf8' },
  fortune:   { name: 'Удача',     color: '#a855f7' },
};

// --- Planet upgrade cost ----------------------------------------------------
export function planetUpgradeCost(tier) {
  return Math.floor(1000 * Math.pow(6.5, tier));
}

// --- Number formatting ------------------------------------------------------
const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];
export function formatShort(n) {
  if (n < 1000) return Math.floor(n).toString();
  const tier = Math.min(SUFFIXES.length - 1, Math.floor(Math.log10(n) / 3));
  const scaled = n / Math.pow(1000, tier);
  const str = scaled >= 100 ? scaled.toFixed(0) : scaled >= 10 ? scaled.toFixed(1) : scaled.toFixed(2);
  return str.replace(/\.?0+$/, '') + SUFFIXES[tier];
}
