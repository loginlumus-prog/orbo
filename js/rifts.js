/* =====================================================================
   ORBO v6.1 — AS FENDAS (o Infinito por galáxia).
   Cada galáxia tem uma fenda: um buraco negro onde se joga o Infinito.
   A Fenda do Berço está sempre aberta; as outras abrem conforme a história
   avança (a fenda N abre quando a galáxia N abre).

   O que muda de uma fenda para a outra:
   - quanto ouro rende (é o motivo de avançar na história para farmar melhor);
   - o recorde e o ranking são separados;
   - a cor e o nome.
   O que NÃO muda: a dificuldade. Qualquer fenda chega às fases avançadas.
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const N = 10;
  function data() {
    const d = HR.Store.data;
    if (!d.rifts) d.rifts = { cur: 1, best: {}, runs: {} };
    const r = d.rifts;
    r.cur = Math.min(N, Math.max(1, r.cur || 1)); r.best = r.best || {}; r.runs = r.runs || {};
    return r;
  }

  HR.Rifts = {
    N,
    data,
    // a fenda n (1..10) vive na galáxia n
    region(n) { return HR.REGIONS[Math.min(N, Math.max(1, n)) - 1]; },
    name(n) { return HR.t('rift_' + (n - 1)); },
    color(n) { const R = this.region(n); return R ? R.accent : '#4cf0ff'; },

    // abre quando a galáxia daquela fenda abre (a 1ª está sempre aberta)
    unlocked(n) { return n <= 1 || (HR.Campaign && HR.Campaign.isRegionUnlocked ? HR.Campaign.isRegionUnlocked(n - 1) : false); },
    openCount() { let k = 0; for (let n = 1; n <= N; n++) if (this.unlocked(n)) k++; return k; },
    nextLocked() { for (let n = 1; n <= N; n++) if (!this.unlocked(n)) return n; return 0; },

    // ouro: +25 % por fenda (1,00 · 1,25 · 1,50 … 3,25) — v8: avançar na história
    // tem de continuar sendo o melhor jeito de farmar
    mul(n) { return Math.round((1 + 0.25 * (Math.min(N, Math.max(1, n)) - 1)) * 100) / 100; },
    mulPct(n) { return Math.round((this.mul(n) - 1) * 100); },

    current() { const c = data().cur; return this.unlocked(c) ? c : 1; },
    setCurrent(n) {
      if (!this.unlocked(n)) return false;
      data().cur = n; HR.Store.save();
      return true;
    },
    best(n) { return data().best[n] || 0; },
    runs(n) { return data().runs[n] || 0; },
    // guarda o recorde da fenda ao fim de cada partida do Infinito
    record(score) {
      const n = this.current(), d = data();
      d.runs[n] = (d.runs[n] || 0) + 1;
      if (score > (d.best[n] || 0)) { d.best[n] = score; HR.Store.save(); return true; }
      HR.Store.save(); return false;
    },
    totalBest() { let b = 0; for (let n = 1; n <= N; n++) b = Math.max(b, this.best(n)); return b; }
  };

  /* ---------------- textos ---------------- */
  const PT = ['Fenda do Berço', 'Fenda da Maré', 'Fenda do Jardim', 'Fenda da Forja', 'Fenda da Névoa', 'Fenda do Cristal', 'Fenda da Tempestade', 'Fenda do Abismo', 'Fenda do Vórtice', 'Fenda do Horizonte'];
  const EN = ['Cradle Rift', 'Tide Rift', 'Garden Rift', 'Forge Rift', 'Mist Rift', 'Crystal Rift', 'Storm Rift', 'Abyss Rift', 'Vortex Rift', 'Horizon Rift'];
  const ES = ['Grieta de la Cuna', 'Grieta de la Marea', 'Grieta del Jardín', 'Grieta de la Forja', 'Grieta de la Niebla', 'Grieta del Cristal', 'Grieta de la Tormenta', 'Grieta del Abismo', 'Grieta del Vórtice', 'Grieta del Horizonte'];
  const pack = (list) => { const o = {}; list.forEach((v, i) => { o['rift_' + i] = v; }); return o; };
  Object.assign(HR.I18N.pt, pack(PT), {
    rifts: 'Fendas', rifts_d: 'Cada galáxia tem um buraco negro. O Infinito é jogado dentro deles.',
    rift_open: 'Aberta', rift_locked: 'Abre na Galáxia {n}', rift_gold: 'Ouro ×{n}', rift_best: 'Recorde',
    rift_play: 'ENTRAR NA FENDA', rift_current: 'Fenda atual', rift_count: '{a} de {b} abertas',
    rift_same: 'Todas têm a mesma dificuldade. O que muda é o ouro.', rift_new: 'FENDA ABERTA', rift_none: 'Sem recorde ainda'
  });
  Object.assign(HR.I18N.en, pack(EN), {
    rifts: 'Rifts', rifts_d: 'Every galaxy has a black hole. Endless is played inside them.',
    rift_open: 'Open', rift_locked: 'Opens in Galaxy {n}', rift_gold: 'Gold ×{n}', rift_best: 'Best',
    rift_play: 'ENTER THE RIFT', rift_current: 'Current rift', rift_count: '{a} of {b} open',
    rift_same: 'They all have the same difficulty. Only the gold changes.', rift_new: 'RIFT OPEN', rift_none: 'No record yet'
  });
  Object.assign(HR.I18N.es, pack(ES), {
    rifts: 'Grietas', rifts_d: 'Cada galaxia tiene un agujero negro. El Infinito se juega dentro.',
    rift_open: 'Abierta', rift_locked: 'Se abre en la Galaxia {n}', rift_gold: 'Oro ×{n}', rift_best: 'Récord',
    rift_play: 'ENTRAR EN LA GRIETA', rift_current: 'Grieta actual', rift_count: '{a} de {b} abiertas',
    rift_same: 'Todas tienen la misma dificultad. Lo que cambia es el oro.', rift_new: 'GRIETA ABIERTA', rift_none: 'Sin récord todavía'
  });
})();
