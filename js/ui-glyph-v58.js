/* =====================================================================
   ORBO v5.8: ícones vivos nos botões, nos talentos e no começo da partida.
   - HR.glyph(nome): o desenho de sempre, agora com uma animação curta e a cor própria
     do assunto. Os oito ícones do menu reaproveitam os glifos ricos do v5.2.
   - Botões do jogo (pausa, fim de fase, painéis, voltar) ganham a placa colorida com anel,
     no mesmo estilo dos botões da órbita do menu.
   - Talentos: cada árvore tem cor e glifo; o talento mostra a cor da árvore, então dá para
     ver a categoria de relance — inclusive nos cartões de escolha da partida.
   - Começo da partida: os jatos viram fichas pequenas (símbolo + quantidade), abaixo do
     "toque para começar" e centralizadas, sem cobrir o texto.
   ===================================================================== */
(function () {
  const $ = (s, r) => HR.U.$(s, r), $$ = (s, r) => HR.U.$$(s, r);

  /* ---------------- cor por assunto ---------------- */
  const COLOR = {
    play: '#2fd58e', pause: '#4cf0ff', refresh: '#4cf0ff', rotate: '#4cf0ff', arrowRight: '#4cf0ff',
    sparkle: '#a78bfa', sound: '#35e29a', music: '#ff5fc8', home: '#8fa6ff', share: '#4cf0ff',
    back: '#9fb0d8', chevronLeft: '#9fb0d8', chevronRight: '#9fb0d8', close: '#ff8aa0', check: '#35e29a',
    gear: '#c9d3ee', school: '#7cff6b', light: '#ffe27a', infinity: '#a29bfe', calendar: '#ff9a3d',
    video: '#ff6b7e', gift: '#ff5d6c', galaxy: '#6f8bff', shop: '#ff5fc8', trophy: '#ffc53d',
    collection: '#a78bfa', mission: '#ff9a3d', powers: '#3ee89a', rank: '#35d6ff', flag: '#6f8bff',
    star: '#ffcf4a', coin: '#ffcf4a', coins: '#ffcf4a', gem: '#a29bfe', bag: '#ffcf4a',
    heart: '#ff8aa0', shield: '#4cf0ff', target: '#35e29a', flame: '#ff8a3d', ring: '#9be7ff',
    ringBig: '#9be7ff', speed: '#9be7ff', cooldown: '#c3b8ff', hourglass: '#9be7ff', wind: '#a78bfa',
    jet: '#ffb347', megajet: '#ff7ad9', aegis: '#4cf0ff', info: '#8fa6ff', lock: '#8d97b3',
    sliders: '#4cf0ff', user: '#8fa6ff', pulse: '#ff8aa0', heartbeat: '#ff8aa0', award: '#ffc53d', vibrate: '#ff9a3d', zap: '#3ee89a',
    crown: '#ffcf4a', dialogue: '#a78bfa', plus: '#35e29a', x: '#ff8aa0'
  };
  /* ---------------- animação por assunto (curta, discreta, sem texto animado) ---------------- */
  const ANIM = {
    play: 'g-pop', pause: 'g-beat', refresh: 'g-turn', rotate: 'g-turn', hourglass: 'g-turn',
    gear: 'g-spin', cooldown: 'g-spin', sparkle: 'g-twinkle', star: 'g-twinkle', gem: 'g-twinkle',
    sound: 'g-beat', video: 'g-beat', light: 'g-beat', heart: 'g-beat', check: 'g-pop',
    music: 'g-bob', home: 'g-bob', school: 'g-bob', calendar: 'g-bob', bag: 'g-bob', coins: 'g-bob',
    back: 'g-left', chevronLeft: 'g-left', wind: 'g-left',
    chevronRight: 'g-right', arrowRight: 'g-right', speed: 'g-right', share: 'g-rise',
    target: 'g-breathe', shield: 'g-breathe', ring: 'g-breathe', ringBig: 'g-breathe', infinity: 'g-breathe',
    flame: 'g-flick', jet: 'g-flick', megajet: 'g-flick', aegis: 'g-breathe', coin: 'g-flip',
    close: 'g-shake', lock: 'g-shake', x: 'g-shake', plus: 'g-pop', zap: 'g-flick',
    crown: 'g-twinkle', dialogue: 'g-bob', pulse: 'g-beat', heartbeat: 'g-beat', sliders: 'g-beat', user: 'g-bob', award: 'g-twinkle', vibrate: 'g-beat'
  };
  // glifos ricos do menu (v5.2): mesmo traço, partes animadas
  const RICH = { shop: 'shop', mission: 'missions', gift: 'daily', trophy: 'trophies', collection: 'collection', rank: 'leaderboard', galaxy: 'galaxy', powers: 'abilities' };

  const richOf = name => { const G = HR.GLYPH52, k = RICH[name]; return G && k && G[k] ? G[k] : null; };

  // HR.glyph('refresh') → o mesmo ícone, com vida. Sem animação conhecida, devolve o ícone normal.
  HR.glyph = function (name, cls, filled) {
    const rich = richOf(name);
    if (rich) return '<svg class="i og g58' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + rich + '</svg>';
    const base = HR.icon(name, 'g58' + (cls ? ' ' + cls : ''), filled), a = ANIM[name];
    if (!a) return base;
    const i = base.indexOf('>');
    return base.slice(0, i + 1) + '<g class="' + a + '">' + base.slice(i + 1, -6) + '</g></svg>';
  };
  HR.glyphColor = name => COLOR[name] || '';

  /* ---------------- cores prontas: o iOS 15 nao tem color-mix() ----------------
     Todo aro, placa e brilho do v5.6/v5.8/v6.0 era color-mix(): no iPhone 7 a
     declaracao inteira sumia (icone sem placa, talento sem cor). As mesmas
     porcentagens saem daqui em rgba, com o nome --<var>-a<NN> (NN = alfa x 100). */
  const ALFAS = {
    ic: [20, 26, 28, 34, 35, 40, 42, 45, 46, 55, 90],
    tc: [9, 10, 16, 18, 20, 22, 24, 26, 32, 34, 35, 38, 42, 45, 48, 55, 60],
    rc: [16, 18, 22, 25, 26, 30, 34, 40, 45, 50, 60, 70],
    ac: [30, 50],
    cc: [60]
  };
  function derivar(el, base) {
    const c = (el.style.getPropertyValue('--' + base) || '').trim();
    if (c.charAt(0) !== '#' || el.getAttribute('data-c-' + base) === c) return;
    el.setAttribute('data-c-' + base, c);
    const U = HR.U, set = (n, v) => el.style.setProperty(n, v);
    ALFAS[base].forEach(a => set('--' + base + '-a' + a, U.rgba(c, a / 100)));
    if (base === 'ic') set('--ic-aro', U.rgba(U.mix(c, '#ffffff', 0.19), 0.47));          // 38% do --ic sobre o --stroke
    if (base === 'tc') {
      set('--tc-txt', U.mix(c, '#7a86a8', 0.38));                                        // 62% do --tc com o cinza do texto
      set('--tc-cl', U.mix(c, '#ffffff', 0.3));                                          // 70% com branco
      set('--tc-linha', U.rgba(U.mix(c, '#ffffff', 0.185), 0.32));                       // 26% sobre branco 8%
      set('--tc-no', U.rgba(U.mix(c, '#ffffff', 0.233), 0.117));                         // 9% sobre branco 3%
      set('--tc-pz', U.rgba(U.mix(c, '#ffffff', 0.138), 0.232));                         // 20% sobre branco 4%
      set('--tc-on', U.rgba(U.mix(c, '#ffffff', 0.154), 0.213));                         // 18% sobre branco 4%
    }
  }
  function cores(root) {
    $$('[style]', root || document).forEach(el => { for (const b in ALFAS) derivar(el, b); });
  }
  HR.UI.coresVivas = cores;

  // pinta a placa do ícone com a cor do assunto
  function tint(el, name, soft) {
    const c = COLOR[name]; if (!c) return;
    el.style.setProperty('--ic', c);
    el.style.setProperty('--ol', HR.U.mix(c, '#ffffff', 0.55));
    derivar(el, 'ic');
    if (!soft) {
      el.classList.add('ic-live');
      // a classe faz o papel do :has(> .ic-live) do v6.0, que o iOS 15 ignora
      const btn = el.parentNode; if (btn && btn.classList && btn.classList.contains('btn-icon')) { btn.classList.add('has-live'); btn.style.setProperty('--ic', c); derivar(btn, 'ic'); }
    }
  }

  /* ---------------- botões: ícone colorido, com anel e animação ---------------- */
  const PLAIN = 'btn-play btn-reward btn-gem'.split(' ');   // botões que já têm cor forte: só a animação
  function upgrade(root) {
    cores(root);
    $$('.btn > .ic[data-icon], .btn-icon > .ic[data-icon], .mode-btn > .ic[data-icon], .hero-arrow > .ic[data-icon]', root || document).forEach(el => {
      if (el.dataset.g58) return;
      const name = el.getAttribute('data-icon'); if (!name) return;
      el.dataset.g58 = '1';
      el.innerHTML = HR.glyph(name);
      const btn = el.parentNode, plain = PLAIN.some(c => btn.classList.contains(c));
      tint(el, name, plain);
    });
  }
  HR.UI.glyphUpgrade = upgrade;

  const after = (obj, name, fn) => {
    const orig = obj[name]; if (typeof orig !== 'function') return;
    obj[name] = function () { const r = orig.apply(this, arguments); try { fn.apply(this, arguments); } catch (_) { /* nada */ } return r; };
  };
  after(HR.UI, 'init', () => upgrade());
  after(HR.UI, 'setBase', () => upgrade());
  after(HR.UI, 'open', () => upgrade());
  after(HR.UI, 'back', () => upgrade());
  after(HR.UI, 'pause', () => upgrade());
  after(HR.UI, 'refreshControlBtn', () => upgrade());
  // painéis e janelas que se desenham por conta própria
  'renderDaily renderAbilities renderSlots openAbilityPicker renderRegion renderSystem renderSingularity openLevelDetail openSingularityDetail renderMissions renderShop onLevelEnd showPerks hudInit'
    .split(' ').forEach(n => after(HR.UI, n, () => upgrade()));
  // telas que so precisam das cores prontas (sem glifo novo)
  'refreshMenu refreshMode renderSettings renderLeaderboard renderAchievements renderRifts openPerkSheet hudPerks renderPauseControl'
    .split(' ').forEach(n => after(HR.UI, n, () => cores()));

  /* ---------------- começo da partida: jato vira ficha (símbolo + quantidade) ---------------- */
  function leanJets() {
    const host = $('#hud-jets'); if (!host) return;
    const desktop = !HR.U.isTouch();
    $$('.jet-btn', host).forEach(btn => {
      if (btn.dataset.g58) return;
      btn.dataset.g58 = '1';
      const k = btn.dataset.jet, n = HR.Consumables.count(k);
      const txt = btn.querySelector('.jet-txt'); if (txt) txt.remove();
      const plate = btn.querySelector('.plate'); if (plate) plate.innerHTML = HR.glyph(k);
      btn.classList.add('jet-chip');
      btn.insertAdjacentHTML('beforeend', '<b class="jet-n">×' + n + '</b>' + (desktop && k === 'jet' ? '<kbd>J</kbd>' : ''));
    });
  }
  after(HR.UI, 'renderGear', leanJets);

  /* ---------------- talentos: a cor da árvore diz a categoria ---------------- */
  const treeOf = id => {
    const T = HR.PERK_TREES; if (!T) return null;
    for (let i = 0; i < T.length; i++) if (T[i].ids.indexOf(id) >= 0) return T[i];
    return null;
  };
  HR.perkTree = treeOf;
  // cartões de escolha: selo da árvore no canto (cor + símbolo, o nome fica na dica)
  after(HR.UI, 'renderPerkCards', function () {
    const host = $('#perk-cards'); if (!host) return;
    (this.perkOffers || []).forEach((p, i) => {
      const card = host.children[i]; if (!card || card.dataset.g58) return;
      card.dataset.g58 = '1';
      const t = treeOf(p.id); if (!t) return;
      card.style.setProperty('--tc', t.color);
      derivar(card, 'tc');   // as cores do selo da árvore, prontas (sem color-mix)
      card.classList.add('has-tree');
      card.insertAdjacentHTML('afterbegin', '<span class="pc-tree" data-tip="' + HR.UI.esc(HR.t('pk_tree_' + t.id)) + '" data-tip-tap="1">' + HR.glyph(t.icon) + '</span>');
    });
  });
})();
