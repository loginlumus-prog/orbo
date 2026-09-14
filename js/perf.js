/* =====================================================================
   ORBO v5.1: qualidade gráfica que se adapta ao aparelho.
   2 = alta (resolução até 2x) · 1 = média (1,5x, menos partículas) · 0 = leve (1x, sem segundo efeito de fundo)
   Automática: começa pela memória/núcleos do aparelho e baixa um nível se a partida ficar travando
   (mais de 35% dos quadros acima de ~24 ms durante 4 s). Nunca sobe sozinha.
   ===================================================================== */
window.HR = window.HR || {};

HR.Perf = {
  mode: 'auto', level: 2, acc: 0, n: 0, slow: 0,
  init() {
    const s = (HR.Store && HR.Store.data && HR.Store.data.settings) || {};
    this.mode = s.quality || 'auto';
    this.level = this.levelFor(this.mode, s);
  },
  levelFor(mode, s) {
    if (mode === 'high') return 2;
    if (mode === 'low') return 0;
    return typeof s.qualityAuto === 'number' ? s.qualityAuto : this.guess();
  },
  guess() {
    const mem = navigator.deviceMemory || 4, cores = navigator.hardwareConcurrency || 4;
    return mem <= 2 || cores <= 2 ? 0 : mem <= 3 || cores <= 4 ? 1 : 2;
  },
  dprCap() { return this.level >= 2 ? 2 : this.level === 1 ? 1.5 : 1; },
  particleCap() { return this.level >= 2 ? 900 : this.level === 1 ? 500 : 260; },
  fx2() { return this.level >= 1; },
  sample(dt, game) {
    if (this.mode !== 'auto' || !game || game.state !== 'playing' || document.hidden || this.level <= 0) { this.acc = 0; this.n = 0; this.slow = 0; return; }
    this.acc += dt; this.n++; if (dt > 1 / 42) this.slow++;
    if (this.acc >= 4) {
      if (this.n > 30 && this.slow / this.n > 0.35) this.set(this.level - 1, game);
      this.acc = 0; this.n = 0; this.slow = 0;
    }
  },
  set(level, game) {
    this.level = Math.max(0, Math.min(2, level));
    if (this.mode === 'auto' && HR.Store && HR.Store.data) { HR.Store.data.settings.qualityAuto = this.level; HR.Store.save(); }
    if (game) game.resize();
    if (HR.Analytics) HR.Analytics.log('quality_auto', { level: this.level });
  },
  setMode(mode, game) {
    const s = HR.Store.data.settings;
    s.quality = mode; this.mode = mode;
    this.level = this.levelFor(mode, s);
    HR.Store.save();
    if (game) game.resize();
  }
};

Object.assign(HR.I18N.pt, { quality: 'Gráficos', quality_d: 'Automático baixa a qualidade se o aparelho travar.', quality_auto: 'Auto', quality_high: 'Alta', quality_low: 'Leve' });
Object.assign(HR.I18N.en, { quality: 'Graphics', quality_d: 'Auto lowers quality if the device struggles.', quality_auto: 'Auto', quality_high: 'High', quality_low: 'Light' });
Object.assign(HR.I18N.es, { quality: 'Gráficos', quality_d: 'Auto baja la calidad si el dispositivo se traba.', quality_auto: 'Auto', quality_high: 'Alta', quality_low: 'Ligera' });
