/* ==========================================================================
   ui.js — All DOM/HUD wiring: modals, hotbar, inventory, upgrades, roulette.

   Loaded as a classic script from index.html; every top-level binding here is
   shared with the other modules. Load order matters — see index.html.
   ========================================================================== */
var $ = (s) => document.querySelector(s);
var money = (n) => "\u20A1" + formatShort(n);
var UP_ICONS = {
  speed: '<svg viewBox="0 0 24 24" fill="none"><path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" fill="#fbbf24"/></svg>',
  gem: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 3h12l3 6-9 12L3 9l3-6Z" fill="#67e8f9" stroke="#0e7490" stroke-width="1"/></svg>',
  crate: '<svg viewBox="0 0 24 24" fill="none"><path d="M3 7 12 3l9 4v10l-9 4-9-4V7Z" fill="#c9a06a"/><path d="m3 7 9 4 9-4M12 11v10" stroke="#6b4a25" stroke-width="1.2"/></svg>',
  dock: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#38bdf8" stroke-width="2" stroke-dasharray="3 3"/><path d="M12 8v8M8 12h8" stroke="#7dd3fc" stroke-width="2"/></svg>',
  clover: '<svg viewBox="0 0 24 24" fill="#4ade80"><path d="M12 12c-2-3-6-3-6 0s4 3 6 0Zm0 0c2-3 6-3 6 0s-4 3-6 0Zm0 0c-3 2-3 6 0 6s3-4 0-6Zm0 0c3 2 3 6 0 6"/></svg>',
  dice: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="4" fill="#eee"/><circle cx="8" cy="8" r="1.6" fill="#333"/><circle cx="16" cy="8" r="1.6" fill="#333"/><circle cx="12" cy="12" r="1.6" fill="#333"/><circle cx="8" cy="16" r="1.6" fill="#333"/><circle cx="16" cy="16" r="1.6" fill="#333"/></svg>',
  auto: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 4a8 8 0 1 1-7 4" stroke="#4ade80" stroke-width="2.2" stroke-linecap="round"/><path d="M12 2v5l4-2.5L12 2Z" fill="#4ade80"/></svg>',
  moon: '<svg viewBox="0 0 24 24"><path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10Z" fill="#c4b5fd"/></svg>',
  deploy: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 2 4 6v6c0 4.4 3.4 8.3 8 10 4.6-1.7 8-5.6 8-10V6l-8-4Z" fill="#38bdf8" opacity=".25"/><path d="m8.5 12 2.5 2.5L16 9" stroke="#7dd3fc" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};
var UI = class {
  constructor(game2, particles2, sdk) {
    this.game = game2;
    this.particles = particles2;
    this.sdk = sdk;
    this.spinning = false;
    this._achQueue = [];
    this._lastOffline = null;
    this._hangarSort = "rarity";
    this._hangarFilter = "all";
    this._bind();
    this._applySettings();
    this.refreshAll();
  }
  _bind() {
    $("#btnRoulette").onclick = () => {
      audio.click();
      this.openRoulette();
    };
    $("#btnUpgrades").onclick = () => {
      audio.click();
      this.openUpgrades();
    };
    $("#btnFuse").onclick = () => {
      audio.click();
      this.openFuse();
    };
    $("#btnPlanet").onclick = () => {
      audio.click();
      this.openPlanet();
    };
    $("#sellBtn").onclick = () => this.doSell();
    $("#doSpin").onclick = () => this.doSpin();
    $("#doPlanet").onclick = () => this.doPlanetUpgrade();
    $("#btnDaily").onclick = () => {
      audio.click();
      this.openDaily();
    };
    $("#btnAch").onclick = () => {
      audio.click();
      this.openAchievements();
    };
    $("#btnCollection").onclick = () => {
      audio.click();
      this.openCollection();
    };
    $("#btnHangar").onclick = () => {
      audio.click();
      this.openHangar();
    };
    $("#btnEquipBest").onclick = () => {
      const n = this.game.autoEquipBest();
      if (n > 0) {
        audio.upgrade();
        this.toast("Лучшие дроны экипированы!");
        this.updateInventory();
        this.renderHangar();
        this.game.evaluateAchievements();
      } else {
        audio.error();
        this.toast("Уже стоят лучшие дроны");
      }
    };
    $("#btnBoost").onclick = () => {
      audio.click();
      this.openBoost();
    };
    $("#btnSound").onclick = () => this.toggleSound();
    $("#claimDaily").onclick = () => this.doClaimDaily();
    $("#offlineDouble").onclick = () => this.doOfflineDouble();
    document.querySelectorAll("[data-close]").forEach((b) => {
      b.onclick = (e) => {
        audio.click();
        e.target.closest(".overlay").classList.remove("open");
      };
    });
    document.querySelectorAll(".overlay").forEach((ov) => {
      ov.addEventListener("click", (e) => {
        if (e.target === ov) ov.classList.remove("open");
      });
    });
  }
  _applySettings() {
    const s = this.game.state.settings || (this.game.state.settings = { sound: true, music: true });
    audio.setSound(s.sound !== false);
    audio.musicOn = s.music !== false;
    this._updateSoundIcon();
  }
  _updateSoundIcon() {
    var _a;
    const on2 = ((_a = this.game.state.settings) == null ? void 0 : _a.sound) !== false;
    $("#soundIcon").textContent = on2 ? "\u{1F50A}" : "\u{1F507}";
  }
  toggleSound() {
    const s = this.game.state.settings;
    s.sound = !(s.sound !== false);
    s.music = s.sound;
    audio.setSound(s.sound);
    audio.setMusic(s.music);
    if (s.sound) audio.resume();
    this._updateSoundIcon();
    audio.click();
  }
  // ---- Master refresh ------------------------------------------------------
  refreshAll() {
    this.updateMoney();
    this.updateCargo();
    this.updatePlanetName();
    this.updateInventory();
    this.updateRailCosts();
    this.updateBadges();
    this.updateBoostTimer();
    this.updateEventBanner();
  }
  updateMoney() {
    $("#moneyVal").textContent = formatShort(this.game.state.money);
    $("#gemsVal").textContent = formatShort(this.game.state.gems);
    this.updateRailCosts();
    this._refreshOpenModals();
  }
  updateBadges() {
    const daily = this.game.dailyStatus();
    $("#dailyBadge").classList.toggle("show", daily.canClaim);
    $("#dailyBadge").textContent = daily.canClaim ? "!" : "";
    $("#btnDaily").classList.toggle("pulse", daily.canClaim);
    const prog = this.game.achievementProgress();
    const left = prog.total - prog.done;
  }
  updateBoostTimer() {
    const el = $("#boostTimer");
    if (this.game.boostActive()) {
      el.classList.add("show");
      const s = this.game.boostRemaining();
      $("#boostTime").textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    } else {
      el.classList.remove("show");
    }
  }
  updateEventBanner() {
    const el = $("#eventBanner");
    if (this.game.eventActive()) {
      const ev = this.game.currentEvent();
      const acc = ev.theme.accent || "#ff6b3d";
      el.classList.add("show");
      el.style.setProperty("--eb-accent", acc);
      el.style.setProperty("--eb-glow", hexA2(acc, 0.5));
      $("#eventIcon").textContent = ev.icon;
      $("#eventName").textContent = ev.name;
      $("#eventBonus").textContent = ev.desc;
      const s = this.game.eventRemaining();
      $("#eventTime").textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    } else {
      el.classList.remove("show");
    }
  }
  onEventStart(ev) {
    audio.achievement();
    this.toast(`${ev.icon} ${ev.name}! ${ev.desc}`);
    this.updateEventBanner();
    if ($("#rouletteModal").classList.contains("open")) this.renderOdds();
  }
  onEventEnd(ev, gems) {
    this.toast(`${ev.name} \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u043E \xB7 +${gems} \u25C6`);
    this.updateMoney();
    this.updateEventBanner();
    if ($("#rouletteModal").classList.contains("open")) this.renderOdds();
  }
  updateRailCosts() {
    const g = this.game;
    $("#rouletteCost").textContent = money(g.spinCost());
    const pc = g.planetCost();
    $("#planetCost").textContent = isFinite(pc) ? money(pc) : "MAX";
    $("#btnRoulette").classList.toggle("affordable", g.canSpin());
    $("#btnPlanet").classList.toggle("affordable", g.canUpgradePlanet());
  }
  updateCargo() {
    const g = this.game;
    const cap = g.storageCap;
    const pct = Math.min(100, g.state.ore / cap * 100);
    $("#cargoFill").style.width = pct + "%";
    $("#cargoText").textContent = `${formatShort(g.state.ore)} / ${formatShort(cap)}`;
    const val = Math.floor(g.state.oreValueAccum);
    $("#sellValue").textContent = money(val);
    $("#sellBtn").disabled = val <= 0;
  }
  updatePlanetName() {
    const p = this.game.planet;
    $("#planetName").querySelector(".pn-title").textContent = p.name;
    $("#planetName").querySelector(".pn-sub").textContent = "\u041F\u043B\u0430\u043D\u0435\u0442\u0430 " + toRoman(this.game.state.planetTier + 1);
  }
  // ---- Inventory hotbar ----------------------------------------------------
  updateInventory() {
    const strip = $("#inventoryStrip");
    strip.innerHTML = "";
    const inv = this.game.state.inventory;
    if (inv.length === 0) {
      const empty = document.createElement("div");
      empty.className = "inv-empty";
      empty.textContent = "\u041F\u0443\u0441\u0442\u043E \u2014 \u043A\u0440\u0443\u0442\u0438 \u0440\u0443\u043B\u0435\u0442\u043A\u0443, \u0447\u0442\u043E\u0431\u044B \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0434\u0440\u043E\u043D\u043E\u0432, \u0437\u0430\u0442\u0435\u043C \u0441\u0442\u0430\u0432\u044C \u0438\u0445 \u043D\u0430 \u043F\u043B\u0430\u043D\u0435\u0442\u0443";
      strip.appendChild(empty);
      return;
    }
    const sorted = [...inv].sort((a, b) => {
      const da = DRONE_BY_ID[a.droneId], db = DRONE_BY_ID[b.droneId];
      const oa = RARITIES[da.rarity].order, ob = RARITIES[db.rarity].order;
      if (ob !== oa) return ob - oa;
      const pa = da.power * droneStarMult(a.star || 0) / da.interval;
      const pb = db.power * droneStarMult(b.star || 0) / db.interval;
      return pb - pa;
    });
    for (const item of sorted) {
      const drone = DRONE_BY_ID[item.droneId];
      const rar = RARITIES[drone.rarity];
      const card = document.createElement("div");
      card.className = "inv-card";
      card.style.setProperty("--rar", rar.color);
      const cv = document.createElement("canvas");
      cv.className = "ic-canvas";
      cv.style.width = "56px";
      cv.style.height = "56px";
      card.appendChild(cv);
      const name = document.createElement("div");
      name.className = "ic-name";
      name.textContent = drone.name;
      card.appendChild(name);
      strip.appendChild(card);
      const st = item.star || 0;
      requestAnimationFrame(() => drawDroneIcon(cv, drone.id, st));
      card.onclick = () => this.openPlaceFromInventory(item);
    }
  }
  // ---- Sell ----------------------------------------------------------------
  doSell() {
    const val = this.game.sellAll();
    if (val > 0) {
      audio.sell();
      this.toast(`\u041F\u0440\u043E\u0434\u0430\u043D\u043E \u043D\u0430 ${money(val)}`);
      this.updateMoney();
      this.updateCargo();
      this.game.evaluateAchievements();
    } else {
      audio.error();
    }
  }
  // ---- Roulette ------------------------------------------------------------
  openRoulette() {
    this.renderOdds();
    $("#doSpinCost").textContent = money(this.game.spinCost());
    $("#multiTag").textContent = this.game.rollCount > 1 ? `\xD7${this.game.rollCount}` : "";
    $("#doSpin").disabled = !this.game.canSpin();
    $("#spinResults").innerHTML = "";
    this._buildReels(this.game.rollCount);
    $("#rouletteModal").classList.add("open");
  }
  renderOdds() {
    const luck = this.game.luckFactor();
    let total = 0;
    const ws = RARITY_ORDER.map((rid) => {
      const base = RARITIES[rid].weight;
      const exp = Math.min(RARITIES[rid].order, LUCK_MAX_EXPONENT);
      const w = base * (exp === 0 ? 1 : Math.pow(luck, exp));
      total += w;
      return { rid, w };
    });
    const html = ws.map(({ rid, w }) => {
      const pct = w / total * 100;
      const disp = pct >= 1 ? pct.toFixed(0) : pct.toFixed(1);
      return `<span class="chip" style="color:${RARITIES[rid].color}">${RARITIES[rid].name} ${disp}%</span>`;
    }).join("");
    $("#odds").innerHTML = html;
  }
  // Build `n` stacked reel rows (one per rolled drone), sized to fit the
  // viewport. When `finals` is given, each reel is seeded to land on its own
  // result near the pointer. Returns [{reel, itemW}] for the animator.
  _buildReels(n, finals) {
    n = Math.max(1, Math.min(n, 6));
    const stack = $("#reelStack");
    stack.innerHTML = "";
    const rowH = n <= 1 ? 116 : n === 2 ? 76 : n === 3 ? 60 : n === 4 ? 52 : 46;
    const iconSize = Math.round(rowH * 0.58);
    const itemW = Math.round(Math.max(78, Math.min(120, rowH * 1.35)));
    const reels = [];
    for (let r = 0; r < n; r++) {
      const row = document.createElement("div");
      row.className = "reel-row";
      row.style.height = rowH + "px";
      const reel = document.createElement("div");
      reel.className = "reel";
      row.appendChild(reel);
      stack.appendChild(row);
      this._populateReel(reel, 30, itemW, iconSize, finals ? finals[r] : null);
      reels.push({ reel, itemW });
    }
    return reels;
  }
  _populateReel(reel, count, itemW, iconSize, finalDrone) {
    reel.style.transition = "none";
    reel.style.transform = "translateX(0)";
    reel.innerHTML = "";
    const items = [];
    for (let i = 0; i < count; i++) {
      const rid = weightedPreviewRarity();
      const pool = DRONES_BY_RARITY[rid];
      items.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    if (finalDrone) items[count - 5] = finalDrone;
    for (const d of items) {
      const rar = RARITIES[d.rarity];
      const item = document.createElement("div");
      item.className = "reel-item";
      item.style.flex = `0 0 ${itemW}px`;
      const cv = document.createElement("canvas");
      cv.style.width = iconSize + "px";
      cv.style.height = iconSize + "px";
      item.appendChild(cv);
      const nm = document.createElement("div");
      nm.className = "ri-name";
      nm.textContent = d.name;
      nm.style.color = rar.color;
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
    $("#doSpin").disabled = true;
    $("#spinResults").innerHTML = "";
    this.updateMoney();
    const reels = this._buildReels(results.length, results);
    const viewport = $("#reelViewport").clientWidth;
    const targetIndex = 25;
    let maxMs = 0;
    reels.forEach((rr, i) => {
      const finalX = -(targetIndex * rr.itemW) + viewport / 2 - rr.itemW / 2;
      rr.reel.getBoundingClientRect();
      const dur = 2.9 + i * 0.4;
      maxMs = Math.max(maxMs, dur * 1e3);
      rr.reel.style.transition = `transform ${dur}s cubic-bezier(.12,.7,.15,1)`;
      rr.reel.style.transform = `translateX(${finalX + (Math.random() * 24 - 12)}px)`;
    });
    audio.spinTicks(maxMs);
    setTimeout(() => {
      this.spinning = false;
      $("#doSpin").disabled = !this.game.canSpin();
      $("#doSpinCost").textContent = money(this.game.spinCost());
      this._showSpinResults(results);
      for (const d of results) this.game.autoPlace(d.id);
      this.updateInventory();
      this.updateRailCosts();
      const best = results.reduce((a, b) => RARITIES[b.rarity].order > RARITIES[a.rarity].order ? b : a);
      audio.win(RARITIES[best.rarity].order);
      if (RARITIES[best.rarity].order >= 3) {
        this.toast(`${RARITIES[best.rarity].name}: ${best.name}!`);
      }
      this.game.evaluateAchievements();
    }, maxMs + 200);
  }
  _showSpinResults(results) {
    const box = $("#spinResults");
    box.innerHTML = "";
    results.forEach((d, i) => {
      const rar = RARITIES[d.rarity];
      const card = document.createElement("div");
      card.className = "result-card";
      card.style.setProperty("--rar", rar.color);
      card.style.animationDelay = i * 0.08 + "s";
      card.style.boxShadow = `0 0 20px ${hexA2(rar.glow, 0.5)}`;
      const cv = document.createElement("canvas");
      cv.style.width = "64px";
      cv.style.height = "64px";
      card.appendChild(cv);
      const nm = document.createElement("div");
      nm.className = "rc-name";
      nm.textContent = d.name;
      card.appendChild(nm);
      const rr = document.createElement("div");
      rr.className = "rc-rar";
      rr.textContent = rar.name;
      rr.style.color = rar.color;
      card.appendChild(rr);
      box.appendChild(card);
      requestAnimationFrame(() => drawDroneIcon(cv, d.id));
    });
  }
  // ---- Upgrades tree -------------------------------------------------------
  openUpgrades() {
    this.renderUpgrades();
    $("#upgradesModal").classList.add("open");
  }
  renderUpgrades() {
    const container = $("#branches");
    container.innerHTML = "";
    for (const [bid, branch] of Object.entries(UPGRADE_BRANCHES)) {
      const col = document.createElement("div");
      col.className = "branch";
      const head = document.createElement("div");
      head.className = "branch-head";
      head.textContent = branch.name;
      head.style.color = branch.color;
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
    const node = document.createElement("div");
    node.className = "up-node";
    node.innerHTML = `
    <div class="up-top">
      <div class="up-icon">${UP_ICONS[def.icon] || ""}</div>
      <div class="up-main">
        <div class="up-name"><span class="up-nm">${def.name}</span><span class="up-lv ${maxed ? "max" : ""}">${maxed ? "MAX" : "\u0423\u0440." + lv}</span></div>
        <div class="up-desc">${def.desc} \xB7 <b style="color:#eaf0ff">${def.format(lv)}</b></div>
      </div>
    </div>
    <button class="up-buy ${maxed ? "maxed" : ""}" ${maxed || g.state.money < cost ? "disabled" : ""}>
      ${maxed ? "\u041C\u0430\u043A\u0441\u0438\u043C\u0443\u043C" : money(cost)}
    </button>`;
    const btn = node.querySelector(".up-buy");
    if (!maxed) {
      btn.onclick = () => {
        if (g.buyUpgrade(key)) {
          audio.upgrade();
          this.toast(`${def.name} \u2192 ${def.format(g.state.upgrades[key])}`);
          this.updateMoney();
          this.updateCargo();
          this.renderUpgrades();
          this.game.evaluateAchievements();
        } else {
          audio.error();
        }
      };
    }
    return node;
  }
  // ---- Planet panel --------------------------------------------------------
  openPlanet() {
    this.renderPlanet();
    $("#planetModal").classList.add("open");
  }
  renderPlanet() {
    const g = this.game;
    const tier = g.state.planetTier;
    const preview = $("#planetPreview");
    const info = $("#planetInfo");
    const btn = $("#doPlanet");
    if (tier >= PLANETS.length - 1) {
      preview.innerHTML = "";
      const cv = document.createElement("canvas");
      cv.style.width = "110px";
      cv.style.height = "110px";
      preview.appendChild(cv);
      requestAnimationFrame(() => drawPlanetIcon(cv, tier));
      info.innerHTML = `<div class="maxed-note">\u041C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u044B\u0439 \u0443\u0440\u043E\u0432\u0435\u043D\u044C \u043F\u043B\u0430\u043D\u0435\u0442\u044B!<br>\xAB${PLANETS[tier].name}\xBB \u2014 \u0432\u0435\u0440\u0448\u0438\u043D\u0430 \u044D\u0432\u043E\u043B\u044E\u0446\u0438\u0438.</div>`;
      btn.style.display = "none";
      return;
    }
    btn.style.display = "";
    const cur = PLANETS[tier], next = PLANETS[tier + 1];
    preview.innerHTML = "";
    const c1 = document.createElement("canvas");
    c1.style.width = "104px";
    c1.style.height = "104px";
    const arrow = document.createElement("div");
    arrow.className = "planet-arrow";
    arrow.textContent = "\u2192";
    const c2 = document.createElement("canvas");
    c2.style.width = "104px";
    c2.style.height = "104px";
    preview.append(c1, arrow, c2);
    requestAnimationFrame(() => {
      drawPlanetIcon(c1, tier);
      drawPlanetIcon(c2, tier + 1);
    });
    info.innerHTML = `
    <div class="row"><span>\u041F\u043B\u0430\u043D\u0435\u0442\u0430</span><span>${cur.name} <span class="up-arrow">\u2192 ${next.name}</span></span></div>
    <div class="row"><span>\u0426\u0435\u043D\u043D\u043E\u0441\u0442\u044C \u0440\u0443\u0434\u044B</span><span>x${cur.valueMult} <span class="up-arrow">\u2192 x${next.valueMult}</span></span></div>
    <div class="row"><span>\u041D\u043E\u0432\u0430\u044F \u0440\u0443\u0434\u0430</span><span class="up-arrow">\u041E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u044F\u0440\u0443\u0441 ${tier + 1}</span></div>`;
    const cost = g.planetCost();
    $("#doPlanetCost").textContent = money(cost);
    btn.disabled = !g.canUpgradePlanet();
  }
  doPlanetUpgrade() {
    var _a;
    if (this.game.upgradePlanet()) {
      audio.planet();
      this.toast(`\u041F\u043B\u0430\u043D\u0435\u0442\u0430 \u0443\u043B\u0443\u0447\u0448\u0435\u043D\u0430: ${this.game.planet.name}!`);
      this.updateMoney();
      this.updatePlanetName();
      this.updateCargo();
      this.renderPlanet();
      (_a = this.onPlanetChange) == null ? void 0 : _a.call(this, this.game.state.planetTier);
      this.game.evaluateAchievements();
    } else {
      audio.error();
    }
  }
  // ---- Place / manage drone from inventory ---------------------------------
  openPlaceFromInventory(item) {
    const drone = DRONE_BY_ID[item.droneId];
    const rar = RARITIES[drone.rarity];
    const star = item.star || 0;
    $("#placeTitle").textContent = drone.name;
    const body = $("#placeBody");
    body.innerHTML = "";
    const preview = document.createElement("div");
    preview.className = "place-preview";
    preview.style.setProperty("--rar", rar.color);
    const cv = document.createElement("canvas");
    cv.style.width = "76px";
    cv.style.height = "76px";
    const stats = document.createElement("div");
    stats.className = "place-stats";
    const mult = droneStarMult(star);
    const dps = (drone.power * mult / drone.interval * this.game.miningSpeedMult).toFixed(1);
    stats.innerHTML = `
    <div class="pr-name">${drone.name} ${star > 0 ? `<span style="color:#ffd54a">${starStr(star)}</span>` : ""}</div>
    <div class="pr-rar" style="color:${rar.color}">${rar.name}</div>
    <div>\u0414\u043E\u0431\u044B\u0447\u0430: <b>${dps}</b> \u0440\u0443\u0434\u044B/\u0441</div>
    <div>\u0417\u0430 \u0443\u0434\u0430\u0440: <b>${Math.round(drone.power * mult)}</b></div>`;
    preview.append(cv, stats);
    body.appendChild(preview);
    requestAnimationFrame(() => drawDroneIcon(cv, drone.id, star));
    const freeSlots = this.game.state.slots.filter((s) => !s.droneId).length;
    const hasFree = freeSlots > 0;
    const copies = this.game.inventoryCount(item.droneId, star);
    const batch = Math.min(this.game.deployCount, copies, freeSlots);
    const actions = document.createElement("div");
    actions.className = "place-actions";
    const placeBtn = document.createElement("button");
    placeBtn.className = "btn-place";
    placeBtn.textContent = !hasFree ? "\u041D\u0435\u0442 \u0441\u0432\u043E\u0431\u043E\u0434\u043D\u044B\u0445 \u0434\u043E\u043A\u043E\u0432" : batch > 1 ? `\u041F\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \xD7${batch}` : "\u041F\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u043D\u0430 \u043F\u043B\u0430\u043D\u0435\u0442\u0443";
    placeBtn.disabled = !hasFree;
    placeBtn.onclick = () => {
      const n = this.game.deployDrones(item.droneId, star, this.game.deployCount);
      this.updateInventory();
      $("#placeModal").classList.remove("open");
      this.toast(n > 1 ? `${drone.name} \xD7${n} \u043D\u0430 \u043F\u043E\u0441\u0442\u0443!` : `${drone.name} \u043D\u0430 \u043F\u043E\u0441\u0442\u0443!`);
      this.game.evaluateAchievements();
    };
    const scrapBtn = document.createElement("button");
    scrapBtn.className = "btn-scrap";
    const scrapVal = Math.floor(this.game.droneScrapValue(drone, star));
    scrapBtn.innerHTML = `\u0420\u0430\u0437\u043E\u0431\u0440\u0430\u0442\u044C<br>+${money(scrapVal)}`;
    scrapBtn.onclick = () => {
      const inv = this.game.state.inventory;
      const at = inv.findIndex((d) => d.uid === item.uid);
      if (at >= 0) inv.splice(at, 1);
      this.game.state.money += scrapVal;
      this.updateMoney();
      this.updateInventory();
      $("#placeModal").classList.remove("open");
      this.toast(`\u0420\u0430\u0437\u043E\u0431\u0440\u0430\u043D\u043E: +${money(scrapVal)}`);
    };
    actions.append(placeBtn, scrapBtn);
    body.appendChild(actions);
    const hint = document.createElement("div");
    hint.className = "place-hint";
    hint.textContent = "\u0421\u043E\u0432\u0435\u0442: \u0436\u043C\u0438 \u043F\u043E \u0434\u0440\u043E\u043D\u0443 \u043D\u0430 \u043F\u043B\u0430\u043D\u0435\u0442\u0435, \u0447\u0442\u043E\u0431\u044B \u0441\u043D\u044F\u0442\u044C \u0438\u043B\u0438 \u043F\u0440\u043E\u0434\u0430\u0442\u044C \u0435\u0433\u043E.";
    body.appendChild(hint);
    $("#placeModal").classList.add("open");
  }
  // ---- Dock picker: choose which hangar drone fills a tapped empty dock -----
  openPicker(slotIndex) {
    const inv = this.game.state.inventory;
    if (inv.length === 0) {
      this.toast("\u041A\u0440\u0443\u0442\u0438 \u0440\u0443\u043B\u0435\u0442\u043A\u0443, \u0447\u0442\u043E\u0431\u044B \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0434\u0440\u043E\u043D\u043E\u0432");
      return;
    }
    const groups = /* @__PURE__ */ new Map();
    for (const it of inv) {
      const star = it.star || 0;
      const key = it.droneId + ":" + star;
      if (!groups.has(key)) groups.set(key, { droneId: it.droneId, star, count: 0 });
      groups.get(key).count++;
    }
    const list = [...groups.values()].sort((a, b) => {
      const da = DRONE_BY_ID[a.droneId], db = DRONE_BY_ID[b.droneId];
      const oa = RARITIES[da.rarity].order, ob = RARITIES[db.rarity].order;
      if (ob !== oa) return ob - oa;
      const pa = da.power * droneStarMult(a.star) / da.interval;
      const pb = db.power * droneStarMult(b.star) / db.interval;
      return pb - pa;
    });
    const freeSlots = this.game.state.slots.filter((s) => !s.droneId).length;
    const deploy = this.game.deployCount;
    $("#pickTitle").textContent = "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0431\u0443\u0440 \u0434\u043B\u044F \u0434\u043E\u043A\u0430";
    $("#pickSub").textContent = deploy > 1 ? `\u041C\u0443\u043B\u044C\u0442\u0438-\u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0430: \u0434\u043E ${deploy}\xD7 \u0437\u0430 \u0440\u0430\u0437` : "\u041F\u0440\u043E\u043A\u0430\u0447\u0430\u0439 \xAB\u041C\u0443\u043B\u044C\u0442\u0438-\u0443\u0441\u0442\u0430\u043D\u043E\u0432\u043A\u0443\xBB, \u0447\u0442\u043E\u0431\u044B \u0441\u0442\u0430\u0432\u0438\u0442\u044C \u043D\u0435\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u0440\u0430\u0437\u0443";
    const grid = $("#pickGrid");
    grid.innerHTML = "";
    for (const g of list) {
      const drone = DRONE_BY_ID[g.droneId];
      const rar = RARITIES[drone.rarity];
      const batch = Math.min(deploy, g.count, freeSlots);
      const dps = (drone.power * droneStarMult(g.star) / drone.interval * this.game.miningSpeedMult).toFixed(1);
      const card = document.createElement("div");
      card.className = "pick-card";
      card.style.setProperty("--rar", rar.color);
      const cv = document.createElement("canvas");
      cv.className = "pk-canvas";
      cv.style.width = "54px";
      cv.style.height = "54px";
      card.appendChild(cv);
      const info = document.createElement("div");
      info.className = "pk-info";
      info.innerHTML = `
      <div class="pk-name">${drone.name} ${g.star > 0 ? `<span style="color:#ffd54a">${starStr(g.star)}</span>` : ""}</div>
      <div class="pk-rar" style="color:${rar.color}">${rar.name} \xB7 ${dps}/\u0441</div>`;
      card.appendChild(info);
      const qty = document.createElement("div");
      qty.className = "pk-qty";
      qty.innerHTML = `\xD7${g.count}${batch > 1 ? `<span class="pk-batch">\u0441\u0442\u0430\u0432\u0438\u0442 ${batch}</span>` : ""}`;
      card.appendChild(qty);
      grid.appendChild(card);
      requestAnimationFrame(() => drawDroneIcon(cv, drone.id, g.star));
      card.onclick = () => {
        const n = this.game.deployDrones(g.droneId, g.star, this.game.deployCount, slotIndex);
        if (n <= 0) {
          audio.error();
          return;
        }
        audio.upgrade();
        this.updateInventory();
        $("#pickModal").classList.remove("open");
        this.toast(n > 1 ? `${drone.name} \xD7${n} \u043D\u0430 \u043F\u043E\u0441\u0442\u0443!` : `${drone.name} \u043D\u0430 \u043F\u043E\u0441\u0442\u0443!`);
        this.game.evaluateAchievements();
      };
    }
    $("#pickModal").classList.add("open");
  }
  // Called when a placed drone (on the planet ring) is tapped.
  openManageSlot(slotIndex) {
    const slot = this.game.state.slots[slotIndex];
    if (!slot || !slot.droneId) return;
    const drone = DRONE_BY_ID[slot.droneId];
    const rar = RARITIES[drone.rarity];
    $("#placeTitle").textContent = drone.name;
    const body = $("#placeBody");
    body.innerHTML = "";
    const star = slot.star || 0;
    const preview = document.createElement("div");
    preview.className = "place-preview";
    preview.style.setProperty("--rar", rar.color);
    const cv = document.createElement("canvas");
    cv.style.width = "76px";
    cv.style.height = "76px";
    const stats = document.createElement("div");
    stats.className = "place-stats";
    const mult = droneStarMult(star);
    const dps = (drone.power * mult / drone.interval * this.game.miningSpeedMult).toFixed(1);
    stats.innerHTML = `
    <div class="pr-name">${drone.name} ${star > 0 ? `<span style="color:#ffd54a">${starStr(star)}</span>` : ""}</div>
    <div class="pr-rar" style="color:${rar.color}">${rar.name}</div>
    <div>\u0414\u043E\u0431\u044B\u0447\u0430: <b>${dps}</b> \u0440\u0443\u0434\u044B/\u0441</div>`;
    preview.append(cv, stats);
    body.appendChild(preview);
    requestAnimationFrame(() => drawDroneIcon(cv, drone.id, star));
    const actions = document.createElement("div");
    actions.className = "place-actions";
    const unBtn = document.createElement("button");
    unBtn.className = "btn-place";
    unBtn.textContent = "\u0421\u043D\u044F\u0442\u044C \u0432 \u0430\u043D\u0433\u0430\u0440";
    unBtn.onclick = () => {
      this.game.removeDrone(slotIndex);
      this.updateInventory();
      $("#placeModal").classList.remove("open");
    };
    const scrapBtn = document.createElement("button");
    scrapBtn.className = "btn-scrap";
    const scrapVal = Math.floor(this.game.droneScrapValue(drone, star));
    scrapBtn.innerHTML = `\u041F\u0440\u043E\u0434\u0430\u0442\u044C<br>+${money(scrapVal)}`;
    scrapBtn.onclick = () => {
      this.game.sellDrone(slotIndex);
      this.updateMoney();
      $("#placeModal").classList.remove("open");
      this.toast(`\u041F\u0440\u043E\u0434\u0430\u043D\u043E: +${money(scrapVal)}`);
    };
    actions.append(unBtn, scrapBtn);
    body.appendChild(actions);
    $("#placeModal").classList.add("open");
  }
  // ---- Fusion --------------------------------------------------------------
  openFuse() {
    this.renderFuse();
    $("#fuseModal").classList.add("open");
  }
  renderFuse() {
    const list = $("#fuseList");
    list.innerHTML = "";
    let any = false;
    const groups = this.game.starGroups();
    if (groups.length) {
      any = true;
      list.appendChild(sectionHead("\u2B50 \u0417\u0432\u0451\u0437\u0434\u044B \u2014 \u0441\u043B\u0438\u044F\u043D\u0438\u0435 \u043E\u0434\u0438\u043D\u0430\u043A\u043E\u0432\u044B\u0445"));
      for (const g of groups) {
        const drone = DRONE_BY_ID[g.droneId];
        const rar = RARITIES[drone.rarity];
        const row = document.createElement("div");
        row.className = "fuse-row";
        row.style.setProperty("--rar", rar.color);
        const cv = document.createElement("canvas");
        cv.className = "fr-icon";
        cv.style.width = "46px";
        cv.style.height = "46px";
        const info = document.createElement("div");
        info.className = "fr-info";
        info.innerHTML = `
        <div class="fr-rar" style="color:${rar.color}">${drone.name} ${starStr(g.star)}</div>
        <div class="fr-count">\u0412 \u0430\u043D\u0433\u0430\u0440\u0435: ${g.count} \xB7 \u043D\u0443\u0436\u043D\u043E ${STAR.need}</div>`;
        const arrow = document.createElement("div");
        arrow.className = "fr-arrow";
        arrow.innerHTML = `${starStr(g.star)}\u2192${starStr(g.star + 1)}`;
        const btn = document.createElement("button");
        btn.className = "fuse-btn-do star";
        btn.textContent = "\u0421\u043B\u0438\u0442\u044C \u2605";
        btn.disabled = g.count < STAR.need;
        btn.onclick = () => this.doFuseStars(g.droneId, g.star);
        row.append(cv, info, arrow, btn);
        list.appendChild(row);
        requestAnimationFrame(() => drawDroneIcon(cv, drone.id, g.star));
      }
    }
    const counts = this.game.fusionCounts();
    const rankRows = [];
    for (const rid of RARITY_ORDER) {
      const c = counts[rid];
      if (c <= 0) continue;
      rankRows.push({ rid, c });
    }
    if (rankRows.length) {
      any = true;
      list.appendChild(sectionHead("\u{1F53A} \u0420\u0430\u043D\u0433 \u2014 \u0441\u043B\u0438\u044F\u043D\u0438\u0435 \u043F\u043E \u0440\u0435\u0434\u043A\u043E\u0441\u0442\u0438 (0\u2605)"));
      for (const { rid, c } of rankRows) {
        const rar = RARITIES[rid];
        const isMythic = rar.order >= RARITY_ORDER.length - 1;
        const nextName = isMythic ? `${FUSION.mythicGemReward} \u25C6` : RARITIES[RARITY_ORDER[rar.order + 1]].name;
        const can = c >= FUSION.need;
        const row = document.createElement("div");
        row.className = "fuse-row";
        row.style.setProperty("--rar", rar.color);
        row.innerHTML = `
        <div class="fr-info">
          <div class="fr-rar">${rar.name}</div>
          <div class="fr-count">\u0412 \u0430\u043D\u0433\u0430\u0440\u0435: ${c} \xB7 \u043D\u0443\u0436\u043D\u043E ${FUSION.need}</div>
        </div>
        <div class="fr-arrow">${FUSION.need}\xD7 \u2192 ${nextName}</div>
        <button class="fuse-btn-do" ${can ? "" : "disabled"}>\u0421\u043F\u043B\u0430\u0432\u0438\u0442\u044C</button>`;
        row.querySelector(".fuse-btn-do").onclick = () => this.doFuse(rid);
        list.appendChild(row);
      }
    }
    if (!any) {
      const e = document.createElement("div");
      e.className = "fuse-empty";
      e.textContent = "\u0412 \u0430\u043D\u0433\u0430\u0440\u0435 \u043D\u0435\u0442 \u0441\u0432\u043E\u0431\u043E\u0434\u043D\u044B\u0445 \u0434\u0440\u043E\u043D\u043E\u0432. \u0421\u043D\u0438\u043C\u0430\u0439 \u0434\u0443\u0431\u043B\u0435\u0439 \u0441 \u043F\u043B\u0430\u043D\u0435\u0442\u044B \u0438\u043B\u0438 \u043A\u0440\u0443\u0442\u0438 \u0440\u0443\u043B\u0435\u0442\u043A\u0443, \u0447\u0442\u043E\u0431\u044B \u043A\u043E\u043F\u0438\u0442\u044C \u0434\u0440\u043E\u043D\u043E\u0432 \u0434\u043B\u044F \u0441\u043B\u0438\u044F\u043D\u0438\u044F.";
      list.appendChild(e);
    }
  }
  doFuse(rarity) {
    const res = this.game.fuse(rarity);
    if (!res) {
      audio.error();
      return;
    }
    audio.fuse();
    if (res.result) {
      const d = res.result;
      this.game.autoPlace(d.id);
      this.toast(`\u0421\u043B\u0438\u044F\u043D\u0438\u0435: ${RARITIES[d.rarity].name} ${d.name}!`);
    } else if (res.gems) {
      this.toast(`\u041F\u0435\u0440\u0435\u0440\u0430\u0431\u043E\u0442\u043A\u0430: +${res.gems} \u25C6`);
    }
    this.updateMoney();
    this.updateInventory();
    this.renderFuse();
    this.game.evaluateAchievements();
  }
  doFuseStars(droneId, star) {
    const res = this.game.fuseStars(droneId, star);
    if (!res) {
      audio.error();
      return;
    }
    audio.fuse();
    const d = DRONE_BY_ID[droneId];
    this.toast(`${d.name} \u2192 ${starStr(res.star)}!`);
    this.updateMoney();
    this.updateInventory();
    this.renderFuse();
    this.game.evaluateAchievements();
  }
  // ---- Achievements --------------------------------------------------------
  openAchievements() {
    this.renderAchievements();
    $("#achModal").classList.add("open");
  }
  renderAchievements() {
    var _a, _b;
    const prog = this.game.achievementProgress();
    $("#achCount").textContent = `${prog.done}/${prog.total}`;
    const list = $("#achList");
    list.innerHTML = "";
    for (const a of ACHIEVEMENTS) {
      const done = !!this.game.state.achievements[a.id];
      const item = document.createElement("div");
      item.className = "ach-item" + (done ? " done" : "");
      const reward = ((_a = a.reward) == null ? void 0 : _a.gems) ? `+${a.reward.gems} \u25C6` : ((_b = a.reward) == null ? void 0 : _b.money) ? `+${money(a.reward.money)}` : "";
      item.innerHTML = `
      <div class="ai-icon">${a.icon}</div>
      <div class="ai-main">
        <div class="ai-name">${a.name}</div>
        <div class="ai-desc">${a.desc}</div>
        <div class="ai-reward">${done ? "\u2713 \u041F\u043E\u043B\u0443\u0447\u0435\u043D\u043E" : reward}</div>
      </div>`;
      list.appendChild(item);
    }
  }
  // Called from main when an achievement unlocks.
  onAchievement(a) {
    var _a, _b;
    audio.achievement();
    const reward = ((_a = a.reward) == null ? void 0 : _a.gems) ? `+${a.reward.gems} \u25C6` : ((_b = a.reward) == null ? void 0 : _b.money) ? `+${money(a.reward.money)}` : "";
    this.toast(`\u{1F3C6} ${a.name} \xB7 ${reward}`);
    this.updateMoney();
  }
  // ---- Collection / Drone Index --------------------------------------------
  openCollection() {
    this.renderCollection();
    $("#collectionModal").classList.add("open");
  }
  renderCollection() {
    var _a;
    const g = this.game;
    const { done, total } = g.dexCount();
    const sets = g.completedSetCount();
    const bonus = Math.round((g.collectionMult() - 1) * 100);
    $("#colCount").textContent = `${done}/${total}`;
    $("#colBonus").innerHTML = `\u0421\u043E\u0431\u0440\u0430\u043D\u043E \u043D\u0430\u0431\u043E\u0440\u043E\u0432: <b>${sets}</b> \xB7 \u0431\u043E\u043D\u0443\u0441 \u043A \u0434\u043E\u0445\u043E\u0434\u0443 <b style="color:#4ade80">+${bonus}%</b>`;
    const wrap = $("#colList");
    wrap.innerHTML = "";
    for (const rid of RARITY_ORDER) {
      const rar = RARITIES[rid];
      const pool = DRONES_BY_RARITY[rid] || [];
      if (!pool.length) continue;
      const owned = pool.filter((d) => {
        var _a2;
        return (_a2 = g.state.dex) == null ? void 0 : _a2[d.id];
      }).length;
      const complete = owned === pool.length;
      const section = document.createElement("div");
      section.className = "col-section";
      const head = document.createElement("div");
      head.className = "col-head";
      const setReward = COLLECTION.setGems[rid] || 0;
      head.innerHTML = `
      <span class="col-rar" style="color:${rar.color}">${rar.name}</span>
      <span class="col-frac">${owned}/${pool.length}${complete ? " \u2713" : ` \xB7 +${setReward}\u25C6`}</span>`;
      section.appendChild(head);
      const grid = document.createElement("div");
      grid.className = "col-grid";
      for (const d of pool) {
        const found = !!((_a = g.state.dex) == null ? void 0 : _a[d.id]);
        const cell = document.createElement("div");
        cell.className = "col-cell" + (found ? "" : " locked");
        cell.style.setProperty("--rar", rar.color);
        if (found) {
          const cv = document.createElement("canvas");
          cv.className = "cc-canvas";
          cv.style.width = "48px";
          cv.style.height = "48px";
          cell.appendChild(cv);
          const nm = document.createElement("div");
          nm.className = "cc-name";
          nm.textContent = d.name;
          cell.appendChild(nm);
          requestAnimationFrame(() => drawDroneIcon(cv, d.id));
        } else {
          cell.innerHTML = `<div class="cc-lock">?</div><div class="cc-name">???</div>`;
        }
        grid.appendChild(cell);
      }
      section.appendChild(grid);
      wrap.appendChild(section);
    }
  }
  // Called when a new drone is discovered (may complete a rarity set).
  onDex(payload) {
    const events = (payload == null ? void 0 : payload.events) || [];
    for (const ev of events) {
      if (ev.type === "set") {
        const rar = RARITIES[ev.rarity];
        audio.achievement();
        this.toast(`\u{1F4D6} \u041D\u0430\u0431\u043E\u0440 \xAB${rar.name}\xBB \u0441\u043E\u0431\u0440\u0430\u043D! +${ev.gems} \u25C6`);
      } else if (ev.type === "full") {
        audio.achievement();
        this.toast(`\u{1F3C5} \u041F\u043E\u043B\u043D\u044B\u0439 \u0438\u043D\u0434\u0435\u043A\u0441 \u0434\u0440\u043E\u043D\u043E\u0432! +${ev.gems} \u25C6`);
      }
    }
    this.updateMoney();
    if ($("#collectionModal").classList.contains("open")) this.renderCollection();
  }
  // ---- Hangar management (sort / filter / bulk scrap) ----------------------
  openHangar() {
    this.renderHangar();
    $("#hangarModal").classList.add("open");
  }
  renderHangar() {
    const g = this.game;
    const inv = g.state.inventory;
    $("#hangarCount").textContent = `${inv.length}`;
    const sorts = [["rarity", "\u0420\u0435\u0434\u043A\u043E\u0441\u0442\u044C"], ["power", "\u0421\u0438\u043B\u0430"], ["count", "\u041A\u043E\u043B-\u0432\u043E"]];
    const sortBox = $("#hangarSort");
    sortBox.innerHTML = "";
    for (const [id, label] of sorts) {
      const b = document.createElement("button");
      b.className = "hg-chip" + (this._hangarSort === id ? " active" : "");
      b.textContent = label;
      b.onclick = () => {
        this._hangarSort = id;
        audio.click();
        this.renderHangar();
      };
      sortBox.appendChild(b);
    }
    const present = g.inventoryRarities();
    if (this._hangarFilter !== "all" && !present.includes(this._hangarFilter)) this._hangarFilter = "all";
    const filterBox = $("#hangarFilter");
    filterBox.innerHTML = "";
    const allChip = document.createElement("button");
    allChip.className = "hg-chip" + (this._hangarFilter === "all" ? " active" : "");
    allChip.textContent = "\u0412\u0441\u0435";
    allChip.onclick = () => {
      this._hangarFilter = "all";
      audio.click();
      this.renderHangar();
    };
    filterBox.appendChild(allChip);
    for (const rid of present) {
      const b = document.createElement("button");
      b.className = "hg-chip" + (this._hangarFilter === rid ? " active" : "");
      b.textContent = RARITIES[rid].name;
      b.style.color = RARITIES[rid].color;
      b.onclick = () => {
        this._hangarFilter = rid;
        audio.click();
        this.renderHangar();
      };
      filterBox.appendChild(b);
    }
    const scrapBox = $("#hangarScrapBtns");
    scrapBox.innerHTML = "";
    const orders = present.map((r) => RARITIES[r].order);
    const minOrder = orders.length ? Math.min(...orders) : 0;
    const maxOrder = orders.length ? Math.max(...orders) : 0;
    let anyScrap = false;
    for (let o = minOrder + 1; o <= maxOrder; o++) {
      const rid = RARITY_ORDER[o];
      const belowCount = inv.filter((it) => RARITIES[DRONE_BY_ID[it.droneId].rarity].order < o).length;
      if (belowCount <= 0) continue;
      anyScrap = true;
      const b = document.createElement("button");
      b.className = "hg-scrap-btn";
      b.style.borderColor = hexA2(RARITIES[rid].color, 0.6);
      b.innerHTML = `< ${RARITIES[rid].name} <span class="hg-scrap-n">${belowCount}</span>`;
      b.onclick = () => {
        const res = g.scrapBelowRarity(o);
        if (res.count > 0) {
          audio.sell();
          this.toast(`\u0420\u0430\u0437\u043E\u0431\u0440\u0430\u043D\u043E ${res.count} \xB7 +${money(res.money)}`);
          this.updateMoney();
          this.updateInventory();
          this.renderHangar();
        } else audio.error();
      };
      scrapBox.appendChild(b);
    }
    if (!anyScrap) {
      const note = document.createElement("span");
      note.className = "hg-scrap-none";
      note.textContent = "\u043D\u0435\u0442 \u0434\u0440\u043E\u043D\u043E\u0432 \u0434\u043B\u044F \u043C\u0430\u0441\u0441\u043E\u0432\u043E\u0439 \u0440\u0430\u0437\u0431\u043E\u0440\u043A\u0438";
      scrapBox.appendChild(note);
    }
    const grid = $("#hangarGrid");
    grid.innerHTML = "";
    const groups = g.inventoryGroups(this._hangarSort, this._hangarFilter);
    if (groups.length === 0) {
      const e = document.createElement("div");
      e.className = "fuse-empty";
      e.textContent = "\u0410\u043D\u0433\u0430\u0440 \u043F\u0443\u0441\u0442. \u041A\u0440\u0443\u0442\u0438 \u0440\u0443\u043B\u0435\u0442\u043A\u0443, \u0447\u0442\u043E\u0431\u044B \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0434\u0440\u043E\u043D\u043E\u0432.";
      grid.appendChild(e);
    }
    const freeSlots = g.state.slots.filter((s) => !s.droneId).length;
    for (const grp of groups) {
      const drone = DRONE_BY_ID[grp.droneId];
      const rar = RARITIES[drone.rarity];
      const dps = (drone.power * droneStarMult(grp.star) / drone.interval * g.miningSpeedMult).toFixed(1);
      const scrapEach = Math.floor(g.droneScrapValue(drone, grp.star));
      const card = document.createElement("div");
      card.className = "hg-card";
      card.style.setProperty("--rar", rar.color);
      card.innerHTML = `
      <canvas class="hg-canvas" style="width:52px;height:52px"></canvas>
      <div class="hg-info">
        <div class="hg-name">${drone.name} ${grp.star > 0 ? `<span style="color:#ffd54a">${starStr(grp.star)}</span>` : ""}</div>
        <div class="hg-rar" style="color:${rar.color}">${rar.name} \xB7 ${dps}/\u0441 \xB7 \xD7${grp.count}</div>
      </div>
      <div class="hg-actions">
        <button class="hg-place">\u0421\u0442\u0430\u0432\u0438\u0442\u044C</button>
        <button class="hg-scrap1">\u0420\u0430\u0437\u043E\u0431\u0440\u0430\u0442\u044C<br>+${money(scrapEach)}</button>
      </div>`;
      const cv = card.querySelector(".hg-canvas");
      requestAnimationFrame(() => drawDroneIcon(cv, drone.id, grp.star));
      const placeBtn = card.querySelector(".hg-place");
      placeBtn.disabled = freeSlots <= 0;
      placeBtn.onclick = () => {
        const n = g.deployDrones(grp.droneId, grp.star, g.deployCount);
        if (n <= 0) {
          audio.error();
          return;
        }
        audio.upgrade();
        this.toast(n > 1 ? `${drone.name} \xD7${n} \u043D\u0430 \u043F\u043E\u0441\u0442\u0443!` : `${drone.name} \u043D\u0430 \u043F\u043E\u0441\u0442\u0443!`);
        this.updateInventory();
        this.renderHangar();
        this.game.evaluateAchievements();
      };
      card.querySelector(".hg-scrap1").onclick = () => {
        const res = g.scrapGroup(grp.droneId, grp.star);
        if (res.count <= 0) {
          audio.error();
          return;
        }
        audio.sell();
        this.toast(`\u0420\u0430\u0437\u043E\u0431\u0440\u0430\u043D\u043E ${res.count} \xB7 +${money(res.money)}`);
        this.updateMoney();
        this.updateInventory();
        this.renderHangar();
      };
      grid.appendChild(card);
    }
  }
  // ---- Daily ---------------------------------------------------------------
  openDaily() {
    this.renderDaily();
    $("#dailyModal").classList.add("open");
  }
  renderDaily() {
    const st = this.game.dailyStatus();
    const grid = $("#dailyGrid");
    grid.innerHTML = "";
    DAILY_REWARDS.forEach((r, i) => {
      const tile = document.createElement("div");
      let cls = "daily-tile";
      if (i < st.dayIndex) cls += " claimed";
      else if (i === st.dayIndex && st.canClaim) cls += " today";
      else if (i > st.dayIndex) cls += " locked";
      else if (i === st.dayIndex && !st.canClaim) cls += " claimed";
      tile.className = cls;
      const amt = r.gems ? `${r.gems} \u25C6` : money(r.money);
      const checked = i < st.dayIndex || i === st.dayIndex && !st.canClaim;
      tile.innerHTML = `
      ${checked ? '<div class="dt-check">\u2713</div>' : ""}
      <div class="dt-day">\u0414\u0435\u043D\u044C ${r.day}</div>
      <div class="dt-icon">${r.icon}</div>
      <div class="dt-amt">${amt}</div>`;
      grid.appendChild(tile);
    });
    const btn = $("#claimDaily");
    btn.disabled = !st.canClaim;
    btn.textContent = st.canClaim ? "\u0417\u0430\u0431\u0440\u0430\u0442\u044C \u043D\u0430\u0433\u0440\u0430\u0434\u0443" : "\u0423\u0436\u0435 \u0437\u0430\u0431\u0440\u0430\u043D\u043E \u2014 \u043F\u0440\u0438\u0445\u043E\u0434\u0438 \u0437\u0430\u0432\u0442\u0440\u0430";
  }
  doClaimDaily() {
    const res = this.game.claimDaily();
    if (!res) {
      audio.error();
      return;
    }
    audio.daily();
    const r = res.reward;
    const amt = r.gems ? `+${r.gems} \u25C6` : `+${money(r.money)}`;
    this.toast(`\u0414\u0435\u043D\u044C ${res.day}: ${amt}${r.boost ? " + \u0411\u0443\u0441\u0442!" : ""}`);
    this.updateMoney();
    this.updateBadges();
    this.updateBoostTimer();
    this.renderDaily();
    this.game.evaluateAchievements();
  }
  // ---- Boost / gem shop ----------------------------------------------------
  openBoost() {
    this.renderBoost();
    $("#boostModal").classList.add("open");
  }
  renderBoost() {
    const list = $("#boostList");
    list.innerHTML = "";
    const gems = this.game.state.gems;
    const active = this.game.boostActive();
    const mins = Math.floor(BOOST.duration / 60);
    const c1 = document.createElement("div");
    c1.className = "boost-card";
    c1.innerHTML = `
    <div class="bc-icon">\u26A1</div>
    <div class="bc-main">
      <div class="bc-name">\u0423\u0441\u043A\u043E\u0440\u0438\u0442\u0435\u043B\u044C \u27152</div>
      <div class="bc-desc">\u0423\u0434\u0432\u0430\u0438\u0432\u0430\u0435\u0442 \u0432\u0435\u0441\u044C \u0434\u043E\u0445\u043E\u0434 \u043D\u0430 ${mins} \u043C\u0438\u043D${active ? ' \xB7 <b style="color:#ffd54a">\u0430\u043A\u0442\u0438\u0432\u0435\u043D</b>' : ""}</div>
    </div>
    <button class="btn-ad" id="boostAd">\u0421\u043C\u043E\u0442\u0440\u0435\u0442\u044C</button>`;
    c1.querySelector("#boostAd").onclick = () => this.watchBoostAd();
    list.appendChild(c1);
    const c2 = document.createElement("div");
    c2.className = "boost-card";
    c2.innerHTML = `
    <div class="bc-icon">\u26A1</div>
    <div class="bc-main">
      <div class="bc-name">\u0423\u0441\u043A\u043E\u0440\u0438\u0442\u0435\u043B\u044C \u27152 \u0437\u0430 \u0433\u0435\u043C\u044B</div>
      <div class="bc-desc">${mins} \u043C\u0438\u043D \u0434\u0432\u043E\u0439\u043D\u043E\u0433\u043E \u0434\u043E\u0445\u043E\u0434\u0430 \u0431\u0435\u0437 \u0440\u0435\u043A\u043B\u0430\u043C\u044B</div>
    </div>
    <button class="btn-gem" id="boostGem" ${gems < BOOST.gemCost ? "disabled" : ""}>${BOOST.gemCost} \u25C6</button>`;
    c2.querySelector("#boostGem").onclick = () => {
      if (this.game.state.gems < BOOST.gemCost) {
        audio.error();
        return;
      }
      this.game.state.gems -= BOOST.gemCost;
      this.game.activateBoost(BOOST.duration);
      audio.boost();
      this.updateMoney();
      this.updateBoostTimer();
      this.renderBoost();
      this.toast("\u0423\u0441\u043A\u043E\u0440\u0438\u0442\u0435\u043B\u044C \u27152 \u0430\u043A\u0442\u0438\u0432\u0435\u043D!");
    };
    list.appendChild(c2);
    const c3 = document.createElement("div");
    c3.className = "boost-card";
    c3.innerHTML = `
    <div class="bc-icon">\u{1F340}</div>
    <div class="bc-main">
      <div class="bc-name">\u0423\u0434\u0430\u0447\u043D\u044B\u0439 \u0441\u043F\u0438\u043D</div>
      <div class="bc-desc">\u0413\u0430\u0440\u0430\u043D\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0439 \u0434\u0440\u043E\u043D \u042D\u043F\u0438\u043A \u0438\u043B\u0438 \u0432\u044B\u0448\u0435</div>
    </div>
    <button class="btn-gem" id="luckyGem" ${gems < GEM_SHOP.luckySpinCost ? "disabled" : ""}>${GEM_SHOP.luckySpinCost} \u25C6</button>`;
    c3.querySelector("#luckyGem").onclick = () => this.doLuckySpin();
    list.appendChild(c3);
  }
  watchBoostAd() {
    var _a;
    const grant = () => {
      this.game.activateBoost(BOOST.duration);
      audio.boost();
      this.updateBoostTimer();
      this.renderBoost();
      this.toast("\u0423\u0441\u043A\u043E\u0440\u0438\u0442\u0435\u043B\u044C \u27152 \u0430\u043A\u0442\u0438\u0432\u0435\u043D!");
    };
    if ((_a = this.sdk) == null ? void 0 : _a.showRewarded) {
      this.sdk.showRewarded({ onReward: grant, onClose: () => {
      } });
    } else {
      grant();
    }
  }
  doLuckySpin() {
    const d = this.game.luckySpin();
    if (!d) {
      audio.error();
      return;
    }
    audio.win(RARITIES[d.rarity].order);
    this.game.autoPlace(d.id);
    this.updateMoney();
    this.updateInventory();
    this.renderBoost();
    this.toast(`\u0423\u0434\u0430\u0447\u043D\u044B\u0439 \u0441\u043F\u0438\u043D: ${RARITIES[d.rarity].name} ${d.name}!`);
    this.game.evaluateAchievements();
  }
  // ---- Offline ----
  showOffline(result) {
    this._lastOffline = result;
    const mins = Math.floor(result.seconds / 60);
    const h = Math.floor(mins / 60), m = mins % 60;
    const timeStr = h > 0 ? `${h}\u0447 ${m}\u043C` : `${m}\u043C`;
    $("#offlineText").innerHTML = `\u041F\u043E\u043A\u0430 \u0432\u0430\u0441 \u043D\u0435 \u0431\u044B\u043B\u043E (${timeStr}), \u0434\u0440\u043E\u043D\u044B \u043D\u0430\u043C\u0430\u0439\u043D\u0438\u043B\u0438:<br><span class="earn">+${money(result.earned)}</span>`;
    $("#offlineDouble").style.display = "";
    $("#offlineModal").classList.add("open");
  }
  doOfflineDouble() {
    var _a;
    const res = this._lastOffline;
    if (!res) return;
    const grant = () => {
      this.game.addMoney(res.earned);
      audio.sell();
      this.toast(`\u0423\u0434\u0432\u043E\u0435\u043D\u043E: +${money(res.earned)}`);
      this.updateMoney();
      $("#offlineModal").classList.remove("open");
    };
    this._lastOffline = null;
    if ((_a = this.sdk) == null ? void 0 : _a.showRewarded) {
      this.sdk.showRewarded({ onReward: grant, onClose: () => {
      } });
    } else {
      grant();
    }
  }
  // ---- Toast ----
  toast(text) {
    const t = document.createElement("div");
    t.className = "toast";
    t.textContent = text;
    $("#toasts").appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }
  _refreshOpenModals() {
    if ($("#upgradesModal").classList.contains("open")) this.renderUpgrades();
    if ($("#planetModal").classList.contains("open")) this.renderPlanet();
    if ($("#boostModal").classList.contains("open")) this.renderBoost();
    if ($("#rouletteModal").classList.contains("open") && !this.spinning) {
      $("#doSpin").disabled = !this.game.canSpin();
      $("#doSpinCost").textContent = money(this.game.spinCost());
    }
  }
};
function hexA2(hex, a) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`;
}
function weightedPreviewRarity() {
  let total = 0;
  const t = RARITY_ORDER.map((r) => {
    const w = RARITIES[r].weight;
    total += w;
    return { r, w };
  });
  let x = Math.random() * total;
  for (const it of t) {
    x -= it.w;
    if (x <= 0) return it.r;
  }
  return "common";
}
function toRoman(num) {
  const map = [[10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let r = "";
  for (const [v, s] of map) while (num >= v) {
    r += s;
    num -= v;
  }
  return r || "I";
}
function starStr(n) {
  return `${n}\u2605`;
}
function sectionHead(text) {
  const d = document.createElement("div");
  d.className = "fuse-section";
  d.textContent = text;
  return d;
}
