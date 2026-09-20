/* =====================================================================
   ORBO v6.5 — Etapa 1: o que estava sem efeito.

   1. Quatro jatos (Violeta, Menta, Poente e Espectro) entraram na v6.0 sem
      o campo "style", entao caiam todos no desenho generico e ficavam iguais
      entre si. Ganham aqui um desenho proprio cada um.
   2. O rastro voltava ao desenho simples no nivel Baixo. Custa menos de
      0,05 ms por quadro (e um rastro so, de uma bola so): nao ha motivo para
      cortar. A trava sai em js/render-trails.js.
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const TAU = Math.PI * 2;
  const U = () => HR.U;

  /* ---------------- os quatro desenhos novos ---------------- */
  const S = {};

  // Violeta: duas fitas que se cruzam, como uma trenca de luz
  S.ribbon = (ctx, x, y, br, sk, t, k, u) => {
    ctx.globalCompositeOperation = 'lighter';
    for (let b = 0; b < 2; b++) {
      const dir = b ? 1 : -1, L = br * 4.4 * k;
      ctx.strokeStyle = u.rgba(b ? sk.color2 : sk.color, 0.75);
      ctx.lineWidth = br * 0.34 * k; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = 0; i <= 14; i++) {
        const f = i / 14, px = x - br * 0.3 - f * L;
        const py = y + Math.sin(f * 5.2 + t * 14 * dir) * br * 0.8 * k * f;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
    }
    const g = ctx.createLinearGradient(x, y, x - br * 2.2 * k, y);
    g.addColorStop(0, u.rgba('#ffffff', 0.95)); g.addColorStop(1, u.rgba(sk.color, 0));
    ctx.fillStyle = g; ctx.beginPath();
    ctx.moveTo(x + br * 0.2, y - br * 0.4 * k);
    ctx.quadraticCurveTo(x - br * 1.2 * k, y, x - br * 2.2 * k, y);
    ctx.quadraticCurveTo(x - br * 1.2 * k, y, x + br * 0.2, y + br * 0.4 * k);
    ctx.fill();
  };

  // Menta: folhinhas que se soltam e giram
  S.leaf = (ctx, x, y, br, sk, t, k, u) => {
    const g = ctx.createLinearGradient(x, y, x - br * 2.6 * k, y);
    g.addColorStop(0, u.rgba(sk.color2, 0.85)); g.addColorStop(1, u.rgba(sk.color, 0));
    ctx.fillStyle = g; ctx.beginPath();
    ctx.moveTo(x + br * 0.2, y - br * 0.55 * k);
    ctx.quadraticCurveTo(x - br * 1.4 * k, y - br * 0.2 * k, x - br * 2.6 * k, y);
    ctx.quadraticCurveTo(x - br * 1.4 * k, y + br * 0.2 * k, x + br * 0.2, y + br * 0.55 * k);
    ctx.fill();
    for (let i = 0; i < 9; i++) {
      const f = (t * 1.7 + i / 9) % 1;
      const px = x - br * (0.9 + f * 4.4) * k, py = y + Math.sin(i * 2.1 + t * 2.4) * br * 0.7 * k * f;
      const s = br * 0.3 * k * (1 - f * 0.45);
      ctx.save(); ctx.translate(px, py); ctx.rotate(t * 3 + i);
      ctx.fillStyle = u.rgba(i % 2 ? sk.color : sk.color2, 0.85 * (1 - f));
      ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.45, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
  };

  // Poente: leque de raios quentes saindo de um sol pequeno
  S.sunray = (ctx, x, y, br, sk, t, k, u) => {
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + (i - 4) * 0.16 + Math.sin(t * 6 + i) * 0.02;
      const L = br * (3.2 + (i % 2 ? 1.1 : 0.4) + Math.sin(t * 18 + i) * 0.3) * k;
      const gg = ctx.createLinearGradient(x, y, x + Math.cos(a) * L, y + Math.sin(a) * L);
      gg.addColorStop(0, u.rgba(i % 2 ? sk.color2 : sk.color, 0.8));
      gg.addColorStop(1, u.rgba(sk.color, 0));
      ctx.strokeStyle = gg; ctx.lineWidth = br * (i % 2 ? 0.16 : 0.26) * k; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - br * 0.4, y); ctx.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); ctx.stroke();
    }
    const sun = ctx.createRadialGradient(x - br * 0.5, y, 0, x - br * 0.5, y, br * 1.25 * k);
    sun.addColorStop(0, u.rgba('#fff6e0', 0.95)); sun.addColorStop(0.45, u.rgba(sk.color2, 0.55)); sun.addColorStop(1, u.rgba(sk.color, 0));
    ctx.fillStyle = sun; ctx.beginPath(); ctx.arc(x - br * 0.5, y, br * 1.25 * k, 0, TAU); ctx.fill();
  };

  // Espectro: sopros translucidos que se abrem e somem (sem "lighter": e frio, nao quente)
  S.wisp = (ctx, x, y, br, sk, t, k, u) => {
    for (let i = 0; i < 7; i++) {
      const f = (t * 1.25 + i / 7) % 1;
      const px = x - br * (0.6 + f * 5) * k;
      const py = y + Math.sin(i * 1.9 + t * 1.6) * br * 0.5 * k * f;
      const r = br * (0.45 + f * 1.5) * k;
      const gg = ctx.createRadialGradient(px, py, 0, px, py, r);
      gg.addColorStop(0, u.rgba(sk.color2, 0.30 * (1 - f)));
      gg.addColorStop(0.6, u.rgba(sk.color, 0.16 * (1 - f)));
      gg.addColorStop(1, u.rgba(sk.color, 0));
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill();
    }
    ctx.strokeStyle = u.rgba('#ffffff', 0.5); ctx.lineWidth = 1.2; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      for (let j = 0; j <= 10; j++) {
        const f = j / 10, px = x - br * 0.3 - f * br * 3.6 * k;
        const py = y + Math.sin(f * 4 + t * 3 + i * 2.1) * br * 0.5 * k * f;
        j ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.globalAlpha = 0.45 - i * 0.12; ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  /* ---------------- liga cada jato ao seu desenho ---------------- */
  const FALTANDO = { violet: 'ribbon', mintjet: 'leaf', sunset: 'sunray', ghostjet: 'wisp' };
  (HR.GEAR.jetSkins || []).forEach(j => { if (!j.style && FALTANDO[j.id]) j.style = FALTANDO[j.id]; });

  const base = HR.Render.drawJet;
  HR.Render.drawJet = function (ctx, x, y, br, sk, t, k) {
    const f = sk && S[sk.style];
    if (!f) return base.apply(this, arguments);
    ctx.save();
    try { f(ctx, x, y, br, sk, t, k || 1, U()); } catch (_) { /* nunca derruba o quadro */ }
    ctx.restore();
  };
})();
