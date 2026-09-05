/* ==========================================================================
   config.js — Static game data and balance tables: drones, ores, planets, upgrades, events.

   Loaded as a classic script from index.html; every top-level binding here is
   shared with the other modules. Load order matters — see index.html.
   ========================================================================== */
var RARITIES = {
  common: { id: "common", name: "\u041E\u0431\u044B\u0447\u043D\u044B\u0439", color: "#9fb3c8", glow: "#c4d3e0", weight: 1e3, order: 0 },
  uncommon: { id: "uncommon", name: "\u041D\u0435\u043E\u0431\u044B\u0447\u043D\u044B\u0439", color: "#4ade80", glow: "#86efac", weight: 420, order: 1 },
  rare: { id: "rare", name: "\u0420\u0435\u0434\u043A\u0438\u0439", color: "#38bdf8", glow: "#7dd3fc", weight: 150, order: 2 },
  epic: { id: "epic", name: "\u042D\u043F\u0438\u0447\u0435\u0441\u043A\u0438\u0439", color: "#c084fc", glow: "#e9d5ff", weight: 44, order: 3 },
  legendary: { id: "legendary", name: "\u041B\u0435\u0433\u0435\u043D\u0434\u0430\u0440\u043D\u044B\u0439", color: "#fbbf24", glow: "#fde68a", weight: 9, order: 4 },
  mythic: { id: "mythic", name: "\u041C\u0438\u0444\u0438\u0447\u0435\u0441\u043A\u0438\u0439", color: "#fb7185", glow: "#fecdd3", weight: 1.5, order: 5 },
  ancient: { id: "ancient", name: "\u0414\u0440\u0435\u0432\u043D\u0438\u0439", color: "#ff8a3d", glow: "#ffd0a0", weight: 0.34, order: 6 },
  celestial: { id: "celestial", name: "\u041D\u0435\u0431\u0435\u0441\u043D\u044B\u0439", color: "#7df9ff", glow: "#e2ffff", weight: 0.055, order: 7 }
};
var RARITY_ORDER = ["common", "uncommon", "rare", "epic", "legendary", "mythic", "ancient", "celestial"];
var LUCK_MAX_EXPONENT = 4;
var ORES = [
  { id: "dust", name: "\u041F\u044B\u043B\u044C", tier: 0, value: 1, color: "#8a8f9c", shine: "#c3c8d4" },
  { id: "copper", name: "\u041C\u0435\u0434\u044C", tier: 0, value: 2, color: "#d98a4b", shine: "#f4b184" },
  { id: "iron", name: "\u0416\u0435\u043B\u0435\u0437\u043E", tier: 1, value: 3, color: "#a7b0bd", shine: "#dfe6ef" },
  { id: "silver", name: "\u0421\u0435\u0440\u0435\u0431\u0440\u043E", tier: 1, value: 5, color: "#c8d4e0", shine: "#ffffff" },
  { id: "gold", name: "\u0417\u043E\u043B\u043E\u0442\u043E", tier: 2, value: 8, color: "#f4c542", shine: "#fff3b0" },
  { id: "amethyst", name: "\u0410\u043C\u0435\u0442\u0438\u0441\u0442", tier: 3, value: 13, color: "#a855f7", shine: "#e9d5ff" },
  { id: "emerald", name: "\u0418\u0437\u0443\u043C\u0440\u0443\u0434", tier: 4, value: 20, color: "#22c55e", shine: "#bbf7d0" },
  { id: "sapphire", name: "\u0421\u0430\u043F\u0444\u0438\u0440", tier: 5, value: 31, color: "#3b82f6", shine: "#bfdbfe" },
  { id: "ruby", name: "\u0420\u0443\u0431\u0438\u043D", tier: 6, value: 47, color: "#ef4444", shine: "#fecaca" },
  { id: "diamond", name: "\u0410\u043B\u043C\u0430\u0437", tier: 7, value: 72, color: "#67e8f9", shine: "#ffffff" },
  { id: "plasma", name: "\u041F\u043B\u0430\u0437\u043C\u0430", tier: 8, value: 110, color: "#e879f9", shine: "#fbcfe8" },
  { id: "voidstone", name: "\u041F\u0443\u0441\u0442\u043E\u043A\u0430\u043C\u0435\u043D\u044C", tier: 9, value: 165, color: "#7c3aed", shine: "#c4b5fd" }
];
var PLANETS = [
  { name: "\u041F\u0443\u0441\u0442\u043E\u0448\u044C", core: "#5b6472", land: "#7c8797", accent: "#9aa6b6", atmos: "#8fa5c0", valueMult: 1 },
  { name: "\u0420\u0443\u0434\u043D\u0438\u043A", core: "#6b5644", land: "#8a6f52", accent: "#b98c5a", atmos: "#c9a06a", valueMult: 1.45, clouds: 0.18 },
  { name: "\u0422\u0443\u043D\u0434\u0440\u0430", core: "#3f5b63", land: "#5b8894", accent: "#8fd0d8", atmos: "#a7e8f0", valueMult: 2.1, clouds: 0.5 },
  { name: "\u0414\u0436\u0443\u043D\u0433\u043B\u0438", core: "#2f5233", land: "#3f7a45", accent: "#6fce68", atmos: "#9dffa0", valueMult: 3, clouds: 0.6 },
  { name: "\u041B\u0430\u0437\u0443\u0440\u0438\u0442", core: "#243a6b", land: "#3556a8", accent: "#5f8fff", atmos: "#8fb4ff", valueMult: 4.3, clouds: 0.55, ring: "#8fb4ff" },
  { name: "\u041C\u0430\u0433\u043C\u0430", core: "#5b1e1e", land: "#a83535", accent: "#ff6b3d", atmos: "#ff9d5c", valueMult: 6.2, clouds: 0.3, lights: "#ffb24a" },
  { name: "\u041A\u0440\u0438\u0441\u0442\u0430\u043B\u043B", core: "#4a2f6b", land: "#7b4fb0", accent: "#c98fff", atmos: "#e0b0ff", valueMult: 9, lights: "#e6b3ff", ring: "#c98fff" },
  { name: "\u041F\u0435\u043F\u0435\u043B", core: "#2b2b30", land: "#4a4a52", accent: "#8a8a96", atmos: "#c0c0cc", valueMult: 13, clouds: 0.5 },
  { name: "\u041D\u0435\u043E\u043D", core: "#0f3b3b", land: "#0f8a7a", accent: "#2affd5", atmos: "#7fffe8", valueMult: 19, lights: "#54ffe0", ring: "#2affd5" },
  { name: "\u041F\u0443\u0441\u0442\u043E\u0442\u0430", core: "#1a0f2e", land: "#3d1f6b", accent: "#a855f7", atmos: "#d8b4fe", valueMult: 28, lights: "#c9a0ff", ring: "#a855f7" }
];
var DRONES = [
  // Common
  { id: "scout", name: "\u0421\u043A\u0430\u0443\u0442", rarity: "common", power: 1, interval: 1.6, shape: "auger" },
  { id: "pebble", name: "\u0413\u0430\u043B\u0435\u0447\u043D\u0438\u043A", rarity: "common", power: 2, interval: 1.5, shape: "drill" },
  { id: "rustbit", name: "\u0420\u0436\u0430\u0432\u044B\u0439 \u0411\u0438\u0442", rarity: "common", power: 3, interval: 1.7, shape: "auger" },
  { id: "chipper", name: "\u0427\u0438\u043F\u043F\u0435\u0440", rarity: "common", power: 4, interval: 1.6, shape: "drill" },
  // Uncommon
  { id: "twin", name: "\u0422\u0432\u0438\u043D-\u0410\u0432\u0433\u0435\u0440", rarity: "uncommon", power: 6, interval: 1.4, shape: "twin" },
  { id: "copperjaw", name: "\u041C\u0435\u0434\u043D\u044B\u0439 \u041A\u043B\u044B\u043A", rarity: "uncommon", power: 9, interval: 1.4, shape: "drill" },
  { id: "buzz", name: "\u0411\u0430\u0437\u0437\u0441\u043E\u0443", rarity: "uncommon", power: 12, interval: 1.2, shape: "saw" },
  { id: "sander", name: "\u0428\u043B\u0438\u0444\u043E\u0432\u0449\u0438\u043A", rarity: "uncommon", power: 15, interval: 1.3, shape: "saw" },
  // Rare
  { id: "quad", name: "\u041A\u0432\u0430\u0434-\u0414\u0440\u0438\u043B\u043B", rarity: "rare", power: 22, interval: 1.2, shape: "quad" },
  { id: "ionlance", name: "\u0418\u043E\u043D-\u041B\u0430\u043D\u0441", rarity: "rare", power: 32, interval: 1.1, shape: "laser" },
  { id: "ripper", name: "\u0420\u0438\u043F\u043F\u0435\u0440", rarity: "rare", power: 44, interval: 1, shape: "saw" },
  { id: "corebit", name: "\u041A\u043E\u0440-\u0411\u0438\u0442", rarity: "rare", power: 55, interval: 1.05, shape: "drill" },
  // Epic
  { id: "magma", name: "\u041C\u0430\u0433\u043C\u0430-\u0411\u0443\u0440", rarity: "epic", power: 85, interval: 1, shape: "drill" },
  { id: "plasmator", name: "\u041F\u043B\u0430\u0437\u043C\u0430\u0442\u043E\u0440", rarity: "epic", power: 120, interval: 0.9, shape: "laser" },
  { id: "hexa", name: "\u0413\u0435\u043A\u0441\u0430-\u041A\u043E\u0440\u0435\u0440", rarity: "epic", power: 165, interval: 0.9, shape: "quad" },
  { id: "voidsaw", name: "\u0412\u043E\u0439\u0434-\u041F\u0438\u043B\u0430", rarity: "epic", power: 210, interval: 0.85, shape: "saw" },
  // Legendary
  { id: "nova", name: "\u041D\u043E\u0432\u0430-\u0410\u0432\u0433\u0435\u0440", rarity: "legendary", power: 340, interval: 0.8, shape: "twin" },
  { id: "singular", name: "\u0421\u0438\u043D\u0433\u0443\u043B\u044F\u0440\u043D\u043E\u0441\u0442\u044C", rarity: "legendary", power: 520, interval: 0.75, shape: "laser" },
  { id: "titan", name: "\u0422\u0438\u0442\u0430\u043D-\u0411\u0443\u0440", rarity: "legendary", power: 700, interval: 0.72, shape: "quad" },
  { id: "eclipse", name: "\u042D\u043A\u043B\u0438\u043F\u0441", rarity: "legendary", power: 900, interval: 0.7, shape: "laser" },
  // Mythic
  { id: "quantum", name: "\u041A\u0432\u0430\u043D\u0442-\u0416\u043D\u0435\u0446", rarity: "mythic", power: 1300, interval: 0.7, shape: "quad" },
  { id: "devourer", name: "\u041F\u043E\u0436\u0438\u0440\u0430\u0442\u0435\u043B\u044C", rarity: "mythic", power: 2100, interval: 0.65, shape: "laser" },
  { id: "omega", name: "\u041E\u043C\u0435\u0433\u0430-\u041A\u043E\u0440\u0435\u0440", rarity: "mythic", power: 2900, interval: 0.6, shape: "quad" },
  // Ancient
  { id: "progenitor", name: "\u041F\u0440\u0430\u0440\u043E\u0434\u0438\u0442\u0435\u043B\u044C", rarity: "ancient", power: 4200, interval: 0.6, shape: "laser" },
  { id: "monolith", name: "\u041C\u043E\u043D\u043E\u043B\u0438\u0442", rarity: "ancient", power: 5600, interval: 0.55, shape: "quad" },
  // Celestial
  { id: "starforge", name: "\u0417\u0432\u0451\u0437\u0434\u043D\u044B\u0439 \u0413\u043E\u0440\u043D", rarity: "celestial", power: 8500, interval: 0.5, shape: "laser" },
  { id: "celestia", name: "\u0421\u0435\u043B\u0435\u0441\u0442\u0438\u044F", rarity: "celestial", power: 12e3, interval: 0.5, shape: "quad" }
];
var DRONE_ART = {
  // Generated PNG overrides live in assets/drones/. Missing files fall back to
  // the procedural sprite, so an entry here is safe before the art lands.
  scout: "assets/drones/scout.png",
  // Example hero sprite — hand-authored SVG, kept inline so it costs no request.
  celestia: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTYgMzIwIiB3aWR0aD0iMjU2IiBoZWlnaHQ9IjMyMCI+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9ImJvZHkiIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwIiBzdG9wLWNvbG9yPSIjZjZmZWZmIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMC41IiBzdG9wLWNvbG9yPSIjY2ZlZWY1Ii8+CiAgICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iIzhmYjljNiIvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iY29uZSIgeDE9IjAiIHkxPSIwIiB4Mj0iMSIgeTI9IjAiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiM1ZjZhN2MiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIwLjUiIHN0b3AtY29sb3I9IiNlZWY4ZmIiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjNWY2YTdjIi8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPHJhZGlhbEdyYWRpZW50IGlkPSJleWUiIGN4PSIwLjQiIGN5PSIwLjM1IiByPSIwLjciPgogICAgICA8c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNmZmZmZmYiLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIwLjM1IiBzdG9wLWNvbG9yPSIjN2RmOWZmIi8+CiAgICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0icmdiYSgxMjUsMjQ5LDI1NSwwLjE1KSIvPgogICAgPC9yYWRpYWxHcmFkaWVudD4KICAgIDxmaWx0ZXIgaWQ9Imdsb3ciIHg9Ii02MCUiIHk9Ii02MCUiIHdpZHRoPSIyMjAlIiBoZWlnaHQ9IjIyMCUiPgogICAgICA8ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSI2IiByZXN1bHQ9ImIiLz4KICAgICAgPGZlTWVyZ2U+PGZlTWVyZ2VOb2RlIGluPSJiIi8+PGZlTWVyZ2VOb2RlIGluPSJTb3VyY2VHcmFwaGljIi8+PC9mZU1lcmdlPgogICAgPC9maWx0ZXI+CiAgPC9kZWZzPgoKICA8IS0tIG5lb24gaGFsbyAtLT4KICA8Y2lyY2xlIGN4PSIxMjgiIGN5PSIxMjAiIHI9Ijk2IiBmaWxsPSJub25lIiBzdHJva2U9IiM3ZGY5ZmYiIHN0cm9rZS13aWR0aD0iNiIgb3BhY2l0eT0iMC44NSIgZmlsdGVyPSJ1cmwoI2dsb3cpIi8+CgogIDwhLS0gY2VsZXN0aWFsIGNyb3duIC0tPgogIDxnIGZpbGw9IiNlMmZmZmYiIGZpbHRlcj0idXJsKCNnbG93KSI+CiAgICA8cGF0aCBkPSJNMTI4IDIwIGwxMCAyNiAtMjAgMCB6Ii8+CiAgICA8cGF0aCBkPSJNOTIgMzAgbDggMjQgLTE4IDIgeiIvPgogICAgPHBhdGggZD0iTTE2NCAzMCBsLTggMjQgMTggMiB6Ii8+CiAgPC9nPgoKICA8IS0tIHNpZGUgcG9kcyAtLT4KICA8ZyBmaWxsPSIjYWVjY2Q0Ij4KICAgIDxyZWN0IHg9IjQ0IiB5PSI5MiIgd2lkdGg9IjM0IiBoZWlnaHQ9IjcwIiByeD0iMTYiLz4KICAgIDxyZWN0IHg9IjE3OCIgeT0iOTIiIHdpZHRoPSIzNCIgaGVpZ2h0PSI3MCIgcng9IjE2Ii8+CiAgPC9nPgogIDxnIGZpbGw9IiM3ZGY5ZmYiIGZpbHRlcj0idXJsKCNnbG93KSI+CiAgICA8Y2lyY2xlIGN4PSI2MSIgY3k9IjEyNyIgcj0iOCIvPjxjaXJjbGUgY3g9IjE5NSIgY3k9IjEyNyIgcj0iOCIvPgogIDwvZz4KCiAgPCEtLSBoZWFkIC0tPgogIDxyZWN0IHg9IjYyIiB5PSI2NiIgd2lkdGg9IjEzMiIgaGVpZ2h0PSIxMTIiIHJ4PSI0MCIgZmlsbD0idXJsKCNib2R5KSIgc3Ryb2tlPSIjN2RmOWZmIiBzdHJva2Utd2lkdGg9IjMiLz4KICA8cmVjdCB4PSI4NiIgeT0iNzQiIHdpZHRoPSI4NCIgaGVpZ2h0PSIxOCIgcng9IjkiIGZpbGw9IiNmZmZmZmYiIG9wYWNpdHk9IjAuMzUiLz4KCiAgPCEtLSB2aXNvciArIGV5ZXMgLS0+CiAgPHJlY3QgeD0iNzYiIHk9IjEwNCIgd2lkdGg9IjEwNCIgaGVpZ2h0PSI1MiIgcng9IjI0IiBmaWxsPSIjMTAxYTI2IiBvcGFjaXR5PSIwLjk0Ii8+CiAgPGVsbGlwc2UgY3g9IjEwOCIgY3k9IjEzMCIgcng9IjE2IiByeT0iMjAiIGZpbGw9InVybCgjZXllKSIvPgogIDxlbGxpcHNlIGN4PSIxNDgiIGN5PSIxMzAiIHJ4PSIxNiIgcnk9IjIwIiBmaWxsPSJ1cmwoI2V5ZSkiLz4KCiAgPCEtLSBqYXcgdHJpbSAtLT4KICA8cmVjdCB4PSI2MiIgeT0iMTYyIiB3aWR0aD0iMTMyIiBoZWlnaHQ9IjE2IiByeD0iOCIgZmlsbD0iIzdkZjlmZiIvPgoKICA8IS0tIGRyaWxsIC0tPgogIDxyZWN0IHg9IjEwOCIgeT0iMTc2IiB3aWR0aD0iNDAiIGhlaWdodD0iMjAiIHJ4PSI2IiBmaWxsPSIjOWFhN2JhIi8+CiAgPHBhdGggZD0iTTk2IDE5NiBMMTYwIDE5NiBMMTI4IDMwMCBaIiBmaWxsPSJ1cmwoI2NvbmUpIi8+CiAgPGcgc3Ryb2tlPSIjN2RmOWZmIiBzdHJva2Utd2lkdGg9IjYiIG9wYWNpdHk9IjAuODUiPgogICAgPGxpbmUgeDE9Ijk2IiB5MT0iMjE0IiB4Mj0iMTYwIiB5Mj0iMjA2Ii8+CiAgICA8bGluZSB4MT0iMTAwIiB5MT0iMjQwIiB4Mj0iMTU2IiB5Mj0iMjMyIi8+CiAgICA8bGluZSB4MT0iMTA4IiB5MT0iMjY2IiB4Mj0iMTQ4IiB5Mj0iMjU4Ii8+CiAgPC9nPgogIDxjaXJjbGUgY3g9IjEyOCIgY3k9IjMwMCIgcj0iOSIgZmlsbD0iI2ZmZmZmZiIgZmlsdGVyPSJ1cmwoI2dsb3cpIi8+Cjwvc3ZnPgo="
};
// Surface maps, NOT static planet faces: seamless equirectangular strips at
// roughly 2.2:1, scrolled by WorldRenderer so the planet keeps rotating.
var PLANET_ART = {
  0: "assets/planets/wasteland.jpg"
};
// Ore icon overrides. The glow behind the gem stays procedural either way.
var ORE_ART = {
  dust: "assets/ores/dust.png"
};
var ORE_BY_ID = Object.fromEntries(ORES.map((o) => [o.id, o]));
var DRONE_BY_ID = Object.fromEntries(DRONES.map((d) => [d.id, d]));
var DRONES_BY_RARITY = RARITY_ORDER.reduce((acc, r) => {
  acc[r] = DRONES.filter((d) => d.rarity === r);
  return acc;
}, {});
var ROULETTE = {
  baseCost: 60,
  // cost of one spin
  costGrowth: 1.12,
  // cost multiplied per spin owned-drone count milestone
  // luck shifts probability mass toward higher rarities. Each luck level adds
  // a small multiplier to the weight of every rarity above common.
  luckPerLevel: 0.12
};
var UPGRADES = {
  miningSpeed: {
    id: "miningSpeed",
    name: "\u0421\u043A\u043E\u0440\u043E\u0441\u0442\u044C \u0431\u0443\u0440\u0435\u043D\u0438\u044F",
    icon: "speed",
    desc: "\u0412\u0441\u0435 \u0434\u0440\u043E\u043D\u044B \u0431\u0443\u0440\u044F\u0442 \u0431\u044B\u0441\u0442\u0440\u0435\u0435",
    max: 40,
    cost: (lv) => Math.floor(30 * Math.pow(1.5, lv)),
    value: (lv) => 1 + lv * 0.1,
    // multiplier
    format: (lv) => `x${(1 + lv * 0.1).toFixed(2)}`,
    branch: "mining"
  },
  oreValue: {
    id: "oreValue",
    name: "\u0426\u0435\u043D\u043D\u043E\u0441\u0442\u044C \u0440\u0443\u0434\u044B",
    icon: "gem",
    desc: "\u0420\u0443\u0434\u0430 \u043F\u0440\u043E\u0434\u0430\u0451\u0442\u0441\u044F \u0434\u043E\u0440\u043E\u0436\u0435",
    max: 40,
    cost: (lv) => Math.floor(45 * Math.pow(1.5, lv)),
    value: (lv) => 1 + lv * 0.08,
    format: (lv) => `x${(1 + lv * 0.08).toFixed(2)}`,
    branch: "mining"
  },
  storage: {
    id: "storage",
    name: "\u0425\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435",
    icon: "crate",
    desc: "\u0411\u043E\u043B\u044C\u0448\u0435 \u0440\u0443\u0434\u044B \u043F\u043E\u043C\u0435\u0449\u0430\u0435\u0442\u0441\u044F \u0432 \u0442\u0440\u044E\u043C",
    max: 30,
    cost: (lv) => Math.floor(40 * Math.pow(1.45, lv)),
    value: (lv) => 200 * Math.pow(1.55, lv),
    // capacity in ore units
    format: (lv) => `${formatShort(200 * Math.pow(1.55, lv))}`,
    branch: "logistics"
  },
  docks: {
    id: "docks",
    name: "\u0414\u043E\u043A\u0438",
    icon: "dock",
    desc: "\u0411\u043E\u043B\u044C\u0448\u0435 \u0441\u043B\u043E\u0442\u043E\u0432 \u0434\u043B\u044F \u0434\u0440\u043E\u043D\u043E\u0432",
    max: 11,
    // 5 -> 16 slots
    cost: (lv) => Math.floor(500 * Math.pow(2, lv)),
    value: (lv) => 5 + lv,
    // total slots
    format: (lv) => `${5 + lv} \u0441\u043B\u043E\u0442\u043E\u0432`,
    branch: "logistics"
  },
  deploy: {
    id: "deploy",
    name: "\u041C\u0443\u043B\u044C\u0442\u0438-\u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430",
    icon: "deploy",
    desc: "\u0421\u0442\u0430\u0432\u0438\u0442\u044C \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0431\u0443\u0440\u043E\u0432 \u0437\u0430 \u043E\u0434\u043D\u043E \u043D\u0430\u0436\u0430\u0442\u0438\u0435",
    max: 5,
    // 1 -> 6 at once
    cost: (lv) => Math.floor(800 * Math.pow(1.95, lv)),
    value: (lv) => 1 + lv,
    // drones placed per tap
    format: (lv) => `${1 + lv}\xD7 \u0437\u0430 \u0440\u0430\u0437`,
    branch: "logistics"
  },
  luck: {
    id: "luck",
    name: "\u0423\u0434\u0430\u0447\u0430",
    icon: "clover",
    desc: "\u0412\u044B\u0448\u0435 \u0448\u0430\u043D\u0441 \u0440\u0435\u0434\u043A\u0438\u0445 \u0434\u0440\u043E\u043D\u043E\u0432 \u0432 \u0440\u0443\u043B\u0435\u0442\u043A\u0435",
    max: 30,
    cost: (lv) => Math.floor(120 * Math.pow(1.48, lv)),
    value: (lv) => lv,
    format: (lv) => `+${(lv * ROULETTE.luckPerLevel * 100).toFixed(0)}%`,
    branch: "fortune"
  },
  rolls: {
    id: "rolls",
    name: "\u041C\u0443\u043B\u044C\u0442\u0438-\u0440\u043E\u043B\u043B",
    icon: "dice",
    desc: "\u0414\u0440\u043E\u043D\u043E\u0432 \u0437\u0430 \u043E\u0434\u0438\u043D \u0441\u043F\u0438\u043D \u0440\u0443\u043B\u0435\u0442\u043A\u0438",
    max: 4,
    // 1 -> 5 rolls
    cost: (lv) => Math.floor(2500 * Math.pow(2.9, lv)),
    value: (lv) => 1 + lv,
    format: (lv) => `${1 + lv}x`,
    branch: "fortune"
  },
  autosell: {
    id: "autosell",
    name: "\u0410\u0432\u0442\u043E-\u043F\u0440\u043E\u0434\u0430\u0436\u0430",
    icon: "auto",
    desc: "\u0422\u0440\u044E\u043C \u043F\u0440\u043E\u0434\u0430\u0451\u0442\u0441\u044F \u0441\u0430\u043C, \u0432\u0441\u0451 \u0431\u044B\u0441\u0442\u0440\u0435\u0435",
    max: 20,
    cost: (lv) => lv === 0 ? 5000 : Math.floor(300 * Math.pow(1.5, lv)),
    value: (lv) => lv,
    // 0 = locked, >=1 sell interval shrinks
    format: (lv) => lv === 0 ? "\u0412\u044B\u043A\u043B" : `${Math.max(0.4, 6 - lv * 0.6).toFixed(1)}\u0441`,
    branch: "logistics"
  },
  offline: {
    id: "offline",
    name: "\u041E\u0444\u0444\u043B\u0430\u0439\u043D-\u0434\u043E\u0431\u044B\u0447\u0430",
    icon: "moon",
    desc: "\u0414\u0440\u043E\u043D\u044B \u0440\u0430\u0431\u043E\u0442\u0430\u044E\u0442, \u043F\u043E\u043A\u0430 \u0432\u044B \u0432\u043D\u0435 \u0438\u0433\u0440\u044B",
    max: 10,
    cost: (lv) => lv === 0 ? 9000 : Math.floor(1200 * Math.pow(1.5, lv)),
    value: (lv) => Math.min(0.75, lv * 0.075),
    // efficiency 0..0.75
    format: (lv) => `${Math.round(Math.min(0.75, lv * 0.075) * 100)}%`,
    branch: "fortune"
  }
};
var UPGRADE_BRANCHES = {
  mining: { name: "\u0414\u043E\u0431\u044B\u0447\u0430", color: "#fb923c" },
  logistics: { name: "\u041B\u043E\u0433\u0438\u0441\u0442\u0438\u043A\u0430", color: "#38bdf8" },
  fortune: { name: "\u0423\u0434\u0430\u0447\u0430", color: "#a855f7" }
};
function planetUpgradeCost(tier) {
  return Math.floor(9000 * Math.pow(5, tier));
}
var EVENTS = [
  {
    id: "meteor",
    name: "\u041C\u0435\u0442\u0435\u043E\u0440\u0438\u0442\u043D\u044B\u0439 \u0434\u043E\u0436\u0434\u044C",
    icon: "\u2604\uFE0F",
    desc: "\u0426\u0435\u043D\u043D\u043E\u0441\u0442\u044C \u0440\u0443\u0434\u044B \xD72",
    bonus: { income: 2 },
    duration: 75,
    theme: { top: "#2a0e10", bottom: "#0a0304", nebula: [[170, 55, 40], [130, 35, 45]], meteors: true, accent: "#ff6b3d" }
  },
  {
    id: "flare",
    name: "\u0421\u043E\u043B\u043D\u0435\u0447\u043D\u0430\u044F \u0432\u0441\u043F\u044B\u0448\u043A\u0430",
    icon: "\u{1F31F}",
    desc: "\u0421\u043A\u043E\u0440\u043E\u0441\u0442\u044C \u0431\u0443\u0440\u0435\u043D\u0438\u044F \xD72",
    bonus: { speed: 2 },
    duration: 60,
    theme: { top: "#2b2408", bottom: "#0c0a02", nebula: [[210, 150, 40], [230, 120, 30]], accent: "#ffcf4a" }
  },
  {
    id: "anomaly",
    name: "\u041A\u043E\u0441\u043C\u0438\u0447\u0435\u0441\u043A\u0430\u044F \u0430\u043D\u043E\u043C\u0430\u043B\u0438\u044F",
    icon: "\u{1F300}",
    desc: "\u0423\u0434\u0430\u0447\u0430 \u0440\u0443\u043B\u0435\u0442\u043A\u0438 \xD73",
    bonus: { luck: 3 },
    duration: 70,
    theme: { top: "#1a0a30", bottom: "#060210", nebula: [[130, 45, 175], [90, 35, 165]], accent: "#c084fc" }
  },
  {
    id: "goldrush",
    name: "\u0417\u043E\u043B\u043E\u0442\u0430\u044F \u043B\u0438\u0445\u043E\u0440\u0430\u0434\u043A\u0430",
    icon: "\u{1F4B0}",
    desc: "\u0414\u043E\u0445\u043E\u0434 \xD73",
    bonus: { income: 3 },
    duration: 50,
    theme: { top: "#2a2308", bottom: "#0c0902", nebula: [[220, 175, 45], [230, 150, 25]], accent: "#ffd54a" }
  }
];
var EVENT_BY_ID = Object.fromEntries(EVENTS.map((e) => [e.id, e]));
var EVENT_CONFIG = {
  firstDelay: 90,
  // seconds after load before the first event can fire
  minGap: 150,
  // min seconds between events
  maxGap: 300,
  // max seconds between events
  completionGems: 3
  // gems granted when an event finishes
};
var BOOST = {
  duration: 300,
  // seconds of 2x income from a rewarded ad
  mult: 2,
  gemCost: 15
  // alternatively pay gems for the same boost
};
var GEM_SHOP = {
  luckySpinCost: 25,
  // gems: one guaranteed Epic-or-better drone
  boostCost: BOOST.gemCost
};
var FUSION = {
  need: 3,
  // Mythic can't fuse up — recycle 3 mythics for gems instead.
  mythicGemReward: 20
};
var STAR = {
  need: 2,
  // identical drones required per +1 star
  max: 5,
  // star cap
  color: "#ffd54a"
};
function droneStarMult(star) {
  return Math.pow(1.5, star || 0);
}
var COLLECTION = {
  // Gems granted the first time an entire rarity set is completed.
  setGems: {
    common: 3,
    uncommon: 5,
    rare: 8,
    epic: 14,
    legendary: 25,
    mythic: 45,
    ancient: 80,
    celestial: 150
  },
  // Each completed rarity set adds this to a permanent ore-value multiplier.
  incomePerSet: 0.05,
  // Bonus gems for a 100% complete index.
  fullBonusGems: 300
};
var DAILY_REWARDS = [
  { day: 1, money: 250, gems: 0, icon: "\u{1F4B0}" },
  { day: 2, money: 800, gems: 0, icon: "\u{1F4B0}" },
  { day: 3, money: 0, gems: 5, icon: "\u25C6" },
  { day: 4, money: 3e3, gems: 0, icon: "\u{1F4B0}" },
  { day: 5, money: 0, gems: 10, icon: "\u25C6" },
  { day: 6, money: 12e3, gems: 0, icon: "\u{1F4B0}" },
  { day: 7, money: 0, gems: 25, icon: "\u{1F381}", boost: true }
];
var ACHIEVEMENTS = [
  { id: "firstSpin", name: "\u041F\u0435\u0440\u0432\u044B\u0439 \u0440\u043E\u043B\u043B", desc: "\u041A\u0440\u0443\u0442\u0430\u043D\u0438 \u0440\u0443\u043B\u0435\u0442\u043A\u0443", icon: "\u{1F3B0}", reward: { money: 100 }, check: (g) => g.state.stats.totalSpins >= 1 },
  { id: "spin25", name: "\u0410\u0437\u0430\u0440\u0442\u043D\u044B\u0439", desc: "\u041A\u0440\u0443\u0442\u0430\u043D\u0438 \u0440\u0443\u043B\u0435\u0442\u043A\u0443 25 \u0440\u0430\u0437", icon: "\u{1F3B2}", reward: { gems: 3 }, check: (g) => g.state.stats.totalSpins >= 25 },
  { id: "spin150", name: "\u041A\u0440\u0443\u043F\u044C\u0435", desc: "\u041A\u0440\u0443\u0442\u0430\u043D\u0438 \u0440\u0443\u043B\u0435\u0442\u043A\u0443 150 \u0440\u0430\u0437", icon: "\u{1F0CF}", reward: { gems: 10 }, check: (g) => g.state.stats.totalSpins >= 150 },
  { id: "rare", name: "\u0420\u0435\u0434\u043A\u0430\u044F \u043D\u0430\u0445\u043E\u0434\u043A\u0430", desc: "\u041F\u043E\u043B\u0443\u0447\u0438 \u0440\u0435\u0434\u043A\u043E\u0433\u043E \u0434\u0440\u043E\u043D\u0430", icon: "\u{1F537}", reward: { money: 500 }, check: (g) => rarityReached(g, 2) },
  { id: "epic", name: "\u042D\u043F\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0443\u043B\u043E\u0432", desc: "\u041F\u043E\u043B\u0443\u0447\u0438 \u044D\u043F\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u0434\u0440\u043E\u043D\u0430", icon: "\u{1F7E3}", reward: { gems: 5 }, check: (g) => rarityReached(g, 3) },
  { id: "legend", name: "\u041B\u0435\u0433\u0435\u043D\u0434\u0430", desc: "\u041F\u043E\u043B\u0443\u0447\u0438 \u043B\u0435\u0433\u0435\u043D\u0434\u0430\u0440\u043D\u043E\u0433\u043E \u0434\u0440\u043E\u043D\u0430", icon: "\u{1F31F}", reward: { gems: 15 }, check: (g) => rarityReached(g, 4) },
  { id: "mythic", name: "\u041C\u0438\u0444 \u043D\u0430\u044F\u0432\u0443", desc: "\u041F\u043E\u043B\u0443\u0447\u0438 \u043C\u0438\u0444\u0438\u0447\u0435\u0441\u043A\u043E\u0433\u043E \u0434\u0440\u043E\u043D\u0430", icon: "\u{1F4A0}", reward: { gems: 40 }, check: (g) => rarityReached(g, 5) },
  { id: "ancient", name: "\u0414\u0440\u0435\u0432\u043D\u044F\u044F \u043C\u043E\u0449\u044C", desc: "\u041F\u043E\u043B\u0443\u0447\u0438 \u0434\u0440\u0435\u0432\u043D\u0435\u0433\u043E \u0434\u0440\u043E\u043D\u0430", icon: "\u{1F5FF}", reward: { gems: 70 }, check: (g) => rarityReached(g, 6) },
  { id: "celestial", name: "\u041D\u0435\u0431\u0435\u0441\u043D\u043E\u0435 \u0447\u0443\u0434\u043E", desc: "\u041F\u043E\u043B\u0443\u0447\u0438 \u043D\u0435\u0431\u0435\u0441\u043D\u043E\u0433\u043E \u0434\u0440\u043E\u043D\u0430", icon: "\u{1F320}", reward: { gems: 120 }, check: (g) => rarityReached(g, 7) },
  { id: "dex10", name: "\u041A\u043E\u043B\u043B\u0435\u043A\u0446\u0438\u043E\u043D\u0435\u0440", desc: "\u041E\u0442\u043A\u0440\u043E\u0439 10 \u0434\u0440\u043E\u043D\u043E\u0432 \u0432 \u0438\u043D\u0434\u0435\u043A\u0441\u0435", icon: "\u{1F4D6}", reward: { gems: 8 }, check: (g) => g.dexCount().done >= 10 },
  { id: "dex20", name: "\u0425\u0440\u0430\u043D\u0438\u0442\u0435\u043B\u044C \u0434\u0440\u043E\u043D\u043E\u0432", desc: "\u041E\u0442\u043A\u0440\u043E\u0439 20 \u0434\u0440\u043E\u043D\u043E\u0432 \u0432 \u0438\u043D\u0434\u0435\u043A\u0441\u0435", icon: "\u{1F4DA}", reward: { gems: 20 }, check: (g) => g.dexCount().done >= 20 },
  { id: "dexAll", name: "\u041F\u043E\u043B\u043D\u044B\u0439 \u0438\u043D\u0434\u0435\u043A\u0441", desc: "\u041E\u0442\u043A\u0440\u043E\u0439 \u0432\u0441\u0435\u0445 \u0434\u0440\u043E\u043D\u043E\u0432", icon: "\u{1F3C5}", reward: { gems: 100 }, check: (g) => g.dexCount().done >= g.dexCount().total },
  { id: "fill", name: "\u041F\u043E\u043B\u043D\u044B\u0439 \u0430\u043D\u0433\u0430\u0440", desc: "\u0417\u0430\u043F\u043E\u043B\u043D\u0438 \u0432\u0441\u0435 \u0434\u043E\u043A\u0438 \u0434\u0440\u043E\u043D\u0430\u043C\u0438", icon: "\u{1F6F0}\uFE0F", reward: { money: 1500 }, check: (g) => g.state.slots.length > 0 && g.state.slots.every((s) => s.droneId) },
  { id: "docks10", name: "\u0420\u0430\u0441\u0448\u0438\u0440\u0435\u043D\u0438\u0435", desc: "\u041E\u0442\u043A\u0440\u043E\u0439 10 \u0434\u043E\u043A\u043E\u0432", icon: "\u{1F527}", reward: { gems: 5 }, check: (g) => g.slotCount >= 10 },
  { id: "fuse", name: "\u0410\u043B\u0445\u0438\u043C\u0438\u043A", desc: "\u0421\u043F\u043B\u0430\u0432\u044C \u0434\u0440\u043E\u043D\u043E\u0432", icon: "\u2697\uFE0F", reward: { money: 800 }, check: (g) => (g.state.stats.totalFused || 0) >= 1 },
  { id: "fuse10", name: "\u041C\u0430\u0441\u0442\u0435\u0440 \u0441\u043F\u043B\u0430\u0432\u0430", desc: "\u0421\u0434\u0435\u043B\u0430\u0439 10 \u0441\u043B\u0438\u044F\u043D\u0438\u0439", icon: "\u{1F9EA}", reward: { gems: 10 }, check: (g) => (g.state.stats.totalFused || 0) >= 10 },
  { id: "star3", name: "\u0417\u0432\u0451\u0437\u0434\u043D\u044B\u0439", desc: "\u041F\u0440\u043E\u043A\u0430\u0447\u0430\u0439 \u0434\u0440\u043E\u043D\u0430 \u0434\u043E 3\u2605", icon: "\u2B50", reward: { gems: 12 }, check: (g) => (g.state.stats.maxStar || 0) >= 3 },
  { id: "star5", name: "\u0421\u043E\u0437\u0432\u0435\u0437\u0434\u0438\u0435", desc: "\u041F\u0440\u043E\u043A\u0430\u0447\u0430\u0439 \u0434\u0440\u043E\u043D\u0430 \u0434\u043E 5\u2605", icon: "\u2728", reward: { gems: 30 }, check: (g) => (g.state.stats.maxStar || 0) >= 5 },
  { id: "planet3", name: "\u0422\u0435\u0440\u0440\u0430\u0444\u043E\u0440\u043C\u0435\u0440", desc: "\u041F\u0440\u043E\u043A\u0430\u0447\u0430\u0439 \u043F\u043B\u0430\u043D\u0435\u0442\u0443 \u0434\u043E \u044F\u0440\u0443\u0441\u0430 3", icon: "\u{1F30D}", reward: { gems: 8 }, check: (g) => g.state.planetTier >= 3 },
  { id: "planet6", name: "\u041A\u043E\u043B\u043E\u043D\u0438\u0437\u0430\u0442\u043E\u0440", desc: "\u041F\u0440\u043E\u043A\u0430\u0447\u0430\u0439 \u043F\u043B\u0430\u043D\u0435\u0442\u0443 \u0434\u043E \u044F\u0440\u0443\u0441\u0430 6", icon: "\u{1FA90}", reward: { gems: 20 }, check: (g) => g.state.planetTier >= 6 },
  { id: "planetMax", name: "\u0412\u043B\u0430\u0434\u044B\u043A\u0430 \u043F\u0443\u0441\u0442\u043E\u0442\u044B", desc: "\u0414\u043E\u0441\u0442\u0438\u0433\u043D\u0438 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0435\u0439 \u043F\u043B\u0430\u043D\u0435\u0442\u044B", icon: "\u{1F30C}", reward: { gems: 60 }, check: (g) => g.state.planetTier >= PLANETS.length - 1 },
  { id: "rich1", name: "\u041F\u0435\u0440\u0432\u044B\u0439 \u043A\u0430\u043F\u0438\u0442\u0430\u043B", desc: "\u0417\u0430\u0440\u0430\u0431\u043E\u0442\u0430\u0439 100K \u0432\u0441\u0435\u0433\u043E", icon: "\u{1F4B5}", reward: { gems: 5 }, check: (g) => g.state.stats.totalEarned >= 1e5 },
  { id: "rich2", name: "\u041C\u0430\u0433\u043D\u0430\u0442", desc: "\u0417\u0430\u0440\u0430\u0431\u043E\u0442\u0430\u0439 10M \u0432\u0441\u0435\u0433\u043E", icon: "\u{1F3E6}", reward: { gems: 25 }, check: (g) => g.state.stats.totalEarned >= 1e7 },
  { id: "daily7", name: "\u041F\u043E\u0441\u0442\u043E\u044F\u043D\u0441\u0442\u0432\u043E", desc: "\u0421\u043E\u0431\u0435\u0440\u0438 7-\u0434\u043D\u0435\u0432\u043D\u0443\u044E \u0441\u0435\u0440\u0438\u044E \u0432\u0445\u043E\u0434\u043E\u0432", icon: "\u{1F4C5}", reward: { gems: 20 }, check: (g) => {
    var _a;
    return (((_a = g.state.daily) == null ? void 0 : _a.streak) || 0) >= 7;
  } }
];
function rarityReached(g, order) {
  var _a;
  return ((_a = RARITIES[g.state.stats.bestRarity]) == null ? void 0 : _a.order) >= order;
}
var SUFFIXES = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
function formatShort(n) {
  if (n < 1e3) return Math.floor(n).toString();
  const tier = Math.min(SUFFIXES.length - 1, Math.floor(Math.log10(n) / 3));
  const scaled = n / Math.pow(1e3, tier);
  let str = scaled >= 100 ? scaled.toFixed(0) : scaled >= 10 ? scaled.toFixed(1) : scaled.toFixed(2);
  if (str.indexOf(".") >= 0) str = str.replace(/0+$/, "").replace(/\.$/, "");
  return str + SUFFIXES[tier];
}
