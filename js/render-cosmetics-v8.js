/* =====================================================================
   ORBO v8: desenho dos Visitantes, dos 12 rastros, 8 jatos e 6 egides novos.
   Registra em HR.Render:
     SHAPES.comet / cigar / spintop / rogue  (corpo proprio, sem circulo)
     TRAILS.<id>(ctx, pts, sk, t, heat)      pts do mais antigo ao mais novo
     drawJet / drawAegis embrulhados de novo: o que nao e daqui cai no anterior
   Regras de custo: sem shadowBlur, no maximo 1 gradiente por chamada, nada
   de array grande por quadro, rastros com ~40 primitivas ou menos.
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const R = HR.Render; if (!R) return;
  const TAU = Math.PI * 2;
  R.SHAPES = R.SHAPES || {}; R.PATTERNS = R.PATTERNS || {};
  const S = R.SHAPES;
  const U = () => HR.U;
  const rgba = (c, a) => HR.U.rgba(c, a);
  const hash = (i, s) => { const v = Math.sin(i * 127.1 + (s || 0) * 311.7) * 43758.5453; return v - Math.floor(v); };
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lite = () => !!(HR.Perf && HR.Perf.lite && HR.Perf.lite());
  const circle = (ctx, x, y, r, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  // normal unitaria no ponto i do rastro
  function nrm(pts, i) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
    return { x: -dy / l, y: dx / l };
  }
  function polyline(ctx, pts, from, to, off) {
    ctx.beginPath();
    for (let i = Math.max(0, from); i < to; i++) { const p = pts[i], o = off ? off(i) : null, x = p.x + (o ? o.x : 0), y = p.y + (o ? o.y : 0); i === Math.max(0, from) ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
  }

  /* ================= VISITANTES: cometas ================= */
  // cauda: gota alongada a partir de (0,0) no sentido +x; bend curva a ponta para +y
  function tail(ctx, len, w, bend, col, a) {
    ctx.fillStyle = rgba(col, a);
    ctx.beginPath(); ctx.moveTo(0, -w);
    ctx.quadraticCurveTo(len * 0.45, -w * 0.85 + bend * 0.4, len, bend);
    ctx.quadraticCurveTo(len * 0.45, w * 0.85 + bend * 0.4, 0, w);
    ctx.closePath(); ctx.fill();
  }
  // tres camadas: larga e fraca, media, nucleo claro (sem gradiente)
  function softTail(ctx, len, w, bend, col, core, a) {
    tail(ctx, len, w, bend, col, a * 0.4);
    tail(ctx, len * 0.82, w * 0.62, bend * 0.8, col, a * 0.5);
    tail(ctx, len * 0.55, w * 0.3, bend * 0.5, core, a * 0.55);
  }
  // estrias finas acompanhando a cauda
  function streaks(ctx, len, w, bend, col, a, t, n) {
    ctx.strokeStyle = rgba(col, a * 0.7); ctx.lineWidth = Math.max(0.6, w * 0.07); ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const f = (i + 0.5) / n - 0.5, y0 = f * w * 1.3, flick = 0.82 + 0.18 * Math.sin(t * 7 + i * 2.1);
      ctx.beginPath(); ctx.moveTo(len * 0.12, y0 * 0.4); ctx.quadraticCurveTo(len * 0.5, y0 + bend * 0.45, len * flick, y0 * 0.9 + bend * flick); ctx.stroke();
    }
  }
  // coma: o unico gradiente da bola
  function coma(ctx, r, c0, c1, a) {
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    g.addColorStop(0, rgba('#ffffff', a)); g.addColorStop(0.32, rgba(c0, a * 0.72)); g.addColorStop(1, rgba(c1, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  }
  // a bola anda para +x; a cauda aponta contra o movimento e vy a inclina
  const tailAngle = vy => Math.atan2(-(vy || 0) * 0.6, -900);

  S.comet = function (ctx, r, sk, t, rot, vy) {
    const cm = sk.cm || 'halley', ion = sk.ion || '#7fd0ff', dust = sk.dust || '#fff1d0';
    ctx.save(); ctx.rotate(tailAngle(vy));
    switch (cm) {
      case 'halley':
        tail(ctx, r * 2.2, r * 0.15, 0, ion, 0.35);
        softTail(ctx, r * 2.0, r * 0.55, r * 0.35, dust, '#ffffff', 0.85);
        streaks(ctx, r * 1.9, r * 0.5, r * 0.3, '#ffffff', 0.35, t, 3);
        break;
      case 'neowise':
        tail(ctx, r * 2.3, r * 0.12, -r * 0.25, ion, 0.45);
        softTail(ctx, r * 2.1, r * 0.72, r * 0.5, dust, '#fff6dc', 0.9);
        streaks(ctx, r * 2.0, r * 0.7, r * 0.45, '#ffe8b0', 0.5, t, 5);
        break;
      case 'tsuchinshan':
        softTail(ctx, r * 2.3, r * 0.42, r * 0.22, dust, '#ffffff', 0.9);
        streaks(ctx, r * 2.25, r * 0.4, r * 0.2, '#ffffff', 0.32, t, 4);
        // anticauda: um espinho fino apontando para a frente
        ctx.save(); ctx.rotate(Math.PI); tail(ctx, r * 0.95, r * 0.05, 0, dust, 0.6); ctx.restore();
        break;
      case 'halebopp':
        tail(ctx, r * 2.25, r * 0.22, 0, ion, 0.5); tail(ctx, r * 1.8, r * 0.08, 0, '#ffffff', 0.55);
        ctx.save(); ctx.rotate(0.4); softTail(ctx, r * 1.9, r * 0.6, r * 0.5, dust, '#ffffff', 0.9); streaks(ctx, r * 1.8, r * 0.55, r * 0.45, '#ffffff', 0.35, t, 4); ctx.restore();
        break;
      case 'borisov':
        [-0.3, 0.3].forEach((d, i) => { ctx.save(); ctx.rotate(d); softTail(ctx, r * 1.4, r * 0.3, d * r * 0.4, i ? dust : ion, '#ffffff', 0.8); ctx.restore(); });
        break;
      case 'atlas3i':
        softTail(ctx, r * 1.9, r * 0.5, 0, dust, dust, 0.4);
        streaks(ctx, r * 1.8, r * 0.7, 0, dust, 0.3, t, 4);
        break;
    }
    ctx.restore();
    // coma e nucleo nao giram com a cauda
    const cr = cm === 'atlas3i' ? r * 1.35 : cm === 'halebopp' ? r * 1.08 : r * 0.98;
    coma(ctx, cr, sk.base, sk.glow, cm === 'atlas3i' ? 0.7 : 0.92);
    ctx.lineCap = 'round';
    if (cm === 'halley') {
      // nucleo escuro em forma de amendoim, com jatos claros do lado do sol (+x)
      ctx.save(); ctx.rotate(rot * 0.12);
      ctx.fillStyle = sk.dark; ctx.beginPath(); ctx.ellipse(-r * 0.1, 0, r * 0.2, r * 0.13, 0.2, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(r * 0.12, r * 0.03, r * 0.16, r * 0.11, -0.3, 0, TAU); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = r * 0.04;
      for (let i = 0; i < 3; i++) { const a = (i - 1) * 0.45 + Math.sin(t * 2 + i) * 0.1; ctx.beginPath(); ctx.moveTo(r * 0.2, 0); ctx.lineTo(r * 0.2 + Math.cos(a) * r * 0.45, Math.sin(a) * r * 0.45); ctx.stroke(); }
      ctx.restore();
    } else if (cm === 'atlas3i') {
      // jatos finos de gas saindo do nucleo, girando devagar
      ctx.strokeStyle = rgba(sk.ion || '#bffff0', 0.6); ctx.lineWidth = r * 0.035;
      for (let i = 0; i < 4; i++) { const a = t * 0.5 + i * TAU / 4, L = r * (0.6 + 0.15 * Math.sin(t * 3 + i)); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(Math.cos(a) * L * 0.5, Math.sin(a) * L * 0.5, Math.cos(a + 0.5) * L, Math.sin(a + 0.5) * L); ctx.stroke(); }
      circle(ctx, 0, 0, r * 0.12, '#ffffff');
    } else {
      circle(ctx, 0, 0, r * (cm === 'halebopp' ? 0.2 : 0.16), '#ffffff');
    }
    // dois brilhos que descem pela cauda
    for (let i = 0; i < 2; i++) { const f = (t * 0.5 + i * 0.5) % 1, a = tailAngle(vy) + (i ? 0.15 : -0.1); circle(ctx, Math.cos(a) * r * (0.4 + f * 1.6), Math.sin(a) * r * (0.4 + f * 1.6), r * 0.05 * (1 - f), rgba('#ffffff', 0.9 * (1 - f))); }
  };

  /* ================= 'Oumuamua: charuto que da cambalhota ================= */
  S.cigar = function (ctx, r, sk, t, rot) {
    // tumbling: gira no plano e encurta quando vira de ponta
    const L = r * (0.7 + 0.65 * Math.abs(Math.cos(t * 0.42))), W = r * 0.4, dir = Math.cos(t * 0.42) < 0 ? -1 : 1;
    ctx.save(); ctx.rotate(rot * 0.18 + 0.55);
    const g = ctx.createLinearGradient(0, -W, 0, W);
    g.addColorStop(0, U().mix(sk.base, '#ffffff', 0.35)); g.addColorStop(0.45, sk.base); g.addColorStop(1, sk.dark);
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, L, W, 0, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, L, W, 0, 0, TAU); ctx.clip();
    // faixas escuras cortando o eixo longo
    for (let i = 0; i < 6; i++) { const x = (i - 2.5) * L * 0.34 + Math.sin(i * 2.3) * L * 0.05, w = L * (0.06 + hash(i, 2) * 0.06); ctx.fillStyle = rgba('#1a0a06', 0.18 + hash(i, 1) * 0.16); ctx.fillRect(x - w / 2, -W, w, W * 2); }
    // manchas claras e covas
    for (let i = 0; i < 4; i++) { ctx.fillStyle = rgba('#ffd0b0', 0.16); ctx.beginPath(); ctx.ellipse((hash(i, 5) - 0.5) * L * 1.6, (hash(i, 6) - 0.5) * W * 1.2, L * 0.1, W * 0.18, 0, 0, TAU); ctx.fill(); }
    for (let i = 0; i < 5; i++) { ctx.fillStyle = rgba('#1a0a06', 0.45); ctx.beginPath(); ctx.ellipse((hash(i, 7) - 0.5) * L * 1.7, (hash(i, 8) - 0.5) * W * 1.3, L * 0.05, W * 0.09, 0, 0, TAU); ctx.fill(); }
    // terminador: uma das pontas na sombra
    ctx.fillStyle = rgba('#0a0403', 0.42); ctx.beginPath(); ctx.ellipse(dir * L * 0.75, 0, L * 0.5, W * 1.2, 0, 0, TAU); ctx.fill();
    ctx.restore();
    // borda iluminada em cima
    ctx.strokeStyle = 'rgba(255,220,190,0.35)'; ctx.lineWidth = Math.max(0.8, r * 0.05); ctx.beginPath(); ctx.ellipse(0, 0, L * 0.94, W * 0.9, 0, Math.PI * 1.1, Math.PI * 1.85); ctx.stroke();
    ctx.restore();
  };

  /* ================= Bennu e Ryugu: pioes de cascalho ================= */
  S.spintop = function (ctx, r, sk, t, rot) {
    const ry = sk.top === 'ryugu', N = 18, round = ry ? 0.1 : 0.32, Wd = r * 1.02, Hd = r * 0.92;
    ctx.save(); ctx.rotate(rot * 0.1 + (ry ? 0.35 : -0.25));
    // silhueta: losango de equador largo, misturado com um circulo, borda irregular
    ctx.beginPath();
    for (let i = 0; i < N; i++) {
      const a = i / N * TAU, ca = Math.abs(Math.cos(a)), sa = Math.abs(Math.sin(a));
      const dia = 1 / (ca / Wd + sa / Hd), rr = (dia * (1 - round) + r * 0.96 * round) * (1 + (hash(i, ry ? 3 : 1) - 0.5) * 0.07);
      i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.1);
    g.addColorStop(0, U().mix(sk.base, '#ffffff', 0.25)); g.addColorStop(0.5, sk.base); g.addColorStop(1, sk.dark);
    ctx.fillStyle = g; ctx.fill();
    // borda: luz fria de um lado (o caminho ainda e a silhueta)
    ctx.strokeStyle = rgba('#ffffff', 0.16); ctx.lineWidth = Math.max(0.8, r * 0.04); ctx.stroke();
    ctx.save(); ctx.clip();
    // cascalho: pedras claras e escuras
    for (let i = 0; i < 20; i++) {
      const x = (hash(i, 11) - 0.5) * r * 1.9, y = (hash(i, 12) - 0.5) * r * 1.7, s = r * (0.06 + hash(i, 13) * 0.11), light = i % 3 === 0;
      ctx.fillStyle = light ? rgba('#ffffff', 0.22) : rgba('#000000', 0.38);
      ctx.beginPath(); ctx.moveTo(x - s, y + s * 0.3); ctx.lineTo(x - s * 0.3, y - s); ctx.lineTo(x + s * 0.9, y - s * 0.6); ctx.lineTo(x + s, y + s * 0.5); ctx.lineTo(x, y + s); ctx.closePath(); ctx.fill();
    }
    // crista do equador
    ctx.strokeStyle = rgba('#ffffff', 0.18); ctx.lineWidth = r * 0.06; ctx.beginPath(); ctx.moveTo(-r, r * 0.04); ctx.quadraticCurveTo(0, -r * 0.08, r, r * 0.04); ctx.stroke();
    // pedregulho grande (Bennu tem um famoso)
    if (!ry) { ctx.fillStyle = rgba('#8a8488', 0.55); ctx.beginPath(); ctx.moveTo(r * 0.25, -r * 0.55); ctx.lineTo(r * 0.5, -r * 0.62); ctx.lineTo(r * 0.58, -r * 0.4); ctx.lineTo(r * 0.35, -r * 0.3); ctx.closePath(); ctx.fill(); }
    // terminador
    ctx.fillStyle = rgba('#000000', 0.3); ctx.beginPath(); ctx.arc(r * 0.7, r * 0.6, r * 1.05, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.restore();
  };

  /* ================= Errante: planeta sem estrela ================= */
  S.rogue = function (ctx, r, sk, t) {
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.05, 0, 0, r);
    g.addColorStop(0, U().mix(sk.base, '#8fb8ff', 0.22)); g.addColorStop(0.55, sk.base); g.addColorStop(1, sk.dark);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.clip();
    // faixas quase invisiveis, andando devagar
    for (let k = 0; k < 3; k++) {
      const y0 = (k - 1) * r * 0.42, h = r * 0.16;
      ctx.fillStyle = rgba(k % 2 ? '#000000' : '#5a5680', 0.14);
      ctx.beginPath(); ctx.moveTo(-r, y0);
      for (let i = 0; i <= 8; i++) { const x = -r + i * r / 4; ctx.lineTo(x, y0 + Math.sin(i * 1.1 + t * 0.35 + k) * r * 0.03); }
      ctx.lineTo(r, y0 + h); ctx.lineTo(-r, y0 + h); ctx.fill();
    }
    // auroras nos polos: oval fraco e cortinas tremulando
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    [[-1, '#5cffb5'], [1, '#b48cff']].forEach(([s, col]) => {
      const y = s * r * 0.74;
      ctx.strokeStyle = rgba(col, 0.1); ctx.lineWidth = r * 0.14; ctx.beginPath(); ctx.ellipse(0, y, r * 0.58, r * 0.17, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = rgba(col, 0.32); ctx.lineWidth = r * 0.05; ctx.beginPath(); ctx.ellipse(0, y, r * 0.58, r * 0.17, 0, 0, TAU); ctx.stroke();
      for (let j = 0; j < 7; j++) {
        const a = -1.3 + j * 0.43, f = 0.5 + 0.5 * Math.sin(t * 2.3 + j * 1.7 + s * 3), x = Math.cos(a) * r * 0.58, yy = y + Math.sin(a) * r * 0.17 * (s > 0 ? -1 : 1);
        ctx.strokeStyle = rgba(col, 0.12 + 0.3 * f); ctx.lineWidth = r * 0.04;
        ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x, yy - s * r * (0.08 + 0.18 * f)); ctx.stroke();
      }
    });
    ctx.restore();
    // luz fria das estrelas de longe, so na borda
    ctx.strokeStyle = rgba('#8fb8ff', 0.2); ctx.lineWidth = r * 0.05; ctx.beginPath(); ctx.arc(0, 0, r * 0.96, Math.PI * 1.12, Math.PI * 1.62); ctx.stroke();
  };

  /* ================= RASTROS ================= */
  const T = {};

  // aneis pequenos, como os arcos do jogo, que ficam para tras e desbotam
  T.rings = (ctx, pts, sk, t, heat) => {
    const u = U(), n = pts.length, st = lite() ? 4 : 3;
    for (let i = n - 2; i >= 0; i -= st) {
      const p = pts[i], k = i / n, age = t - p.t, rr = (3 + k * 8) * (1 + heat * 0.4), tilt = Math.sin(age * 2.2 + i) * 0.55, a = Math.min(1, k * 1.1) * Math.max(0, 1 - age * 0.9);
      if (a <= 0) continue;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(tilt);
      ctx.strokeStyle = u.rgba(sk.glow, a * 0.85); ctx.lineWidth = 1.4 + k * 1.6; ctx.beginPath(); ctx.ellipse(0, 0, rr * 0.3, rr, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = u.rgba('#ffffff', a * 0.6); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.ellipse(0, 0, rr * 0.3, rr, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      ctx.restore();
    }
  };

  // cauda de ions reta (gas) + poeira acompanhando a curva do caminho
  T.iontail = (ctx, pts, sk, t, heat) => {
    const u = U(), n = pts.length, hd = pts[n - 1], bk = pts[Math.max(0, n - 5)];
    let dx = bk.x - hd.x, dy = bk.y - hd.y; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const L = (Math.hypot(pts[0].x - hd.x, pts[0].y - hd.y) + 20) * (1 + heat * 0.3), nx = -dy, ny = dx;
    ctx.globalCompositeOperation = 'lighter';
    [[7, '#4aa8ff', 0.28], [3, '#8fd8ff', 0.6], [1.2, '#ffffff', 0.9]].forEach(([w, c, a]) => {
      ctx.fillStyle = u.rgba(c, a); ctx.beginPath();
      ctx.moveTo(hd.x + nx * w, hd.y + ny * w); ctx.lineTo(hd.x + dx * L + (Math.sin(t * 9) * 3) * nx, hd.y + dy * L + (Math.sin(t * 9) * 3) * ny); ctx.lineTo(hd.x - nx * w, hd.y - ny * w); ctx.closePath(); ctx.fill();
    });
    ctx.globalCompositeOperation = 'source-over';
    for (let i = n - 2; i >= 0; i -= 2) { const p = pts[i], k = i / n, h = hash(i, 4); ctx.fillStyle = u.rgba(h > 0.5 ? '#ffe9b8' : '#fff6dc', Math.min(1, k * 0.7)); ctx.beginPath(); ctx.arc(p.x + (h - 0.5) * 6 * (1 - k), p.y + (hash(i, 5) - 0.5) * 8 * (1.2 - k), 1 + k * 3, 0, TAU); ctx.fill(); }
  };

  // fagulhas que sobem, estalam e apagam
  T.sparks = (ctx, pts, sk, t, heat) => {
    const u = U(), n = pts.length, st = lite() ? 3 : 2, b = Math.floor(t * 20);
    ctx.lineCap = 'round';
    for (let i = n - 2; i >= 0; i -= st) {
      const p = pts[i], k = i / n, age = t - p.t, h = hash(i, 1), vx = (h - 0.5) * 60, vy = -40 - hash(i, 2) * 70;
      const a = Math.max(0, 1 - age * 1.5) * Math.min(1, k * 1.3 + 0.2) * (hash(i, b) > 0.15 ? 1 : 0.2);
      if (a <= 0) continue;
      const x = p.x + vx * age, y = p.y + vy * age + age * age * 60, col = age < 0.15 ? '#ffffff' : age < 0.35 ? '#ffe27a' : age < 0.55 ? '#ff9a3d' : '#ff4a1a', s = (1.2 + k * 1.4) * (1 + heat * 0.5);
      ctx.strokeStyle = u.rgba(col, a * 0.7); ctx.lineWidth = s * 0.8; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - vx * 0.08, y - (vy + age * 120) * 0.08); ctx.stroke();
      ctx.fillStyle = u.rgba(col, a); ctx.beginPath(); ctx.arc(x, y, s, 0, TAU); ctx.fill();
    }
  };

  // duas luas pequenas orbitando o caminho
  T.orbiters = (ctx, pts, sk, t, heat) => {
    const u = U(), n = pts.length, A = 8 * (1 + heat * 0.5), c1 = u.mix(sk.glow, '#ffffff', 0.5), c2 = u.mix(sk.base || sk.glow, '#c9a27a', 0.4);
    const off = (ph, sg) => i => { const no = nrm(pts, i), s = Math.sin(i * 0.42 - t * 4.5 + ph) * A * (0.3 + 0.7 * i / n) * sg; return { x: no.x * s, y: no.y * s }; };
    // as duas orbitas, so o fio
    ctx.strokeStyle = u.rgba(sk.glow, 0.22); ctx.lineWidth = 1; polyline(ctx, pts, 0, n, off(0, 1)); ctx.stroke(); polyline(ctx, pts, 0, n, off(0, -1)); ctx.stroke();
    for (let i = n - 1; i >= 0; i -= 3) {
      const k = i / n, ph = i * 0.42 - t * 4.5, front = Math.cos(ph) > 0, o1 = off(0, 1)(i), o2 = off(0, -1)(i), s = 1.5 + k * 3;
      // lua de tras primeiro
      const draw = (o, col, f) => { ctx.fillStyle = u.rgba(col, Math.min(1, k * 1.2) * (f ? 1 : 0.55)); ctx.beginPath(); ctx.arc(pts[i].x + o.x, pts[i].y + o.y, s * (f ? 1 : 0.8), 0, TAU); ctx.fill(); };
      draw(front ? o2 : o1, front ? c2 : c1, false); draw(front ? o1 : o2, front ? c1 : c2, true);
    }
  };

  // cacos de vidro girando e caindo devagar
  T.shards = (ctx, pts, sk, t) => {
    const u = U(), n = pts.length, st = lite() ? 3 : 2;
    for (let i = n - 2; i >= 0; i -= st) {
      const p = pts[i], k = i / n, age = t - p.t, h = hash(i, 3), s = 2.5 + k * 5, a = Math.min(1, k * 1.2);
      ctx.save(); ctx.translate(p.x + (h - 0.5) * 14, p.y + (hash(i, 4) - 0.5) * 10 + age * age * 40); ctx.rotate(age * (h - 0.5) * 8 + i);
      ctx.beginPath(); ctx.moveTo(-s, s * 0.6); ctx.lineTo(-s * 0.2, -s); ctx.lineTo(s, -s * 0.4); ctx.lineTo(s * 0.4, s * 0.8); ctx.closePath();
      ctx.fillStyle = u.rgba(sk.glow, a * 0.3); ctx.fill();
      ctx.strokeStyle = u.rgba('#ffffff', a * (0.5 + 0.5 * Math.abs(Math.sin(age * 6 + i)))); ctx.lineWidth = 0.9; ctx.stroke();
      ctx.restore();
    }
  };

  // forma de onda de audio ao longo do caminho
  T.wave = (ctx, pts, sk, t, heat) => {
    const u = U(), n = pts.length, st = (n > 26 || lite()) ? 2 : 1, b = Math.floor(t * 12);
    ctx.strokeStyle = u.rgba(sk.glow, 0.35); ctx.lineWidth = 1; polyline(ctx, pts, 0, n); ctx.stroke();
    ctx.lineCap = 'round';
    for (let i = 0; i < n; i += st) {
      const p = pts[i], k = i / n, no = nrm(pts, i), h = (hash(i, b) * 0.6 + hash(i, b + 1) * 0.4), amp = (2.5 + h * 17) * (0.25 + 0.75 * k) * (1 + heat * 0.6);
      ctx.strokeStyle = u.rgba(h > 0.75 ? '#ffffff' : sk.glow, Math.min(1, 0.35 + k * 0.7)); ctx.lineWidth = 1.6 + k * 1.2;
      ctx.beginPath(); ctx.moveTo(p.x - no.x * amp, p.y - no.y * amp); ctx.lineTo(p.x + no.x * amp, p.y + no.y * amp); ctx.stroke();
    }
  };

  // zeros e uns caindo
  T.binary = (ctx, pts, sk, t) => {
    const u = U(), n = pts.length, b = Math.floor(t * 4), col = u.mix(sk.glow, '#35e29a', 0.5);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let size = 0;
    for (let i = n - 2; i >= 0; i -= 2) {
      const p = pts[i], k = i / n, age = t - p.t, sz = k > 0.66 ? 13 : k > 0.33 ? 11 : 9;
      if (sz !== size) { size = sz; ctx.font = 'bold ' + sz + 'px monospace'; }
      ctx.fillStyle = u.rgba(k > 0.85 ? '#ffffff' : col, Math.min(1, k * 1.3) * Math.max(0.2, 1 - age * 0.6));
      ctx.fillText(hash(i, b) > 0.5 ? '1' : '0', p.x + (hash(i, 9) - 0.5) * 8, p.y + age * 45 + (hash(i, 8) - 0.5) * 10);
    }
  };

  // lanternas de papel subindo, balancando
  T.lanterns = (ctx, pts, sk, t) => {
    const u = U(), n = pts.length;
    for (let i = n - 3; i >= 0; i -= 4) {
      const p = pts[i], k = i / n, age = t - p.t, s = 3.5 + k * 5, a = Math.min(1, k * 1.3) * Math.max(0, 1 - age * 0.55), glow = 0.7 + 0.3 * Math.sin(t * 7 + i);
      if (a <= 0) continue;
      ctx.save(); ctx.translate(p.x + Math.sin(age * 2 + i) * 6, p.y - age * 42); ctx.rotate(Math.sin(age * 2.5 + i) * 0.2);
      // corpo aceso
      ctx.fillStyle = u.rgba('#ff9a3d', a * 0.9); ctx.beginPath(); ctx.moveTo(-s * 0.55, -s); ctx.lineTo(s * 0.55, -s); ctx.quadraticCurveTo(s * 0.9, 0, s * 0.5, s * 1.1); ctx.lineTo(-s * 0.5, s * 1.1); ctx.quadraticCurveTo(-s * 0.9, 0, -s * 0.55, -s); ctx.closePath(); ctx.fill();
      ctx.fillStyle = u.rgba('#fff0a0', a * 0.85 * glow); ctx.beginPath(); ctx.ellipse(0, s * 0.1, s * 0.35, s * 0.6, 0, 0, TAU); ctx.fill();
      // nervuras, tampa e fio
      ctx.strokeStyle = u.rgba('#7a2a10', a * 0.6); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-s * 0.6, -s * 1.05); ctx.lineTo(s * 0.6, -s * 1.05); ctx.moveTo(-s * 0.7, 0); ctx.lineTo(s * 0.7, 0); ctx.moveTo(0, s * 1.1); ctx.lineTo(0, s * 1.7); ctx.stroke();
      ctx.restore();
    }
  };

  // duas fitas trancadas com pontes (as quatro bases em pares de cor)
  T.dna = (ctx, pts, sk, t, heat) => {
    const u = U(), n = pts.length, A = 7 * (1 + heat * 0.6), c2 = '#ff7ad9';
    const off = sg => i => { const no = nrm(pts, i), s = Math.sin(i * 0.5 - t * 6) * A * (0.25 + 0.75 * i / n) * sg; return { x: no.x * s, y: no.y * s }; };
    ctx.lineCap = 'round';
    // as duas fitas
    ctx.lineWidth = 1.8 * (1 + heat * 0.4);
    ctx.strokeStyle = u.rgba(c2, 0.8); polyline(ctx, pts, 0, n, off(-1)); ctx.stroke();
    ctx.strokeStyle = u.rgba(sk.glow, 0.9); polyline(ctx, pts, 0, n, off(1)); ctx.stroke();
    // pontes, cada metade com a cor da sua base (A-T amarelo/verde, C-G vermelho/azul)
    for (let i = 1; i < n - 1; i += 2) {
      const p = pts[i], k = i / n, o = off(1)(i), pair = hash(i, 2) > 0.5, a = Math.min(1, k * 1.2);
      ctx.lineWidth = 1.6 + k * 1.6;
      ctx.strokeStyle = u.rgba(pair ? '#ffcf4a' : '#ff5e7e', a); ctx.beginPath(); ctx.moveTo(p.x + o.x, p.y + o.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      ctx.strokeStyle = u.rgba(pair ? '#7cff6b' : '#5aa9ff', a); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - o.x, p.y - o.y); ctx.stroke();
    }
    // brilho onde a fita passa pela frente
    for (let i = 1; i < n; i += 3) { const ph = i * 0.5 - t * 6, f = Math.cos(ph); if (f < 0.6) continue; const o = off(1)(i); ctx.fillStyle = u.rgba('#ffffff', (i / n) * (f - 0.6) * 2); ctx.beginPath(); ctx.arc(pts[i].x + o.x, pts[i].y + o.y, 1.4 + i / n * 1.4, 0, TAU); ctx.fill(); }
  };

  // espirais que se desenrolam e somem
  T.spiral = (ctx, pts, sk, t, heat) => {
    const u = U(), n = pts.length, st = lite() ? 6 : 5;
    ctx.lineCap = 'round';
    for (let i = n - 3; i >= 0; i -= st) {
      const p = pts[i], k = i / n, age = t - p.t, a = Math.min(1, k * 1.3) * Math.max(0, 1 - age * 0.8);
      if (a <= 0) continue;
      const turns = Math.max(0.6, 2.4 - age * 1.6), rad = (5 + age * 26) * (1 + heat * 0.4), rot = age * 3 + i;
      ctx.beginPath();
      for (let j = 0; j <= 22; j++) { const f = j / 22, an = rot + f * turns * TAU, rr = f * rad; j ? ctx.lineTo(p.x + Math.cos(an) * rr, p.y + Math.sin(an) * rr) : ctx.moveTo(p.x, p.y); }
      ctx.strokeStyle = u.rgba(sk.glow, a * 0.3); ctx.lineWidth = 4.5; ctx.stroke();
      ctx.strokeStyle = u.rgba('#ffffff', a * 0.85); ctx.lineWidth = 1.4; ctx.stroke();
    }
  };

  // pincelada grossa com as cerdas marcadas e a ponta seca
  T.paint = (ctx, pts, sk, t, heat) => {
    const u = U(), n = pts.length, wm = 1 + heat * 0.6, dark = u.mix(sk.glow, '#000000', 0.35), light = u.mix(sk.glow, '#ffffff', 0.4);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // corpo em tres larguras (mais fino no comeco, mais grosso perto da bola)
    [[0, 0.4, 4], [0.33, 0.72, 7.5], [0.66, 1, 11]].forEach(([f0, f1, w], j) => { ctx.strokeStyle = u.rgba(sk.glow, 0.55 + j * 0.15); ctx.lineWidth = w * wm; polyline(ctx, pts, Math.floor(n * f0), Math.min(n, Math.ceil(n * f1) + 1)); ctx.stroke(); });
    // cerdas: fios paralelos, os de fora com falhas
    ctx.lineCap = 'butt';
    [[-4.2, dark, 0.55], [-1.6, light, 0.5], [1.5, dark, 0.45], [3.8, light, 0.4]].forEach(([d, c, a], j) => {
      const off = i => { const no = nrm(pts, i), s = d * wm * (0.35 + 0.65 * i / n); return { x: no.x * s, y: no.y * s }; };
      ctx.strokeStyle = u.rgba(c, a); ctx.lineWidth = 1.1; ctx.setLineDash([9 + j * 4, 3 + hash(j, 1) * 5]); ctx.lineDashOffset = -j * 7;
      polyline(ctx, pts, Math.floor(n * 0.15), n, off); ctx.stroke();
    });
    ctx.setLineDash([]);
    // respingos
    for (let j = 0; j < 3; j++) { const i = Math.floor(n * (0.3 + j * 0.25)), p = pts[Math.min(n - 1, i)]; ctx.fillStyle = u.rgba(sk.glow, 0.7); ctx.beginPath(); ctx.arc(p.x + (hash(j, 5) - 0.5) * 20, p.y + (hash(j, 6) - 0.5) * 20, 1 + hash(j, 7) * 2, 0, TAU); ctx.fill(); }
  };

  // mariposas: asas cor de poeira, voo tremido, antenas de pluma
  T.moth = (ctx, pts, sk, t) => {
    const u = U(), n = pts.length, wing = u.mix('#d8c9a8', sk.glow, 0.18);
    for (let i = n - 3; i >= 0; i -= 4) {
      const p = pts[i], k = i / n, age = t - p.t, s = 3.5 + k * 5.5, a = Math.min(1, k * 1.2) * Math.max(0, 1 - age * 0.5), flap = 0.2 + 0.8 * Math.abs(Math.sin(t * 21 + i * 1.3));
      if (a <= 0) continue;
      ctx.save(); ctx.translate(p.x + Math.sin(age * 7 + i) * 7, p.y - age * 22 + Math.cos(age * 5 + i) * 6); ctx.rotate(Math.sin(age * 3 + i) * 0.4 - 0.3);
      [-1, 1].forEach(sd => {
        ctx.save(); ctx.scale(sd * flap, 1);
        ctx.fillStyle = u.rgba(wing, a * 0.9);
        ctx.beginPath(); ctx.moveTo(0, -s * 0.2); ctx.lineTo(s * 1.15, -s * 0.85); ctx.lineTo(s * 1.25, -s * 0.1); ctx.lineTo(s * 0.55, s * 0.15); ctx.lineTo(s * 0.9, s * 0.75); ctx.lineTo(s * 0.25, s * 0.55); ctx.closePath(); ctx.fill();
        ctx.fillStyle = u.rgba('#6b5a44', a * 0.45); ctx.beginPath(); ctx.arc(s * 0.7, -s * 0.35, s * 0.14, 0, TAU); ctx.fill();
        ctx.restore();
      });
      ctx.fillStyle = u.rgba('#8a7658', a); ctx.beginPath(); ctx.ellipse(0, s * 0.1, s * 0.16, s * 0.55, 0, 0, TAU); ctx.fill();
      ctx.strokeStyle = u.rgba('#8a7658', a * 0.9); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, -s * 0.4); ctx.quadraticCurveTo(-s * 0.4, -s * 0.9, -s * 0.55, -s * 1.05); ctx.moveTo(0, -s * 0.4); ctx.quadraticCurveTo(s * 0.4, -s * 0.9, s * 0.55, -s * 1.05); ctx.stroke();
      ctx.restore();
    }
  };

  if (!R.TRAILS) {
    R.TRAILS = {};
    const base = R.drawTrail;
    R.drawTrail = function (ctx, trailId, pts, skin, t, heat) {
      const f = R.TRAILS[trailId];
      if (!f) return base.apply(this, arguments);
      if (!pts || pts.length < 3) return;
      ctx.save(); f(ctx, pts, skin, t, heat || 0); ctx.restore();
    };
  }
  Object.keys(T).forEach(id => { R.TRAILS[id] = T[id]; });

  /* ================= JATOS ================= */
  // particula que sai da bola e vai para tras: f 0..1
  const back = (x, y, br, k, t, i, n, rate) => { const f = (t * (rate || 2) + i / n) % 1; return { f, px: x - br * (0.8 + f * 5) * k, py: y + Math.sin(i * 2.7 + t * 3) * br * 0.45 * f }; };
  // ponta reta afinando ate sumir, no sentido -x
  function spike(ctx, x, y, len, w, col, a, wob) { ctx.fillStyle = rgba(col, a); ctx.beginPath(); ctx.moveTo(x, y - w); ctx.lineTo(x - len, y + (wob || 0)); ctx.lineTo(x, y + w); ctx.closePath(); ctx.fill(); }
  const J = {};

  // cometa: coma azulada, cauda de ions reta e cauda de poeira curva
  J.comet = (ctx, x, y, br, sk, t, k, u) => {
    ctx.globalCompositeOperation = 'lighter';
    const L = br * 5 * k;
    spike(ctx, x - br * 0.3, y, L, br * 0.35 * k, sk.color, 0.35, Math.sin(t * 8) * 2); spike(ctx, x - br * 0.3, y, L * 0.85, br * 0.12 * k, '#ffffff', 0.8, Math.sin(t * 8) * 2);
    // poeira: curva para baixo, em camadas
    [[1, 0.28], [0.75, 0.4], [0.5, 0.5]].forEach(([f, a]) => { ctx.fillStyle = u.rgba(sk.color2, a); ctx.beginPath(); ctx.moveTo(x - br * 0.2, y - br * 0.5 * k * f); ctx.quadraticCurveTo(x - L * 0.45 * f, y + br * 0.2 * k, x - L * 0.9 * f, y + br * 1.3 * k * f); ctx.quadraticCurveTo(x - L * 0.4 * f, y + br * 0.9 * k * f, x - br * 0.2, y + br * 0.55 * k * f); ctx.fill(); });
    for (let i = 0; i < 6; i++) { const p = back(x, y, br, k, t, i, 6, 1.6); ctx.fillStyle = u.rgba('#ffffff', (1 - p.f) * 0.9); ctx.beginPath(); ctx.arc(p.px, p.py + p.f * br * 0.8 * k, 1.2 + (1 - p.f) * 1.5, 0, TAU); ctx.fill(); }
    const g = ctx.createRadialGradient(x - br * 0.4, y, 0, x - br * 0.4, y, br * 1.5 * k); g.addColorStop(0, u.rgba('#ffffff', 0.7)); g.addColorStop(0.4, u.rgba(sk.color, 0.4)); g.addColorStop(1, u.rgba(sk.color, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x - br * 0.4, y, br * 1.5 * k, 0, TAU); ctx.fill();
  };

  // aurora: cortinas verde, ciano e violeta ondulando atras
  J.aurora = (ctx, x, y, br, sk, t, k, u) => {
    ctx.globalCompositeOperation = 'lighter';
    const L = br * 4.8 * k, c3 = u.mix(sk.color, sk.color2, 0.5);
    [[sk.color, 0, -0.55], [c3, 2.1, 0], ['#4cf0ff', 1, 0.3], [sk.color2, 4.2, 0.6]].forEach(([c, ph, off]) => {
      ctx.fillStyle = u.rgba(c, 0.38); ctx.beginPath();
      for (let j = 0; j <= 10; j++) { const f = j / 10, px = x - br * 0.3 - f * L, py = y + off * br * k + Math.sin(f * 5 + t * 3 + ph) * br * 0.35 * k * (0.3 + f); j ? ctx.lineTo(px, py - br * 0.32 * k * (1 - f * 0.5)) : ctx.moveTo(px, py - br * 0.32 * k); }
      for (let j = 10; j >= 0; j--) { const f = j / 10, px = x - br * 0.3 - f * L, py = y + off * br * k + Math.sin(f * 5 + t * 3 + ph) * br * 0.35 * k * (0.3 + f); ctx.lineTo(px, py + br * 0.32 * k * (1 - f * 0.5)); }
      ctx.closePath(); ctx.fill();
    });
    // fios verticais das cortinas
    ctx.strokeStyle = u.rgba('#ffffff', 0.35); ctx.lineWidth = 1; ctx.beginPath();
    for (let j = 0; j < 8; j++) { const f = (j + ((t * 1.3) % 1)) / 8, px = x - br * 0.4 - f * L, h = br * (0.9 - f * 0.5) * k; ctx.moveTo(px, y - h); ctx.lineTo(px, y + h); }
    ctx.stroke();
  };

  // fogo de dragao: chama dentada, brasas e fumaca escura
  J.dragonfire = (ctx, ctx_x, y, br, sk, t, k, u) => {
    const x = ctx_x, b = Math.floor(t * 18), L = br * (4.2 + 0.5 * Math.sin(t * 20)) * k;
    // fumaca escura primeiro (sem lighter)
    for (let i = 0; i < 4; i++) { const p = back(x, y, br, k, t, i, 4, 1.1); ctx.fillStyle = u.rgba('#2a1410', 0.35 * (1 - p.f)); ctx.beginPath(); ctx.arc(p.px - br * 0.8 * k, p.py - p.f * br * 0.8 * k, br * (0.4 + p.f * 1.1) * k, 0, TAU); ctx.fill(); }
    ctx.globalCompositeOperation = 'lighter';
    const flame = (len, w, col, a, seed) => {
      ctx.fillStyle = u.rgba(col, a); ctx.beginPath(); ctx.moveTo(x + br * 0.2, y - w);
      for (let j = 1; j <= 6; j++) { const f = j / 6, px = x - len * f, jag = (hash(j + seed, b) - 0.3) * w * 0.9; ctx.lineTo(px, y - w * (1 - f) - jag * (j % 2 ? 1 : 0.2)); }
      for (let j = 6; j >= 1; j--) { const f = j / 6, px = x - len * f, jag = (hash(j + seed + 20, b) - 0.3) * w * 0.9; ctx.lineTo(px, y + w * (1 - f) + jag * (j % 2 ? 0.2 : 1)); }
      ctx.lineTo(x + br * 0.2, y + w); ctx.closePath(); ctx.fill();
    };
    flame(L, br * 1.1 * k, '#8a1a0a', 0.6, 0); flame(L * 0.85, br * 0.85 * k, sk.color, 0.75, 7); flame(L * 0.55, br * 0.5 * k, sk.color2, 0.9, 13); flame(L * 0.3, br * 0.25 * k, '#ffffff', 0.9, 19);
    for (let i = 0; i < 7; i++) { const p = back(x, y, br, k, t, i, 7, 2.2); ctx.fillStyle = u.rgba(i % 2 ? sk.color2 : '#ff8a3d', (1 - p.f)); ctx.beginPath(); ctx.arc(p.px, p.py + (hash(i, 2) - 0.5) * br * k, 1 + (1 - p.f) * 1.6, 0, TAU); ctx.fill(); }
  };

  // cristal: lascas de gelo facetadas que voam para tras, nucleo em favo
  J.crystal = (ctx, x, y, br, sk, t, k, u) => {
    const g = ctx.createRadialGradient(x - br * 0.5, y, 0, x - br * 0.5, y, br * 1.6 * k); g.addColorStop(0, u.rgba(sk.color, 0.45)); g.addColorStop(1, u.rgba(sk.color, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x - br * 0.5, y, br * 1.6 * k, 0, TAU); ctx.fill();
    ctx.lineJoin = 'round';
    for (let i = 0; i < 9; i++) {
      const p = back(x, y, br, k, t, i, 9, 1.6), s = br * 0.34 * k * (1 - p.f * 0.45), a = 1 - p.f;
      ctx.save(); ctx.translate(p.px, p.py + (hash(i, 3) - 0.5) * br * 0.6 * k); ctx.rotate(t * 2.5 + i * 1.1);
      ctx.beginPath(); ctx.moveTo(0, -s * 1.4); ctx.lineTo(s * 0.5, -s * 0.2); ctx.lineTo(s * 0.35, s * 1.1); ctx.lineTo(-s * 0.35, s * 1.1); ctx.lineTo(-s * 0.5, -s * 0.2); ctx.closePath();
      ctx.fillStyle = u.rgba(i % 3 ? sk.color : sk.color2, a * 0.7); ctx.fill(); ctx.strokeStyle = u.rgba('#ffffff', a * 0.95); ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = u.rgba('#ffffff', a * 0.5); ctx.beginPath(); ctx.moveTo(0, -s * 1.4); ctx.lineTo(0, s * 1.1); ctx.stroke();
      ctx.restore();
    }
    // nucleo: hexagono frio colado na bola
    ctx.save(); ctx.translate(x - br * 0.55 * k, y); ctx.rotate(t * 1.2); ctx.beginPath(); for (let j = 0; j < 6; j++) { const a = j * TAU / 6, rr = br * 0.42 * k; j ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(rr, 0); } ctx.closePath();
    ctx.fillStyle = u.rgba('#ffffff', 0.55); ctx.fill(); ctx.strokeStyle = u.rgba(sk.color, 0.9); ctx.lineWidth = 1.2; ctx.stroke(); ctx.restore();
  };

  // brasa: fumaca cinzenta e brasas que esfriam ao ir para tras
  J.ember = (ctx, x, y, br, sk, t, k, u) => {
    for (let i = 0; i < 7; i++) { const p = back(x, y, br, k, t, i, 7, 1.3); ctx.fillStyle = u.rgba(sk.color2, 0.3 * (1 - p.f)); ctx.beginPath(); ctx.arc(p.px, p.py - p.f * br * 0.6 * k, br * (0.3 + p.f * 1.2) * k, 0, TAU); ctx.fill(); }
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(x, y, x - br * 2.2 * k, y); g.addColorStop(0, u.rgba('#fff0a0', 0.9)); g.addColorStop(1, u.rgba(sk.color, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + br * 0.2, y - br * 0.5 * k); ctx.quadraticCurveTo(x - br * 1.1 * k, y + Math.sin(t * 15) * 2, x - br * 2.2 * k, y); ctx.quadraticCurveTo(x - br * 1.1 * k, y - Math.sin(t * 15) * 2, x + br * 0.2, y + br * 0.5 * k); ctx.fill();
    for (let i = 0; i < 11; i++) {
      const p = back(x, y, br, k, t, i, 11, 1.9), f = p.f, col = f < 0.25 ? '#fff3a0' : f < 0.5 ? '#ffb347' : f < 0.75 ? sk.color : '#7a2a1a', tw = 0.6 + 0.4 * Math.sin(t * 14 + i);
      ctx.fillStyle = u.rgba(col, (1 - f * 0.7) * tw); ctx.beginPath(); ctx.arc(p.px, p.py + (hash(i, 6) - 0.5) * br * 1.2 * k * f, br * 0.09 * k * (1.4 - f * 0.6), 0, TAU); ctx.fill();
    }
  };

  // linha neon: tres fios finos com pulsos correndo, como um circuito aceso
  J.neonline = (ctx, x, y, br, sk, t, k, u) => {
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    const L = br * 5.2 * k;
    [[sk.color, -0.45, 0], [sk.color2, 0.45, 2], ['#ffffff', 0, 4]].forEach(([c, o, ph], j) => {
      const yy = y + o * br * k;
      ctx.strokeStyle = u.rgba(c, 0.22); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(x - br * 0.3, yy); ctx.lineTo(x - L, yy + Math.sin(t * 5 + ph) * br * 0.25 * k); ctx.stroke();
      ctx.strokeStyle = u.rgba(c, 0.95); ctx.lineWidth = j === 2 ? 1.6 : 1.2; ctx.setLineDash([L * 0.18, L * 0.07]); ctx.lineDashOffset = -t * 260 - ph * 20; ctx.beginPath(); ctx.moveTo(x - br * 0.3, yy); ctx.lineTo(x - L, yy + Math.sin(t * 5 + ph) * br * 0.25 * k); ctx.stroke(); ctx.setLineDash([]);
      const f = (t * 1.7 + j / 3) % 1; ctx.fillStyle = u.rgba('#ffffff', 1 - f); ctx.beginPath(); ctx.arc(x - br * 0.3 - f * L, yy + Math.sin(t * 5 + ph) * br * 0.25 * k * f, 2.2 * (1 - f) + 0.6, 0, TAU); ctx.fill();
    });
    ctx.fillStyle = u.rgba('#ffffff', 0.9); ctx.beginPath(); ctx.arc(x - br * 0.35, y, br * 0.22 * k, 0, TAU); ctx.fill();
  };

  // petalas que se soltam girando, com um sopro rosa perto do bico
  J.petals = (ctx, x, y, br, sk, t, k, u) => {
    const g = ctx.createRadialGradient(x - br * 0.6, y, 0, x - br * 0.6, y, br * 1.5 * k); g.addColorStop(0, u.rgba(sk.color2, 0.6)); g.addColorStop(1, u.rgba(sk.color, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x - br * 0.6, y, br * 1.5 * k, 0, TAU); ctx.fill();
    for (let i = 0; i < 9; i++) {
      const p = back(x, y, br, k, t, i, 9, 1.4), s = br * 0.4 * k * (1 - p.f * 0.35), a = 1 - p.f * 0.8;
      ctx.save(); ctx.translate(p.px, p.py + Math.sin(t * 2 + i) * br * 0.5 * k * p.f); ctx.rotate(t * 3 * (i % 2 ? 1 : -1) + i);
      ctx.fillStyle = u.rgba(i % 3 ? sk.color : sk.color2, a * 0.9);
      ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(s * 0.9, -s * 0.3, 0, s); ctx.quadraticCurveTo(-s * 0.9, -s * 0.3, 0, -s); ctx.fill();
      ctx.strokeStyle = u.rgba('#ffffff', a * 0.5); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, -s * 0.8); ctx.lineTo(0, s * 0.6); ctx.stroke();
      ctx.restore();
    }
    for (let i = 0; i < 4; i++) { const p = back(x, y, br, k, t, i, 4, 2.4); ctx.fillStyle = u.rgba('#ffe27a', 1 - p.f); ctx.beginPath(); ctx.arc(p.px, p.py - p.f * br * k, 1.3, 0, TAU); ctx.fill(); }
  };

  // binario: zeros e uns em tres linhas correndo para tras
  J.binary = (ctx, x, y, br, sk, t, k, u) => {
    const g = ctx.createRadialGradient(x - br * 0.5, y, 0, x - br * 0.5, y, br * 1.3 * k); g.addColorStop(0, u.rgba(sk.color, 0.5)); g.addColorStop(1, u.rgba(sk.color, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x - br * 0.5, y, br * 1.3 * k, 0, TAU); ctx.fill();
    ctx.strokeStyle = u.rgba(sk.color, 0.35); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x - br * 0.4, y); ctx.lineTo(x - br * 5 * k, y); ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.max(8, Math.round(br * 0.55 * k)) + 'px monospace';
    const b = Math.floor(t * 6);
    for (let row = -1; row <= 1; row++) for (let i = 0; i < 6; i++) {
      const f = ((t * 1.4 + i / 6 + row * 0.17) % 1), px = x - br * (0.6 + f * 4.6) * k, py = y + row * br * 0.7 * k + Math.sin(t * 3 + i + row) * br * 0.1 * k;
      ctx.fillStyle = u.rgba(f < 0.15 ? '#ffffff' : row ? sk.color : sk.color2, (1 - f) * 0.95);
      ctx.fillText(hash(i + row * 7, b + (f * 3 | 0)) > 0.5 ? '1' : '0', px, py);
    }
  };

  const baseJet = R.drawJet;
  R.drawJet = function (ctx, x, y, br, sk, t, k) {
    const f = sk && J[sk.style];
    if (!f) return baseJet.apply(this, arguments);
    ctx.save();
    try { f(ctx, x, y, br, sk, t, k || 1, U()); } catch (_) { /* nunca derruba o quadro */ }
    ctx.restore();
  };

  /* ================= EGIDES ================= */
  function shell(ctx, x, y, Rr, c1) {
    const u = U(), g = ctx.createRadialGradient(x - Rr * 0.3, y - Rr * 0.35, Rr * 0.1, x, y, Rr);
    g.addColorStop(0, u.rgba(c1, 0.04)); g.addColorStop(0.72, u.rgba(c1, 0.12)); g.addColorStop(1, u.rgba(c1, 0.32));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, Rr, 0, TAU); ctx.fill();
  }
  function rim(ctx, x, y, Rr, c1, w) {
    const u = U();
    ctx.strokeStyle = u.rgba(c1, 0.85); ctx.lineWidth = w || 2.4; ctx.beginPath(); ctx.arc(x, y, Rr, 0, TAU); ctx.stroke();
    ctx.strokeStyle = u.rgba(c1, 0.22); ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(x, y, Rr + 1, 0, TAU); ctx.stroke();
  }
  function gloss(ctx, x, y, Rr) { ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(x, y, Rr * 0.82, Math.PI * 1.12, Math.PI * 1.45); ctx.stroke(); }
  function inside(ctx, x, y, Rr, fn) { ctx.save(); ctx.beginPath(); ctx.arc(x, y, Rr, 0, TAU); ctx.clip(); fn(); ctx.restore(); }
  const A = {};

  // orbita: duas luas em orbitas inclinadas, passando por tras e pela frente
  A.orbit = (ctx, x, y, Rr, sk, t, u) => {
    const orbs = [[0.55, t * 1.1, sk.color2, 0.13], [-0.7, -t * 0.8 + 2, sk.color, 0.09]];
    const pos = (tilt, a) => { const ex = Rr * 1.18, ey = Rr * 0.34, px = Math.cos(a) * ex, py = Math.sin(a) * ey; return { x: x + px * Math.cos(tilt) - py * Math.sin(tilt), y: y + px * Math.sin(tilt) + py * Math.cos(tilt), front: Math.sin(a) > 0 }; };
    const moon = (tilt, a, col, s) => { const p = pos(tilt, a); ctx.fillStyle = u.rgba(col, p.front ? 1 : 0.5); ctx.beginPath(); ctx.arc(p.x, p.y, Rr * s * (p.front ? 1 : 0.85), 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(p.x + Rr * s * 0.35, p.y + Rr * s * 0.2, Rr * s * 0.75, 0, TAU); ctx.fill(); };
    orbs.forEach(([tilt, a, col, s]) => { if (!pos(tilt, a).front) moon(tilt, a, col, s); });
    shell(ctx, x, y, Rr, sk.color);
    orbs.forEach(([tilt]) => { ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.strokeStyle = u.rgba(sk.color, 0.45); ctx.lineWidth = 1.1; ctx.beginPath(); ctx.ellipse(0, 0, Rr * 1.18, Rr * 0.34, 0, 0, TAU); ctx.stroke(); ctx.restore(); });
    rim(ctx, x, y, Rr, sk.color, 2); gloss(ctx, x, y, Rr);
    orbs.forEach(([tilt, a, col, s]) => { if (pos(tilt, a).front) moon(tilt, a, col, s); });
  };

  // prisma: um feixe branco entra, um leque de cores sai
  A.prism = (ctx, x, y, Rr, sk, t, u) => {
    shell(ctx, x, y, Rr, sk.color2);
    inside(ctx, x, y, Rr, () => {
      const s = Rr * 0.42, rot = Math.sin(t * 0.7) * 0.15;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      ctx.lineCap = 'round';
      ctx.strokeStyle = u.rgba('#ffffff', 0.9); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-Rr * 1.2, -Rr * 0.25); ctx.lineTo(-s * 0.35, -s * 0.05); ctx.stroke();
      ctx.globalCompositeOperation = 'lighter';
      for (let j = 0; j < 6; j++) { const a = -0.28 + j * 0.11 + Math.sin(t * 2 + j) * 0.015; ctx.strokeStyle = u.hsl(j * 55, 100, 62, 0.75); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(s * 0.3, 0); ctx.lineTo(s * 0.3 + Math.cos(a) * Rr * 1.3, Math.sin(a) * Rr * 1.3); ctx.stroke(); }
      ctx.globalCompositeOperation = 'source-over';
      ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.87, s * 0.5); ctx.lineTo(-s * 0.87, s * 0.5); ctx.closePath();
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.6; ctx.stroke();
      ctx.restore();
    });
    // borda com um fio de arco-iris
    for (let j = 0; j < 6; j++) { const a0 = j * TAU / 6 + t * 0.5; ctx.strokeStyle = u.hsl(j * 60, 95, 65, 0.55); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(x, y, Rr, a0, a0 + TAU / 6 + 0.02); ctx.stroke(); }
    ctx.strokeStyle = u.rgba('#ffffff', 0.5); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, Rr, 0, TAU); ctx.stroke(); gloss(ctx, x, y, Rr);
  };

  // renda: borda recortada, lacinhos e fios finos, como uma toalha bordada
  A.lace = (ctx, x, y, Rr, sk, t, u) => {
    shell(ctx, x, y, Rr, sk.color);
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.12);
    ctx.strokeStyle = u.rgba('#ffffff', 0.85); ctx.lineWidth = 1.3;
    // borda recortada: 20 meias-luas viradas para fora, num caminho so
    ctx.beginPath(); for (let j = 0; j < 20; j++) { const a = j * TAU / 20, cx = Math.cos(a) * Rr * 0.97, cy = Math.sin(a) * Rr * 0.97, s = Rr * 0.16; ctx.moveTo(cx + Math.cos(a - Math.PI / 2) * s, cy + Math.sin(a - Math.PI / 2) * s); ctx.arc(cx, cy, s, a - Math.PI / 2, a + Math.PI / 2, false); } ctx.stroke();
    // anel de pontinhos bordados por dentro
    ctx.strokeStyle = u.rgba(sk.color, 0.85); ctx.lineWidth = 1; ctx.beginPath(); for (let j = 0; j < 16; j++) { const a = j * TAU / 16, rr = Rr * 0.72; ctx.moveTo(Math.cos(a) * rr + Rr * 0.04, Math.sin(a) * rr); ctx.arc(Math.cos(a) * rr, Math.sin(a) * rr, Rr * 0.04, 0, TAU); } ctx.stroke();
    // fios radiais e circulo de fundo
    ctx.strokeStyle = u.rgba('#ffffff', 0.35); ctx.lineWidth = 0.8; ctx.beginPath(); for (let j = 0; j < 12; j++) { const a = j * TAU / 12; ctx.moveTo(Math.cos(a) * Rr * 0.35, Math.sin(a) * Rr * 0.35); ctx.lineTo(Math.cos(a) * Rr * 0.88, Math.sin(a) * Rr * 0.88); } ctx.moveTo(Rr * 0.5, 0); ctx.arc(0, 0, Rr * 0.5, 0, TAU); ctx.stroke();
    ctx.fillStyle = u.rgba('#ffffff', 0.9); for (let j = 0; j < 8; j++) { const a = j * TAU / 8 + Math.PI / 8; ctx.beginPath(); ctx.arc(Math.cos(a) * Rr * 0.88, Math.sin(a) * Rr * 0.88, 1.6, 0, TAU); ctx.fill(); }
    ctx.restore();
    ctx.strokeStyle = u.rgba('#ffffff', 0.75); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, Rr, 0, TAU); ctx.stroke(); gloss(ctx, x, y, Rr);
  };

  // espinhos: uma trepadeira enrolada na borda, com espinhos para fora e tres rosas
  A.thorns = (ctx, x, y, Rr, sk, t, u) => {
    shell(ctx, x, y, Rr, sk.color);
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.2);
    const vine = (w, c, a) => { ctx.strokeStyle = u.rgba(c, a); ctx.lineWidth = w; ctx.beginPath(); for (let i = 0; i <= 48; i++) { const an = i / 48 * TAU, rr = Rr + Math.sin(an * 6) * 2.2; i ? ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr) : ctx.moveTo(rr, 0); } ctx.closePath(); ctx.stroke(); };
    vine(4.5, '#1f5a2a', 0.95); vine(1.6, sk.color, 0.9);
    ctx.fillStyle = u.rgba('#2a7a3a', 0.95);
    for (let j = 0; j < 14; j++) { const a = j * TAU / 14 + 0.2, sd = j % 2 ? 1 : -1, L = 7 + (j % 3) * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.08) * Rr, Math.sin(a - 0.08) * Rr); ctx.lineTo(Math.cos(a + sd * 0.12) * (Rr + L), Math.sin(a + sd * 0.12) * (Rr + L)); ctx.lineTo(Math.cos(a + 0.08) * Rr, Math.sin(a + 0.08) * Rr); ctx.closePath(); ctx.fill(); }
    for (let j = 0; j < 3; j++) { const a = j * TAU / 3 + 1, px = Math.cos(a) * Rr, py = Math.sin(a) * Rr, s = 4.5 + Math.sin(t * 3 + j) * 0.4; ctx.fillStyle = u.rgba(sk.color2, 1); ctx.beginPath(); ctx.arc(px, py, s, 0, TAU); ctx.fill(); ctx.strokeStyle = 'rgba(80,0,20,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(px, py, s * 0.55, 0, TAU * 0.75); ctx.stroke(); ctx.beginPath(); ctx.arc(px + s * 0.2, py - s * 0.1, s * 0.25, Math.PI, TAU * 0.9); ctx.stroke(); }
    ctx.restore();
  };

  // aureola: um anel dourado que gira em volta da bolha, com raios
  A.halo = (ctx, x, y, Rr, sk, t, u) => {
    const ry = Rr * 0.32 * Math.sin(t * 0.9), ex = Rr * 1.12, ey = Math.max(2, Math.abs(ry)), up = ry >= 0;
    const half = front => {
      const a0 = front === up ? 0 : Math.PI, a1 = a0 + Math.PI;
      ctx.strokeStyle = u.rgba(sk.color, 0.22); ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(x, y, ex, ey, 0, a0, a1); ctx.stroke();
      ctx.strokeStyle = u.rgba(sk.color, 0.95); ctx.lineWidth = 3.6; ctx.beginPath(); ctx.ellipse(x, y, ex, ey, 0, a0, a1); ctx.stroke();
      ctx.strokeStyle = u.rgba(sk.color2, 0.9); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(x, y, ex, ey, 0, a0, a1); ctx.stroke();
    };
    half(false);
    const g = ctx.createRadialGradient(x, y, Rr * 0.3, x, y, Rr); g.addColorStop(0, u.rgba(sk.color, 0.03)); g.addColorStop(1, u.rgba(sk.color, 0.3));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, Rr, 0, TAU); ctx.fill();
    ctx.strokeStyle = u.rgba(sk.color2, 0.7); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y, Rr, 0, TAU); ctx.stroke(); gloss(ctx, x, y, Rr);
    ctx.strokeStyle = u.rgba(sk.color, 0.5); ctx.lineWidth = 1.2; ctx.beginPath();
    for (let j = 0; j < 8; j++) { const a = j * TAU / 8 + t * 0.4, L = 5 + 4 * Math.abs(Math.sin(t * 3 + j)); ctx.moveTo(x + Math.cos(a) * (Rr + 3), y + Math.sin(a) * (Rr + 3)); ctx.lineTo(x + Math.cos(a) * (Rr + 3 + L), y + Math.sin(a) * (Rr + 3 + L)); }
    ctx.stroke();
    half(true);
  };

  // nebulosa: nuvens de cor dentro da bolha, estrelas piscando e um nucleo claro
  A.nebula = (ctx, x, y, Rr, sk, t, u) => {
    inside(ctx, x, y, Rr, () => {
      ctx.fillStyle = 'rgba(10,6,30,0.5)'; ctx.fillRect(x - Rr, y - Rr, Rr * 2, Rr * 2);
      ctx.globalCompositeOperation = 'lighter';
      const mid = u.mix(sk.color, sk.color2, 0.5);
      [[sk.color, 0, 0.55], [sk.color2, 2.1, 0.62], [mid, 4.2, 0.48]].forEach(([c, ph, d], b) => {
        const a = t * 0.25 * (b % 2 ? -1 : 1) + ph, cx = x + Math.cos(a) * Rr * d, cy = y + Math.sin(a) * Rr * d * 0.8;
        for (let j = 0; j < 4; j++) { ctx.fillStyle = u.rgba(c, 0.09); ctx.beginPath(); ctx.arc(cx, cy, Rr * (0.62 - j * 0.13), 0, TAU); ctx.fill(); }
      });
      ctx.globalCompositeOperation = 'source-over';
      for (let j = 0; j < 10; j++) { const px = x + (hash(j, 1) - 0.5) * Rr * 1.8, py = y + (hash(j, 2) - 0.5) * Rr * 1.8, tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 3 + j * 1.7)); ctx.fillStyle = u.rgba('#ffffff', tw); ctx.beginPath(); ctx.arc(px, py, 0.8 + hash(j, 3) * 1.2, 0, TAU); ctx.fill(); }
      const core = ctx.createRadialGradient(x, y, 0, x, y, Rr * 0.35); core.addColorStop(0, 'rgba(255,255,255,0.7)'); core.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = core; ctx.beginPath(); ctx.arc(x, y, Rr * 0.35, 0, TAU); ctx.fill();
    });
    rim(ctx, x, y, Rr, sk.color, 2.2); gloss(ctx, x, y, Rr);
  };

  const baseAegis = R.drawAegis;
  R.drawAegis = function (ctx, x, y, br, sk, t, Tl) {
    const f = sk && A[sk.style];
    if (!f) return baseAegis.apply(this, arguments);
    const Rr = br * 2.05 * (1 + 0.025 * Math.sin(t * 3.2)), blink = Tl != null && Tl < 3 ? (Math.floor(t * 7) % 2 ? 1 : 0.35) : 1;
    ctx.save(); ctx.globalAlpha *= blink; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    try { f(ctx, x, y, Rr, sk, t, U()); } catch (_) { /* nunca derruba o quadro */ }
    ctx.restore();
  };
})();
