/* =====================================================================
   Desenho da Égide (bolha em volta da bola, 10 estilos) e do Jato (chama atrás).
   Coordenadas no referencial do mundo já girado: o Jato aponta para −x (atrás da bola).
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const TAU = Math.PI * 2;
  const col = (c, t, k) => c === 'rainbow' ? HR.U.hsl((t * 240 + (k || 0) * 60) % 360, 95, 62, 1) : c;
  // Baixo/Normal: a bolha da Egide fica lisa (sem o padrao recortado dentro dela)
  // e a chama do Jato tem duas linguas em vez de tres. A cor, a borda e o brilho
  // — o que diz "estou protegido" e "estou voando" — continuam iguais.
  const OBJ = () => (!HR.Perf || HR.Perf.obj);

  // T = segundos restantes (pisca nos 3 finais) · sk = HR.GEAR.aegisSkins[i]
  HR.Render.drawAegis = function (ctx, x, y, br, sk, t, T) {
    const U = HR.U, R = br * 2.05 * (1 + 0.025 * Math.sin(t * 3.2)), c1 = sk.color, c2 = sk.color2;
    const blink = T != null && T < 3 ? (Math.floor(t * 7) % 2 ? 1 : 0.35) : 1;
    ctx.save();
    ctx.globalAlpha *= blink;
    // corpo translúcido
    const g = ctx.createRadialGradient(x - R * 0.3, y - R * 0.35, R * 0.1, x, y, R);
    g.addColorStop(0, U.rgba(c1, 0.04)); g.addColorStop(0.72, U.rgba(c1, 0.12)); g.addColorStop(1, U.rgba(c1, 0.32));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
    // padrão do estilo (recortado na bolha)
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.clip();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    switch (OBJ() ? sk.style : '') {
      case 'hex': case 'hive': {
        const s = sk.style === 'hive' ? R * 0.26 : R * 0.34, h = s * Math.sqrt(3), rot = t * 0.25;
        ctx.translate(x, y); ctx.rotate(rot);
        ctx.strokeStyle = U.rgba(sk.style === 'hive' ? c1 : c2, sk.style === 'hive' ? 0.5 : 0.28); ctx.lineWidth = sk.style === 'hive' ? 1.6 : 1.1;
        for (let row = -3; row <= 3; row++) for (let colI = -3; colI <= 3; colI++) {
          const cx = colI * s * 1.5, cy = row * h + (colI % 2 ? h / 2 : 0);
          ctx.beginPath(); for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; const px = cx + Math.cos(a) * s, py = cy + Math.sin(a) * s; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); ctx.stroke();
        }
        break;
      }
      case 'aurora': {
        for (let k = 0; k < 3; k++) {
          ctx.strokeStyle = U.rgba(k % 2 ? c2 : c1, 0.35 - k * 0.08); ctx.lineWidth = R * (0.22 - k * 0.05);
          ctx.beginPath();
          for (let i = 0; i <= 24; i++) { const f = i / 24, px = x - R + f * R * 2, py = y - R * 0.2 + k * R * 0.28 + Math.sin(f * 6 + t * (1.4 + k * 0.4)) * R * 0.14; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
          ctx.stroke();
        }
        break;
      }
      case 'void': {
        ctx.fillStyle = U.rgba(c2, 0.35); ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
        ctx.translate(x, y); ctx.rotate(-t * 0.9);
        for (let k = 0; k < 3; k++) { ctx.strokeStyle = U.rgba(c1, 0.5 - k * 0.12); ctx.lineWidth = 1.6; ctx.beginPath(); for (let i = 0; i <= 30; i++) { const f = i / 30, rr = R * (0.35 + f * 0.65), a = f * 4 + k * 2.09; i ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.stroke(); }
        break;
      }
      case 'snow': {
        for (let k = 0; k < 14; k++) { const a = k * 2.4 + t * 0.2, d = R * (0.3 + ((k * 37) % 10) / 14); ctx.fillStyle = U.rgba(c2, 0.55); ctx.beginPath(); ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, 1.1 + (k % 3) * 0.5, 0, TAU); ctx.fill(); }
        break;
      }
    }
    ctx.restore();
    // borda + brilho
    const rimCol = col(c1, t);
    ctx.strokeStyle = U.rgba(sk.color === 'rainbow' ? '#ffffff' : c1, 0.85); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.stroke();
    ctx.strokeStyle = U.rgba(c1, 0.25); ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(x, y, R + 1, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.arc(x, y, R * 0.82, Math.PI * 1.12, Math.PI * 1.45); ctx.stroke();
    void rimCol;
    // enfeites na borda por estilo
    ctx.lineCap = 'round';
    switch (sk.style) {
      case 'petals':
        for (let k = 0; k < 8; k++) { const a = k * TAU / 8 + t * 0.8; ctx.save(); ctx.translate(x + Math.cos(a) * R, y + Math.sin(a) * R); ctx.rotate(a + t); ctx.fillStyle = U.rgba(k % 2 ? c1 : c2, 0.9); ctx.beginPath(); ctx.ellipse(0, 0, 6, 3, 0, 0, TAU); ctx.fill(); ctx.restore(); }
        break;
      case 'snow':
        for (let k = 0; k < 6; k++) { const a = k * TAU / 6 - t * 0.5, px = x + Math.cos(a) * R, py = y + Math.sin(a) * R; ctx.strokeStyle = U.rgba(c2, 0.95); ctx.lineWidth = 1.3; for (let j = 0; j < 3; j++) { const b = j * Math.PI / 3 + t; ctx.beginPath(); ctx.moveTo(px - Math.cos(b) * 5, py - Math.sin(b) * 5); ctx.lineTo(px + Math.cos(b) * 5, py + Math.sin(b) * 5); ctx.stroke(); } }
        break;
      case 'flame':
        for (let k = 0; k < 16; k++) { const a = k * TAU / 16 + t * 0.6, L = 6 + 5 * Math.abs(Math.sin(t * 9 + k * 1.7)); ctx.strokeStyle = U.rgba(k % 2 ? c1 : c2, 0.8); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * R, y + Math.sin(a) * R); ctx.lineTo(x + Math.cos(a) * (R + L), y + Math.sin(a) * (R + L)); ctx.stroke(); }
        break;
      case 'rays':
        for (let k = 0; k < 12; k++) { const a = k * TAU / 12 + t * 0.4, L = k % 2 ? 6 : 11; ctx.strokeStyle = U.rgba(c2, 0.85); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * (R + 3), y + Math.sin(a) * (R + 3)); ctx.lineTo(x + Math.cos(a) * (R + 3 + L), y + Math.sin(a) * (R + 3 + L)); ctx.stroke(); }
        break;
      case 'runes':
        for (let ring = 0; ring < 2; ring++) {
          const rr = R + 5 + ring * 6, dir = ring ? -1 : 1, n = ring ? 10 : 14;
          for (let k = 0; k < n; k++) { const a = k * TAU / n + t * 0.5 * dir; ctx.save(); ctx.translate(x + Math.cos(a) * rr, y + Math.sin(a) * rr); ctx.rotate(a); ctx.strokeStyle = U.rgba(ring ? c2 : c1, 0.85); ctx.lineWidth = 1.4; ctx.beginPath(); if (k % 3 === 0) { ctx.moveTo(-3, -2); ctx.lineTo(0, 2); ctx.lineTo(3, -2); } else if (k % 3 === 1) { ctx.moveTo(0, -3); ctx.lineTo(0, 3); ctx.moveTo(-2, 0); ctx.lineTo(2, 0); } else { ctx.arc(0, 0, 2, 0, TAU); } ctx.stroke(); ctx.restore(); }
        }
        break;
      case 'bolts':
        for (let k = 0; k < 4; k++) {
          const a0 = t * 2.2 + k * TAU / 4 + Math.sin(t * 7 + k) * 0.3, span = 0.9;
          ctx.strokeStyle = U.rgba(k % 2 ? c2 : c1, 0.9); ctx.lineWidth = 1.8; ctx.beginPath();
          for (let i = 0; i <= 8; i++) { const f = i / 8, a = a0 + f * span, rr = R + (i % 2 ? 4 : -2) * Math.sin(t * 30 + i * 3 + k); const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
          ctx.stroke();
        }
        break;
      case 'hive':
        ctx.strokeStyle = U.rgba(c1, 0.9); ctx.lineWidth = 3; ctx.setLineDash([4, 5]); ctx.lineDashOffset = -t * 20; ctx.beginPath(); ctx.arc(x, y, R + 4, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        break;
      case 'aurora':
        ctx.strokeStyle = U.rgba(c2, 0.6); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, R + 3, t, t + Math.PI * 0.9); ctx.stroke();
        ctx.strokeStyle = U.rgba(c1, 0.6); ctx.beginPath(); ctx.arc(x, y, R + 3, t + Math.PI, t + Math.PI * 1.9); ctx.stroke();
        break;
      case 'void':
        for (let k = 0; k < 10; k++) { const a = k * TAU / 10 - t * 1.3, rr = R + 4 + Math.sin(t * 3 + k) * 3; ctx.fillStyle = U.rgba(c1, 0.8); ctx.beginPath(); ctx.arc(x + Math.cos(a) * rr, y + Math.sin(a) * rr, 1.6, 0, TAU); ctx.fill(); }
        break;
      default: // hex
        for (let k = 0; k < 6; k++) { const a = k * TAU / 6 + t * 0.6; ctx.fillStyle = U.rgba(c2, 0.9); ctx.beginPath(); ctx.arc(x + Math.cos(a) * R, y + Math.sin(a) * R, 2, 0, TAU); ctx.fill(); }
    }
    ctx.restore();
  };

  // chama do Jato: línguas de fogo atrás da bola (−x), núcleo quente, estrias de velocidade · k = escala (Mega Jato)
  HR.Render.drawJet = function (ctx, x, y, br, sk, t, k) {
    const U = HR.U; k = k || 1;
    const c1 = col(sk.color, t), c2 = sk.color2, L = br * (3.4 + 0.6 * Math.sin(t * 22)) * k, W = br * 0.95 * k;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const tongue = (len, wid, alpha, c, off) => {
      const g = ctx.createLinearGradient(x, y, x - len, y); g.addColorStop(0, U.rgba(c, alpha)); g.addColorStop(1, U.rgba(c, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x + br * 0.2, y - wid + off);
      ctx.quadraticCurveTo(x - len * 0.45, y - wid * 0.7 + off + Math.sin(t * 17) * 2, x - len, y + off + Math.sin(t * 13) * 3);
      ctx.quadraticCurveTo(x - len * 0.45, y + wid * 0.7 + off + Math.sin(t * 19) * 2, x + br * 0.2, y + wid + off);
      ctx.closePath(); ctx.fill();
    };
    const obj = OBJ();
    tongue(L * 1.1, W * 1.15, 0.45, c1, 0);
    if (obj) tongue(L * 0.8, W * 0.8, 0.7, sk.color === 'rainbow' ? col('rainbow', t, 2) : c1, Math.sin(t * 11) * 2);
    tongue(L * 0.5, W * 0.45, 0.95, c2, 0);
    // estrias
    ctx.strokeStyle = U.rgba(c2, 0.55); ctx.lineWidth = 1.5;
    const passo = obj ? 1 : 2;
    for (let i = 0; i < 5; i += passo) { const yy = y + (i - 2) * br * 0.7, off = ((t * 900 + i * 137) % 260); ctx.beginPath(); ctx.moveTo(x - br * 1.2 - off, yy); ctx.lineTo(x - br * 1.2 - off - 30 - i * 6, yy); ctx.stroke(); }
    ctx.restore();
  };
})();
