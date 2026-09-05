/* ==========================================================================
   sdk.js — Yandex Games SDK bridge: init, ads, leaderboards, save/load fallbacks.

   Loaded as a classic script from index.html; every top-level binding here is
   shared with the other modules. Load order matters — see index.html.
   ========================================================================== */
var LS_KEY = "mineaplanet.save.v1";
var Platform = class {
  constructor() {
    this.ysdk = null;
    this.player = null;
    this.ready = false;
    this.usesCloud = false;
    this._lastAd = 0;
  }
  async init() {
    if (typeof window.YaGames === "undefined") {
      this.ready = true;
      return;
    }
    try {
      this.ysdk = await window.YaGames.init();
      this.ready = true;
      try {
        this.player = await this.ysdk.getPlayer({ scopes: false });
        this.usesCloud = this.player.getMode() !== "lite";
      } catch (e) {
        this.usesCloud = false;
      }
    } catch (e) {
      console.warn("YaGames init failed, using local mode", e);
      this.ready = true;
    }
  }
  /** Signals the SDK the game has loaded (hides Yandex loader). */
  gameReady() {
    var _a, _b, _c, _d;
    try {
      (_d = (_c = (_b = (_a = this.ysdk) == null ? void 0 : _a.features) == null ? void 0 : _b.LoadingAPI) == null ? void 0 : _c.ready) == null ? void 0 : _d.call(_c);
    } catch (e) {
    }
  }
  /** Marks start/stop of gameplay for the SDK (affects ad pacing). */
  gameplayStart() {
    var _a, _b, _c, _d;
    try {
      (_d = (_c = (_b = (_a = this.ysdk) == null ? void 0 : _a.features) == null ? void 0 : _b.GameplayAPI) == null ? void 0 : _c.start) == null ? void 0 : _d.call(_c);
    } catch (e) {
    }
  }
  gameplayStop() {
    var _a, _b, _c, _d;
    try {
      (_d = (_c = (_b = (_a = this.ysdk) == null ? void 0 : _a.features) == null ? void 0 : _b.GameplayAPI) == null ? void 0 : _c.stop) == null ? void 0 : _d.call(_c);
    } catch (e) {
    }
  }
  async save(data) {
    const json = JSON.stringify(data);
    if (this.usesCloud && this.player) {
      try {
        await this.player.setData({ save: json }, true);
        return;
      } catch (e) {
      }
    }
    try {
      localStorage.setItem(LS_KEY, json);
    } catch (e) {
    }
  }
  /**
   * Wipes the save from wherever it lives. Like the other Platform methods it
   * must never throw — the standalone build depends on these fallbacks.
   */
  async clear() {
    if (this.usesCloud && this.player) {
      try {
        await this.player.setData({ save: "" }, true);
      } catch (e) {
      }
    }
    try {
      localStorage.removeItem(LS_KEY);
    } catch (e) {
    }
  }
  async load() {
    if (this.usesCloud && this.player) {
      try {
        const d = await this.player.getData(["save"]);
        if (d && d.save) return JSON.parse(d.save);
      } catch (e) {
      }
    }
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }
  /** Fullscreen (interstitial) ad, throttled to Yandex's 60s minimum. */
  showInterstitial({ onOpen, onClose } = {}) {
    var _a;
    const now = Date.now();
    if (now - this._lastAd < 61e3) {
      onClose == null ? void 0 : onClose(false);
      return;
    }
    this._lastAd = now;
    if (!((_a = this.ysdk) == null ? void 0 : _a.adv)) {
      onClose == null ? void 0 : onClose(false);
      return;
    }
    this.ysdk.adv.showFullscreenAdv({
      callbacks: {
        onOpen: () => onOpen == null ? void 0 : onOpen(),
        onClose: (wasShown) => onClose == null ? void 0 : onClose(wasShown),
        onError: () => onClose == null ? void 0 : onClose(false)
      }
    });
  }
  /** Rewarded video ad. onReward fires only when the video is fully watched. */
  showRewarded({ onReward, onClose } = {}) {
    var _a;
    if (!((_a = this.ysdk) == null ? void 0 : _a.adv)) {
      onReward == null ? void 0 : onReward();
      onClose == null ? void 0 : onClose();
      return;
    }
    let rewarded = false;
    this.ysdk.adv.showRewardedVideo({
      callbacks: {
        onRewarded: () => {
          rewarded = true;
          onReward == null ? void 0 : onReward();
        },
        onClose: () => onClose == null ? void 0 : onClose(rewarded),
        onError: () => onClose == null ? void 0 : onClose(false)
      }
    });
  }
};
var platform = new Platform();
