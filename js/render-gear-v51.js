/* =====================================================================
   ORBO v5.1: 14 visuais novos de Égide e estilos de chama do Jato.
   A Égide antiga (10 estilos) e a chama padrão continuam em render-gear.js.
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const TAU = Math.PI * 2;
  const U = () => HR.U;
  const hash = (i, s) => { const v = Math.sin(i * 127.1 + (s || 0) * 311.7) * 43758.5453; return v - Math.floor(v); };

  function shell(ctx, x, y, R, c1) {
    const u = U(), g = ctx.createRadialGradient(x - R * 0.3, y - R * 0.35, R * 0.1, x, y, R);
    g.addColorStop(0, u.rgba(c1, 0.04)); g.addColorStop(0.72, u.rgba(c1, 0.12)); g.addColorStop(1, u.rgba(c1, 0.32));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
  }
  function rim(ctx, x, y, R, c1, w) {
    const u = U();
    ctx.strokeStyle = u.rgba(c1, 0.85); ctx.lineWidth = w || 2.4; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.stroke();
    ctx.strokeStyle = u.rgba(c1, 0.22); ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(x, y, R + 1, 0, TAU); ctx.stroke();
  }
  function gloss(ctx, x, y, R) { ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(x, y, R * 0.82, Math.PI * 1.12, Math.PI * 1.45); ctx.stroke(); }
  function inside(ctx, x, y, R, fn) { ctx.save(); ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.clip(); fn(); ctx.restore(); }
  function heart(ctx, s) { ctx.beginPath(); ctx.moveTo(0, s * 0.35); ctx.bezierCurveTo(-s * 1.1, -s * 0.35, -s * 0.45, -s * 1.05, 0, -s * 0.45); ctx.bezierCurveTo(s * 0.45, -s * 1.05, s * 1.1, -s * 0.35, 0, s * 0.35); ctx.closePath(); }
  function leaf(ctx, s) { ctx.beginPath(); ctx.moveTo(-s, 0); ctx.quadraticCurveTo(0, -s * 0.7, s, 0); ctx.quadraticCurveTo(0, s * 0.7, -s, 0); ctx.closePath(); }
  function star4(ctx, s) { ctx.beginPath(); for (let k = 0; k < 8; k++) { const r = k % 2 ? s * 0.28 : s, a = k * Math.PI / 4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); }

  /* ---------------- Égide ---------------- */
  const A = {};

  // bolha de sabão furta-cor
  A.bubble = (ctx, x, y, R, sk, t, u) => {
    inside(ctx, x, y, R, () => {
      for (let k = 0; k < 18; k++) { const a0 = k * TAU / 18 + t * 0.4; ctx.strokeStyle = u.hsl(Math.round((k * 20 + t * 60) % 360), 90, 70, 0.26); ctx.lineWidth = R * 0.2; ctx.beginPath(); ctx.arc(x, y, R * 0.92, a0, a0 + TAU / 18 + 0.02); ctx.stroke(); }
      const g = ctx.createRadialGradient(x, y, R * 0.2, x, y, R); g.addColorStop(0, 'rgba(255,255,255,0.02)'); g.addColorStop(1, 'rgba(255,255,255,0.12)'); ctx.fillStyle = g; ctx.fillRect(x - R, y - R, R * 2, R * 2);
    });
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.ellipse(x - R * 0.42, y - R * 0.48, R * 0.16, R * 0.08, -0.7, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(x + R * 0.5, y + R * 0.45, R * 0.05, 0, TAU); ctx.fill();
  };

  // corações girando na borda
  A.hearts = (ctx, x, y, R, sk, t, u) => {
    shell(ctx, x, y, R, sk.color);
    inside(ctx, x, y, R, () => { for (let k = 0; k < 5; k++) { const f = (t * 0.25 + k / 5) % 1; ctx.save(); ctx.translate(x + Math.sin(k * 2.3) * R * 0.5, y + R * 0.6 - f * R * 1.2); ctx.fillStyle = u.rgba(sk.color2, 0.4 * Math.sin(f * Math.PI)); heart(ctx, R * 0.09); ctx.fill(); ctx.restore(); } });
    rim(ctx, x, y, R, sk.color, 2); gloss(ctx, x, y, R);
    for (let k = 0; k < 8; k++) { const a = k * TAU / 8 + t * 0.7, s = R * 0.13 * (1 + 0.18 * Math.sin(t * 6 + k)); ctx.save(); ctx.translate(x + Math.cos(a) * R, y + Math.sin(a) * R); ctx.rotate(a + Math.PI / 2); ctx.fillStyle = u.rgba(k % 2 ? sk.color : sk.color2, 0.95); heart(ctx, s); ctx.fill(); ctx.restore(); }
  };

  // coroa de folhas
  A.leaves = (ctx, x, y, R, sk, t, u) => {
    shell(ctx, x, y, R, sk.color); rim(ctx, x, y, R, sk.color, 1.6); gloss(ctx, x, y, R);
    for (let k = 0; k < 16; k++) {
      const a = k * TAU / 16 + t * 0.25, s = R * 0.15;
      ctx.save(); ctx.translate(x + Math.cos(a) * R, y + Math.sin(a) * R); ctx.rotate(a + 0.9 + Math.sin(t * 2 + k) * 0.1);
      ctx.fillStyle = u.rgba(k % 3 ? sk.color : sk.color2, 0.9); leaf(ctx, s); ctx.fill();
      ctx.strokeStyle = 'rgba(20,60,20,0.45)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(s, 0); ctx.stroke(); ctx.restore();
      if (k % 4 === 0) { ctx.fillStyle = 'rgba(255,94,126,0.9)'; ctx.beginPath(); ctx.arc(x + Math.cos(a + 0.2) * (R + 4), y + Math.sin(a + 0.2) * (R + 4), 2.2, 0, TAU); ctx.fill(); }
    }
  };

  // ondas de água
  A.ripple = (ctx, x, y, R, sk, t, u) => {
    shell(ctx, x, y, R, sk.color);
    inside(ctx, x, y, R, () => { for (let k = 0; k < 4; k++) { const f = (t * 0.6 + k / 4) % 1; ctx.strokeStyle = u.rgba(sk.color2, 0.45 * (1 - f)); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, R * f, 0, TAU); ctx.stroke(); } });
    ctx.strokeStyle = u.rgba(sk.color, 0.9); ctx.lineWidth = 2.2; ctx.beginPath();
    for (let i = 0; i <= 64; i++) { const a = i / 64 * TAU, rr = R + Math.sin(a * 8 + t * 4) * 1.8; i ? ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : ctx.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
    ctx.closePath(); ctx.stroke(); gloss(ctx, x, y, R);
  };

  // circuito com pulsos
  A.circuit = (ctx, x, y, R, sk, t, u) => {
    shell(ctx, x, y, R, sk.color);
    inside(ctx, x, y, R, () => {
      ctx.strokeStyle = u.rgba(sk.color, 0.45); ctx.lineWidth = 1.2;
      for (let k = 0; k < 6; k++) {
        const yy = y - R + (k + 0.5) * R / 3, bx = x - R + hash(k, 1) * R * 0.6, ex = x + R - hash(k, 2) * R * 0.6, kink = x - R * 0.2 + hash(k, 3) * R * 0.4, dy = (hash(k, 4) - 0.5) * R * 0.3;
        ctx.beginPath(); ctx.moveTo(bx, yy); ctx.lineTo(kink, yy); ctx.lineTo(kink + Math.abs(dy), yy + dy); ctx.lineTo(ex, yy + dy); ctx.stroke();
        ctx.fillStyle = u.rgba(sk.color2, 0.7); ctx.fillRect(bx - 1.5, yy - 1.5, 3, 3); ctx.fillRect(ex - 1.5, yy + dy - 1.5, 3, 3);
        const m = (t * 0.7 + hash(k, 5)) % 1, px = bx + (ex - bx) * m, py = m < 0.5 ? yy : yy + dy;
        ctx.fillStyle = u.rgba('#ffffff', 0.9); ctx.beginPath(); ctx.arc(px, py, 1.8, 0, TAU); ctx.fill();
      }
    });
    ctx.setLineDash([7, 4]); ctx.lineDashOffset = -t * 24; rim(ctx, x, y, R, sk.color, 2.2); ctx.setLineDash([]); gloss(ctx, x, y, R);
  };

  // vitral
  A.stained = (ctx, x, y, R, sk, t, u) => {
    const pal = ['#ffcf4a', '#ff5e7e', '#4cf0ff', '#8f6bff', '#35e29a', '#ff9f43', '#ff7ad9', '#5aa9ff'];
    inside(ctx, x, y, R, () => {
      for (let k = 0; k < 8; k++) { const a0 = k * TAU / 8 + t * 0.15; ctx.fillStyle = u.rgba(pal[k], 0.2 + 0.06 * Math.sin(t * 2 + k)); ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, R, a0, a0 + TAU / 8); ctx.closePath(); ctx.fill(); }
      ctx.strokeStyle = 'rgba(30,20,10,0.55)'; ctx.lineWidth = 2;
      for (let k = 0; k < 8; k++) { const a = k * TAU / 8 + t * 0.15; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * R, y + Math.sin(a) * R); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(x, y, R * 0.45, 0, TAU); ctx.stroke();
    });
    rim(ctx, x, y, R, sk.color, 3); gloss(ctx, x, y, R);
  };

  // sonar: varredura e ondas saindo
  A.sonar = (ctx, x, y, R, sk, t, u) => {
    shell(ctx, x, y, R, sk.color);
    inside(ctx, x, y, R, () => {
      const a = t * 2.4;
      for (let k = 0; k < 12; k++) { ctx.fillStyle = u.rgba(sk.color, 0.22 * (1 - k / 12)); ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, R, a - (k + 1) * 0.07, a - k * 0.07); ctx.closePath(); ctx.fill(); }
      ctx.strokeStyle = u.rgba(sk.color, 0.25); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, R * 0.5, 0, TAU); ctx.moveTo(x - R, y); ctx.lineTo(x + R, y); ctx.moveTo(x, y - R); ctx.lineTo(x, y + R); ctx.stroke();
      for (let k = 0; k < 3; k++) { const ba = hash(k, 9) * TAU, br = R * (0.3 + hash(k, 8) * 0.5), vis = ((a - ba) % TAU + TAU) % TAU < 1.2; if (vis) { ctx.fillStyle = u.rgba(sk.color2, 0.9); ctx.beginPath(); ctx.arc(x + Math.cos(ba) * br, y + Math.sin(ba) * br, 2, 0, TAU); ctx.fill(); } }
    });
    rim(ctx, x, y, R, sk.color, 2);
    for (let k = 0; k < 3; k++) { const f = (t * 0.8 + k / 3) % 1; ctx.strokeStyle = u.rgba(sk.color, 0.5 * (1 - f)); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, R * (1 + f * 0.6), 0, TAU); ctx.stroke(); }
  };

  // cubo de arame girando
  A.cube = (ctx, x, y, R, sk, t, u) => {
    shell(ctx, x, y, R, sk.color);
    const V = [], s = R * 0.48, ay = t * 0.9, ax = t * 0.6;
    for (let i = 0; i < 8; i++) {
      let px = i & 1 ? s : -s, py = i & 2 ? s : -s, pz = i & 4 ? s : -s;
      let q = px * Math.cos(ay) - pz * Math.sin(ay); pz = px * Math.sin(ay) + pz * Math.cos(ay); px = q;
      q = py * Math.cos(ax) - pz * Math.sin(ax); pz = py * Math.sin(ax) + pz * Math.cos(ax); py = q;
      const k = 1 + pz / (R * 4); V.push([x + px * k, y + py * k]);
    }
    const E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
    ctx.strokeStyle = u.rgba(sk.color2, 0.75); ctx.lineWidth = 1.4; ctx.beginPath(); E.forEach(e => { ctx.moveTo(V[e[0]][0], V[e[0]][1]); ctx.lineTo(V[e[1]][0], V[e[1]][1]); }); ctx.stroke();
    ctx.fillStyle = u.rgba(sk.color, 0.95); V.forEach(p => { ctx.beginPath(); ctx.arc(p[0], p[1], 2, 0, TAU); ctx.fill(); });
    rim(ctx, x, y, R, sk.color, 2); gloss(ctx, x, y, R);
  };

  // engrenagem de relógio
  A.clockwork = (ctx, x, y, R, sk, t, u) => {
    shell(ctx, x, y, R, sk.color);
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.3); ctx.fillStyle = u.rgba(sk.color, 0.85);
    for (let k = 0; k < 20; k++) { ctx.rotate(TAU / 20); ctx.fillRect(-2.5, -R - 5, 5, 6); }
    ctx.restore();
    rim(ctx, x, y, R, sk.color, 2.4);
    ctx.strokeStyle = u.rgba(sk.color2, 0.75);
    for (let k = 0; k < 60; k++) { const a = k * TAU / 60, L = k % 5 ? 3 : 7; ctx.lineWidth = k % 5 ? 1 : 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * (R - 2), y + Math.sin(a) * (R - 2)); ctx.lineTo(x + Math.cos(a) * (R - 2 - L), y + Math.sin(a) * (R - 2 - L)); ctx.stroke(); }
    const hand = (a, L, w) => { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); ctx.stroke(); };
    ctx.strokeStyle = u.rgba(sk.color2, 0.9); ctx.lineCap = 'round'; hand(t * 1.2 - Math.PI / 2, R * 0.7, 1.6); hand(t * 0.1 - Math.PI / 2, R * 0.45, 2.6);
    ctx.fillStyle = u.rgba(sk.color, 1); ctx.beginPath(); ctx.arc(x, y, 2.4, 0, TAU); ctx.fill();
  };

  // galáxia dentro da bolha
  A.galaxy = (ctx, x, y, R, sk, t, u) => {
    inside(ctx, x, y, R, () => {
      ctx.fillStyle = 'rgba(16,8,40,0.45)'; ctx.fillRect(x - R, y - R, R * 2, R * 2);
      for (let arm = 0; arm < 2; arm++) for (let i = 0; i < 40; i++) { const f = i / 40, a = f * 5 + arm * Math.PI + t * 0.7, rr = f * R * 0.95; ctx.fillStyle = u.rgba(i % 3 ? sk.color : sk.color2, 0.8 * (1 - f * 0.6)); ctx.beginPath(); ctx.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.8, 1.6 - f, 0, TAU); ctx.fill(); }
      for (let k = 0; k < 12; k++) { const px = x + (hash(k, 1) - 0.5) * R * 1.8, py = y + (hash(k, 2) - 0.5) * R * 1.8; ctx.save(); ctx.translate(px, py); ctx.fillStyle = u.rgba('#ffffff', 0.4 + 0.5 * Math.abs(Math.sin(t * 3 + k))); star4(ctx, 2.2); ctx.fill(); ctx.restore(); }
      const core = ctx.createRadialGradient(x, y, 0, x, y, R * 0.3); core.addColorStop(0, 'rgba(255,240,255,0.8)'); core.addColorStop(1, 'rgba(255,240,255,0)'); ctx.fillStyle = core; ctx.beginPath(); ctx.arc(x, y, R * 0.3, 0, TAU); ctx.fill();
    });
    rim(ctx, x, y, R, sk.color, 2.2); gloss(ctx, x, y, R);
  };

  // asas de anjo e auréola
  A.wings = (ctx, x, y, R, sk, t, u) => {
    const flap = Math.sin(t * 3) * 0.15;
    [-1, 1].forEach(sd => {
      ctx.save(); ctx.translate(x + sd * R * 0.75, y); ctx.scale(sd, 1); ctx.rotate(-0.25 + flap);
      for (let k = 0; k < 5; k++) { const a = -0.9 + k * 0.32, L = R * (1.15 - k * 0.12); ctx.save(); ctx.rotate(a); ctx.fillStyle = u.rgba(k % 2 ? sk.color : sk.color2, 0.78); ctx.beginPath(); ctx.ellipse(L * 0.5, 0, L * 0.55, R * 0.12, 0, 0, TAU); ctx.fill(); ctx.restore(); }
      ctx.restore();
    });
    shell(ctx, x, y, R, sk.color); rim(ctx, x, y, R, sk.color, 2); gloss(ctx, x, y, R);
    ctx.strokeStyle = u.rgba('#ffe27a', 0.9); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.ellipse(x, y - R * 1.15 + Math.sin(t * 2) * 2, R * 0.45, R * 0.12, 0, 0, TAU); ctx.stroke();
  };

  // dragão: escamas e espinhos de fogo
  A.dragon = (ctx, x, y, R, sk, t, u) => {
    shell(ctx, x, y, R, sk.color);
    inside(ctx, x, y, R, () => {
      ctx.strokeStyle = u.rgba(sk.color, 0.4); ctx.lineWidth = 1.2; const s = R * 0.22;
      for (let row = -5; row <= 5; row++) for (let col = -5; col <= 5; col++) { const cx = x + col * s + (row % 2 ? s / 2 : 0), cy = y + row * s * 0.7; ctx.beginPath(); ctx.arc(cx, cy, s * 0.55, 0.2, Math.PI - 0.2); ctx.stroke(); }
    });
    for (let k = 0; k < 14; k++) {
      const a = k * TAU / 14 + t * 0.2, L = (k % 2 ? 7 : 12) + 3 * Math.abs(Math.sin(t * 8 + k)), w = 0.12;
      ctx.fillStyle = u.rgba(k % 2 ? sk.color2 : sk.color, 0.9);
      ctx.beginPath(); ctx.moveTo(x + Math.cos(a - w) * R, y + Math.sin(a - w) * R); ctx.lineTo(x + Math.cos(a) * (R + L), y + Math.sin(a) * (R + L)); ctx.lineTo(x + Math.cos(a + w) * R, y + Math.sin(a + w) * R); ctx.fill();
    }
    rim(ctx, x, y, R, sk.color, 2.6);
  };

  // falha digital
  A.glitch = (ctx, x, y, R, sk, t, u) => {
    const b = Math.floor(t * 12);
    shell(ctx, x, y, R, sk.color);
    inside(ctx, x, y, R, () => { for (let k = 0; k < 6; k++) { if (hash(k, b) > 0.5) continue; const yy = y - R + hash(k, b + 1) * R * 2; ctx.fillStyle = u.rgba(k % 2 ? sk.color : sk.color2, 0.3); ctx.fillRect(x - R + (hash(k, b + 2) - 0.5) * 20, yy, R * 2, 2 + hash(k, b + 3) * 5); } ctx.fillStyle = 'rgba(0,0,0,0.12)'; for (let yy = y - R; yy < y + R; yy += 3) ctx.fillRect(x - R, yy, R * 2, 1); });
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    [[sk.color, -2.5], [sk.color2, 2.5], ['#ffffff', 0]].forEach(([c, off], i) => { const j = (hash(i, b) - 0.5) * 3; ctx.strokeStyle = u.rgba(c, i === 2 ? 0.55 : 0.75); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + off + j, y, R, 0, TAU); ctx.stroke(); });
    ctx.restore();
  };

  // coroa dourada
  A.crown = (ctx, x, y, R, sk, t, u) => {
    const warm = ctx.createRadialGradient(x, y, 0, x, y, R); warm.addColorStop(0, 'rgba(255,214,120,0.06)'); warm.addColorStop(1, 'rgba(255,190,60,0.28)');
    ctx.fillStyle = warm; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
    rim(ctx, x, y, R, sk.color, 3); gloss(ctx, x, y, R);
    for (let k = 0; k < 10; k++) {
      const a = k * TAU / 10 + t * 0.35, w = 0.16, L = 11;
      ctx.fillStyle = u.rgba(sk.color, 0.95); ctx.beginPath(); ctx.moveTo(x + Math.cos(a - w) * R, y + Math.sin(a - w) * R); ctx.lineTo(x + Math.cos(a) * (R + L), y + Math.sin(a) * (R + L)); ctx.lineTo(x + Math.cos(a + w) * R, y + Math.sin(a + w) * R); ctx.fill();
      ctx.fillStyle = k % 2 ? '#ff4d6d' : '#4cc9ff'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * (R + L + 2), y + Math.sin(a) * (R + L + 2), 2, 0, TAU); ctx.fill();
    }
    for (let k = 0; k < 3; k++) { const a = t * 1.3 + k * 2.1; ctx.save(); ctx.translate(x + Math.cos(a) * R * 0.6, y + Math.sin(a) * R * 0.6); ctx.fillStyle = u.rgba(sk.color2, 0.5 + 0.5 * Math.sin(t * 6 + k)); star4(ctx, 3); ctx.fill(); ctx.restore(); }
  };

  const baseAegis = HR.Render.drawAegis;
  HR.Render.drawAegis = function (ctx, x, y, br, sk, t, T) {
    const f = A[sk.style];
    if (!f) return baseAegis.apply(this, arguments);
    const R = br * 2.05 * (1 + 0.025 * Math.sin(t * 3.2)), blink = T != null && T < 3 ? (Math.floor(t * 7) % 2 ? 1 : 0.35) : 1;
    ctx.save(); ctx.globalAlpha *= blink; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    f(ctx, x, y, R, sk, t, U());
    ctx.restore();
  };

  /* ---------------- Jato ---------------- */
  function tongue(ctx, x, y, br, len, wid, alpha, c, off, t) {
    const u = U(), g = ctx.createLinearGradient(x, y, x - len, y); g.addColorStop(0, u.rgba(c, alpha)); g.addColorStop(1, u.rgba(c, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + br * 0.2, y - wid + off);
    ctx.quadraticCurveTo(x - len * 0.45, y - wid * 0.7 + off + Math.sin(t * 17) * 2, x - len, y + off + Math.sin(t * 13) * 3);
    ctx.quadraticCurveTo(x - len * 0.45, y + wid * 0.7 + off + Math.sin(t * 19) * 2, x + br * 0.2, y + wid + off);
    ctx.closePath(); ctx.fill();
  }
  function flame(ctx, x, y, br, k, t, c1, c2, sc) { const L = br * (3.4 + 0.6 * Math.sin(t * 22)) * k * (sc || 1), W = br * 0.95 * k; tongue(ctx, x, y, br, L * 1.1, W * 1.15, 0.4, c1, 0, t); tongue(ctx, x, y, br, L * 0.55, W * 0.5, 0.9, c2, 0, t); }
  function streaks(ctx, x, y, br, t, col) { const u = U(); ctx.strokeStyle = u.rgba(col, 0.5); ctx.lineWidth = 1.5; for (let i = 0; i < 5; i++) { const yy = y + (i - 2) * br * 0.7, off = (t * 900 + i * 137) % 260; ctx.beginPath(); ctx.moveTo(x - br * 1.2 - off, yy); ctx.lineTo(x - br * 1.2 - off - 30 - i * 6, yy); ctx.stroke(); } }
  // partícula que sai da bola e vai para trás: f 0..1
  const trail = (x, y, br, k, t, i, n, rate) => { const f = (t * (rate || 2) + i / n) % 1; return { f, px: x - br * (0.8 + f * 5) * k, py: y + Math.sin(i * 2.7 + t * 3) * br * 0.45 * f }; };

  const J = {};
  J.plasma = (ctx, x, y, br, sk, t, k, u) => {
    ctx.globalCompositeOperation = 'lighter'; flame(ctx, x, y, br, k, t, sk.color, sk.color2, 0.7);
    for (let i = 0; i < 7; i++) { const f = (t * 2.5 + i / 7) % 1, cx = x - br * (0.8 + f * 4.2) * k, r = br * (0.9 - f * 0.45) * k; ctx.strokeStyle = u.rgba(i % 2 ? sk.color : sk.color2, 0.8 * (1 - f)); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(cx, y, r * 0.35, r, 0, 0, TAU); ctx.stroke(); }
    streaks(ctx, x, y, br, t, sk.color2);
  };
  J.rainbow = (ctx, x, y, br, sk, t, k, u) => {
    ctx.globalCompositeOperation = 'lighter';
    for (let b = 0; b < 6; b++) { const L = br * (3.6 + 0.5 * Math.sin(t * 20 + b)) * k; ctx.fillStyle = u.hsl(Math.round((b * 60 + t * 200) % 360), 95, 60, 0.4); ctx.beginPath(); ctx.moveTo(x + br * 0.2, y + (b - 3) * br * 0.3 * k); ctx.quadraticCurveTo(x - L * 0.5, y + (b - 2.5) * br * 0.34 * k + Math.sin(t * 12 + b) * 3, x - L, y + (b - 2.5) * br * 0.5 * k); ctx.lineTo(x + br * 0.2, y + (b - 2) * br * 0.3 * k); ctx.fill(); }
    tongue(ctx, x, y, br, br * 1.6 * k, br * 0.4 * k, 0.9, '#ffffff', 0, t);
  };
  J.ion = (ctx, x, y, br, sk, t, k, u) => {
    ctx.globalCompositeOperation = 'lighter';
    [-0.4, 0, 0.4].forEach((o, i) => { const L = br * (4.6 + Math.sin(t * 30 + i) * 0.4) * k, g = ctx.createLinearGradient(x, y, x - L, y); g.addColorStop(0, u.rgba(i === 1 ? '#ffffff' : sk.color, 0.9)); g.addColorStop(1, u.rgba(sk.color, 0)); ctx.strokeStyle = g; ctx.lineWidth = i === 1 ? 2.6 * k : 1.4 * k; ctx.beginPath(); ctx.moveTo(x - br * 0.4, y + o * br * k); ctx.lineTo(x - L, y + o * br * 1.4 * k); ctx.stroke(); });
    for (let i = 0; i < 4; i++) { const f = (t * 3 + i / 4) % 1, cx = x - br * (1 + f * 3.8) * k; ctx.strokeStyle = u.rgba(sk.color, 0.7 * (1 - f)); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(cx, y, br * 0.2 * k, br * 0.75 * k * (1 - f * 0.4), 0, 0, TAU); ctx.stroke(); }
    const gl = ctx.createRadialGradient(x - br * 0.6, y, 0, x - br * 0.6, y, br * 1.4 * k); gl.addColorStop(0, u.rgba(sk.color, 0.5)); gl.addColorStop(1, u.rgba(sk.color, 0)); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x - br * 0.6, y, br * 1.4 * k, 0, TAU); ctx.fill();
  };
  J.smoke = (ctx, x, y, br, sk, t, k, u) => {
    for (let i = 0; i < 11; i++) { const p = trail(x, y, br, k, t, i, 11, 1.4), r = br * (0.35 + p.f * 1.2) * k; ctx.fillStyle = u.rgba(sk.color2, 0.32 * (1 - p.f)); ctx.beginPath(); ctx.arc(p.px, p.py, r, 0, TAU); ctx.fill(); }
    ctx.globalCompositeOperation = 'lighter'; flame(ctx, x, y, br, k, t, sk.color, '#fff3c2', 0.45);
  };
  J.bubbles = (ctx, x, y, br, sk, t, k, u) => {
    ctx.globalCompositeOperation = 'lighter'; flame(ctx, x, y, br, k, t, sk.color, sk.color2, 0.6);
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 12; i++) { const p = trail(x, y, br, k, t, i, 12, 1.8), r = br * (0.12 + hash(i, 1) * 0.25) * k; ctx.strokeStyle = u.rgba(sk.color2, 0.8 * (1 - p.f)); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(p.px, p.py - p.f * br, r, 0, TAU); ctx.stroke(); }
  };
  J.hearts = (ctx, x, y, br, sk, t, k, u) => {
    ctx.globalCompositeOperation = 'lighter'; flame(ctx, x, y, br, k, t, sk.color, sk.color2, 0.55);
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 8; i++) { const p = trail(x, y, br, k, t, i, 8, 1.5); ctx.save(); ctx.translate(p.px, p.py); ctx.rotate(-Math.PI / 2 + Math.sin(t * 4 + i) * 0.3); ctx.fillStyle = u.rgba(i % 2 ? sk.color : sk.color2, 0.9 * (1 - p.f)); heart(ctx, br * 0.28 * k * (1 - p.f * 0.4)); ctx.fill(); ctx.restore(); }
  };
  J.pixel = (ctx, x, y, br, sk, t, k, u) => {
    const P = Math.max(3, Math.round(br * 0.35 * k)), cols = ['#ffffff', sk.color2, sk.color, '#ff5e3a'];
    for (let i = 0; i < 16; i++) { const f = (t * 3 + i / 16) % 1, px = Math.round((x - br * (0.6 + f * 4.4) * k) / P) * P, py = Math.round((y + (hash(i, Math.floor(t * 8)) - 0.5) * br * 1.2 * f * k) / P) * P, s = Math.max(1, Math.round((1 - f) * 2.5)) * P; ctx.fillStyle = u.rgba(cols[Math.min(3, Math.floor(f * 4))], 1 - f * 0.7); ctx.fillRect(px - s / 2, py - s / 2, s, s); }
  };
  J.frost = (ctx, x, y, br, sk, t, k, u) => {
    ctx.globalCompositeOperation = 'lighter'; flame(ctx, x, y, br, k, t, sk.color, sk.color2, 0.8);
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 10; i++) { const p = trail(x, y, br, k, t, i, 10, 2.2), s = br * 0.35 * k * (1 - p.f * 0.5); ctx.save(); ctx.translate(p.px, p.py); ctx.rotate(t * 3 + i); ctx.fillStyle = u.rgba(i % 2 ? '#ffffff' : sk.color, 0.85 * (1 - p.f)); ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.35, 0); ctx.lineTo(0, s); ctx.lineTo(-s * 0.35, 0); ctx.fill(); ctx.restore(); }
  };
  J.starfall = (ctx, x, y, br, sk, t, k, u) => {
    ctx.globalCompositeOperation = 'lighter'; flame(ctx, x, y, br, k, t, sk.color, sk.color2, 0.6);
    for (let i = 0; i < 12; i++) { const p = trail(x, y, br, k, t, i, 12, 1.6); ctx.save(); ctx.translate(p.px, p.py + Math.sin(i) * br * 0.6 * p.f); ctx.rotate(t * 2 + i); ctx.fillStyle = u.rgba(i % 3 ? sk.color : '#ffffff', (1 - p.f) * (0.6 + 0.4 * Math.sin(t * 12 + i))); star4(ctx, br * 0.32 * k * (1 - p.f * 0.5)); ctx.fill(); ctx.restore(); }
  };
  J.twin = (ctx, x, y, br, sk, t, k, u) => {
    ctx.globalCompositeOperation = 'lighter';
    [-1, 1].forEach(sd => { const yy = y + sd * br * 0.45 * k; flame(ctx, x, yy, br * 0.7, k, t + sd, sk.color, sk.color2, 1.1); for (let d = 0; d < 4; d++) { const dx = x - br * (1 + d * 0.8) * k; ctx.fillStyle = u.rgba('#ffffff', 0.5 - d * 0.1); ctx.beginPath(); ctx.ellipse(dx, yy, br * 0.12 * k, br * 0.2 * k, 0, 0, TAU); ctx.fill(); } });
    streaks(ctx, x, y, br, t, sk.color2);
  };
  J.lightning = (ctx, x, y, br, sk, t, k, u) => {
    ctx.globalCompositeOperation = 'lighter';
    const b = Math.floor(t * 20);
    for (let j = 0; j < 3; j++) {
      const pts = [[x - br * 0.4, y]]; let px = x - br * 0.4, py = y;
      for (let s = 0; s < 7; s++) { px -= br * 0.7 * k; py = y + (hash(j * 10 + s, b) - 0.5) * br * 1.6 * k * (s / 7 + 0.3); pts.push([px, py]); }
      [[5, sk.color, 0.3], [1.8, '#ffffff', 0.95]].forEach(([w, c, a]) => { ctx.strokeStyle = u.rgba(c, a); ctx.lineWidth = w; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); });
    }
    const gl = ctx.createRadialGradient(x - br * 0.5, y, 0, x - br * 0.5, y, br * 1.2 * k); gl.addColorStop(0, u.rgba(sk.color, 0.6)); gl.addColorStop(1, u.rgba(sk.color, 0)); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x - br * 0.5, y, br * 1.2 * k, 0, TAU); ctx.fill();
  };
  J.phoenix = (ctx, x, y, br, sk, t, k, u) => {
    ctx.globalCompositeOperation = 'lighter';
    const flap = Math.sin(t * 8) * 0.25;
    [-1, 1].forEach(sd => {
      for (let f = 0; f < 4; f++) {
        const a = sd * (0.5 + f * 0.28 + flap), L = br * (2.6 - f * 0.35) * k, ex = x - br * 0.3 - Math.cos(a) * L, ey = y - Math.sin(a) * L;
        const g = ctx.createLinearGradient(x, y, ex, ey); g.addColorStop(0, u.rgba(sk.color2, 0.8)); g.addColorStop(1, u.rgba(sk.color, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - br * 0.2, y); ctx.quadraticCurveTo((x + ex) / 2 + sd * br * 0.3, (y + ey) / 2 - sd * br * 0.3, ex, ey); ctx.quadraticCurveTo((x + ex) / 2 - sd * br * 0.2, (y + ey) / 2 + sd * br * 0.2, x - br * 0.2, y + sd * br * 0.2); ctx.fill();
      }
    });
    flame(ctx, x, y, br, k, t, sk.color, sk.color2, 1.2);
  };
  J.void = (ctx, x, y, br, sk, t, k, u) => {
    ctx.globalCompositeOperation = 'lighter'; tongue(ctx, x, y, br, br * 4.2 * k, br * 1.2 * k, 0.55, sk.color, 0, t);
    ctx.globalCompositeOperation = 'source-over'; tongue(ctx, x, y, br, br * 3.4 * k, br * 0.8 * k, 0.9, sk.color2, 0, t + 1);
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 10; i++) { const p = trail(x, y, br, k, t, i, 10, 2.4); ctx.fillStyle = u.rgba(sk.color, 0.9 * (1 - p.f)); ctx.beginPath(); ctx.arc(p.px, p.py + (hash(i, 3) - 0.5) * br * k, 1.6, 0, TAU); ctx.fill(); }
  };
  J.gold = (ctx, x, y, br, sk, t, k, u) => {
    ctx.globalCompositeOperation = 'lighter'; flame(ctx, x, y, br, k, t, sk.color, sk.color2, 1);
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 9; i++) { const p = trail(x, y, br, k, t, i, 9, 1.7), s = br * 0.26 * k; ctx.save(); ctx.translate(p.px, p.py); ctx.scale(Math.max(0.15, Math.abs(Math.cos(t * 9 + i))), 1); ctx.fillStyle = u.rgba('#ffcf4a', 1 - p.f); ctx.beginPath(); ctx.arc(0, 0, s, 0, TAU); ctx.fill(); ctx.strokeStyle = u.rgba('#8a5a08', 0.8 * (1 - p.f)); ctx.lineWidth = 0.8; ctx.stroke(); ctx.restore(); }
    streaks(ctx, x, y, br, t, sk.color2);
  };

  const baseJet = HR.Render.drawJet;
  HR.Render.drawJet = function (ctx, x, y, br, sk, t, k) {
    const f = J[sk.style];
    if (!f) return baseJet.apply(this, arguments);
    ctx.save(); f(ctx, x, y, br, sk, t, k || 1, U()); ctx.restore();
  };
})();
