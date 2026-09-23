/* =====================================================================
   ORBO v5.9 — A HISTÓRIA (motor). Ver docs/HISTORIA.md.
   Uma faísca atravessa dez galáxias atrás dos pais. Cada chefe é uma conversa
   com três respostas: Luz (U), Pergunta (Q) e Força (F) — os mesmos três
   caminhos que a Singularidade já usa.

   Regras que este arquivo garante:
   - escolha NUNCA muda vida, escudo, moeda, velocidade ou dificuldade;
   - tudo é pulável, e pular não tira nada de ninguém;
   - cena sem texto escrito simplesmente não aparece (dá para publicar por galáxia).

   Cena = um id. Os textos são chaves i18n:
     st_<id>_1, st_<id>_2, …   falas (o "~" no começo marca narração)
     st_<id>_ask               a pergunta
     st_<id>_oU / _oQ / _oF    as três respostas
     st_<id>_rU / _rQ / _rF    o que o personagem responde
     st_<id>_who               quem aparece (opcional; o padrão é o guardião)
   Ids: open · g1 (entrada) · g1v3 (visita do elenco) · g1b7 (chefe do sistema 7)
        g1b10 (chefe da galáxia) · g1c (carta) · door
   ===================================================================== */
window.HR = window.HR || {};

// quem pode aparecer numa cena (sigilo desenhado no retrato + cor)
HR.STORY_CAST = {
  faisca:  { ic: 'sparkle', c: '#ffd88a' },
  vela:    { ic: 'flame',   c: '#ffcf4a' },
  ancora:  { ic: 'link',    c: '#8fb8ff' },
  casco:   { ic: 'shield',  c: '#c9d3ee' },
  iris:    { ic: 'comet',   c: '#9be7ff' },
  poeira:  { ic: 'seed',    c: '#e6d8ff' },
  cardume: { ic: 'hive',    c: '#7cff6b' },
  porta:   { ic: 'orbit',   c: '#ffffff' }
};

(function () {
  const AX = ['U', 'Q', 'F'];
  const has = key => HR.I18N.pt[key] != null;

  function data() {
    const d = HR.Store.data;
    if (!d.story) d.story = { axis: { U: 0, Q: 0, F: 0 }, marks: {}, seen: {}, flags: {}, letters: [], ending: null };
    const s = d.story;
    s.axis = s.axis || { U: 0, Q: 0, F: 0 }; s.marks = s.marks || {}; s.seen = s.seen || {};
    s.flags = s.flags || {}; s.letters = s.letters || [];
    return s;
  }

  HR.Story = {
    data,
    /* ---------------- ajuste do jogador ---------------- */
    // 'full' = tudo · 'short' = só entrada de galáxia, chefe de galáxia e carta · 'off' = nada
    mode() { const v = HR.Store.data.settings.story; return v === 'short' || v === 'off' ? v : 'full'; },
    setMode(v) { HR.Store.data.settings.story = v; HR.Store.save(); },

    /* ---------------- leitura das cenas ---------------- */
    exists(id) { return has('st_' + id + '_1') || has('st_' + id + '_ask'); },
    seen(id) { return !!data().seen[id]; },
    see(id) { data().seen[id] = 1; HR.Store.save(); },

    lines(id) {
      const out = [];
      for (let i = 1; i <= 24; i++) { const k = 'st_' + id + '_' + i; if (!has(k)) break; out.push(HR.t(k)); }
      return out;
    },
    // peso da resposta: chefe de galáxia vale 3, o resto vale 1
    weight(id) { return /b10$/.test(id) ? 3 : 1; },
    galaxyOf(id) { const m = /^g(\d+)/.exec(id); return m ? +m[1] : 0; },

    // quem aparece: st_<id>_who ("casco", "vela"…) ou, por padrão, o guardião da galáxia
    who(id) {
      const key = 'st_' + id + '_who', name = has(key) ? HR.t(key) : '';
      if (HR.STORY_CAST[name]) return this.cast(name);
      const gi = this.galaxyOf(id);
      if (HR.REGIONS[gi - 1]) return this.cast('guardiao', gi - 1);
      return this.cast('faisca');
    },
    // quem fala numa linha: um do elenco, ou o guardiao da galaxia ri.
    // voz e a chave do timbre (js/ui-story.js); vozN afina o guardiao por galaxia.
    cast(nome, ri) {
      if (nome === 'guardiao') {
        const R = HR.REGIONS[ri != null ? ri : 0] || HR.REGIONS[0];
        return { ic: (HR.BOSSES[R.boss] || {}).icon || 'orbit', c: R.accent, name: HR.t('boss_' + R.boss), voz: 'guardiao', vozN: ri || 0 };
      }
      const C = HR.STORY_CAST[nome] || HR.STORY_CAST.faisca, k = HR.STORY_CAST[nome] ? nome : 'faisca';
      return { ic: C.ic, c: C.c, name: HR.t('st_cast_' + k), voz: k };
    },

    scene(id) {
      if (!this.exists(id)) return null;
      const opts = AX.filter(a => has('st_' + id + '_o' + a))
        .map(a => ({ ax: a, text: HR.t('st_' + id + '_o' + a) }));
      return {
        id, who: this.who(id), lines: this.lines(id),
        ask: has('st_' + id + '_ask') ? HR.t('st_' + id + '_ask') : '',
        opts, reply: a => (has('st_' + id + '_r' + a) ? HR.t('st_' + id + '_r' + a) : ''),
        kicker: has('st_' + id + '_k') ? HR.t('st_' + id + '_k') : ''
      };
    },

    /* ---------------- resposta ---------------- */
    // ax = 'U' | 'Q' | 'F' | null (pulou). Nada aqui toca em moeda, vida ou dificuldade.
    take(id, ax) {
      const s = data();
      if (!s.seen[id] && ax && AX.indexOf(ax) >= 0) {
        s.axis[ax] = (s.axis[ax] || 0) + this.weight(id);
        if (/b10$/.test(id)) s.marks[this.galaxyOf(id)] = ax;
      }
      // a porta e a unica cena que pode ser revivida: a marca dela vale
      // sempre a ultima resposta (o eixo, esse, so conta na primeira vez)
      if (id === 'g10b10' && ax && AX.indexOf(ax) >= 0) s.marks[10] = ax;
      s.seen[id] = 1;
      HR.Store.save();
    },
    flag(k, v) { const s = data(); if (v === undefined) return s.flags[k]; s.flags[k] = v; HR.Store.save(); return v; },
    letter(n) { const s = data(); if (s.letters.indexOf(n) < 0) { s.letters.push(n); HR.Store.save(); } },

    axis() { return data().axis; },
    marks() { return data().marks; },
    dominant() {
      const a = this.axis();
      let best = 'Q', n = -1;   // empate ou zero: o caminho da Pergunta, que é o final de quem pulou
      AX.forEach(k => { if ((a[k] || 0) > n) { n = a[k] || 0; best = k; } });
      return n > 0 ? best : 'Q';
    },
    total() { const a = this.axis(); return (a.U || 0) + (a.Q || 0) + (a.F || 0); },

    /* ---------------- os quatro finais (v8) ----------------
       Tres saem do eixo dominante. O quarto, Muitas Maos, nao e um eixo:
       e o que sobra de quem parou no caminho. As tres bandeiras secretas
       — ficar no Ninho, olhar na Contemplacao e seguir a Costura — dizem,
       cada uma, que a pessoa perdeu tempo com alguem. Quem tem as tres
       chega acompanhada, e ai a porta e outra. */
    ENDING_FLAGS: ['ninho', 'contempla', 'costura'],
    accompanied() { const f = data().flags; return this.ENDING_FLAGS.every(k => !!f[k]); },
    // a resposta dada NA porta manda; quem pulou a pergunta cai no eixo
    // que somou mais no jogo inteiro; as tres bandeiras passam na frente
    ending() {
      if (this.accompanied()) return 'M';
      const m = data().marks[10];
      return AX.indexOf(m) >= 0 ? m : this.dominant();
    },
    // guarda o final visto; a porta continua aberta, entao a lista cresce
    seeEnding(e) {
      const s = data();
      s.ending = e;
      s.endings = s.endings || [];
      if (s.endings.indexOf(e) < 0) s.endings.push(e);
      HR.Store.save();
      return e;
    },
    endingsSeen() { return (data().endings || []).slice(); },

    /* ---------------- o que aparece e quando ---------------- */
    // entrada de uma galáxia (ri = 0..9), ao abrir a galáxia pela primeira vez
    entrance(ri) { const id = 'g' + (ri + 1); return this.mode() !== 'off' && !this.seen(id) && this.exists(id) ? id : null; },
    // visita do elenco antes da 1ª fase de um sistema
    visit(ri, si) {
      const id = 'g' + (ri + 1) + 'v' + (si + 1);
      return this.mode() === 'full' && !this.seen(id) && this.exists(id) ? id : null;
    },
    // conversa depois de vencer o chefe de um sistema
    bossTalk(ri, si) {
      const id = 'g' + (ri + 1) + 'b' + (si + 1), big = si === 9;
      if (this.mode() === 'off') return null;
      if (this.mode() === 'short' && !big) return null;
      // a porta fica aberta: quem voltar a 10-10-10 escolhe de novo
      if (id === 'g10b10') return this.exists(id) ? id : null;
      return !this.seen(id) && this.exists(id) ? id : null;
    },
    letterFor(ri) { const id = 'g' + (ri + 1) + 'c'; return this.mode() !== 'off' && !this.seen(id) && this.exists(id) ? id : null; },

    /* ---------------- o anel que Vela deixou girando ----------------
       Terminar galáxias deixa o Infinito mais generoso. É a única coisa
       da história que mexe em número — e mexe para mais, para todo mundo,
       inclusive para quem pula todas as cenas. */
    galaxiesCleared() {
      let n = 0;
      for (let i = 0; i < HR.REGIONS.length; i++) if (HR.Campaign.bossBeaten(i)) n++;
      return n;
    },
    endlessBonus() {
      const n = this.galaxiesCleared();
      return n <= 0 ? 1 : 1 + 0.2 + 0.1 * n;   // 1 galáxia = +30 % · 10 galáxias = +120 %
    },
    endlessBonusPct() { return Math.round((this.endlessBonus() - 1) * 100); }
  };
})();
