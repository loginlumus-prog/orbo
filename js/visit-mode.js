/* =====================================================================
   ORBO: modo teste. Abrindo o jogo com ?tudo=1 (ou ?visita=1), tudo fica liberado para experimentar:
   todas as galáxias, sistemas, fases e a Singularidade; nível alto; todas as bolas, rastros, temas,
   Égides, jatos e poderes no máximo; Núcleo no máximo; consumíveis cheios e dinheiro que não acaba.
   NADA é gravado: o jogo salvo de verdade continua intacto e volta ao normal no link comum.
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  let on = false;
  try {
    const q = location.search || '';
    on = /[?&](tudo|visita|teste|unlock)=1/.test(q) || /[?&]tudo(&|$)/.test(q);
  } catch (_) { on = false; }
  if (!on || !HR.Campaign || !HR.Store) return;

  const COINS = 9000000, GEMS = 99999, LEVEL = 60;

  /* ---------- navegação: tudo aberto ---------- */
  const C = HR.Campaign;
  const real = { isRegionUnlocked: C.isRegionUnlocked, systemUnlocked: C.systemUnlocked, isUnlocked: C.isUnlocked };
  const open = { isRegionUnlocked: () => true, systemUnlocked: () => true, isUnlocked: id => !!C.level(id) };
  const put = set => { C.isRegionUnlocked = set.isRegionUnlocked; C.systemUnlocked = set.systemUnlocked; C.isUnlocked = set.isUnlocked; };
  put(open);

  // "Continuar" e a fase atual seguem apontando para onde você realmente parou
  const origCurrentLevel = C.currentLevel, origCurrentSystem = C.currentSystem, origCurrentRegion = C.currentRegion;
  const withReal = fn => { put(real); try { return fn(); } finally { put(open); } };
  C.currentLevel = function () { return withReal(() => origCurrentLevel.call(C)); };
  C.currentSystem = function (ri) { return withReal(() => origCurrentSystem.call(C, ri)); };
  C.currentRegion = function () { return withReal(() => origCurrentRegion.call(C)); };
  if (HR.Singularity) HR.Singularity.canPlay = () => true;

  /* ---------- carteira e coleção: só na memória ---------- */
  const money = d => { if (d.coins < COINS) d.coins = COINS; if (d.gems < GEMS) d.gems = GEMS; };
  const ids = list => (list || []).map(x => x.id);

  function grant() {
    const d = HR.Store.data; if (!d) return;
    money(d);
    if (d.level < LEVEL) d.level = LEVEL;
    d.tutorialDone = true;
    d.owned = d.owned || {};
    d.owned.skins = ids(HR.CONFIG.SKINS);
    d.owned.trails = ids(HR.CONFIG.TRAILS);
    d.owned.themes = ids(HR.CONFIG.THEMES);
    if (HR.GEAR) {
      d.gear = d.gear || {};
      d.gear.ownedAegis = ids(HR.GEAR.aegisSkins);
      d.gear.ownedJet = ids(HR.GEAR.jetSkins);
      d.consumables = d.consumables || {};
      Object.keys(HR.GEAR.consumables).forEach(k => { if ((d.consumables[k] || 0) < 99) d.consumables[k] = 99; });
    }
    if (HR.ABILITIES) {
      d.abilities = d.abilities || { owned: [], equipped: [null, null], levels: {} };
      d.abilities.owned = ids(HR.ABILITIES);
      d.abilities.levels = d.abilities.levels || {};
      HR.ABILITIES.forEach(a => { d.abilities.levels[a.id] = HR.ABILITY_UPGRADE.maxLevel; });
      d.abilities.equipped = d.abilities.equipped || [null, null];
      if (!d.abilities.equipped[0] && HR.ABILITIES[0]) d.abilities.equipped[0] = HR.ABILITIES[0].id;
      if (!d.abilities.equipped[1] && HR.ABILITIES[1]) d.abilities.equipped[1] = HR.ABILITIES[1].id;
    }
    if (HR.CONFIG.CORE && d.core < HR.CONFIG.CORE.maxLevel) d.core = HR.CONFIG.CORE.maxLevel;
  }

  // o jogo salvo de verdade não é tocado: gravar vira apenas repor a carteira
  const origLoad = HR.Store.load;
  HR.Store.load = function () { const r = origLoad.apply(this, arguments); grant(); return r; };
  HR.Store.save = function () { if (HR.Store.data) money(HR.Store.data); };
  if (HR.Store.data) grant();

  HR.VISIT_MODE = true;

  /* ---------- aviso na tela ---------- */
  const tag = () => {
    if (document.getElementById('visit-tag')) return;
    const el = document.createElement('div');
    el.id = 'visit-tag';
    el.textContent = 'MODO TESTE · TUDO LIBERADO · NADA É SALVO';
    el.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);top:calc(2px + var(--sat,0px));z-index:70;padding:3px 10px;border-radius:999px;' +
      'font:700 9px/1.4 system-ui,sans-serif;letter-spacing:1px;color:#08131c;background:#ffcf4a;box-shadow:0 2px 10px rgba(0,0,0,0.45);pointer-events:none;opacity:0.92;white-space:nowrap';
    (document.getElementById('app') || document.body).appendChild(el);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tag);
  else tag();
})();
