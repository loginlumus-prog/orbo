/* =====================================================================
   ORBO v5.9 — O NINHO (fase 3-7-7). Ver docs/HISTORIA.md §22.
   A fase mais fácil do jogo: anéis enormes, devagar, sem eventos e com nove
   escudos. Perder ali é quase impossível — a não ser de propósito.
   Quem deixa de voar para ficar com o grão que não brilha leva a bola Poeira
   e a conquista "Quem fica". Terminar a fase normalmente não perde nada.
   ===================================================================== */
(function () {
  const NEST = '3-7-7';

  /* ---------------- a bola Poeira (só se ganha ficando) ---------------- */
  if (HR.CONFIG && HR.CONFIG.SKINS && !HR.CONFIG.SKINS.some(s => s.id === 'poeira')) {
    HR.CONFIG.SKINS.push({
      id: 'poeira', col: 'classic', rar: 'legendary', lvl: 1, cur: 'reward', price: 0, gems: 0,
      base: '#55515f', dark: '#1a1720', glow: '#cfc2ff', pattern: 'element', el: 'rock', nest: true
    });
  }

  /* ---------------- a conquista ---------------- */
  if (HR.ACHIEVEMENTS && !HR.ACHIEVEMENTS.some(a => a.id === 'nest_stay')) {
    HR.ACHIEVEMENTS.push({ id: 'nest_stay', cat: 'secret', stat: 'nest', target: 1, gems: 80, icon: 'seed' });
  }
  const origStats5 = HR.Achievements.stats5;
  HR.Achievements.stats5 = function () {
    const out = origStats5.apply(this, arguments);
    const f = (HR.Store.data.story && HR.Store.data.story.flags) || {};
    out.nest = f.ninho ? 1 : 0;
    out.letters = ((HR.Store.data.story || {}).letters || []).length;
    return out;
  };

  /* ---------------- a fase: larga, lenta e sem perigo ---------------- */
  function shape() {
    const lv = HR.Campaign && HR.Campaign.level ? HR.Campaign.level(NEST) : null;
    if (!lv || lv.nest) return lv;
    lv.nest = true;
    lv.rings = 16;
    lv.v0 = 560; lv.speed = Math.round(lv.v0 / 265 * 100) / 100; lv.ramp = 0.05; lv.tb0 = 1.05;
    lv.events = []; lv.mods = []; lv.dirs = ['right']; lv.dirEvery = 99; lv.waves = 0; lv.boss = null;
    lv.params = Object.assign({}, lv.params, {
      radius: (lv.params.radius || 100) * 1.9, tbMul: (lv.params.tbMul || 1) * 1.6,
      osc: 0, oscF: 0, rot: 0, rotF: 0, dbl: 0, burst: 0, shrink: 0, tiltVar: 0, fog: 0, dark: 0
    });
    return lv;
  }
  shape();

  /* ---------------- nove escudos ---------------- */
  function armor(run) { if (run && run.level && run.level.id === NEST) { run.shields = 9; run.lives = Math.max(run.lives, 3); } }

  /* ---------------- ficar ou passar ---------------- */
  function unlock() {
    const d = HR.Store.data;
    HR.Story.flag('ninho', true);
    if (d.owned && d.owned.skins && d.owned.skins.indexOf('poeira') < 0) d.owned.skins.push('poeira');
    HR.Store.save();
    setTimeout(() => { if (HR.UI.trophyCheck) HR.UI.trophyCheck(); }, 400);
  }

  const after = (obj, name, fn) => {
    const orig = obj[name]; if (typeof orig !== 'function') return;
    obj[name] = function () { const r = orig.apply(this, arguments); try { fn.apply(this, arguments); } catch (_) { /* nada */ } return r; };
  };
  after(HR.UI, 'onLevelEnd', function (s) {
    if (!s || s.levelId !== NEST) return;
    const st = HR.Story.data();
    if (!s.success) {
      if (st.flags.ninho) return;
      unlock();
      setTimeout(() => HR.UI.storyScene('nest_stay'), 900);
      return;
    }
    st.flags.nestTries = (st.flags.nestTries || 0) + 1;
    HR.Store.save();
    if (st.flags.nestTries === 1) setTimeout(() => HR.UI.storyScene('nest_win'), 900);
    else if (st.flags.nestTries === 3 && !st.flags.ninho) setTimeout(() => HR.UI.storyScene('nest_hint'), 900);
  });

  // molda a fase antes de entrar e arma os escudos depois que a partida é montada
  const origStart = HR.UI.startLevel;
  HR.UI.startLevel = function (id) {
    if (id === NEST) shape();
    const r = origStart.apply(this, arguments);
    if (id === NEST) { try { armor(HR.game && HR.game.run); } catch (_) { /* nada */ } }
    return r;
  };
})();
