// ============================================================================
//  Mine a Planet — game configuration & balance data
//  All tunable numbers live here so the design can be balanced in one place.
// ============================================================================

// --- Rarities ---------------------------------------------------------------
// Order matters (index used for comparisons / sorting).
export const RARITIES = {
  common:    { id: 'common',    name: 'Обычный',      color: '#9fb3c8', glow: '#c4d3e0', weight: 1000,  order: 0 },
  uncommon:  { id: 'uncommon',  name: 'Необычный',    color: '#4ade80', glow: '#86efac', weight: 420,   order: 1 },
  rare:      { id: 'rare',      name: 'Редкий',       color: '#38bdf8', glow: '#7dd3fc', weight: 150,    order: 2 },
  epic:      { id: 'epic',      name: 'Эпический',    color: '#c084fc', glow: '#e9d5ff', weight: 44,     order: 3 },
  legendary: { id: 'legendary', name: 'Легендарный',  color: '#fbbf24', glow: '#fde68a', weight: 9,      order: 4 },
  mythic:    { id: 'mythic',    name: 'Мифический',    color: '#fb7185', glow: '#fecdd3', weight: 1.5,    order: 5 },
  ancient:   { id: 'ancient',   name: 'Древний',      color: '#ff8a3d', glow: '#ffd0a0', weight: 0.34,   order: 6 },
  celestial: { id: 'celestial', name: 'Небесный',     color: '#7df9ff', glow: '#e2ffff', weight: 0.055,  order: 7 },
};

export const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'ancient', 'celestial'];

// Luck raises the weight of rarer tiers. The exponent is capped so the two
// top tiers stay genuinely rare even at max luck — they get rarer only through
// their tiny base weight, not by being excluded from the luck bonus.
export const LUCK_MAX_EXPONENT = 4;

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
  { id: 'scout',    name: 'Скаут',        rarity: 'common',    power: 1,    interval: 1.6, shape: 'auger' },
  { id: 'pebble',   name: 'Галечник',     rarity: 'common',    power: 2,    interval: 1.5, shape: 'drill' },
  { id: 'rustbit',  name: 'Ржавый Бит',   rarity: 'common',    power: 3,    interval: 1.7, shape: 'auger' },
  { id: 'chipper',  name: 'Чиппер',       rarity: 'common',    power: 4,    interval: 1.6, shape: 'drill' },
  // Uncommon
  { id: 'twin',     name: 'Твин-Авгер',   rarity: 'uncommon',  power: 6,    interval: 1.4, shape: 'twin' },
  { id: 'copperjaw',name: 'Медный Клык',  rarity: 'uncommon',  power: 9,    interval: 1.4, shape: 'drill' },
  { id: 'buzz',     name: 'Баззсоу',      rarity: 'uncommon',  power: 12,   interval: 1.2, shape: 'saw' },
  { id: 'sander',   name: 'Шлифовщик',    rarity: 'uncommon',  power: 15,   interval: 1.3, shape: 'saw' },
  // Rare
  { id: 'quad',     name: 'Квад-Дрилл',   rarity: 'rare',      power: 22,   interval: 1.2, shape: 'quad' },
  { id: 'ionlance', name: 'Ион-Ланс',     rarity: 'rare',      power: 32,   interval: 1.1, shape: 'laser' },
  { id: 'ripper',   name: 'Риппер',       rarity: 'rare',      power: 44,   interval: 1.0, shape: 'saw' },
  { id: 'corebit',  name: 'Кор-Бит',      rarity: 'rare',      power: 55,   interval: 1.05,shape: 'drill' },
  // Epic
  { id: 'magma',    name: 'Магма-Бур',    rarity: 'epic',      power: 85,   interval: 1.0, shape: 'drill' },
  { id: 'plasmator',name: 'Плазматор',    rarity: 'epic',      power: 120,  interval: 0.9, shape: 'laser' },
  { id: 'hexa',     name: 'Гекса-Корер',  rarity: 'epic',      power: 165,  interval: 0.9, shape: 'quad' },
  { id: 'voidsaw',  name: 'Войд-Пила',    rarity: 'epic',      power: 210,  interval: 0.85,shape: 'saw' },
  // Legendary
  { id: 'nova',     name: 'Нова-Авгер',   rarity: 'legendary', power: 340,  interval: 0.8, shape: 'twin' },
  { id: 'singular', name: 'Сингулярность',rarity: 'legendary', power: 520,  interval: 0.75,shape: 'laser' },
  { id: 'titan',    name: 'Титан-Бур',    rarity: 'legendary', power: 700,  interval: 0.72,shape: 'quad' },
  { id: 'eclipse',  name: 'Эклипс',       rarity: 'legendary', power: 900,  interval: 0.7, shape: 'laser' },
  // Mythic
  { id: 'quantum',  name: 'Квант-Жнец',   rarity: 'mythic',    power: 1300, interval: 0.7, shape: 'quad' },
  { id: 'devourer', name: 'Пожиратель',   rarity: 'mythic',    power: 2100, interval: 0.65,shape: 'laser' },
  { id: 'omega',    name: 'Омега-Корер',  rarity: 'mythic',    power: 2900, interval: 0.6, shape: 'quad' },
  // Ancient
  { id: 'progenitor',name:'Прародитель',  rarity: 'ancient',   power: 4200, interval: 0.6, shape: 'laser' },
  { id: 'monolith', name: 'Монолит',      rarity: 'ancient',   power: 5600, interval: 0.55,shape: 'quad' },
  // Celestial
  { id: 'starforge',name: 'Звёздный Горн',rarity: 'celestial', power: 8500, interval: 0.5, shape: 'laser' },
  { id: 'celestia', name: 'Селестия',     rarity: 'celestial', power: 12000,interval: 0.5, shape: 'quad' },
];

export const ORE_BY_ID = Object.fromEntries(ORES.map(o => [o.id, o]));
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
    cost: (lv) => Math.floor(45 * Math.pow(1.36, lv)),
    value: (lv) => 1 + lv * 0.15,
    format: (lv) => `x${(1 + lv * 0.15).toFixed(2)}`,
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
  deploy: {
    id: 'deploy', name: 'Мульти-установка', icon: 'deploy',
    desc: 'Ставить несколько буров за одно нажатие',
    max: 5,                                   // 1 -> 6 at once
    cost: (lv) => Math.floor(800 * Math.pow(1.85, lv)),
    value: (lv) => 1 + lv,                    // drones placed per tap
    format: (lv) => `${1 + lv}× за раз`,
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

// --- Cosmic events ----------------------------------------------------------
// Timed incidents that recolour the sky and grant a temporary bonus.
// bonus keys: income (sell value ×), speed (mining ×), luck (roulette luck ×).
export const EVENTS = [
  {
    id: 'meteor', name: 'Метеоритный дождь', icon: '☄️', desc: 'Ценность руды ×2',
    bonus: { income: 2 }, duration: 75,
    theme: { top: '#2a0e10', bottom: '#0a0304', nebula: [[170, 55, 40], [130, 35, 45]], meteors: true, accent: '#ff6b3d' },
  },
  {
    id: 'flare', name: 'Солнечная вспышка', icon: '🌟', desc: 'Скорость бурения ×2',
    bonus: { speed: 2 }, duration: 60,
    theme: { top: '#2b2408', bottom: '#0c0a02', nebula: [[210, 150, 40], [230, 120, 30]], accent: '#ffcf4a' },
  },
  {
    id: 'anomaly', name: 'Космическая аномалия', icon: '🌀', desc: 'Удача рулетки ×3',
    bonus: { luck: 3 }, duration: 70,
    theme: { top: '#1a0a30', bottom: '#060210', nebula: [[130, 45, 175], [90, 35, 165]], accent: '#c084fc' },
  },
  {
    id: 'goldrush', name: 'Золотая лихорадка', icon: '💰', desc: 'Доход ×3',
    bonus: { income: 3 }, duration: 50,
    theme: { top: '#2a2308', bottom: '#0c0902', nebula: [[220, 175, 45], [230, 150, 25]], accent: '#ffd54a' },
  },
];
export const EVENT_BY_ID = Object.fromEntries(EVENTS.map(e => [e.id, e]));
export const EVENT_CONFIG = {
  firstDelay: 90,     // seconds after load before the first event can fire
  minGap: 150,        // min seconds between events
  maxGap: 300,        // max seconds between events
  completionGems: 3,  // gems granted when an event finishes
};

// --- Boosts -----------------------------------------------------------------
export const BOOST = {
  duration: 300,        // seconds of 2x income from a rewarded ad
  mult: 2,
  gemCost: 15,          // alternatively pay gems for the same boost
};

// Rewarded-ad / gem shop actions.
export const GEM_SHOP = {
  luckySpinCost: 25,    // gems: one guaranteed Epic-or-better drone
  boostCost: BOOST.gemCost,
};

// --- Fusion (Fuse Machine) --------------------------------------------------
// Rank fusion: 3 drones of the same rarity -> 1 random drone of next rarity up.
export const FUSION = {
  need: 3,
  // Mythic can't fuse up — recycle 3 mythics for gems instead.
  mythicGemReward: 20,
};

// Star fusion: merge N identical drones (same id + star) -> same drone at +1 star.
// Each star multiplies the drone's mining power.
export const STAR = {
  need: 2,          // identical drones required per +1 star
  max: 5,           // star cap
  color: '#ffd54a',
};
export function droneStarMult(star) { return Math.pow(1.5, star || 0); }

// --- Collection / Drone Index ------------------------------------------------
// Discovering (ever owning) a drone adds it to the index. Completing a full
// rarity set grants a one-time gem reward and a permanent income bonus, giving
// players a reason to chase every drone — including duplicates for fusion.
export const COLLECTION = {
  // Gems granted the first time an entire rarity set is completed.
  setGems: {
    common: 3, uncommon: 5, rare: 8, epic: 14,
    legendary: 25, mythic: 45, ancient: 80, celestial: 150,
  },
  // Each completed rarity set adds this to a permanent ore-value multiplier.
  incomePerSet: 0.05,
  // Bonus gems for a 100% complete index.
  fullBonusGems: 300,
};

// --- Daily rewards (7-day streak, then loops) --------------------------------
export const DAILY_REWARDS = [
  { day: 1, money: 250,     gems: 0,  icon: '💰' },
  { day: 2, money: 800,     gems: 0,  icon: '💰' },
  { day: 3, money: 0,       gems: 5,  icon: '◆' },
  { day: 4, money: 3000,    gems: 0,  icon: '💰' },
  { day: 5, money: 0,       gems: 10, icon: '◆' },
  { day: 6, money: 12000,   gems: 0,  icon: '💰' },
  { day: 7, money: 0,       gems: 25, icon: '🎁', boost: true },
];

// --- Achievements -----------------------------------------------------------
// check(game) -> boolean. reward granted once on unlock.
export const ACHIEVEMENTS = [
  { id: 'firstSpin',  name: 'Первый ролл',      desc: 'Крутани рулетку',              icon: '🎰', reward: { money: 100 },  check: g => g.state.stats.totalSpins >= 1 },
  { id: 'spin25',     name: 'Азартный',         desc: 'Крутани рулетку 25 раз',       icon: '🎲', reward: { gems: 3 },     check: g => g.state.stats.totalSpins >= 25 },
  { id: 'spin150',    name: 'Крупье',           desc: 'Крутани рулетку 150 раз',      icon: '🃏', reward: { gems: 10 },    check: g => g.state.stats.totalSpins >= 150 },
  { id: 'rare',       name: 'Редкая находка',   desc: 'Получи редкого дрона',         icon: '🔷', reward: { money: 500 },  check: g => rarityReached(g, 2) },
  { id: 'epic',       name: 'Эпический улов',   desc: 'Получи эпического дрона',       icon: '🟣', reward: { gems: 5 },     check: g => rarityReached(g, 3) },
  { id: 'legend',     name: 'Легенда',          desc: 'Получи легендарного дрона',    icon: '🌟', reward: { gems: 15 },    check: g => rarityReached(g, 4) },
  { id: 'mythic',     name: 'Миф наяву',        desc: 'Получи мифического дрона',      icon: '💠', reward: { gems: 40 },    check: g => rarityReached(g, 5) },
  { id: 'ancient',    name: 'Древняя мощь',     desc: 'Получи древнего дрона',         icon: '🗿', reward: { gems: 70 },    check: g => rarityReached(g, 6) },
  { id: 'celestial',  name: 'Небесное чудо',    desc: 'Получи небесного дрона',        icon: '🌠', reward: { gems: 120 },   check: g => rarityReached(g, 7) },
  { id: 'dex10',      name: 'Коллекционер',     desc: 'Открой 10 дронов в индексе',    icon: '📖', reward: { gems: 8 },     check: g => g.dexCount().done >= 10 },
  { id: 'dex20',      name: 'Хранитель дронов', desc: 'Открой 20 дронов в индексе',    icon: '📚', reward: { gems: 20 },    check: g => g.dexCount().done >= 20 },
  { id: 'dexAll',     name: 'Полный индекс',    desc: 'Открой всех дронов',            icon: '🏅', reward: { gems: 100 },   check: g => g.dexCount().done >= g.dexCount().total },
  { id: 'fill',       name: 'Полный ангар',     desc: 'Заполни все доки дронами',      icon: '🛰️', reward: { money: 1500 }, check: g => g.state.slots.length > 0 && g.state.slots.every(s => s.droneId) },
  { id: 'docks10',    name: 'Расширение',       desc: 'Открой 10 доков',              icon: '🔧', reward: { gems: 5 },     check: g => g.slotCount >= 10 },
  { id: 'fuse',       name: 'Алхимик',          desc: 'Сплавь дронов',                icon: '⚗️', reward: { money: 800 },  check: g => (g.state.stats.totalFused || 0) >= 1 },
  { id: 'fuse10',     name: 'Мастер сплава',    desc: 'Сделай 10 слияний',            icon: '🧪', reward: { gems: 10 },    check: g => (g.state.stats.totalFused || 0) >= 10 },
  { id: 'star3',      name: 'Звёздный',         desc: 'Прокачай дрона до 3★',         icon: '⭐', reward: { gems: 12 },    check: g => (g.state.stats.maxStar || 0) >= 3 },
  { id: 'star5',      name: 'Созвездие',        desc: 'Прокачай дрона до 5★',         icon: '✨', reward: { gems: 30 },    check: g => (g.state.stats.maxStar || 0) >= 5 },
  { id: 'planet3',    name: 'Терраформер',      desc: 'Прокачай планету до яруса 3',  icon: '🌍', reward: { gems: 8 },     check: g => g.state.planetTier >= 3 },
  { id: 'planet6',    name: 'Колонизатор',      desc: 'Прокачай планету до яруса 6',  icon: '🪐', reward: { gems: 20 },    check: g => g.state.planetTier >= 6 },
  { id: 'planetMax',  name: 'Владыка пустоты',  desc: 'Достигни последней планеты',   icon: '🌌', reward: { gems: 60 },    check: g => g.state.planetTier >= PLANETS.length - 1 },
  { id: 'rich1',      name: 'Первый капитал',   desc: 'Заработай 100K всего',         icon: '💵', reward: { gems: 5 },     check: g => g.state.stats.totalEarned >= 1e5 },
  { id: 'rich2',      name: 'Магнат',           desc: 'Заработай 10M всего',          icon: '🏦', reward: { gems: 25 },    check: g => g.state.stats.totalEarned >= 1e7 },
  { id: 'daily7',     name: 'Постоянство',      desc: 'Собери 7-дневную серию входов',icon: '📅', reward: { gems: 20 },    check: g => (g.state.daily?.streak || 0) >= 7 },
];

function rarityReached(g, order) {
  return RARITIES[g.state.stats.bestRarity]?.order >= order;
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
