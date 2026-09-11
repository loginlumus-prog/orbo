/* =====================================================================
   Renderização: bola (skins procedurais), arcos, moedas, rastros,
   fundo com parallax por tema e sistema de partículas.
   Tudo vetorial → nítido em qualquer tela, sem assets externos.
   ===================================================================== */
window.HR = window.HR || {};
const RU = () => HR.U;

HR.Render = {
  RX: 0.26, // "espessura" da elipse do arco (visto de lado)

  /* ---------------- Bola ---------------- */
  drawBall(ctx, x, y, r, skin, t, o) {
    o = o || {};
    const U = RU();
    const vy = o.vy || 0;
    const rot = t * 1.6 + (o.spin || 0);
    const alpha = o.alpha == null ? 1 : o.alpha;
    ctx.save();
    ctx.globalAlpha = alpha;

    // brilho externo
    if (o.glow !== false) {
      const g = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 1.9);
      g.addColorStop(0, U.rgba(skin.glow, 0.35));
      g.addColorStop(1, U.rgba(skin.glow, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 1.9, 0, Math.PI * 2); ctx.fill();
    }

    // aura de combo (cresce com a sequência de perfeitos) e aura de estrela (invencível)
    if (o.heat) {
      const h = o.heat, rr = r * (1.5 + h * 0.9) * (1 + 0.04 * Math.sin(t * 4));
      const ag = ctx.createRadialGradient(x, y, r * 0.9, x, y, rr);
      ag.addColorStop(0, U.rgba('#ffcf4a', 0.10 + h * 0.22)); ag.addColorStop(1, U.rgba('#ffcf4a', 0));
      ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill();
    }
    if (o.star) {
      const k = Math.min(1, o.star / 1.2);
      ctx.save(); ctx.globalAlpha = alpha * (0.45 + 0.55 * k); ctx.lineCap = 'round';
      for (let i = 0; i < 12; i++) { const a0 = t * 3 + i * Math.PI / 6; ctx.strokeStyle = U.hsl((t * 200 + i * 30) % 360, 95, 65, 0.9); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, r * 1.45, a0, a0 + Math.PI / 9); ctx.stroke(); }
      ctx.restore();
    }
    ctx.translate(x, y);
    // leve "esmagar" com velocidade (squash & stretch) no eixo do movimento
    const sq = U.clamp(Math.abs(vy) / 2600, 0, 0.18);
    if (o.sqAxis === 'x') ctx.scale(1 + sq, 1 - sq * 0.6); else ctx.scale(1 - sq * 0.6, 1 + sq);

    // corpo
    const p = skin.pattern;
    const bodyAlpha = p === 'ghost' ? 0.62 : p === 'glass' ? 0.88 : 1;
    ctx.globalAlpha = alpha * bodyAlpha;
    const g2 = ctx.createRadialGradient(-r * 0.35, -r * 0.38, r * 0.1, 0, 0, r);
    g2.addColorStop(0, U.mix(skin.base, '#ffffff', 0.55));
    g2.addColorStop(0.45, skin.base);
    g2.addColorStop(1, skin.dark);
    ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();

    // padrões (clip no círculo)
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip();
    switch (p) {
      case 'ring':
        ctx.strokeStyle = U.rgba('#ffffff', 0.85); ctx.lineWidth = r * 0.14;
        ctx.beginPath(); ctx.ellipse(0, 0, r * 0.62, r * 0.62 * Math.abs(Math.cos(rot * 0.7)) + r * 0.05, rot * 0.3, 0, Math.PI * 2); ctx.stroke();
        break;
      case 'cracks': {
        ctx.strokeStyle = U.rgba(skin.dark, 0.9); ctx.lineWidth = r * 0.08; ctx.lineCap = 'round';
        ctx.rotate(rot * 0.5);
        for (let i = 0; i < 5; i++) {
          const a = i * Math.PI * 2 / 5;
          ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.2, Math.sin(a) * r * 0.2);
          ctx.lineTo(Math.cos(a + 0.4) * r * 0.6, Math.sin(a + 0.4) * r * 0.6);
          ctx.lineTo(Math.cos(a + 0.2) * r * 1.1, Math.sin(a + 0.2) * r * 1.1); ctx.stroke();
        }
        const pulse = 0.5 + 0.5 * Math.sin(t * 6);
        const gl = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        gl.addColorStop(0, U.rgba('#fff2a0', 0.35 * pulse)); gl.addColorStop(1, U.rgba('#fff2a0', 0));
        ctx.fillStyle = gl; ctx.fillRect(-r, -r, r * 2, r * 2);
        break;
      }
      case 'glass':
        ctx.strokeStyle = U.rgba('#ffffff', 0.7); ctx.lineWidth = r * 0.07;
        ctx.beginPath(); ctx.arc(0, 0, r * 0.72, Math.PI * 1.05, Math.PI * 1.6); ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, r * 0.55, Math.PI * 0.2, Math.PI * 0.55); ctx.stroke();
        break;
      case 'soccer': {
        ctx.fillStyle = '#1c2233'; ctx.rotate(rot);
        const pent = (cx, cy, rr, a0) => { ctx.beginPath(); for (let i = 0; i < 5; i++) { const a = a0 + i * Math.PI * 2 / 5; const px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); ctx.fill(); };
        pent(0, 0, r * 0.3, -Math.PI / 2);
        for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * Math.PI * 2 / 5 + Math.PI / 5; pent(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86, r * 0.28, a); }
        break;
      }
      case 'shine': {
        const s = ((t * 0.9) % 2) * r * 2 - r * 2;
        const lg = ctx.createLinearGradient(s - r * 0.5, -r, s + r * 0.5, r);
        lg.addColorStop(0, U.rgba('#ffffff', 0)); lg.addColorStop(0.5, U.rgba('#ffffff', 0.75)); lg.addColorStop(1, U.rgba('#ffffff', 0));
        ctx.fillStyle = lg; ctx.fillRect(-r, -r, r * 2, r * 2);
        break;
      }
      case 'galaxy': {
        const ng = ctx.createRadialGradient(r * 0.2, -r * 0.1, 0, 0, 0, r);
        ng.addColorStop(0, U.rgba('#ff7ad9', 0.55)); ng.addColorStop(0.5, U.rgba('#4cf0ff', 0.2)); ng.addColorStop(1, U.rgba('#000000', 0));
        ctx.fillStyle = ng; ctx.fillRect(-r, -r, r * 2, r * 2);
        ctx.fillStyle = '#ffffff'; ctx.rotate(rot * 0.6);
        for (let i = 0; i < 14; i++) { const a = i * 2.4, d = (i / 14) * r * 0.95; const s = 0.9 + (i % 3) * 0.6; ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d, s, 0, Math.PI * 2); ctx.fill(); }
        break;
      }
      case 'ghost': {
        ctx.fillStyle = '#1c2233';
        const look = U.clamp(vy / 1500, -1, 1) * r * 0.12;
        ctx.beginPath(); ctx.ellipse(-r * 0.28, -r * 0.1 + look, r * 0.12, r * 0.2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(r * 0.2, -r * 0.1 + look, r * 0.12, r * 0.2, 0, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'eye': {
        const look = U.clamp(vy / 1500, -1, 1) * r * 0.25;
        const ig = ctx.createRadialGradient(r * 0.1, look, r * 0.05, r * 0.1, look, r * 0.55);
        ig.addColorStop(0, '#ff9ab8'); ig.addColorStop(0.6, '#c81f4f'); ig.addColorStop(1, '#5a0a24');
        ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(r * 0.1, look, r * 0.55, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#0b0b0f'; ctx.beginPath(); ctx.arc(r * 0.1, look, r * 0.26, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(r * 0.0, look - r * 0.18, r * 0.1, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'rainbow': {
        ctx.rotate(rot);
        const cols = ['#ff5e7e', '#ffcf4a', '#35e29a', '#4cf0ff', '#8f6bff', '#ff5ecf'];
        for (let i = 0; i < 6; i++) { ctx.fillStyle = U.rgba(cols[i], 0.85); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, i * Math.PI / 3, (i + 1) * Math.PI / 3); ctx.closePath(); ctx.fill(); }
        const wg = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
        wg.addColorStop(0, 'rgba(255,255,255,0.7)'); wg.addColorStop(0.6, 'rgba(255,255,255,0)'); wg.addColorStop(1, 'rgba(0,0,0,0.25)');
        ctx.fillStyle = wg; ctx.fillRect(-r, -r, r * 2, r * 2);
        break;
      }
      case 'plasma': {
        for (let i = 0; i < 3; i++) {
          const a = t * (1.2 + i * 0.4) + i * 2.1;
          const bx = Math.cos(a) * r * 0.45, by = Math.sin(a * 1.3) * r * 0.45;
          const pg = ctx.createRadialGradient(bx, by, 0, bx, by, r * 0.6);
          pg.addColorStop(0, U.rgba('#ffffff', 0.55)); pg.addColorStop(0.4, U.rgba(skin.glow, 0.35)); pg.addColorStop(1, U.rgba(skin.glow, 0));
          ctx.fillStyle = pg; ctx.fillRect(-r, -r, r * 2, r * 2);
        }
        break;
      }
    }
    ctx.restore();

    // reflexo especular
    ctx.globalAlpha = alpha * 0.9;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath(); ctx.ellipse(-r * 0.38, -r * 0.42, r * 0.22, r * 0.13, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    // escudos (um anel por carga)
    if (o.shield) {
      const n = Math.max(1, o.shields || 1);
      ctx.save(); ctx.globalAlpha = alpha;
      for (let i = 0; i < n; i++) {
        const rr = r * (1.4 + i * 0.22);
        ctx.strokeStyle = U.rgba('#4cf0ff', 0.55 + 0.3 * Math.sin(t * 8 + i)); ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = U.rgba('#ffffff', 0.18); ctx.lineWidth = 7; ctx.stroke();
      }
      ctx.restore();
    }
  },

  /* ---------------- Rastro (heat = 0..1 pela sequência de perfeitos) ---------------- */
  drawTrail(ctx, trailId, pts, skin, t, heat) {
    heat = heat || 0;
    if (pts.length < 2) return;
    const U = RU();
    const n = pts.length;
    ctx.save();
    if (trailId === 'none') {
      if (heat < 0.05) { ctx.restore(); return; }
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const col = U.mix(skin.glow, '#ffcf4a', heat);
      for (let i = 1; i < n; i++) { const k = i / n; ctx.strokeStyle = U.rgba(col, k * heat * 0.55); ctx.lineWidth = 2 + k * (6 + heat * 12); ctx.beginPath(); ctx.moveTo(pts[i - 1].x, pts[i - 1].y); ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke(); }
      ctx.restore(); return;
    }
    const wm = 1 + heat * 0.8, am = 0.75 + heat * 0.45;
    if (trailId === 'rainbow') {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (let i = 1; i < n; i++) {
        const k = i / n;
        ctx.strokeStyle = U.hsl((t * 120 + i * 14) % 360, 90, 60 + heat * 15, Math.min(1, k * 0.8 * am));
        ctx.lineWidth = (4 + k * 22) * wm;
        ctx.beginPath(); ctx.moveTo(pts[i - 1].x, pts[i - 1].y); ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke();
      }
    } else {
      const hot = U.mix(skin.glow, '#ffcf4a', heat);
      for (let i = 0; i < n - 1; i++) {
        const k = i / n, p = pts[i];
        const age = t - p.t;
        if (trailId === 'dots') {
          ctx.fillStyle = U.rgba(hot, Math.min(1, k * 0.6 * am)); ctx.beginPath(); ctx.arc(p.x, p.y, (3 + k * 12) * wm, 0, Math.PI * 2); ctx.fill();
        } else if (trailId === 'stars') {
          ctx.fillStyle = U.rgba(heat > 0.5 ? '#fff3a0' : '#ffffff', Math.min(1, k * 0.9 * am)); ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(age * 6 + i);
          const s = (2 + k * 8) * wm; ctx.beginPath();
          for (let j = 0; j < 8; j++) { const rr = j % 2 ? s * 0.4 : s; const a = j * Math.PI / 4; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
          ctx.closePath(); ctx.fill(); ctx.restore();
        } else if (trailId === 'fire') {
          const col = k > 0.7 ? '#fff3a0' : k > 0.4 ? '#ff9d1c' : '#ff3d2e';
          ctx.fillStyle = U.rgba(col, Math.min(1, k * 0.75 * am));
          const jit = Math.sin(i * 7.3 + t * 30) * 4;
          ctx.beginPath(); ctx.arc(p.x, p.y + jit - age * 60, (4 + k * 14) * wm, 0, Math.PI * 2); ctx.fill();
        } else if (trailId === 'bubbles') {
          ctx.strokeStyle = U.rgba('#cfe9ff', Math.min(1, k * 0.8 * am)); ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(p.x, p.y - age * 40, (3 + ((i * 37) % 9) + k * 4) * wm, 0, Math.PI * 2); ctx.stroke();
        }
      }
    }
    ctx.restore();
  },

  /* ---------------- Arco (cor pelo tipo; água = bolha; anomalia = núcleo escuro) ---------------- */
  drawRing(ctx, ring, half, o) {
    o = o || {};
    const U = RU(), t = o.t || 0;
    const r = ring.r;
    let rx = r * this.RX;
    const water = ring.fx === 'water';
    if (water) rx *= 1 + 0.05 * Math.sin(t * 2.5 + (ring.index || 0));
    const base = ring.color || ring.accent;
    const color = ring.hit ? '#ff5e7e' : ring.missed ? '#6f7a95' : base;
    const alpha = (o.alpha == null ? 1 : o.alpha) * (ring.missed ? 0.55 : 1);
    const flash = ring.flash || 0;
    const w = Math.max(6, r * 0.11);
    const a0 = half === 'back' ? Math.PI / 2 : -Math.PI / 2;
    const a1 = half === 'back' ? Math.PI * 1.5 : Math.PI / 2;
    ctx.save();
    ctx.translate(ring.x, ring.y); ctx.rotate(ring.tilt);
    const sc = 1 + flash * 0.1; ctx.scale(sc, sc);
    ctx.lineCap = 'round';
    ctx.globalAlpha = alpha;
    if (ring.type === 'anomaly') {
      if (half === 'back') { ctx.fillStyle = 'rgba(20,0,6,0.6)'; ctx.beginPath(); ctx.ellipse(0, 0, rx, r, 0, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = U.rgba('#ff3d2e', 0.28 + flash * 0.3 + 0.1 * Math.sin(t * 6)); ctx.lineWidth = w * 3;
      ctx.beginPath(); ctx.ellipse(0, 0, rx, r, 0, a0, a1); ctx.stroke();
      ctx.strokeStyle = '#ff3d2e'; ctx.lineWidth = w;
      ctx.beginPath(); ctx.ellipse(0, 0, rx, r, 0, a0, a1); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,205,190,0.85)'; ctx.lineWidth = w * 0.3; ctx.setLineDash([10, 14]); ctx.lineDashOffset = -t * 60;
      ctx.beginPath(); ctx.ellipse(0, 0, rx * 0.94, r * 0.94, 0, a0, a1); ctx.stroke(); ctx.setLineDash([]);
      ctx.restore(); return;
    }
    if (water && half === 'back') { ctx.fillStyle = U.rgba(color, 0.07); ctx.beginPath(); ctx.ellipse(0, 0, rx, r, 0, 0, Math.PI * 2); ctx.fill(); }
    // halo
    ctx.strokeStyle = U.rgba(color, 0.22 + flash * 0.3); ctx.lineWidth = w * 2.8;
    ctx.beginPath(); ctx.ellipse(0, 0, rx, r, 0, a0, a1); ctx.stroke();
    // corpo
    ctx.strokeStyle = color; ctx.lineWidth = water ? w * 1.15 : w;
    ctx.beginPath(); ctx.ellipse(0, 0, rx, r, 0, a0, a1); ctx.stroke();
    // brilho interno
    ctx.strokeStyle = U.rgba('#ffffff', (water ? 0.65 : 0.5) + flash * 0.5); ctx.lineWidth = w * 0.32;
    ctx.beginPath(); ctx.ellipse(-w * 0.15, -w * 0.15, rx * 0.9, r * 0.93, 0, a0, a1); ctx.stroke();
    if (ring.type === 'gold') { ctx.strokeStyle = U.rgba('#fff6c8', 0.5 + 0.3 * Math.sin(t * 6)); ctx.lineWidth = w * 0.5; ctx.setLineDash([6, 10]); ctx.lineDashOffset = t * 40; ctx.beginPath(); ctx.ellipse(0, 0, rx, r, 0, a0, a1); ctx.stroke(); ctx.setLineDash([]); }
    ctx.restore();
  },

  // marcador central: a forma também "diz" o tipo (ponto, barra, traço inclinado, arco girando, alvo…)
  drawRingCenter(ctx, ring, aligned, t) {
    const U = RU();
    if (ring.resolved) return;
    const pulse = 0.5 + 0.5 * Math.sin(t * 5 + (ring.index || 0));
    const col = aligned ? '#ffffff' : (ring.color || ring.accent);
    const a = aligned ? 0.95 : 0.35 + pulse * 0.25;
    ctx.save();
    ctx.translate(ring.x, ring.y);
    ctx.strokeStyle = U.rgba(col, a); ctx.fillStyle = U.rgba(col, a); ctx.lineWidth = 2; ctx.lineCap = 'round';
    switch (ring.type) {
      case 'wave':
        ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(0, 9); ctx.moveTo(-3, -6); ctx.lineTo(0, -9); ctx.lineTo(3, -6); ctx.moveTo(-3, 6); ctx.lineTo(0, 9); ctx.lineTo(3, 6); ctx.stroke(); break;
      case 'tilt':
        ctx.rotate(ring.tilt); ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill(); break;
      case 'spin':
        ctx.rotate(t * 3); ctx.beginPath(); ctx.arc(0, 0, 7, 0, Math.PI * 1.25); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill(); break;
      case 'pulse':
        ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(0, 0, 8 + pulse * 2, 0, Math.PI * 2); ctx.stroke(); break;
      case 'ghost':
        ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.stroke(); break;
      case 'gold':
        ctx.beginPath(); for (let i = 0; i < 8; i++) { const rr = i % 2 ? 3 : 8, an = i * Math.PI / 4; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.closePath(); ctx.fill(); break;
      case 'anomaly':
        ctx.rotate(t * 2); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-7, -7); ctx.lineTo(7, 7); ctx.moveTo(7, -7); ctx.lineTo(-7, 7); ctx.stroke(); break;
      default:
        ctx.beginPath(); ctx.arc(0, 0, aligned ? 5 : 3.5, 0, Math.PI * 2); ctx.fill();
    }
    if (aligned) { ctx.strokeStyle = U.rgba('#ffffff', 0.5); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 12 + pulse * 3, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  },

  /* ---------------- Obstáculo (detrito que gira no vazio) ---------------- */
  drawObstacle(ctx, o, t) {
    void t;
    ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(o.rot);
    const g = ctx.createRadialGradient(0, 0, o.r * 0.6, 0, 0, o.r * 2.2);
    g.addColorStop(0, 'rgba(255,94,126,0.16)'); g.addColorStop(1, 'rgba(255,94,126,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, o.r * 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    const n = 7;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; const rr = o.r * (0.78 + 0.28 * Math.abs(Math.sin(o.seed + i * 2.1))); const px = Math.cos(a) * rr, py = Math.sin(a) * rr; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath();
    const fg = ctx.createLinearGradient(-o.r, -o.r, o.r, o.r); fg.addColorStop(0, '#5b6480'); fg.addColorStop(1, '#1b2033');
    ctx.fillStyle = fg; ctx.fill();
    ctx.strokeStyle = 'rgba(255,120,150,0.75)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-o.r * 0.4, -o.r * 0.2); ctx.lineTo(0, o.r * 0.1); ctx.lineTo(o.r * 0.35, o.r * 0.45); ctx.stroke();
    ctx.restore();
  },

  /* ---------------- Item (bolha de vidro com glifo) ---------------- */
  drawPickup(ctx, p, t) {
    const U = RU();
    ctx.save(); ctx.translate(p.x, p.y);
    const g = ctx.createRadialGradient(0, 0, 4, 0, 0, p.r * 2.4);
    g.addColorStop(0, U.rgba(p.color, 0.35)); g.addColorStop(1, U.rgba(p.color, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, p.r * 2.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(10,14,32,0.55)'; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = U.rgba(p.color, 0.9); ctx.lineWidth = 2.5; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, p.r - 4, Math.PI * 1.05, Math.PI * 1.55); ctx.stroke();
    for (let i = 0; i < 2; i++) { const a = t * 2.2 + i * Math.PI + p.seed; ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.arc(Math.cos(a) * (p.r + 7), Math.sin(a) * (p.r + 7) * 0.5, 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = p.color; ctx.strokeStyle = p.color; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const s = p.r * 0.55;
    switch (p.id) {
      case 'star':
        ctx.beginPath(); for (let i = 0; i < 10; i++) { const rr = i % 2 ? s * 0.45 : s; const an = -Math.PI / 2 + i * Math.PI / 5; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.closePath(); ctx.fill(); break;
      case 'life':
        ctx.beginPath(); ctx.moveTo(0, s * 0.9); ctx.bezierCurveTo(-s * 1.3, -s * 0.1, -s * 0.6, -s * 1.1, 0, -s * 0.35); ctx.bezierCurveTo(s * 0.6, -s * 1.1, s * 1.3, -s * 0.1, 0, s * 0.9); ctx.fill(); break;
      case 'shield':
        ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.85, -s * 0.6); ctx.lineTo(s * 0.7, s * 0.25); ctx.lineTo(0, s); ctx.lineTo(-s * 0.7, s * 0.25); ctx.lineTo(-s * 0.85, -s * 0.6); ctx.closePath(); ctx.stroke(); break;
      case 'coins':
        for (let i = 2; i >= 0; i--) { ctx.fillStyle = i === 0 ? p.color : U.mix(p.color, '#000000', 0.25); ctx.beginPath(); ctx.ellipse(0, i * s * 0.32 - s * 0.3, s * 0.9, s * 0.42, 0, 0, Math.PI * 2); ctx.fill(); }
        break;
      case 'magnet':
        ctx.beginPath(); ctx.arc(0, -s * 0.1, s * 0.75, Math.PI, 0); ctx.moveTo(-s * 0.75, -s * 0.1); ctx.lineTo(-s * 0.75, s * 0.7); ctx.moveTo(s * 0.75, -s * 0.1); ctx.lineTo(s * 0.75, s * 0.7); ctx.stroke(); break;
      case 'slow':
        ctx.beginPath(); ctx.moveTo(-s * 0.7, -s); ctx.lineTo(s * 0.7, -s); ctx.lineTo(0, 0); ctx.closePath(); ctx.moveTo(-s * 0.7, s); ctx.lineTo(s * 0.7, s); ctx.lineTo(0, 0); ctx.closePath(); ctx.stroke(); break;
      case 'gem':
        ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.9, -s * 0.2); ctx.lineTo(0, s); ctx.lineTo(-s * 0.9, -s * 0.2); ctx.closePath(); ctx.fill(); break;
    }
    ctx.restore();
  },

  drawCoin(ctx, x, y, r, t, seed) {
    const U = RU();
    const sx = Math.abs(Math.cos(t * 4 + (seed || 0)));
    ctx.save(); ctx.translate(x, y); ctx.scale(Math.max(0.15, sx), 1);
    const g = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
    g.addColorStop(0, '#fff6c8'); g.addColorStop(0.5, '#ffcf4a'); g.addColorStop(1, '#e08a00');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = U.rgba('#8a4b00', 0.5); ctx.lineWidth = r * 0.16; ctx.beginPath(); ctx.arc(0, 0, r * 0.62, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    const gl = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 2.2);
    gl.addColorStop(0, U.rgba('#ffcf4a', 0.3)); gl.addColorStop(1, U.rgba('#ffcf4a', 0));
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, Math.PI * 2); ctx.fill();
  }
};

/* ---------------- Fundo ---------------- */
HR.Render.Background = class {
  constructor() { this.theme = null; this.stars = []; this.shapes = []; this.W = 0; this.H = 0; this.grad = null; this.tint = '#4cf0ff'; this.tintCur = { r: 76, g: 240, b: 255 }; this.scroll = 0; }
  resize(W, H) { this.W = W; this.H = H; this.build(); }
  setTheme(theme) { this.theme = theme; this.build(); }
  setTint(hex) { this.tint = hex; }
  build() {
    if (!this.theme || !this.W) return;
    const U = RU(), W = this.W, H = this.H;
    this.grad = null;
    this.stars = [];
    if (this.theme.stars) for (let i = 0; i < 70; i++) this.stars.push({ x: Math.random(), y: Math.random(), s: U.rand(0.6, 2.2), p: U.rand(0, 6.28), sp: U.rand(0.08, 0.3) });
    this.shapes = [];
    const kind = this.theme.shapes;
    const n = kind === 'grid' ? 0 : kind === 'bubbles' ? 26 : kind === 'waves' ? 4 : 7;
    for (let i = 0; i < n; i++) this.shapes.push({ x: Math.random(), y: Math.random(), r: U.rand(0.12, 0.42), p: U.rand(0, 6.28), sp: U.rand(0.05, 0.25), hue: U.rand(0, 360) });
    void W; void H;
  }
  // dir = direção (na tela) em que o mundo se move; o fundo acompanha com parallax bem sutil
  update(dt, speed, dir) {
    const d = dir || { x: -1, y: 0 };
    this.sx = (this.sx || 0) + speed * dt * d.x;
    this.sy = (this.sy || 0) + speed * dt * d.y;
    this.scroll = Math.hypot(this.sx, this.sy);
  }
  wrap(v, size) { return ((v % size) + size) % size; }
  draw(ctx, t) {
    const U = RU(), W = this.W, H = this.H, th = this.theme;
    if (!th) return;
    const sx = this.sx || 0, sy = this.sy || 0;
    if (!this.grad) {
      this.grad = ctx.createLinearGradient(0, 0, 0, H);
      this.grad.addColorStop(0, th.colors[0]); this.grad.addColorStop(0.55, th.colors[1]); this.grad.addColorStop(1, th.colors[2]);
    }
    ctx.fillStyle = this.grad; ctx.fillRect(0, 0, W, H);

    // tonalidade da fase (suave, interpolada)
    const tc = U.hexToRgb(this.tint), c = this.tintCur;
    c.r += (tc.r - c.r) * 0.02; c.g += (tc.g - c.g) * 0.02; c.b += (tc.b - c.b) * 0.02;
    const tg = ctx.createRadialGradient(W * 0.85, H * 0.1, 0, W * 0.85, H * 0.1, H * 0.9);
    tg.addColorStop(0, 'rgba(' + (c.r | 0) + ',' + (c.g | 0) + ',' + (c.b | 0) + ',0.16)'); tg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = tg; ctx.fillRect(0, 0, W, H);

    // efeitos de região: água (feixes de luz + cáusticas) · brasas (partículas subindo)
    if (th.fx === 'water') {
      for (let i = 0; i < 3; i++) {
        const x0 = W * (0.18 + i * 0.32) + Math.sin(t * 0.25 + i * 2) * 30;
        const rg = ctx.createLinearGradient(0, 0, 0, H); rg.addColorStop(0, 'rgba(190,235,255,0.10)'); rg.addColorStop(1, 'rgba(190,235,255,0)');
        ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(x0 - 26, 0); ctx.lineTo(x0 + 26, 0); ctx.lineTo(x0 + 150, H); ctx.lineTo(x0 - 120, H); ctx.closePath(); ctx.fill();
      }
      ctx.lineCap = 'round';
      for (let i = 0; i < 5; i++) {
        const base = H * (0.2 + i * 0.16), ph = i * 1.7;
        ctx.strokeStyle = 'rgba(180,230,255,' + (0.045 + (i % 2) * 0.02) + ')'; ctx.lineWidth = 9;
        ctx.beginPath();
        for (let x = -20; x <= W + 20; x += 10) { const y = base + Math.sin((x + sx * 0.08) * 0.03 + t * 1.1 + ph) * 12 + Math.sin(x * 0.011 - t * 0.6) * 6; x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke();
        ctx.strokeStyle = 'rgba(220,245,255,0.09)'; ctx.lineWidth = 2; ctx.stroke();
      }
    } else if (th.fx === 'ember') {
      if (!this.embers) { this.embers = []; for (let i = 0; i < 44; i++) this.embers.push({ x: Math.random(), y: Math.random(), s: U.rand(1, 2.6), v: U.rand(0.02, 0.06), p: U.rand(0, 6.28) }); }
      this.embers.forEach(e => {
        const y = this.wrap(e.y * H - t * e.v * H, H), x = this.wrap(e.x * W + Math.sin(t * 1.3 + e.p) * 14 + sx * 0.02, W);
        ctx.globalAlpha = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 5 + e.p));
        ctx.fillStyle = e.s > 2 ? '#ffb347' : '#ff6a2b'; ctx.beginPath(); ctx.arc(x, y, e.s, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
    const kind = th.shapes;
    const sc = this.scroll;
    if (kind === 'orbs' || kind === 'nebula') {
      this.shapes.forEach((s, i) => {
        const par = 0.03 + (i % 3) * 0.02;
        const x = this.wrap(s.x * W * 2 + sx * par, W * 2) - W * 0.5;
        const y = this.wrap(s.y * H * 1.6 + sy * par, H * 1.6) - H * 0.3 + Math.sin(t * s.sp + s.p) * 20;
        const r = s.r * H;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        const col = kind === 'nebula' ? U.hsl(s.hue, 70, 55, 0.14) : 'rgba(' + (c.r | 0) + ',' + (c.g | 0) + ',' + (c.b | 0) + ',0.09)';
        g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      });
    } else if (kind === 'waves') {
      ctx.lineWidth = 2;
      this.shapes.forEach((s, i) => {
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.04 + i * 0.015) + ')';
        ctx.beginPath();
        const base = H * (0.55 + i * 0.12);
        for (let x = 0; x <= W; x += 12) { const y = base + Math.sin((x - sx * (0.06 + i * 0.02)) * 0.012 + s.p) * (18 + i * 8); x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
      });
    } else if (kind === 'bubbles') {
      this.shapes.forEach((s, i) => {
        const par = 0.04 + (i % 4) * 0.02;
        const x = this.wrap(s.x * W * 1.5 + sx * par, W * 1.5) - W * 0.25;
        const y = this.wrap(s.y * H - t * (8 + i * 1.5) + sy * par, H);
        ctx.strokeStyle = 'rgba(160,220,255,0.12)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x, y, 6 + s.r * 60, 0, Math.PI * 2); ctx.stroke();
      });
    } else if (kind === 'grid') {
      ctx.strokeStyle = 'rgba(143,107,255,0.18)'; ctx.lineWidth = 1;
      const hor = H * 0.62;
      for (let i = -8; i <= 8; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 30, hor); ctx.lineTo(W / 2 + i * W * 0.35, H); ctx.stroke(); }
      for (let k = 0; k < 8; k++) { const f = ((k / 8 + (sc * 0.0004) % 1) % 1); const y = hor + Math.pow(f, 2.2) * (H - hor); ctx.globalAlpha = f; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.globalAlpha = 1;
      const hg = ctx.createLinearGradient(0, hor - 60, 0, hor + 40); hg.addColorStop(0, 'rgba(255,94,207,0)'); hg.addColorStop(1, 'rgba(255,94,207,0.18)');
      ctx.fillStyle = hg; ctx.fillRect(0, hor - 60, W, 100);
    }

    // estrelas com parallax
    if (this.stars.length) {
      ctx.fillStyle = '#ffffff';
      this.stars.forEach((s, i) => {
        const par = 0.012 + (i % 3) * 0.012;
        const x = this.wrap(s.x * W + sx * par, W);
        const y = this.wrap(s.y * H + sy * par, H);
        const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.sp * 4 + s.p));
        ctx.globalAlpha = a * 0.8; ctx.beginPath(); ctx.arc(x, y, s.s, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
    // vinheta
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.85);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.45)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }
};

/* ---------------- Partículas ---------------- */
HR.Render.Particles = class {
  constructor() { this.list = []; }
  clear() { this.list = []; }
  burst(o) {
    const U = RU();
    const n = o.n || 12;
    for (let i = 0; i < n; i++) {
      const a = (o.angle == null ? Math.random() * Math.PI * 2 : o.angle + U.rand(-(o.spread || 0.5), o.spread || 0.5));
      const sp = U.rand(o.speed * 0.4, o.speed);
      this.list.push({
        type: o.type || 'circle', x: o.x, y: o.y, vx: Math.cos(a) * sp + (o.vx || 0), vy: Math.sin(a) * sp + (o.vy || 0),
        life: 0, max: U.rand((o.life || 0.6) * 0.6, o.life || 0.6), size: U.rand((o.size || 6) * 0.5, o.size || 6),
        color: Array.isArray(o.color) ? U.pick(o.color) : o.color, g: o.gravity || 0, drag: o.drag || 0.9, rot: Math.random() * 6.28, vr: U.rand(-6, 6)
      });
    }
  }
  text(x, y, txt, color, size) {
    this.list.push({ type: 'text', x, y, vx: 0, vy: -90, life: 0, max: 0.9, size: size || 30, color: color || '#ffffff', text: txt, g: 0, drag: 1, pop: 1 });
  }
  update(dt) {
    const L = this.list;
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i];
      p.life += dt;
      if (p.life >= p.max) { L.splice(i, 1); continue; }
      p.vy += p.g * dt;
      const dr = Math.pow(p.drag, dt * 60);
      p.vx *= dr; p.vy *= dr;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.rot += (p.vr || 0) * dt;
    }
  }
  // textos flutuantes desenhados em espaço de tela (ficam "em pé" mesmo com o mundo girado)
  drawText(ctx, mapFn) {
    const U = RU();
    this.list.forEach(p => {
      if (p.type !== 'text') return;
      const k = 1 - p.life / p.max;
      const pos = mapFn ? mapFn(p.x, p.y) : { x: p.x, y: p.y };
      ctx.save();
      ctx.globalAlpha = Math.min(1, k * 1.4);
      const s = p.life < 0.15 ? U.easeOutBack(p.life / 0.15) : 1;
      ctx.translate(pos.x, pos.y - (p.max - (p.max - p.life)) * 0); ctx.scale(s, s);
      ctx.font = '900 ' + p.size + 'px Rubik, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.strokeText(p.text, 0, 0);
      ctx.fillStyle = p.color; ctx.fillText(p.text, 0, 0);
      ctx.restore();
    });
  }
  draw(ctx, filter) {
    const U = RU();
    this.list.forEach(p => {
      if (filter && !filter(p)) return;
      const k = 1 - p.life / p.max;
      ctx.save();
      ctx.globalAlpha = Math.min(1, k * 1.4);
      if (p.type === 'text') {
        const s = p.life < 0.15 ? U.easeOutBack(p.life / 0.15) : 1;
        ctx.translate(p.x, p.y); ctx.scale(s, s);
        ctx.font = '900 ' + p.size + 'px Rubik, system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.strokeText(p.text, 0, 0);
        ctx.fillStyle = p.color; ctx.fillText(p.text, 0, 0);
      } else if (p.type === 'bubble') {
        ctx.strokeStyle = U.rgba(p.color, Math.min(1, k * 0.9)); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (1 + (1 - k) * 0.8), 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = U.rgba('#ffffff', k * 0.5); ctx.beginPath(); ctx.arc(p.x - p.size * 0.35, p.y - p.size * 0.35, p.size * 0.22, 0, Math.PI * 2); ctx.fill();
      } else if (p.type === 'wave') {
        const rr = p.size + (1 - k) * 130;
        ctx.strokeStyle = U.rgba(p.color, k * 0.7); ctx.lineWidth = 3 + k * 4;
        ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, Math.PI * 2); ctx.stroke();
      } else if (p.type === 'spark') {
        ctx.strokeStyle = p.color; ctx.lineWidth = p.size * 0.4; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04); ctx.stroke();
      } else if (p.type === 'shard') {
        ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * k, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();
    });
  }
};
