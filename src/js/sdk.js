// ============================================================================
//  Yandex Games SDK wrapper.
//  Gracefully falls back to localStorage + no-op ads when run outside Yandex
//  (e.g. local dev), so the game is always playable.
// ============================================================================

const LS_KEY = 'mineaplanet.save.v1';

class Platform {
  constructor() {
    this.ysdk = null;
    this.player = null;
    this.ready = false;
    this.usesCloud = false;
    this._lastAd = 0;
  }

  async init() {
    if (typeof window.YaGames === 'undefined') {
      // Local / non-Yandex environment.
      this.ready = true;
      return;
    }
    try {
      this.ysdk = await window.YaGames.init();
      this.ready = true;
      // Try to get an authorized player for cloud saves.
      try {
        this.player = await this.ysdk.getPlayer({ scopes: false });
        this.usesCloud = this.player.getMode() !== 'lite';
      } catch (e) {
        this.usesCloud = false;
      }
    } catch (e) {
      console.warn('YaGames init failed, using local mode', e);
      this.ready = true;
    }
  }

  /** Signals the SDK the game has loaded (hides Yandex loader). */
  gameReady() {
    try { this.ysdk?.features?.LoadingAPI?.ready?.(); } catch (e) {}
  }

  /** Marks start/stop of gameplay for the SDK (affects ad pacing). */
  gameplayStart() { try { this.ysdk?.features?.GameplayAPI?.start?.(); } catch (e) {} }
  gameplayStop()  { try { this.ysdk?.features?.GameplayAPI?.stop?.(); } catch (e) {} }

  async save(data) {
    const json = JSON.stringify(data);
    if (this.usesCloud && this.player) {
      try {
        await this.player.setData({ save: json }, true);
        return;
      } catch (e) { /* fall through to local */ }
    }
    try { localStorage.setItem(LS_KEY, json); } catch (e) {}
  }

  async load() {
    if (this.usesCloud && this.player) {
      try {
        const d = await this.player.getData(['save']);
        if (d && d.save) return JSON.parse(d.save);
      } catch (e) { /* fall through */ }
    }
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  /** Fullscreen (interstitial) ad, throttled to Yandex's 60s minimum. */
  showInterstitial({ onOpen, onClose } = {}) {
    const now = Date.now();
    if (now - this._lastAd < 61000) { onClose?.(false); return; }
    this._lastAd = now;
    if (!this.ysdk?.adv) { onClose?.(false); return; }
    this.ysdk.adv.showFullscreenAdv({
      callbacks: {
        onOpen: () => onOpen?.(),
        onClose: (wasShown) => onClose?.(wasShown),
        onError: () => onClose?.(false),
      },
    });
  }

  /** Rewarded video ad. onReward fires only when the video is fully watched. */
  showRewarded({ onReward, onClose } = {}) {
    if (!this.ysdk?.adv) { onReward?.(); onClose?.(); return; }
    let rewarded = false;
    this.ysdk.adv.showRewardedVideo({
      callbacks: {
        onRewarded: () => { rewarded = true; onReward?.(); },
        onClose: () => onClose?.(rewarded),
        onError: () => onClose?.(false),
      },
    });
  }
}

export const platform = new Platform();
