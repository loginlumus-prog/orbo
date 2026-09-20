/* =====================================================================
   ORBO v5.1: 28 rastros novos, cada um com desenho próprio.
   pts: do mais antigo (0) ao mais novo (n-1), {x, y, t} · heat 0..1 (sequência de perfeitos)
   Os rastros antigos continuam em render.js (drawTrail original).
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const TAU = Math.PI * 2;
  const U = () => HR.U;
  // normal unitária no ponto i
  function nrm(pts, i) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
    return { x: -dy / l, y: dx / l };
  }
  const hash = (i, s) => { const v = Math.sin(i * 127.1 + (s || 0) * 311.7) * 43758.5453; return v - Math.floor(v); };
  function heart(ctx, s) { ctx.beginPath(); ctx.moveTo(0, s * 0.35); ctx.bezierCurveTo(-s * 1.1, -s * 0.35, -s * 0.45, -s * 1.05, 0, -s * 0.45); ctx.bezierCurveTo(s * 0.45, -s * 1.05, s * 1.1, -s * 0.35, 0, s * 0.35); ctx.closePath(); }
  function star4(ctx, s) { ctx.beginPath(); for (let k = 0; k < 8; k++) { const r = k % 2 ? s * 0.28 : s, a = k * Math.PI / 4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); }
  function leaf(ctx, s) { ctx.beginPath(); ctx.moveTo(-s, 0); ctx.quadraticCurveTo(0, -s * 0.7, s, 0); ctx.quadraticCurveTo(0, s * 0.7, -s, 0); ctx.closePath(); }
  function polyline(ctx, pts, from, to, off) {
    ctx.beginPath();
    for (let i = Math.max(0, from); i < to; i++) { const p = pts[i], o = off ? off(i) : null, x = p.x + (o ? o.x : 0), y = p.y + (o ? o.y : 0); i === Math.max(0, from) ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
  }
  const fade = (ctx, pts, c) => { const a = pts[0], b = pts[pts.length - 1], g = ctx.createLinearGradient(a.x, a.y, b.x, b.y); g.addColorStop(0, U().rgba(c[0], 0)); g.addColorStop(1, U().rgba(c[0], c[1])); return g; };

  const T = {};

  // fita de seda que torce
  T.ribbon = (ctx, pts, sk, t, heat) => {
    const u = U(), n = pts.length, wm = 1 + heat * 0.8, c2 = sk.dark || sk.base || '#ffffff';
    for (let i = 1; i < n; i++) {
      const k = i / n, a = pts[i - 1], b = pts[i], na = nrm(pts, i - 1), nb = nrm(pts, i);
      const ca = Math.cos((i - 1) * 0.32 - t * 5), cb = Math.cos(i * 0.32 - t * 5);
      const wa = (1 + (i - 1) / n * 13) * wm * ca, wb = (1 + k * 13) * wm * cb;
      ctx.fillStyle = u.rgba(cb > 0 ? sk.glow : c2, Math.min(1, k * 0.85));
      ctx.beginPath(); ctx.moveTo(a.x + na.x * wa, a.y + na.y * wa); ctx.lineTo(b.x + nb.x * wb, b.y + nb.y * wb); ctx.lineTo(b.x - nb.x * wb, b.y - nb.y * wb); ctx.lineTo(a.x - na.x * wa, a.y - na.y * wa); ctx.closePath(); ctx.fill();
    }
  };

  // tubo de neon (brilho largo + núcleo branco)
  T.neon = (ctx, pts, sk, t, heat) => {
    const u = U(), n = pts.length, col = u.mix(sk.glow, '#ff5ecf', 0.35 + 0.35 * Math.sin(t * 2));
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 1; i < n; i++) {
        const k = i / n;
        ctx.strokeStyle = pass === 2 ? u.rgba('#ffffff', k * 0.9) : u.rgba(col, k * (pass ? 0.5 : 0.16));
        ctx.lineWidth = (pass === 0 ? 16 : pass === 1 ? 6 : 2) * (0.4 + k * 0.6) * (1 + heat * 0.5);
        ctx.beginPath(); ctx.moveTo(pts[i - 1].x, pts[i - 1].y); ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke();
      }
    }
  };

  // hélice dupla (DNA)
  T.helix = (ctx, pts, sk, t, heat) => {
    const u = U(), n = pts.length, A = 7 * (1 + heat * 0.6);
    for (let i = 1; i < n; i++) {
      const k = i / n, p = pts[i], no = nrm(pts, i), ph = i * 0.55 - t * 9, s1 = Math.sin(ph), front = Math.cos(ph) > 0;
      const x1 = p.x + no.x * s1 * A * k, y1 = p.y + no.y * s1 * A * k, x2 = p.x - no.x * s1 * A * k, y2 = p.y - no.y * s1 * A * k;
      if (i % 3 === 0) { ctx.strokeStyle = u.rgba('#ffffff', k * 0.25); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
      ctx.fillStyle = u.rgba(front ? sk.glow : '#ff5ecf', k * (front ? 0.95 : 0.6)); ctx.beginPath(); ctx.arc(x1, y1, 1.2 + k * 2.6, 0, TAU); ctx.fill();
      ctx.fillStyle = u.rgba(front ? '#ff5ecf' : sk.glow, k * (front ? 0.6 : 0.95)); ctx.beginPath(); ctx.arc(x2, y2, 1.2 + k * 2.6, 0, TAU); ctx.fill();
    }
  };

  // fumaça que se espalha e sobe
  T.smoke = (ctx, pts, sk, t) => {
    const u = U(), n = pts.length, col = u.mix('#c9d2e6', sk.glow, 0.25);
    for (let i = 0; i < n - 1; i += 2) {
      const p = pts[i], k = i / n, age = t - p.t, r = 5 + age * 38 + (1 - k) * 6, y = p.y - age * 14;
      const g = ctx.createRadialGradient(p.x, y, 0, p.x, y, r); g.addColorStop(0, u.rgba(col, Math.min(0.35, k * 0.4))); g.addColorStop(1, u.rgba(col, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, y, r, 0, TAU); ctx.fill();
    }
  };

  // pincelada de tinta com respingos
  T.ink = (ctx, pts, sk) => {
    const u = U(), n = pts.length, L = [], R = [];
    for (let i = 0; i < n; i++) { const k = i / n, no = nrm(pts, i), w = (0.5 + k * 9) * (1 + 0.25 * Math.sin(i * 1.7)); L.push([pts[i].x + no.x * w, pts[i].y + no.y * w]); R.push([pts[i].x - no.x * w, pts[i].y - no.y * w]); }
    ctx.beginPath(); L.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); for (let i = R.length - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]); ctx.closePath();
    const g = ctx.createLinearGradient(pts[0].x, pts[0].y, pts[n - 1].x, pts[n - 1].y); g.addColorStop(0, 'rgba(34,18,64,0)'); g.addColorStop(1, 'rgba(34,18,64,0.95)');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = fade(ctx, pts, [sk.glow, 0.7]); ctx.lineWidth = 1.4; ctx.stroke();
    for (let i = 2; i < n; i += 4) { const k = i / n, h = hash(i, 3); ctx.fillStyle = 'rgba(60,34,110,' + (k * 0.9).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(pts[i].x + (h - 0.5) * 22, pts[i].y + (hash(i, 7) - 0.5) * 22, 1 + h * 2.5, 0, TAU); ctx.fill(); }
  };

  // notas musicais subindo
  T.notes = (ctx, pts, sk, t) => {
    const u = U(), n = pts.length, cols = ['#ff5ecf', '#4cf0ff', '#ffcf4a', '#7cff6b'];
    for (let i = n - 2; i >= 0; i -= 3) {
      const p = pts[i], k = i / n, age = t - p.t, s = 4 + k * 6;
      ctx.save(); ctx.translate(p.x, p.y - age * 40); ctx.rotate(Math.sin(age * 4 + i) * 0.4);
      ctx.fillStyle = ctx.strokeStyle = u.rgba(cols[(i / 3 | 0) % 4], Math.min(1, k * 1.1)); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.62, s * 0.45, -0.4, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(s * 0.55, -s * 0.1); ctx.lineTo(s * 0.55, -s * 2); ctx.stroke();
      if (i % 2) { ctx.beginPath(); ctx.moveTo(s * 0.55, -s * 2); ctx.quadraticCurveTo(s * 1.3, -s * 1.6, s * 1.1, -s); ctx.stroke(); }
      ctx.restore();
    }
  };

  // corações
  T.hearts = (ctx, pts, sk, t) => {
    const u = U(), n = pts.length;
    for (let i = n - 2; i >= 0; i -= 3) {
      const p = pts[i], k = i / n, age = t - p.t, s = (3 + k * 7) * (1 + 0.12 * Math.sin(t * 10 + i));
      ctx.save(); ctx.translate(p.x + Math.sin(age * 5 + i) * 4, p.y - age * 30);
      ctx.fillStyle = u.rgba(i % 2 ? '#ff5e8a' : '#ff9ac0', Math.min(1, k)); heart(ctx, s); ctx.fill();
      ctx.fillStyle = u.rgba('#ffffff', k * 0.5); ctx.beginPath(); ctx.arc(-s * 0.35, -s * 0.45, s * 0.18, 0, TAU); ctx.fill();
      ctx.restore();
    }
  };

  // folhas de outono caindo
  T.leaves = (ctx, pts, sk, t) => {
    const u = U(), n = pts.length, cols = ['#ff9f43', '#ffcf4a', '#ff5e3a', '#8bd35a', '#d9772b'];
    for (let i = n - 2; i >= 0; i -= 2) {
      const p = pts[i], k = i / n, age = t - p.t, s = 3 + k * 6;
      ctx.save(); ctx.translate(p.x + Math.sin(age * 3 + i) * 8, p.y + age * 45); ctx.rotate(age * 3 + i); ctx.scale(1, 0.6 + 0.4 * Math.cos(age * 6 + i));
      ctx.fillStyle = u.rgba(cols[i % 5], Math.min(1, k * 1.1)); leaf(ctx, s); ctx.fill();
      ctx.strokeStyle = 'rgba(80,40,10,' + (k * 0.5).toFixed(2) + ')'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(s, 0); ctx.stroke();
      ctx.restore();
    }
  };

  // fogos de artifício estourando
  T.fireworks = (ctx, pts, sk, t) => {
    const u = U(), n = pts.length;
    for (let i = 1; i < n; i++) { const k = i / n; ctx.strokeStyle = u.rgba('#fff3c2', k * 0.5); ctx.lineWidth = 1 + k * 2; ctx.beginPath(); ctx.moveTo(pts[i - 1].x, pts[i - 1].y); ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke(); }
    for (let i = n - 3; i >= 0; i -= 5) {
      const p = pts[i], k = i / n, age = Math.max(0, t - p.t), hue = (i * 47 + 20) % 360, L = 4 + age * 70, a = Math.max(0, 1 - age * 1.6) * Math.min(1, k * 1.4);
      if (a <= 0) continue;
      for (let j = 0; j < 10; j++) {
        const an = j * TAU / 10 + i, x1 = p.x + Math.cos(an) * L * 0.35, y1 = p.y + Math.sin(an) * L * 0.35, x2 = p.x + Math.cos(an) * L, y2 = p.y + Math.sin(an) * L + age * age * 30;
        ctx.strokeStyle = u.hsl(hue + j * 6, 95, 65, a); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.fillStyle = u.hsl(hue, 100, 85, a); ctx.beginPath(); ctx.arc(x2, y2, 1.5, 0, TAU); ctx.fill();
      }
    }
  };

  // pó de estrelas cintilando
  T.stardust = (ctx, pts, sk, t) => {
    const u = U(), n = pts.length, cols = ['#ffffff', '#ffe27a', '#9be7ff', '#ffb3f0'];
    for (let i = 0; i < n; i++) {
      const p = pts[i], k = i / n;
      for (let j = 0; j < 3; j++) {
        const h1 = hash(i, j), h2 = hash(i, j + 9), tw = 0.5 + 0.5 * Math.sin(t * 12 + i * 1.3 + j * 2);
        ctx.save(); ctx.translate(p.x + (h1 - 0.5) * 26 * (1.2 - k), p.y + (h2 - 0.5) * 26 * (1.2 - k)); ctx.rotate(t * 2 + j);
        ctx.fillStyle = u.rgba(cols[(i + j) % 4], Math.min(1, k * tw * 1.2)); star4(ctx, 1 + h1 * 3.5 * k); ctx.fill(); ctx.restore();
      }
    }
  };

  // blocos de 8 bits
  T.pixel = (ctx, pts, sk) => {
    const u = U(), n = pts.length, cols = [sk.glow, '#ff5ecf', '#ffcf4a', '#ffffff'], G = 6;
    for (let i = 0; i < n; i++) {
      const p = pts[i], k = i / n, s = Math.max(G * 0.5, Math.round((2 + k * 10) / G) * G), x = Math.round(p.x / G) * G, y = Math.round(p.y / G) * G;
      ctx.fillStyle = u.rgba(cols[(i >> 1) % 4], Math.min(1, k * 1.1)); ctx.fillRect(x - s / 2, y - s / 2, s, s);
      if (k > 0.5 && i % 3 === 0) { ctx.fillStyle = u.rgba('#ffffff', k * 0.6); ctx.fillRect(x - s / 2, y - s / 2, s / 3, s / 3); }
    }
  };

  // falha digital (RGB separado)
  T.glitch = (ctx, pts, sk, t) => {
    const u = U(), n = pts.length, bucket = Math.floor(t * 14);
    ctx.globalCompositeOperation = 'lighter';
    [['#ff2a6d', -3], ['#05d9e8', 3], ['#ffffff', 0]].forEach(([c, off], pass) => {
      for (let i = 1; i < n; i++) {
        const k = i / n, h = hash(i, bucket), dx = off + (h > 0.8 ? (hash(i, bucket + 1) - 0.5) * 18 : 0), w = 3 + k * 10, hh = 2 + k * (pass === 2 ? 3 : 7);
        ctx.fillStyle = u.rgba(c, k * (pass === 2 ? 0.55 : 0.4)); ctx.fillRect(pts[i].x - w / 2 + dx, pts[i].y - hh / 2 + (h - 0.5) * 3, w, hh);
      }
    });
  };

  // feixe de laser tracejado
  T.laser = (ctx, pts, sk, t, heat) => {
    const n = pts.length; ctx.lineCap = 'butt'; ctx.setLineDash([16, 10]); ctx.lineDashOffset = -t * 320;
    [[10, ['#ff2850', 0.22]], [4, ['#ff3c5a', 0.9]], [1.6, ['#ffffff', 1]]].forEach(([w, c]) => { ctx.strokeStyle = fade(ctx, pts, c); ctx.lineWidth = w * (1 + heat * 0.4); polyline(ctx, pts, Math.floor(n * 0.15), n); ctx.stroke(); });
    ctx.setLineDash([]);
  };

  // penas planando
  T.feathers = (ctx, pts, sk, t) => {
    const u = U(), n = pts.length;
    for (let i = n - 2; i >= 0; i -= 3) {
      const p = pts[i], k = i / n, age = t - p.t, s = 4 + k * 8;
      ctx.save(); ctx.translate(p.x + Math.sin(age * 2.5 + i) * 10, p.y + age * 26); ctx.rotate(Math.sin(age * 3 + i) * 0.9 + 0.6);
      ctx.fillStyle = u.rgba(i % 2 ? '#ffffff' : '#e6dcff', Math.min(0.95, k));
      ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(s * 0.55, -s * 0.2, 0, s); ctx.quadraticCurveTo(-s * 0.55, -s * 0.2, 0, -s); ctx.fill();
      ctx.strokeStyle = u.rgba('#b8a8e8', k * 0.8); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(0, s * 1.25); ctx.stroke();
      ctx.restore();
    }
  };

  // gotas de água caindo
  T.drops = (ctx, pts, sk, t) => {
    const u = U(), n = pts.length;
    for (let i = n - 2; i >= 0; i -= 2) {
      const p = pts[i], k = i / n, age = t - p.t, s = 2 + k * 4, y = p.y + age * age * 160;
      ctx.save(); ctx.translate(p.x, y);
      ctx.fillStyle = u.rgba('#7fd4ff', Math.min(0.9, k));
      ctx.beginPath(); ctx.moveTo(0, -s * 1.8); ctx.quadraticCurveTo(s, -s * 0.2, s, s * 0.35); ctx.arc(0, s * 0.35, s, 0, Math.PI); ctx.quadraticCurveTo(-s, -s * 0.2, 0, -s * 1.8); ctx.fill();
      ctx.fillStyle = u.rgba('#ffffff', k * 0.7); ctx.beginPath(); ctx.arc(-s * 0.35, s * 0.1, s * 0.28, 0, TAU); ctx.fill();
      ctx.restore();
    }
  };

  // clones: ecos translúcidos da própria bola
  T.clones = (ctx, pts, sk) => {
    const u = U(), n = pts.length;
    for (let i = 1; i < n - 2; i += 4) {
      const p = pts[i], k = i / n, r = 6 + k * 9;
      const g = ctx.createRadialGradient(p.x - r * 0.3, p.y - r * 0.3, 0, p.x, p.y, r);
      g.addColorStop(0, u.rgba('#ffffff', k * 0.35)); g.addColorStop(0.5, u.rgba(sk.base || sk.glow, k * 0.3)); g.addColorStop(1, u.rgba(sk.glow, k * 0.08));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = u.rgba(sk.glow, k * 0.55); ctx.lineWidth = 1.2; ctx.stroke();
    }
  };

  // halos: arcos que se abrem
  T.halos = (ctx, pts, sk, t) => {
    const u = U(), n = pts.length;
    for (let i = 0; i < n - 2; i += 4) {
      const p = pts[i], k = i / n, age = t - p.t, ry = 5 + age * 55, a = Math.max(0, k * (1 - age * 0.9));
      if (a <= 0) continue;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(-0.25);
      ctx.strokeStyle = u.rgba(sk.glow, a); ctx.lineWidth = 2.2; ctx.beginPath(); ctx.ellipse(0, 0, ry * 0.42, ry, 0, 0, TAU); ctx.stroke();
      ctx.strokeStyle = u.rgba('#ffffff', a * 0.35); ctx.lineWidth = 5; ctx.stroke();
      ctx.restore();
    }
  };

  // runas acesas
  const RUNE = ['M-3 -4L0 4L3 -4', 'M-3 4V-4L3 0L-3 4', 'M0 -4V4M-3 -1L3 1', 'M-3 -4H3L-3 4H3', 'M-3 0H3M0 -4L3 0L0 4', 'M-2 -4L2 4M2 -4L-2 4M-3 0H3'];
  let runePaths = null;
  T.runes = (ctx, pts, sk, t) => {
    if (!runePaths) runePaths = typeof Path2D !== 'undefined' ? RUNE.map(d => new Path2D(d)) : [];
    if (!runePaths.length) return;
    const u = U(), n = pts.length;
    for (let i = n - 2; i >= 0; i -= 3) {
      const p = pts[i], k = i / n, age = t - p.t, s = 0.6 + k * 1.1, path = runePaths[(i / 3 | 0) % runePaths.length];
      ctx.save(); ctx.translate(p.x, p.y - age * 12); ctx.rotate(age * 1.5); ctx.scale(s, s);
      ctx.strokeStyle = u.rgba('#b48cff', Math.min(1, k * 0.7)); ctx.lineWidth = 5; ctx.stroke(path);
      ctx.strokeStyle = u.rgba('#ffffff', Math.min(1, k * 1.1)); ctx.lineWidth = 1.6; ctx.stroke(path);
      ctx.restore();
    }
  };

  // borboletas batendo asas
  T.butterflies = (ctx, pts, sk, t) => {
    const u = U(), n = pts.length;
    for (let i = n - 3; i >= 0; i -= 5) {
      const p = pts[i], k = i / n, age = t - p.t, s = 4 + k * 5, hue = (i * 61) % 360, flap = 0.25 + 0.75 * Math.abs(Math.sin(t * 16 + i));
      ctx.save(); ctx.translate(p.x + Math.sin(age * 4 + i) * 10, p.y - age * 36); ctx.rotate(Math.sin(age * 2 + i) * 0.5);
      ctx.fillStyle = u.hsl(hue, 90, 65, Math.min(0.95, k * 1.1));
      [-1, 1].forEach(sd => { ctx.save(); ctx.scale(sd * flap, 1); ctx.beginPath(); ctx.ellipse(s * 0.55, -s * 0.35, s * 0.62, s * 0.5, 0.5, 0, TAU); ctx.fill(); ctx.beginPath(); ctx.ellipse(s * 0.4, s * 0.35, s * 0.4, s * 0.32, -0.4, 0, TAU); ctx.fill(); ctx.restore(); });
      ctx.fillStyle = 'rgba(30,20,40,' + (k * 0.9).toFixed(2) + ')'; ctx.fillRect(-0.6, -s * 0.6, 1.2, s * 1.2);
      ctx.restore();
    }
  };

  // chuva de meteoros
  T.meteors = (ctx, pts, sk, t) => {
    const u = U(), n = pts.length;
    for (let i = 3; i < n; i += 3) {
      const p = pts[i], k = i / n, age = t - p.t, L = 8 + k * 16, x = p.x - age * 30, y = p.y + age * 50;
      const g = ctx.createLinearGradient(x - L, y - L * 0.7, x, y); g.addColorStop(0, 'rgba(255,120,40,0)'); g.addColorStop(1, u.rgba('#ffb347', k * 0.9));
      ctx.strokeStyle = g; ctx.lineWidth = 1.5 + k * 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - L, y - L * 0.7); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = u.rgba('#fff0c8', k); ctx.beginPath(); ctx.arc(x, y, 1.4 + k * 2.4, 0, TAU); ctx.fill();
      ctx.fillStyle = u.rgba('#7a4a2a', k * 0.9); ctx.beginPath(); ctx.arc(x + 0.8, y + 0.6, 0.7 + k * 1.1, 0, TAU); ctx.fill();
    }
  };

  // aurora: faixas coloridas ondulando
  T.aurora = (ctx, pts, sk, t) => {
    const u = U(), n = pts.length;
    ctx.globalCompositeOperation = 'lighter';
    [['#7cff6b', 0], ['#4cf0ff', 2.1], ['#b48cff', 4.2]].forEach(([c, ph], bi) => {
      for (let i = 1; i < n; i++) {
        const k = i / n, no = nrm(pts, i), off = Math.sin(i * 0.3 + t * 2 + ph) * 10 * k + (bi - 1) * 6 * k, a = pts[i - 1], b = pts[i];
        ctx.strokeStyle = u.rgba(c, k * 0.22); ctx.lineWidth = 6 + k * 14;
        ctx.beginPath(); ctx.moveTo(a.x + no.x * off, a.y + no.y * off); ctx.lineTo(b.x + no.x * off, b.y + no.y * off); ctx.stroke();
      }
    });
  };

  // cristais de gelo
  T.frost = (ctx, pts, sk, t) => {
    const u = U(), n = pts.length;
    for (let i = 1; i < n; i++) { const k = i / n; ctx.strokeStyle = u.rgba('#dff6ff', k * 0.18); ctx.lineWidth = 3 + k * 10; ctx.beginPath(); ctx.moveTo(pts[i - 1].x, pts[i - 1].y); ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke(); }
    for (let i = n - 2; i >= 0; i -= 3) {
      const p = pts[i], k = i / n, age = t - p.t, s = 2.5 + k * 6;
      ctx.save(); ctx.translate(p.x, p.y + age * 10); ctx.rotate(age * 0.8 + i);
      ctx.strokeStyle = u.rgba('#e8fbff', Math.min(1, k * 1.1)); ctx.lineWidth = 1.1;
      for (let j = 0; j < 6; j++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s); ctx.moveTo(0, -s * 0.55); ctx.lineTo(s * 0.3, -s * 0.8); ctx.moveTo(0, -s * 0.55); ctx.lineTo(-s * 0.3, -s * 0.8); ctx.stroke(); }
      ctx.restore();
    }
  };

  // fogo azul
  T.blueflame = (ctx, pts, sk, t, heat) => {
    const u = U(), n = pts.length;
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n - 1; i++) {
      const p = pts[i], k = i / n, age = t - p.t, col = k > 0.75 ? '#ffffff' : k > 0.45 ? '#6fd8ff' : '#6a5cff', jit = Math.sin(i * 7.3 + t * 34) * 3;
      ctx.fillStyle = u.rgba(col, Math.min(1, k * 0.6)); ctx.beginPath(); ctx.arc(p.x + jit * 0.4, p.y + jit - age * 70, (3 + k * 12) * (1 + heat * 0.6), 0, TAU); ctx.fill();
    }
  };

  // trepadeira com folhas e flores
  T.vine = (ctx, pts, sk, t) => {
    const u = U(), n = pts.length; ctx.lineCap = 'round';
    const off = i => { const no = nrm(pts, i), o = Math.sin(i * 0.5) * 4; return { x: no.x * o, y: no.y * o }; };
    for (let i = 1; i < n; i++) { const k = i / n, a = off(i - 1), b = off(i); ctx.strokeStyle = u.rgba('#3fbf5a', Math.min(1, k * 1.1)); ctx.lineWidth = 1 + k * 3; ctx.beginPath(); ctx.moveTo(pts[i - 1].x + a.x, pts[i - 1].y + a.y); ctx.lineTo(pts[i].x + b.x, pts[i].y + b.y); ctx.stroke(); }
    for (let i = 3; i < n - 1; i += 3) {
      const p = pts[i], k = i / n, no = nrm(pts, i), sd = i % 2 ? 1 : -1, s = 2 + k * 5;
      ctx.save(); ctx.translate(p.x + no.x * sd * 5, p.y + no.y * sd * 5); ctx.rotate(Math.atan2(no.y * sd, no.x * sd)); ctx.fillStyle = u.rgba('#7cff6b', Math.min(1, k * 1.1)); leaf(ctx, s); ctx.fill(); ctx.restore();
      if (i % 9 === 0) {
        const fx = p.x - no.x * sd * 6, fy = p.y - no.y * sd * 6;
        ctx.fillStyle = u.rgba('#ff9ad9', k); for (let j = 0; j < 5; j++) { const an = j * TAU / 5 + t; ctx.beginPath(); ctx.arc(fx + Math.cos(an) * 2.4, fy + Math.sin(an) * 2.4, 1.6, 0, TAU); ctx.fill(); }
        ctx.fillStyle = u.rgba('#ffe27a', k); ctx.beginPath(); ctx.arc(fx, fy, 1.2, 0, TAU); ctx.fill();
      }
    }
  };

  // confete girando
  T.confetti = (ctx, pts, sk, t) => {
    const u = U(), n = pts.length, cols = ['#ff5e7e', '#ffcf4a', '#35e29a', '#4cf0ff', '#8f6bff', '#ff9f43'];
    for (let i = n - 2; i >= 0; i -= 2) {
      const p = pts[i], k = i / n, age = t - p.t, h = hash(i, 5);
      ctx.save(); ctx.translate(p.x + (h - 0.5) * 20, p.y + (hash(i, 8) - 0.5) * 14 + age * 70); ctx.rotate(age * (h - 0.5) * 24 + i); ctx.scale(1, Math.cos(age * 10 + i));
      ctx.fillStyle = u.rgba(cols[i % 6], Math.min(1, k * 1.2)); ctx.fillRect(-2.5 - k * 1.5, -1.5, 5 + k * 3, 3);
      ctx.restore();
    }
  };

  // moedas de ouro girando
  T.gold = (ctx, pts, sk, t) => {
    const u = U(), n = pts.length;
    for (let i = 1; i < n; i++) { const k = i / n; ctx.strokeStyle = u.rgba('#ffcf4a', k * 0.22); ctx.lineWidth = 2 + k * 8; ctx.beginPath(); ctx.moveTo(pts[i - 1].x, pts[i - 1].y); ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke(); }
    for (let i = n - 2; i >= 0; i -= 3) {
      const p = pts[i], k = i / n, age = t - p.t, s = 2.5 + k * 4.5;
      ctx.save(); ctx.translate(p.x, p.y + age * 40); ctx.scale(Math.max(0.12, Math.abs(Math.cos(t * 9 + i))), 1);
      const g = ctx.createLinearGradient(-s, -s, s, s); g.addColorStop(0, u.rgba('#fff6c8', k)); g.addColorStop(0.5, u.rgba('#ffcf4a', k)); g.addColorStop(1, u.rgba('#b8860b', k));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s, 0, TAU); ctx.fill(); ctx.strokeStyle = u.rgba('#8a5a08', k * 0.8); ctx.lineWidth = 0.8; ctx.stroke();
      ctx.restore();
      if (i % 2) { ctx.save(); ctx.translate(p.x + 6, p.y - 5); ctx.fillStyle = u.rgba('#ffffff', k * (0.5 + 0.5 * Math.sin(t * 14 + i))); star4(ctx, 2.2); ctx.fill(); ctx.restore(); }
    }
  };

  // zigue-zague elétrico
  T.zigzag = (ctx, pts, sk, t, heat) => {
    const u = U(), n = pts.length, b = Math.floor(t * 20), col = u.mix(sk.glow, '#fff07a', 0.4);
    const off = i => { const no = nrm(pts, i), a = (i % 2 ? 1 : -1) * (3 + hash(i, b) * 6) * (i / n); return { x: no.x * a, y: no.y * a }; };
    ctx.lineJoin = 'miter'; ctx.lineCap = 'round';
    [[9, 0.16], [3.2, 0.75], [1.2, 1]].forEach(([w, al], pass) => { ctx.strokeStyle = fade(ctx, pts, [pass === 2 ? '#ffffff' : col, al]); ctx.lineWidth = w * (1 + heat * 0.5); polyline(ctx, pts, Math.floor(n * 0.2), n, off); ctx.stroke(); });
  };

  // prisma: a luz se abre em cores
  T.prism = (ctx, pts, sk, t) => {
    const u = U(), n = pts.length;
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (let j = 0; j < 6; j++) {
      const spread = (j - 2.5) * 2.6;
      for (let i = 1; i < n; i++) {
        const k = i / n, fan = spread * (1.4 - k), no = nrm(pts, i), a = pts[i - 1], b = pts[i];
        ctx.strokeStyle = u.hsl((j * 55 + t * 40) % 360, 100, 60, k * 0.5); ctx.lineWidth = 2 + k * 2.5;
        ctx.beginPath(); ctx.moveTo(a.x + no.x * fan, a.y + no.y * fan); ctx.lineTo(b.x + no.x * fan, b.y + no.y * fan); ctx.stroke();
      }
    }
  };

  HR.Render.TRAILS = T;
  const base = HR.Render.drawTrail;
  HR.Render.drawTrail = function (ctx, trailId, pts, skin, t, heat) {
    // v6.5: o rastro vale em todo nivel. Custa menos de 0,05 ms por quadro e e o
    // item que a pessoa comprou — cortar isso era tirar o que ela mais ve.
    const f = T[trailId];
    if (!f) return base.apply(this, arguments);
    if (!pts || pts.length < 3) return;
    ctx.save(); f(ctx, pts, skin, t, heat || 0); ctx.restore();
  };
})();
