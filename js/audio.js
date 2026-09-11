/* =====================================================================
   Áudio 100 % sintetizado (Web Audio). Zero arquivos de som = app leve.
   Aqui: contexto, barramentos (efeitos / música com volumes separados) e
   efeitos sonoros reativos ao combo. A música mora em js/music.js.
   ===================================================================== */
window.HR = window.HR || {};

HR.Audio = {
  ctx: null, master: null, sfxGain: null, musicGain: null, unlocked: false, noiseBuf: null, intensity: 0,

  init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination);
    this.sfxGain = this.ctx.createGain(); this.sfxGain.connect(this.master);
    this.musicGain = this.ctx.createGain(); this.musicGain.connect(this.master);
    const len = this.ctx.sampleRate * 1;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.applySettings();
  },

  unlock() {
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.unlocked = true;
    if (HR.Music) { HR.Music.init(); if (HR.Store.data.settings.music) HR.Music.resume(); }
  },
  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend(); },
  resume() { if (this.ctx && this.unlocked && this.ctx.state === 'suspended') this.ctx.resume(); },

  applySettings() {
    if (!this.ctx) return;
    const s = HR.Store.data.settings;
    const sv = s.sfxVol == null ? 1 : s.sfxVol, mv = s.musicVol == null ? 0.8 : s.musicVol;
    this.sfxGain.gain.setTargetAtTime(s.sound ? sv : 0, this.ctx.currentTime, 0.05);
    this.musicGain.gain.setTargetAtTime(s.music ? mv : 0, this.ctx.currentTime, 0.1);
    if (HR.Music) { if (s.music && this.unlocked) HR.Music.resume(); else if (!s.music) HR.Music.stop(); }
  },
  setIntensity(v) { this.intensity = HR.U.clamp(v, 0, 1); if (HR.Music) HR.Music.setIntensity(this.intensity); },

  midi(n) { return 440 * Math.pow(2, (n - 69) / 12); },

  tone(o) {
    const c = this.ctx; if (!c) return;
    const now = c.currentTime + (o.t || 0);
    const d = o.d || 0.15, g = o.g == null ? 0.3 : o.g, a = o.a == null ? 0.005 : o.a;
    const osc = c.createOscillator(); osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(o.f || 440, now);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, now + d);
    const gn = c.createGain();
    gn.gain.setValueAtTime(0.0001, now);
    gn.gain.linearRampToValueAtTime(g, now + a);
    gn.gain.exponentialRampToValueAtTime(0.0001, now + d);
    osc.connect(gn); gn.connect(o.bus || this.sfxGain);
    osc.start(now); osc.stop(now + d + 0.05);
  },

  noise(o) {
    const c = this.ctx; if (!c || !this.noiseBuf) return;
    const now = c.currentTime + (o.t || 0);
    const d = o.d || 0.3, g = o.g == null ? 0.3 : o.g;
    const src = c.createBufferSource(); src.buffer = this.noiseBuf;
    const f = c.createBiquadFilter(); f.type = o.type || 'lowpass'; f.frequency.setValueAtTime(o.f || 1000, now);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, now + d);
    const gn = c.createGain();
    gn.gain.setValueAtTime(0.0001, now);
    gn.gain.linearRampToValueAtTime(g, now + (o.a || 0.005));
    gn.gain.exponentialRampToValueAtTime(0.0001, now + d);
    src.connect(f); f.connect(gn); gn.connect(o.bus || this.sfxGain);
    src.start(now); src.stop(now + d + 0.05);
  },

  sfx(name, p) {
    if (!this.ctx || !HR.Store.data.settings.sound) return;
    p = p || {};
    const combo = Math.min(p.combo || 0, 12);
    switch (name) {
      case 'click': this.tone({ f: 1200, type: 'square', d: 0.05, g: 0.08 }); break;
      case 'pass': {
        const f = 523.25 * Math.pow(2, combo / 12);
        this.tone({ f, type: 'triangle', d: 0.16, g: 0.3 });
        this.tone({ f: f * 2, type: 'sine', d: 0.1, g: 0.08, t: 0.02 });
        break;
      }
      case 'perfect': {
        const f = 659.25 * Math.pow(2, combo / 12);
        this.tone({ f, type: 'triangle', d: 0.12, g: 0.3 });
        this.tone({ f: f * 1.5, type: 'triangle', d: 0.2, g: 0.28, t: 0.07 });
        this.tone({ f: f * 3, type: 'sine', d: 0.25, g: 0.06, t: 0.07 });
        break;
      }
      case 'coin':
        this.tone({ f: 1760, type: 'square', d: 0.07, g: 0.1 });
        this.tone({ f: 2349, type: 'square', d: 0.12, g: 0.1, t: 0.06 });
        break;
      case 'great':
        [0, 4, 7, 12].forEach((s, i) => this.tone({ f: this.midi(76 + s), type: 'triangle', d: 0.35, g: 0.22, t: i * 0.05 }));
        break;
      case 'fail':
        this.noise({ d: 0.5, g: 0.5, f: 600, f2: 80 });
        this.tone({ f: 220, f2: 45, type: 'sawtooth', d: 0.55, g: 0.25 });
        break;
      case 'shield':
        this.tone({ f: 880, f2: 1760, type: 'sine', d: 0.25, g: 0.3 });
        this.noise({ d: 0.2, g: 0.2, f: 3000, type: 'highpass' });
        break;
      case 'levelup':
        [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => this.tone({ f: this.midi(n), type: 'triangle', d: 0.4, g: 0.22, t: i * 0.08 }));
        break;
      case 'phase':
        this.tone({ f: 220, f2: 880, type: 'sine', d: 0.7, g: 0.25 });
        this.tone({ f: 440, f2: 1760, type: 'triangle', d: 0.7, g: 0.08, t: 0.05 });
        this.noise({ d: 0.6, g: 0.12, f: 400, f2: 4000, type: 'bandpass' });
        break;
      case 'revive':
        this.tone({ f: 200, f2: 1400, type: 'triangle', d: 0.6, g: 0.2 });
        this.tone({ f: 400, f2: 2800, type: 'sine', d: 0.6, g: 0.1, t: 0.05 });
        break;
      case 'reward':
        [0, 1, 2, 3, 4].forEach(i => { this.tone({ f: 1568 * Math.pow(2, i / 12), type: 'square', d: 0.1, g: 0.09, t: i * 0.07 }); });
        break;
      case 'buy':
        [69, 73, 76, 81].forEach((n, i) => this.tone({ f: this.midi(n), type: 'triangle', d: 0.3, g: 0.2, t: i * 0.09 }));
        break;
      case 'tick': this.tone({ f: 660, type: 'square', d: 0.05, g: 0.08 }); break;
      case 'whoosh': this.noise({ d: 0.25, g: 0.15, f: 600, f2: 3000, type: 'highpass' }); break;
      case 'near': this.noise({ d: 0.09, g: 0.12, f: 2500, f2: 5000, type: 'bandpass' }); break;
      case 'miss': this.tone({ f: 330, f2: 240, type: 'triangle', d: 0.18, g: 0.16 }); break;
      case 'alarm': [0, 0.22, 0.44].forEach(t => { this.tone({ f: 620, f2: 470, type: 'square', d: 0.16, g: 0.09, t }); this.tone({ f: 1240, f2: 940, type: 'sine', d: 0.16, g: 0.04, t }); }); break;
      case 'record':
        [72, 76, 79, 84, 88].forEach((n, i) => this.tone({ f: this.midi(n), type: 'square', d: 0.35, g: 0.12, t: i * 0.1 }));
        break;
      case 'win': if (HR.Music) HR.Music.sting(); break;
      case 'error': this.tone({ f: 200, f2: 150, type: 'square', d: 0.15, g: 0.1 }); break;
      case 'open': this.noise({ d: 0.18, g: 0.08, f: 900, f2: 2600, type: 'bandpass' }); this.tone({ f: 520, f2: 780, type: 'sine', d: 0.14, g: 0.06 }); break;
    }
  }
};
