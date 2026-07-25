// ============================================================================
//  Procedural audio engine (WebAudio). No asset files — everything synthesized.
//  SFX + a gentle evolving ambient pad. Respects user mute settings.
// ============================================================================

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.sfxGain = null;
    this.musicGain = null;
    this.soundOn = true;
    this.musicOn = true;
    this._musicNodes = [];
    this._started = false;
    this._lastMine = 0;
  }

  // Lazily create context on first user gesture (autoplay policy).
  _ensure() {
    if (this.ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.6;
      this.sfxGain.connect(this.master);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicOn ? 0.32 : 0;
      this.musicGain.connect(this.master);
      return true;
    } catch (e) { return false; }
  }

  resume() {
    if (!this._ensure()) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (!this._started && this.musicOn) this.startMusic();
  }

  setSound(on) { this.soundOn = on; }
  setMusic(on) {
    this.musicOn = on;
    if (!this.ctx) return;
    if (on) { this.startMusic(); this._ramp(this.musicGain.gain, 0.32, 1.2); }
    else { this._ramp(this.musicGain.gain, 0, 0.6); }
  }

  _ramp(param, to, time) {
    const t = this.ctx.currentTime;
    param.cancelScheduledValues(t);
    param.setValueAtTime(param.value, t);
    param.linearRampToValueAtTime(to, t + time);
  }

  // --- Low-level voice ------------------------------------------------------
  _tone({ freq = 440, type = 'sine', dur = 0.15, gain = 0.3, attack = 0.005,
          slideTo = null, detune = 0, when = 0, dest = null }) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t0 + dur);
    osc.detune.value = detune;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(dest || this.sfxGain);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  _noise({ dur = 0.2, gain = 0.2, when = 0, freq = 1200, q = 1, type = 'bandpass' }) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime + when;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filt = this.ctx.createBiquadFilter();
    filt.type = type; filt.frequency.value = freq; filt.Q.value = q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filt).connect(g).connect(this.sfxGain);
    src.start(t0); src.stop(t0 + dur);
  }

  // --- SFX ------------------------------------------------------------------
  click() { if (this._guard()) return; this._tone({ freq: 520, type: 'triangle', dur: 0.08, gain: 0.25, slideTo: 380 }); }

  mine() {
    if (this._guard()) return;
    const now = performance.now();
    if (now - this._lastMine < 45) return;         // throttle rapid mining
    this._lastMine = now;
    this._noise({ dur: 0.09, gain: 0.12, freq: 2600, q: 2 });
    this._tone({ freq: 240 + Math.random() * 60, type: 'square', dur: 0.06, gain: 0.06, slideTo: 160 });
  }

  sell() {
    if (this._guard()) return;
    [523, 659, 784, 1046].forEach((f, i) => this._tone({ freq: f, type: 'triangle', dur: 0.18, gain: 0.22, when: i * 0.05 }));
    this._tone({ freq: 1568, type: 'sine', dur: 0.25, gain: 0.14, when: 0.2 });
  }

  upgrade() {
    if (this._guard()) return;
    this._tone({ freq: 330, type: 'sawtooth', dur: 0.12, gain: 0.16, slideTo: 660 });
    this._tone({ freq: 660, type: 'triangle', dur: 0.2, gain: 0.16, when: 0.1 });
  }

  planet() {
    if (this._guard()) return;
    [262, 330, 392, 523, 659].forEach((f, i) => this._tone({ freq: f, type: 'sine', dur: 0.4, gain: 0.18, when: i * 0.08 }));
    this._noise({ dur: 0.6, gain: 0.1, freq: 400, q: 0.6, type: 'lowpass', when: 0.1 });
  }

  fuse() {
    if (this._guard()) return;
    this._tone({ freq: 200, type: 'sawtooth', dur: 0.5, gain: 0.16, slideTo: 900 });
    this._noise({ dur: 0.5, gain: 0.14, freq: 3000, q: 1.5 });
    this._tone({ freq: 1200, type: 'sine', dur: 0.3, gain: 0.16, when: 0.42 });
  }

  achievement() {
    if (this._guard()) return;
    [659, 880, 1318].forEach((f, i) => this._tone({ freq: f, type: 'triangle', dur: 0.3, gain: 0.2, when: i * 0.09 }));
  }

  daily() {
    if (this._guard()) return;
    [784, 988, 1318].forEach((f, i) => this._tone({ freq: f, type: 'sine', dur: 0.35, gain: 0.2, when: i * 0.1 }));
  }

  boost() {
    if (this._guard()) return;
    this._tone({ freq: 300, type: 'sawtooth', dur: 0.5, gain: 0.18, slideTo: 1200 });
    this._tone({ freq: 600, type: 'square', dur: 0.3, gain: 0.08, when: 0.1, slideTo: 1400 });
  }

  error() { if (this._guard()) return; this._tone({ freq: 180, type: 'square', dur: 0.15, gain: 0.16, slideTo: 120 }); }

  // Spin: decelerating ticks + a rarity-scaled fanfare at the end.
  spinTicks(durationMs) {
    if (this._guard()) return;
    const dur = durationMs / 1000;
    let t = 0, interval = 0.04;
    while (t < dur - 0.1) {
      this._tone({ freq: 900, type: 'square', dur: 0.03, gain: 0.09, when: t });
      // ease-out: intervals grow toward the end
      const k = t / dur;
      interval = 0.04 + k * k * 0.32;
      t += interval;
    }
  }

  win(order) {
    if (this._guard()) return;
    // Higher rarity -> longer, brighter arpeggio.
    const scales = [
      [523, 659],                       // common
      [523, 659, 784],                  // uncommon
      [523, 659, 784, 1046],            // rare
      [659, 784, 988, 1318],            // epic
      [659, 880, 1046, 1318, 1760],     // legendary
      [784, 988, 1318, 1568, 2093, 2637], // mythic
    ];
    const notes = scales[Math.min(order, 5)];
    notes.forEach((f, i) => this._tone({ freq: f, type: 'triangle', dur: 0.28, gain: 0.2, when: i * 0.07 }));
    if (order >= 4) this._noise({ dur: 0.5, gain: 0.12, freq: 6000, q: 0.7, type: 'highpass', when: 0.1 });
  }

  // --- Ambient music --------------------------------------------------------
  startMusic() {
    if (!this.ctx || this._started) return;
    this._started = true;
    // Two detuned saw oscillators through a slow-swept lowpass = warm pad.
    const filt = this.ctx.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 500; filt.Q.value = 4;
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.value = 0.05; lfoGain.gain.value = 300;
    lfo.connect(lfoGain).connect(filt.frequency);
    lfo.start();
    const padGain = this.ctx.createGain();
    padGain.gain.value = 0.5;
    filt.connect(padGain).connect(this.musicGain);
    const roots = [110, 164.81];            // A2 + E3 drone
    for (const r of roots) {
      const o1 = this.ctx.createOscillator();
      o1.type = 'sawtooth'; o1.frequency.value = r; o1.detune.value = -6;
      const o2 = this.ctx.createOscillator();
      o2.type = 'sawtooth'; o2.frequency.value = r; o2.detune.value = 6;
      o1.connect(filt); o2.connect(filt);
      o1.start(); o2.start();
      this._musicNodes.push(o1, o2);
    }
    this._musicNodes.push(lfo);
    // Sparse bell arpeggio every few seconds for life.
    this._scheduleBells();
  }

  _scheduleBells() {
    if (!this.ctx || !this.musicOn) return;
    const notes = [523.25, 659.25, 783.99, 987.77, 1174.66];
    const n = notes[Math.floor(Math.random() * notes.length)];
    const g = this.ctx.createGain();
    g.connect(this.musicGain);
    const o = this.ctx.createOscillator();
    o.type = 'sine'; o.frequency.value = n;
    const t0 = this.ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.06, t0 + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.5);
    o.connect(g); o.start(t0); o.stop(t0 + 2.6);
    this._bellTimer = setTimeout(() => this._scheduleBells(), 3500 + Math.random() * 4000);
  }

  _guard() {
    if (!this.soundOn) return true;
    if (!this.ctx) this._ensure();
    return !this.ctx;
  }
}

export const audio = new AudioEngine();
