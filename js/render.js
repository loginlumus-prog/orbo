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
      const k = Math.min(1, o.star / 1.2), blink = o.star < 1.5 ? (Math.floor(t * 8) % 2 ? 1 : 0.3) : 1;
      const sg = ctx.createRadialGradient(x, y, r, x, y, r * 2.6); sg.addColorStop(0, 'rgba(255,226,122,' + (0.22 * blink).toFixed(2) + ')'); sg.addColorStop(1, 'rgba(255,226,122,0)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(x, y, r * 2.6, 0, Math.PI * 2); ctx.fill();
      ctx.save(); ctx.globalAlpha = alpha * (0.45 + 0.55 * k) * blink; ctx.lineCap = 'round';
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
      case 'eight': {
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(r * 0.1, -r * 0.05, r * 0.42, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#141418'; ctx.font = '900 ' + (r * 0.6).toFixed(0) + 'px Rubik, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('8', r * 0.1, -r * 0.03);
        break;
      }
      case 'craters': {
        ctx.fillStyle = 'rgba(80,90,120,0.45)';
        [[-0.35, -0.1, 0.22], [0.3, 0.25, 0.16], [0.05, -0.45, 0.12], [0.4, -0.3, 0.09], [-0.2, 0.45, 0.13]].forEach(c => { ctx.beginPath(); ctx.arc(c[0] * r, c[1] * r, c[2] * r, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = r * 0.04; ctx.beginPath(); ctx.arc(c[0] * r, c[1] * r, c[2] * r, Math.PI * 1.1, Math.PI * 1.7); ctx.stroke(); });
        break;
      }
      case 'stripes': {
        ctx.rotate(rot * 0.4); ctx.fillStyle = skin.stripe || '#000';
        for (let i = -3; i <= 3; i += 2) { ctx.fillRect(-r, i * r * 0.28 - r * 0.12, r * 2, r * 0.24); }
        break;
      }
      case 'corona': {
        ctx.rotate(rot * 0.3); ctx.fillStyle = U.rgba('#fff6c8', 0.9);
        for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, L = r * (0.95 + 0.12 * Math.sin(t * 5 + i)); ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.12) * r * 0.55, Math.sin(a - 0.12) * r * 0.55); ctx.lineTo(Math.cos(a) * L, Math.sin(a) * L); ctx.lineTo(Math.cos(a + 0.12) * r * 0.55, Math.sin(a + 0.12) * r * 0.55); ctx.fill(); }
        const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.6); cg.addColorStop(0, '#fffbe0'); cg.addColorStop(1, U.rgba('#ffb347', 0)); ctx.fillStyle = cg; ctx.fillRect(-r, -r, r * 2, r * 2);
        break;
      }
      case 'toxic': {
        for (let i = 0; i < 5; i++) { const a = t * (0.8 + i * 0.3) + i * 1.3, d = r * 0.5, x2 = Math.cos(a) * d, y2 = Math.sin(a * 0.7) * d; ctx.strokeStyle = 'rgba(220,255,200,0.7)'; ctx.lineWidth = r * 0.06; ctx.beginPath(); ctx.arc(x2, y2, r * (0.12 + (i % 3) * 0.05), 0, Math.PI * 2); ctx.stroke(); }
        break;
      }
      case 'saturn': {
        ctx.strokeStyle = 'rgba(255,225,168,0.85)'; ctx.lineWidth = r * 0.16; ctx.beginPath(); ctx.ellipse(0, 0, r * 1.35, r * 0.4, -0.3, Math.PI * 0.05, Math.PI * 0.95); ctx.stroke();
        ctx.fillStyle = 'rgba(160,97,44,0.35)'; for (let i = -2; i <= 2; i++) ctx.fillRect(-r, i * r * 0.3, r * 2, r * 0.07);
        break;
      }
      case 'pearl': {
        const hue = (t * 40) % 360;
        const pg = ctx.createLinearGradient(-r, -r, r, r); pg.addColorStop(0, U.hsl(hue, 80, 85, 0.6)); pg.addColorStop(0.5, U.hsl(hue + 90, 80, 85, 0.35)); pg.addColorStop(1, U.hsl(hue + 180, 80, 85, 0.6));
        ctx.fillStyle = pg; ctx.fillRect(-r, -r, r * 2, r * 2);
        break;
      }
      case 'void': {
        ctx.rotate(-rot * 0.8);
        for (let i = 0; i < 3; i++) { ctx.strokeStyle = U.rgba('#8f6bff', 0.55 - i * 0.12); ctx.lineWidth = r * 0.07; ctx.beginPath(); for (let k = 0; k <= 30; k++) { const f = k / 30, rr = f * r * 0.95, a = f * 6 + i * 2.1; k ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(0, 0); } ctx.stroke(); }
        ctx.fillStyle = '#05030d'; ctx.beginPath(); ctx.arc(0, 0, r * 0.28, 0, Math.PI * 2); ctx.fill();
        break;
      }
      case 'comet': {
        const cg = ctx.createRadialGradient(-r * 0.2, -r * 0.2, 0, 0, 0, r); cg.addColorStop(0, '#ffffff'); cg.addColorStop(0.5, U.rgba('#9be7ff', 0.5)); cg.addColorStop(1, U.rgba('#3b8cff', 0));
        ctx.fillStyle = cg; ctx.fillRect(-r, -r, r * 2, r * 2);
        for (let i = 0; i < 4; i++) { const a = -0.4 + i * 0.28 + Math.sin(t * 3 + i) * 0.1; ctx.strokeStyle = U.rgba('#cfe9ff', 0.55); ctx.lineWidth = r * 0.06; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.3, Math.sin(a) * r * 0.3); ctx.lineTo(Math.cos(a) * r * 1.1, Math.sin(a) * r * 1.1); ctx.stroke(); }
        break;
      }
      case 'scales': {
        ctx.rotate(rot * 0.3); ctx.strokeStyle = U.rgba('#7a1216', 0.7); ctx.lineWidth = r * 0.05;
        for (let row = -3; row <= 3; row++) for (let col = -3; col <= 3; col++) { const x2 = col * r * 0.34 + (row % 2 ? r * 0.17 : 0), y2 = row * r * 0.3; ctx.beginPath(); ctx.arc(x2, y2, r * 0.17, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke(); }
        const eg = ctx.createRadialGradient(0, 0, 0, 0, 0, r); eg.addColorStop(0, U.rgba('#ffcf4a', 0.35)); eg.addColorStop(1, U.rgba('#ffcf4a', 0)); ctx.fillStyle = eg; ctx.fillRect(-r, -r, r * 2, r * 2);
        break;
      }
      case 'pumpkin': {
        ctx.strokeStyle = 'rgba(138,58,8,0.5)'; ctx.lineWidth = r * 0.06; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(i * r * 0.22, 0, r * 0.28, r * 0.98, 0, 0, Math.PI * 2); ctx.stroke(); }
        ctx.fillStyle = '#1b0c04'; const look = U.clamp(vy / 1500, -1, 1) * r * 0.08;
        ctx.beginPath(); ctx.moveTo(-r * 0.45, -r * 0.1 + look); ctx.lineTo(-r * 0.15, -r * 0.1 + look); ctx.lineTo(-r * 0.3, -r * 0.4 + look); ctx.fill();
        ctx.beginPath(); ctx.moveTo(r * 0.45, -r * 0.1 + look); ctx.lineTo(r * 0.15, -r * 0.1 + look); ctx.lineTo(r * 0.3, -r * 0.4 + look); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-r * 0.5, r * 0.25); for (let i = 0; i <= 6; i++) ctx.lineTo(-r * 0.5 + i * r / 6, r * (0.25 + (i % 2 ? 0.2 : 0.05))); ctx.lineTo(r * 0.5, r * 0.55); ctx.lineTo(-r * 0.5, r * 0.55); ctx.fill();
        break;
      }
      case 'confetti': {
        ctx.rotate(rot * 0.5); const cols = ['#ff5e7e', '#ffcf4a', '#35e29a', '#4cf0ff', '#8f6bff'];
        for (let i = 0; i < 14; i++) { const a = i * 2.4, d = (i % 5) * r * 0.18 + r * 0.15; ctx.fillStyle = cols[i % 5]; ctx.save(); ctx.translate(Math.cos(a) * d, Math.sin(a) * d); ctx.rotate(a + t); ctx.fillRect(-r * 0.09, -r * 0.05, r * 0.18, r * 0.1); ctx.restore(); }
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

  // orbes de poder: pequenas esferas com cauda girando em volta da bola (uma configuração por poder ativo);
  // quando o poder está acabando (T < 1,5 s) piscam
  drawOrbs(ctx, x, y, br, orbs, t) {
    const U = RU();
    ctx.save(); ctx.lineCap = 'round';
    orbs.forEach((o, oi) => {
      const ending = o.T != null && o.T < 1.5, blink = ending ? (Math.floor(t * 8) % 2 ? 1 : 0.25) : 1;
      const R = br * o.rad;
      for (let i = 0; i < o.n; i++) {
        const a = t * o.speed + i * Math.PI * 2 / o.n + oi * 0.9;
        const ox = x + Math.cos(a) * R, oy = y + Math.sin(a) * R * 0.78;
        for (let k = 1; k <= 4; k++) { const ak = a - k * 0.13 * Math.sign(o.speed || 1); ctx.fillStyle = U.rgba(o.color, blink * (0.35 - k * 0.07)); ctx.beginPath(); ctx.arc(x + Math.cos(ak) * R, y + Math.sin(ak) * R * 0.78, o.size * (1 - k * 0.15), 0, 6.283); ctx.fill(); }
        const g = ctx.createRadialGradient(ox, oy, 0, ox, oy, o.size * 3); g.addColorStop(0, U.rgba(o.color, 0.5 * blink)); g.addColorStop(1, U.rgba(o.color, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ox, oy, o.size * 3, 0, 6.283); ctx.fill();
        ctx.fillStyle = U.rgba(o.wisp ? '#ffffff' : o.color, blink); ctx.beginPath(); ctx.arc(ox, oy, o.size, 0, 6.283); ctx.fill();
        ctx.fillStyle = U.rgba('#ffffff', 0.8 * blink); ctx.beginPath(); ctx.arc(ox - o.size * 0.3, oy - o.size * 0.3, o.size * 0.35, 0, 6.283); ctx.fill();
      }
    });
    ctx.restore();
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
        } else if (trailId === 'comet') {
          ctx.fillStyle = U.rgba(k > 0.6 ? '#ffffff' : '#9be7ff', Math.min(1, k * 0.85 * am)); ctx.beginPath(); ctx.arc(p.x, p.y, (2 + k * 13) * wm, 0, Math.PI * 2); ctx.fill();
          if (i % 3 === 0) { ctx.strokeStyle = U.rgba('#cfe9ff', k * 0.5); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 18 * (1 - k), p.y + Math.sin(i * 3.1) * 6); ctx.stroke(); }
        } else if (trailId === 'petals') {
          ctx.fillStyle = U.rgba(i % 2 ? '#ffb3d9' : '#ff7ad9', Math.min(1, k * 0.85 * am)); ctx.save(); ctx.translate(p.x, p.y - age * 25); ctx.rotate(age * 4 + i); ctx.beginPath(); ctx.ellipse(0, 0, (3 + k * 7) * wm, (1.5 + k * 3.5) * wm, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        } else if (trailId === 'lightning') {
          if (i < n - 2) { const q = pts[i + 1]; ctx.strokeStyle = U.rgba(k > 0.7 ? '#ffffff' : '#9be7ff', Math.min(1, k * 0.9 * am)); ctx.lineWidth = (1.5 + k * 3) * wm; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo((p.x + q.x) / 2 + Math.sin(i * 9.7 + t * 40) * 7, (p.y + q.y) / 2 + Math.cos(i * 7.3 + t * 35) * 7); ctx.lineTo(q.x, q.y); ctx.stroke(); }
        } else if (trailId === 'snow') {
          ctx.strokeStyle = U.rgba('#ffffff', Math.min(1, k * 0.8 * am)); ctx.lineWidth = 1.2; ctx.save(); ctx.translate(p.x, p.y + age * 30); ctx.rotate(age * 2 + i); const s = (2 + k * 5) * wm; ctx.beginPath(); for (let j = 0; j < 3; j++) { const a = j * Math.PI / 3; ctx.moveTo(-Math.cos(a) * s, -Math.sin(a) * s); ctx.lineTo(Math.cos(a) * s, Math.sin(a) * s); } ctx.stroke(); ctx.restore();
        } else if (trailId === 'bats') {
          ctx.fillStyle = U.rgba('#2a1b4a', Math.min(1, k * 0.9 * am)); ctx.save(); ctx.translate(p.x, p.y - age * 40); const s = (3 + k * 6) * wm, fl = Math.sin(t * 20 + i) * 0.4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-s, -s * (0.8 + fl), -s * 1.8, 0); ctx.quadraticCurveTo(-s, s * 0.3, 0, s * 0.2); ctx.quadraticCurveTo(s, s * 0.3, s * 1.8, 0); ctx.quadraticCurveTo(s, -s * (0.8 + fl), 0, 0); ctx.fill(); ctx.restore();
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
    if (ring.shatterT) { const k = Math.min(1, ring.shatterT / 0.5); ctx.save(); ctx.translate(ring.x, ring.y); ctx.rotate(ring.tilt); ctx.globalAlpha = alpha * (1 - k); ctx.setLineDash([8, 14]); ctx.lineDashOffset = k * 40; ctx.strokeStyle = color; ctx.lineWidth = w * (1 - k * 0.5); ctx.beginPath(); ctx.ellipse(0, 0, rx * (1 + k * 0.7), r * (1 + k * 0.7), 0, a0, a1); ctx.stroke(); ctx.restore(); return; }
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
    if (ring.type === 'guardian') { ctx.strokeStyle = U.rgba('#ffffff', 0.12 + 0.08 * Math.sin(t * 3)); ctx.lineWidth = w * 4.2; ctx.beginPath(); ctx.ellipse(0, 0, rx, r, 0, a0, a1); ctx.stroke(); }
    ctx.strokeStyle = color; ctx.lineWidth = water ? w * 1.15 : ring.type === 'guardian' ? w * 1.5 : w;
    ctx.beginPath(); ctx.ellipse(0, 0, rx, r, 0, a0, a1); ctx.stroke();
    // brilho interno
    ctx.strokeStyle = U.rgba('#ffffff', (water ? 0.65 : 0.5) + flash * 0.5); ctx.lineWidth = w * 0.32;
    ctx.beginPath(); ctx.ellipse(-w * 0.15, -w * 0.15, rx * 0.9, r * 0.93, 0, a0, a1); ctx.stroke();
    if (ring.type === 'gold') { ctx.strokeStyle = U.rgba('#fff6c8', 0.5 + 0.3 * Math.sin(t * 6)); ctx.lineWidth = w * 0.5; ctx.setLineDash([6, 10]); ctx.lineDashOffset = t * 40; ctx.beginPath(); ctx.ellipse(0, 0, rx, r, 0, a0, a1); ctx.stroke(); ctx.setLineDash([]); }
    this.drawRingBiome(ctx, ring, half, rx, r, w, a0, a1, t, color);
    ctx.restore();
  },
  // bioma no arco (v4): detalhe discreto sobre o corpo, nunca muda a cor-linguagem do tipo
  drawRingBiome(ctx, ring, half, rx, r, w, a0, a1, t, color) {
    const U = RU(), fx = ring.fx, idx = ring.index || 0;
    if (!fx || fx === 'water') return;
    switch (fx) {
      case 'ember':
        ctx.strokeStyle = U.rgba('#fff2a0', 0.4 + 0.25 * Math.sin(t * 5 + idx)); ctx.lineWidth = w * 0.32; ctx.setLineDash([4, 9]); ctx.lineDashOffset = -t * 25;
        ctx.beginPath(); ctx.ellipse(0, 0, rx * 0.8, r * 0.85, 0, a0, a1); ctx.stroke(); ctx.setLineDash([]); break;
      case 'crystal': {
        ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = w * 0.26; ctx.lineJoin = 'miter'; ctx.beginPath();
        for (let k = 0; k <= 7; k++) { const a = a0 + (a1 - a0) * k / 7; const x = Math.cos(a) * rx * 1.02, y = Math.sin(a) * r * 1.02; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke(); break;
      }
      case 'storm': {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = w * 0.22; ctx.beginPath();
        for (let k = 0; k <= 22; k++) { const a = a0 + (a1 - a0) * k / 22, j = 1 + Math.sin(k * 13.7 + t * 40 + idx) * 0.03; const x = Math.cos(a) * rx * j, y = Math.sin(a) * r * j; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke(); break;
      }
      case 'garden':
        ctx.fillStyle = 'rgba(170,255,140,0.85)';
        for (let k = 0; k < 3; k++) { const a = a0 + (a1 - a0) * (0.2 + k * 0.3) + Math.sin(t + idx) * 0.05; ctx.save(); ctx.translate(Math.cos(a) * rx, Math.sin(a) * r); ctx.rotate(a + 0.8); ctx.beginPath(); ctx.ellipse(0, 0, w * 0.9, w * 0.4, 0, 0, 6.283); ctx.fill(); ctx.restore(); }
        break;
      case 'abyss':
        ctx.strokeStyle = U.rgba('#9be7ff', 0.55 + 0.3 * Math.sin(t * 4 + idx)); ctx.lineWidth = w * 0.5; ctx.setLineDash([2, 9]); ctx.lineDashOffset = t * 30;
        ctx.beginPath(); ctx.ellipse(0, 0, rx, r, 0, a0, a1); ctx.stroke(); ctx.setLineDash([]); break;
      case 'vortex':
        ctx.strokeStyle = U.rgba(color, 0.6); ctx.lineWidth = w * 0.4; ctx.setLineDash([12, 12]); ctx.lineDashOffset = t * 90;
        ctx.beginPath(); ctx.ellipse(0, 0, rx * 1.14, r * 1.1, 0, a0, a1); ctx.stroke(); ctx.setLineDash([]); break;
      case 'horizon':
        ctx.strokeStyle = 'rgba(255,243,194,0.35)'; ctx.lineWidth = w * 0.3;
        ctx.beginPath(); ctx.ellipse(0, 0, rx * 1.24, r * 1.15, 0, a0, a1); ctx.stroke(); break;
      case 'aurora':
        ctx.strokeStyle = 'rgba(124,255,107,0.16)'; ctx.lineWidth = w * 3.4;
        ctx.beginPath(); ctx.ellipse(0, 0, rx, r, 0, a0, a1); ctx.stroke(); break;
      case 'mist':
        ctx.strokeStyle = U.rgba(color, 0.12); ctx.lineWidth = w * 4.6;
        ctx.beginPath(); ctx.ellipse(0, 0, rx, r, 0, a0, a1); ctx.stroke(); break;
    }
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
      case 'guardian':
        ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 10 + pulse * 3, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill(); break;
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
    if (o.shot) { // tiro da sentinela: raio vermelho curto
      ctx.save(); ctx.translate(o.x, o.y); const a = Math.atan2(o.vy || 0, o.vx || -1); ctx.rotate(a);
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, o.r * 2.6); g.addColorStop(0, 'rgba(255,94,126,0.5)'); g.addColorStop(1, 'rgba(255,94,126,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, o.r * 2.6, 0, 6.283); ctx.fill();
      ctx.lineCap = 'round'; ctx.strokeStyle = '#ff5e7e'; ctx.lineWidth = o.r * 0.9; ctx.beginPath(); ctx.moveTo(-o.r * 2.2, 0); ctx.lineTo(o.r * 0.6, 0); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = o.r * 0.35; ctx.beginPath(); ctx.moveTo(-o.r * 1.6, 0); ctx.lineTo(o.r * 0.4, 0); ctx.stroke();
      ctx.restore(); return;
    }
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

  /* ---------------- Sentinela (evento): losango escuro com olho que segue a bola ---------------- */
  drawSentinel(ctx, S, t, ball) {
    const U = RU();
    ctx.save(); ctx.translate(S.x, S.y + Math.sin(t * 2.2) * 6);
    const g = ctx.createRadialGradient(0, 0, 6, 0, 0, 60); g.addColorStop(0, 'rgba(255,94,126,0.28)'); g.addColorStop(1, 'rgba(255,94,126,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 60, 0, 6.283); ctx.fill();
    ctx.rotate(Math.sin(t * 1.3) * 0.12);
    const fg = ctx.createLinearGradient(-26, -26, 26, 26); fg.addColorStop(0, '#3a4260'); fg.addColorStop(1, '#0c1020');
    ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(0, -34); ctx.lineTo(24, 0); ctx.lineTo(0, 34); ctx.lineTo(-24, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,120,150,0.85)'; ctx.lineWidth = 2.5; ctx.stroke();
    for (let i = 0; i < 3; i++) { const a = t * 2 + i * 2.094; ctx.fillStyle = 'rgba(255,94,126,0.7)'; ctx.beginPath(); ctx.arc(Math.cos(a) * 40, Math.sin(a) * 40 * 0.45, 3, 0, 6.283); ctx.fill(); }
    const lookY = U.clamp((ball.y - S.y) / 400, -1, 1) * 4, lookX = -4;
    ctx.fillStyle = '#1a0510'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 9, 0, 0, 6.283); ctx.fill();
    ctx.fillStyle = S.blink > 0 ? '#ffffff' : '#ff3d5e'; ctx.beginPath(); ctx.arc(lookX, lookY, 5, 0, 6.283); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(lookX - 2, lookY - 2, 1.6, 0, 6.283); ctx.fill();
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
  constructor() { this.theme = null; this.stars = []; this.shapes = []; this.dust = []; this.streaks = []; this.W = 0; this.H = 0; this.grad = null; this.tint = '#4cf0ff'; this.tintCur = { r: 76, g: 240, b: 255 }; this.scroll = 0; this.flow = 0; this.fx = null; this.fxT = 0; this.dir = { x: -1, y: 0 }; }
  resize(W, H) { this.W = W; this.H = H; this.build(); }
  setTheme(theme) { this.theme = theme; this.build(); }
  setFx(fx) { if (this.fx !== fx) { this.fx = fx || null; this.fxT = 0; this.fxObjs = null; } }
  setTint(hex) { this.tint = hex; }
  build() {
    if (!this.theme || !this.W) return;
    const U = RU(), W = this.W, H = this.H;
    this.grad = null;
    this.stars = [];
    if (this.theme.stars) for (let i = 0; i < 70; i++) this.stars.push({ x: Math.random(), y: Math.random(), s: U.rand(0.6, 2.2), p: U.rand(0, 6.28), sp: U.rand(0.08, 0.3) });
    this.dust = []; for (let i = 0; i < 40; i++) this.dust.push({ x: Math.random(), y: Math.random(), s: U.rand(0.8, 1.8), a: U.rand(0.25, 0.6) });
    this.streaks = []; for (let i = 0; i < 18; i++) this.streaks.push({ x: Math.random(), y: Math.random(), l: U.rand(0.5, 1), a: U.rand(0.4, 1) });
    this.shapes = [];
    const kind = this.theme.shapes;
    const n = kind === 'grid' ? 0 : kind === 'bubbles' ? 26 : kind === 'waves' ? 4 : 7;
    for (let i = 0; i < n; i++) this.shapes.push({ x: Math.random(), y: Math.random(), r: U.rand(0.12, 0.42), p: U.rand(0, 6.28), sp: U.rand(0.05, 0.25), hue: U.rand(0, 360) });
    void W; void H;
  }
  // dir = direção (na tela) em que o mundo se move; o fundo acompanha com parallax bem sutil
  update(dt, speed, dir, flow) {
    const d = dir || { x: -1, y: 0 };
    this.dir = d; this.speed = speed; this.flow = flow || 0; this.fxT += dt;
    this.sx = (this.sx || 0) + speed * dt * d.x;
    this.sy = (this.sy || 0) + speed * dt * d.y;
    this.scroll = Math.hypot(this.sx, this.sy);
  }
  wrap(v, size) { return ((v % size) + size) % size; }
  // biomas (v4): cada fx tem objetos próprios (gerados uma vez) e um desenho discreto sobre o tema
  drawBiome(ctx, t, fx, sx, sy) {
    const U = RU(), W = this.W, H = this.H;
    if (!this.fxObjs) {
      const n = { aurora: 3, garden: 34, mist: 5, crystal: 12, storm: 56, abyss: 36, vortex: 7, horizon: 44 }[fx] || 0;
      this.fxObjs = []; for (let i = 0; i < n; i++) this.fxObjs.push({ x: Math.random(), y: Math.random(), s: U.rand(0.5, 1.5), p: U.rand(0, 6.28), v: U.rand(0.5, 1.5), h: U.rand(0, 360), a: U.rand(0, 6.28) });
    }
    const O = this.fxObjs;
    ctx.save(); ctx.lineCap = 'round';
    if (fx === 'aurora') {
      for (let i = 0; i < 3; i++) {
        const base = H * (0.12 + i * 0.1), ph = i * 2.1;
        const g = ctx.createLinearGradient(0, base - 40, 0, base + 40); g.addColorStop(0, 'rgba(124,255,107,0)'); g.addColorStop(0.5, 'rgba(124,255,107,' + (0.10 - i * 0.02) + ')'); g.addColorStop(1, 'rgba(76,240,255,0)');
        ctx.strokeStyle = g; ctx.lineWidth = 34;
        ctx.beginPath();
        for (let x = -30; x <= W + 30; x += 14) { const y = base + Math.sin((x + sx * 0.05) * 0.008 + t * 0.35 + ph) * 26 + Math.sin(x * 0.02 - t * 0.5 + ph) * 8; x === -30 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
        ctx.stroke();
      }
    } else if (fx === 'garden') {
      O.forEach(o => {
        const x = this.wrap(o.x * W + sx * 0.06 + Math.sin(t * 0.8 + o.p) * 18, W), y = this.wrap(o.y * H - t * o.v * 16 + sy * 0.06, H);
        ctx.save(); ctx.translate(x, y); ctx.rotate(o.a + t * 0.6 * o.v);
        ctx.fillStyle = o.s > 1 ? 'rgba(170,255,140,0.28)' : 'rgba(255,240,170,0.35)';
        ctx.beginPath(); ctx.ellipse(0, 0, 2.2 + o.s * 3.2, 1.2 + o.s * 1.2, 0, 0, 6.283); ctx.fill(); ctx.restore();
      });
    } else if (fx === 'mist') {
      O.forEach((o, i) => {
        const x = this.wrap(o.x * W * 1.6 + t * o.v * 12 + sx * 0.03, W * 1.6) - W * 0.3, y = o.y * H;
        ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.28);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 240 + i * 40); g.addColorStop(0, 'rgba(200,205,255,0.10)'); g.addColorStop(1, 'rgba(200,205,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 240 + i * 40, 0, 6.283); ctx.fill(); ctx.restore();
      });
    } else if (fx === 'crystal') {
      O.forEach(o => {
        const x = this.wrap(o.x * W * 1.3 + sx * 0.07, W * 1.3) - W * 0.15, y = this.wrap(o.y * H * 1.3 + sy * 0.07 + Math.sin(t * 0.5 + o.p) * 10, H * 1.3) - H * 0.15, s = 10 + o.s * 16;
        ctx.save(); ctx.translate(x, y); ctx.rotate(o.a + t * 0.12 * (o.v - 1));
        ctx.beginPath(); for (let k = 0; k < 6; k++) { const an = k * 1.047, rr = k % 2 ? s * 0.55 : s; ctx.lineTo(Math.cos(an) * rr * 0.6, Math.sin(an) * rr); } ctx.closePath();
        ctx.fillStyle = U.hsl(o.h, 80, 72, 0.07); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(0, s); ctx.stroke(); ctx.restore();
      });
    } else if (fx === 'storm') {
      ctx.strokeStyle = 'rgba(210,225,255,0.16)'; ctx.lineWidth = 1.2;
      O.forEach(o => {
        const x = this.wrap(o.x * W + t * o.v * 60 + sx * 0.1, W), y = this.wrap(o.y * H + t * o.v * 460, H);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 16 + o.s * 6); ctx.stroke();
      });
      const cyc = 6.5, ph = (t + 2) % cyc, k = ph / 0.14;
      if (k < 1) {
        let seed = Math.floor((t + 2) / cyc) * 7919; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
        ctx.fillStyle = 'rgba(255,255,255,' + (0.09 * (1 - k)).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H);
        let x = W * (0.15 + rnd() * 0.7), y = 0; ctx.strokeStyle = 'rgba(255,255,255,' + (0.55 * (1 - k)).toFixed(3) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y);
        while (y < H * 0.55) { x += (rnd() - 0.5) * 60; y += 30 + rnd() * 40; ctx.lineTo(x, y); }
        ctx.stroke();
      }
    } else if (fx === 'abyss') {
      O.forEach(o => {
        const x = this.wrap(o.x * W + sx * 0.05 + Math.sin(t * 0.4 + o.p) * 12, W), y = this.wrap(o.y * H - t * o.v * 6 + sy * 0.05, H);
        const a = 0.25 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.6 * o.v + o.p)), col = o.s > 1 ? '76,240,255' : '91,108,255';
        const g = ctx.createRadialGradient(x, y, 0, x, y, 4 + o.s * 5); g.addColorStop(0, 'rgba(' + col + ',' + a + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 4 + o.s * 5, 0, 6.283); ctx.fill();
      });
    } else if (fx === 'vortex') {
      const cx = W * 0.5, cy = H * 0.46;
      ctx.lineWidth = 16;
      O.forEach((o, i) => {
        ctx.strokeStyle = U.hsl(300 + i * 12, 80, 70, 0.045);
        ctx.beginPath();
        for (let k = 0; k <= 60; k++) { const rr = 40 + k * 11 + i * 9; const an = -t * 0.18 * o.v + k * 0.16 + i * 1.05; const x = cx + Math.cos(an) * rr * 1.1, y = cy + Math.sin(an) * rr; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
      });
    } else if (fx === 'horizon') {
      const cx = W * 0.5, cy = H * 0.5, R = Math.hypot(W, H) * 0.55;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 160); g.addColorStop(0, 'rgba(255,220,150,0.16)'); g.addColorStop(1, 'rgba(255,220,150,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 160, 0, 6.283); ctx.fill();
      O.forEach(o => {
        const d = 1 - ((t * o.v * 0.11 + o.p) % 1), a = o.a + t * 0.04;
        const x = cx + Math.cos(a) * d * R, y = cy + Math.sin(a) * d * R, L = (1 - d) * 22 + 3;
        ctx.strokeStyle = 'rgba(255,240,210,' + ((1 - d) * 0.55).toFixed(3) + ')'; ctx.lineWidth = 1 + (1 - d) * 1.2;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - Math.cos(a) * L, y - Math.sin(a) * L); ctx.stroke();
      });
    }
    ctx.restore();
  }
  // poeira (parallax médio, vira traço ao acelerar) e estrias (parallax alto, só com fluxo): a sensação de atravessar o espaço
  drawFlowLayers(ctx, t) {
    const W = this.W, H = this.H, sx = this.sx || 0, sy = this.sy || 0, f = this.flow, d = this.dir, sp = (this.speed || 0);
    const len = Math.min(60, sp * 0.03);
    ctx.save(); ctx.lineCap = 'round';
    this.dust.forEach(p => {
      const par = 0.22;
      const x = this.wrap(p.x * W + sx * par, W), y = this.wrap(p.y * H + sy * par, H);
      ctx.globalAlpha = p.a * (0.35 + f * 0.5);
      if (len > 4) { ctx.strokeStyle = '#dbe8ff'; ctx.lineWidth = p.s; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - d.x * len * p.s * 0.6, y - d.y * len * p.s * 0.6); ctx.stroke(); }
      else { ctx.fillStyle = '#dbe8ff'; ctx.beginPath(); ctx.arc(x, y, p.s * 0.8, 0, 6.283); ctx.fill(); }
    });
    if (f > 0.25) {
      const k = (f - 0.25) / 0.75, L = 90 + k * 170;
      this.streaks.forEach(s => {
        const par = 0.6;
        const x = this.wrap(s.x * W * 1.4 + sx * par, W * 1.4) - W * 0.2, y = this.wrap(s.y * H * 1.4 + sy * par, H * 1.4) - H * 0.2;
        const g = ctx.createLinearGradient(x, y, x - d.x * L * s.l, y - d.y * L * s.l);
        g.addColorStop(0, 'rgba(255,255,255,' + (0.38 * k * s.a).toFixed(3) + ')'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = 1; ctx.strokeStyle = g; ctx.lineWidth = 1.2 + k * 1.2;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - d.x * L * s.l, y - d.y * L * s.l); ctx.stroke();
      });
      void t;
    }
    ctx.restore(); ctx.globalAlpha = 1;
  }
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
    const fx = this.fx || th.fx;
    if (fx === 'water') {
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
    } else if (fx && fx !== 'ember') this.drawBiome(ctx, t, fx, sx, sy);
    else if (fx === 'ember') {
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
        const par = (0.03 + (i % 3) * 0.02) * (1 + this.flow * 2);
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
        const par = (0.012 + (i % 3) * 0.012) * (1 + this.flow * 2);
        const x = this.wrap(s.x * W + sx * par, W);
        const y = this.wrap(s.y * H + sy * par, H);
        const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * s.sp * 4 + s.p));
        ctx.globalAlpha = a * 0.8; ctx.beginPath(); ctx.arc(x, y, s.s, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
    }
    this.drawFlowLayers(ctx, t);
    if (this.season && HR.Seasons) HR.Seasons.sprinkle(ctx, W, H, t, this.season.sprinkle);
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
