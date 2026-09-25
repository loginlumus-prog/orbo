/* =====================================================================
   ORBO v9 — a Forja, a Potencia e as Barreiras.

   O Infinito e onde se junta moeda. Faltava a Galaxia pedir essa moeda
   de um jeito que se VE: nao so "compre o Nucleo 12", mas uma parede no
   mapa, com um numero, e um caminho claro para vence-la.

   FORJA. A Egide e o Jato deixam de ser so estoque e passam a ter nivel
   (1 a 5), comprado com moeda:
     Egide  +5 s de bolha · -5 s de recarga · CASCA DUPLA (aguenta dois
            golpes) · +5 s · -5 s
     Jato   +15 % de corredor · +15 % · pouso com escudo · +15 % · +15 %

   POTENCIA. Um numero so para "o quanto a sua nave aguenta":
     Nucleo x 2  +  soma dos niveis das habilidades  +  Forja x 3
   (maximo 141). Aparece na Forja e em toda Barreira, com a conta aberta.

   BARREIRAS. Da Galaxia 4 em diante, os sistemas 4, 7 e 10 de cada
   galaxia so abrem com Potencia minima. A tela da Barreira diz quanto
   falta e oferece os tres caminhos: o Infinito (onde a moeda rende mais,
   pela Fenda), a Forja e o Nucleo. Sistema em que a pessoa ja jogou nunca
   e trancado de volta.

   Tudo por embrulho.
   ===================================================================== */
(function () {
  const C = HR.CONFIG, U = HR.U;
  if (!HR.GEAR || !HR.Campaign) return;

  /* ---------------- a Forja ---------------- */
  const CUSTO = [6000, 14000, 28000, 50000, 80000];
  const MAX = 5;
  const data = () => { const d = HR.Store.data; d.forja = d.forja || { aegis: 0, jet: 0 }; return d.forja; };

  HR.Forja = {
    MAX, CUSTO,
    nivel(id) { return Math.max(0, Math.min(MAX, data()[id] || 0)); },
    custo(id) { const n = this.nivel(id); return n >= MAX ? null : CUSTO[n]; },
    compra(id) {
      const c = this.custo(id); if (c == null) return false;
      if (!HR.Economy.spendCoins(c, 'forja_' + id)) return false;   // o aviso de moeda insuficiente ja sai de la
      data()[id] = this.nivel(id) + 1; HR.Store.save();
      HR.Audio.sfx('levelup');
      HR.Analytics.log('forja', { id, n: data()[id] });
      return true;
    },
    // o que cada nivel faz (i18n forja_<id>_<n>)
    passos(id) { return [1, 2, 3, 4, 5].map(n => 'forja_' + id + '_' + n); },
    aegisDur() { const n = this.nivel('aegis'); return 30 + (n >= 1 ? 5 : 0) + (n >= 4 ? 5 : 0); },
    aegisCd() { const n = this.nivel('aegis'); return 30 - (n >= 2 ? 5 : 0) - (n >= 5 ? 5 : 0); },
    aegisCamadas() { return this.nivel('aegis') >= 3 ? 2 : 1; },
    jetMul() { const n = this.nivel('jet'); return 1 + 0.15 * ([0, 1, 2, 2, 3, 4][n]); },
    jetEscudo() { return this.nivel('jet') >= 3; }
  };

  // Egide: duracao e recarga viram leituras vivas (o HUD e o jogo ja leem G.dur / G.cd)
  const GA = HR.GEAR.consumables.aegis;
  Object.defineProperty(GA, 'dur', { configurable: true, enumerable: true, get() { return HR.Forja.aegisDur(); } });
  Object.defineProperty(GA, 'cd', { configurable: true, enumerable: true, get() { return HR.Forja.aegisCd(); } });

  const Gp = HR.Game && HR.Game.prototype;
  if (Gp) {
    const origUseAegis = Gp.useAegis;
    Gp.useAegis = function () {
      // o aviso dizia "30 s" escrito a mao; agora diz a duracao da Forja
      const emit = this.emit;
      this.emit = function (n, o) { if (n === 'banner' && o && o.sub === '30 s') o.sub = HR.Forja.aegisDur() + ' s'; return emit.apply(this, arguments); };
      let ok;
      try { ok = origUseAegis.apply(this, arguments); } finally { this.emit = emit; }
      if (ok) this.run.aegisCamadas = HR.Forja.aegisCamadas();
      return ok;
    };
    // casca dupla: o primeiro golpe racha, o segundo quebra
    const origDamage = Gp.damage;
    Gp.damage = function (src, bypass) {
      const run = this.run;
      const racha = !bypass && run && run.aegisT > 0 && (run.aegisCamadas || 1) > 1 && run.mode !== 'practice';
      if (!racha) return origDamage.apply(this, arguments);
      const antes = run.aegisT, P = this.particles, txt = P.text;
      P.text = function (x, y, t, c, s) { if (t === HR.t('aegis_broken')) t = HR.t('forja_racha'); return txt.call(this, x, y, t, c, s); };
      let r;
      try { r = origDamage.apply(this, arguments); } finally { P.text = txt; }
      run.aegisCamadas--; run.aegisT = antes; run.aegisCd = 0;
      this.emit('gear', { kind: 'aegis' });
      return r;
    };
    // Jato: corredor mais longo (vale tambem para a pilha) e pouso com escudo
    const origUseJet = Gp.useJet;
    Gp.useJet = function () {
      const run = this.run, antes = run ? (run.jetLeft || 0) : 0;
      const ok = origUseJet.apply(this, arguments);
      if (ok && run && run.jetLeft > antes) {
        const extra = Math.round((run.jetLeft - antes) * (HR.Forja.jetMul() - 1));
        run.jetLeft += extra; run.jetTotal = (run.jetTotal || 0) + extra;
      }
      return ok;
    };
    const origEndJet = Gp.endJet;
    Gp.endJet = function () {
      const r = origEndJet.apply(this, arguments);
      const run = this.run;
      if (run && HR.Forja.jetEscudo() && run.shields < this.shieldCap()) {
        run.shields++;
        this.particles.text(this.ball.x, this.ball.y - 90, HR.t('forja_pouso'), '#4cf0ff', 22);
        this.emit('status', run);
      }
      return r;
    };
  }

  /* ---------------- a Potencia ---------------- */
  HR.Potencia = {
    partes() {
      const nucleo = (HR.Core ? HR.Core.level() : 0) * 2;
      let hab = 0;
      if (HR.Abilities) HR.ABILITIES.forEach(a => { if (HR.Abilities.owned(a.id)) hab += HR.Abilities.level(a.id); });
      const forja = (HR.Forja.nivel('aegis') + HR.Forja.nivel('jet')) * 3;
      return { nucleo, hab, forja };
    },
    valor() { const p = this.partes(); return p.nucleo + p.hab + p.forja; },
    max() { return (C.CORE.maxLevel * 2) + HR.ABILITIES.length * (HR.ABILITY_UPGRADE.maxLevel) + MAX * 2 * 3; }
  };

  /* ---------------- as Barreiras ---------------- */
  // [galaxia (ri)] -> Potencia para os sistemas 4, 7 e 10 (si 3, 6, 9)
  const NEED = {
    3: [34, 40, 46],
    4: [52, 58, 64],
    5: [70, 76, 82],
    6: [88, 91, 94],
    7: [98, 101, 104],
    8: [108, 112, 116],
    9: [120, 124, 128]
  };
  const SI = [3, 6, 9];
  const passadas = () => { const d = HR.Store.data; d.barreiras = d.barreiras || {}; return d.barreiras; };
  const Cp = HR.Campaign;
  const jaJogou = (ri, si) => { for (let li = 0; li < 10; li++) if (Cp.stars(Cp.at(ri, si, li).id) > 0) return true; return false; };

  HR.Barreiras = {
    NEED,
    precisa(ri, si) {
      const t = NEED[ri], k = SI.indexOf(si);
      if (!t || k < 0) return 0;
      const key = ri + '-' + si;
      if (passadas()[key] || jaJogou(ri, si)) return 0;
      return t[k];
    },
    // abre de vez quando a Potencia chega: gastar moeda depois nao tranca de volta
    confere(ri, si) {
      const n = this.precisa(ri, si); if (!n) return true;
      if (HR.Potencia.valor() >= n) { passadas()[ri + '-' + si] = true; HR.Store.save(); return true; }
      return false;
    },
    lista() { const out = []; Object.keys(NEED).forEach(ri => SI.forEach((si, k) => out.push({ ri: +ri, si, need: NEED[ri][k] }))); return out; }
  };

  const origGate = Cp.systemGate;
  Cp.systemGate = function (ri, si) {
    const g = origGate.apply(this, arguments);
    const need = HR.Barreiras.precisa(ri, si);
    if (!need) return g;
    const pot = HR.Potencia.valor();
    g.barreira = need; g.pot = pot;
    // a Barreira so e conferida quando o resto ja abriu: antes disso, o
    // cadeado de sempre (chefe e estrelas) e o que manda
    if (g.ok) {
      if (pot >= need) HR.Barreiras.confere(ri, si);
      else { g.ok = false; g.soBarreira = true; }
    }
    return g;
  };

  /* ---------------- a tela da Barreira ---------------- */
  function modal() {
    let m = document.getElementById('modal-barreira');
    if (m) return m;
    m = document.createElement('div');
    m.id = 'modal-barreira'; m.className = 'modal';
    m.innerHTML = '<div class="modal-card barreira-card"></div>';
    m.addEventListener('click', e => { if (e.target === m) fecha(); });
    (document.getElementById('app') || document.body).appendChild(m);
    return m;
  }
  function fecha() { const m = document.getElementById('modal-barreira'); if (m) m.classList.remove('visible'); }

  HR.Barreiras.abre = function (ri, si) {
    const need = this.precisa(ri, si); if (!need) return;
    const p = HR.Potencia.partes(), pot = p.nucleo + p.hab + p.forja, falta = Math.max(0, need - pot);
    const R = HR.REGIONS[ri], m = modal(), card = m.querySelector('.barreira-card');
    const fenda = HR.Rifts && HR.Rifts.mul ? HR.Rifts.mul(HR.Rifts.current()) : 1;
    card.style.setProperty('--ac', R ? R.accent : '#4cf0ff');
    card.innerHTML =
      '<div class="bar-head">' + HR.plate('shield', R ? R.accent : '#4cf0ff', 'lg') +
        '<div><span class="kicker">' + esc(HR.t('barreira')) + ' · ' + esc(HR.t('system_n', { name: Cp.systemName(si) })) + '</span>' +
        '<b class="bar-num">' + pot + ' <small>/ ' + need + '</small></b></div></div>' +
      '<i class="gate-bar"><span style="width:' + Math.min(100, pot / need * 100).toFixed(0) + '%"></span></i>' +
      '<p class="bar-txt">' + esc(HR.t('barreira_d', { n: falta })) + '</p>' +
      '<ul class="bar-partes">' +
        '<li>' + HR.icon('core') + '<span>' + esc(HR.t('pot_nucleo')) + '</span><b>' + p.nucleo + '</b></li>' +
        '<li>' + HR.icon('zap') + '<span>' + esc(HR.t('pot_hab')) + '</span><b>' + p.hab + '</b></li>' +
        '<li>' + HR.icon('aegis') + '<span>' + esc(HR.t('pot_forja')) + '</span><b>' + p.forja + '</b></li>' +
      '</ul>' +
      '<button type="button" class="btn btn-play" data-bar="inf"><span class="ic">' + HR.icon('infinity') + '</span><span class="btn-label">' + esc(HR.t('barreira_inf')) + '</span></button>' +
      (fenda > 1 ? '<p class="bar-fenda">' + esc(HR.t('barreira_fenda', { n: fenda.toFixed(2).replace(/\.?0+$/, '') })) + '</p>' : '') +
      '<div class="row">' +
        '<button type="button" class="btn btn-ghost" data-bar="forja"><span class="ic">' + HR.icon('aegis') + '</span><span class="btn-label">' + esc(HR.t('forja')) + '</span></button>' +
        '<button type="button" class="btn btn-ghost" data-bar="nucleo"><span class="ic">' + HR.icon('core') + '</span><span class="btn-label">' + esc(HR.t('core')) + '</span></button>' +
      '</div>' +
      '<button type="button" class="btn btn-ghost small-btn bar-fechar" data-bar="x"><span class="btn-label">' + esc(HR.t('close')) + '</span></button>';
    card.querySelectorAll('[data-bar]').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation(); HR.Audio.sfx('click');
      const k = b.getAttribute('data-bar');
      fecha();
      if (k === 'inf') { HR.UI.closePanels && HR.UI.closePanels(); HR.UI.open('rifts'); }
      else if (k === 'forja') { HR.UI.shopTab = 'gear'; HR.UI.open('shop'); }
      else if (k === 'nucleo') { HR.UI.open('galaxy'); }
    }));
    HR.Audio.sfx('error');
    m.classList.add('visible');
  };

  // no mapa: tocar num sistema trancado SO pela Barreira abre a tela dela
  // (fase de captura: chega antes do aviso generico de "trancado")
  document.addEventListener('click', e => {
    const btn = e.target && e.target.closest && e.target.closest('[data-system]');
    if (!btn) return;
    const p = btn.getAttribute('data-system').split('-').map(Number);
    const g = Cp.systemGate(p[0], p[1]);
    if (!g.soBarreira) return;
    e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    HR.Barreiras.abre(p[0], p[1]);
  }, true);

  // JOGAR: se a proxima coisa a fazer e uma Barreira, ela aparece — em vez de
  // repetir a ultima fase sem dizer por que
  if (HR.UI && HR.UI.play) {
    const origPlay = HR.UI.play;
    HR.UI.play = function () {
      if ((HR.Store.data.mode || 'endless') === 'campaign') {
        const b = proxima();
        if (b) { HR.Barreiras.abre(b.ri, b.si); return; }
      }
      return origPlay.apply(this, arguments);
    };
  }
  function proxima() {
    const ri = Cp.currentRegion();
    for (let si = 1; si < 10; si++) {
      const g = Cp.systemGate(ri, si);
      if (g.soBarreira) {
        // so interrompe se tudo antes dela ja esta vencido
        let tudo = true; for (let s = 0; s < si; s++) if (!Cp.systemBossBeaten(ri, s)) tudo = false;
        return tudo ? { ri, si } : null;
      }
      if (!g.ok) return null;
    }
    return null;
  }
  HR.Barreiras.proxima = proxima;

  // na ficha do sistema: se o proximo e uma Barreira, o selo diz isso
  if (HR.UI && HR.UI.renderSystem) {
    const origSys = HR.UI.renderSystem;
    HR.UI.renderSystem = function () {
      const r = origSys.apply(this, arguments);
      try {
        const seal = document.querySelector('#system-body .seal-card');
        const cur = document.querySelector('#system-body [data-level]');
        if (!seal || !cur) return r;
        const id = cur.getAttribute('data-level').split('-').map(Number);
        const ri = id[0] - 1, si = id[1] - 1, need = HR.Barreiras.precisa(ri, si + 1);
        if (!need) return r;
        const pot = HR.Potencia.valor();
        const el = document.createElement('button');
        el.type = 'button'; el.className = 'seal-card bar-seal' + (pot >= need ? ' ok' : '');
        el.innerHTML = HR.plate(pot >= need ? 'unlock' : 'shield', pot >= need ? '#35e29a' : '#ffcf4a', 'sm') +
          '<div class="seal-main"><span class="kicker">' + esc(HR.t('barreira')) + '</span><b>' + esc(HR.t('barreira_pot', { a: pot, b: need })) + '</b>' +
          '<i class="gate-bar"><span style="width:' + Math.min(100, pot / need * 100).toFixed(0) + '%"></span></i></div>';
        el.addEventListener('click', e => { e.stopPropagation(); HR.Audio.sfx('click'); if (pot < need) HR.Barreiras.abre(ri, si + 1); });
        seal.parentNode.insertBefore(el, seal.nextSibling);
      } catch (_) { /* nada */ }
      return r;
    };
  }

  /* ---------------- a Forja na loja (aba Itens) ---------------- */
  function forjaHtml() {
    const pot = HR.Potencia.valor(), p = HR.Potencia.partes();
    const box = U.el('div', 'forja');
    box.innerHTML = '<div class="forja-top">' + HR.plate('aegis', '#ffcf4a', 'sm') +
      '<div><span class="kicker">' + esc(HR.t('forja')) + '</span><b>' + esc(HR.t('pot_valor', { n: pot })) + '</b>' +
      '<small>' + esc(HR.t('pot_conta', { a: p.nucleo, b: p.hab, c: p.forja })) + '</small></div></div>';
    ['aegis', 'jet'].forEach(id => {
      const n = HR.Forja.nivel(id), custo = HR.Forja.custo(id), G = HR.GEAR.consumables[id];
      const card = U.el('div', 'forja-card'); card.style.setProperty('--ac', G.color);
      let h = HR.plate(G.icon, G.color, 'lg') + '<div class="forja-info"><b>' + esc(HR.t('forja_' + id)) + ' <span class="forja-nv">' + esc(HR.t('forja_nv', { n, m: MAX })) + '</span></b>';
      h += '<span class="forja-pips">' + [1, 2, 3, 4, 5].map(k => '<i class="' + (k <= n ? 'on' : '') + '"></i>').join('') + '</span>';
      h += '<ol class="forja-lista">' + HR.Forja.passos(id).map((k, i) => '<li class="' + (i < n ? 'feito' : i === n ? 'prox' : '') + '">' + esc(HR.t(k)) + '</li>').join('') + '</ol></div>';
      card.innerHTML = h;
      const b = U.el('button', 'btn shop-price' + (custo == null ? ' is-on' : ''), custo == null ? HR.UI.svg('check') + esc(HR.t('core_max')) : esc(HR.t('upgrade')) + ' <i class="ic-coin"></i>' + U.fmt(custo));
      b.disabled = custo == null;
      b.addEventListener('click', e => {
        e.stopPropagation();
        if (HR.Forja.compra(id)) {
          HR.UI.toast(HR.icon(G.icon) + ' ' + HR.t('forja_up', { name: HR.t('forja_' + id), n: HR.Forja.nivel(id) }), 'good');
          HR.UI.renderShop(); if (HR.UI.refreshMenu) HR.UI.refreshMenu();
        }
      });
      card.appendChild(b);
      box.appendChild(card);
    });
    return box;
  }
  function poeForja() {
    if (HR.UI.shopTab !== 'gear') return;
    const body = document.getElementById('shop-body'); if (!body || body.querySelector('.forja')) return;
    body.insertBefore(forjaHtml(), body.firstChild);
  }
  // a loja se redesenha por dentro (comprar uma Egide chama o render interno):
  // o observador garante que a Forja volte em qualquer caminho
  const obs = () => {
    const body = document.getElementById('shop-body');
    if (!body || body.dataset.forjaObs || typeof MutationObserver === 'undefined') return;
    body.dataset.forjaObs = '1';
    new MutationObserver(() => { if (!body.querySelector('.forja')) poeForja(); }).observe(body, { childList: true });
  };
  if (HR.UI && HR.UI.renderShop) {
    const origShop = HR.UI.renderShop;
    HR.UI.renderShop = function () { const r = origShop.apply(this, arguments); obs(); poeForja(); return r; };
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
})();

Object.assign(HR.I18N.pt, {
  forja: 'Forja', forja_aegis: 'Égide', forja_jet: 'Jato', forja_nv: 'nível {n}/{m}',
  forja_aegis_1: '+5 s de bolha', forja_aegis_2: '−5 s de recarga', forja_aegis_3: 'Casca dupla: aguenta dois golpes', forja_aegis_4: '+5 s de bolha', forja_aegis_5: '−5 s de recarga',
  forja_jet_1: 'Corredor 15 % mais longo', forja_jet_2: 'Corredor 15 % mais longo', forja_jet_3: 'Pouso com um escudo', forja_jet_4: 'Corredor 15 % mais longo', forja_jet_5: 'Corredor 15 % mais longo',
  forja_up: '{name} forjada · nível {n}', forja_racha: 'ÉGIDE RACHOU', forja_pouso: '+1 ESCUDO',
  pot_valor: 'Potência {n}', pot_conta: 'Núcleo {a} + Habilidades {b} + Forja {c}',
  pot_nucleo: 'Núcleo (nível × 2)', pot_hab: 'Habilidades (soma dos níveis)', pot_forja: 'Forja (níveis × 3)',
  barreira: 'Barreira', barreira_pot: 'Potência {a} de {b}',
  barreira_d: 'Faltam {n} de Potência. Junte moedas e fortaleça a nave: suba o Núcleo, as habilidades ou a Forja.',
  barreira_inf: 'Ir ao Infinito', barreira_fenda: 'Na sua Fenda, o Infinito paga ×{n}.'
});
Object.assign(HR.I18N.en, {
  forja: 'Forge', forja_aegis: 'Aegis', forja_jet: 'Jet', forja_nv: 'level {n}/{m}',
  forja_aegis_1: '+5 s of bubble', forja_aegis_2: '−5 s of recharge', forja_aegis_3: 'Double shell: takes two hits', forja_aegis_4: '+5 s of bubble', forja_aegis_5: '−5 s of recharge',
  forja_jet_1: 'Corridor 15 % longer', forja_jet_2: 'Corridor 15 % longer', forja_jet_3: 'Lands with a shield', forja_jet_4: 'Corridor 15 % longer', forja_jet_5: 'Corridor 15 % longer',
  forja_up: '{name} forged · level {n}', forja_racha: 'AEGIS CRACKED', forja_pouso: '+1 SHIELD',
  pot_valor: 'Power {n}', pot_conta: 'Core {a} + Abilities {b} + Forge {c}',
  pot_nucleo: 'Core (level × 2)', pot_hab: 'Abilities (sum of levels)', pot_forja: 'Forge (levels × 3)',
  barreira: 'Barrier', barreira_pot: 'Power {a} of {b}',
  barreira_d: '{n} Power to go. Gather coins and strengthen your ship: raise the Core, your abilities or the Forge.',
  barreira_inf: 'Go to Endless', barreira_fenda: 'In your Rift, Endless pays ×{n}.'
});
Object.assign(HR.I18N.es, {
  forja: 'Forja', forja_aegis: 'Égida', forja_jet: 'Jet', forja_nv: 'nivel {n}/{m}',
  forja_aegis_1: '+5 s de burbuja', forja_aegis_2: '−5 s de recarga', forja_aegis_3: 'Doble capa: aguanta dos golpes', forja_aegis_4: '+5 s de burbuja', forja_aegis_5: '−5 s de recarga',
  forja_jet_1: 'Pasillo 15 % más largo', forja_jet_2: 'Pasillo 15 % más largo', forja_jet_3: 'Aterriza con un escudo', forja_jet_4: 'Pasillo 15 % más largo', forja_jet_5: 'Pasillo 15 % más largo',
  forja_up: '{name} forjada · nivel {n}', forja_racha: 'ÉGIDA AGRIETADA', forja_pouso: '+1 ESCUDO',
  pot_valor: 'Potencia {n}', pot_conta: 'Núcleo {a} + Habilidades {b} + Forja {c}',
  pot_nucleo: 'Núcleo (nivel × 2)', pot_hab: 'Habilidades (suma de niveles)', pot_forja: 'Forja (niveles × 3)',
  barreira: 'Barrera', barreira_pot: 'Potencia {a} de {b}',
  barreira_d: 'Faltan {n} de Potencia. Junta monedas y fortalece la nave: sube el Núcleo, las habilidades o la Forja.',
  barreira_inf: 'Ir al Infinito', barreira_fenda: 'En tu Grieta, el Infinito paga ×{n}.'
});

// a descricao da Egide dizia "30 s" fixo; com a Forja ela acompanha o nivel
(function () {
  const F = () => HR.Forja;
  const txt = {
    pt: () => 'Uma bolha envolve a bola por ' + F().aegisDur() + ' s. O primeiro erro quebra a Égide e você continua' + (F().aegisCamadas() > 1 ? ' (casca dupla: dois erros)' : '') + '. Recarga de ' + F().aegisCd() + ' s. Use quantas tiver.',
    en: () => 'A bubble wraps the ball for ' + F().aegisDur() + ' s. The first mistake breaks the Aegis and you keep going' + (F().aegisCamadas() > 1 ? ' (double shell: two mistakes)' : '') + '. ' + F().aegisCd() + ' s cooldown. Use as many as you own.',
    es: () => 'Una burbuja envuelve la bola por ' + F().aegisDur() + ' s. El primer error rompe la Égida y sigues' + (F().aegisCamadas() > 1 ? ' (doble capa: dos errores)' : '') + '. Recarga de ' + F().aegisCd() + ' s. Usa todas las que tengas.'
  };
  Object.keys(txt).forEach(l => { if (HR.I18N[l]) Object.defineProperty(HR.I18N[l], 'aegis_d', { configurable: true, enumerable: true, get: txt[l] }); });
})();
