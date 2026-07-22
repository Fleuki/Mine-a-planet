// ============================================================================
//  UI controller: HUD, modals, roulette reel, upgrade tree, planet panel.
// ============================================================================
import {
  UPGRADES, UPGRADE_BRANCHES, RARITIES, RARITY_ORDER, DRONE_BY_ID,
  DRONES_BY_RARITY, PLANETS, ROULETTE, formatShort,
} from './config.js';
import { drawDroneIcon, drawPlanetIcon } from './sprites.js';

const $ = (s) => document.querySelector(s);
const money = (n) => '₡' + formatShort(n);

const UP_ICONS = {
  speed:  '<svg viewBox="0 0 24 24" fill="none"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" fill="#fbbf24"/></svg>',
  gem:    '<svg viewBox="0 0 24 24" fill="none"><path d="M6 3h12l3 6-9 12L3 9l3-6Z" fill="#67e8f9" stroke="#0e7490" stroke-width="1"/></svg>',
  crate:  '<svg viewBox="0 0 24 24" fill="none"><path d="M3 7 12 3l9 4v10l-9 4-9-4V7Z" fill="#c9a06a"/><path d="m3 7 9 4 9-4M12 11v10" stroke="#6b4a25" stroke-width="1.2"/></svg>',
  dock:   '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#38bdf8" stroke-width="2" stroke-dasharray="3 3"/><path d="M12 8v8M8 12h8" stroke="#7dd3fc" stroke-width="2"/></svg>',
  clover: '<svg viewBox="0 0 24 24" fill="#4ade80"><path d="M12 12c-2-3-6-3-6 0s4 3 6 0Zm0 0c2-3 6-3 6 0s-4 3-6 0Zm0 0c-3 2-3 6 0 6s3-4 0-6Zm0 0c3 2 3 6 0 6"/></svg>',
  dice:   '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" fill="#eee"/><circle cx="8" cy="8" r="1.6" fill="#333"/><circle cx="16" cy="8" r="1.6" fill="#333"/><circle cx="12" cy="12" r="1.6" fill="#333"/><circle cx="8" cy="16" r="1.6" fill="#333"/><circle cx="16" cy="16" r="1.6" fill="#333"/></svg>',
  auto:   '<svg viewBox="0 0 24 24" fill="none"><path d="M12 4a8 8 0 1 1-7 4" stroke="#4ade80" stroke-width="2.2" stroke-linecap="round"/><path d="M12 2v5l4-2.5L12 2Z" fill="#4ade80"/></svg>',
  moon:   '<svg viewBox="0 0 24 24"><path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10Z" fill="#c4b5fd"/></svg>',
};

export class UI {
  constructor(game, particles, sdk) {
    this.game = game;
    this.particles = particles;
    this.sdk = sdk;
    this.spinning = false;
    this._bind();
    this.refreshAll();
  }

  _bind() {
    // Rail buttons
    $('#btnRoulette').onclick = () => this.openRoulette();
    $('#btnUpgrades').onclick = () => this.openUpgrades();
    $('#btnPlanet').onclick = () => this.openPlanet();
    $('#sellBtn').onclick = () => this.doSell();
    $('#doSpin').onclick = () => this.doSpin();
    $('#doPlanet').onclick = () => this.doPlanetUpgrade();

    // Close buttons / overlay click-out
    document.querySelectorAll('[data-close]').forEach(b => {
      b.onclick = (e) => { e.target.closest('.overlay').classList.remove('open'); };
    });
    document.querySelectorAll('.overlay').forEach(ov => {
      ov.addEventListener('click', (e) => { if (e.target === ov) ov.classList.remove('open'); });
    });
  }

  // ---- Master refresh ------------------------------------------------------
  refreshAll() {
    this.updateMoney();
    this.updateCargo();
    this.updatePlanetName();
    this.updateInventory();
    this.updateRailCosts();
  }

  updateMoney() {
    $('#moneyVal').textContent = formatShort(this.game.state.money);
    $('#gemsVal').textContent = formatShort(this.game.state.gems);
    this.updateRailCosts();
    this._refreshOpenModals();
  }

  updateRailCosts() {
    const g = this.game;
    $('#rouletteCost').textContent = money(g.spinCost());
    const pc = g.planetCost();
    $('#planetCost').textContent = isFinite(pc) ? money(pc) : 'MAX';
    $('#btnRoulette').classList.toggle('affordable', g.canSpin());
    $('#btnPlanet').classList.toggle('affordable', g.canUpgradePlanet());
  }

  updateCargo() {
    const g = this.game;
    const cap = g.storageCap;
    const pct = Math.min(100, (g.state.ore / cap) * 100);
    $('#cargoFill').style.width = pct + '%';
    $('#cargoText').textContent = `${formatShort(g.state.ore)} / ${formatShort(cap)}`;
    const val = Math.floor(g.state.oreValueAccum);
    $('#sellValue').textContent = money(val);
    $('#sellBtn').disabled = val <= 0;
  }

  updatePlanetName() {
    const p = this.game.planet;
    $('#planetName').querySelector('.pn-title').textContent = p.name;
    $('#planetName').querySelector('.pn-sub').textContent = 'Планета ' + toRoman(this.game.state.planetTier + 1);
  }

  // ---- Inventory hotbar ----------------------------------------------------
  updateInventory() {
    const strip = $('#inventoryStrip');
    strip.innerHTML = '';
    const inv = this.game.state.inventory;
    if (inv.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'inv-empty';
      empty.textContent = 'Пусто — крути рулетку, чтобы получить дронов, затем ставь их на планету';
      strip.appendChild(empty);
      return;
    }
    for (const item of inv) {
      const drone = DRONE_BY_ID[item.droneId];
      const rar = RARITIES[drone.rarity];
      const card = document.createElement('div');
      card.className = 'inv-card';
      card.style.setProperty('--rar', rar.color);
      const cv = document.createElement('canvas');
      cv.className = 'ic-canvas'; cv.style.width = '56px'; cv.style.height = '56px';
      card.appendChild(cv);
      const name = document.createElement('div');
      name.className = 'ic-name'; name.textContent = drone.name;
      card.appendChild(name);
      strip.appendChild(card);
      requestAnimationFrame(() => drawDroneIcon(cv, drone.id));
      card.onclick = () => this.openPlaceFromInventory(item);
    }
  }

  // ---- Sell ----------------------------------------------------------------
  doSell() {
    const val = this.game.sellAll();
    if (val > 0) {
      this.toast(`Продано на ${money(val)}`);
      this.updateMoney();
      this.updateCargo();
    }
  }

  // ---- Roulette ------------------------------------------------------------
  openRoulette() {
    this.renderOdds();
    $('#doSpinCost').textContent = money(this.game.spinCost());
    $('#doSpin').disabled = !this.game.canSpin();
    $('#spinResults').innerHTML = '';
    this._fillReel(28);
    $('#rouletteModal').classList.add('open');
  }

  renderOdds() {
    const luck = 1 + this.game.luckLevel * ROULETTE.luckPerLevel;
    let total = 0;
    const ws = RARITY_ORDER.map(rid => {
      const base = RARITIES[rid].weight;
      const w = base * (RARITIES[rid].order === 0 ? 1 : Math.pow(luck, RARITIES[rid].order));
      total += w; return { rid, w };
    });
    const html = ws.map(({ rid, w }) => {
      const pct = (w / total) * 100;
      const disp = pct >= 1 ? pct.toFixed(0) : pct.toFixed(1);
      return `<span class="chip" style="color:${RARITIES[rid].color}">${RARITIES[rid].name} ${disp}%</span>`;
    }).join('');
    $('#odds').innerHTML = html;
  }

  _fillReel(count, finalDrone) {
    const reel = $('#reel');
    reel.style.transition = 'none';
    reel.style.transform = 'translateX(0)';
    reel.innerHTML = '';
    const items = [];
    for (let i = 0; i < count; i++) {
      const rid = weightedPreviewRarity();
      const pool = DRONES_BY_RARITY[rid];
      const d = pool[Math.floor(Math.random() * pool.length)];
      items.push(d);
    }
    if (finalDrone) items[count - 5] = finalDrone;   // land near the pointer
    for (const d of items) {
      const rar = RARITIES[d.rarity];
      const item = document.createElement('div');
      item.className = 'reel-item';
      const cv = document.createElement('canvas');
      cv.style.width = '68px'; cv.style.height = '68px';
      item.appendChild(cv);
      const nm = document.createElement('div');
      nm.className = 'ri-name'; nm.textContent = d.name; nm.style.color = rar.color;
      item.appendChild(nm);
      reel.appendChild(item);
      requestAnimationFrame(() => drawDroneIcon(cv, d.id));
    }
    return items;
  }

  doSpin() {
    if (this.spinning || !this.game.canSpin()) return;
    const results = this.game.spin();
    if (!results) return;
    this.spinning = true;
    $('#doSpin').disabled = true;
    $('#spinResults').innerHTML = '';
    this.updateMoney();

    // Show the first result on the reel with a spin animation.
    const headline = results[0];
    const items = this._fillReel(30, headline);
    const reel = $('#reel');
    const itemW = 110;
    const targetIndex = 25;                 // where headline sits (count-5)
    const viewport = reel.parentElement.clientWidth;
    const finalX = -(targetIndex * itemW) + viewport / 2 - itemW / 2;

    reel.getBoundingClientRect();           // force reflow
    reel.style.transition = 'transform 3.4s cubic-bezier(.12,.7,.15,1)';
    reel.style.transform = `translateX(${finalX + (Math.random() * 30 - 15)}px)`;

    setTimeout(() => {
      this.spinning = false;
      $('#doSpin').disabled = !this.game.canSpin();
      $('#doSpinCost').textContent = money(this.game.spinCost());
      this._showSpinResults(results);
      // Auto-place drones into free slots (or inventory if full).
      for (const d of results) {
        const idx = this.game.autoPlace(d.id);
        if (idx < 0) { /* went to inventory */ }
      }
      this.updateInventory();
      this.updateRailCosts();
      // celebrate rare pulls
      const best = results.reduce((a, b) => RARITIES[b.rarity].order > RARITIES[a.rarity].order ? b : a);
      if (RARITIES[best.rarity].order >= 3) {
        this.toast(`${RARITIES[best.rarity].name}: ${best.name}!`);
      }
    }, 3500);
  }

  _showSpinResults(results) {
    const box = $('#spinResults');
    box.innerHTML = '';
    results.forEach((d, i) => {
      const rar = RARITIES[d.rarity];
      const card = document.createElement('div');
      card.className = 'result-card';
      card.style.setProperty('--rar', rar.color);
      card.style.animationDelay = (i * 0.08) + 's';
      card.style.boxShadow = `0 0 20px ${hexA(rar.glow, 0.5)}`;
      const cv = document.createElement('canvas');
      cv.style.width = '64px'; cv.style.height = '64px';
      card.appendChild(cv);
      const nm = document.createElement('div');
      nm.className = 'rc-name'; nm.textContent = d.name;
      card.appendChild(nm);
      const rr = document.createElement('div');
      rr.className = 'rc-rar'; rr.textContent = rar.name; rr.style.color = rar.color;
      card.appendChild(rr);
      box.appendChild(card);
      requestAnimationFrame(() => drawDroneIcon(cv, d.id));
    });
  }

  // ---- Upgrades tree -------------------------------------------------------
  openUpgrades() {
    this.renderUpgrades();
    $('#upgradesModal').classList.add('open');
  }

  renderUpgrades() {
    const container = $('#branches');
    container.innerHTML = '';
    for (const [bid, branch] of Object.entries(UPGRADE_BRANCHES)) {
      const col = document.createElement('div');
      col.className = 'branch';
      const head = document.createElement('div');
      head.className = 'branch-head'; head.textContent = branch.name; head.style.color = branch.color;
      col.appendChild(head);
      for (const key of Object.keys(UPGRADES)) {
        const def = UPGRADES[key];
        if (def.branch !== bid) continue;
        col.appendChild(this._upgradeNode(key, def));
      }
      container.appendChild(col);
    }
  }

  _upgradeNode(key, def) {
    const g = this.game;
    const lv = g.state.upgrades[key];
    const maxed = lv >= def.max;
    const cost = g.upgradeCost(key);
    const node = document.createElement('div');
    node.className = 'up-node';
    node.innerHTML = `
      <div class="up-icon">${UP_ICONS[def.icon] || ''}</div>
      <div class="up-main">
        <div class="up-name"><span>${def.name}</span><span class="up-lv">${maxed ? 'MAX' : 'Ур.' + lv}</span></div>
        <div class="up-desc">${def.desc} · <b style="color:#eaf0ff">${def.format(lv)}</b></div>
        <button class="up-buy ${maxed ? 'maxed' : ''}" ${maxed || g.state.money < cost ? 'disabled' : ''}>
          ${maxed ? 'Максимум' : money(cost)}
        </button>
      </div>`;
    const btn = node.querySelector('.up-buy');
    if (!maxed) {
      btn.onclick = () => {
        if (g.buyUpgrade(key)) {
          this.toast(`${def.name} → ${def.format(g.state.upgrades[key])}`);
          this.updateMoney();
          this.updateCargo();
          this.renderUpgrades();
        }
      };
    }
    return node;
  }

  // ---- Planet panel --------------------------------------------------------
  openPlanet() {
    this.renderPlanet();
    $('#planetModal').classList.add('open');
  }

  renderPlanet() {
    const g = this.game;
    const tier = g.state.planetTier;
    const preview = $('#planetPreview');
    const info = $('#planetInfo');
    const btn = $('#doPlanet');

    if (tier >= PLANETS.length - 1) {
      preview.innerHTML = '';
      const cv = document.createElement('canvas'); cv.style.width = '110px'; cv.style.height = '110px';
      preview.appendChild(cv); requestAnimationFrame(() => drawPlanetIcon(cv, tier));
      info.innerHTML = `<div class="maxed-note">Максимальный уровень планеты!<br>«${PLANETS[tier].name}» — вершина эволюции.</div>`;
      btn.style.display = 'none';
      return;
    }
    btn.style.display = '';
    const cur = PLANETS[tier], next = PLANETS[tier + 1];
    preview.innerHTML = '';
    const c1 = document.createElement('canvas'); c1.style.width = '104px'; c1.style.height = '104px';
    const arrow = document.createElement('div'); arrow.className = 'planet-arrow'; arrow.textContent = '→';
    const c2 = document.createElement('canvas'); c2.style.width = '104px'; c2.style.height = '104px';
    preview.append(c1, arrow, c2);
    requestAnimationFrame(() => { drawPlanetIcon(c1, tier); drawPlanetIcon(c2, tier + 1); });

    info.innerHTML = `
      <div class="row"><span>Планета</span><span>${cur.name} <span class="up-arrow">→ ${next.name}</span></span></div>
      <div class="row"><span>Ценность руды</span><span>x${cur.valueMult} <span class="up-arrow">→ x${next.valueMult}</span></span></div>
      <div class="row"><span>Новая руда</span><span class="up-arrow">Открывается ярус ${tier + 1}</span></div>`;
    const cost = g.planetCost();
    $('#doPlanetCost').textContent = money(cost);
    btn.disabled = !g.canUpgradePlanet();
  }

  doPlanetUpgrade() {
    if (this.game.upgradePlanet()) {
      this.toast(`Планета улучшена: ${this.game.planet.name}!`);
      this.updateMoney();
      this.updatePlanetName();
      this.updateCargo();
      this.renderPlanet();
      this.onPlanetChange?.(this.game.state.planetTier);
    }
  }

  doPlanetUpgradeMax() {}

  // ---- Place / manage drone from inventory ---------------------------------
  openPlaceFromInventory(item) {
    const drone = DRONE_BY_ID[item.droneId];
    const rar = RARITIES[drone.rarity];
    $('#placeTitle').textContent = drone.name;
    const body = $('#placeBody');
    body.innerHTML = '';

    const preview = document.createElement('div');
    preview.className = 'place-preview'; preview.style.setProperty('--rar', rar.color);
    const cv = document.createElement('canvas'); cv.style.width = '76px'; cv.style.height = '76px';
    const stats = document.createElement('div'); stats.className = 'place-stats';
    const dps = (drone.power / drone.interval * this.game.miningSpeedMult).toFixed(1);
    stats.innerHTML = `
      <div class="pr-name">${drone.name}</div>
      <div class="pr-rar" style="color:${rar.color}">${rar.name}</div>
      <div>Добыча: <b>${dps}</b> руды/с</div>
      <div>За удар: <b>${drone.power}</b></div>`;
    preview.append(cv, stats);
    body.appendChild(preview);
    requestAnimationFrame(() => drawDroneIcon(cv, drone.id));

    const hasFree = this.game.state.slots.some(s => !s.droneId);
    const actions = document.createElement('div');
    actions.className = 'place-actions';
    const placeBtn = document.createElement('button');
    placeBtn.className = 'btn-place';
    placeBtn.textContent = hasFree ? 'Поставить на планету' : 'Нет свободных доков';
    placeBtn.disabled = !hasFree;
    placeBtn.onclick = () => {
      const idx = this.game.autoPlace(item.droneId, item.uid);
      // remove from inventory (autoPlace with existing uid places it, but the
      // inventory copy remains — remove it here)
      const inv = this.game.state.inventory;
      const at = inv.findIndex(d => d.uid === item.uid);
      if (at >= 0 && idx >= 0) inv.splice(at, 1);
      this.updateInventory();
      $('#placeModal').classList.remove('open');
      this.toast(`${DRONE_BY_ID[item.droneId].name} на посту!`);
    };
    const scrapBtn = document.createElement('button');
    scrapBtn.className = 'btn-scrap';
    const scrapVal = Math.floor(this.game.droneScrapValue(drone));
    scrapBtn.innerHTML = `Разобрать<br>+${money(scrapVal)}`;
    scrapBtn.onclick = () => {
      const inv = this.game.state.inventory;
      const at = inv.findIndex(d => d.uid === item.uid);
      if (at >= 0) inv.splice(at, 1);
      this.game.state.money += scrapVal;
      this.updateMoney();
      this.updateInventory();
      $('#placeModal').classList.remove('open');
      this.toast(`Разобрано: +${money(scrapVal)}`);
    };
    actions.append(placeBtn, scrapBtn);
    body.appendChild(actions);

    const hint = document.createElement('div');
    hint.className = 'place-hint';
    hint.textContent = 'Совет: жми по дрону на планете, чтобы снять или продать его.';
    body.appendChild(hint);

    $('#placeModal').classList.add('open');
  }

  // Called when a placed drone (on the planet ring) is tapped.
  openManageSlot(slotIndex) {
    const slot = this.game.state.slots[slotIndex];
    if (!slot || !slot.droneId) return;
    const drone = DRONE_BY_ID[slot.droneId];
    const rar = RARITIES[drone.rarity];
    $('#placeTitle').textContent = drone.name;
    const body = $('#placeBody');
    body.innerHTML = '';

    const preview = document.createElement('div');
    preview.className = 'place-preview'; preview.style.setProperty('--rar', rar.color);
    const cv = document.createElement('canvas'); cv.style.width = '76px'; cv.style.height = '76px';
    const stats = document.createElement('div'); stats.className = 'place-stats';
    const dps = (drone.power / drone.interval * this.game.miningSpeedMult).toFixed(1);
    stats.innerHTML = `
      <div class="pr-name">${drone.name}</div>
      <div class="pr-rar" style="color:${rar.color}">${rar.name}</div>
      <div>Добыча: <b>${dps}</b> руды/с</div>`;
    preview.append(cv, stats);
    body.appendChild(preview);
    requestAnimationFrame(() => drawDroneIcon(cv, drone.id));

    const actions = document.createElement('div');
    actions.className = 'place-actions';
    const unBtn = document.createElement('button');
    unBtn.className = 'btn-place'; unBtn.textContent = 'Снять в ангар';
    unBtn.onclick = () => {
      this.game.removeDrone(slotIndex);
      this.updateInventory();
      $('#placeModal').classList.remove('open');
    };
    const scrapBtn = document.createElement('button');
    scrapBtn.className = 'btn-scrap';
    const scrapVal = Math.floor(this.game.droneScrapValue(drone));
    scrapBtn.innerHTML = `Продать<br>+${money(scrapVal)}`;
    scrapBtn.onclick = () => {
      this.game.sellDrone(slotIndex);
      this.updateMoney();
      $('#placeModal').classList.remove('open');
      this.toast(`Продано: +${money(scrapVal)}`);
    };
    actions.append(unBtn, scrapBtn);
    body.appendChild(actions);

    $('#placeModal').classList.add('open');
  }

  // ---- Offline ----
  showOffline(result) {
    const mins = Math.floor(result.seconds / 60);
    const h = Math.floor(mins / 60), m = mins % 60;
    const timeStr = h > 0 ? `${h}ч ${m}м` : `${m}м`;
    $('#offlineText').innerHTML = `Пока вас не было (${timeStr}), дроны намайнили:<br><span class="earn">+${money(result.earned)}</span>`;
    $('#offlineModal').classList.add('open');
  }

  // ---- Toast ----
  toast(text) {
    const t = document.createElement('div');
    t.className = 'toast'; t.textContent = text;
    $('#toasts').appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  _refreshOpenModals() {
    if ($('#upgradesModal').classList.contains('open')) this.renderUpgrades();
    if ($('#planetModal').classList.contains('open')) this.renderPlanet();
    if ($('#rouletteModal').classList.contains('open') && !this.spinning) {
      $('#doSpin').disabled = !this.game.canSpin();
      $('#doSpinCost').textContent = money(this.game.spinCost());
    }
  }
}

// --- helpers ----------------------------------------------------------------
function hexA(hex, a) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

function weightedPreviewRarity() {
  // For visual reel filler — biased to common but shows variety.
  let total = 0;
  const t = RARITY_ORDER.map(r => { const w = RARITIES[r].weight; total += w; return { r, w }; });
  let x = Math.random() * total;
  for (const it of t) { x -= it.w; if (x <= 0) return it.r; }
  return 'common';
}

function toRoman(num) {
  const map = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let r = '';
  for (const [v, s] of map) while (num >= v) { r += s; num -= v; }
  return r || 'I';
}
