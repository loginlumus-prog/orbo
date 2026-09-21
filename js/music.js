/* =====================================================================
   Música procedural (Web Audio, zero arquivos): 12 temas descritos como dados
   — 10 regiões, menu (assinatura ORBO) e Singularidade (adaptativo).
   Sequenciador de semicolcheias com lookahead, camadas por intensidade
   (pad → baixo → arpejo → bateria → motivo), eco por tema e crossfade
   entre dois "vozes" (troca de tema sem corte).
   API: HR.Music.play(id) · stop() · setIntensity(0..1) · sting() · current
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const SC = {
    major: [0, 2, 4, 5, 7, 9, 11], lydian: [0, 2, 4, 6, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10], minor: [0, 2, 3, 5, 7, 8, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10], harmMinor: [0, 2, 3, 5, 7, 8, 11], phrygDom: [0, 1, 4, 5, 7, 8, 10], pentMaj: [0, 2, 4, 7, 9]
  };
  // padrões de baixo (16 passos): 1 = tônica, 5 = quinta, 8 = oitava, 0 = pausa
  const B = {
    half: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    walk: [1, 0, 0, 0, 5, 0, 0, 0, 1, 0, 0, 0, 5, 0, 8, 0],
    drive: [1, 0, 1, 0, 1, 0, 5, 0, 1, 0, 1, 0, 5, 0, 8, 0],
    pump: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 5, 0],
    off: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 5, 0, 0, 0, 1, 0],
    slow: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0]
  };
  const D = {
    soft: { kick: [0, 8], snare: [], hatEvery: 4 },
    basic: { kick: [0, 8], snare: [4, 12], hatEvery: 2 },
    drive: { kick: [0, 6, 8, 14], snare: [4, 12], hatEvery: 2 },
    four: { kick: [0, 4, 8, 12], snare: [4, 12], hatEvery: 1 },
    trip: { kick: [0, 5, 10], snare: [8], hatEvery: 2 }
  };
  // motivo ORBO: 5ª, 6ª, 8ª, 3ª (índices na escala; 7 = tônica uma oitava acima) — [passo(0..31), grau, duração]
  const ORBO = [[0, 4, 2], [2, 5, 2], [4, 7, 4], [8, 2, 6], [16, 4, 2], [18, 5, 2], [20, 9, 4], [24, 7, 8]];

  // bpm, root (MIDI), scale, prog (graus por compasso), bass, arp, lead, drums, timbre, filter (Hz), echo (0..1), swing, gain
  HR.MUSIC_THEMES = {
    // O LOBBY NAO E UMA MUSICA. E o som de um lugar grande e parado: o acorde
    // demora 6 s para abrir, troca a cada 6 s, e a cada dois compassos cai um
    // sino de muito longe. Sem baixo, sem arpejo, sem bateria e sem melodia —
    // quem quiser ouvir o motivo ORBO ouve no fim de fase (sting).
    menu:        { bpm: 40,  root: 57, scale: 'lydian',     prog: [0, 3, 5, 3], bass: null,    arp: null,                  lead: null,  drums: null,     timbre: { pad: 'sine', bass: 'sine', arp: 'sine', lead: 'sine' }, filter: 560, echo: 0.6,  swing: 0, fixed: 0.1,  vol: 0.55, padA: 1.8, padG: 0.55, sino: { every: 32, graus: [7, 9, 11, 7], g: 0.028 } },
    singularity: { bpm: 104, root: 57, scale: 'minor',      prog: [0, 5, 2, 6], bass: B.walk,  arp: { every: 2, span: 2 }, lead: [[0, 7, 2], [3, 6, 1], [4, 4, 4], [16, 7, 2], [19, 9, 1], [20, 4, 6]], leadAt: 0.6, drums: D.drive, timbre: { pad: 'sawtooth', bass: 'sine', arp: 'triangle', lead: 'square' }, filter: 1200, echo: 0.25, swing: 0 },
    r1:  { bpm: 96,  root: 62, scale: 'lydian',     prog: [0, 1, 4, 0], bass: B.slow,  arp: { every: 4, span: 2 }, lead: [[0, 2, 4], [6, 4, 2], [8, 5, 8], [16, 4, 4], [22, 2, 2], [24, 0, 8]], leadAt: 0.5, drums: D.soft,  timbre: { pad: 'triangle', bass: 'sine', arp: 'sine', lead: 'triangle' }, filter: 2000, echo: 0.4, swing: 0 },
    r2:  { bpm: 100, root: 50, scale: 'dorian',     prog: [0, 3, 0, 6], bass: B.half,  arp: { every: 2, span: 2, shape: 'updown' }, lead: [[0, 4, 3], [4, 5, 3], [8, 4, 6], [16, 2, 3], [20, 4, 3], [24, 0, 8]], leadAt: 0.5, drums: D.basic, timbre: { pad: 'triangle', bass: 'sine', arp: 'triangle', lead: 'sine' }, filter: 1600, echo: 0.5, swing: 0.12 },
    r3:  { bpm: 112, root: 55, scale: 'pentMaj',    prog: [0, 3, 1, 4], bass: B.off,   arp: { every: 2, span: 2, shape: 'random' }, lead: [[0, 4, 2], [2, 3, 2], [4, 2, 2], [8, 4, 4], [16, 5, 2], [18, 4, 2], [20, 3, 2], [24, 0, 6]], leadAt: 0.45, drums: D.trip,  timbre: { pad: 'sine', bass: 'triangle', arp: 'triangle', lead: 'triangle' }, filter: 2400, echo: 0.3, swing: 0.2 },
    r4:  { bpm: 124, root: 52, scale: 'minor',      prog: [0, 5, 6, 0], bass: B.drive, arp: { every: 1, span: 1 }, lead: [[0, 0, 2], [2, 0, 1], [4, 2, 3], [8, 4, 4], [16, 0, 2], [18, 0, 1], [20, 5, 3], [24, 4, 6]], leadAt: 0.55, drums: D.four,  timbre: { pad: 'sawtooth', bass: 'sawtooth', arp: 'square', lead: 'square' }, filter: 1100, echo: 0.15, swing: 0 },
    r5:  { bpm: 90,  root: 57, scale: 'phrygian',   prog: [0, 1, 0, 2], bass: B.slow,  arp: { every: 4, span: 3 }, lead: [[0, 7, 6], [8, 8, 2], [12, 7, 8], [24, 4, 8]], leadAt: 0.5, drums: D.soft,  timbre: { pad: 'sine', bass: 'sine', arp: 'sine', lead: 'sine' }, filter: 1400, echo: 0.6, swing: 0 },
    r6:  { bpm: 118, root: 60, scale: 'lydian',     prog: [0, 1, 0, 4], bass: B.off,   arp: { every: 1, span: 3, shape: 'updown' }, lead: [[0, 9, 2], [2, 7, 2], [4, 6, 2], [6, 4, 2], [8, 7, 8], [16, 9, 2], [18, 11, 2], [20, 9, 6]], leadAt: 0.5, drums: D.basic, timbre: { pad: 'triangle', bass: 'triangle', arp: 'sine', lead: 'sine' }, filter: 3000, echo: 0.45, swing: 0 },
    r7:  { bpm: 132, root: 50, scale: 'harmMinor',  prog: [0, 3, 4, 0], bass: B.drive, arp: { every: 1, span: 2 }, lead: [[0, 4, 1], [1, 4, 1], [2, 5, 2], [4, 4, 2], [6, 2, 2], [8, 0, 6], [16, 6, 2], [18, 6, 2], [20, 7, 4], [24, 4, 8]], leadAt: 0.5, drums: D.four,  timbre: { pad: 'sawtooth', bass: 'sawtooth', arp: 'sawtooth', lead: 'square' }, filter: 1500, echo: 0.2, swing: 0 },
    r8:  { bpm: 84,  root: 48, scale: 'minor',      prog: [0, 5, 3, 0], bass: B.slow,  arp: { every: 4, span: 2 }, lead: [[0, 2, 8], [12, 1, 4], [16, 0, 12]], leadAt: 0.55, drums: D.soft,  timbre: { pad: 'sine', bass: 'sine', arp: 'triangle', lead: 'triangle' }, filter: 900, echo: 0.7, swing: 0 },
    r9:  { bpm: 140, root: 52, scale: 'phrygDom',   prog: [0, 1, 0, 6], bass: B.pump,  arp: { every: 1, span: 2, shape: 'random' }, lead: [[0, 4, 1], [2, 5, 1], [4, 4, 1], [6, 2, 1], [8, 1, 2], [10, 0, 4], [16, 7, 2], [18, 8, 2], [20, 7, 2], [22, 4, 2], [24, 0, 8]], leadAt: 0.45, drums: D.four,  timbre: { pad: 'sawtooth', bass: 'square', arp: 'square', lead: 'sawtooth' }, filter: 1700, echo: 0.25, swing: 0 },
    r10: { bpm: 128, root: 62, scale: 'major',      prog: [0, 4, 5, 3], bass: B.drive, arp: { every: 2, span: 2, shape: 'updown' }, lead: ORBO, leadAt: 0.4, drums: D.four,  timbre: { pad: 'sawtooth', bass: 'sine', arp: 'triangle', lead: 'triangle' }, filter: 2600, echo: 0.35, swing: 0 }
  };

  HR.Music = {
    voices: [], current: null, intensity: 0, timer: null, ready: false, master: null,

    init() {
      const A = HR.Audio; if (!A.ctx || this.ready) return;
      this.master = A.ctx.createGain(); this.master.gain.value = 1; this.master.connect(A.musicGain);
      this.ready = true;
    },
    themeOf(id) { return HR.MUSIC_THEMES[id] || HR.MUSIC_THEMES.menu; },
    // toca um tema com crossfade; a mesma id repetida não reinicia
    play(id) {
      this.wanted = id;
      const A = HR.Audio; if (!A.ctx) return;
      this.init();
      if (this.current && this.current.id === id) return;
      if (!HR.Store.data.settings.music) { this.current = { id, theme: this.themeOf(id) }; return; }
      const now = A.ctx.currentTime;
      this.voices.forEach(v => { v.fading = true; v.gain.gain.cancelScheduledValues(now); v.gain.gain.setValueAtTime(v.gain.gain.value, now); v.gain.gain.linearRampToValueAtTime(0, now + 1.2); v.endAt = now + 1.3; });
      const theme = this.themeOf(id);
      const alvo = theme.vol != null ? theme.vol : 1;
      const gain = A.ctx.createGain(); gain.gain.setValueAtTime(0.0001, now); gain.gain.linearRampToValueAtTime(alvo, now + (theme.vol != null ? 3.5 : 1.5));
      const filter = A.ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = theme.filter;
      const delay = A.ctx.createDelay(1.0); delay.delayTime.value = (60 / theme.bpm) * 0.75;
      const fb = A.ctx.createGain(); fb.gain.value = 0.32; const wet = A.ctx.createGain(); wet.gain.value = theme.echo || 0;
      filter.connect(gain); filter.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(gain);
      gain.connect(this.master);
      const v = { id, theme, gain, filter, bus: filter, step: 0, nextTime: now + 0.05, fading: false, endAt: 0 };
      this.voices.push(v); this.current = v;
      if (!this.timer) this.timer = setInterval(() => this.scheduler(), 25);
      this.applyIntensity();
    },
    stop() {
      const A = HR.Audio; if (!A.ctx) return;
      const now = A.ctx.currentTime;
      this.voices.forEach(v => { v.fading = true; v.gain.gain.cancelScheduledValues(now); v.gain.gain.setValueAtTime(v.gain.gain.value, now); v.gain.gain.linearRampToValueAtTime(0, now + 0.4); v.endAt = now + 0.5; });
      this.current = null;
    },
    // ao religar a música nas configurações
    resume() { const w = this.wanted; if (w) { this.current = null; this.play(w); } },
    setIntensity(v) { this.intensity = HR.U.clamp(v, 0, 1); this.applyIntensity(); },
    applyIntensity() {
      const A = HR.Audio, v = this.current; if (!A.ctx || !v || !v.filter) return;
      const I = v.theme.fixed != null ? v.theme.fixed : this.intensity;
      v.filter.frequency.setTargetAtTime(v.theme.filter + I * 5000, A.ctx.currentTime, 0.6);
    },
    scheduler() {
      const A = HR.Audio; if (!A.ctx) return;
      const now = A.ctx.currentTime;
      this.voices = this.voices.filter(v => { if (v.fading && now > v.endAt) { try { v.gain.disconnect(); } catch (_) { /* ok */ } return false; } return true; });
      if (!this.voices.length) { clearInterval(this.timer); this.timer = null; return; }
      if (A.ctx.state !== 'running') return;
      this.voices.forEach(v => {
        const stepDur = 60 / v.theme.bpm / 4;
        while (v.nextTime < now + 0.14) {
          if (!v.fading) this.playStep(v, v.step, v.nextTime, stepDur);
          v.nextTime += stepDur; v.step++;
        }
      });
    },
    chord(T, deg) {
      const sc = SC[T.scale], n = sc.length, out = [];
      [0, 2, 4, 7, 9, 11].forEach(k => { const idx = deg + k; out.push(T.root + sc[idx % n] + 12 * Math.floor(idx / n)); });
      return out;
    },
    degNote(T, deg, base) { const sc = SC[T.scale], n = sc.length; return (base != null ? base : T.root) + sc[deg % n] + 12 * Math.floor(deg / n); },
    playStep(v, step, t, stepDur) {
      const A = HR.Audio, T = v.theme, bus = v.bus;
      const I = T.fixed != null ? T.fixed : this.intensity;
      const bar = Math.floor(step / 16) % T.prog.length, s16 = step % 16, s32 = step % 32;
      const chord = this.chord(T, T.prog[bar]);
      const swing = (s16 % 2 === 1 ? (T.swing || 0) * stepDur : 0);
      const rel = t + swing - A.ctx.currentTime;
      // pad (sempre; leve detune para largura)
      const pg = T.padG != null ? T.padG : 1, pa = T.padA != null ? T.padA : 0.5;
      if (s16 === 0) {
        chord.slice(0, 3).forEach((n, i) => {
          A.tone({ f: A.midi(n), type: T.timbre.pad, d: stepDur * 17, g: (0.04 + (i === 0 ? 0.01 : 0)) * pg, a: pa, t: rel, bus });
          A.tone({ f: A.midi(n) * 1.004, type: T.timbre.pad === 'sine' ? 'triangle' : T.timbre.pad, d: stepDur * 17, g: (0.012 + I * 0.012) * pg, a: pa * 1.4, t: rel, bus });
        });
      }
      // sino: uma nota so, de longe, a cada dois compassos. E o unico "toque"
      // que o lobby tem — e ele nem sempre esta la.
      if (T.sino && step % T.sino.every === 0) {
        const g2 = T.sino.graus, dg = g2[Math.floor(step / T.sino.every) % g2.length];
        const n = this.degNote(T, T.prog[bar] + dg, T.root + 12);
        A.tone({ f: A.midi(n), type: 'sine', d: stepDur * 10, g: T.sino.g, a: 0.9, t: rel, bus });
        A.tone({ f: A.midi(n) * 2, type: 'sine', d: stepDur * 6, g: T.sino.g * 0.35, a: 1.2, t: rel, bus });
      }
      // baixo
      const bp = T.bass && T.bass[s16];
      if (bp && I > 0.05) {
        const n = chord[0] - 12 + (bp === 5 ? 7 : bp === 8 ? 12 : 0);
        A.tone({ f: A.midi(n), type: T.timbre.bass, d: stepDur * 3, g: 0.15 + I * 0.04, a: 0.008, t: rel, bus });
      }
      // arpejo: mais notas conforme a intensidade
      if (T.arp && I > 0.12) {
        const every = I < 0.35 ? 4 : I < 0.7 ? 2 : Math.max(1, T.arp.every);
        if (s16 % every === 0) {
          const tones = chord.slice(0, T.arp.span >= 3 ? 6 : T.arp.span === 2 ? 5 : 3);
          const k = Math.floor(step / every);
          let idx;
          if (T.arp.shape === 'random') { idx = ((k * 7 + bar * 3) % 11) % tones.length; }
          else if (T.arp.shape === 'updown') { const p = tones.length * 2 - 2; const m = k % p; idx = m < tones.length ? m : p - m; }
          else idx = k % tones.length;
          const n = tones[idx] + (I > 0.85 && s16 % 8 === 4 ? 12 : 0);
          A.tone({ f: A.midi(n), type: T.timbre.arp, d: stepDur * 1.7, g: 0.045 + I * 0.03, a: 0.008, t: rel, bus });
        }
      }
      // motivo (2 compassos), sobre o acorde do compasso
      if (T.lead && I >= (T.leadAt != null ? T.leadAt : 0.45)) {
        for (const [st, dg, len] of T.lead) {
          if (st !== s32) continue;
          const n = this.degNote(T, T.prog[bar] + dg, T.root + 12);
          A.tone({ f: A.midi(n), type: T.timbre.lead, d: stepDur * len * 0.95, g: 0.06 + I * 0.03, a: 0.02, t: rel, bus });
          if (I > 0.75) A.tone({ f: A.midi(n) * 2, type: 'sine', d: stepDur * len * 0.9, g: 0.02, a: 0.02, t: rel, bus });
        }
      }
      // bateria (saída direta, sem filtro/eco)
      const Dm = T.drums, out = this.master;
      if (Dm) {
        if (I > 0.22 && Dm.kick.includes(s16)) A.tone({ f: 130, f2: 42, type: 'sine', d: 0.2, g: 0.22 + I * 0.1, a: 0.002, t: rel, bus: out });
        if (I > 0.32 && (s16 % (I > 0.8 ? 1 : Dm.hatEvery) === (Dm.hatEvery === 1 ? 0 : 1) || (I > 0.8 && s16 % 2 === 1))) A.noise({ d: 0.035, g: 0.03 + I * 0.02, f: 6500, type: 'highpass', t: rel, bus: out });
        if (I > 0.52 && Dm.snare.includes(s16)) { A.noise({ d: 0.14, g: 0.07, f: 1900, type: 'bandpass', t: rel, bus: out }); A.tone({ f: 190, f2: 120, type: 'triangle', d: 0.1, g: 0.08, a: 0.002, t: rel, bus: out }); }
      }
    },
    // assinatura curta (fim de fase, recorde): o motivo ORBO em 1,2 s
    // o motivo ORBO nao mora mais no lobby, entao a assinatura guarda o tom dela
    sting() {
      const A = HR.Audio; if (!A.ctx) return;
      const T = { root: 60, scale: 'lydian' }, root = T.root + 12;
      [[0, 4], [0.12, 5], [0.24, 7], [0.48, 2]].forEach(([t, dg], i) => {
        const n = this.degNote(T, dg, root);
        A.tone({ f: A.midi(n), type: 'triangle', d: i === 3 ? 0.7 : 0.3, g: 0.2, a: 0.01, t });
        A.tone({ f: A.midi(n) * 2, type: 'sine', d: 0.3, g: 0.05, a: 0.01, t });
      });
    }
  };
})();
