/* =====================================================================
   ORBO: modo visita. Abrindo o jogo com ?tudo=1 (ou ?visita=1), todas as galáxias,
   sistemas, fases e a Singularidade ficam abertos só para olhar e testar.
   Não altera nada do que está salvo: é só um "passe" enquanto a página está aberta.
   Quem entra pelo link normal continua com o progresso travado de sempre.
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  let on = false;
  try {
    const q = location.search || '';
    on = /[?&](tudo|visita|unlock)=1/.test(q) || /[?&]tudo(&|$)/.test(q);
  } catch (_) { on = false; }
  if (!on || !HR.Campaign) return;

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
  HR.VISIT_MODE = true;

  // aviso discreto, para não confundir o modo visita com o progresso de verdade
  const tag = () => {
    if (document.getElementById('visit-tag')) return;
    const el = document.createElement('div');
    el.id = 'visit-tag';
    el.textContent = 'MODO VISITA · TUDO ABERTO';
    el.style.cssText = 'position:absolute;left:50%;transform:translateX(-50%);top:calc(2px + var(--sat,0px));z-index:70;padding:3px 10px;border-radius:999px;' +
      'font:700 9px/1.4 system-ui,sans-serif;letter-spacing:1.4px;color:#08131c;background:#ffcf4a;box-shadow:0 2px 10px rgba(0,0,0,0.45);pointer-events:none;opacity:0.9';
    (document.getElementById('app') || document.body).appendChild(el);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tag);
  else tag();
})();
