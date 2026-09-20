/* =====================================================================
   Bolas v5: desenho por família. Registrado em HR.Render:
     PATTERNS[p](ctx, r, skin, t, rot, vy)  → dentro do círculo (recortado)
     SHAPES[s](ctx, r, skin, t, rot, vy)    → corpo que não é bola (estrela, buraco negro, OVNI, rosquinha)
     DECOR[d](ctx, r, skin, t, rot, vy)     → enfeite fora do círculo (orelhas, antena, anel)
     glyph(ctx, iconName, x, y, size, color, lineWidth) → desenha um ícone do ORBO Glyphs no canvas
   Tudo em coordenadas locais (centro 0,0), já com a escala/"squash" da bola aplicados.
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const TAU = Math.PI * 2, DEG = Math.PI / 180;
  const R = HR.Render;
  R.PATTERNS = R.PATTERNS || {}; R.SHAPES = R.SHAPES || {}; R.DECOR = R.DECOR || {};
  const P = R.PATTERNS, S = R.SHAPES, D = R.DECOR;
  const rgba = (c, a) => HR.U.rgba(c, a);
  const hsl = (h, s, l, a) => HR.U.hsl(h, s, l, a);
  const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const circle = (ctx, x, y, r, fill) => { ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); };
  const shade = (ctx, r, a) => { const g = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.15, 0, 0, r * 1.05); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.7, 'rgba(0,0,0,' + (a * 0.35).toFixed(2) + ')'); g.addColorStop(1, 'rgba(0,0,0,' + a + ')'); ctx.fillStyle = g; ctx.fillRect(-r, -r, r * 2, r * 2); };

  /* ---------------- ícone do ORBO Glyphs no canvas ---------------- */
  const glyphCache = {};
  function parseGlyph(name) {
    if (glyphCache[name]) return glyphCache[name];
    const src = (HR.ICON && HR.ICON[name]) || '', out = [];
    const attr = (tag, k) => { const m = tag.match(new RegExp('\\s' + k + '="([^"]*)"')); return m ? m[1] : null; };
    (src.match(/<(path|circle|ellipse)\b[^>]*>/g) || []).forEach(tag => {
      const kind = tag.slice(1, tag.indexOf(' ')), fill = /fill="currentColor"/.test(tag), op = attr(tag, 'fill-opacity'), noStroke = /stroke="none"/.test(tag);
      const it = { fill, fillAlpha: op ? +op : 1, stroke: !noStroke };
      if (kind === 'path') it.p = new Path2D(attr(tag, 'd'));
      else {
        const p = new Path2D(), cx = +attr(tag, 'cx'), cy = +attr(tag, 'cy'), tr = attr(tag, 'transform'), rot = tr ? +(tr.match(/rotate\(([-\d.]+)/) || [0, 0])[1] * DEG : 0;
        if (kind === 'circle') p.arc(cx, cy, +attr(tag, 'r'), 0, TAU); else p.ellipse(cx, cy, +attr(tag, 'rx'), +attr(tag, 'ry'), rot, 0, TAU);
        it.p = p;
      }
      out.push(it);
    });
    return (glyphCache[name] = out);
  }
  R.glyph = function (ctx, name, x, y, size, color, lw) {
    const items = parseGlyph(name); if (!items.length) return;
    ctx.save(); ctx.translate(x - size / 2, y - size / 2); ctx.scale(size / 24, size / 24);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = lw || 1.8; ctx.strokeStyle = color;
    items.forEach(it => { if (it.fill) { ctx.fillStyle = rgba(color, it.fillAlpha); ctx.fill(it.p); } if (it.stroke) ctx.stroke(it.p); });
    ctx.restore();
  };

  /* ---------------- esfera: projeção de manchas com rotação ---------------- */
  function spot(ctx, r, lat, lon, rot, size, color, alpha) {
    const l = lon + rot, c = Math.cos(lat), z = c * Math.cos(l);
    if (z <= 0) return;
    const x = r * c * Math.sin(l), y = -r * Math.sin(lat), vis = Math.min(1, z * 3);
    ctx.fillStyle = rgba(color, (alpha == null ? 1 : alpha) * vis);
    ctx.beginPath(); ctx.ellipse(x, y, size * r * Math.max(0.12, z), size * r * (0.55 + 0.45 * Math.abs(c)), 0, 0, TAU); ctx.fill();
  }
  function bands(ctx, r, list, t, wob) {
    list.forEach((b, i) => { ctx.fillStyle = b[1]; ctx.beginPath(); const y0 = b[0] * r, h = (b[2] || 0.12) * r; ctx.moveTo(-r, y0); for (let k = 0; k <= 8; k++) { const x = -r + k * r / 4; ctx.lineTo(x, y0 + Math.sin(k * 1.3 + t * 0.6 + i) * (wob || 0) * r); } ctx.lineTo(r, y0 + h); ctx.lineTo(-r, y0 + h); ctx.fill(); });
  }

  /* ================= PLANETAS ================= */
  // Terra: cada continente e um grupo de manchas [lat, lon, tamanho]
  const EARTH = [
    { c: '#4e9b46', p: [[52, -105, 0.28], [42, -96, 0.24], [61, -118, 0.17], [31, -101, 0.15], [66, -46, 0.15]] },
    { c: '#3f8a3c', p: [[11, -84, 0.10], [1, -62, 0.24], [-16, -58, 0.23], [-32, -63, 0.15], [-45, -70, 0.09]] },
    { c: '#5c9e45', p: [[50, 11, 0.15], [58, 26, 0.13]] },
    { c: '#b79a5e', p: [[23, 16, 0.21], [6, 20, 0.21], [-11, 25, 0.19], [-27, 26, 0.13]] },
    { c: '#4e9b46', p: [[51, 62, 0.28], [45, 92, 0.28], [59, 104, 0.24], [30, 78, 0.19], [63, 132, 0.2]] },
    { c: '#b79a5e', p: [[-25, 134, 0.21], [-20, 119, 0.13]] }
  ];
  const LANDS = [[45, -100, 0.34], [15, -88, 0.16], [-12, -58, 0.28], [-32, -64, 0.16], [72, -40, 0.14], [8, 20, 0.34], [-18, 26, 0.24], [50, 14, 0.2], [48, 85, 0.44], [26, 78, 0.22], [60, 115, 0.3], [-25, 134, 0.22], [35, 138, 0.1], [-75, 0, 0.3], [-75, 120, 0.3], [-75, -120, 0.3]];
  P.planet = function (ctx, r, sk, t) {
    const rot = t * 0.35, pl = sk.pl;
    switch (pl) {
      case 'earth':
        // continentes em grupos de manchas (silhueta mais organica que uma elipse so)
        EARTH.forEach(C => C.p.forEach(L => spot(ctx, r, L[0] * DEG, L[1] * DEG, rot, L[2], C.c, 0.96)));
        // calotas polares
        ctx.fillStyle = 'rgba(240,248,255,0.9)';
        ctx.beginPath(); ctx.ellipse(0, -r * 0.9, r * 0.6, r * 0.2, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, r * 0.92, r * 0.52, r * 0.17, 0, 0, TAU); ctx.fill();
        // nuvens: poucas, finas e mais rapidas que o solo
        for (let i = 0; i < 8; i++) spot(ctx, r, (hash(i) - 0.5) * 2.2, hash(i + 9) * TAU, rot * 1.25, 0.1 + hash(i + 3) * 0.14, '#ffffff', 0.34);
        {
          const atm = ctx.createRadialGradient(0, 0, r * 0.74, 0, 0, r);
          atm.addColorStop(0, 'rgba(130,205,255,0)'); atm.addColorStop(1, 'rgba(150,220,255,0.45)');
          ctx.fillStyle = atm; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
        }
        break;
      case 'mars':
        [[10, 0, 0.3], [-20, 80, 0.26], [20, 170, 0.34], [-5, 250, 0.22], [30, 300, 0.2]].forEach(L => spot(ctx, r, L[0] * DEG, L[1] * DEG, rot, L[2], '#7a2a12', 0.55));
        spot(ctx, r, 80 * DEG, 0, rot, 0.4, '#fff4ea', 0.9); spot(ctx, r, 80 * DEG, 180 * DEG, rot, 0.4, '#fff4ea', 0.9);
        break;
      case 'jupiter': {
        bands(ctx, r, [[-1, '#c9a27a', 0.25], [-0.72, '#f1dcc0', 0.18], [-0.5, '#b8845a', 0.16], [-0.3, '#f6e6cf', 0.2], [-0.05, '#c89266', 0.14], [0.12, '#f3dfc4', 0.2], [0.34, '#a8744d', 0.16], [0.52, '#eed7b7', 0.2], [0.74, '#c19a70', 0.3]], t, 0.02);
        spot(ctx, r, -22 * DEG, 0, rot, 0.2, '#c4502b', 0.95); spot(ctx, r, -22 * DEG, 0, rot, 0.12, '#e8875f', 0.9);
        break;
      }
      case 'venus':
        for (let k = 0; k < 6; k++) { ctx.strokeStyle = rgba(k % 2 ? '#fff3c8' : '#d9a760', 0.35); ctx.lineWidth = r * 0.14; ctx.beginPath(); for (let i = 0; i <= 12; i++) { const x = -r + i * r / 6, y = -r * 0.8 + k * r * 0.32 + Math.sin(i * 0.9 + t * 0.4 + k) * r * 0.08; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
        break;
      case 'mercury':
        // muita cratera pequena, com borda iluminada
        for (let i = 0; i < 20; i++) {
          const x = (hash(i + 1) - 0.5) * r * 1.5, y = (hash(i + 20) - 0.5) * r * 1.5, rr = r * (0.07 + hash(i + 5) * 0.14);
          circle(ctx, x, y, rr, 'rgba(48,42,36,0.55)');
          circle(ctx, x - rr * 0.2, y - rr * 0.22, rr * 0.7, 'rgba(255,255,255,0.22)');
          circle(ctx, x + rr * 0.08, y + rr * 0.1, rr * 0.4, 'rgba(30,26,22,0.4)');
        }
        break;
      case 'ceres':
        // poucas manchas largas e os dois pontos brancos da cratera Occator
        for (let i = 0; i < 9; i++) spot(ctx, r, (hash(i + 1) - 0.5) * 2.6, hash(i + 20) * TAU, rot * 0.6, 0.1 + hash(i + 5) * 0.12, '#443f3a', 0.6);
        spot(ctx, r, 20 * DEG, 40 * DEG, rot * 0.6, 0.08, '#ffffff', 1);
        spot(ctx, r, 24 * DEG, 52 * DEG, rot * 0.6, 0.045, '#ffffff', 1);
        break;
      case 'uranus':
        bands(ctx, r, [[-0.4, 'rgba(200,245,255,0.35)', 0.1], [0.1, 'rgba(120,200,220,0.25)', 0.12], [0.5, 'rgba(210,250,255,0.3)', 0.1]], t, 0.01);
        break;
      case 'neptune':
        bands(ctx, r, [[-0.6, 'rgba(90,140,255,0.35)', 0.12], [-0.1, 'rgba(40,70,200,0.35)', 0.14], [0.45, 'rgba(110,160,255,0.3)', 0.12]], t, 0.02);
        spot(ctx, r, -20 * DEG, 30 * DEG, rot, 0.16, '#0b1d6b', 0.9); spot(ctx, r, -12 * DEG, 40 * DEG, rot, 0.1, '#ffffff', 0.7); spot(ctx, r, 25 * DEG, 200 * DEG, rot, 0.12, '#ffffff', 0.6);
        break;
      case 'pluto':
        spot(ctx, r, 5 * DEG, 20 * DEG, rot, 0.22, '#fff1e0', 0.95); spot(ctx, r, 5 * DEG, 45 * DEG, rot, 0.22, '#fff1e0', 0.95); spot(ctx, r, -15 * DEG, 32 * DEG, rot, 0.2, '#fff1e0', 0.95);
        [[-10, 150, 0.3], [20, 220, 0.25], [-30, 290, 0.2]].forEach(L => spot(ctx, r, L[0] * DEG, L[1] * DEG, rot, L[2], '#5e3a24', 0.6));
        break;
      case 'io':
        for (let i = 0; i < 14; i++) spot(ctx, r, (hash(i + 3) - 0.5) * 2.6, hash(i + 40) * TAU, rot, 0.05 + hash(i) * 0.1, i % 3 ? '#e2791d' : '#2b1a0a', 0.8);
        break;
      case 'europa':
        ctx.save(); ctx.rotate(rot * 0.2); ctx.lineCap = 'round';
        for (let i = 0; i < 6; i++) {
          const y = (hash(i) - 0.5) * r * 1.5, a = (hash(i + 3) - 0.5) * 0.5, len = r * (0.7 + hash(i + 6) * 0.7);
          ctx.strokeStyle = 'rgba(158,92,58,' + (0.3 + hash(i + 8) * 0.25).toFixed(2) + ')';
          ctx.lineWidth = r * (0.016 + hash(i + 4) * 0.018);
          ctx.beginPath(); ctx.moveTo(-len, y - a * len); ctx.quadraticCurveTo(0, y + a * r * 0.3, len, y + a * len); ctx.stroke();
        }
        ctx.restore();
        break;
      case 'titan':
        bands(ctx, r, [[-0.9, 'rgba(255,220,150,0.3)', 0.3], [-0.2, 'rgba(210,140,60,0.25)', 0.25], [0.4, 'rgba(255,200,120,0.3)', 0.3]], t, 0.03);
        { const hz = ctx.createRadialGradient(0, 0, r * 0.6, 0, 0, r); hz.addColorStop(0, 'rgba(255,200,120,0)'); hz.addColorStop(1, 'rgba(255,190,110,0.6)'); ctx.fillStyle = hz; ctx.fillRect(-r, -r, r * 2, r * 2); }
        break;
      case 'ganymede':
        for (let i = 0; i < 8; i++) spot(ctx, r, (hash(i + 11) - 0.5) * 2.2, hash(i + 70) * TAU, rot * 0.7, 0.15 + hash(i + 2) * 0.2, i % 2 ? '#d8cbb8' : '#5b4c3e', 0.55);
        break;
    }
    shade(ctx, r, 0.55);
  };
  D.planetRing = function (ctx, r, sk) {
    ctx.save(); ctx.rotate(sk.ringTilt || -0.3);
    ctx.strokeStyle = rgba(sk.ringColor || '#dff8ff', 0.5); ctx.lineWidth = r * 0.07;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.45, r * 0.32, 0, Math.PI * 1.02, Math.PI * 1.98, true); ctx.stroke();
    ctx.restore();
  };

  /* ================= ESTRELAS (forma de estrela) ================= */
  function starPath(ctx, n, R1, R2, rot) { ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n - Math.PI / 2, rr = i % 2 ? R2 : R1; const x = Math.cos(a) * rr, y = Math.sin(a) * rr; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); }
  function starBody(ctx, n, R1, R2, rot, sk) {
    starPath(ctx, n, R1, R2, rot);
    const g = ctx.createRadialGradient(-R1 * 0.2, -R1 * 0.25, R1 * 0.05, 0, 0, R1); g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, sk.base); g.addColorStop(1, sk.dark);
    ctx.fillStyle = g; ctx.fill(); ctx.lineJoin = 'round'; ctx.strokeStyle = rgba('#ffffff', 0.55); ctx.lineWidth = Math.max(1, R1 * 0.06); ctx.stroke();
  }
  S.star = function (ctx, r, sk, t) {
    const st = sk.st || 'classic', n = sk.points || 5, pulse = 1 + (st === 'betelgeuse' ? 0.1 : 0.05) * Math.sin(t * (st === 'betelgeuse' ? 1.3 : 3.2));
    const cg = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 2.3); cg.addColorStop(0, rgba(sk.glow, 0.55)); cg.addColorStop(0.45, rgba(sk.glow, 0.16)); cg.addColorStop(1, rgba(sk.glow, 0));
    ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, r * 2.3, 0, TAU); ctx.fill();
    ctx.lineCap = 'round';
    if (st === 'sirius' || st === 'whitedwarf' || st === 'bluegiant') {
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + t * 0.15, L = r * (i % 2 ? 1.5 : 2.3); const g = ctx.createLinearGradient(0, 0, Math.cos(a) * L, Math.sin(a) * L); g.addColorStop(0, rgba('#ffffff', 0.8)); g.addColorStop(1, rgba(sk.glow, 0)); ctx.strokeStyle = g; ctx.lineWidth = r * 0.08; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * L, Math.sin(a) * L); ctx.stroke(); }
    }
    if (st === 'pulsar') {
      const a = t * 4.5; for (const s of [0, Math.PI]) { const g = ctx.createLinearGradient(0, 0, Math.cos(a + s) * r * 3, Math.sin(a + s) * r * 3); g.addColorStop(0, rgba('#ffffff', 0.85)); g.addColorStop(1, rgba(sk.glow, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r * 3, a + s - 0.12, a + s + 0.12); ctx.closePath(); ctx.fill(); }
    }
    if (st === 'magnetar') {
      ctx.strokeStyle = rgba(sk.glow, 0.6); ctx.lineWidth = r * 0.05;
      for (let i = 0; i < 4; i++) { const sc = 1 + i * 0.35 + 0.1 * Math.sin(t * 2 + i); ctx.beginPath(); ctx.ellipse(r * 0.9 * sc, 0, r * 0.9 * sc, r * 0.5 * sc, 0, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(-r * 0.9 * sc, 0, r * 0.9 * sc, r * 0.5 * sc, 0, 0, TAU); ctx.stroke(); }
    }
    if (st === 'nova') { const k = (t * 0.6) % 1; ctx.strokeStyle = rgba(sk.glow, 0.7 * (1 - k)); ctx.lineWidth = r * 0.12 * (1 - k); ctx.beginPath(); ctx.arc(0, 0, r * (1 + k * 1.5), 0, TAU); ctx.stroke(); }
    if (st === 'binary') {
      const a = t * 2.4;
      [[1, sk.base, sk.dark], [-1, sk.base2 || '#ffd28a', sk.dark2 || '#ff7a1a']].forEach(([sg, b, d]) => { ctx.save(); ctx.translate(Math.cos(a) * r * 0.45 * sg, Math.sin(a) * r * 0.25 * sg); starBody(ctx, 4, r * 0.62, r * 0.26, t * 0.8 * sg, { base: b, dark: d }); ctx.restore(); });
      return;
    }
    if (st === 'neutron') {
      for (let i = 0; i < 3; i++) { ctx.strokeStyle = rgba(sk.glow, 0.55 - i * 0.15); ctx.lineWidth = r * 0.06; ctx.beginPath(); ctx.arc(0, 0, r * (0.7 + i * 0.28) + Math.sin(t * 5 + i) * r * 0.03, 0, TAU); ctx.stroke(); }
      starBody(ctx, 4, r * 0.8, r * 0.28, t * 1.5, sk); return;
    }
    const rot = t * (st === 'pulsar' ? 1.2 : 0.35);
    if (st === 'whitedwarf') starBody(ctx, 4, r * 1.0 * pulse, r * 0.34 * pulse, rot, sk);
    else if (st === 'betelgeuse') { starPath(ctx, 7, r * 1.15 * pulse, r * 0.78 * pulse, rot); const g = ctx.createRadialGradient(0, 0, r * 0.1, 0, 0, r * 1.15); g.addColorStop(0, '#ffe2b8'); g.addColorStop(0.4, sk.base); g.addColorStop(1, sk.dark); ctx.fillStyle = g; ctx.fill(); }
    else starBody(ctx, n, r * 1.18 * pulse, r * 0.52 * pulse, rot, sk);
    circle(ctx, 0, 0, r * 0.22, rgba('#ffffff', 0.85));
  };

  /* ================= NEBULOSAS ================= */
  P.nebula = function (ctx, r, sk, t) {
    const c = sk.c || ['#ff5ecf', '#4cf0ff', '#8f6bff'], nb = sk.nb;
    for (let i = 0; i < 6; i++) {
      const a = hash(i + (sk.seed || 0)) * TAU + t * 0.12 * (i % 2 ? 1 : -1), d = r * (0.15 + hash(i + 4) * 0.55), rr = r * (0.45 + hash(i + 2) * 0.45);
      const x = Math.cos(a) * d, y = Math.sin(a) * d, g = ctx.createRadialGradient(x, y, 0, x, y, rr);
      g.addColorStop(0, rgba(c[i % c.length], 0.55)); g.addColorStop(1, rgba(c[i % c.length], 0)); ctx.fillStyle = g; ctx.fillRect(-r, -r, r * 2, r * 2);
    }
    ctx.lineCap = 'round';
    switch (nb) {
      case 'helix': case 'ring':
        for (let i = 0; i < 2; i++) { ctx.strokeStyle = rgba(i ? c[0] : c[1], 0.7); ctx.lineWidth = r * (i ? 0.22 : 0.12); ctx.beginPath(); ctx.ellipse(0, 0, r * (0.55 + i * 0.12), r * (nb === 'ring' ? 0.45 : 0.55) + i * r * 0.1, t * 0.1, 0, TAU); ctx.stroke(); }
        circle(ctx, 0, 0, r * 0.08, '#ffffff'); break;
      case 'crab':
        ctx.strokeStyle = rgba(c[0], 0.7); ctx.lineWidth = r * 0.04;
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + Math.sin(t + i) * 0.1; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.15, Math.sin(a) * r * 0.15); ctx.quadraticCurveTo(Math.cos(a + 0.4) * r * 0.5, Math.sin(a + 0.4) * r * 0.5, Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95); ctx.stroke(); }
        circle(ctx, 0, 0, r * 0.12, rgba('#bfe8ff', 0.9)); break;
      case 'pillars':
        ctx.fillStyle = rgba('#2a1a10', 0.75);
        [[-0.45, 0.18, 0.9], [0, 0.15, 0.6], [0.4, 0.14, 0.75]].forEach(([x, w, h]) => { ctx.beginPath(); ctx.moveTo((x - w) * r, r); ctx.quadraticCurveTo((x - w * 0.6) * r, (1 - h) * r, x * r, (1 - h - 0.1) * r); ctx.quadraticCurveTo((x + w * 0.6) * r, (1 - h) * r, (x + w) * r, r); ctx.fill(); });
        break;
      case 'horsehead':
        ctx.fillStyle = rgba('#12060a', 0.85); ctx.beginPath(); ctx.moveTo(-r * 0.1, r); ctx.lineTo(-r * 0.15, r * 0.2); ctx.quadraticCurveTo(-r * 0.3, -r * 0.2, -r * 0.05, -r * 0.35); ctx.quadraticCurveTo(r * 0.25, -r * 0.4, r * 0.35, -r * 0.1); ctx.lineTo(r * 0.15, 0); ctx.quadraticCurveTo(r * 0.2, r * 0.35, r * 0.45, r); ctx.fill();
        break;
      case 'butterfly': case 'catseye':
        ctx.strokeStyle = rgba(c[2], 0.65); ctx.lineWidth = r * 0.05;
        for (let i = 0; i < (nb === 'catseye' ? 4 : 2); i++) { ctx.beginPath(); ctx.ellipse(0, 0, r * (nb === 'butterfly' ? 0.85 : 0.3 + i * 0.16), r * (nb === 'butterfly' ? 0.28 : 0.22 + i * 0.12), nb === 'butterfly' ? 0.1 + i * 0.3 : t * 0.2 + i, 0, TAU); ctx.stroke(); }
        circle(ctx, 0, 0, r * 0.09, '#ffffff'); break;
    }
    for (let i = 0; i < 14; i++) { const x = (hash(i + 30) - 0.5) * 1.8 * r, y = (hash(i + 60) - 0.5) * 1.8 * r; circle(ctx, x, y, r * (0.02 + hash(i) * 0.03), rgba('#ffffff', 0.4 + 0.5 * Math.abs(Math.sin(t * 2 + i)))); }
  };

  /* ================= BURACOS NEGROS (forma própria) ================= */
  S.blackhole = function (ctx, r, sk, t) {
    const dc = sk.disk || ['#fff6d8', '#ffb347', '#ff5e3d'], big = sk.bh === 'ton618', tilt = sk.bh === 'm87' ? 0 : -0.32;
    const RX = r * (big ? 2.05 : 1.8), RY = r * (sk.bh === 'm87' ? 1.2 : 0.5);
    const glow = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r * (big ? 2.8 : 2.2)); glow.addColorStop(0, rgba(dc[1], 0.35)); glow.addColorStop(1, rgba(dc[1], 0)); ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, r * (big ? 2.8 : 2.2), 0, TAU); ctx.fill();
    if (big) { for (const s of [-1, 1]) { const g = ctx.createLinearGradient(0, 0, 0, s * r * 3.2); g.addColorStop(0, rgba('#bfe8ff', 0.5)); g.addColorStop(1, rgba('#bfe8ff', 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-r * 0.12, 0); ctx.lineTo(r * 0.12, 0); ctx.lineTo(r * 0.3, s * r * 3.2); ctx.lineTo(-r * 0.3, s * r * 3.2); ctx.fill(); } }
    const disc = front => {
      ctx.save(); ctx.rotate(tilt);
      const g = ctx.createLinearGradient(-RX, 0, RX, 0); g.addColorStop(0, rgba(dc[0], 0.95)); g.addColorStop(0.4, rgba(dc[1], 0.9)); g.addColorStop(1, rgba(dc[2], 0.5));
      const a0 = front ? 0 : Math.PI, a1 = front ? Math.PI : TAU;
      ctx.strokeStyle = rgba(dc[1], 0.25); ctx.lineWidth = r * (big ? 0.7 : 0.55); ctx.beginPath(); ctx.ellipse(0, 0, RX * 0.92, RY * 0.92, 0, a0, a1); ctx.stroke();
      ctx.strokeStyle = g; ctx.lineWidth = r * (big ? 0.34 : 0.26); ctx.beginPath(); ctx.ellipse(0, 0, RX, RY, 0, a0, a1); ctx.stroke();
      for (let i = 0; i < (big ? 7 : 4); i++) { const an = t * (1.6 + i * 0.07) + i * TAU / (big ? 7 : 4), sn = Math.sin(an); if (front ? sn < 0 : sn >= 0) continue; circle(ctx, Math.cos(an) * RX * 0.96, sn * RY * 0.96, r * 0.07, rgba('#ffffff', 0.6 + 0.4 * Math.max(0, -Math.cos(an)))); }
      ctx.restore();
    };
    if (sk.bh !== 'm87') disc(false);
    // sombra + anel de fótons + lente (arco do disco "dobrado" por cima)
    circle(ctx, 0, 0, r * 0.66, '#010108');
    ctx.strokeStyle = rgba('#ffffff', 0.9); ctx.lineWidth = r * 0.05; ctx.beginPath(); ctx.arc(0, 0, r * 0.7, 0, TAU); ctx.stroke();
    ctx.strokeStyle = rgba(dc[0], 0.45); ctx.lineWidth = r * 0.16; ctx.beginPath(); ctx.arc(0, 0, r * 0.76, 0, TAU); ctx.stroke();
    if (sk.bh === 'm87') { const g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, rgba(dc[2], 0.5)); g.addColorStop(1, rgba(dc[0], 1)); ctx.strokeStyle = g; ctx.lineWidth = r * 0.36; ctx.beginPath(); ctx.arc(0, 0, r * 0.95, 0, TAU); ctx.stroke(); }
    else { ctx.save(); ctx.rotate(tilt); ctx.strokeStyle = rgba(dc[1], 0.55); ctx.lineWidth = r * 0.14; ctx.beginPath(); ctx.ellipse(0, -r * 0.1, r * 0.95, r * 0.85, 0, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke(); ctx.restore(); disc(true); }
    if (sk.bh === 'cygnus') { const a = t * 0.6; const sx = Math.cos(a) * r * 2.1, sy = Math.sin(a) * r * 0.6; circle(ctx, sx, sy, r * 0.28, '#bfe0ff'); ctx.strokeStyle = rgba('#bfe0ff', 0.4); ctx.lineWidth = r * 0.08; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx * 0.5, sy - r * 0.6, 0, 0); ctx.stroke(); }
    if (big) for (let i = 0; i < 12; i++) { const k = (t * 0.25 + hash(i)) % 1, rr = r * (2.6 - k * 1.9), an = hash(i + 5) * TAU + k * 3; circle(ctx, Math.cos(an) * rr, Math.sin(an) * rr * 0.6, r * 0.04, rgba('#fff2d0', k)); }
  };

  /* ================= GEMAS ================= */
  P.facets = function (ctx, r, sk, t) {
    const n = 8, T = r * 0.42, c = sk.facet || '#ffffff';
    ctx.lineJoin = 'round';
    for (let i = 0; i < n; i++) {
      const a0 = i / n * TAU + Math.PI / n, a1 = (i + 1) / n * TAU + Math.PI / n;
      ctx.fillStyle = rgba(i % 2 ? '#ffffff' : '#000000', i % 2 ? 0.14 : 0.16);
      ctx.beginPath(); ctx.moveTo(Math.cos(a0) * T, Math.sin(a0) * T); ctx.lineTo(Math.cos(a0) * r, Math.sin(a0) * r); ctx.lineTo(Math.cos(a1) * r, Math.sin(a1) * r); ctx.lineTo(Math.cos(a1) * T, Math.sin(a1) * T); ctx.fill();
    }
    ctx.strokeStyle = rgba(c, 0.55); ctx.lineWidth = Math.max(0.8, r * 0.04);
    ctx.beginPath(); for (let i = 0; i <= n; i++) { const a = i / n * TAU + Math.PI / n; i ? ctx.lineTo(Math.cos(a) * T, Math.sin(a) * T) : ctx.moveTo(Math.cos(a) * T, Math.sin(a) * T); } ctx.stroke();
    for (let i = 0; i < n; i++) { const a = i / n * TAU + Math.PI / n; ctx.beginPath(); ctx.moveTo(Math.cos(a) * T, Math.sin(a) * T); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.stroke(); }
    if (sk.opal) for (let i = 0; i < 12; i++) circle(ctx, (hash(i) - 0.5) * r * 1.6, (hash(i + 8) - 0.5) * r * 1.6, r * 0.12, hsl((t * 60 + i * 30) % 360, 90, 70, 0.35));
    const k = (t * 0.5) % 2; if (k < 1) { const x = -r + k * r * 2; ctx.save(); ctx.translate(x, -r * 0.2 + k * r * 0.3); ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.moveTo(0, -r * 0.22); ctx.quadraticCurveTo(r * 0.03, -r * 0.03, r * 0.22, 0); ctx.quadraticCurveTo(r * 0.03, r * 0.03, 0, r * 0.22); ctx.quadraticCurveTo(-r * 0.03, r * 0.03, -r * 0.22, 0); ctx.quadraticCurveTo(-r * 0.03, -r * 0.03, 0, -r * 0.22); ctx.fill(); ctx.restore(); }
  };

  /* ================= ESPORTES ================= */
  P.sport = function (ctx, r, sk, t, rot) {
    ctx.lineCap = 'round';
    switch (sk.sp) {
      case 'basketball':
        ctx.rotate(rot * 0.4); ctx.strokeStyle = '#2a1206'; ctx.lineWidth = r * 0.07;
        ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.stroke();
        ctx.beginPath(); ctx.arc(-r * 1.25, 0, r * 0.95, -0.9, 0.9); ctx.stroke(); ctx.beginPath(); ctx.arc(r * 1.25, 0, r * 0.95, Math.PI - 0.9, Math.PI + 0.9); ctx.stroke();
        break;
      case 'tennis':
        ctx.rotate(rot * 0.3);
        for (let i = 0; i < 30; i++) circle(ctx, (hash(i) - 0.5) * 2 * r, (hash(i + 3) - 0.5) * 2 * r, r * 0.05, 'rgba(255,255,255,0.12)');
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = r * 0.1;
        ctx.beginPath(); ctx.arc(-r * 1.05, 0, r * 0.85, -1.1, 1.1); ctx.stroke(); ctx.beginPath(); ctx.arc(r * 1.05, 0, r * 0.85, Math.PI - 1.1, Math.PI + 1.1); ctx.stroke();
        break;
      case 'volleyball':
        ctx.rotate(rot * 0.3);
        ['#ffd93d', '#2e6bd6', '#ffffff'].forEach((col, i) => { ctx.save(); ctx.rotate(i * TAU / 3); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(r * 0.7, -r * 0.5, r * 1.1, 0); ctx.quadraticCurveTo(r * 0.7, r * 0.2, 0, 0); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = r * 0.04; ctx.stroke(); ctx.restore(); });
        break;
      case 'baseball':
        ctx.rotate(rot * 0.3); ctx.strokeStyle = '#d62839'; ctx.lineWidth = r * 0.05;
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(s * r * 1.1, 0, r * 0.8, s > 0 ? Math.PI - 1 : -1, s > 0 ? Math.PI + 1 : 1); ctx.stroke(); for (let k = -4; k <= 4; k++) { const a = (s > 0 ? Math.PI : 0) + k * 0.22, x = s * r * 1.1 + Math.cos(a) * r * 0.8, y = Math.sin(a) * r * 0.8; ctx.beginPath(); ctx.moveTo(x - r * 0.06, y - r * 0.04); ctx.lineTo(x + r * 0.06, y + r * 0.04); ctx.stroke(); } }
        break;
      case 'bowling':
        ctx.rotate(rot * 0.5);
        for (let i = 0; i < 3; i++) { ctx.strokeStyle = rgba(sk.glow, 0.25); ctx.lineWidth = r * 0.18; ctx.beginPath(); ctx.arc(0, 0, r * (0.3 + i * 0.28), i, i + 2.2); ctx.stroke(); }
        [[-0.2, -0.35], [0.15, -0.45], [-0.02, -0.1]].forEach(([x, y]) => { circle(ctx, x * r, y * r, r * 0.1, '#050508'); circle(ctx, x * r - r * 0.02, y * r - r * 0.02, r * 0.1, 'rgba(255,255,255,0.08)'); });
        break;
      case 'golf':
        for (let row = -4; row <= 4; row++) for (let col = -4; col <= 4; col++) { const x = (col + (row % 2 ? 0.5 : 0) + ((t * 0.3) % 1)) * r * 0.25, y = row * r * 0.22; if (x * x + y * y > r * r) continue; circle(ctx, x, y, r * 0.06, 'rgba(120,130,150,0.35)'); }
        break;
    }
  };

  /* ================= CRIATURAS (rosto) ================= */
  function eyes(ctx, r, vy, o) {
    const look = HR.U.clamp(vy / 1500, -1, 1) * r * 0.08;
    [-1, 1].forEach(s => {
      const x = s * r * (o.dx || 0.32), y = (o.y || -0.12) * r + look;
      if (o.white) { ctx.fillStyle = o.white; ctx.beginPath(); ctx.ellipse(x, y, r * o.w, r * o.h, 0, 0, TAU); ctx.fill(); }
      ctx.fillStyle = o.pupil || '#0b0b12'; ctx.beginPath(); ctx.ellipse(x + s * (o.cross || 0), y, r * (o.pw || o.w * 0.5), r * (o.ph || o.h * 0.6), o.tilt ? s * o.tilt : 0, 0, TAU); ctx.fill();
      circle(ctx, x - r * 0.04, y - r * 0.05, r * 0.045, 'rgba(255,255,255,0.9)');
    });
  }
  P.face = function (ctx, r, sk, t, rot, vy) {
    ctx.lineCap = 'round';
    const blink = (t % 3.4) < 0.12;
    switch (sk.fc) {
      case 'smile':
        if (!blink) eyes(ctx, r, vy, { w: 0.1, h: 0.16, pw: 0.1, ph: 0.16 }); else { ctx.strokeStyle = '#3b2a00'; ctx.lineWidth = r * 0.06; [-1, 1].forEach(s => { ctx.beginPath(); ctx.moveTo(s * r * 0.42, -r * 0.12); ctx.lineTo(s * r * 0.22, -r * 0.12); ctx.stroke(); }); }
        ctx.strokeStyle = '#3b2a00'; ctx.lineWidth = r * 0.08; ctx.beginPath(); ctx.arc(0, r * 0.05, r * 0.42, 0.35, Math.PI - 0.35); ctx.stroke();
        circle(ctx, -r * 0.55, r * 0.2, r * 0.12, 'rgba(255,120,120,0.35)'); circle(ctx, r * 0.55, r * 0.2, r * 0.12, 'rgba(255,120,120,0.35)');
        break;
      case 'cat':
        eyes(ctx, r, vy, { white: '#c8ff9a', w: 0.16, h: 0.12, pw: 0.04, ph: 0.11, dx: 0.33 });
        circle(ctx, 0, r * 0.14, r * 0.07, '#ff8fb0');
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = r * 0.025; [-1, 1].forEach(s => { for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(s * r * 0.2, r * 0.2 + k * r * 0.06); ctx.lineTo(s * r * 0.8, r * 0.14 + k * r * 0.14); ctx.stroke(); } });
        break;
      case 'panda':
        [-1, 1].forEach(s => { ctx.fillStyle = '#15151c'; ctx.beginPath(); ctx.ellipse(s * r * 0.34, -r * 0.05, r * 0.2, r * 0.26, s * 0.5, 0, TAU); ctx.fill(); });
        eyes(ctx, r, vy, { white: '#ffffff', w: 0.07, h: 0.08, pw: 0.045, ph: 0.055, dx: 0.32, y: -0.08 });
        ctx.fillStyle = '#15151c'; ctx.beginPath(); ctx.ellipse(0, r * 0.22, r * 0.09, r * 0.06, 0, 0, TAU); ctx.fill();
        break;
      case 'alien':
        [-1, 1].forEach(s => { ctx.fillStyle = '#050810'; ctx.beginPath(); ctx.ellipse(s * r * 0.3, -r * 0.02 + HR.U.clamp(vy / 1500, -1, 1) * r * 0.05, r * 0.24, r * 0.14, s * 0.55, 0, TAU); ctx.fill(); circle(ctx, s * r * 0.24, -r * 0.08, r * 0.05, 'rgba(255,255,255,0.8)'); });
        ctx.strokeStyle = 'rgba(0,40,0,0.6)'; ctx.lineWidth = r * 0.04; ctx.beginPath(); ctx.arc(0, r * 0.35, r * 0.12, 0.3, Math.PI - 0.3); ctx.stroke();
        break;
      case 'robot': {
        ctx.fillStyle = '#101826'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-r * 0.62, -r * 0.3, r * 1.24, r * 0.46, r * 0.18) : ctx.rect(-r * 0.62, -r * 0.3, r * 1.24, r * 0.46); ctx.fill();
        const on = (t % 2.2) > 0.1; [-1, 1].forEach(s => circle(ctx, s * r * 0.28 + HR.U.clamp(vy / 1500, -1, 1) * r * 0.05, -r * 0.07, r * 0.11, on ? '#4cf0ff' : '#0b3b44'));
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = r * 0.04; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * r * 0.14, r * 0.34); ctx.lineTo(k * r * 0.14, r * 0.46); ctx.stroke(); }
        [[-0.72, 0], [0.72, 0], [0, 0.72]].forEach(([x, y]) => circle(ctx, x * r, y * r, r * 0.06, 'rgba(0,0,0,0.3)'));
        break;
      }
      case 'slime': {
        const w = Math.sin(t * 3) * 0.06;
        ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.45, r * (0.3 + w), r * 0.14, -0.5, 0, TAU); ctx.fill();
        eyes(ctx, r, vy, { w: 0.09, h: 0.13, pw: 0.09, ph: 0.13, y: -0.02 });
        circle(ctx, r * 0.1, r * 0.72 + Math.sin(t * 2) * r * 0.08, r * 0.1, 'rgba(160,255,140,0.6)');
        break;
      }
      case 'owl':
        [-1, 1].forEach(s => { circle(ctx, s * r * 0.32, -r * 0.1, r * 0.3, '#f3e3c2'); });
        eyes(ctx, r, vy, { white: '#ffcf4a', w: 0.2, h: 0.2, pw: 0.1, ph: 0.1, dx: 0.32, y: -0.1 });
        ctx.fillStyle = '#e28a1d'; ctx.beginPath(); ctx.moveTo(-r * 0.08, r * 0.12); ctx.lineTo(r * 0.08, r * 0.12); ctx.lineTo(0, r * 0.32); ctx.fill();
        ctx.strokeStyle = 'rgba(80,50,20,0.4)'; ctx.lineWidth = r * 0.04; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc((k - 1.5) * r * 0.28, r * 0.62, r * 0.12, 0.2, Math.PI - 0.2); ctx.stroke(); }
        break;
      case 'frog':
        ctx.strokeStyle = '#123d12'; ctx.lineWidth = r * 0.06; ctx.beginPath(); ctx.arc(0, r * 0.05, r * 0.5, 0.3, Math.PI - 0.3); ctx.stroke();
        [[-0.4, 0.45, 0.08], [0.5, 0.35, 0.06], [0.1, 0.65, 0.07]].forEach(([x, y, s]) => circle(ctx, x * r, y * r, s * r, 'rgba(20,80,20,0.4)'));
        circle(ctx, -r * 0.55, r * 0.2, r * 0.1, 'rgba(255,150,150,0.3)'); circle(ctx, r * 0.55, r * 0.2, r * 0.1, 'rgba(255,150,150,0.3)');
        break;
    }
  };
  // anel: por fora da bola aparece inteiro; por cima da bola só a metade da frente
  D.planetRing = function (ctx, r, sk) {
    const tilt = sk.ringTilt == null ? -0.3 : sk.ringTilt, w = (sk.ringW || 0.15) * r;
    const col = sk.ringColor || sk.glow || '#ffe1a8', a = sk.ringA == null ? 0.85 : sk.ringA;
    const rx = r * (sk.ringR || 1.45), ry = rx * (sk.ringFlat == null ? 0.29 : sk.ringFlat);
    ctx.save(); ctx.rotate(tilt);
    ctx.save();
    ctx.beginPath(); ctx.rect(-r * 3, -r * 3, r * 6, r * 6); ctx.arc(0, 0, r * 1.01, 0, TAU);
    ctx.clip('evenodd');
    ctx.strokeStyle = rgba(col, a); ctx.lineWidth = w;
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = rgba(sk.dark || '#a0612c', a * 0.5); ctx.lineWidth = w * 0.3;
    ctx.beginPath(); ctx.ellipse(0, 0, rx * 0.9, ry * 0.9, 0, 0, TAU); ctx.stroke();
    ctx.restore();
    if (sk.ringFront !== false) {
      ctx.strokeStyle = rgba(col, a); ctx.lineWidth = w;
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0.15, Math.PI - 0.15); ctx.stroke();
    }
    ctx.restore();
  };
  D.ears = function (ctx, r, sk) {
    const col = sk.earColor || sk.dark;
    if (sk.ears === 'cat') [-1, 1].forEach(s => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(s * r * 0.28, -r * 0.88); ctx.lineTo(s * r * 0.72, -r * 1.3); ctx.lineTo(s * r * 0.82, -r * 0.55); ctx.fill(); ctx.fillStyle = '#ff9fbf'; ctx.beginPath(); ctx.moveTo(s * r * 0.4, -r * 0.84); ctx.lineTo(s * r * 0.68, -r * 1.12); ctx.lineTo(s * r * 0.74, -r * 0.66); ctx.fill(); });
    else if (sk.ears === 'round') [-1, 1].forEach(s => circle(ctx, s * r * 0.68, -r * 0.72, r * 0.26, col));
    else if (sk.ears === 'tufts') [-1, 1].forEach(s => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(s * r * 0.3, -r * 0.9); ctx.quadraticCurveTo(s * r * 0.9, -r * 1.35, s * r * 0.85, -r * 0.6); ctx.fill(); });
    else if (sk.ears === 'antennae') [-1, 1].forEach(s => { ctx.strokeStyle = col; ctx.lineWidth = r * 0.07; ctx.beginPath(); ctx.moveTo(s * r * 0.25, -r * 0.9); ctx.quadraticCurveTo(s * r * 0.4, -r * 1.4, s * r * 0.55, -r * 1.35); ctx.stroke(); circle(ctx, s * r * 0.57, -r * 1.36, r * 0.12, sk.glow); });
    else if (sk.ears === 'antenna') { ctx.strokeStyle = '#9aa6c9'; ctx.lineWidth = r * 0.07; ctx.beginPath(); ctx.moveTo(0, -r * 0.95); ctx.lineTo(0, -r * 1.35); ctx.stroke(); circle(ctx, 0, -r * 1.4, r * 0.12, '#ff5e7e'); }
    else if (sk.ears === 'frog') [-1, 1].forEach(s => { circle(ctx, s * r * 0.45, -r * 0.8, r * 0.3, sk.base); circle(ctx, s * r * 0.45, -r * 0.82, r * 0.19, '#ffffff'); circle(ctx, s * r * 0.45, -r * 0.8, r * 0.11, '#0b0b12'); });
  };

  /* ================= ELEMENTOS ================= */
  P.element = function (ctx, r, sk, t, rot) {
    ctx.lineCap = 'round';
    switch (sk.el) {
      case 'fire':
        for (let i = 0; i < 7; i++) { const x = (i - 3) * r * 0.28, h = r * (0.9 + 0.35 * Math.sin(t * 7 + i * 1.7)); const g = ctx.createLinearGradient(0, r, 0, r - h * 1.6); g.addColorStop(0, rgba('#fff3a0', 0.9)); g.addColorStop(0.5, rgba('#ff8a1d', 0.75)); g.addColorStop(1, rgba('#ff3d2e', 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - r * 0.22, r); ctx.quadraticCurveTo(x - r * 0.25, r - h, x + Math.sin(t * 5 + i) * r * 0.1, r - h * 1.6); ctx.quadraticCurveTo(x + r * 0.25, r - h, x + r * 0.22, r); ctx.fill(); }
        break;
      case 'water':
        for (let k = 0; k < 3; k++) { ctx.fillStyle = rgba(k ? '#7fd6ff' : '#bfefff', 0.3 - k * 0.05); ctx.beginPath(); ctx.moveTo(-r, r); for (let i = 0; i <= 10; i++) { const x = -r + i * r / 5; ctx.lineTo(x, -r * 0.2 + k * r * 0.35 + Math.sin(i * 0.9 + t * (2 + k)) * r * 0.1); } ctx.lineTo(r, r); ctx.fill(); }
        for (let i = 0; i < 6; i++) { const k = (t * 0.4 + hash(i)) % 1; ctx.strokeStyle = rgba('#ffffff', 0.6 * (1 - k)); ctx.lineWidth = r * 0.03; ctx.beginPath(); ctx.arc((hash(i + 4) - 0.5) * r * 1.4, r * 0.9 - k * r * 1.8, r * (0.05 + hash(i + 2) * 0.06), 0, TAU); ctx.stroke(); }
        break;
      case 'storm': {
        const flash = (t * 1.7) % 1 < 0.12;
        if (flash) { ctx.fillStyle = 'rgba(200,220,255,0.25)'; ctx.fillRect(-r, -r, r * 2, r * 2); }
        for (let b = 0; b < 3; b++) { ctx.strokeStyle = rgba(b ? '#9be7ff' : '#ffffff', flash ? 1 : 0.55); ctx.lineWidth = r * (b ? 0.04 : 0.07); ctx.beginPath(); let x = (hash(b + Math.floor(t * 3)) - 0.5) * r, y = -r; ctx.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (hash(k * 7 + b + Math.floor(t * 3)) - 0.5) * r * 0.5; y += r / 3; ctx.lineTo(x, y); } ctx.stroke(); }
        break;
      }
      case 'rock':
        ctx.rotate(rot * 0.2);
        // crateras: buraco escuro com a borda iluminada
        for (let i = 0; i < 11; i++) {
          const x = (hash(i + 9) - 0.5) * r * 1.45, y = (hash(i + 19) - 0.5) * r * 1.45, rr = r * (0.1 + hash(i + 29) * 0.16);
          circle(ctx, x, y, rr, 'rgba(18,14,11,0.55)');
          circle(ctx, x - rr * 0.2, y - rr * 0.22, rr * 0.7, 'rgba(255,255,255,0.16)');
          circle(ctx, x + rr * 0.1, y + rr * 0.12, rr * 0.45, 'rgba(12,9,7,0.4)');
        }
        for (let i = 0; i < 10; i++) circle(ctx, (hash(i + 40) - 0.5) * r * 1.7, (hash(i + 50) - 0.5) * r * 1.7, r * 0.025, 'rgba(255,255,255,0.2)');
        break;
      case 'wind':
        ctx.rotate(t * 1.2);
        for (let i = 0; i < 4; i++) { ctx.strokeStyle = rgba('#ffffff', 0.55 - i * 0.08); ctx.lineWidth = r * 0.07; ctx.beginPath(); ctx.arc(0, 0, r * (0.25 + i * 0.2), i * 1.6, i * 1.6 + 2.2); ctx.stroke(); }
        break;
      case 'light':
        ctx.rotate(t * 0.5);
        for (let i = 0; i < 12; i++) { const a = i * TAU / 12; ctx.strokeStyle = rgba('#fffbe6', i % 2 ? 0.35 : 0.6); ctx.lineWidth = r * 0.08; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.25, Math.sin(a) * r * 0.25); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.stroke(); }
        { const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.55); g.addColorStop(0, '#ffffff'); g.addColorStop(1, 'rgba(255,240,190,0)'); ctx.fillStyle = g; ctx.fillRect(-r, -r, r * 2, r * 2); }
        break;
      case 'shadow':
        for (let i = 0; i < 5; i++) { ctx.strokeStyle = rgba(i % 2 ? '#8f6bff' : '#3b1f6b', 0.6); ctx.lineWidth = r * 0.09; ctx.beginPath(); const a0 = i * TAU / 5 + t * 0.7; ctx.moveTo(0, 0); ctx.bezierCurveTo(Math.cos(a0) * r * 0.5, Math.sin(a0) * r * 0.5, Math.cos(a0 + 0.9) * r * 0.8, Math.sin(a0 + 0.9) * r * 0.8, Math.cos(a0 + 0.4) * r * 1.1, Math.sin(a0 + 0.4) * r * 1.1); ctx.stroke(); }
        circle(ctx, 0, 0, r * 0.18, '#05030d');
        break;
    }
  };

  /* ================= TECNOLOGIA ================= */
  P.tech = function (ctx, r, sk, t, rot, vy) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    switch (sk.tc) {
      case 'chip': {
        ctx.strokeStyle = rgba(sk.glow, 0.6); ctx.lineWidth = r * 0.05;
        const tr = [[-0.8, -0.5, -0.2, -0.5, -0.2, -0.1], [0.8, -0.3, 0.3, -0.3, 0.3, 0.2], [-0.7, 0.5, -0.1, 0.5, 0.1, 0.3], [0.2, 0.8, 0.2, 0.45, 0.6, 0.45], [-0.3, -0.85, -0.3, -0.6, 0.4, -0.6]];
        tr.forEach((p, i) => { ctx.beginPath(); ctx.moveTo(p[0] * r, p[1] * r); ctx.lineTo(p[2] * r, p[3] * r); ctx.lineTo(p[4] * r, p[5] * r); ctx.stroke(); circle(ctx, p[4] * r, p[5] * r, r * 0.07, sk.glow); const k = (t * 0.8 + i * 0.2) % 1; circle(ctx, HR.U.lerp(p[0], p[2], k) * r, HR.U.lerp(p[1], p[3], k) * r, r * 0.05, '#ffffff'); });
        ctx.fillStyle = '#0a0f0a'; ctx.fillRect(-r * 0.18, -r * 0.18, r * 0.36, r * 0.36);
        break;
      }
      case 'hologram':
        ctx.strokeStyle = rgba('#bff8ff', 0.45); ctx.lineWidth = r * 0.03;
        for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.ellipse(0, 0, Math.abs(Math.cos((i / 7) * Math.PI + t)) * r, r, 0, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-r, i * r * 0.28); ctx.lineTo(r, i * r * 0.28); ctx.stroke(); }
        if ((t * 3) % 1 < 0.08) { ctx.fillStyle = 'rgba(191,248,255,0.25)'; ctx.fillRect(-r, (hash(Math.floor(t * 3)) - 0.5) * r * 1.6, r * 2, r * 0.2); }
        break;
      case 'glitch': {
        const f = Math.floor(t * 8);
        for (let i = 0; i < 6; i++) { const y = -r + i * r / 3, off = (hash(f * 3 + i) - 0.5) * r * 0.5; ctx.fillStyle = i % 2 ? 'rgba(255,40,140,0.45)' : 'rgba(40,240,255,0.45)'; ctx.fillRect(-r + off, y, r * 2, r / 3 * (0.4 + hash(i + f) * 0.6)); }
        break;
      }
      case 'vinyl':
        ctx.rotate(t * 2.2);
        for (let i = 0; i < 7; i++) { ctx.strokeStyle = 'rgba(255,255,255,' + (0.05 + (i % 2) * 0.05) + ')'; ctx.lineWidth = r * 0.04; ctx.beginPath(); ctx.arc(0, 0, r * (0.4 + i * 0.09), 0, TAU); ctx.stroke(); }
        circle(ctx, 0, 0, r * 0.33, '#e63946'); circle(ctx, 0, 0, r * 0.06, '#111');
        ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, -0.4, 0.2); ctx.fill();
        break;
      case 'radar':
        ctx.strokeStyle = rgba('#35e29a', 0.4); ctx.lineWidth = r * 0.03;
        for (let i = 1; i <= 3; i++) { ctx.beginPath(); ctx.arc(0, 0, r * i / 3.2, 0, TAU); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.stroke();
        { const a = t * 2; const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, 'rgba(53,226,154,0.5)'); g.addColorStop(1, 'rgba(53,226,154,0.05)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, a - 0.7, a); ctx.closePath(); ctx.fill();
          for (let i = 0; i < 4; i++) { const ba = hash(i) * TAU, br = r * (0.3 + hash(i + 3) * 0.6), age = ((a - ba) % TAU + TAU) % TAU; circle(ctx, Math.cos(ba) * br, Math.sin(ba) * br, r * 0.06, rgba('#b8ffda', Math.max(0, 1 - age / 3))); } }
        break;
      case 'pixel': {
        const n = 8, s = r * 2 / n;
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const x = -r + i * s, y = -r + j * s, cx = x + s / 2, cy = y + s / 2; if (cx * cx + cy * cy > r * r) continue; const light = (i + j) % 2 === 0; ctx.fillStyle = light ? rgba(sk.base, 0.95) : rgba(sk.dark, 0.95); ctx.fillRect(x, y, s + 0.5, s + 0.5); }
        ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(-r * 0.5, -r * 0.5, s, s); ctx.fillRect(-r * 0.5 + s, -r * 0.5, s * 0.6, s * 0.6);
        break;
      }
      case 'disco': {
        const n = 7, s = r * 2 / n, off = (t * 0.4 % 1) * s;
        for (let i = -1; i < n + 1; i++) for (let j = 0; j < n; j++) { const x = -r + i * s + off, y = -r + j * s; const v = hash(i * 13 + j * 7 + Math.floor(t * 2)); ctx.fillStyle = 'rgba(' + (180 + v * 75 | 0) + ',' + (190 + v * 65 | 0) + ',255,' + (0.3 + v * 0.5).toFixed(2) + ')'; ctx.fillRect(x + 0.6, y + 0.6, s - 1.2, s - 1.2); }
        const k = (t * 1.3) % 1; if (k < 0.25) circle(ctx, -r * 0.3, -r * 0.35, r * 0.12 * (1 - k * 4), '#ffffff');
        break;
      }
    }
  };
  S.ufo = function (ctx, r, sk, t) {
    ctx.save(); ctx.translate(0, Math.sin(t * 2) * r * 0.05);
    const beam = ctx.createLinearGradient(0, r * 0.2, 0, r * 1.8); beam.addColorStop(0, 'rgba(160,255,200,0.35)'); beam.addColorStop(1, 'rgba(160,255,200,0)');
    ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(-r * 0.35, r * 0.25); ctx.lineTo(r * 0.35, r * 0.25); ctx.lineTo(r * 0.8, r * 1.8); ctx.lineTo(-r * 0.8, r * 1.8); ctx.fill();
    const dome = ctx.createRadialGradient(-r * 0.15, -r * 0.55, r * 0.05, 0, -r * 0.3, r * 0.6); dome.addColorStop(0, 'rgba(255,255,255,0.95)'); dome.addColorStop(1, rgba(sk.glow, 0.5));
    ctx.fillStyle = dome; ctx.beginPath(); ctx.ellipse(0, -r * 0.18, r * 0.55, r * 0.55, 0, Math.PI, TAU); ctx.fill();
    const body = ctx.createLinearGradient(0, -r * 0.3, 0, r * 0.35); body.addColorStop(0, '#e8eef8'); body.addColorStop(0.5, sk.base); body.addColorStop(1, sk.dark);
    ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.25, r * 0.36, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = r * 0.04; ctx.beginPath(); ctx.ellipse(0, -r * 0.04, r * 1.1, r * 0.22, 0, Math.PI, TAU); ctx.stroke();
    for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + t * 2, x = Math.cos(a) * r * 1.0, y = Math.sin(a) * r * 0.2 + r * 0.06; if (Math.sin(a) < -0.1) continue; circle(ctx, x, y, r * 0.08, i % 2 ? '#ffcf4a' : sk.glow); }
    ctx.restore();
  };

  /* ================= ARTES ================= */
  P.art = function (ctx, r, sk, t, rot) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    switch (sk.ar) {
      case 'mandala':
        for (let ring = 0; ring < 3; ring++) { const n = 8 + ring * 4, rr = r * (0.3 + ring * 0.25); ctx.save(); ctx.rotate(t * 0.3 * (ring % 2 ? -1 : 1)); for (let i = 0; i < n; i++) { ctx.save(); ctx.rotate(i * TAU / n); ctx.fillStyle = rgba(ring % 2 ? sk.glow : '#ffffff', 0.5); ctx.beginPath(); ctx.ellipse(0, -rr, r * 0.06, r * 0.13, 0, 0, TAU); ctx.fill(); ctx.restore(); } ctx.restore(); }
        circle(ctx, 0, 0, r * 0.14, '#ffffff'); break;
      case 'stainedglass': {
        const cols = ['#e63946', '#ffcf4a', '#2a9d8f', '#4361ee', '#9b5de5', '#f77f00'];
        for (let i = 0; i < 10; i++) { ctx.fillStyle = rgba(cols[i % 6], 0.75); ctx.beginPath(); const a = i / 10 * TAU, a2 = (i + 1) / 10 * TAU; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r * 1.2, Math.sin(a) * r * 1.2); ctx.lineTo(Math.cos(a2) * r * 1.2, Math.sin(a2) * r * 1.2); ctx.fill(); }
        ctx.strokeStyle = '#1b1b24'; ctx.lineWidth = r * 0.07; for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.stroke(); }
        ctx.beginPath(); ctx.arc(0, 0, r * 0.5, 0, TAU); ctx.stroke(); circle(ctx, 0, 0, r * 0.2, rgba('#ffffff', 0.7 + 0.3 * Math.sin(t * 2)));
        break;
      }
      case 'compass':
        ctx.strokeStyle = rgba('#3a2a12', 0.6); ctx.lineWidth = r * 0.03; ctx.beginPath(); ctx.arc(0, 0, r * 0.82, 0, TAU); ctx.stroke();
        for (let i = 0; i < 16; i++) { const a = i * TAU / 16, L = i % 4 ? 0.72 : 0.62; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * L, Math.sin(a) * r * L); ctx.lineTo(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82); ctx.stroke(); }
        ctx.save(); ctx.rotate(Math.sin(t * 1.3) * 0.15); starPath(ctx, 4, r * 0.66, r * 0.14, 0); ctx.fillStyle = rgba('#3a2a12', 0.75); ctx.fill(); ctx.fillStyle = '#e63946'; ctx.beginPath(); ctx.moveTo(0, -r * 0.66); ctx.lineTo(r * 0.12, 0); ctx.lineTo(-r * 0.12, 0); ctx.fill(); ctx.restore();
        break;
      case 'clock': {
        ctx.strokeStyle = '#1b1b24'; ctx.lineWidth = r * 0.05;
        for (let i = 0; i < 12; i++) { const a = i * TAU / 12; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.7, Math.sin(a) * r * 0.7); ctx.lineTo(Math.cos(a) * r * 0.84, Math.sin(a) * r * 0.84); ctx.stroke(); }
        const hA = t * 0.05 * TAU - Math.PI / 2, mA = t * 0.6 * TAU - Math.PI / 2;
        ctx.lineWidth = r * 0.08; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(hA) * r * 0.42, Math.sin(hA) * r * 0.42); ctx.stroke();
        ctx.lineWidth = r * 0.05; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(mA) * r * 0.64, Math.sin(mA) * r * 0.64); ctx.stroke();
        circle(ctx, 0, 0, r * 0.07, '#e63946'); break;
      }
      case 'origami':
        ctx.rotate(rot * 0.2);
        for (let i = 0; i < 6; i++) { ctx.fillStyle = rgba(i % 2 ? '#ffffff' : '#000000', i % 2 ? 0.2 : 0.14); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(i * TAU / 6) * r * 1.2, Math.sin(i * TAU / 6) * r * 1.2); ctx.lineTo(Math.cos((i + 1) * TAU / 6) * r * 1.2, Math.sin((i + 1) * TAU / 6) * r * 1.2); ctx.fill(); }
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = r * 0.02; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(i * TAU / 6) * r, Math.sin(i * TAU / 6) * r); ctx.stroke(); }
        break;
      case 'maze':
        ctx.strokeStyle = rgba('#ffffff', 0.55); ctx.lineWidth = r * 0.07; ctx.rotate(t * 0.15);
        for (let i = 1; i <= 4; i++) { const rr = r * i * 0.22, gap = hash(i) * TAU; ctx.beginPath(); ctx.arc(0, 0, rr, gap + 0.5, gap + TAU - 0.2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(Math.cos(gap + 1.5) * rr, Math.sin(gap + 1.5) * rr); ctx.lineTo(Math.cos(gap + 1.5) * (rr + r * 0.22), Math.sin(gap + 1.5) * (rr + r * 0.22)); ctx.stroke(); }
        circle(ctx, 0, 0, r * 0.08, sk.glow); break;
    }
  };

  /* ================= DOCES ================= */
  P.sweet = function (ctx, r, sk, t, rot) {
    ctx.lineCap = 'round';
    switch (sk.sw) {
      case 'orange': case 'watermelon': {
        const wm = sk.sw === 'watermelon';
        ctx.fillStyle = wm ? '#2d8a3e' : '#f08c00'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.arc(0, 0, r * 0.84, 0, TAU, true); ctx.fill();
        ctx.fillStyle = wm ? '#e8f5d0' : '#fff3d6'; ctx.beginPath(); ctx.arc(0, 0, r * 0.84, 0, TAU); ctx.arc(0, 0, r * 0.76, 0, TAU, true); ctx.fill();
        ctx.save(); ctx.rotate(rot * 0.2);
        if (wm) { for (let i = 0; i < 9; i++) { const a = i * TAU / 9, d = r * (0.35 + (i % 2) * 0.2); ctx.fillStyle = '#1b1b1b'; ctx.beginPath(); ctx.ellipse(Math.cos(a) * d, Math.sin(a) * d, r * 0.05, r * 0.09, a, 0, TAU); ctx.fill(); } }
        else { ctx.strokeStyle = 'rgba(255,243,214,0.8)'; ctx.lineWidth = r * 0.05; for (let i = 0; i < 10; i++) { const a = i * TAU / 10; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r * 0.76, Math.sin(a) * r * 0.76); ctx.stroke(); } circle(ctx, 0, 0, r * 0.08, '#fff3d6'); }
        ctx.restore(); break;
      }
      case 'marble':
        ctx.rotate(t * 0.4);
        // faixa de vidro torcida atravessando a bola (olho-de-gato)
        ctx.lineCap = 'round';
        ['#e63946', '#ffcf4a', '#4361ee'].forEach((c, i) => {
          const off = (i - 1) * r * 0.26;
          ctx.strokeStyle = rgba(c, 0.9); ctx.lineWidth = r * 0.24;
          ctx.beginPath();
          ctx.moveTo(-r * 0.95, off * 0.6);
          ctx.bezierCurveTo(-r * 0.3, off - r * 0.3, r * 0.3, off + r * 0.3, r * 0.95, off * 0.6);
          ctx.stroke();
        });
        ctx.lineCap = 'butt';
        circle(ctx, -r * 0.34, -r * 0.36, r * 0.2, 'rgba(255,255,255,0.45)');
        break;
      case 'cookie':
        ctx.rotate(rot * 0.2);
        for (let i = 0; i < 9; i++) { ctx.fillStyle = '#3b1d0a'; ctx.beginPath(); ctx.ellipse((hash(i) - 0.5) * r * 1.5, (hash(i + 5) - 0.5) * r * 1.5, r * 0.12, r * 0.09, hash(i + 2) * 3, 0, TAU); ctx.fill(); }
        // sem riscos: so as gotas, com brilho em cima para parecer chocolate
        for (let i = 0; i < 9; i++) { ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse((hash(i) - 0.5) * r * 1.5 - r * 0.03, (hash(i + 5) - 0.5) * r * 1.5 - r * 0.03, r * 0.05, r * 0.035, hash(i + 2) * 3, 0, TAU); ctx.fill(); }
        for (let i = 0; i < 7; i++) { ctx.fillStyle = 'rgba(120,72,30,0.35)'; ctx.beginPath(); ctx.arc((hash(i + 70) - 0.5) * r * 1.4, (hash(i + 80) - 0.5) * r * 1.4, r * 0.035, 0, TAU); ctx.fill(); }
        break;
      case 'candy':
        ctx.rotate(t * 1.4);
        for (let i = 0; i < 8; i++) { ctx.fillStyle = i % 2 ? '#e63946' : '#ffffff'; ctx.beginPath(); ctx.moveTo(0, 0); for (let k = 0; k <= 10; k++) { const f = k / 10, a = i * TAU / 8 + f * 1.2; ctx.lineTo(Math.cos(a) * r * f * 1.1, Math.sin(a) * r * f * 1.1); } for (let k = 10; k >= 0; k--) { const f = k / 10, a = (i + 1) * TAU / 8 + f * 1.2; ctx.lineTo(Math.cos(a) * r * f * 1.1, Math.sin(a) * r * f * 1.1); } ctx.fill(); }
        break;
    }
  };
  S.donut = function (ctx, r, sk, t, rot) {
    ctx.save(); ctx.rotate(rot * 0.15);
    const hole = r * 0.36;
    ctx.fillStyle = '#d9a066'; ctx.beginPath(); ctx.arc(0, 0, r * 1.02, 0, TAU); ctx.arc(0, 0, hole, 0, TAU, true); ctx.fill('evenodd');
    ctx.fillStyle = sk.base; ctx.beginPath();
    for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU, rr = r * (0.9 + 0.06 * Math.sin(i * 2.7)); i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    ctx.closePath(); ctx.moveTo(hole * 1.2, 0); ctx.arc(0, 0, hole * 1.2, 0, TAU, true); ctx.fill('evenodd');
    const cols = ['#ffffff', '#ffcf4a', '#4cf0ff', '#7cff6b', '#8f6bff'];
    for (let i = 0; i < 18; i++) { const a = hash(i) * TAU, d = r * (0.5 + hash(i + 3) * 0.32); ctx.save(); ctx.translate(Math.cos(a) * d, Math.sin(a) * d); ctx.rotate(hash(i + 7) * 3); ctx.fillStyle = cols[i % 5]; ctx.fillRect(-r * 0.07, -r * 0.02, r * 0.14, r * 0.04); ctx.restore(); }
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = r * 0.06; ctx.beginPath(); ctx.arc(0, 0, r * 0.78, Math.PI * 1.1, Math.PI * 1.45); ctx.stroke();
    ctx.restore();
  };

  /* ================= TEMPORADAS ================= */
  P.seasonal = function (ctx, r, sk, t, rot, vy) {
    ctx.lineCap = 'round';
    switch (sk.ss) {
      case 'ornament':
        ctx.fillStyle = 'rgba(255,207,74,0.85)'; ctx.fillRect(-r, -r * 0.22, r * 2, r * 0.1); ctx.fillRect(-r, r * 0.12, r * 2, r * 0.1);
        for (let i = -2; i <= 2; i++) circle(ctx, i * r * 0.4, -r * 0.01, r * 0.06, '#ffffff');
        break;
      case 'snowglobe':
        ctx.fillStyle = '#f4f8ff'; ctx.beginPath(); ctx.ellipse(0, r * 0.75, r * 0.9, r * 0.35, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = '#2d8a3e'; ctx.beginPath(); ctx.moveTo(0, -r * 0.35); ctx.lineTo(r * 0.28, r * 0.45); ctx.lineTo(-r * 0.28, r * 0.45); ctx.fill();
        for (let i = 0; i < 12; i++) { const k = (t * 0.25 + hash(i)) % 1; circle(ctx, (hash(i + 3) - 0.5) * r * 1.6 + Math.sin(t + i) * r * 0.05, -r + k * r * 1.8, r * 0.04, 'rgba(255,255,255,0.9)'); }
        break;
      case 'sugarskull':
        [-1, 1].forEach(s => { circle(ctx, s * r * 0.32, -r * 0.08, r * 0.2, '#15151c'); for (let k = 0; k < 6; k++) { const a = k * TAU / 6 + t; circle(ctx, s * r * 0.32 + Math.cos(a) * r * 0.26, -r * 0.08 + Math.sin(a) * r * 0.26, r * 0.05, ['#ff5ecf', '#ffcf4a', '#4cf0ff'][k % 3]); } });
        ctx.fillStyle = '#15151c'; ctx.beginPath(); ctx.moveTo(0, r * 0.12); ctx.lineTo(r * 0.07, r * 0.25); ctx.lineTo(-r * 0.07, r * 0.25); ctx.fill();
        ctx.strokeStyle = '#15151c'; ctx.lineWidth = r * 0.03; ctx.beginPath(); ctx.moveTo(-r * 0.4, r * 0.45); ctx.lineTo(r * 0.4, r * 0.45); ctx.stroke(); for (let k = -3; k <= 3; k++) { ctx.beginPath(); ctx.moveTo(k * r * 0.11, r * 0.38); ctx.lineTo(k * r * 0.11, r * 0.52); ctx.stroke(); }
        break;
      case 'mask':
        ctx.fillStyle = '#ffcf4a'; ctx.beginPath(); ctx.moveTo(-r * 0.95, -r * 0.2); ctx.quadraticCurveTo(-r * 0.5, -r * 0.55, 0, -r * 0.25); ctx.quadraticCurveTo(r * 0.5, -r * 0.55, r * 0.95, -r * 0.2); ctx.quadraticCurveTo(r * 0.6, r * 0.25, 0, r * 0.05); ctx.quadraticCurveTo(-r * 0.6, r * 0.25, -r * 0.95, -r * 0.2); ctx.fill();
        [-1, 1].forEach(s => { ctx.fillStyle = '#1b1030'; ctx.beginPath(); ctx.ellipse(s * r * 0.42, -r * 0.14, r * 0.18, r * 0.1, s * 0.3, 0, TAU); ctx.fill(); });
        for (let i = 0; i < 8; i++) circle(ctx, (i - 3.5) * r * 0.22, -r * 0.42 + Math.abs(i - 3.5) * r * 0.04, r * 0.04, ['#ff5ecf', '#4cf0ff'][i % 2]);
        break;
      case 'lantern':
        for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#ff5e7e', '#ffcf4a', '#35e29a', '#4cf0ff', '#8f6bff', '#ff8a3d'][i]; ctx.fillRect(-r + i * r / 3, -r, r / 3 + 0.5, r * 2); }
        ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = r * 0.04; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(-r, k * r * 0.4); ctx.lineTo(r, k * r * 0.4); ctx.stroke(); }
        { const g = ctx.createRadialGradient(0, r * 0.8, 0, 0, r * 0.8, r * 0.6); g.addColorStop(0, 'rgba(255,240,160,0.9)'); g.addColorStop(1, 'rgba(255,160,60,0)'); ctx.fillStyle = g; ctx.fillRect(-r, 0, r * 2, r); }
        break;
    }
  };
  D.ornamentCap = function (ctx, r) {
    ctx.fillStyle = '#c9a227'; ctx.fillRect(-r * 0.22, -r * 1.12, r * 0.44, r * 0.24);
    ctx.strokeStyle = '#c9a227'; ctx.lineWidth = r * 0.06; ctx.beginPath(); ctx.arc(0, -r * 1.22, r * 0.12, Math.PI, TAU); ctx.stroke();
  };
  D.feathers = function (ctx, r, sk, t) {
    [-1, 1].forEach(s => { for (let k = 0; k < 3; k++) { ctx.save(); ctx.translate(s * r * 0.8, -r * 0.3); ctx.rotate(s * (0.5 + k * 0.35) + Math.sin(t * 2 + k) * 0.05); ctx.fillStyle = ['#ff5ecf', '#4cf0ff', '#7cff6b'][k]; ctx.beginPath(); ctx.ellipse(0, -r * 0.45, r * 0.1, r * 0.42, 0, 0, TAU); ctx.fill(); ctx.restore(); } });
  };

  /* ================= GALÁXIAS (prêmios) ================= */
  P.galaxyspin = function (ctx, r, sk, t) {
    const gx = sk.gx || {}, c1 = sk.glow, c2 = gx.c2 || '#ffffff', tilt = gx.tilt == null ? 0.55 : gx.tilt, arms = gx.arms || 2, st = gx.style || 'spiral';
    ctx.save(); ctx.rotate(gx.rot || -0.4); ctx.scale(1, tilt);
    const spin = t * 0.5;
    if (st === 'ring') {
      ctx.strokeStyle = rgba(c1, 0.8); ctx.lineWidth = r * 0.2; ctx.beginPath(); ctx.arc(0, 0, r * 0.75, 0, TAU); ctx.stroke();
      for (let i = 0; i < 8; i++) { const a = spin + i * TAU / 8; ctx.strokeStyle = rgba(c2, 0.3); ctx.lineWidth = r * 0.04; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.15, Math.sin(a) * r * 0.15); ctx.lineTo(Math.cos(a) * r * 0.65, Math.sin(a) * r * 0.65); ctx.stroke(); }
    } else if (st === 'edge') {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, rgba(c2, 0.95)); g.addColorStop(0.3, rgba(c1, 0.7)); g.addColorStop(1, rgba(c1, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.1, r * 0.55, 0, 0, TAU); ctx.fill();
      if (gx.dust) { ctx.fillStyle = 'rgba(20,10,5,0.85)'; ctx.fillRect(-r, -r * 0.05, r * 2, r * 0.1); }
      if (gx.plumes) for (const s of [-1, 1]) { const pg = ctx.createLinearGradient(0, 0, 0, s * r); pg.addColorStop(0, 'rgba(255,90,70,0.7)'); pg.addColorStop(1, 'rgba(255,90,70,0)'); ctx.fillStyle = pg; ctx.beginPath(); ctx.moveTo(-r * 0.15, 0); ctx.lineTo(r * 0.15, 0); ctx.lineTo(r * 0.45, s * r * 1.4); ctx.lineTo(-r * 0.45, s * r * 1.4); ctx.fill(); }
    } else if (st === 'irregular') {
      for (let i = 0; i < 30; i++) circle(ctx, (hash(i) - 0.5) * r * 1.6 + Math.sin(t * 0.3 + i) * r * 0.03, (hash(i + 4) - 0.5) * r * 1.4, r * (0.03 + hash(i + 8) * 0.07), rgba(i % 3 ? c1 : c2, 0.7));
    } else {
      for (let arm = 0; arm < arms; arm++) for (let k = 0; k < 28; k++) {
        const f = k / 28, rr = r * (0.12 + f * 0.95), a = spin + arm * TAU / arms + f * (gx.wind || 3.4);
        circle(ctx, Math.cos(a) * rr, Math.sin(a) * rr, r * (0.02 + (1 - f) * 0.05) * (gx.flocc ? 1.4 : 1), rgba(k % 4 === 0 ? c2 : c1, (1 - f * 0.7) * (gx.flocc ? 0.55 : 0.85)));
      }
      if (gx.dust) { ctx.strokeStyle = 'rgba(20,10,5,0.7)'; ctx.lineWidth = r * 0.14; ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 3.5, 5.6); ctx.stroke(); }
      if (gx.companion) circle(ctx, r * 0.95, -r * 0.1, r * 0.16, rgba(c2, 0.85));
    }
    const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.35); cg.addColorStop(0, '#ffffff'); cg.addColorStop(1, rgba(c1, 0)); ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, r * 0.35, 0, TAU); ctx.fill();
    if (st === 'pair') { const cg2 = ctx.createRadialGradient(r * 0.5, r * 0.3, 0, r * 0.5, r * 0.3, r * 0.3); cg2.addColorStop(0, '#ffffff'); cg2.addColorStop(1, rgba(c2, 0)); ctx.fillStyle = cg2; ctx.beginPath(); ctx.arc(r * 0.5, r * 0.3, r * 0.3, 0, TAU); ctx.fill(); }
    ctx.restore();
  };

  /* ================= ARCONTES (prêmios das camadas) ================= */
  const SIGILS = ['mirror', 'seed', 'debt', 'hand', 'voice', 'waiting', 'lighthouse', 'hands', 'feather', 'bridge', 'light'];
  P.archon = function (ctx, r, sk, t) {
    const col = sk.glow, i = sk.ax || 0;
    ctx.save(); ctx.rotate(t * 0.2);
    for (let k = 0; k < 3; k++) { ctx.strokeStyle = rgba(col, 0.35 - k * 0.08); ctx.lineWidth = r * 0.04; ctx.setLineDash([r * 0.12, r * 0.08]); ctx.beginPath(); ctx.arc(0, 0, r * (0.62 + k * 0.14), 0, TAU); ctx.stroke(); }
    ctx.setLineDash([]); ctx.restore();
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.6); g.addColorStop(0, rgba(col, 0.55)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(-r, -r, r * 2, r * 2);
    R.glyph(ctx, SIGILS[i % SIGILS.length], 0, 0, r * 1.05, '#ffffff', 1.6);
  };
})();
