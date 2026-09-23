/* =====================================================================
   ORBO v8 — Os dez ovos escondidos.

   Coisas que ninguem pede e ninguem explica: quem acha, acha. Cada ovo e
   uma conquista secreta (cat 'secret', hidden) e, quando cabe, uma cena.
   Tudo por embrulho de funcoes que ja existem, como o Ninho faz: este
   arquivo nao edita nenhum outro.

   Regras que este arquivo garante:
   - nenhum ovo mexe em moeda, vida, escudo, velocidade ou dificuldade
     (a unica fase moldada, a 6-4-5, so fica mais quieta);
   - tudo idempotente: a marca fica em HR.Store.data.story.flags.egg_*,
     e recarregar a pagina nao repete conquista;
   - nada de setInterval: o relogio e o proprio quadro do jogo, e todo
     estado de tela e limpo ao trocar de tela.

   Para testar sem esperar: HR.EASTER_SPEED = 10 (os tempos de espera
   correm dez vezes mais rapido), HR.EASTER_CLOCK = '03:33' (relogio),
   HR.EASTER_NOW = timestamp (a data de hoje).

   Os ovos:
    1. contempla  — 15 s parada na 6-4-5: o ponto azul e os pequenos
    2. dormiu     — 90 s parado no menu: a bola dorme
    3. sete_o     — 7 toques no ultimo O do letreiro
    4. h333       — abrir o menu as 03:33
    5. arcos_33   — terminar com exatamente 33 arcos
    6. familia    — o nome do perfil e o de alguem da historia
    7. companhia  — 60 s na pausa sem tocar
    8. um_ano     — um ano depois do primeiro dia
    9. silencio   — 20 arcos com som e musica desligados
   10. codigo     — cima cima baixo baixo esquerda direita esquerda direita
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  if (!HR.UI || !HR.Game || !HR.Store || !HR.Story) return;
  const $ = (s, r) => HR.U.$(s, r), $$ = (s, r) => HR.U.$$(s, r);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const QUIETA = '6-4-5';
  const TAU = Math.PI * 2;

  /* ---------------- embrulhos ---------------- */
  const after = (obj, name, fn) => {
    const orig = obj[name]; if (typeof orig !== 'function') return;
    obj[name] = function () { const r = orig.apply(this, arguments); try { fn.apply(this, arguments); } catch (_) { /* nada */ } return r; };
  };
  const before = (obj, name, fn) => {
    const orig = obj[name]; if (typeof orig !== 'function') return;
    obj[name] = function () { try { fn.apply(this, arguments); } catch (_) { /* nada */ } return orig.apply(this, arguments); };
  };

  /* ---------------- o estado (so em memoria) ---------------- */
  const S = {
    lastInput: 0, mx: 0, my: 0,
    cont: { on: false, fase: '', t: 0, quieto: 0 }, lento: 1,
    dorme: false, dormeT: 0,
    oN: 0, oT: 0, gira: null,
    comp: false,
    cod: { i: 0, t0: 0 }, conf: null,
    toque: null, ponteiro: null,
    busy: {}, falaPoeira: false
  };
  HR.Easter = { state: S };

  const sfx = n => { try { HR.Audio.sfx(n); } catch (_) { /* nada */ } };
  const tom = o => { try { if (HR.Audio.ctx && HR.Store.data.settings.sound) HR.Audio.tone(o); } catch (_) { /* nada */ } };
  const vel = () => (+HR.EASTER_SPEED > 0 ? +HR.EASTER_SPEED : 1);
  const agora = () => (HR.EASTER_NOW != null && +HR.EASTER_NOW > 0 ? +HR.EASTER_NOW : Date.now());
  const flag = k => !!(HR.Store.data && HR.Story.flag('egg_' + k));
  // marca o ovo; devolve true so na primeira vez
  const marca = k => { if (flag(k)) return false; HR.Story.flag('egg_' + k, true); return true; };
  const premia = () => setTimeout(() => { try { if (HR.UI.trophyCheck) HR.UI.trophyCheck(); else HR.Achievements.check(); } catch (_) { /* nada */ } }, 300);
  const noMenu = () => HR.UI.current === 'menu' && !HR.UI.stack.length && !HR.UI.isModalOpen();
  const cena = (id, fim) => { if (HR.UI.storyScene) HR.UI.storyScene(id, fim); else if (fim) fim(); };
  const ease = k => 1 - Math.pow(1 - HR.U.clamp(k, 0, 1), 3);

  /* ---------------- as dez conquistas ---------------- */
  const OVOS = [
    ['contempla', 120, 'planet'], ['dormiu', 40, 'moon'], ['sete_o', 30, 'spin'], ['h333', 33, 'clock'],
    ['arcos_33', 33, 'ring'], ['familia', 50, 'hands'], ['companhia', 40, 'seed'], ['um_ano', 200, 'calendar'],
    ['silencio', 25, 'volumeX'], ['codigo', 60, 'gamepad']
  ];
  if (HR.ACHIEVEMENTS) OVOS.forEach(([id, gems, icon]) => {
    if (!HR.ACHIEVEMENTS.some(a => a.id === id)) HR.ACHIEVEMENTS.push({ id, cat: 'secret', hidden: true, stat: 'egg_' + id, target: 1, gems, icon });
  });
  const stats5 = HR.Achievements.stats5;
  HR.Achievements.stats5 = function () {
    const out = stats5.apply(this, arguments);
    const f = (HR.Store.data.story && HR.Store.data.story.flags) || {};
    OVOS.forEach(([id]) => { out['egg_' + id] = f['egg_' + id] ? 1 : 0; });
    return out;
  };

  /* ---------------- o elenco novo: os pequenos (e o Eco por cena) ---------------- */
  HR.STORY_CAST.pequenos = HR.STORY_CAST.pequenos || { ic: 'planet', c: '#9fd0ff' };
  HR.STORY_CAST.eco = HR.STORY_CAST.eco || { ic: 'eye', c: '#8a86b8' };
  // os pequenos falam em coro: a voz e a do Cardume
  const cast0 = HR.Story.cast;
  HR.Story.cast = function (nome, ri) { const w = cast0.call(this, nome, ri); if (nome === 'pequenos') w.voz = 'cardume'; return w; };

  /* ---------------- a bola Ponto Azul ---------------- */
  HR.Render.PATTERNS = HR.Render.PATTERNS || {};
  // um ponto azul palido, um fio branco de nuvem girando e um brilho de borda.
  // chamado por drawBall ja recortado no circulo, centrado em (0,0).
  HR.Render.PATTERNS.pontoazul = function (ctx, r, sk, t, rot) {
    const u = HR.U, glow = sk.glow || '#bfe3ff';
    // o mar: mais fundo para a borda
    const g = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
    g.addColorStop(0, u.rgba('#dff0ff', 0.55)); g.addColorStop(0.55, u.rgba(sk.base || '#9fd0ff', 0.15)); g.addColorStop(1, u.rgba(sk.dark || '#1a2a5a', 0.55));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    // o fio de nuvem: uma faixa branca que da a volta devagar
    ctx.save();
    ctx.rotate(t * 0.35 + (rot || 0) * 0.15);
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,255,255,0.78)'; ctx.lineWidth = r * 0.15;
    ctx.beginPath(); ctx.moveTo(-r * 0.92, -r * 0.18); ctx.bezierCurveTo(-r * 0.4, r * 0.28, r * 0.25, -r * 0.34, r * 0.9, r * 0.12); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.42)'; ctx.lineWidth = r * 0.07;
    ctx.beginPath(); ctx.moveTo(-r * 0.6, r * 0.62); ctx.bezierCurveTo(-r * 0.1, r * 0.4, r * 0.3, r * 0.72, r * 0.7, r * 0.5); ctx.stroke();
    ctx.restore();
    // a atmosfera: brilho de borda
    const a = ctx.createRadialGradient(0, 0, r * 0.62, 0, 0, r);
    a.addColorStop(0, u.rgba(glow, 0)); a.addColorStop(1, u.rgba(glow, 0.5));
    ctx.fillStyle = a; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = u.rgba(glow, 0.75); ctx.lineWidth = Math.max(1, r * 0.07);
    ctx.beginPath(); ctx.arc(0, 0, r * 0.95, 0, TAU); ctx.stroke();
  };
  if (HR.CONFIG && HR.CONFIG.SKINS && !HR.CONFIG.SKINS.some(s => s.id === 'pontoazul')) {
    HR.CONFIG.SKINS.push({
      id: 'pontoazul', col: 'galaxies', rar: 'legendary', lvl: 1, cur: 'reward', price: 0, gems: 0,
      base: '#9fd0ff', dark: '#1a2a5a', glow: '#bfe3ff', pattern: 'pontoazul', galaxy: 5
    });
  }
  function daBola(id) {
    const d = HR.Store.data;
    if (d.owned && d.owned.skins && d.owned.skins.indexOf(id) < 0) { d.owned.skins.push(id); HR.Store.save(); return true; }
    return false;
  }

  /* ---------------- o estilo (uma folha so) ---------------- */
  function estilo() {
    if ($('#egg-css')) return;
    const st = document.createElement('style'); st.id = 'egg-css';
    st.textContent =
      '.lg-ult{display:inline-block;transform-origin:50% 54%}' +
      '.lg-ult.egg-gira{animation:eggGira 3s cubic-bezier(.2,.8,.2,1) both;color:#141024;-webkit-text-stroke:1.5px #f2f6ff;text-shadow:0 0 14px rgba(159,232,255,.9)}' +
      '@keyframes eggGira{from{transform:rotate(0)}to{transform:rotate(2520deg)}}' +
      '.egg-fala,.egg-comp{display:flex;align-items:center;justify-content:center;gap:10px;margin:8px auto 0;padding:8px 14px;border-radius:14px;max-width:340px;' +
        'background:rgba(230,216,255,.08);border:1px solid rgba(230,216,255,.28);color:#e6d8ff;font-size:14px;font-weight:500;line-height:1.3;text-align:left}' +
      '.egg-fala .ic,.egg-comp .ic{width:20px;height:20px;flex:none;color:#e6d8ff}' +
      '.egg-comp{margin-top:4px;width:100%}' +
      '@media (prefers-reduced-motion:reduce){.lg-ult.egg-gira{animation:none}}';
    document.head.appendChild(st);
  }
  estilo();

  /* ---------------- entrada: quando foi o ultimo toque ---------------- */
  function entrada() { S.lastInput = performance.now(); if (S.dorme) acorda(); }
  window.addEventListener('pointerdown', entrada, true);
  window.addEventListener('keydown', entrada, true);
  window.addEventListener('touchstart', entrada, { capture: true, passive: true });
  window.addEventListener('wheel', entrada, { capture: true, passive: true });
  window.addEventListener('pointermove', e => {
    if (Math.abs(e.clientX - S.mx) + Math.abs(e.clientY - S.my) < 6) return;
    S.mx = e.clientX; S.my = e.clientY; entrada();
  }, { capture: true, passive: true });
  S.lastInput = performance.now();

  /* =====================================================================
     1. A CONTEMPLACAO — fase 6-4-5
     ===================================================================== */
  // a fase fica quieta: poucos arcos, largos, lentos, todos na linha do meio,
  // sem eventos, sem obstaculos. E o capitulo da calmaria.
  function quieta() {
    const lv = HR.Campaign && HR.Campaign.level ? HR.Campaign.level(QUIETA) : null;
    if (!lv || lv.quieta) return lv;
    lv.quieta = true;
    lv.rings = 14;
    lv.v0 = 520; lv.speed = Math.round(lv.v0 / 265 * 100) / 100; lv.ramp = 0.03; lv.tb0 = 1.2;
    lv.events = []; lv.mods = []; lv.dirs = ['right']; lv.dirEvery = 99; lv.waves = 0; lv.boss = null;
    lv.params = Object.assign({}, lv.params, {
      radius: (lv.params.radius || 1) * 1.6, tbMul: (lv.params.tbMul || 1) * 1.6, yDelta: 0,
      osc: 0, oscF: 0, rot: 0, rotF: 0, dbl: 0, burst: 0, shrink: 0, tiltVar: 0, fog: 0, dark: 0, obs: 0, mix: 0
    });
    return lv;
  }
  quieta();
  before(HR.UI, 'startLevel', function (id) { if (id === QUIETA) quieta(); });

  // o tempo do jogo desacelera de mansinho enquanto o fundo escurece
  const ets = HR.Game.prototype.effectiveTimeScale;
  HR.Game.prototype.effectiveTimeScale = function () { return ets.apply(this, arguments) * S.lento; };

  function parada(g) {
    const b = g.ball, I = HR.Input, k = I.keys;
    if (g.run.autoT > 0 || I.down || I.stick.active || k.up || k.down || k.left || k.right) return false;
    return Math.hypot(b.vx, b.vy) < 4 && Math.abs(b.tx - b.x) < 2 && Math.abs(b.ty - b.y) < 2;
  }
  function contemplar() { S.cont = { on: true, fase: 'escurece', t: 0, quieto: 0 }; }
  function contemplaTick(g, dt) {
    const C = S.cont;
    C.t += dt;
    if (C.fase === 'escurece') {
      S.lento = 1 - ease(C.t / 4);
      if (C.t < 4) return;
      // alguem pausou, saiu ou abriu algo no meio: desfaz sem marcar nada
      if (g.state !== 'playing' || HR.UI.current !== 'hud' || HR.UI.isModalOpen()) { C.fase = 'volta'; C.t = 0; return; }
      C.fase = 'cena'; S.lento = 0;
      g.pause();
      cena('contempla', () => {
        marca('contempla');
        daBola('pontoazul');
        try { if (HR.Frag) { HR.Frag.check('segredo', 'contempla'); setTimeout(() => HR.Frag.check('segredo', 'pontoazul'), 1600); } } catch (_) { /* nada */ }
        premia();
        C.fase = 'volta'; C.t = 0;
        if (g.state === 'paused') HR.UI.resume();
      });
    } else if (C.fase === 'volta') {
      S.lento = ease(C.t / 1.5);
      if (C.t >= 1.5) { S.lento = 1; S.cont = { on: false, fase: '', t: 0, quieto: 0 }; }
    }
  }
  function pintaContempla(g) {
    const C = S.cont, ctx = g.ctx, W = g.W, H = g.H;
    const k = C.fase === 'escurece' ? ease(C.t / 4) : C.fase === 'cena' ? 1 : 1 - ease(C.t / 1.5);
    if (k <= 0) return;
    ctx.save();
    ctx.fillStyle = 'rgba(2,4,12,' + (0.88 * k).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H);
    // o ponto azul: pequeno, longe, e cresce
    const x = W * 0.5, y = H * 0.40, r = 1.2 + 7 * ease(k) * (1 + 0.03 * Math.sin(g.time * 1.3));
    const halo = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 7);
    halo.addColorStop(0, 'rgba(159,208,255,' + (0.45 * k).toFixed(3) + ')'); halo.addColorStop(1, 'rgba(159,208,255,0)');
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, r * 7, 0, TAU); ctx.fill();
    ctx.globalAlpha = k;
    ctx.fillStyle = '#bfe3ff'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.35, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* =====================================================================
     2. DORMIU MAIS QUE TODO MUNDO — 90 s parado no menu
     ===================================================================== */
  function acorda() {
    S.dorme = false;
    if (marca('dormiu')) { sfx('reward'); premia(); }
  }
  // tres "z" pequenos, um de cada vez, a cada 2 s: sobem e somem. Desenhados
  // com traco, nao com texto.
  function pintaZ(g) {
    const s = g.showcase; if (!s) return;
    const ph = (S.dormeT % 2) / 2, i = Math.floor(S.dormeT / 2) % 3;
    const size = s.r * (0.16 + i * 0.05), a = ph < 0.15 ? ph / 0.15 : 1 - (ph - 0.15) / 0.85;
    const x = s.x + s.r * 0.8 + Math.sin(ph * 3) * s.r * 0.12, y = s.y - s.r * 0.7 - ph * s.r * 0.9;
    const ctx = g.ctx;
    ctx.save();
    ctx.globalAlpha = Math.max(0, a) * 0.85; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1.5, s.r * 0.05); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - size, y - size); ctx.lineTo(x + size, y - size); ctx.lineTo(x - size, y + size); ctx.lineTo(x + size, y + size); ctx.stroke();
    ctx.restore();
  }

  /* =====================================================================
     3. SETE VOLTAS — o ultimo O do letreiro
     ===================================================================== */
  // o ultimo O ganha o proprio <span>, para poder ser tocado e girar
  if (HR.Brand) {
    const logo0 = HR.Brand.logo;
    HR.Brand.logo = function () {
      const h = logo0.apply(this, arguments);
      return h.indexOf('lg-ult') >= 0 ? h : h.replace(/O(<\/span>)$/, '<span class="lg-ult">O</span>$1');
    };
  }
  function marcaO() {
    $$('#screen-menu .lg-word').forEach(el => {
      if ($('.lg-ult', el)) return;
      const txt = (el.textContent || 'ORBO').trim(); if (txt.length < 2) return;
      el.innerHTML = esc(txt.slice(0, -1)) + '<span class="lg-ult">' + esc(txt.slice(-1)) + '</span>';
    });
  }
  marcaO();
  after(HR.UI, 'init', marcaO);
  after(HR, 'applyI18n', marcaO);

  function girar(o) {
    o.classList.remove('egg-gira'); void o.offsetWidth; o.classList.add('egg-gira');
    setTimeout(() => o.classList.remove('egg-gira'), 3100);
    // a bola da vitrine: cores invertidas e a helice girando rapido por 3 s
    const g = HR.game; if (!g) return;
    const sk = g.showcaseSkin || g.skin;
    const inv = Object.assign({}, sk, { base: sk.dark, dark: sk.base, base2: sk.dark2, dark2: sk.base2 });
    S.gira = { de: performance.now(), sk: inv, prev: g.showcaseSkin };
    g.showcaseSkin = inv;
    setTimeout(() => { if (g.showcaseSkin === inv) g.showcaseSkin = S.gira ? S.gira.prev : null; S.gira = null; }, 3000);
  }
  const drawBall0 = HR.Render.drawBall;
  HR.Render.drawBall = function (ctx, x, y, r, skin, t, o) {
    if (S.gira && skin === S.gira.sk) {
      const k = ease((performance.now() - S.gira.de) / 3000);
      o = Object.assign({}, o, { spin: ((o && o.spin) || 0) + k * TAU * 10 });
    }
    return drawBall0.call(this, ctx, x, y, r, skin, t, o);
  };
  document.addEventListener('click', e => {
    const o = e.target && e.target.closest ? e.target.closest('#screen-menu .lg-ult') : null;
    if (!o || !noMenu()) return;
    const now = performance.now();
    if (now - S.oT > 700) S.oN = 0;
    S.oN++; S.oT = now;
    tom({ f: 660 * Math.pow(2, [0, 2, 4, 5, 7, 9, 11][Math.min(6, S.oN - 1)] / 12), type: 'triangle', d: 0.12, g: 0.08 });
    if (S.oN < 7) return;
    S.oN = 0;
    girar(o);
    [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => tom({ f: 660 * Math.pow(2, s / 12), type: 'triangle', d: 0.2, g: 0.1, t: 0.15 + i * 0.06 }));
    if (marca('sete_o')) premia();
  });

  /* =====================================================================
     4. TRES E TRINTA E TRES — o Eco no menu as 03:33
     ===================================================================== */
  function hora() {
    if (typeof HR.EASTER_CLOCK === 'string' && /^\d\d:\d\d$/.test(HR.EASTER_CLOCK)) return HR.EASTER_CLOCK;
    const d = new Date(agora()), p = n => (n < 10 ? '0' : '') + n;
    return p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function h333() {
    if (S.busy.h333 || flag('h333') || hora() !== '03:33') return;
    S.busy.h333 = true;
    cena('eco333', () => { S.busy.h333 = false; if (marca('h333')) premia(); });
  }

  /* =====================================================================
     6. NOME DE FAMILIA — o nome do perfil e o de alguem da historia
     ===================================================================== */
  const FAMILIA = ['faisca', 'vela', 'ancora', 'casco', 'iris', 'poeira', 'cardume'];
  function quemDoNome() {
    const d = HR.Store.data, raw = d.name || (d.online && d.online.name) || '';
    let n = String(raw).trim().toLowerCase();
    try { n = n.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (_) { /* sem normalize */ }
    return FAMILIA.indexOf(n) >= 0 ? n : null;
  }
  function familia() {
    const q = quemDoNome();
    if (!q || S.busy.nome || flag('nome_' + q)) return;
    S.busy.nome = true;
    cena('nome_' + q, () => { S.busy.nome = false; HR.Story.flag('egg_nome_' + q, true); if (marca('familia')) premia(); });
  }

  /* =====================================================================
     8. UM ANO — 365 dias depois do primeiro dia
     ===================================================================== */
  function umAno() {
    const c = +HR.Store.data.created; if (!c || S.busy.ano || flag('um_ano')) return;
    if (agora() - c < 365 * 864e5) return;
    S.busy.ano = true;
    cena('um_ano', () => { S.busy.ano = false; if (marca('um_ano')) premia(); });
  }

  // ao abrir o menu (ou voltar a ele): as cenas entram na fila, uma de cada vez
  function aoMenu() {
    if (HR.UI.current !== 'menu' || HR.UI.stack.length) return;
    h333(); familia(); umAno();
  }
  after(HR.UI, 'setBase', function (name) {
    limpaFala(); limpaCompanhia();
    S.dorme = false; S.cod.i = 0;
    if (name === 'menu') setTimeout(aoMenu, 900);
  });
  after(HR.UI, 'back', function () { if (HR.UI.current === 'menu' && !HR.UI.stack.length) setTimeout(aoMenu, 500); });

  /* =====================================================================
     5. TRINTA E TRES · 9. SILENCIO — no fim de uma partida
     ===================================================================== */
  function fimDePartida(s) {
    if (!s || HR.UI.abandon) return;
    if (s.ringsPassed === 33) { marca('arcos_33'); S.falaPoeira = true; }
    const st = HR.Store.data.settings;
    if (st.sound === false && st.music === false && s.ringsPassed >= 20) marca('silencio');
  }
  function limpaFala() { $$('.egg-fala').forEach(el => el.remove()); }
  function falaPoeiraNoFim() {
    if (!S.falaPoeira) return;
    S.falaPoeira = false;
    limpaFala();
    const scr = $('#screen-over.visible') || $('#screen-levelend.visible'); if (!scr) return;
    const body = $('.over-body', scr), stats = $('.over-stats', scr); if (!body) return;
    const el = HR.U.el('div', 'egg-fala', '<span class="ic">' + HR.icon('seed') + '</span><span>' + esc(HR.t('egg_33_fala')) + '</span>');
    if (stats && stats.nextSibling) body.insertBefore(el, stats.nextSibling); else body.appendChild(el);
  }
  before(HR.UI, 'onLevelEnd', fimDePartida);
  before(HR.UI, 'onGameOver', fimDePartida);
  after(HR.UI, 'onLevelEnd', falaPoeiraNoFim);
  after(HR.UI, 'onGameOver', falaPoeiraNoFim);

  /* =====================================================================
     7. COMPANHIA — 60 s na pausa sem tocar
     ===================================================================== */
  function limpaCompanhia() { S.comp = false; $$('.egg-comp').forEach(el => el.remove()); }
  function companhia() {
    S.comp = true;
    const card = $('#screen-pause .card'); if (!card) return;
    card.appendChild(HR.U.el('div', 'egg-comp', '<span class="ic">' + HR.icon('seed') + '</span><span>' + esc(HR.t('egg_comp')) + '</span>'));
    if (marca('companhia')) premia();
  }
  after(HR.UI, 'pause', limpaCompanhia);
  after(HR.UI, 'resume', limpaCompanhia);
  after(HR.UI, 'quitToMenu', limpaCompanhia);
  const pausaVisivel = () => { const p = $('#screen-pause'); return !!p && p.classList.contains('visible'); };

  /* =====================================================================
     10. O CODIGO — cima cima baixo baixo esquerda direita esquerda direita
     ===================================================================== */
  const SEQ = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right'];
  function direcao(d) {
    const C = S.cod; if (!noMenu()) { C.i = 0; return; }
    const now = performance.now();
    if (C.i > 0 && now - C.t0 > 8000) C.i = 0;
    if (C.i === 0) C.t0 = now;
    if (d === SEQ[C.i]) { C.i++; if (C.i === SEQ.length) { C.i = 0; festa(); } }
    else { C.i = d === SEQ[0] ? 1 : 0; C.t0 = now; }
  }
  function festa() {
    const list = [], cols = ['#ff5e7e', '#ffcf4a', '#35e29a', '#4cf0ff', '#8f6bff', '#ffffff'];
    for (let i = 0; i < 90; i++) list.push({ x: Math.random(), y: -0.05 - Math.random() * 1.1, v: 0.22 + Math.random() * 0.3, p: Math.random() * TAU, w: 5 + Math.random() * 5, h: 3 + Math.random() * 3, c: cols[i % cols.length], s: (Math.random() < 0.5 ? -1 : 1) * (2 + Math.random() * 4) });
    S.conf = { de: performance.now(), list };
    sfx('great'); setTimeout(() => sfx('reward'), 350);
    if (marca('codigo')) premia();
  }
  window.addEventListener('keydown', e => {
    const m = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[e.code];
    if (m && !e.repeat) direcao(m);
  });
  const deslize = (dx, dy) => { if (Math.max(Math.abs(dx), Math.abs(dy)) < 40) return; direcao(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')); };
  window.addEventListener('touchstart', e => { const t = e.touches && e.touches[0]; S.toque = t ? { x: t.clientX, y: t.clientY } : null; }, { passive: true, capture: true });
  window.addEventListener('touchend', e => { const t = e.changedTouches && e.changedTouches[0]; if (t && S.toque) deslize(t.clientX - S.toque.x, t.clientY - S.toque.y); S.toque = null; }, { passive: true, capture: true });
  window.addEventListener('pointerdown', e => { S.ponteiro = e.pointerType === 'mouse' ? { x: e.clientX, y: e.clientY } : null; }, true);
  window.addEventListener('pointerup', e => { if (S.ponteiro && e.pointerType === 'mouse') deslize(e.clientX - S.ponteiro.x, e.clientY - S.ponteiro.y); S.ponteiro = null; }, true);
  function pintaConfete(g) {
    const C = S.conf, t = (performance.now() - C.de) / 1000;
    if (t >= 6) { S.conf = null; return; }
    const ctx = g.ctx, W = g.W, H = g.H, a = t > 5 ? 1 - (t - 5) : 1;
    ctx.save(); ctx.globalAlpha = a;
    C.list.forEach(o => {
      const y = (o.y + o.v * t) * H; if (y < -20 || y > H + 20) return;
      const x = o.x * W + Math.sin(t * 2 + o.p) * 18;
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * o.s + o.p); ctx.fillStyle = o.c; ctx.fillRect(-o.w / 2, -o.h / 2, o.w, o.h); ctx.restore();
    });
    ctx.restore();
  }

  /* ---------------- o relogio de tudo: o quadro do jogo ---------------- */
  after(HR.Game.prototype, 'update', function (dt) {
    const g = this, now = performance.now(), k = vel();
    const ocioso = (now - S.lastInput) / 1000 * k;
    // 1. a contemplacao
    if (S.cont.on) contemplaTick(g, dt);
    else if (g.state === 'playing' && HR.UI.current === 'hud' && g.run.level && g.run.level.id === QUIETA && !flag('contempla')) {
      S.cont.quieto = parada(g) ? S.cont.quieto + dt * k : 0;
      if (S.cont.quieto >= 15) contemplar();
    } else S.cont.quieto = 0;
    // 2. a bola dorme
    if (g.state === 'idle' && noMenu()) {
      if (!S.dorme && ocioso >= 90 && !flag('dormiu')) { S.dorme = true; S.dormeT = 0; }
      if (S.dorme) S.dormeT += dt;
    } else S.dorme = false;
    // 7. companhia na pausa
    if (g.state === 'paused' && pausaVisivel() && !S.comp && !flag('companhia') && ocioso >= 60) companhia();
  });
  after(HR.Game.prototype, 'render', function () {
    const g = this;
    if (g.state === 'idle') { if (S.dorme) pintaZ(g); if (S.conf) pintaConfete(g); return; }
    if (S.cont.on) pintaContempla(g);
  });
})();

/* ---------------- textos ---------------- */
Object.assign(HR.I18N.pt, {
  a_contempla: 'A Contemplação', a_d_egg_contempla: 'Fique parada quinze segundos na fase 6-4-5.',
  a_dormiu: 'Dormiu mais que todo mundo', a_d_egg_dormiu: 'Deixe a bola dormir no menu.',
  a_sete_o: 'Sete voltas', a_d_egg_sete_o: 'Toque sete vezes no último O.',
  a_h333: 'Três e trinta e três', a_d_egg_h333: 'Abra o jogo às 03:33.',
  a_arcos_33: 'Trinta e três', a_d_egg_arcos_33: 'Termine uma partida com exatamente 33 arcos.',
  a_familia: 'Nome de família', a_d_egg_familia: 'Use o nome de alguém da história.',
  a_companhia: 'Companhia', a_d_egg_companhia: 'Fique um minuto na pausa sem tocar em nada.',
  a_um_ano: 'Um ano', a_d_egg_um_ano: 'Volte um ano depois do primeiro dia.',
  a_silencio: 'Silêncio', a_d_egg_silencio: 'Termine uma partida de 20 arcos sem som nem música.',
  a_codigo: 'O código', a_d_egg_codigo: 'Cima, cima, baixo, baixo, esquerda, direita, esquerda, direita.',

  skin_pontoazul: 'Ponto Azul', flavor_skin_pontoazul: 'Um ponto pálido, um fio de nuvem, e todo mundo que já olhou para cima.',
  egg_33_fala: 'Trinta e três. Eu contei.', egg_comp: 'Ainda aqui.',
  st_cast_pequenos: 'Os pequenos',

  st_contempla_who: 'pequenos', st_contempla_k: 'A contemplação',
  st_contempla_1: '~A bola para. Lá embaixo, num ponto azul pequeno, alguém olha para cima.',
  st_contempla_2: 'A gente é pequeno. Não dá para ajudar em nada. Então a gente olha.',
  st_contempla_3: 'Isto tudo que gira em cima da gente, a gente chama de o começo.',
  st_contempla_4: 'A gente não sabe voar. Mas a gente guarda o que viu. Vai.',

  st_eco333_who: 'eco', st_eco333_k: '03:33',
  st_eco333_1: 'Três e trinta e três. Você também não dorme. Eu sou a parte que fica acordada.',

  st_um_ano_who: 'vela', st_um_ano_k: 'Um ano',
  st_um_ano_1: 'Faz um ano que você voa por aqui. Eu contei pelos anéis.',
  st_um_ano_2: 'Não precisa ter pressa. A gente segura. Volte quando quiser.',

  st_nome_faisca_who: 'faisca', st_nome_faisca_k: 'Nome de família', st_nome_faisca_1: 'Faísca? Eu também! Duas com o mesmo nome. Vamos ver quem voa melhor.',
  st_nome_vela_who: 'vela', st_nome_vela_k: 'Nome de família', st_nome_vela_1: 'Vela. Esse nome é meu também. Cuide dele por mim: eu estou ocupado segurando.',
  st_nome_ancora_who: 'ancora', st_nome_ancora_k: 'Nome de família', st_nome_ancora_1: 'Âncora. Pouca gente escolhe esse nome. Ele pesa. Você segura.',
  st_nome_casco_who: 'casco', st_nome_casco_k: 'Nome de família', st_nome_casco_1: 'Casco, é? Menina, esse nome já tem dono. Mas dá para dividir.',
  st_nome_iris_who: 'iris', st_nome_iris_k: 'Nome de família', st_nome_iris_1: 'Íris. Bom nome. É o meu. Vai ter que ser rápida para merecer.',
  st_nome_poeira_who: 'poeira', st_nome_poeira_k: 'Nome de família', st_nome_poeira_1: 'Poeira. Igual a mim. Não brilho, não atrapalho. Você também?',
  st_nome_cardume_who: 'cardume', st_nome_cardume_k: 'Nome de família', st_nome_cardume_1: 'Cardume! A gente gostou. Quer dizer, a gente… é, gostou. Agora somos muitos com esse nome.'
});
Object.assign(HR.I18N.en, {
  a_contempla: 'The Contemplation', a_d_egg_contempla: 'Stand still for fifteen seconds on level 6-4-5.',
  a_dormiu: 'Slept longer than everyone', a_d_egg_dormiu: 'Let the ball fall asleep in the menu.',
  a_sete_o: 'Seven turns', a_d_egg_sete_o: 'Tap the last O seven times.',
  a_h333: 'Three thirty-three', a_d_egg_h333: 'Open the game at 03:33.',
  a_arcos_33: 'Thirty-three', a_d_egg_arcos_33: 'Finish a run with exactly 33 rings.',
  a_familia: 'Family name', a_d_egg_familia: 'Use the name of someone from the story.',
  a_companhia: 'Company', a_d_egg_companhia: 'Stay a minute on the pause screen without touching anything.',
  a_um_ano: 'One year', a_d_egg_um_ano: 'Come back a year after the first day.',
  a_silencio: 'Silence', a_d_egg_silencio: 'Finish a run of 20 rings with sound and music off.',
  a_codigo: 'The code', a_d_egg_codigo: 'Up, up, down, down, left, right, left, right.',

  skin_pontoazul: 'Pale Blue Dot', flavor_skin_pontoazul: 'A pale dot, a thread of cloud, and everyone who ever looked up.',
  egg_33_fala: 'Thirty-three. I counted.', egg_comp: 'Still here.',
  st_cast_pequenos: 'The small ones',

  st_contempla_who: 'pequenos', st_contempla_k: 'The contemplation',
  st_contempla_1: '~The ball stops. Far below, on a small blue dot, someone looks up.',
  st_contempla_2: 'We are small. We cannot help with anything. So we look.',
  st_contempla_3: 'All of this turning above us, we call it the beginning.',
  st_contempla_4: 'We do not know how to fly. But we keep what we saw. Go.',

  st_eco333_who: 'eco', st_eco333_k: '03:33',
  st_eco333_1: 'Three thirty-three. You do not sleep either. I am the part that stays awake.',

  st_um_ano_who: 'vela', st_um_ano_k: 'One year',
  st_um_ano_1: 'A year now that you fly through here. I counted by the rings.',
  st_um_ano_2: 'No need to hurry. We hold. Come back whenever you want.',

  st_nome_faisca_who: 'faisca', st_nome_faisca_k: 'Family name', st_nome_faisca_1: 'Spark? Me too! Two of us with the same name. Let us see who flies better.',
  st_nome_vela_who: 'vela', st_nome_vela_k: 'Family name', st_nome_vela_1: 'Sail. That name is mine too. Look after it for me: I am busy holding.',
  st_nome_ancora_who: 'ancora', st_nome_ancora_k: 'Family name', st_nome_ancora_1: 'Anchor. Few people choose that name. It is heavy. You hold it.',
  st_nome_casco_who: 'casco', st_nome_casco_k: 'Family name', st_nome_casco_1: 'Hull, is it? Girl, that name is taken. But it can be shared.',
  st_nome_iris_who: 'iris', st_nome_iris_k: 'Family name', st_nome_iris_1: 'Iris. Good name. It is mine. You will have to be fast to deserve it.',
  st_nome_poeira_who: 'poeira', st_nome_poeira_k: 'Family name', st_nome_poeira_1: 'Dust. Same as me. No shine, no bother. You too?',
  st_nome_cardume_who: 'cardume', st_nome_cardume_k: 'Family name', st_nome_cardume_1: 'The Shoal! We like it. I mean, we… yes, we like it. Now there are many of us with that name.'
});
Object.assign(HR.I18N.es, {
  a_contempla: 'La Contemplación', a_d_egg_contempla: 'Quédate quieta quince segundos en el nivel 6-4-5.',
  a_dormiu: 'Durmió más que todos', a_d_egg_dormiu: 'Deja que la bola se duerma en el menú.',
  a_sete_o: 'Siete vueltas', a_d_egg_sete_o: 'Toca siete veces la última O.',
  a_h333: 'Tres y treinta y tres', a_d_egg_h333: 'Abre el juego a las 03:33.',
  a_arcos_33: 'Treinta y tres', a_d_egg_arcos_33: 'Termina una partida con exactamente 33 aros.',
  a_familia: 'Nombre de familia', a_d_egg_familia: 'Usa el nombre de alguien de la historia.',
  a_companhia: 'Compañía', a_d_egg_companhia: 'Quédate un minuto en pausa sin tocar nada.',
  a_um_ano: 'Un año', a_d_egg_um_ano: 'Vuelve un año después del primer día.',
  a_silencio: 'Silencio', a_d_egg_silencio: 'Termina una partida de 20 aros sin sonido ni música.',
  a_codigo: 'El código', a_d_egg_codigo: 'Arriba, arriba, abajo, abajo, izquierda, derecha, izquierda, derecha.',

  skin_pontoazul: 'Punto Azul', flavor_skin_pontoazul: 'Un punto pálido, un hilo de nube, y todos los que alguna vez miraron hacia arriba.',
  egg_33_fala: 'Treinta y tres. Yo conté.', egg_comp: 'Sigo aquí.',
  st_cast_pequenos: 'Los pequeños',

  st_contempla_who: 'pequenos', st_contempla_k: 'La contemplación',
  st_contempla_1: '~La bola se detiene. Allá abajo, en un punto azul pequeño, alguien mira hacia arriba.',
  st_contempla_2: 'Somos pequeños. No podemos ayudar en nada. Entonces miramos.',
  st_contempla_3: 'A todo esto que gira encima de nosotros lo llamamos el comienzo.',
  st_contempla_4: 'No sabemos volar. Pero guardamos lo que vimos. Ve.',

  st_eco333_who: 'eco', st_eco333_k: '03:33',
  st_eco333_1: 'Tres y treinta y tres. Tú tampoco duermes. Yo soy la parte que se queda despierta.',

  st_um_ano_who: 'vela', st_um_ano_k: 'Un año',
  st_um_ano_1: 'Hace un año que vuelas por aquí. Lo conté por los aros.',
  st_um_ano_2: 'No hace falta prisa. Nosotros sostenemos. Vuelve cuando quieras.',

  st_nome_faisca_who: 'faisca', st_nome_faisca_k: 'Nombre de familia', st_nome_faisca_1: '¿Chispa? ¡Yo también! Dos con el mismo nombre. Veamos quién vuela mejor.',
  st_nome_vela_who: 'vela', st_nome_vela_k: 'Nombre de familia', st_nome_vela_1: 'Vela. Ese nombre también es mío. Cuídalo por mí: estoy ocupado sosteniendo.',
  st_nome_ancora_who: 'ancora', st_nome_ancora_k: 'Nombre de familia', st_nome_ancora_1: 'Ancla. Poca gente elige ese nombre. Pesa. Tú lo sostienes.',
  st_nome_casco_who: 'casco', st_nome_casco_k: 'Nombre de familia', st_nome_casco_1: '¿Casco? Niña, ese nombre ya tiene dueño. Pero se puede compartir.',
  st_nome_iris_who: 'iris', st_nome_iris_k: 'Nombre de familia', st_nome_iris_1: 'Iris. Buen nombre. Es el mío. Tendrás que ser rápida para merecerlo.',
  st_nome_poeira_who: 'poeira', st_nome_poeira_k: 'Nombre de familia', st_nome_poeira_1: 'Polvo. Igual que yo. No brillo, no estorbo. ¿Tú también?',
  st_nome_cardume_who: 'cardume', st_nome_cardume_k: 'Nombre de familia', st_nome_cardume_1: '¡Cardumen! Nos gustó. Digo, nos… sí, nos gustó. Ahora somos muchos con ese nombre.'
});
