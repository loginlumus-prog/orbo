/* =====================================================================
   ORBO v5.1: fundo mais rico.
   - efeitos de fundo seguem a direção do voo (o mundo passa por você em qualquer direção)
   - 16 efeitos novos para as galáxias: chuva, bolhas, águas-vivas, fogo, cinzas, raios,
     faíscas, vento, folhas, tóxico, energia, linhas de velocidade, meteoros, vaga-lumes,
     circuito e plasma
   - segundo efeito por sistema da Galáxia (fx2, mais fraco)
   - cenários em camadas com parallax para os temas (cidade, montanhas, deserto, praia...)
   - partículas ao passar pelo arco conforme o efeito (FX_PASS)
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const TAU = Math.PI * 2;
  const U = () => HR.U;
  const BG = HR.Render.Background.prototype;
  const hash = (i, s) => { const v = Math.sin(i * 127.1 + (s || 0) * 311.7) * 43758.5453; return v - Math.floor(v); };
  const wrap = (v, m) => ((v % m) + m) % m;
  const rng = seed => { seed = (Math.abs(seed | 0) % 2147483646) + 1; return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; };

  /* ---------------- Background: distância, direção e cenário ---------------- */
  const upd = BG.update;
  BG.update = function (dt, speed, dir, flow) {
    upd.call(this, dt, speed, dir, flow);
    const d = this.dir || { x: -1, y: 0 }, H = this.H || 800;
    // o cenário fica em pé: anda de lado com o voo e desce/sobe um pouco nas subidas e descidas
    this.sceneY = Math.max(-H * 0.2, Math.min(H * 0.2, (this.sceneY || 0) * Math.pow(0.4, dt) + (speed || 0) * dt * d.y * 0.1));
  };
  const setFx = BG.setFx;
  BG.setFx = function (fx, fx2) {
    setFx.call(this, fx);
    const f2 = fx2 && fx2 !== fx ? fx2 : null;
    if (this.fx2 !== f2) { this.fx2 = f2; this.fx2Objs = null; }
  };
  // efeito antigo (render.js) como segundo efeito: guarda as partículas à parte
  BG.drawBiomeAlt = function (ctx, t, fx, sx, sy, alpha) {
    const keep = this.fxObjs; this.fxObjs = this.fx2Objs || null;
    ctx.save(); ctx.globalAlpha *= alpha; this.drawBiome(ctx, t, fx, sx, sy); ctx.restore();
    this.fx2Objs = this.fxObjs; this.fxObjs = keep;
  };
  // desenha um efeito: novo (FX) ou antigo (drawBiome)
  BG.drawFx = function (ctx, t, fx, alpha, second) {
    const f = HR.Render.FX[fx];
    if (f) { ctx.save(); f(this, ctx, t, alpha); ctx.restore(); return; }
    if (fx === 'water' || fx === 'ember') return;
    if (second) this.drawBiomeAlt(ctx, t, fx, this.sx || 0, this.sy || 0, alpha);
    else this.drawBiome(ctx, t, fx, this.sx || 0, this.sy || 0);
  };

  /* ---------------- efeitos novos ---------------- */
  // partículas normalizadas (0..1) guardadas por efeito
  function objs(bg, key, n) {
    bg.fxc = bg.fxc || {};
    let O = bg.fxc[key];
    if (!O || O.length !== n) { O = []; for (let i = 0; i < n; i++) O.push({ x: Math.random(), y: Math.random(), s: 0.5 + Math.random(), p: Math.random() * TAU, v: 0.5 + Math.random(), h: Math.random(), a: Math.random() * TAU }); bg.fxc[key] = O; }
    return O;
  }
  const mdir = bg => bg.dir || { x: -1, y: 0 };
  const FX = {};

  // chuva: cai e é arrastada pelo movimento do mundo
  FX.rain = (bg, ctx, t, al) => {
    const W = bg.W, H = bg.H, O = objs(bg, 'rain', 110), d = mdir(bg), sp = Math.min(900, bg.speed || 0), sx = bg.sx || 0, sy = bg.sy || 0;
    const vx = d.x * sp * 0.9, vy = 820 + d.y * sp * 0.9, L = Math.hypot(vx, vy) || 1, ux = vx / L, uy = vy / L;
    ctx.lineCap = 'round'; ctx.lineWidth = 1;
    O.forEach(o => {
      const x = wrap(o.x * W + sx * 0.9 * o.v, W + 40) - 20, y = wrap(o.y * H + sy * 0.9 * o.v + t * 820 * o.v, H + 40) - 20, len = 10 + o.s * 14;
      ctx.strokeStyle = 'rgba(180,205,255,' + ((0.1 + o.s * 0.12) * al).toFixed(3) + ')';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - ux * len, y - uy * len); ctx.stroke();
    });
    const fog = ctx.createLinearGradient(0, H * 0.7, 0, H); fog.addColorStop(0, 'rgba(160,190,240,0)'); fog.addColorStop(1, 'rgba(160,190,240,' + (0.08 * al).toFixed(3) + ')');
    ctx.fillStyle = fog; ctx.fillRect(0, H * 0.7, W, H * 0.3);
  };

  // bolhas subindo
  FX.bubbles = (bg, ctx, t, al) => {
    const u = U(), W = bg.W, H = bg.H, O = objs(bg, 'bubbles', 42);
    O.forEach(o => {
      const x = wrap(o.x * W + (bg.sx || 0) * 0.25 * o.v + Math.sin(t * 1.3 + o.p) * 10, W + 40) - 20, y = wrap(o.y * H + (bg.sy || 0) * 0.25 * o.v - t * (26 + o.v * 40), H + 40) - 20, r = 2 + o.s * 5;
      ctx.strokeStyle = u.rgba('#bfe9ff', 0.32 * al); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
      ctx.fillStyle = u.rgba('#ffffff', 0.35 * al); ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.25, 0, TAU); ctx.fill();
    });
  };

  // águas-vivas pulsando
  FX.jelly = (bg, ctx, t, al) => {
    const u = U(), W = bg.W, H = bg.H, O = objs(bg, 'jelly', 7);
    O.forEach(o => {
      const x = wrap(o.x * W * 1.3 + (bg.sx || 0) * 0.08 * o.v + Math.sin(t * 0.4 + o.p) * 20, W * 1.3) - W * 0.15, y = wrap(o.y * H * 1.3 + (bg.sy || 0) * 0.08 * o.v - t * (10 + o.v * 8), H * 1.3) - H * 0.15;
      const s = 14 + o.s * 16, pulse = 1 + 0.14 * Math.sin(t * 2.2 + o.p), hue = Math.round(180 + o.h * 140);
      ctx.save(); ctx.translate(x, y); ctx.scale(pulse, 2 - pulse);
      const g = ctx.createRadialGradient(0, -s * 0.2, 0, 0, 0, s * 1.4); g.addColorStop(0, u.hsl(hue, 90, 75, 0.3 * al)); g.addColorStop(1, u.hsl(hue, 90, 60, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * 1.4, 0, TAU); ctx.fill();
      ctx.fillStyle = u.hsl(hue, 90, 70, 0.26 * al); ctx.beginPath(); ctx.arc(0, 0, s, Math.PI, 0); ctx.quadraticCurveTo(0, s * 0.35, -s, 0); ctx.fill();
      ctx.strokeStyle = u.hsl(hue, 90, 82, 0.3 * al); ctx.lineWidth = 1.2;
      for (let k = 0; k < 4; k++) { const tx = -s * 0.6 + k * s * 0.4; ctx.beginPath(); ctx.moveTo(tx, s * 0.1); for (let j = 1; j <= 5; j++) ctx.lineTo(tx + Math.sin(t * 3 + j * 0.9 + k + o.p) * 3, s * 0.1 + j * s * 0.32); ctx.stroke(); }
      ctx.restore();
    });
  };

  // chão de fogo com línguas e fagulhas (um gradiente e um caminho só)
  FX.firestorm = (bg, ctx, t, al) => {
    const u = U(), W = bg.W, H = bg.H;
    const glow = ctx.createLinearGradient(0, H * 0.55, 0, H); glow.addColorStop(0, 'rgba(255,90,30,0)'); glow.addColorStop(1, 'rgba(255,90,30,' + (0.2 * al).toFixed(3) + ')');
    ctx.fillStyle = glow; ctx.fillRect(0, H * 0.55, W, H * 0.45);
    const off = (bg.sx || 0) * 0.3, step = 34, fg = ctx.createLinearGradient(0, H * 0.82, 0, H);
    fg.addColorStop(0, 'rgba(255,200,80,0)'); fg.addColorStop(0.45, 'rgba(255,120,40,' + (0.26 * al).toFixed(3) + ')'); fg.addColorStop(1, 'rgba(255,60,20,' + (0.44 * al).toFixed(3) + ')');
    ctx.fillStyle = fg; ctx.beginPath();
    for (let i = Math.floor((-60 - off) / step); i * step + off < W + 60; i++) {
      const wx = i * step + off, k = hash(i, 1), h = H * (0.07 + 0.09 * k) * (0.7 + 0.3 * Math.sin(t * 6 + k * 20));
      ctx.moveTo(wx - 26, H); ctx.quadraticCurveTo(wx - 14 + Math.sin(t * 5 + k * 9) * 8, H - h * 0.6, wx + Math.sin(t * 7 + k * 13) * 10, H - h); ctx.quadraticCurveTo(wx + 14, H - h * 0.5, wx + 26, H); ctx.closePath();
    }
    ctx.fill();
    const hot = u.rgba('#ffd27a', 0.6 * al), warm = u.rgba('#ff6a2b', 0.55 * al);
    objs(bg, 'firestorm', 46).forEach(o => {
      const x = wrap(o.x * W + (bg.sx || 0) * 0.3 * o.v + Math.sin(t * 2 + o.p) * 18, W), y = wrap(o.y * H + (bg.sy || 0) * 0.3 * o.v - t * (60 + o.v * 120), H);
      ctx.fillStyle = o.s > 1 ? hot : warm; ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(t * 6 + o.p));
      ctx.beginPath(); ctx.arc(x, y, 0.8 + o.s * 1.6, 0, TAU); ctx.fill();
    });
    ctx.globalAlpha = 1;
  };

  // cinzas caindo, algumas ainda acesas
  FX.ash = (bg, ctx, t, al) => {
    const u = U(), W = bg.W, H = bg.H;
    objs(bg, 'ash', 64).forEach(o => {
      const x = wrap(o.x * W + (bg.sx || 0) * 0.2 * o.v + Math.sin(t * 0.9 + o.p) * 16, W), y = wrap(o.y * H + (bg.sy || 0) * 0.2 * o.v + t * (14 + o.v * 18), H), hot = o.h > 0.82;
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * o.v + o.a);
      ctx.fillStyle = hot ? u.rgba('#ff8a3d', (0.4 + 0.4 * Math.sin(t * 5 + o.p)) * al) : u.rgba('#c9c2bb', 0.26 * al);
      ctx.fillRect(-1 - o.s, -0.6 - o.s * 0.4, 2 + o.s * 2, 1.2 + o.s * 0.8); ctx.restore();
    });
  };

  // raios ramificados com clarão
  FX.lightning = (bg, ctx, t, al) => {
    const W = bg.W, H = bg.H, cyc = 2.4;
    for (let b = 0; b < 2; b++) {
      const tt = t + b * 1.13, k = (tt % cyc) / 0.22; if (k >= 1) continue;
      let seed = Math.floor(tt / cyc) * 7919 + b * 101;
      const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
      const flick = k < 0.3 ? 1 : k < 0.5 ? 0.35 : 0.8;
      ctx.fillStyle = 'rgba(190,220,255,' + (0.07 * (1 - k) * al).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H);
      const horiz = rnd() > 0.5; let x = horiz ? 0 : W * (0.1 + rnd() * 0.8), y = horiz ? H * (0.1 + rnd() * 0.5) : 0;
      const path = [[x, y]];
      while (horiz ? x < W : y < H * 0.7) { if (horiz) { x += 26 + rnd() * 40; y += (rnd() - 0.5) * 50; } else { y += 26 + rnd() * 40; x += (rnd() - 0.5) * 50; } path.push([x, y]); }
      [[7, 'rgba(120,180,255,', 0.25], [2.2, 'rgba(235,245,255,', 0.95]].forEach(([w, c, a]) => {
        ctx.strokeStyle = c + (a * flick * (1 - k * 0.6) * al).toFixed(3) + ')'; ctx.lineWidth = w;
        ctx.beginPath(); path.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
      });
      ctx.strokeStyle = 'rgba(210,230,255,' + (0.6 * flick * (1 - k) * al).toFixed(3) + ')'; ctx.lineWidth = 1.2;
      for (let j = 2; j < path.length - 1; j += 3) { let bx = path[j][0], by = path[j][1]; ctx.beginPath(); ctx.moveTo(bx, by); for (let s = 0; s < 3; s++) { bx += (rnd() - 0.3) * 30; by += (rnd() - 0.3) * 30; ctx.lineTo(bx, by); } ctx.stroke(); }
    }
  };

  // faíscas elétricas piscando
  FX.sparks = (bg, ctx, t, al) => {
    const u = U(), W = bg.W, H = bg.H, bucket = Math.floor(t * 9);
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    objs(bg, 'sparks', 26).forEach((o, i) => {
      if (hash(i, bucket) > 0.45) return;
      const x = wrap(o.x * W + (bg.sx || 0) * 0.15, W), y = wrap(o.y * H + (bg.sy || 0) * 0.15, H);
      ctx.strokeStyle = u.rgba(o.h > 0.5 ? '#9be7ff' : '#fff3a0', (0.5 + hash(i, bucket + 3) * 0.4) * al); ctx.lineWidth = 1.2;
      let px = x, py = y; ctx.beginPath(); ctx.moveTo(px, py);
      for (let s = 0; s < 4; s++) { px += (hash(i * 7 + s, bucket) - 0.5) * 18; py += (hash(i * 13 + s, bucket) - 0.5) * 18; ctx.lineTo(px, py); }
      ctx.stroke(); ctx.fillStyle = u.rgba('#ffffff', 0.7 * al); ctx.beginPath(); ctx.arc(x, y, 1.4, 0, TAU); ctx.fill();
    });
  };

  // vento: linhas curvas correndo no sentido do mundo
  FX.wind = (bg, ctx, t, al) => {
    const W = bg.W, H = bg.H, d = mdir(bg), D = Math.hypot(W, H), L = D * 1.5, sp = Math.max(160, bg.speed || 0), nx = -d.y, ny = d.x;
    ctx.lineCap = 'round';
    objs(bg, 'wind', 14).forEach(o => {
      const a = wrap(o.x * L + t * sp * 0.9 * o.v, L) - L / 2, c = (o.y - 0.5) * D, seg = 16, len = 160 + o.s * 160;
      const px = j => { const aj = a - j * len / seg, cj = c + Math.sin(aj * 0.012 + t * 1.5 + o.p) * 18; return [W / 2 + d.x * aj + nx * cj, H / 2 + d.y * aj + ny * cj]; };
      const head = px(0), tail = px(seg), g = ctx.createLinearGradient(head[0], head[1], tail[0], tail[1]);
      g.addColorStop(0, 'rgba(235,245,255,' + (0.26 * al).toFixed(3) + ')'); g.addColorStop(1, 'rgba(235,245,255,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 1 + o.s * 0.8; ctx.beginPath();
      for (let j = 0; j <= seg; j++) { const p = px(j); j ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
      ctx.stroke();
    });
  };

  // folhas girando
  FX.leaves = (bg, ctx, t, al) => {
    const u = U(), W = bg.W, H = bg.H, cols = ['#8bd35a', '#ffcf4a', '#ff9f43', '#5fbf4a', '#d9772b'];
    objs(bg, 'leaves', 28).forEach((o, i) => {
      const x = wrap(o.x * W + (bg.sx || 0) * 0.3 * o.v + Math.sin(t * 1.1 + o.p) * 26, W + 40) - 20, y = wrap(o.y * H + (bg.sy || 0) * 0.3 * o.v + t * (22 + o.v * 26), H + 40) - 20, s = 4 + o.s * 4;
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * o.v * 1.4 + o.a); ctx.scale(1, 0.45 + 0.55 * Math.abs(Math.cos(t * 2 * o.v + o.p)));
      ctx.fillStyle = u.rgba(cols[i % 5], 0.55 * al); ctx.beginPath(); ctx.moveTo(-s, 0); ctx.quadraticCurveTo(0, -s * 0.75, s, 0); ctx.quadraticCurveTo(0, s * 0.75, -s, 0); ctx.fill();
      ctx.strokeStyle = 'rgba(40,30,10,' + (0.35 * al).toFixed(2) + ')'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(-s, 0); ctx.lineTo(s, 0); ctx.stroke();
      ctx.restore();
    });
  };

  // tóxico: névoa verde, bolhas que estouram e gotas escorrendo
  FX.toxic = (bg, ctx, t, al) => {
    const u = U(), W = bg.W, H = bg.H, sx = bg.sx || 0, sy = bg.sy || 0;
    objs(bg, 'toxicFog', 7).forEach((o, i) => {
      const x = wrap(o.x * W * 1.4 + sx * 0.05, W * 1.4) - W * 0.2, y = wrap(o.y * H * 1.2 + sy * 0.05, H * 1.2) - H * 0.1, r = (90 + o.s * 90) * (1 + 0.1 * Math.sin(t * 0.8 + o.p));
      const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, u.rgba(i % 2 ? '#7cff6b' : '#b6ff3d', 0.09 * al)); g.addColorStop(1, 'rgba(124,255,107,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    });
    objs(bg, 'toxicBub', 36).forEach(o => {
      const life = (t * 0.35 * o.v + o.h) % 1, x = wrap(o.x * W + sx * 0.2 + Math.sin(t + o.p) * 6, W), y = wrap(o.y * H + sy * 0.2 - life * 90, H), r = 2 + o.s * 4 * (0.6 + life * 0.6);
      const a = life < 0.85 ? 0.45 : 0.45 * Math.max(0, 1 - (life - 0.85) / 0.15);
      ctx.strokeStyle = u.rgba('#9dff5a', a * al); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(x, y, life > 0.93 ? r * 1.6 : r, 0, TAU); ctx.stroke();
      if (life < 0.9) { ctx.fillStyle = u.rgba('#d8ff9a', 0.4 * al); ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.25, 0, TAU); ctx.fill(); }
    });
    for (let i = 0; i < 6; i++) {
      const x = wrap(i * W / 6 + 30 + sx * 0.1, W), len = 20 + hash(i, 2) * 60, ph = (t * 0.4 + hash(i, 5)) % 1;
      ctx.strokeStyle = u.rgba('#7cff6b', 0.22 * al); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, len); ctx.stroke();
      ctx.fillStyle = u.rgba('#9dff5a', 0.45 * al * (1 - ph)); ctx.beginPath(); ctx.arc(x, len + ph * H * 0.5, 3, 0, TAU); ctx.fill();
    }
  };

  // energia: faixa de colmeia varrendo a tela e nós ligados (hexágonos agrupados por brilho)
  const HEX = []; for (let j = 0; j < 6; j++) HEX.push([Math.cos(j * Math.PI / 3), Math.sin(j * Math.PI / 3)]);
  FX.power = (bg, ctx, t, al) => {
    const u = U(), W = bg.W, H = bg.H, d = mdir(bg), sx = bg.sx || 0, sy = bg.sy || 0, S = 34, h = S * Math.sqrt(3) / 2, r = S * 0.5;
    const L = Math.abs(d.x) * W + Math.abs(d.y) * H + 400, band = wrap(t * 320, L) - L / 2, ox = wrap(sx * 0.2, S * 1.5), oy = wrap(sy * 0.2, h * 2), bk = Math.floor(t * 4);
    const buckets = [[], [], []], lit = [];
    for (let col = -1; col * S * 1.5 < W + S; col++) {
      for (let row = -1; row * h * 2 < H + h * 2; row++) {
        const cx = col * S * 1.5 + ox, cy = row * h * 2 + (col % 2 ? h : 0) + oy, dist = Math.abs((cx - W / 2) * d.x + (cy - H / 2) * d.y - band);
        if (dist > 110) continue;
        const k = 1 - dist / 110; buckets[Math.min(2, Math.floor(k * 3))].push(cx, cy);
        if (hash(col * 31 + row, bk) > 0.93) lit.push(cx, cy);
      }
    }
    const hex = (cx, cy) => { ctx.moveTo(cx + HEX[0][0] * r, cy + HEX[0][1] * r); for (let j = 1; j < 6; j++) ctx.lineTo(cx + HEX[j][0] * r, cy + HEX[j][1] * r); ctx.closePath(); };
    ctx.lineWidth = 1.2;
    buckets.forEach((arr, b) => { if (!arr.length) return; ctx.strokeStyle = u.rgba('#a29bfe', (0.1 + b * 0.1) * al); ctx.beginPath(); for (let i = 0; i < arr.length; i += 2) hex(arr[i], arr[i + 1]); ctx.stroke(); });
    if (lit.length) { ctx.fillStyle = u.rgba('#e0d8ff', 0.14 * al); ctx.beginPath(); for (let i = 0; i < lit.length; i += 2) hex(lit[i], lit[i + 1]); ctx.fill(); }
    const N = objs(bg, 'powerNodes', 12), dot = u.rgba('#e0d8ff', 0.7 * al), node = u.rgba('#c3b8ff', 0.5 * al);
    ctx.lineWidth = 1;
    N.forEach((o, i) => {
      const q = N[(i + 1) % N.length], x = wrap(o.x * W + sx * 0.12, W), y = wrap(o.y * H + sy * 0.12, H), qx = wrap(q.x * W + sx * 0.12, W), qy = wrap(q.y * H + sy * 0.12, H);
      if (Math.hypot(qx - x, qy - y) < 220) {
        ctx.strokeStyle = u.rgba('#8f6bff', 0.22 * (0.5 + 0.5 * Math.sin(t * 4 + i)) * al); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(qx, qy); ctx.stroke();
        const m = (t * 0.8 + o.h) % 1; ctx.fillStyle = dot; ctx.beginPath(); ctx.arc(x + (qx - x) * m, y + (qy - y) * m, 1.8, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = node; ctx.beginPath(); ctx.arc(x, y, 2.2, 0, TAU); ctx.fill();
    });
  };

  // linhas de velocidade saindo do ponto à frente do voo
  FX.lines = (bg, ctx, t, al) => {
    const u = U(), W = bg.W, H = bg.H, d = mdir(bg), sp = Math.max(200, bg.speed || 0), vx = W / 2 - d.x * W * 0.45, vy = H / 2 - d.y * H * 0.45, R = Math.hypot(W, H);
    ctx.lineCap = 'round';
    objs(bg, 'lines', 48).forEach(o => {
      const f = (t * sp * 0.0006 * o.v + o.h) % 1, r1 = f * f * R, r2 = r1 + 14 + f * 90;
      ctx.strokeStyle = u.rgba(o.s > 1.25 ? '#4cf0ff' : '#ffffff', (0.05 + f * 0.28) * al); ctx.lineWidth = 0.8 + f * 1.6;
      ctx.beginPath(); ctx.moveTo(vx + Math.cos(o.a) * r1, vy + Math.sin(o.a) * r1); ctx.lineTo(vx + Math.cos(o.a) * r2, vy + Math.sin(o.a) * r2); ctx.stroke();
    });
  };

  // meteoros cruzando o céu, puxados pelo movimento
  FX.meteor = (bg, ctx, t, al) => {
    const u = U(), W = bg.W, H = bg.H, d = mdir(bg);
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      const per = 2.6 + i * 0.9, tt = t + i * 1.7, k = (tt % per) / 1.1; if (k >= 1) continue;
      const seed = Math.floor(tt / per) + i * 13, dx = -0.55 + d.x * 0.6, dy = 0.75 + d.y * 0.6, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
      const x = W * (0.1 + hash(seed, 1) * 0.9) + ux * k * W * 0.7, y = H * hash(seed, 2) * 0.4 + uy * k * W * 0.7, L = 70 + 60 * Math.sin(k * Math.PI);
      const g = ctx.createLinearGradient(x, y, x - ux * L, y - uy * L); g.addColorStop(0, u.rgba('#fff3d6', 0.85 * (1 - k) * al)); g.addColorStop(1, 'rgba(255,200,140,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - ux * L, y - uy * L); ctx.stroke();
      ctx.fillStyle = u.rgba('#ffffff', (1 - k) * al); ctx.beginPath(); ctx.arc(x, y, 2, 0, TAU); ctx.fill();
    }
  };

  // vaga-lumes
  FX.fireflies = (bg, ctx, t, al) => {
    const u = U(), W = bg.W, H = bg.H;
    ctx.globalCompositeOperation = 'lighter';
    objs(bg, 'fireflies', 36).forEach(o => {
      const b = Math.max(0, Math.sin(t * 2.2 * o.v + o.p)); if (b < 0.05) return;
      const x = wrap(o.x * W + (bg.sx || 0) * 0.1 * o.v + Math.sin(t * 0.7 * o.v + o.p) * 30, W), y = wrap(o.y * H + (bg.sy || 0) * 0.1 * o.v + Math.cos(t * 0.5 * o.v + o.a) * 24, H), r = 6 + o.s * 6;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, u.rgba('#e8ff8a', 0.5 * b * al)); g.addColorStop(1, 'rgba(200,255,120,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      ctx.fillStyle = u.rgba('#ffffe0', 0.9 * b * al); ctx.beginPath(); ctx.arc(x, y, 1.3, 0, TAU); ctx.fill();
    });
  };

  // circuito: trilhas com pulsos de luz (traços num caminho só, pulso sem gradiente)
  FX.circuit = (bg, ctx, t, al) => {
    const u = U(), W = bg.W, H = bg.H, TW = 600;
    bg.fxc = bg.fxc || {};
    let G = bg.fxc.circuit;
    if (!G) {
      const r = rng(4242); G = [];
      for (let i = 0; i < 16; i++) {
        let x = r() * TW, y = r(); const pts = [[x, y]];
        for (let s2 = 0; s2 < 5; s2++) { if (s2 % 2) y = Math.min(1, Math.max(0, y + (r() - 0.5) * 0.3)); else x += 30 + r() * 80; pts.push([x, y]); }
        G.push({ pts, sp: 0.2 + r() * 0.4, ph: r() });
      }
      bg.fxc.circuit = G;
    }
    const offx = (bg.sx || 0) * 0.15, offy = (bg.sy || 0) * 0.15, line = u.rgba('#35f0c0', 0.12 * al), pad = u.rgba('#35f0c0', 0.25 * al), halo = u.rgba('#35f0c0', 0.2 * al), core = u.rgba('#c8fff0', 0.9 * al);
    const pulses = [];
    ctx.lineWidth = 1.2; ctx.lineJoin = 'round'; ctx.strokeStyle = line; ctx.fillStyle = pad; ctx.beginPath();
    for (let x0 = wrap(offx, TW) - TW; x0 < W; x0 += TW) {
      for (let y0 = wrap(offy, H) - H; y0 < H; y0 += H) {
        G.forEach(c => {
          const p = c.pts; let total = 0; const seg = [];
          ctx.moveTo(x0 + p[0][0], y0 + p[0][1] * H);
          for (let k = 1; k < p.length; k++) { const ax = x0 + p[k - 1][0], ay = y0 + p[k - 1][1] * H, bx = x0 + p[k][0], by = y0 + p[k][1] * H; ctx.lineTo(bx, by); const l = Math.hypot(bx - ax, by - ay); seg.push([ax, ay, bx, by, l]); total += l; }
          let want = ((t * c.sp + c.ph) % 1) * total;
          for (const q of seg) { if (want <= q[4]) { const f = q[4] ? want / q[4] : 0; pulses.push(q[0] + (q[2] - q[0]) * f, q[1] + (q[3] - q[1]) * f); break; } want -= q[4]; }
        });
      }
    }
    ctx.stroke();
    for (let x0 = wrap(offx, TW) - TW; x0 < W; x0 += TW) for (let y0 = wrap(offy, H) - H; y0 < H; y0 += H) G.forEach(c => c.pts.forEach(q => ctx.fillRect(x0 + q[0] - 1.5, y0 + q[1] * H - 1.5, 3, 3)));
    ctx.fillStyle = halo; ctx.beginPath(); for (let i = 0; i < pulses.length; i += 2) { ctx.moveTo(pulses[i] + 7, pulses[i + 1]); ctx.arc(pulses[i], pulses[i + 1], 7, 0, TAU); } ctx.fill();
    ctx.fillStyle = core; ctx.beginPath(); for (let i = 0; i < pulses.length; i += 2) { ctx.moveTo(pulses[i] + 2.2, pulses[i + 1]); ctx.arc(pulses[i], pulses[i + 1], 2.2, 0, TAU); } ctx.fill();
  };

  // plasma: fitas coloridas ondulando
  FX.plasma = (bg, ctx, t, al) => {
    const u = U(), W = bg.W, H = bg.H, ph0 = (bg.sx || 0) * 0.004, py0 = (bg.sy || 0) * 0.004;
    ctx.globalCompositeOperation = 'lighter';
    for (let b = 0; b < 3; b++) {
      const hue = Math.round((280 + b * 50 + t * 12) % 360);
      ctx.beginPath();
      for (let k = 0; k <= 30; k++) { const f = k / 30, x = f * W, y = H * (0.25 + b * 0.25) + Math.sin(f * 6 + t * (0.8 + b * 0.3) + b * 2 + ph0) * H * 0.08 + Math.sin(f * 13 - t * 1.3 + b + py0) * H * 0.025; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.strokeStyle = u.hsl(hue, 95, 62, 0.07 * al); ctx.lineWidth = 40 - b * 8; ctx.stroke();
      ctx.strokeStyle = u.hsl(hue, 100, 80, 0.14 * al); ctx.lineWidth = 3; ctx.stroke();
    }
  };

  // brasas subindo (substitui a versão antiga: agora acompanha o voo)
  FX.ember = (bg, ctx, t, al) => {
    const u = U(), W = bg.W, H = bg.H;
    objs(bg, 'ember', 44).forEach(o => {
      const x = wrap(o.x * W + Math.sin(t * 1.3 + o.p) * 14 + (bg.sx || 0) * 0.14 * o.v, W), y = wrap(o.y * H - t * (0.02 + o.v * 0.03) * H + (bg.sy || 0) * 0.14 * o.v, H);
      ctx.fillStyle = u.rgba(o.s > 1.2 ? '#ffb347' : '#ff6a2b', (0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 5 + o.p))) * al);
      ctx.beginPath(); ctx.arc(x, y, 1 + o.s * 1.1, 0, TAU); ctx.fill();
    });
  };

  HR.Render.FX = FX;

  /* ---------------- partículas ao passar pelo arco ---------------- */
  const spark = (color, n, speed, life) => ({ n: n || 9, speed: speed || 420, color, size: 3, life: life || 0.35, type: 'spark' });
  HR.Render.FX_PASS = {
    ember: { n: 10, speed: 160, color: ['#ffb347', '#ff6a2b'], size: 4, life: 0.9, type: 'spark', vy: -120, drag: 0.96 },
    firestorm: { n: 14, speed: 180, color: ['#ffd27a', '#ff6a2b', '#ff3d2e'], size: 4, life: 0.9, type: 'spark', vy: -140, drag: 0.96 },
    ash: { n: 8, speed: 120, color: ['#c9c2bb', '#ff8a3d'], size: 3, life: 1, type: 'shard', vy: 40, drag: 0.97 },
    lightning: spark(['#bfe3ff', '#ffffff'], 10, 460, 0.3), storm: spark(['#bfe3ff', '#ffffff'], 8, 420, 0.3), sparks: spark(['#fff3a0', '#9be7ff'], 10, 440, 0.3),
    circuit: spark(['#35f0c0', '#c8fff0'], 8, 260, 0.4), lines: spark('#ffffff', 8, 380, 0.35), meteor: spark(['#fff3d6', '#ffb347'], 8, 300, 0.5), wind: spark('#e8f0ff', 8, 320, 0.5),
    rain: { n: 6, speed: 80, color: '#cfe9ff', size: 4, life: 1.1, type: 'bubble', vy: 60, drag: 0.98 },
    bubbles: { n: 7, speed: 70, color: '#cfe9ff', size: 5, life: 1.3, type: 'bubble', vy: -90, drag: 0.98 },
    jelly: { n: 5, speed: 60, color: ['#9be7ff', '#ff9ad9'], size: 5, life: 1.3, type: 'bubble', vy: -60, drag: 0.98 },
    toxic: { n: 8, speed: 90, color: ['#7cff6b', '#b6ff3d'], size: 5, life: 1.1, type: 'bubble', vy: -50, drag: 0.97 },
    mist: { n: 5, speed: 60, color: '#c8cdff', size: 6, life: 1, type: 'bubble', vy: -30, drag: 0.97 },
    snow: { n: 9, speed: 220, color: ['#e6f7ff', '#bdefff'], size: 5, life: 0.8, type: 'shard', drag: 0.93 },
    crystal: { n: 9, speed: 240, color: ['#ffd6f2', '#ffffff'], size: 5, life: 0.8, type: 'shard', drag: 0.93 },
    leaves: { n: 6, speed: 140, color: ['#8bd35a', '#ffcf4a', '#ff9f43'], size: 5, life: 1.1, type: 'shard', vy: 50, drag: 0.96 },
    garden: { n: 6, speed: 130, color: ['#aaff8c', '#fff0aa'], size: 4, life: 1, type: 'shard', vy: -30, drag: 0.96 },
    sakura: { n: 7, speed: 140, color: ['#ffb3d9', '#ff7ad9'], size: 5, life: 1.1, type: 'shard', vy: 40, drag: 0.96 },
    power: { n: 1, speed: 0, color: '#a29bfe', size: 30, life: 0.5, type: 'wave' },
    plasma: { n: 1, speed: 0, color: '#ff5ecf', size: 30, life: 0.5, type: 'wave' },
    fireflies: { n: 6, speed: 80, color: '#e8ff8a', size: 4, life: 1, type: 'circle', drag: 0.95 },
    abyss: { n: 6, speed: 90, color: ['#4cf0ff', '#5b6cff'], size: 4, life: 0.9, type: 'circle', drag: 0.95 }
  };

  /* ---------------- cenários dos temas ---------------- */
  const TW = 1200;
  const ridgeH = (x, g) => { let h = 0; for (const q of g) h += q[2] * Math.pow(Math.abs(Math.sin(Math.PI * q[0] * x / TW + q[1])), q[3]); return h; };
  function ridge(ctx, W, base, off, H, g, fill, step) {
    step = step || 14; ctx.fillStyle = fill; ctx.beginPath(); ctx.moveTo(-10, base + H);
    for (let x = -10; x <= W + step; x += step) ctx.lineTo(x, base - ridgeH(x - off, g) * H);
    ctx.lineTo(W + 20, base + H); ctx.closePath(); ctx.fill();
  }
  function tiles(W, off, tw, fn) { for (let x0 = wrap(off, tw) - tw; x0 < W; x0 += tw) fn(x0); }
  function glowDisc(ctx, x, y, r, col, a, solid) {
    const u = U(), g = ctx.createRadialGradient(x, y, 0, x, y, r * 3);
    g.addColorStop(0, u.rgba(col, 0.55 * a)); g.addColorStop(0.3, u.rgba(col, 0.2 * a)); g.addColorStop(1, u.rgba(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3, 0, TAU); ctx.fill();
    if (solid !== false) { ctx.fillStyle = u.rgba(col, 0.95 * a); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  }
  function palm(ctx, x, y, h, col, t) {
    ctx.strokeStyle = col; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(2, h * 0.05);
    const tx = x + h * 0.25, ty = y - h;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + h * 0.02, y - h * 0.6, tx, ty); ctx.stroke();
    const sway = Math.sin(t * 1.2) * 0.06;
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (i - 3) * 0.5 + sway, L = h * 0.42;
      ctx.lineWidth = Math.max(1.5, h * 0.03);
      ctx.beginPath(); ctx.moveTo(tx, ty); ctx.quadraticCurveTo(tx + Math.cos(a) * L * 0.6, ty + Math.sin(a) * L * 0.6 - L * 0.15, tx + Math.cos(a) * L, ty + Math.sin(a) * L + L * 0.35); ctx.stroke();
    }
  }
  const dark = (h, k) => U().mix(h, '#000000', k);

  const SC = {};

  SC.city = {
    build(r) {
      const row = (wMin, wMax, hMin, hMax, win) => {
        const a = []; let x = 0;
        while (x < TW - wMin) {
          const w = Math.min(TW - x, wMin + r() * (wMax - wMin)), h = hMin + r() * (hMax - hMin), b = { x, w, h, ant: r() > 0.78, stripe: r() > 0.86, wins: [] };
          if (win) { const cols = Math.max(1, Math.floor((w - 4) / 9)); for (let cx = 0; cx < cols; cx++) for (let ry = 0; ry < 14; ry++) if (r() < 0.3) b.wins.push([4 + cx * 9, 8 + ry * 12, r()]); }
          a.push(b); x += w + 1 + r() * 5;
        }
        return a;
      };
      return { far: row(22, 54, 0.12, 0.3, false), mid: row(34, 76, 0.06, 0.2, true) };
    },
    draw(S) {
      const { ctx, W, H, t, u, o, c, g } = S, base = S.base, neon = o.neon || '#4cf0ff', lights = o.lights || '#ffd98a';
      const hz = ctx.createLinearGradient(0, base - H * 0.42, 0, base); hz.addColorStop(0, u.rgba(neon, 0)); hz.addColorStop(1, u.rgba(neon, 0.14));
      ctx.fillStyle = hz; ctx.fillRect(0, base - H * 0.42, W, H * 0.42);
      const far = dark(u.mix(c[0], c[1], 0.5), 0.05), near = dark(c[0], 0.62);
      tiles(W, S.sx * 0.04, TW, x0 => { ctx.fillStyle = far; g.far.forEach(b => { const h = b.h * H, bx = x0 + b.x; if (bx > W || bx + b.w < 0) return; ctx.fillRect(bx, base - h, b.w, h + 2); if (b.ant) ctx.fillRect(bx + b.w * 0.45, base - h - 16, 2, 16); }); });
      tiles(W, S.sx * 0.1, TW, x0 => {
        g.mid.forEach((b, bi) => {
          const h = b.h * H, bx = x0 + b.x; if (bx > W || bx + b.w < 0) return;
          ctx.fillStyle = near; ctx.fillRect(bx, base - h, b.w, h + 2);
          for (const w of b.wins) { if (w[1] > h - 8) continue; const flick = w[2] < 0.04 ? (Math.sin(t * 7 + bi) > 0 ? 1 : 0.3) : 1; ctx.fillStyle = u.rgba(w[2] < 0.12 ? neon : lights, (0.3 + w[2] * 0.5) * flick); ctx.fillRect(bx + w[0], base - h + w[1], 4, 5); }
          if (b.stripe) { ctx.fillStyle = u.rgba(neon, 0.75); ctx.fillRect(bx + 2, base - h + 3, b.w - 4, 2); }
          if (b.ant) { ctx.fillStyle = near; ctx.fillRect(bx + b.w / 2 - 1, base - h - 18, 2, 18); ctx.fillStyle = Math.sin(t * 3 + bi) > 0.5 ? '#ff4d5e' : 'rgba(255,77,94,0.25)'; ctx.beginPath(); ctx.arc(bx + b.w / 2, base - h - 19, 2.2, 0, TAU); ctx.fill(); }
        });
      });
      if (o.wet) { const rg = ctx.createLinearGradient(0, base - 40, 0, base); rg.addColorStop(0, u.rgba(neon, 0)); rg.addColorStop(1, u.rgba(neon, 0.2)); ctx.fillStyle = rg; ctx.fillRect(0, base - 40, W, 40); }
    }
  };

  SC.mountains = {
    build(r) { const q = (k, a, e) => [k, r() * 3, a, e]; return { far: [q(2, 0.14, 1.6), q(5, 0.06, 1.2), q(11, 0.02, 1)], mid: [q(3, 0.1, 1.4), q(7, 0.035, 1.1), q(15, 0.012, 1)], near: [q(4, 0.045, 1.2), q(9, 0.018, 1)] }; },
    draw(S) {
      const { ctx, W, H, u, o, c, g } = S, base = S.base;
      glowDisc(ctx, W * 0.72, base - H * 0.62, Math.min(W, H) * 0.055, o.sun || '#f4f1ff', o.sun ? 0.9 : 0.6);
      const far = dark(u.mix(c[1], c[2], 0.5), 0.12), fb = base - H * 0.1;
      if (o.snow) { const top = fb - H * 0.22, gr = ctx.createLinearGradient(0, top, 0, fb); gr.addColorStop(0, u.mix(far, '#ffffff', 0.75)); gr.addColorStop(0.3, u.mix(far, '#ffffff', 0.25)); gr.addColorStop(0.5, far); ridge(ctx, W, fb, S.sx * 0.03, H, g.far, gr); }
      else ridge(ctx, W, fb, S.sx * 0.03, H, g.far, far);
      const mist = ctx.createLinearGradient(0, base - H * 0.2, 0, base - H * 0.05); mist.addColorStop(0, u.rgba(c[2], 0)); mist.addColorStop(1, u.rgba(c[2], 0.35));
      ctx.fillStyle = mist; ctx.fillRect(0, base - H * 0.2, W, H * 0.15);
      ridge(ctx, W, base - H * 0.04, S.sx * 0.08, H, g.mid, dark(c[0], 0.45));
      ridge(ctx, W, base, S.sx * 0.16, H, g.near, dark(c[0], 0.7));
    }
  };

  SC.desert = {
    build(r) {
      const py = []; for (let i = 0; i < 3; i++) py.push({ x: 150 + i * 380 + r() * 120, s: 0.07 + r() * 0.06 });
      const cac = []; for (let i = 0; i < 5; i++) cac.push({ x: r() * TW, s: 0.04 + r() * 0.04, arm: r() });
      return { py, cac, d1: r() * 3, d2: r() * 3 };
    },
    draw(S) {
      const { ctx, W, H, u, c, g } = S, base = S.base;
      glowDisc(ctx, W * 0.35, base - H * 0.38, Math.min(W, H) * 0.1, '#ffd27a', 0.9);
      const duneY = (off, y, a, k, p, x) => { const wx = x - off; return base - y * H - (Math.sin(Math.PI * k * wx / TW + p) * 0.5 + 0.5) * a * H - Math.sin(Math.PI * k * 2.3 * wx / TW + p * 2) * a * 0.25 * H; };
      const dune = (off, y, a, k, p, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-10, base + 10); for (let x = -10; x <= W + 16; x += 16) ctx.lineTo(x, duneY(off, y, a, k, p, x)); ctx.lineTo(W + 20, base + 10); ctx.closePath(); ctx.fill(); };
      dune(S.sx * 0.03, 0.16, 0.07, 3, g.d1, u.mix(c[2], '#5a2a1a', 0.35));
      tiles(W, S.sx * 0.05, TW, x0 => g.py.forEach(p => {
        const px = x0 + p.x, h = p.s * H, y = base - H * 0.15; if (px + h * 1.2 < 0 || px - h * 1.2 > W) return;
        ctx.fillStyle = u.mix(c[1], '#2a1208', 0.35); ctx.beginPath(); ctx.moveTo(px - h * 1.1, y + 4); ctx.lineTo(px, y - h); ctx.lineTo(px + h * 1.1, y + 4); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.moveTo(px, y - h); ctx.lineTo(px + h * 1.1, y + 4); ctx.lineTo(px + h * 0.2, y + 4); ctx.fill();
      }));
      dune(S.sx * 0.08, 0.08, 0.06, 2, g.d2, u.mix(c[2], '#3a1a10', 0.55));
      const nearOff = S.sx * 0.15;
      dune(nearOff, 0, 0.07, 4, g.d1 + 1, u.mix(c[1], '#1a0a06', 0.7));
      const cc = u.mix(c[1], '#0a0503', 0.8);
      tiles(W, nearOff, TW, x0 => g.cac.forEach(k => {
        const x = x0 + k.x, h = k.s * H; if (x < -30 || x > W + 30) return;
        const y = duneY(nearOff, 0, 0.07, 4, g.d1 + 1, x) + 6;
        ctx.strokeStyle = cc; ctx.lineCap = 'round'; ctx.lineWidth = h * 0.22; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - h); ctx.stroke();
        ctx.lineWidth = h * 0.14; ctx.beginPath(); ctx.moveTo(x, y - h * 0.45); ctx.lineTo(x - h * 0.32, y - h * 0.45); ctx.lineTo(x - h * 0.32, y - h * 0.8); ctx.stroke();
        if (k.arm > 0.4) { ctx.beginPath(); ctx.moveTo(x, y - h * 0.6); ctx.lineTo(x + h * 0.3, y - h * 0.6); ctx.lineTo(x + h * 0.3, y - h * 0.9); ctx.stroke(); }
      }));
    }
  };

  SC.ocean = {
    build(r) { const isl = []; for (let i = 0; i < 3; i++) isl.push({ x: r() * TW, w: 60 + r() * 120, h: 0.02 + r() * 0.03, palms: 1 + Math.floor(r() * 3) }); return { isl }; },
    draw(S) {
      const { ctx, W, H, t, u, o, c, g } = S, base = S.base, hy = base - H * 0.3, sc = o.sun || '#ffc36a';
      glowDisc(ctx, W * 0.5, hy - 6, Math.min(W, H) * 0.085, sc, 0.95);
      const sea = ctx.createLinearGradient(0, hy, 0, base); sea.addColorStop(0, u.mix(c[2], '#1a2a5a', 0.45)); sea.addColorStop(1, dark(c[0], 0.45));
      ctx.fillStyle = sea; ctx.fillRect(0, hy, W, base - hy + 60);
      for (let i = 0; i < 14; i++) { const y = hy + 4 + i * i * 1.3, w = (30 + i * 10) * (0.6 + 0.4 * Math.sin(t * 2 + i * 1.7)); ctx.fillStyle = u.rgba(sc, Math.max(0, 0.35 - i * 0.022)); ctx.fillRect(W * 0.5 - w / 2 + Math.sin(t * 1.3 + i) * 6, y, w, 2 + i * 0.25); }
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1.2;
      const span = Math.max(20, base - hy - 10);
      for (let i = 0; i < 18; i++) { const yy = hy + 12 + (i * 37 % span), xx = wrap(i * 113 + S.sx * (0.05 + (yy - hy) / H * 0.4), W + 60) - 30; ctx.beginPath(); ctx.moveTo(xx, yy); ctx.quadraticCurveTo(xx + 10, yy - 3, xx + 20, yy); ctx.stroke(); }
      const isl = dark(c[0], 0.55);
      tiles(W, S.sx * 0.04, TW, x0 => g.isl.forEach(s => {
        const ix = x0 + s.x, ih = s.h * H; if (ix > W + 40 || ix + s.w < -40) return;
        ctx.fillStyle = isl; ctx.beginPath(); ctx.moveTo(ix, hy + 1); ctx.quadraticCurveTo(ix + s.w / 2, hy - ih * 2, ix + s.w, hy + 1); ctx.fill();
        if (o.palms) for (let p = 0; p < s.palms; p++) palm(ctx, ix + s.w * (0.3 + p * 0.22), hy - ih * 0.8, H * 0.05, isl, t + p);
      }));
      if (o.palms) tiles(W, S.sx * 0.2, 900, x0 => palm(ctx, x0 + 120, base + 6, H * 0.3, dark(c[0], 0.75), t));
    }
  };

  SC.forest = {
    build(r) { const L = (n, hMin, hMax) => Array.from({ length: n }, () => ({ x: r() * TW, h: hMin + r() * (hMax - hMin), w: 0.35 + r() * 0.2 })).sort((a, b) => a.x - b.x); return { far: L(40, 0.08, 0.16), mid: L(26, 0.12, 0.22), near: L(10, 0.2, 0.32), p: r() * 3 }; },
    draw(S) {
      const { ctx, W, H, u, o, c, g } = S, base = S.base, snow = o.snow;
      if (snow) glowDisc(ctx, W * 0.25, base - H * 0.68, Math.min(W, H) * 0.045, '#f4f1ff', 0.6);
      const layer = (arr, off, y, col, k) => tiles(W, off, TW, x0 => {
        arr.forEach(tr => {
          const x = x0 + tr.x, h = tr.h * H, w = h * tr.w; if (x + w < 0 || x - w > W) return;
          const by = base - y * H;
          ctx.fillStyle = col; ctx.beginPath();
          for (let s = 0; s < 3; s++) { const sy = by - h * (0.15 + s * 0.27), sw = w * (1 - s * 0.26); ctx.moveTo(x - sw, sy + h * 0.2); ctx.lineTo(x, sy - h * 0.32); ctx.lineTo(x + sw, sy + h * 0.2); }
          ctx.fill(); ctx.fillRect(x - w * 0.08, by - h * 0.1, w * 0.16, h * 0.12);
          if (snow) { ctx.fillStyle = u.rgba('#ffffff', 0.6 * k); ctx.beginPath(); for (let s = 0; s < 3; s++) { const sy = by - h * (0.15 + s * 0.27), sw = w * (1 - s * 0.26); ctx.moveTo(x - sw * 0.45, sy - h * 0.05); ctx.lineTo(x, sy - h * 0.32); ctx.lineTo(x + sw * 0.45, sy - h * 0.05); } ctx.fill(); }
        });
      });
      layer(g.far, S.sx * 0.04, 0.1, dark(u.mix(c[1], c[2], 0.5), 0.2), 0.5);
      ridge(ctx, W, base - H * 0.09, S.sx * 0.04, H, [[3, g.p, 0.015, 1]], snow ? u.mix(c[1], '#ffffff', 0.35) : dark(c[1], 0.35));
      layer(g.mid, S.sx * 0.09, 0.05, dark(c[0], 0.5), 0.7);
      ridge(ctx, W, base - H * 0.045, S.sx * 0.09, H, [[4, g.p + 1, 0.012, 1]], snow ? u.mix(c[1], '#ffffff', 0.2) : dark(c[0], 0.6));
      layer(g.near, S.sx * 0.18, 0, dark(c[0], 0.75), 0.9);
    }
  };

  SC.volcano = {
    build(r) { return { p: r() * 3, q: r() * 3 }; },
    draw(S) {
      const { ctx, W, H, t, u, c, g } = S, base = S.base;
      tiles(W, S.sx * 0.03, 1600, x0 => {
        const cx = x0 + 800, top = base - H * 0.42, hw = H * 0.5; if (cx + hw * 1.4 < -50 || cx - hw * 1.4 > W + 50) return;
        for (let i = 0; i < 9; i++) { const k = (t * 0.06 + i / 9) % 1, px = cx + Math.sin(k * 5 + i) * 20 + k * 60, py = top - k * H * 0.35, rr = 14 + k * 70; ctx.fillStyle = u.rgba('#2a1a18', 0.35 * (1 - k)); ctx.beginPath(); ctx.arc(px, py, rr, 0, TAU); ctx.fill(); }
        const glow = ctx.createRadialGradient(cx, top, 0, cx, top, H * 0.2); glow.addColorStop(0, 'rgba(255,140,60,0.45)'); glow.addColorStop(1, 'rgba(255,90,30,0)');
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cx, top, H * 0.2, 0, TAU); ctx.fill();
        ctx.fillStyle = dark(c[1], 0.5); ctx.beginPath(); ctx.moveTo(cx - hw * 1.4, base + 10); ctx.quadraticCurveTo(cx - hw * 0.35, top + H * 0.1, cx - H * 0.05, top); ctx.lineTo(cx + H * 0.05, top); ctx.quadraticCurveTo(cx + hw * 0.35, top + H * 0.1, cx + hw * 1.4, base + 10); ctx.closePath(); ctx.fill();
        ctx.lineWidth = 2.4; ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) { const pulse = 0.5 + 0.5 * Math.sin(t * 2 + i); ctx.strokeStyle = 'rgba(255,' + (100 + i * 30) + ',40,' + (0.35 + pulse * 0.4).toFixed(2) + ')'; ctx.beginPath(); ctx.moveTo(cx + (i - 1) * H * 0.03, top + 2); ctx.quadraticCurveTo(cx + (i - 1) * H * 0.12, top + H * 0.18, cx + (i - 1) * H * 0.2 + Math.sin(i) * 10, top + H * 0.34); ctx.stroke(); }
        ctx.fillStyle = '#ffb347'; ctx.fillRect(cx - H * 0.05, top - 2, H * 0.1, 3);
      });
      ridge(ctx, W, base, S.sx * 0.12, H, [[3, g.p, 0.07, 1.3], [8, g.q, 0.025, 1]], dark(c[2], 0.7));
      const lg = ctx.createLinearGradient(0, base - H * 0.12, 0, base); lg.addColorStop(0, 'rgba(255,90,30,0)'); lg.addColorStop(1, 'rgba(255,90,30,0.18)');
      ctx.fillStyle = lg; ctx.fillRect(0, base - H * 0.12, W, H * 0.12);
    }
  };

  SC.reef = {
    build(r) {
      const it = []; for (let i = 0; i < 26; i++) it.push({ x: r() * TW, kind: Math.floor(r() * 3), s: 0.03 + r() * 0.05, hue: r() });
      const kelp = []; for (let i = 0; i < 12; i++) kelp.push({ x: r() * TW, h: 0.15 + r() * 0.2, p: r() * 6 });
      return { it, kelp };
    },
    draw(S) {
      const { ctx, W, H, t, u, o, c, g } = S, base = S.base, deep = o.deep;
      if (!deep) for (let i = 0; i < 4; i++) { const x = W * (0.15 + i * 0.25) + Math.sin(t * 0.3 + i) * 20, gr = ctx.createLinearGradient(0, 0, 0, H * 0.8); gr.addColorStop(0, 'rgba(200,240,255,0.08)'); gr.addColorStop(1, 'rgba(200,240,255,0)'); ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x - 20, 0); ctx.lineTo(x + 20, 0); ctx.lineTo(x + 90, H * 0.8); ctx.lineTo(x - 60, H * 0.8); ctx.fill(); }
      ridge(ctx, W, base - H * 0.05, S.sx * 0.05, H, [[2, 1, 0.05, 1.2], [7, 2, 0.02, 1]], dark(c[1], 0.35));
      tiles(W, S.sx * 0.1, TW, x0 => g.it.forEach(k => {
        const x = x0 + k.x, s = k.s * H, y = base - H * 0.045; if (x < -s * 2 || x > W + s * 2) return;
        const col = deep ? u.hsl(Math.round(170 + k.hue * 120), 60, 35, 0.8) : u.hsl(Math.round((k.hue * 360 + 300) % 360), 55, 55, 0.75);
        ctx.fillStyle = col; ctx.strokeStyle = col;
        if (k.kind === 0) {
          ctx.lineWidth = 2.2; ctx.lineCap = 'round';
          const br = (bx, by, len, a, dd) => { if (dd > 3) return; const ex = bx + Math.cos(a) * len, ey = by + Math.sin(a) * len; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke(); br(ex, ey, len * 0.7, a - 0.45, dd + 1); br(ex, ey, len * 0.7, a + 0.4, dd + 1); };
          br(x, y, s * 0.55, -Math.PI / 2, 0);
        } else if (k.kind === 1) {
          ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, s, Math.PI * 1.1, Math.PI * 1.9); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1; for (let j = 0; j < 6; j++) { const a = Math.PI * (1.12 + j * 0.13); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); ctx.stroke(); }
        } else { ctx.beginPath(); ctx.ellipse(x, y, s * 0.6, s * 0.42, 0, Math.PI, 0); ctx.fill(); }
        if (deep && k.hue > 0.7) { ctx.fillStyle = u.rgba('#7ff6ff', 0.5 + 0.4 * Math.sin(t * 2 + k.x)); ctx.beginPath(); ctx.arc(x, y - s * 0.6, 1.8, 0, TAU); ctx.fill(); }
      }));
      const kc = u.mix(c[0], deep ? '#0a3a30' : '#1f6a3a', 0.6);
      tiles(W, S.sx * 0.18, TW, x0 => g.kelp.forEach(k => {
        const x = x0 + k.x, h = k.h * H; if (x < -40 || x > W + 40) return;
        ctx.strokeStyle = kc; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, base);
        for (let j = 1; j <= 8; j++) { const f = j / 8; ctx.lineTo(x + Math.sin(t * 1.1 + k.p + f * 3) * 14 * f, base - h * f); }
        ctx.stroke();
      }));
    }
  };

  SC.mesa = {
    build(r) { const m = []; let x = 0; while (x < TW - 80) { const w = 80 + r() * 200; m.push({ x, w, h: 0.08 + r() * 0.12 }); x += w + 40 + r() * 160; } return { m, p: r() * 3 }; },
    draw(S) {
      const { ctx, W, H, u, c, g } = S, base = S.base, mm = Math.min(W, H);
      glowDisc(ctx, W * 0.78, base - H * 0.7, mm * 0.025, '#e8d8c8', 0.7); glowDisc(ctx, W * 0.6, base - H * 0.6, mm * 0.014, '#d8c0a8', 0.6);
      const col = dark(c[1], 0.25);
      tiles(W, S.sx * 0.05, TW, x0 => g.m.forEach(m => {
        const x = x0 + m.x, h = m.h * H, y = base - H * 0.08; if (x > W + 20 || x + m.w < -20) return;
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - 20, y + 4); ctx.lineTo(x + 12, y - h); ctx.lineTo(x + m.w - 12, y - h); ctx.lineTo(x + m.w + 20, y + 4); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let j = 1; j < 4; j++) ctx.fillRect(x + 12, y - h + j * h * 0.22, m.w - 24, h * 0.05);
        ctx.fillStyle = u.rgba('#ffb088', 0.15); ctx.fillRect(x + 12, y - h, m.w - 24, 2);
      }));
      ridge(ctx, W, base, S.sx * 0.12, H, [[4, g.p, 0.06, 1.5], [11, g.p * 2, 0.02, 1]], u.mix(c[2], '#1a0804', 0.6));
    }
  };

  SC.arctic = {
    build(r) {
      const b = [];
      for (let i = 0; i < 7; i++) { const n = 5 + Math.floor(r() * 4), pts = []; for (let k = 0; k <= n; k++) pts.push([k / n, k === 0 || k === n ? 0 : 0.3 + r() * 0.7]); b.push({ x: r() * TW, w: 50 + r() * 140, h: 0.03 + r() * 0.08, pts, p: r() * 6 }); }
      return { b };
    },
    draw(S) {
      const { ctx, W, H, t, u, c, g } = S, base = S.base, hy = base - H * 0.18;
      const sea = ctx.createLinearGradient(0, hy, 0, base); sea.addColorStop(0, u.mix(c[1], '#9fd8ff', 0.15)); sea.addColorStop(1, dark(c[0], 0.4));
      ctx.fillStyle = sea; ctx.fillRect(0, hy, W, base - hy + 60);
      tiles(W, S.sx * 0.06, TW, x0 => g.b.forEach(b => {
        const x = x0 + b.x, h = b.h * H, bob = Math.sin(t * 0.8 + b.p) * 2; if (x > W || x + b.w < 0) return;
        ctx.fillStyle = '#dff4ff'; ctx.beginPath(); ctx.moveTo(x, hy + bob); b.pts.forEach(p => ctx.lineTo(x + p[0] * b.w, hy - p[1] * h + bob)); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(120,170,220,0.45)'; ctx.beginPath(); ctx.moveTo(x + b.w * 0.5, hy + bob); b.pts.forEach(p => { if (p[0] >= 0.5) ctx.lineTo(x + p[0] * b.w, hy - p[1] * h + bob); }); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(160,210,255,0.18)'; ctx.fillRect(x, hy + 2 + bob, b.w, h * 0.35);
      }));
      ridge(ctx, W, base, S.sx * 0.14, H, [[3, 1, 0.05, 1.1], [7, 3, 0.015, 1]], u.mix(c[1], '#ffffff', 0.55));
    }
  };

  SC.temple = {
    build(r) { return { pag: [{ x: 250, s: 1 }, { x: 820, s: 0.7 }], tor: [{ x: 540 }], trees: Array.from({ length: 6 }, () => ({ x: r() * TW, s: 0.08 + r() * 0.07 })), p: r() * 3 }; },
    draw(S) {
      const { ctx, W, H, u, c, g } = S, base = S.base;
      glowDisc(ctx, W * 0.7, base - H * 0.62, Math.min(W, H) * 0.075, '#ffe6d6', 0.75);
      ridge(ctx, W, base - H * 0.12, S.sx * 0.03, H, [[2, g.p, 0.1, 1.3], [5, g.p + 1, 0.03, 1]], dark(u.mix(c[1], c[2], 0.4), 0.2));
      const ink = dark(c[0], 0.55);
      tiles(W, S.sx * 0.07, TW, x0 => {
        ctx.fillStyle = ink;
        g.pag.forEach(p => {
          const x = x0 + p.x, s = H * 0.05 * p.s, y = base - H * 0.08; if (x < -s * 4 || x > W + s * 4) return;
          for (let k = 0; k < 4; k++) {
            const yy = y - k * s * 1.05, w = s * (2.2 - k * 0.35);
            ctx.fillRect(x - w * 0.35, yy - s * 0.7, w * 0.7, s * 0.7);
            ctx.beginPath(); ctx.moveTo(x - w, yy - s * 0.62); ctx.quadraticCurveTo(x - w * 0.5, yy - s * 0.75, x, yy - s * 1.05); ctx.quadraticCurveTo(x + w * 0.5, yy - s * 0.75, x + w, yy - s * 0.62); ctx.lineTo(x + w * 0.8, yy - s * 0.55); ctx.lineTo(x - w * 0.8, yy - s * 0.55); ctx.fill();
          }
          ctx.fillRect(x - 1, y - s * 5.3, 2, s * 1.2);
        });
        g.tor.forEach(p => {
          const x = x0 + p.x, s = H * 0.06, y = base - H * 0.06; if (x < -s * 3 || x > W + s * 3) return;
          ctx.fillStyle = u.mix('#c2303a', ink, 0.45);
          ctx.fillRect(x - s, y - s * 1.6, s * 0.16, s * 1.6); ctx.fillRect(x + s * 0.84, y - s * 1.6, s * 0.16, s * 1.6); ctx.fillRect(x - s * 1.2, y - s * 1.35, s * 2.4, s * 0.14);
          ctx.beginPath(); ctx.moveTo(x - s * 1.45, y - s * 1.62); ctx.quadraticCurveTo(x, y - s * 1.5, x + s * 1.45, y - s * 1.62); ctx.lineTo(x + s * 1.35, y - s * 1.8); ctx.quadraticCurveTo(x, y - s * 1.7, x - s * 1.35, y - s * 1.8); ctx.fill();
          ctx.fillStyle = ink;
        });
      });
      ridge(ctx, W, base, S.sx * 0.12, H, [[3, g.p * 2, 0.05, 1.2]], dark(c[0], 0.7));
      const trunk = dark(c[0], 0.75);
      tiles(W, S.sx * 0.12, TW, x0 => g.trees.forEach(k => {
        const x = x0 + k.x, s = k.s * H, y = base - H * 0.025; if (x < -s * 2 || x > W + s * 2) return;
        ctx.strokeStyle = trunk; ctx.lineWidth = s * 0.08; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x - s * 0.1, y - s * 0.5, x + s * 0.1, y - s * 0.8); ctx.stroke();
        for (let j = 0; j < 5; j++) { ctx.fillStyle = u.rgba(j % 2 ? '#ff9ac0' : '#ffb8d4', 0.55); ctx.beginPath(); ctx.arc(x + Math.cos(j * 1.3) * s * 0.4, y - s * 0.85 + Math.sin(j * 1.7) * s * 0.2, s * 0.32, 0, TAU); ctx.fill(); }
      }));
    }
  };

  SC.clouds = {
    build(r) {
      const L = (n, sMin, sMax) => Array.from({ length: n }, () => {
        const s = sMin + r() * (sMax - sMin), k = 5 + Math.floor(r() * 4), puffs = [];
        for (let j = 0; j < k; j++) puffs.push([(j / (k - 1) - 0.5) * s * 2.6, -Math.sin(j / (k - 1) * Math.PI) * s * (0.4 + r() * 0.5), s * (0.45 + r() * 0.45)]);
        return { x: r() * TW, y: r(), s, puffs };
      });
      return { far: L(8, 20, 40), mid: L(6, 34, 60), near: L(4, 60, 100) };
    },
    draw(S) {
      const { ctx, W, H, t, u, g } = S, oy = S.oy;
      glowDisc(ctx, W * 0.8, H * 0.14 + oy * 0.2, Math.min(W, H) * 0.065, '#fff3d6', 0.9);
      [[g.far, 0.03, 0.26, 0.12, 0.5], [g.mid, 0.07, 0.36, 0.3, 0.72], [g.near, 0.14, 0.5, 0.6, 0.96]].forEach(([arr, par, a, yb, ye]) => tiles(W, S.sx * par - t * 60 * par, TW, x0 => arr.forEach(cl => {
        const x = x0 + cl.x, y = H * (yb + cl.y * (ye - yb)) + oy * par * 3; if (x < -cl.s * 3 || x > W + cl.s * 3) return;
        ctx.fillStyle = u.rgba('#ffffff', a); ctx.beginPath(); cl.puffs.forEach(p => { ctx.moveTo(x + p[0] + p[2], y + p[1]); ctx.arc(x + p[0], y + p[1], p[2], 0, TAU); }); ctx.fill();
        ctx.fillStyle = u.rgba('#c9d6f0', a * 0.35); ctx.beginPath(); ctx.ellipse(x, y + cl.s * 0.3, cl.s * 1.3, cl.s * 0.22, 0, 0, TAU); ctx.fill();
      })));
    }
  };

  SC.candy = {
    build(r) { const it = []; for (let i = 0; i < 9; i++) it.push({ x: r() * TW, k: Math.floor(r() * 3), s: 0.05 + r() * 0.05, hue: r() }); return { it, p: r() * 3 }; },
    draw(S) {
      const { ctx, W, H, t, u, g } = S, base = S.base;
      ridge(ctx, W, base - H * 0.08, S.sx * 0.04, H, [[2, g.p, 0.1, 1], [5, g.p + 2, 0.03, 1]], 'rgba(160,240,210,0.35)');
      tiles(W, S.sx * 0.09, TW, x0 => g.it.forEach(k => {
        const x = x0 + k.x, s = k.s * H, y = base - H * 0.05; if (x < -s * 2 || x > W + s * 2) return;
        if (k.k === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x - 1.5, y - s * 1.8, 3, s * 1.8);
          const cy = y - s * 1.8, rr = s * 0.55; ctx.fillStyle = u.hsl(Math.round(k.hue * 360), 85, 70, 0.9); ctx.beginPath(); ctx.arc(x, cy, rr, 0, TAU); ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = rr * 0.16; ctx.beginPath(); for (let a = 0; a < 12; a += 0.3) { const q = rr * a / 12; ctx.lineTo(x + Math.cos(a + t) * q, cy + Math.sin(a + t) * q); } ctx.stroke();
        } else if (k.k === 1) {
          ctx.lineCap = 'butt'; ctx.lineWidth = s * 0.22;
          const path = () => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - s * 1.4); ctx.arc(x + s * 0.35, y - s * 1.4, s * 0.35, Math.PI, 0); };
          ctx.strokeStyle = '#ffffff'; path(); ctx.stroke(); ctx.strokeStyle = '#ff4d6d'; ctx.setLineDash([s * 0.18, s * 0.18]); path(); ctx.stroke(); ctx.setLineDash([]);
        } else {
          ctx.fillStyle = u.hsl(Math.round(k.hue * 360), 80, 65, 0.85); ctx.beginPath(); ctx.moveTo(x - s * 0.5, y); ctx.quadraticCurveTo(x - s * 0.5, y - s * 0.9, x, y - s * 0.9); ctx.quadraticCurveTo(x + s * 0.5, y - s * 0.9, x + s * 0.5, y); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(x - s * 0.15, y - s * 0.6, s * 0.1, 0, TAU); ctx.fill();
        }
      }));
      ridge(ctx, W, base, S.sx * 0.15, H, [[3, g.p * 2, 0.06, 1]], 'rgba(255,150,200,0.45)');
    }
  };

  SC.haunted = {
    build(r) {
      const st = []; for (let i = 0; i < 14; i++) st.push({ x: r() * TW, k: r() > 0.6 ? 1 : 0, s: 0.02 + r() * 0.02, tilt: (r() - 0.5) * 0.3 });
      const tr = []; for (let i = 0; i < 3; i++) tr.push({ x: r() * TW, s: 0.14 + r() * 0.08, seed: 1 + Math.floor(r() * 1000) });
      return { st, tr, p: r() * 3 };
    },
    draw(S) {
      const { ctx, W, H, t, u, c, g } = S, base = S.base, ink = dark(c[0], 0.7);
      const mx = W * 0.3, my = base - H * 0.66, mr = Math.min(W, H) * 0.085;
      glowDisc(ctx, mx, my, mr, '#fff4d0', 0.55);
      ctx.fillStyle = 'rgba(200,190,160,0.4)'; [[0.3, -0.2, 0.2], [-0.3, 0.25, 0.14], [0.1, 0.4, 0.1]].forEach(k => { ctx.beginPath(); ctx.arc(mx + k[0] * mr, my + k[1] * mr, k[2] * mr, 0, TAU); ctx.fill(); });
      ctx.strokeStyle = ink; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) { const k = (t * 0.05 + i * 0.27) % 1, bx = W * (1.1 - k * 1.2), by = my + Math.sin(t * 1.5 + i * 2) * 30 + (i - 1.5) * 40, fl = Math.sin(t * 14 + i) * 5; ctx.beginPath(); ctx.moveTo(bx - 9, by - fl); ctx.quadraticCurveTo(bx - 4, by - 2, bx, by + 1); ctx.quadraticCurveTo(bx + 4, by - 2, bx + 9, by - fl); ctx.stroke(); }
      const hill = dark(c[1], 0.45), hg = [[2, g.p, 0.08, 1]], hOff = S.sx * 0.04;
      ridge(ctx, W, base - H * 0.08, hOff, H, hg, hill);
      tiles(W, hOff, TW, x0 => {
        const hx = x0 + 700, s = H * 0.05; if (hx < -s * 4 || hx > W + s * 4) return;
        const hy = base - H * 0.08 - ridgeH(hx - hOff, hg) * H + 4;
        ctx.fillStyle = hill; ctx.fillRect(hx - s * 1.5, hy - s * 1.6, s * 3, s * 1.6);
        ctx.beginPath(); ctx.moveTo(hx - s * 1.8, hy - s * 1.5); ctx.lineTo(hx, hy - s * 2.8); ctx.lineTo(hx + s * 1.8, hy - s * 1.5); ctx.fill();
        ctx.fillRect(hx + s * 0.8, hy - s * 3.2, s * 0.6, s * 1.8); ctx.beginPath(); ctx.moveTo(hx + s * 0.65, hy - s * 3.2); ctx.lineTo(hx + s * 1.1, hy - s * 3.9); ctx.lineTo(hx + s * 1.55, hy - s * 3.2); ctx.fill();
        const fl = 0.6 + 0.4 * Math.sin(t * 6) * Math.sin(t * 2.3); ctx.fillStyle = u.rgba('#ffcf4a', 0.75 * fl);
        ctx.fillRect(hx - s * 0.9, hy - s * 1.1, s * 0.35, s * 0.4); ctx.fillRect(hx + s * 0.3, hy - s * 1.1, s * 0.35, s * 0.4); ctx.fillRect(hx + s * 0.95, hy - s * 2.7, s * 0.3, s * 0.35);
      });
      const ng = [[3, g.p * 2, 0.04, 1]], nOff = S.sx * 0.1;
      ridge(ctx, W, base, nOff, H, ng, ink);
      tiles(W, nOff, TW, x0 => {
        ctx.fillStyle = ink; ctx.strokeStyle = ink;
        g.st.forEach(k => {
          const x = x0 + k.x, s = k.s * H; if (x < -20 || x > W + 20) return;
          const y = base - ridgeH(x - nOff, ng) * H + 3;
          ctx.save(); ctx.translate(x, y); ctx.rotate(k.tilt);
          if (k.k) { ctx.fillRect(-s * 0.12, -s * 1.6, s * 0.24, s * 1.6); ctx.fillRect(-s * 0.5, -s * 1.2, s, s * 0.22); }
          else { ctx.beginPath(); ctx.moveTo(-s * 0.5, 0); ctx.lineTo(-s * 0.5, -s * 0.9); ctx.arc(0, -s * 0.9, s * 0.5, Math.PI, 0); ctx.lineTo(s * 0.5, 0); ctx.fill(); }
          ctx.restore();
        });
        g.tr.forEach(k => {
          const x = x0 + k.x, s = k.s * H; if (x < -s || x > W + s) return;
          let seed = k.seed; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
          ctx.lineCap = 'round';
          const br = (bx, by, len, a, w) => { if (w < 0.8) return; const ex = bx + Math.cos(a) * len, ey = by + Math.sin(a) * len; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke(); br(ex, ey, len * 0.72, a - 0.35 - rnd() * 0.3, w * 0.62); br(ex, ey, len * 0.7, a + 0.3 + rnd() * 0.3, w * 0.62); };
          br(x, base + 2, s * 0.38, -Math.PI / 2, s * 0.07);
        });
      });
    }
  };

  SC.arcade = {
    build(r) {
      const m = []; for (let i = 0; i < 60; i++) m.push(Math.floor(r() * 5));
      const b = []; let x = 0; while (x < 120) { const w = 3 + Math.floor(r() * 6); b.push({ x, w, h: 4 + Math.floor(r() * 12), win: r() }); x += w + 1; }
      return { m, b, bw: x };
    },
    draw(S) {
      const { ctx, W, H, u, g } = S, base = S.base, P = 8, hor = base - H * 0.3;
      const R = Math.floor(Math.min(W, H) * 0.14 / P) * P, cx = Math.floor(W / 2 / P) * P, cy = hor - R * 0.2;
      for (let yy = -R; yy < R * 0.2; yy += P) { if (yy > -R * 0.4 && (Math.floor(yy / P) % 2)) continue; const hw = Math.floor(Math.sqrt(Math.max(0, R * R - yy * yy)) / P) * P; ctx.fillStyle = u.mix('#ffe45a', '#ff3dac', Math.min(1, (yy + R) / (R * 1.2))); ctx.fillRect(cx - hw, cy + yy, hw * 2, P); }
      const cell = P * 2, o1 = S.sx * 0.04;
      ctx.fillStyle = '#3a0f6a';
      for (let i = Math.floor(-o1 / cell) - 1; i * cell + o1 < W + cell; i++) { const h = (g.m[((i % 60) + 60) % 60] + 2) * P; ctx.fillRect(Math.round(i * cell + o1), hor - h, cell, h); }
      ctx.fillStyle = '#12051f'; ctx.fillRect(0, hor, W, base - hor + 60);
      ctx.strokeStyle = 'rgba(255,61,172,0.35)'; ctx.lineWidth = 1;
      for (let k = -10; k <= 10; k++) { ctx.beginPath(); ctx.moveTo(W / 2 + k * 18, hor); ctx.lineTo(W / 2 + k * 120, base); ctx.stroke(); }
      const ph = wrap(-S.sx * 0.002, 1);
      for (let k = 0; k < 10; k++) { const f = (k + ph) / 10, y = hor + f * f * (base - hor); ctx.strokeStyle = 'rgba(76,240,255,' + (0.08 + f * 0.3).toFixed(3) + ')'; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      tiles(W, S.sx * 0.14, g.bw * P, x0 => g.b.forEach((bl, bi) => {
        const x = Math.round(x0 + bl.x * P), w = bl.w * P, h = bl.h * P; if (x > W || x + w < 0) return;
        ctx.fillStyle = '#1c0a33'; ctx.fillRect(x, base - h, w, h);
        if (bl.win > 0.3) for (let yy = P; yy < h - P; yy += P * 2) for (let xx = P / 2; xx < w - P / 2; xx += P) if (hash(bi * 13 + xx, yy) > 0.55) { ctx.fillStyle = hash(bi, yy + xx) > 0.8 ? '#4cf0ff' : '#ffcf4a'; ctx.fillRect(x + xx, base - h + yy, P / 2, P / 2); }
      }));
    }
  };

  SC.jungle = {
    build(r) {
      const leaves = []; for (let i = 0; i < 7; i++) leaves.push({ x: r() * TW, s: 0.14 + r() * 0.1, a: -0.6 - r() * 1.9, top: r() > 0.55 });
      const vines = []; for (let i = 0; i < 8; i++) vines.push({ x: r() * TW, len: 0.1 + r() * 0.25, p: r() * 6 });
      return { leaves, vines, p: r() * 3 };
    },
    draw(S) {
      const { ctx, W, H, t, u, c, g } = S, base = S.base;
      ctx.fillStyle = u.mix(c[0], '#1a4a2a', 0.35); ctx.beginPath(); ctx.moveTo(-10, base);
      for (let x = -10; x <= W + 20; x += 20) { const wx = x - S.sx * 0.03; ctx.lineTo(x, base - H * 0.26 - Math.abs(Math.sin(wx * 0.012 + g.p)) * H * 0.05 - Math.abs(Math.sin(wx * 0.031)) * H * 0.025); }
      ctx.lineTo(W + 20, base); ctx.fill();
      tiles(W, S.sx * 0.06, TW, x0 => { const px = x0 + 600, s = H * 0.03, y = base - H * 0.2; if (px < -s * 8 || px > W + s * 8) return; ctx.fillStyle = u.mix(c[0], '#2a3a2a', 0.5); for (let k = 0; k < 5; k++) ctx.fillRect(px - s * (4 - k * 0.7), y - s * (k + 1), s * (8 - k * 1.4), s + 1); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(px - s * 0.4, y - s * 1.1, s * 0.8, s * 1.1); });
      ridge(ctx, W, base - H * 0.1, S.sx * 0.08, H, [[4, g.p, 0.06, 0.8], [11, g.p + 1, 0.03, 0.7]], dark(c[0], 0.45));
      const vc = dark(c[0], 0.55), lc = u.mix(c[0], '#0a3a1a', 0.5);
      tiles(W, S.sx * 0.14, TW, x0 => g.vines.forEach(v => {
        const x = x0 + v.x; if (x < -30 || x > W + 30) return; const L = v.len * H;
        ctx.strokeStyle = vc; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x, -5);
        for (let j = 1; j <= 10; j++) { const f = j / 10; ctx.lineTo(x + Math.sin(t * 0.9 + v.p + f * 2) * 10 * f, f * L); }
        ctx.stroke(); ctx.fillStyle = lc;
        for (let j = 3; j <= 10; j += 3) { const f = j / 10, lx = x + Math.sin(t * 0.9 + v.p + f * 2) * 10 * f; ctx.beginPath(); ctx.ellipse(lx + 5, f * L, 6, 3, 0.5, 0, TAU); ctx.fill(); }
      }));
      const leafC = dark(c[0], 0.72), veinC = dark(c[0], 0.5);
      tiles(W, S.sx * 0.22, TW, x0 => g.leaves.forEach(l => {
        const x = x0 + l.x, s = l.s * H; if (x < -s * 1.5 || x > W + s * 1.5) return;
        const y = l.top ? -s * 0.1 + S.oy * 0.3 : base + s * 0.15, a = (l.top ? -l.a : l.a) + Math.sin(t * 0.8 + l.x) * 0.04;
        ctx.save(); ctx.translate(x, y); ctx.rotate(a);
        ctx.fillStyle = leafC; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(s * 0.5, -s * 0.45, s * 1.1, 0); ctx.quadraticCurveTo(s * 0.5, s * 0.45, 0, 0); ctx.fill();
        ctx.strokeStyle = veinC; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(s * 1.05, 0);
        for (let j = 1; j < 6; j++) { const q = Math.sin(j / 6 * Math.PI) * s * 0.16; ctx.moveTo(s * j * 0.18, 0); ctx.lineTo(s * (j * 0.18 + 0.12), -q); ctx.moveTo(s * j * 0.18, 0); ctx.lineTo(s * (j * 0.18 + 0.12), q); }
        ctx.stroke(); ctx.restore();
      }));
    }
  };

  SC.moonbase = {
    build(r) { const cr = []; for (let i = 0; i < 16; i++) cr.push({ x: r() * TW, y: r(), s: 6 + r() * 26 }); return { cr, p: r() * 3 }; },
    draw(S) {
      const { ctx, W, H, t, u, g } = S, base = S.base;
      const ex = W * 0.72, ey = base - H * 0.68, er = Math.min(W, H) * 0.12;
      const at = ctx.createRadialGradient(ex, ey, er * 0.9, ex, ey, er * 1.35); at.addColorStop(0, 'rgba(120,190,255,0.35)'); at.addColorStop(1, 'rgba(120,190,255,0)');
      ctx.fillStyle = at; ctx.beginPath(); ctx.arc(ex, ey, er * 1.35, 0, TAU); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.arc(ex, ey, er, 0, TAU); ctx.clip();
      const eg = ctx.createRadialGradient(ex - er * 0.3, ey - er * 0.3, er * 0.1, ex, ey, er); eg.addColorStop(0, '#6fb8ff'); eg.addColorStop(1, '#0b2a6a'); ctx.fillStyle = eg; ctx.fillRect(ex - er, ey - er, er * 2, er * 2);
      const drift = (t * 0.01) % 2;
      ctx.fillStyle = 'rgba(90,170,90,0.85)'; [[0.2, -0.3, 0.35, 0.22], [-0.35, 0.15, 0.3, 0.2], [0.3, 0.35, 0.2, 0.12]].forEach(k => { ctx.beginPath(); ctx.ellipse(ex + (wrap(k[0] + drift, 2) - 1) * er, ey + k[1] * er, k[2] * er, k[3] * er, 0.4, 0, TAU); ctx.fill(); });
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(ex - er * 0.1, ey - er * 0.55, er * 0.5, er * 0.08, 0.2, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,20,0.45)'; ctx.beginPath(); ctx.arc(ex + er * 0.45, ey + er * 0.2, er * 0.95, 0, TAU); ctx.fill();
      ctx.restore();
      const gh = [[2, g.p, 0.05, 1.2], [9, g.p + 2, 0.015, 1]], gOff = S.sx * 0.05;
      ridge(ctx, W, base - H * 0.1, gOff, H, gh, '#2a2c38');
      tiles(W, gOff, TW, x0 => {
        [[250, 1], [330, 0.6], [760, 0.8]].forEach((dm, di) => {
          const x = x0 + dm[0], s = H * 0.045 * dm[1]; if (x < -s * 2 || x > W + s * 2) return;
          const y = base - H * 0.1 - ridgeH(x - gOff, gh) * H + 3, dg = ctx.createLinearGradient(x - s, y - s, x + s, y);
          dg.addColorStop(0, '#c8ccd8'); dg.addColorStop(1, '#6a6e7c'); ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(x, y, s, Math.PI, 0); ctx.fill();
          ctx.strokeStyle = 'rgba(40,40,60,0.5)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, s * 0.6, Math.PI, 0); ctx.moveTo(x, y - s); ctx.lineTo(x, y); ctx.stroke();
          ctx.fillStyle = u.rgba('#ffd98a', 0.7 + 0.3 * Math.sin(t * 2 + di)); ctx.fillRect(x - s * 0.55, y - s * 0.3, s * 0.2, s * 0.14); ctx.fillRect(x + s * 0.35, y - s * 0.3, s * 0.2, s * 0.14);
        });
        const ax = x0 + 520; if (ax > -20 && ax < W + 20) {
          const ay = base - H * 0.1 - ridgeH(ax - gOff, gh) * H + 2, ah = H * 0.12;
          ctx.strokeStyle = '#8a8e9c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, ay - ah); ctx.moveTo(ax - 8, ay); ctx.lineTo(ax, ay - ah * 0.6); ctx.lineTo(ax + 8, ay); ctx.stroke();
          ctx.beginPath(); ctx.ellipse(ax, ay - ah, 10, 4, -0.4, 0, TAU); ctx.stroke();
          ctx.fillStyle = Math.sin(t * 3) > 0.3 ? '#ff4d5e' : 'rgba(255,77,94,0.25)'; ctx.beginPath(); ctx.arc(ax, ay - ah - 5, 2.4, 0, TAU); ctx.fill();
        }
      });
      ridge(ctx, W, base - H * 0.04, S.sx * 0.12, H, [[3, g.p * 2, 0.04, 1.1]], '#4a4d5a');
      ctx.fillStyle = '#4a4d5a'; ctx.fillRect(0, base - H * 0.04, W, H * 0.04 + 60);
      tiles(W, S.sx * 0.12, TW, x0 => g.cr.forEach(k => {
        const x = x0 + k.x; if (x < -k.s || x > W + k.s) return; const y = base - H * (0.005 + k.y * 0.028);
        ctx.fillStyle = 'rgba(20,20,30,0.45)'; ctx.beginPath(); ctx.ellipse(x, y, k.s, k.s * 0.28, 0, 0, TAU); ctx.fill();
        ctx.strokeStyle = 'rgba(200,205,220,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y + 1, k.s, k.s * 0.28, 0, 0.1, Math.PI - 0.1); ctx.stroke();
      }));
    }
  };

  SC.cave = {
    build(r) {
      const top = [], bot = [], cry = []; let x = 0;
      while (x < TW) { const w = 18 + r() * 40; top.push({ x, w, h: 0.04 + r() * 0.14 }); x += w * (0.6 + r() * 0.6); }
      x = 0; while (x < TW) { const w = 20 + r() * 50; bot.push({ x, w, h: 0.03 + r() * 0.1 }); x += w * (0.7 + r() * 0.8); }
      for (let i = 0; i < 9; i++) cry.push({ x: r() * TW, s: 0.03 + r() * 0.04, top: r() > 0.65, n: 3 + Math.floor(r() * 3), p: r() * 6 });
      return { top, bot, cry };
    },
    draw(S) {
      const { ctx, W, H, t, u, o, c, g } = S, base = S.base, ceil = S.oy * 0.3, glow = o.glow || '#8fb8ff';
      [[0.05, dark(c[1], 0.35), 0.7], [0.12, dark(c[0], 0.6), 1]].forEach(([par, col, sc]) => tiles(W, S.sx * par, TW, x0 => {
        ctx.fillStyle = col; ctx.beginPath();
        g.top.forEach(s => { const x = x0 + s.x; if (x > W + s.w || x < -s.w) return; ctx.moveTo(x - s.w * 0.5, ceil - 4); ctx.lineTo(x, ceil + s.h * H * sc); ctx.lineTo(x + s.w * 0.5, ceil - 4); });
        g.bot.forEach(s => { const x = x0 + s.x + 40; if (x > W + s.w || x < -s.w) return; ctx.moveTo(x - s.w * 0.5, base + 4); ctx.lineTo(x, base - s.h * H * sc); ctx.lineTo(x + s.w * 0.5, base + 4); });
        ctx.fill();
      }));
      ctx.fillStyle = dark(c[0], 0.6); ctx.fillRect(0, ceil - 60, W, 58); ctx.fillRect(0, base, W, 60);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      tiles(W, S.sx * 0.12, TW, x0 => g.cry.forEach(k => {
        const x = x0 + k.x, s = k.s * H, dir = k.top ? 1 : -1, y = k.top ? ceil + s * 0.2 : base - s * 0.1; if (x < -s * 2 || x > W + s * 2) return;
        const pul = 0.6 + 0.4 * Math.sin(t * 1.5 + k.p), gy = y + dir * s * 0.5, gl = ctx.createRadialGradient(x, gy, 0, x, gy, s * 2.2);
        gl.addColorStop(0, u.rgba(glow, 0.28 * pul)); gl.addColorStop(1, u.rgba(glow, 0)); ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, gy, s * 2.2, 0, TAU); ctx.fill();
        for (let j = 0; j < k.n; j++) {
          const a = (j - (k.n - 1) / 2) * 0.35, L = s * (1 - Math.abs(a) * 0.8), w = s * 0.18;
          ctx.save(); ctx.translate(x + a * s * 0.6, y); ctx.rotate(a * dir);
          ctx.fillStyle = u.rgba(glow, 0.45 * pul); ctx.beginPath(); ctx.moveTo(-w, 0); ctx.lineTo(-w * 0.7, dir * L * 0.8); ctx.lineTo(0, dir * L); ctx.lineTo(w * 0.7, dir * L * 0.8); ctx.lineTo(w, 0); ctx.fill();
          ctx.fillStyle = u.rgba('#ffffff', 0.3 * pul); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, dir * L); ctx.lineTo(w * 0.7, dir * L * 0.8); ctx.lineTo(w, 0); ctx.fill();
          ctx.restore();
        }
      }));
      ctx.restore();
    }
  };

  SC.savanna = {
    build(r) {
      const tr = []; for (let i = 0; i < 5; i++) tr.push({ x: r() * TW, s: 0.08 + r() * 0.06, w: 1.4 + r() * 0.8 });
      const gr = []; for (let i = 0; i < 70; i++) gr.push({ x: r() * TW, h: 0.02 + r() * 0.04, lean: (r() - 0.5) * 0.6 });
      return { tr, gr, p: r() * 3 };
    },
    draw(S) {
      const { ctx, W, H, t, u, c, g } = S, base = S.base;
      glowDisc(ctx, W * 0.5, base - H * 0.3, Math.min(W, H) * 0.16, '#ffd05a', 0.8);
      ctx.strokeStyle = 'rgba(40,20,20,0.7)'; ctx.lineWidth = 1.6;
      for (let i = 0; i < 6; i++) { const k = (t * 0.03 + i * 0.03) % 1, bx = W * (1.1 - k * 1.3) + i * 14, by = H * 0.28 + Math.sin(i * 2.1) * 14 + i * 6, fl = Math.sin(t * 9 + i) * 3; ctx.beginPath(); ctx.moveTo(bx - 6, by - fl); ctx.lineTo(bx, by); ctx.lineTo(bx + 6, by - fl); ctx.stroke(); }
      ridge(ctx, W, base - H * 0.12, S.sx * 0.03, H, [[2, g.p, 0.03, 1]], u.mix(c[1], '#2a0a0a', 0.45));
      const ink = dark(c[0], 0.7);
      tiles(W, S.sx * 0.09, TW, x0 => g.tr.forEach(k => {
        const x = x0 + k.x, s = k.s * H, y = base - H * 0.045; if (x < -s * 2 || x > W + s * 2) return;
        ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineCap = 'round'; ctx.lineWidth = s * 0.08;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - s * 0.55); ctx.lineTo(x - s * 0.35, y - s * 0.95); ctx.moveTo(x, y - s * 0.55); ctx.lineTo(x + s * 0.4, y - s * 0.9); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(x, y - s, s * 0.8 * k.w, s * 0.14, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.ellipse(x - s * 0.3, y - s * 1.05, s * 0.4 * k.w, s * 0.1, 0, 0, TAU); ctx.fill();
      }));
      ridge(ctx, W, base - H * 0.05, S.sx * 0.09, H, [[5, g.p + 1, 0.012, 1]], dark(c[1], 0.55));
      ctx.fillStyle = dark(c[1], 0.55); ctx.fillRect(0, base - H * 0.05, W, H * 0.05 + 60);
      ctx.strokeStyle = ink; ctx.lineWidth = 1.4;
      tiles(W, S.sx * 0.18, TW, x0 => g.gr.forEach(k => {
        const x = x0 + k.x; if (x < -10 || x > W + 10) return; const h = k.h * H, sw = Math.sin(t * 1.4 + k.x * 0.05) * 3;
        ctx.beginPath(); ctx.moveTo(x, base); ctx.quadraticCurveTo(x + k.lean * h * 0.5, base - h * 0.6, x + k.lean * h + sw, base - h);
        ctx.moveTo(x + 3, base); ctx.quadraticCurveTo(x + 3 - k.lean * h * 0.3, base - h * 0.5, x + 3 - k.lean * h * 0.6 + sw, base - h * 0.8); ctx.stroke();
      }));
      ctx.fillStyle = ink; ctx.fillRect(0, base - 2, W, 60);
    }
  };

  SC.harbor = {
    build(r) { const boats = []; for (let i = 0; i < 4; i++) boats.push({ x: r() * TW, s: 0.02 + r() * 0.025, p: r() * 6, sail: r() > 0.4 }); return { boats }; },
    draw(S) {
      const { ctx, W, H, t, u, c, g } = S, base = S.base, hy = base - H * 0.2;
      glowDisc(ctx, W * 0.2, hy - H * 0.45, Math.min(W, H) * 0.042, '#f4f1ff', 0.7);
      const sea = ctx.createLinearGradient(0, hy, 0, base); sea.addColorStop(0, u.mix(c[1], '#2a3a6a', 0.3)); sea.addColorStop(1, dark(c[0], 0.5));
      ctx.fillStyle = sea; ctx.fillRect(0, hy, W, base - hy + 60);
      ctx.strokeStyle = 'rgba(200,220,255,0.1)'; ctx.lineWidth = 1;
      const span = Math.max(20, base - hy - 6);
      for (let i = 0; i < 16; i++) { const yy = hy + 6 + (i * 29 % span), xx = wrap(i * 97 + S.sx * (0.06 + (yy - hy) / H * 0.4) + Math.sin(t + i) * 4, W + 40) - 20; ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + 16, yy); ctx.stroke(); }
      tiles(W, S.sx * 0.05, TW, x0 => {
        const lx = x0 + 820;
        if (lx > -H * 0.4 && lx < W + H * 0.4) {
          const ch = H * 0.1, th = H * 0.16, ly = hy - ch;
          ctx.fillStyle = dark(c[0], 0.6); ctx.beginPath(); ctx.moveTo(lx - H * 0.18, hy + 2); ctx.lineTo(lx - H * 0.08, ly + 4); ctx.lineTo(lx + H * 0.06, ly); ctx.lineTo(lx + H * 0.14, hy + 2); ctx.fill();
          ctx.fillStyle = '#d8dce8'; ctx.beginPath(); ctx.moveTo(lx - th * 0.12, ly); ctx.lineTo(lx - th * 0.07, ly - th); ctx.lineTo(lx + th * 0.07, ly - th); ctx.lineTo(lx + th * 0.12, ly); ctx.fill();
          ctx.fillStyle = '#c2303a'; for (let k = 0; k < 3; k++) ctx.fillRect(lx - th * 0.11, ly - th * (0.2 + k * 0.28), th * 0.22, th * 0.1);
          const lampY = ly - th - th * 0.08, a = Math.PI + Math.sin(t * 0.9) * 1.3;
          const beam = ctx.createLinearGradient(lx, lampY, lx + Math.cos(a) * W, lampY + Math.sin(a) * W * 0.25); beam.addColorStop(0, 'rgba(255,240,180,0.35)'); beam.addColorStop(1, 'rgba(255,240,180,0)');
          ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(lx, lampY); ctx.lineTo(lx + Math.cos(a - 0.08) * W, lampY + Math.sin(a - 0.08) * W * 0.25); ctx.lineTo(lx + Math.cos(a + 0.08) * W, lampY + Math.sin(a + 0.08) * W * 0.25); ctx.fill();
          glowDisc(ctx, lx, lampY, th * 0.05, '#fff3c2', 1);
          ctx.fillStyle = '#2a2a3a'; ctx.fillRect(lx - th * 0.08, lampY - th * 0.05, th * 0.16, th * 0.03);
        }
        const hull = dark(c[0], 0.55);
        g.boats.forEach(b => {
          const bx = x0 + b.x, s = b.s * H, by = hy + H * 0.04 + Math.sin(t * 1.2 + b.p) * 1.5; if (bx < -s * 3 || bx > W + s * 3) return;
          ctx.fillStyle = hull; ctx.beginPath(); ctx.moveTo(bx - s * 1.4, by); ctx.lineTo(bx + s * 1.4, by); ctx.lineTo(bx + s, by + s * 0.45); ctx.lineTo(bx - s, by + s * 0.45); ctx.fill(); ctx.fillRect(bx - 1, by - s * 1.8, 2, s * 1.8);
          if (b.sail) { ctx.fillStyle = 'rgba(230,230,240,0.55)'; ctx.beginPath(); ctx.moveTo(bx + 2, by - s * 1.7); ctx.lineTo(bx + s * 1.1, by - s * 0.2); ctx.lineTo(bx + 2, by - s * 0.2); ctx.fill(); }
          ctx.fillStyle = u.rgba('#ffd98a', 0.8); ctx.beginPath(); ctx.arc(bx - s * 0.8, by - 2, 1.4, 0, TAU); ctx.fill();
        });
      });
      const pier = dark(c[0], 0.75);
      tiles(W, S.sx * 0.16, 700, x0 => { const px = x0 + 100; ctx.fillStyle = pier; ctx.fillRect(px, base - H * 0.06, 260, H * 0.012); for (let k = 0; k < 7; k++) ctx.fillRect(px + k * 42, base - H * 0.06, 5, H * 0.08); });
    }
  };

  HR.Render.SCENES = SC;
  BG.drawScene = function (ctx, t) {
    const th = this.theme, sc = th && th.scene && SC[th.scene];
    if (!sc || !this.W) return;
    const key = th.id + ':' + th.scene;
    if (!this.sceneGeo || this.sceneGeo.key !== key) { let seed = 7; for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) % 2147483647; this.sceneGeo = { key, g: sc.build(rng(seed)) }; }
    const oy = this.sceneY || 0;
    ctx.save();
    sc.draw({ ctx, W: this.W, H: this.H, t, u: U(), o: th.sceneOpts || {}, c: th.colors, g: this.sceneGeo.g, sx: this.sx || 0, oy, base: this.H + oy });
    ctx.restore();
  };
})();
