/* =====================================================================
   ORBO v6.2: quatro níveis de gráfico. O que importa é o jogo não travar.

   3 · MUITO BOM  tudo ligado, resolução 2x  (aparelho forte)
   2 · BOM        cenário e segundo efeito, resolução 1,75x
   1 · NORMAL     fundo simples, sem cenário, sem animação de ícone, 1,25x
   0 · BAIXO      só o essencial: fundo liso, sem partículas, sem brilho, 1x

   Automático: chuta pelo aparelho e, se a partida travar, desce um nível
   sozinho (e avisa). No modo manual ele não mexe: só sugere baixar.
   Nunca sobe sozinho — subir é escolha de quem joga.
   ===================================================================== */
window.HR = window.HR || {};

HR.Perf = {
  // dpr = resolução · part = teto de partículas · bg = quanto do fundo é desenhado
  TABLE: [
    { dpr: 1.00, part: 80,   fx2: false, bgFx: false, scenes: false, bg: 0.30, glow: false, anims: false, trail: false, flow: false },
    { dpr: 1.50, part: 300,  fx2: false, bgFx: true,  scenes: false, bg: 0.65, glow: true,  anims: false, trail: true,  flow: false },
    { dpr: 2.00, part: 700,  fx2: true,  bgFx: true,  scenes: true,  bg: 1.00, glow: true,  anims: true,  trail: true,  flow: true },
    { dpr: 2.00, part: 1200, fx2: true,  bgFx: true,  scenes: true,  bg: 1.30, glow: true,  anims: true,  trail: true,  flow: true }
  ],
  MODES: ['auto', 'ultra', 'high', 'normal', 'low'],
  BY_MODE: { ultra: 3, high: 2, normal: 1, low: 0 },
  mode: 'auto', level: 2,
  acc: 0, n: 0, slow: 0, bad: 0, suggested: false, lastDrop: 0,

  GEN: 2,   // sobe quando o motor muda a ponto de o nivel aprendido nao valer mais

  init() {
    const s = (HR.Store && HR.Store.data && HR.Store.data.settings) || {};
    // motor novo: o nivel que o automatico tinha aprendido nao vale mais
    if (s.qualityGen !== this.GEN) {
      s.qualityGen = this.GEN; delete s.qualityAuto2;
      if (HR.Store && HR.Store.save) HR.Store.save();
    }
    // saves antigos: 'high' continua alto, 'low' vira o baixo novo, o resto é automático
    let m = s.quality || 'auto';
    if (this.MODES.indexOf(m) < 0) m = 'auto';
    this.mode = m;
    this.level = this.levelFor(m, s);
    this.apply();
  },
  levelFor(mode, s) {
    if (this.BY_MODE[mode] != null) return this.BY_MODE[mode];
    const saved = s && s.qualityAuto2;
    return typeof saved === 'number' ? Math.max(0, Math.min(3, saved)) : this.guess();
  },
  // Chute inicial. Comeca otimista de proposito: se travar, o vigia desce em 3 s.
  // O contrario (comecar baixo) deixa aparelho bom feio para sempre, porque nada sobe.
  // O iOS nao informa memória (fica nulo): la o numero de nucleos decide sozinho.
  guess() {
    const cores = navigator.hardwareConcurrency || 4;
    const mem = typeof navigator.deviceMemory === 'number' ? navigator.deviceMemory : null;
    if ((navigator.connection || {}).saveData) return 1;      // economia de dados: respeita
    if (cores <= 2 || (mem !== null && mem <= 2)) return 0;    // bem fraco (ex.: iPhone 7)
    if (cores <= 3 || (mem !== null && mem <= 3)) return 1;    // fraco
    if (cores >= 6 && (mem === null || mem >= 6)) return 3;    // aparelho bom
    return 2;                                                   // a grande maioria
  },

  T() { return this.TABLE[this.level] || this.TABLE[1]; },
  dprCap() { return this.T().dpr; },
  particleCap() { return this.T().part; },
  fx2() { return this.T().fx2; },
  bgFx() { return this.T().bgFx; },
  scenes() { return this.T().scenes; },
  bg() { return this.T().bg; },
  glow() { return this.T().glow; },
  anims() { return this.T().anims; },
  trailFx() { return this.T().trail; },
  flowLayers() { return this.T().flow; },
  // "leve": menus e mapas desenham um quadro parado em vez de um laço a 60 fps
  lite() { return this.level <= 1; },
  name(lv) { return HR.t('quality_l' + (lv == null ? this.level : lv)); },

  // marca o nível no <html>: o CSS desliga o que custa caro
  apply(game) {
    const el = document.documentElement;
    for (let i = 0; i < 4; i++) el.classList.toggle('perf-' + i, this.level === i);
    el.classList.toggle('fx-low', this.level <= 1);          // compatível com o v5.2
    el.classList.toggle('fx-min', this.level === 0);
    const g = game || HR.game;
    if (g) { try { g.resize(); if (g.bg && g.bg.build) g.bg.build(); } catch (_) { /* nada */ } }
  },

  set(level, game, why) {
    const lv = Math.max(0, Math.min(3, level));
    if (lv === this.level) return false;
    this.level = lv;
    if (this.mode === 'auto' && HR.Store && HR.Store.data) { HR.Store.data.settings.qualityAuto2 = lv; HR.Store.save(); }
    this.apply(game);
    if (HR.Analytics) HR.Analytics.log('quality_set', { level: lv, why: why || 'manual' });
    return true;
  },
  setMode(mode, game) {
    if (this.MODES.indexOf(mode) < 0) mode = 'auto';
    const s = HR.Store.data.settings;
    s.quality = mode; this.mode = mode;
    this.level = this.levelFor(mode, s);
    this.suggested = false;
    HR.Store.save();
    this.apply(game);
  },

  /* ---------------- o vigia: se travar, desce ---------------- */
  // janela de 3 s durante a partida. Quadro lento = acima de 22 ms (menos de 45 fps).
  sample(dt, game) {
    if (!game || game.state !== 'playing' || document.hidden) { this.acc = 0; this.n = 0; this.slow = 0; this.bad = 0; return; }
    this.acc += dt; this.n++;
    if (dt > 1 / 45) this.slow++;
    if (dt > 0.1) this.bad++;                     // engasgo feio: pesa mais
    if (this.acc < 3) return;
    const ratio = this.n > 40 ? (this.slow + this.bad * 2) / this.n : 0;
    this.acc = 0; this.n = 0; this.slow = 0; this.bad = 0;
    if (ratio <= 0.3 || this.level <= 0) return;
    const now = Date.now();
    if (now - this.lastDrop < 12000) return;      // não desce dois níveis de uma vez
    this.lastDrop = now;
    if (this.mode === 'auto') {
      const from = this.level;
      if (this.set(this.level - 1, game, 'travando') && HR.UI && HR.UI.toast) {
        HR.UI.toast(HR.icon('sliders') + ' ' + HR.t('quality_dropped', { n: this.name() }), 'warn');
      }
      void from;
    } else if (!this.suggested && HR.UI && HR.UI.perfSuggest) {
      this.suggested = true;
      HR.UI.perfSuggest(this.level - 1);
    }
  }
};

Object.assign(HR.I18N.pt, {
  quality: 'Gráficos', quality_d: 'O automático baixa sozinho se o jogo travar.',
  quality_auto: 'Auto', quality_high: 'Alto', quality_low: 'Baixo',
  quality_l0: 'Baixo', quality_l1: 'Normal', quality_l2: 'Bom', quality_l3: 'Muito bom',
  quality_s0: 'Só o essencial. Roda em qualquer aparelho.',
  quality_s1: 'Fundo simples, sem cenário. Leve e fluido.',
  quality_s2: 'Cenário e efeitos. Para aparelhos bons.',
  quality_s3: 'Tudo ligado, na resolução máxima.',
  quality_dropped: 'Gráficos em {n} para o jogo não travar',
  quality_ask: 'O jogo está travando. Baixar os gráficos para {n}?',
  quality_ask_yes: 'Baixar', quality_ask_no: 'Agora não', quality_now: 'Agora: {n}'
});
Object.assign(HR.I18N.en, {
  quality: 'Graphics', quality_d: 'Auto lowers it on its own if the game stutters.',
  quality_auto: 'Auto', quality_high: 'High', quality_low: 'Low',
  quality_l0: 'Low', quality_l1: 'Normal', quality_l2: 'Good', quality_l3: 'Very good',
  quality_s0: 'Only the essentials. Runs on any device.',
  quality_s1: 'Simple background, no scenery. Light and smooth.',
  quality_s2: 'Scenery and effects. For good devices.',
  quality_s3: 'Everything on, at full resolution.',
  quality_dropped: 'Graphics set to {n} to keep it smooth',
  quality_ask: 'The game is stuttering. Lower graphics to {n}?',
  quality_ask_yes: 'Lower', quality_ask_no: 'Not now', quality_now: 'Now: {n}'
});
Object.assign(HR.I18N.es, {
  quality: 'Gráficos', quality_d: 'El automático baja solo si el juego se traba.',
  quality_auto: 'Auto', quality_high: 'Alto', quality_low: 'Bajo',
  quality_l0: 'Bajo', quality_l1: 'Normal', quality_l2: 'Bueno', quality_l3: 'Muy bueno',
  quality_s0: 'Solo lo esencial. Corre en cualquier aparato.',
  quality_s1: 'Fondo simple, sin escenario. Ligero y fluido.',
  quality_s2: 'Escenario y efectos. Para aparatos buenos.',
  quality_s3: 'Todo encendido, a resolución máxima.',
  quality_dropped: 'Gráficos en {n} para que no se trabe',
  quality_ask: 'El juego se está trabando. ¿Bajar los gráficos a {n}?',
  quality_ask_yes: 'Bajar', quality_ask_no: 'Ahora no', quality_now: 'Ahora: {n}'
});
