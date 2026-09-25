/* =====================================================================
   ORBO v9 — nove temas novos e a revisao dos que existiam.

   Revisao: o fundo "bolhas" desenhava 26 circulos grandes vazados por cima
   de tudo — lia como rabisco, e na Floresta e no Oasis nem fazia sentido.
   Agora e bolha pequena de verdade (Oceano e Mar Profundo), e a Floresta e
   o Oasis ganham luzes suaves no lugar.

   Os nove novos, cada um com a sua animacao e um segredo:
     aquario     peixes, bolhas e algas            · um peixe dourado passa de vez em quando
     baleias     duas baleias cruzando o ceu       · de tempos em tempos elas cantam
     gatos       telhados, lua e gatos             · eles piscam
     invasores   formacao de pixel marchando       · um disco vermelho atravessa
     lousa       giz em papel de projeto           · a Faisca rabiscada no meio
     planetario  sistema solar em orbita           · um cometa passa
     lava        lampada de lava                   · —
     trem        colinas e o trem da meia-noite    · as vezes vem um trem comprido
     banho       bolhas de sabao e pato de borracha · as vezes, uma fila de patinhos

   Regra de todos: o fundo nunca disputa com o arco. O que se mexe fica
   fraco (alfa baixo), e o que e forte fica embaixo, no cenario.
   Efeitos em HR.Render.FX, cenarios em HR.Render.SCENES: o resto do jogo
   (loja, album, qualidade grafica) ja sabe lidar com os dois.
   ===================================================================== */
(function () {
  const C = HR.CONFIG, R = HR.Render;
  if (!R || !R.FX || !R.SCENES) return;
  const FX = R.FX, SC = R.SCENES, TAU = Math.PI * 2, U = () => HR.U;
  const wrap = (v, m) => ((v % m) + m) % m;
  const hash = (i, s) => { const v = Math.sin(i * 127.1 + (s || 0) * 311.7) * 43758.5453; return v - Math.floor(v); };
  function objs(bg, key, n) {
    bg.fxc = bg.fxc || {};
    let O = bg.fxc[key];
    if (!O || O.length !== n) { O = []; for (let i = 0; i < n; i++) O.push({ x: hash(i, 1), y: hash(i, 2), s: 0.5 + hash(i, 3), p: hash(i, 4) * TAU, v: 0.5 + hash(i, 5), h: hash(i, 6), a: hash(i, 7) * TAU }); bg.fxc[key] = O; }
    return O;
  }
  // repete um desenho de largura TW ao longo da tela, com parallax
  function tiles(W, off, TW, fn) { const s = wrap(off, TW); for (let x0 = -s; x0 < W; x0 += TW) fn(x0); }
  const escuro = (c, k) => U().mix(c, '#000000', k);

  /* ================= revisao das bolhas ================= */
  const Bg = R.Background.prototype, buildOrig = Bg.build;
  Bg.build = function () {
    const r = buildOrig.apply(this, arguments);
    if (this.theme && this.theme.shapes === 'bubbles' && this.shapes.length > 14) this.shapes.length = 14;
    return r;
  };
  // o desenho das bolhas: o render.js desenha 'bubbles' por dentro do draw();
  // aqui o tema passa a usar 'bolhas9' (proprio), e o antigo deixa de existir
  ['ocean', 'deepsea'].forEach(id => { const t = C.THEMES.find(x => x.id === id); if (t) { t.shapes = 'none'; t.bolhas = true; } });
  ['forest', 'oasis'].forEach(id => { const t = C.THEMES.find(x => x.id === id); if (t) t.shapes = 'orbs'; });
  const drawOrig = Bg.draw;
  Bg.draw = function (ctx, t) {
    drawOrig.apply(this, arguments);
    if (!this.theme || !this.theme.bolhas || !this.W) return;
    // bolhas pequenas subindo, com o brilho no canto: por cima do fundo, por baixo do jogo
    const u = U(), W = this.W, H = this.H;
    objs(this, 'bolhas9', 16).forEach((o, i) => {
      const r = 2 + o.s * 5, x = wrap(o.x * W + Math.sin(t * 0.9 + o.p) * 10 + (this.sx || 0) * 0.05, W), y = wrap(o.y * H - t * (14 + o.v * 16), H + 20) - 10;
      ctx.strokeStyle = u.rgba('#bfe8ff', 0.22); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
      ctx.fillStyle = u.rgba('#ffffff', 0.35); ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.25, 0, TAU); ctx.fill();
    });
  };

  /* ================= 1. Aquario ================= */
  const PEIXE = ['#ff9f43', '#ffd24a', '#4cf0ff', '#ff7ad9', '#7cff6b', '#ff5e7e'];
  function peixe(ctx, s, cor, t, fase, a) {
    const u = U();
    // cauda que abana
    ctx.save(); ctx.translate(-s * 0.85, 0); ctx.rotate(Math.sin(t * 9 + fase) * 0.35);
    ctx.fillStyle = u.rgba(cor, a); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-s * 0.7, -s * 0.5); ctx.quadraticCurveTo(-s * 0.5, 0, -s * 0.7, s * 0.5); ctx.closePath(); ctx.fill();
    ctx.restore();
    // corpo, barbatana e barriga
    ctx.fillStyle = u.rgba(cor, a); ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.58, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = u.rgba(u.mix(cor, '#000000', 0.25), a); ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.5); ctx.quadraticCurveTo(s * 0.1, -s * 1.05, s * 0.35, -s * 0.48); ctx.closePath(); ctx.fill();
    ctx.fillStyle = u.rgba('#ffffff', a * 0.35); ctx.beginPath(); ctx.ellipse(s * 0.1, s * 0.22, s * 0.55, s * 0.18, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = u.rgba('#0a1020', a * 0.45); ctx.lineWidth = Math.max(1, s * 0.08); ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.58, 0, 0, TAU); ctx.stroke();
    // olho
    ctx.fillStyle = u.rgba('#ffffff', a * 1.4); ctx.beginPath(); ctx.arc(s * 0.52, -s * 0.12, s * 0.17, 0, TAU); ctx.fill();
    ctx.fillStyle = u.rgba('#0a1020', a * 1.6); ctx.beginPath(); ctx.arc(s * 0.57, -s * 0.12, s * 0.08, 0, TAU); ctx.fill();
  }
  FX.peixes = (bg, ctx, t, al) => {
    const u = U(), W = bg.W, H = bg.H, sx = bg.sx || 0;
    // tres feixes de luz que descem da superficie
    for (let i = 0; i < 3; i++) {
      const x0 = W * (0.2 + i * 0.3) + Math.sin(t * 0.2 + i * 2) * 26, g = ctx.createLinearGradient(0, 0, 0, H * 0.8);
      g.addColorStop(0, u.rgba('#bff0ff', 0.08 * al)); g.addColorStop(1, 'rgba(191,240,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0 - 18, 0); ctx.lineTo(x0 + 18, 0); ctx.lineTo(x0 + 110, H * 0.8); ctx.lineTo(x0 - 90, H * 0.8); ctx.closePath(); ctx.fill();
    }
    objs(bg, 'peixes', 11).forEach((o, i) => {
      const lado = o.h > 0.5 ? 1 : -1, s = 7 + o.s * 9, span = W + 120;
      const x = wrap(o.x * span + lado * t * (18 + o.v * 22) + sx * 0.06, span) - 60, y = H * (0.14 + o.y * 0.6) + Math.sin(t * 1.3 + o.p) * 8;
      ctx.save(); ctx.translate(x, y); ctx.scale(lado, 1); ctx.rotate(Math.sin(t * 1.3 + o.p) * 0.08);
      peixe(ctx, s, PEIXE[i % PEIXE.length], t, o.p, 0.42 * al); ctx.restore();
    });
    // o segredo: um peixe dourado, grande, a cada 40 s
    const ciclo = 40, k = (t % ciclo) / 9;
    if (k < 1) {
      const x = -80 + k * (W + 160), y = H * 0.3 + Math.sin(t * 1.1) * 14;
      ctx.save(); ctx.translate(x, y);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 44); g.addColorStop(0, u.rgba('#fff2a0', 0.35 * al)); g.addColorStop(1, 'rgba(255,242,160,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 44, 0, TAU); ctx.fill();
      peixe(ctx, 20, '#ffcf3a', t, 0, 0.8 * al);
      for (let j = 0; j < 3; j++) { const a = t * 3 + j * 2.1; ctx.fillStyle = u.rgba('#ffffff', 0.7 * al); ctx.beginPath(); ctx.arc(Math.cos(a) * 30, Math.sin(a) * 18, 1.6, 0, TAU); ctx.fill(); }
      ctx.restore();
    }
    // bolhinhas
    objs(bg, 'peixesB', 12).forEach(o => {
      const r = 1.5 + o.s * 2.5, x = wrap(o.x * W + Math.sin(t + o.p) * 6, W), y = wrap(o.y * H - t * (20 + o.v * 18), H);
      ctx.strokeStyle = u.rgba('#dff6ff', 0.3 * al); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    });
  };
  SC.algas = {
    build(r) {
      const a = []; for (let i = 0; i < 9; i++) a.push({ x: 20 + i * 90 + r() * 50, h: 0.1 + r() * 0.16, seg: 6 + Math.floor(r() * 4), cor: r() });
      return { algas: a, bau: 180 + r() * 400, pedra: 60 + r() * 600 };
    },
    draw(S) {
      const { ctx, W, H, t, u, c, g } = S, base = S.base, TW = 900;
      tiles(W, S.sx * 0.12, TW, x0 => {
        // areia
        ctx.fillStyle = escuro(u.mix(c[2], '#c9a96a', 0.35), 0.45);
        ctx.beginPath(); ctx.moveTo(x0, base); for (let x = 0; x <= TW; x += 30) ctx.lineTo(x0 + x, base - H * (0.045 + Math.sin(x * 0.012) * 0.015)); ctx.lineTo(x0 + TW, base + 4); ctx.closePath(); ctx.fill();
        // algas que balancam
        ctx.lineCap = 'round';
        g.algas.forEach((a, i) => {
          const L = a.h * H, n = a.seg;
          ctx.strokeStyle = u.rgba(a.cor > 0.5 ? '#2fa36a' : '#1f7a5a', 0.75); ctx.lineWidth = 5;
          ctx.beginPath(); ctx.moveTo(x0 + a.x, base - H * 0.04);
          for (let k = 1; k <= n; k++) { const f = k / n, sw = Math.sin(t * 1.4 + i + f * 2.5) * 12 * f; ctx.lineTo(x0 + a.x + sw, base - H * 0.04 - L * f); }
          ctx.stroke();
        });
        // o bau (fechado, claro: o tesouro e o peixe dourado)
        const bx = x0 + g.bau, by = base - H * 0.05;
        ctx.fillStyle = '#6b3f1c'; ctx.fillRect(bx, by - 16, 30, 16);
        ctx.fillStyle = '#8a5428'; ctx.beginPath(); ctx.moveTo(bx, by - 16); ctx.quadraticCurveTo(bx + 15, by - 30, bx + 30, by - 16); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffcf4a'; ctx.fillRect(bx + 13, by - 18, 4, 7);
        // pedra
        ctx.fillStyle = escuro(c[1], 0.3); ctx.beginPath(); ctx.ellipse(x0 + g.pedra, base - H * 0.045, 34, 16, 0, Math.PI, TAU); ctx.fill();
      });
    }
  };

  /* ================= 2. Baleias do Ceu ================= */
  function baleia(ctx, s, t, fase, al) {
    const u = U(), flap = Math.sin(t * 1.1 + fase) * 0.22;
    ctx.save();
    // cauda
    ctx.save(); ctx.translate(-s * 1.05, -s * 0.02); ctx.rotate(flap);
    ctx.fillStyle = u.rgba('#26408c', 0.72 * al); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-s * 0.35, -s * 0.45, -s * 0.7, -s * 0.42); ctx.quadraticCurveTo(-s * 0.45, -s * 0.1, -s * 0.4, 0); ctx.quadraticCurveTo(-s * 0.45, s * 0.1, -s * 0.7, s * 0.42); ctx.quadraticCurveTo(-s * 0.35, s * 0.45, 0, 0); ctx.fill();
    ctx.restore();
    // corpo
    const corpo = () => { ctx.beginPath(); ctx.moveTo(s * 1.1, s * 0.05); ctx.bezierCurveTo(s * 1.05, -s * 0.5, s * 0.1, -s * 0.52, -s * 1.05, -s * 0.08); ctx.lineTo(-s * 1.05, s * 0.06); ctx.bezierCurveTo(-s * 0.2, s * 0.42, s * 0.8, s * 0.5, s * 1.1, s * 0.05); ctx.closePath(); };
    corpo(); ctx.fillStyle = u.rgba('#2c4a9e', 0.72 * al); ctx.fill();
    ctx.strokeStyle = u.rgba('#9fc0ff', 0.28 * al); ctx.lineWidth = Math.max(1, s * 0.025); ctx.stroke();
    ctx.save(); corpo(); ctx.clip();
    // barriga com sulcos
    ctx.fillStyle = u.rgba('#8fb0ff', 0.14 * al); ctx.beginPath(); ctx.ellipse(s * 0.25, s * 0.32, s * 0.9, s * 0.2, 0.05, 0, TAU); ctx.fill();
    ctx.strokeStyle = u.rgba('#bcd0ff', 0.14 * al); ctx.lineWidth = Math.max(1, s * 0.03);
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(s * 0.9, s * (0.2 + k * 0.05)); ctx.quadraticCurveTo(s * 0.2, s * (0.34 + k * 0.05), -s * 0.4, s * (0.2 + k * 0.04)); ctx.stroke(); }
    ctx.restore();
    // barbatana
    ctx.fillStyle = u.rgba('#1c2a66', 0.55 * al); ctx.beginPath(); ctx.moveTo(s * 0.35, s * 0.25); ctx.quadraticCurveTo(s * 0.1, s * 0.7, -s * 0.15, s * 0.62); ctx.quadraticCurveTo(s * 0.1, s * 0.38, s * 0.35, s * 0.25); ctx.fill();
    // pintas que brilham
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 7; k++) {
      const px = s * (0.8 - k * 0.27), py = -s * (0.18 - Math.abs(k - 3) * 0.02) + (k % 2) * s * 0.08, b = 0.5 + 0.5 * Math.sin(t * 2 + k * 0.9 + fase);
      ctx.fillStyle = u.rgba('#7ff0ff', (0.25 + 0.45 * b) * al); ctx.beginPath(); ctx.arc(px, py, s * 0.035, 0, TAU); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = u.rgba('#dff6ff', 0.6 * al); ctx.beginPath(); ctx.arc(s * 0.72, -s * 0.02, s * 0.03, 0, TAU); ctx.fill();
    ctx.restore();
  }
  FX.baleias = (bg, ctx, t, al) => {
    const u = U(), W = bg.W, H = bg.H;
    // plancton
    objs(bg, 'plancton', 34).forEach(o => {
      const b = 0.5 + 0.5 * Math.sin(t * 1.6 * o.v + o.p), x = wrap(o.x * W + (bg.sx || 0) * 0.04 + Math.sin(t * 0.3 + o.p) * 10, W), y = wrap(o.y * H - t * 3 * o.v, H);
      ctx.fillStyle = u.rgba('#8ff4ff', 0.12 + 0.3 * b * al); ctx.beginPath(); ctx.arc(x, y, 0.8 + o.s, 0, TAU); ctx.fill();
    });
    [[0.3, 0.13, 22, 1, 0], [0.62, 0.09, 15, -1, 3.1]].forEach(([fy, fs, vel, lado, fase], i) => {
      // o vao fora da tela e curto: quase sempre ha uma baleia a vista
      const s = H * fs, span = W + s * 2.6, x = lado > 0 ? wrap(t * vel + i * 400, span) - s * 1.3 : W + s * 1.3 - wrap(t * vel + i * 250, span);
      const y = H * fy + Math.sin(t * 0.35 + fase) * H * 0.02;
      ctx.save(); ctx.translate(x, y); ctx.scale(lado, 1); ctx.rotate(Math.sin(t * 0.35 + fase) * 0.05);
      baleia(ctx, s, t, fase, al);
      // o canto: a cada 12 s, ondas de luz saem da cabeca
      const k = ((t + i * 6) % 12) / 3;
      if (k < 1) for (let j = 0; j < 3; j++) { const kk = k - j * 0.18; if (kk <= 0) continue; ctx.strokeStyle = u.rgba('#9ff6ff', 0.35 * (1 - kk) * al); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s * 1.15, -s * 0.05, s * (0.2 + kk * 0.9), -0.9, 0.9); ctx.stroke(); }
      ctx.restore();
    });
  };

  /* ================= 3. Telhado dos Gatos ================= */
  SC.telhados = {
    build(r) {
      const casas = []; let x = 0;
      while (x < 1000) { const w = 70 + r() * 70; casas.push({ x, w, h: 0.07 + r() * 0.08, tel: 0.04 + r() * 0.035, cham: r() > 0.45, jan: [r() > 0.5, r() > 0.6], gato: r() > 0.55 ? { f: 0.2 + r() * 0.6, lado: r() > 0.5 ? 1 : -1, cor: r() } : null }); x += w + r() * 10; }
      return { casas, TW: x };
    },
    draw(S) {
      const { ctx, W, H, t, u, c, g } = S, base = S.base;
      // a lua
      // no canto de cima: no meio da tela ela ficava atras de um botao do menu e parecia um botao aceso
      const lx = W * 0.9, ly = base - H * 0.88, lr = H * 0.04;
      const lg = ctx.createRadialGradient(lx, ly, lr * 0.5, lx, ly, lr * 3); lg.addColorStop(0, 'rgba(255,244,210,0.16)'); lg.addColorStop(1, 'rgba(255,244,210,0)');
      ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(lx, ly, lr * 3, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff1c8'; ctx.beginPath(); ctx.arc(lx, ly, lr, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(210,190,140,0.5)'; [[-0.3, -0.2, 0.18], [0.25, 0.1, 0.22], [-0.05, 0.4, 0.12]].forEach(q => { ctx.beginPath(); ctx.arc(lx + q[0] * lr, ly + q[1] * lr, q[2] * lr, 0, TAU); ctx.fill(); });
      const muro = escuro(c[0], 0.55), telha = escuro(c[0], 0.7);
      tiles(W, S.sx * 0.1, g.TW, x0 => {
        g.casas.forEach((k, i) => {
          const bx = x0 + k.x; if (bx > W + 20 || bx + k.w < -20) return;
          const hy = base - k.h * H, ty = hy - k.tel * H;
          ctx.fillStyle = muro; ctx.fillRect(bx, hy, k.w, k.h * H + 2);
          ctx.fillStyle = telha; ctx.beginPath(); ctx.moveTo(bx - 6, hy); ctx.lineTo(bx + k.w / 2, ty); ctx.lineTo(bx + k.w + 6, hy); ctx.closePath(); ctx.fill();
          if (k.cham) { ctx.fillStyle = telha; ctx.fillRect(bx + k.w * 0.7, ty + (hy - ty) * 0.25 - 16, 10, 22); }
          k.jan.forEach((on, j) => { ctx.fillStyle = on ? 'rgba(255,207,110,0.75)' : 'rgba(255,207,110,0.12)'; ctx.fillRect(bx + k.w * (0.22 + j * 0.4), hy + k.h * H * 0.3, 11, 13); });
          if (!k.gato) return;
          // o gato sentado na cumeeira: rabo que balanca e olhos que piscam
          const gx = bx + k.w * 0.5 + (k.gato.f - 0.5) * k.w * 0.3, gy = ty + (hy - ty) * Math.abs(k.gato.f - 0.5) * 0.9, s = 7;
          ctx.fillStyle = '#0a0812';
          ctx.beginPath(); ctx.ellipse(gx, gy - s * 0.9, s * 0.75, s, 0, 0, TAU); ctx.fill();
          ctx.beginPath(); ctx.arc(gx, gy - s * 2.1, s * 0.6, 0, TAU); ctx.fill();
          ctx.beginPath(); ctx.moveTo(gx - s * 0.55, gy - s * 2.4); ctx.lineTo(gx - s * 0.4, gy - s * 3.05); ctx.lineTo(gx - s * 0.1, gy - s * 2.6); ctx.moveTo(gx + s * 0.55, gy - s * 2.4); ctx.lineTo(gx + s * 0.4, gy - s * 3.05); ctx.lineTo(gx + s * 0.1, gy - s * 2.6); ctx.fill();
          ctx.strokeStyle = '#0a0812'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
          const sw = Math.sin(t * 1.6 + i) * 0.6;
          ctx.beginPath(); ctx.moveTo(gx + s * 0.5 * k.gato.lado, gy - s * 0.3); ctx.quadraticCurveTo(gx + s * 1.6 * k.gato.lado, gy - s * 0.2, gx + s * (1.4 + sw * 0.4) * k.gato.lado, gy - s * (1.4 + sw)); ctx.stroke();
          const pisca = ((t * 0.7 + i * 1.37) % 4) < 0.14;
          ctx.fillStyle = k.gato.cor > 0.5 ? '#9dff8a' : '#ffd24a';
          if (pisca) { ctx.fillRect(gx - s * 0.36, gy - s * 2.15, s * 0.26, 1.2); ctx.fillRect(gx + s * 0.1, gy - s * 2.15, s * 0.26, 1.2); }
          else { ctx.beginPath(); ctx.ellipse(gx - s * 0.23, gy - s * 2.15, s * 0.13, s * 0.18, 0, 0, TAU); ctx.ellipse(gx + s * 0.23, gy - s * 2.15, s * 0.13, s * 0.18, 0, 0, TAU); ctx.fill(); }
        });
      });
    }
  };

  /* ================= 4. Invasores 8-bit ================= */
  // desenhos proprios em 8x8 (dois quadros cada)
  const ALIEN = [
    ['00111100', '01111110', '11011011', '11111111', '00100100', '01011010', '10100101', '01000010'],
    ['00111100', '01111110', '11011011', '11111111', '00100100', '01011010', '01000010', '00100100'],
    ['00011000', '00111100', '01111110', '11011011', '11111111', '00100100', '01011010', '10000001'],
    ['00011000', '00111100', '01111110', '11011011', '11111111', '01011010', '10000001', '01000010'],
    ['01000010', '00100100', '01111110', '11011011', '11111111', '10111101', '10100101', '00011000'],
    ['01000010', '10100101', '11111111', '11011011', '11111111', '00111100', '01000010', '10000001']
  ];
  const DISCO = ['0000111111110000', '0011111111111100', '0111111111111110', '1101101101101011', '1111111111111111', '0011100110011100', '0001000000001000'];
  function pixels(ctx, map, x, y, p) { for (let r = 0; r < map.length; r++) for (let q = 0; q < map[r].length; q++) if (map[r][q] === '1') ctx.fillRect(x + q * p, y + r * p, p, p); }
  FX.invasores = (bg, ctx, t, al) => {
    const u = U(), W = bg.W, H = bg.H, p = Math.max(2, Math.round(H / 280));
    // estrelas quadradas
    objs(bg, 'pix', 30).forEach(o => { const b = (Math.sin(t * 2 * o.v + o.p) > 0.2) ? 0.5 : 0.18; ctx.fillStyle = u.rgba('#ffffff', b * al); ctx.fillRect(Math.round(o.x * W), Math.round(o.y * H), p, p); });
    // a formacao: anda em degraus (o jeito do 8-bit), vai e volta, e desce
    const passo = Math.floor(t / 0.55), vai = passo % 16, dx = (vai < 8 ? vai : 16 - vai) * p * 2, desce = (Math.floor(passo / 16) % 6) * p * 4;
    const quadro = passo % 2, cols = 6, larg = 8 * p + p * 5, x0 = (W - cols * larg) / 2 - p * 8 + dx, y0 = H * 0.1 + desce;
    const cores = ['#ff7ad9', '#4cf0ff', '#7cff6b'];
    for (let r = 0; r < 3; r++) {
      ctx.fillStyle = u.rgba(cores[r], 0.32 * al);
      for (let q = 0; q < cols; q++) pixels(ctx, ALIEN[r * 2 + quadro], x0 + q * larg, y0 + r * (8 * p + p * 4), p);
    }
    // o disco vermelho: a cada 24 s atravessa la em cima
    const k = (t % 24) / 6;
    if (k < 1) { ctx.fillStyle = u.rgba('#ff5e5e', 0.6 * al); pixels(ctx, DISCO, -16 * p + k * (W + 32 * p), H * 0.045, p); }
  };

  /* ================= 5. Planta Azul (giz em papel de projeto) ================= */
  const RABISCO = {
    estrela(ctx, s) { ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, r = k % 2 ? s * 0.42 : s; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.stroke(); },
    planeta(ctx, s) { ctx.beginPath(); ctx.arc(0, 0, s * 0.6, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(0, 0, s * 1.15, s * 0.32, -0.35, 0, TAU); ctx.stroke(); },
    foguete(ctx, s) { ctx.beginPath(); ctx.moveTo(0, -s); ctx.quadraticCurveTo(s * 0.45, -s * 0.4, s * 0.35, s * 0.5); ctx.lineTo(-s * 0.35, s * 0.5); ctx.quadraticCurveTo(-s * 0.45, -s * 0.4, 0, -s); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -s * 0.25, s * 0.15, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-s * 0.35, s * 0.2); ctx.lineTo(-s * 0.65, s * 0.65); ctx.lineTo(-s * 0.3, s * 0.5); ctx.moveTo(s * 0.35, s * 0.2); ctx.lineTo(s * 0.65, s * 0.65); ctx.lineTo(s * 0.3, s * 0.5); ctx.moveTo(-s * 0.15, s * 0.6); ctx.lineTo(0, s * 0.95); ctx.lineTo(s * 0.15, s * 0.6); ctx.stroke(); },
    espiral(ctx, s) { ctx.beginPath(); for (let k = 0; k <= 40; k++) { const f = k / 40, a = f * 3 * TAU, r = f * s; k ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(0, 0); } ctx.stroke(); },
    coracao(ctx, s) { ctx.beginPath(); ctx.moveTo(0, s * 0.35); ctx.bezierCurveTo(-s * 1.1, -s * 0.35, -s * 0.45, -s * 1.05, 0, -s * 0.45); ctx.bezierCurveTo(s * 0.45, -s * 1.05, s * 1.1, -s * 0.35, 0, s * 0.35); ctx.stroke(); },
    raio(ctx, s) { ctx.beginPath(); ctx.moveTo(s * 0.2, -s); ctx.lineTo(-s * 0.35, s * 0.1); ctx.lineTo(s * 0.1, s * 0.1); ctx.lineTo(-s * 0.2, s); ctx.stroke(); },
    // a Faisca: um circulo com a helice dela
    faisca(ctx, s) { ctx.beginPath(); ctx.arc(0, 0, s * 0.8, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -s * 0.8); ctx.bezierCurveTo(s * 0.6, -s * 0.3, -s * 0.6, s * 0.3, 0, s * 0.8); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, -s * 0.8); ctx.bezierCurveTo(-s * 0.6, -s * 0.3, s * 0.6, s * 0.3, 0, s * 0.8); ctx.stroke(); }
  };
  const RAB = Object.keys(RABISCO);
  FX.rabiscos = (bg, ctx, t, al) => {
    const u = U(), W = bg.W, H = bg.H, ox = wrap((bg.sx || 0) * 0.05, 24), oy = wrap((bg.sy || 0) * 0.05, 24);
    // o papel quadriculado
    ctx.lineWidth = 1;
    for (let i = 0, x = -ox; x < W; x += 24, i++) { ctx.strokeStyle = u.rgba('#dff0ff', (i % 5 ? 0.05 : 0.1) * al); ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let i = 0, y = -oy; y < H; y += 24, i++) { ctx.strokeStyle = u.rgba('#dff0ff', (i % 5 ? 0.05 : 0.1) * al); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // os rabiscos a giz, andando devagar
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    objs(bg, 'rabiscos', 9).forEach((o, i) => {
      const tipo = i === 4 ? 'faisca' : RAB[i % (RAB.length - 1)], s = 14 + o.s * 12;
      const x = wrap(o.x * (W + 80) + (bg.sx || 0) * 0.08 - t * 4, W + 80) - 40, y = wrap(o.y * H + Math.sin(t * 0.4 + o.p) * 10, H);
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 0.3 + o.a) * 0.25 + o.a * 0.2);
      ctx.strokeStyle = u.rgba('#f4fbff', (tipo === 'faisca' ? 0.42 : 0.26) * al); ctx.lineWidth = 1.8;
      RABISCO[tipo](ctx, s);
      ctx.restore();
    });
    // uma cota tracejada, como em planta de verdade
    ctx.setLineDash([6, 5]); ctx.strokeStyle = u.rgba('#f4fbff', 0.15 * al); ctx.beginPath(); ctx.moveTo(W * 0.1, H * 0.9); ctx.lineTo(W * 0.9, H * 0.9); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(W * 0.1, H * 0.88); ctx.lineTo(W * 0.1, H * 0.92); ctx.moveTo(W * 0.9, H * 0.88); ctx.lineTo(W * 0.9, H * 0.92); ctx.stroke();
  };

  /* ================= 6. Planetario ================= */
  const ORB = [[0.16, 3.2, '#c9b8a8', 3.5], [0.26, 2.1, '#ffcf8a', 5], [0.38, 1.5, '#5fb4ff', 5.5, 'lua'], [0.5, 1.1, '#ff7a5a', 4.5], [0.7, 0.6, '#e3c29b', 9, 'anel'], [0.88, 0.4, '#9be7ff', 7]];
  FX.orrery = (bg, ctx, t, al) => {
    const u = U(), W = bg.W, H = bg.H, cx = W * 0.5 + Math.sin(t * 0.05) * 6, cy = H * 0.36, R = Math.min(W, H) * 0.62, inc = 0.34;
    ctx.lineWidth = 1;
    ORB.forEach(o => { ctx.strokeStyle = u.rgba('#ffffff', 0.07 * al); ctx.beginPath(); ctx.ellipse(cx, cy, R * o[0], R * o[0] * inc, 0, 0, TAU); ctx.stroke(); });
    const pos = ORB.map((o, i) => { const a = t * 0.12 * o[1] + i * 1.7; return { o, x: cx + Math.cos(a) * R * o[0], y: cy + Math.sin(a) * R * o[0] * inc, atras: Math.sin(a) < 0, a }; });
    const planeta = q => {
      const [, , cor, r, extra] = q.o;
      if (extra === 'anel') { ctx.strokeStyle = u.rgba('#f1dcc0', 0.55 * al); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(q.x, q.y, r * 1.9, r * 0.55, -0.3, 0, TAU); ctx.stroke(); }
      ctx.fillStyle = u.rgba(cor, 0.85 * al); ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, TAU); ctx.fill();
      // o lado longe do sol fica na sombra
      const ang = Math.atan2(q.y - cy, q.x - cx);
      ctx.fillStyle = u.rgba('#000000', 0.4 * al); ctx.beginPath(); ctx.arc(q.x, q.y, r, ang - Math.PI / 2, ang + Math.PI / 2); ctx.fill();
      if (extra === 'lua') { const la = t * 1.2; ctx.fillStyle = u.rgba('#dfe6f0', 0.8 * al); ctx.beginPath(); ctx.arc(q.x + Math.cos(la) * r * 2.4, q.y + Math.sin(la) * r * 0.9, 1.6, 0, TAU); ctx.fill(); }
    };
    pos.filter(q => q.atras).forEach(planeta);
    // o sol
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.12); g.addColorStop(0, u.rgba('#fff3c0', 0.9 * al)); g.addColorStop(0.4, u.rgba('#ffcf4a', 0.5 * al)); g.addColorStop(1, 'rgba(255,160,60,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 0.12, 0, TAU); ctx.fill();
    ctx.fillStyle = u.rgba('#fff6d8', 0.9 * al); ctx.beginPath(); ctx.arc(cx, cy, R * 0.035, 0, TAU); ctx.fill();
    pos.filter(q => !q.atras).forEach(planeta);
    // o cometa: a cada 30 s cruza na diagonal
    const k = (t % 30) / 5;
    if (k < 1) {
      const x = W * (1.1 - k * 1.3), y = H * (0.08 + k * 0.4), gr = ctx.createLinearGradient(x, y, x + 70, y - 22);
      gr.addColorStop(0, u.rgba('#ffffff', 0.8 * al)); gr.addColorStop(1, 'rgba(155,231,255,0)');
      ctx.strokeStyle = gr; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 70, y - 22); ctx.stroke();
    }
  };

  /* ================= 7. Lampada de Lava ================= */
  FX.lava = (bg, ctx, t, al) => {
    const u = U(), W = bg.W, H = bg.H;
    ctx.globalCompositeOperation = 'lighter';
    objs(bg, 'lava', 7).forEach((o, i) => {
      // sobe e desce devagar, esticando quando anda rapido
      const per = 22 + o.v * 18, f = 0.5 - 0.5 * Math.cos(TAU * (t / per + o.p / TAU)), vel = Math.sin(TAU * (t / per + o.p / TAU));
      const x = W * (0.15 + o.x * 0.7) + Math.sin(t * 0.2 + o.a) * W * 0.06, y = H * (0.95 - f * 0.9), r = H * (0.05 + o.s * 0.045);
      const cor = ['#ff5e7e', '#ff9f43', '#ffcf4a', '#ff7ad9'][i % 4];
      ctx.save(); ctx.translate(x, y); ctx.scale(1 - Math.abs(vel) * 0.18, 1 + Math.abs(vel) * 0.3);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.5); g.addColorStop(0, u.rgba(cor, 0.4 * al)); g.addColorStop(0.55, u.rgba(cor, 0.22 * al)); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 1.5, 0, TAU); ctx.fill();
      ctx.restore();
    });
    ctx.globalCompositeOperation = 'source-over';
  };

  /* ================= 8. Trem da Meia-Noite ================= */
  SC.trilhos = {
    build(r) { const m = []; for (let i = 0; i < 6; i++) m.push({ x: i * 180 + r() * 60, h: 0.1 + r() * 0.08 }); return { morros: m }; },
    draw(S) {
      const { ctx, W, H, t, u, c, g } = S, base = S.base;
      // lua pequena
      ctx.fillStyle = 'rgba(255,241,200,0.9)'; ctx.beginPath(); ctx.arc(W * 0.1, base - H * 0.88, H * 0.025, 0, TAU); ctx.fill();
      // morros de longe
      tiles(W, S.sx * 0.04, 1080, x0 => {
        ctx.fillStyle = escuro(c[1], 0.5); ctx.beginPath(); ctx.moveTo(x0, base);
        g.morros.forEach(m => ctx.quadraticCurveTo(x0 + m.x + 90, base - m.h * H * 1.8, x0 + m.x + 180, base - H * 0.08));
        ctx.lineTo(x0 + 1080, base); ctx.closePath(); ctx.fill();
      });
      // o aterro dos trilhos
      const ty = base - H * 0.1;
      ctx.fillStyle = escuro(c[0], 0.72); ctx.fillRect(0, ty, W, H * 0.12);
      ctx.fillStyle = escuro(c[0], 0.5); tiles(W, S.sx * 0.12, 22, x0 => ctx.fillRect(x0, ty - 2, 12, 3));
      ctx.fillStyle = 'rgba(200,210,240,0.35)'; ctx.fillRect(0, ty - 4, W, 1.5);
      // o trem: passa a cada 16 s. A cada quinta passagem, vem comprido
      const ciclo = 16, n = Math.floor(t / ciclo), k = (t % ciclo) / 9;
      if (k >= 1) return;
      const vag = n % 5 === 4 ? 9 : 4, L = 46, total = (vag + 1) * (L + 4), x = W + 20 - k * (W + total + 60);
      const casco = escuro(c[0], 0.85), janela = 'rgba(255,214,130,0.85)';
      for (let v = 0; v <= vag; v++) {
        const vx = x + v * (L + 4), vy = ty - 20;
        ctx.fillStyle = casco;
        if (v === 0) {
          ctx.beginPath(); ctx.moveTo(vx, vy + 20); ctx.lineTo(vx, vy + 4); ctx.quadraticCurveTo(vx, vy - 2, vx + 10, vy - 2); ctx.lineTo(vx + L, vy - 2); ctx.lineTo(vx + L, vy + 20); ctx.fill();
          ctx.fillRect(vx + L - 14, vy - 12, 8, 10);
          ctx.fillStyle = 'rgba(255,240,180,0.9)'; ctx.beginPath(); ctx.arc(vx + 3, vy + 10, 2.4, 0, TAU); ctx.fill();
          // fumaca
          for (let j = 0; j < 4; j++) { const f = ((t * 1.3 + j * 0.25) % 1); ctx.fillStyle = u.rgba('#c8d0e8', 0.25 * (1 - f)); ctx.beginPath(); ctx.arc(vx + L - 10 + f * 30, vy - 16 - f * 26, 4 + f * 8, 0, TAU); ctx.fill(); }
        } else {
          ctx.fillRect(vx, vy, L, 20);
          ctx.fillStyle = janela; for (let w = 0; w < 4; w++) ctx.fillRect(vx + 5 + w * 10, vy + 5, 6, 6);
        }
        ctx.fillStyle = '#05050a'; ctx.beginPath(); ctx.arc(vx + 9, ty - 1, 3, 0, TAU); ctx.arc(vx + L - 9, ty - 1, 3, 0, TAU); ctx.fill();
      }
    }
  };

  /* ================= 9. Hora do Banho ================= */
  FX.banho = (bg, ctx, t, al) => {
    const u = U(), W = bg.W, H = bg.H;
    objs(bg, 'banho', 12).forEach((o, i) => {
      const vida = 9 + o.v * 6, f = ((t + o.p * 3) % vida) / vida, r = 6 + o.s * 13;
      const x = wrap(o.x * W + Math.sin(t * 0.8 + o.p) * 14 + (bg.sx || 0) * 0.05, W), y = H * (1.05 - f * 1.1);
      if (f > 0.93) { // estoura: um anel e tres gotas
        const k = (f - 0.93) / 0.07;
        ctx.strokeStyle = u.rgba('#ffffff', 0.4 * (1 - k) * al); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, r * (1 + k * 0.6), 0, TAU); ctx.stroke();
        return;
      }
      ctx.strokeStyle = u.hsl((o.h * 360 + t * 40) % 360, 90, 75, 0.35 * al); ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
      ctx.fillStyle = u.rgba('#ffffff', 0.05 * al); ctx.fill();
      ctx.strokeStyle = u.rgba('#ffffff', 0.55 * al); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(x, y, r * 0.7, Math.PI * 1.1, Math.PI * 1.45); ctx.stroke();
    });
  };
  function pato(ctx, s, t, fase) {
    const bob = Math.sin(t * 2 + fase) * 0.08;
    ctx.save(); ctx.rotate(bob);
    ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.58, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-s * 0.9, -s * 0.1); ctx.lineTo(-s * 1.25, -s * 0.45); ctx.lineTo(-s * 0.7, -s * 0.3); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.55, -s * 0.62, s * 0.42, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ff8a2b'; ctx.beginPath(); ctx.ellipse(s * 1.02, -s * 0.52, s * 0.26, s * 0.12, 0.1, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1a1020'; ctx.beginPath(); ctx.arc(s * 0.7, -s * 0.72, s * 0.07, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.ellipse(-s * 0.2, -s * 0.22, s * 0.35, s * 0.1, -0.2, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(200,140,0,0.35)'; ctx.beginPath(); ctx.ellipse(-s * 0.1, s * 0.05, s * 0.45, s * 0.2, 0.2, 0, TAU); ctx.fill();
    ctx.restore();
  }
  SC.banheira = {
    build() { return {}; },
    draw(S) {
      const { ctx, W, H, t, u, c } = S, base = S.base, wy = base - H * 0.08;
      // azulejo ao fundo, bem apagado
      ctx.strokeStyle = u.rgba('#dff6ff', 0.05); ctx.lineWidth = 1;
      for (let x = wrap(-S.sx * 0.03, 40); x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, wy - H * 0.35); ctx.lineTo(x, wy); ctx.stroke(); }
      for (let y = wy; y > wy - H * 0.35; y -= 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      // o pato grande
      const px = W * 0.7 + Math.sin(t * 0.3) * W * 0.08;
      ctx.save(); ctx.translate(px, wy - 4 + Math.sin(t * 2) * 2); pato(ctx, 16, t, 0); ctx.restore();
      // o segredo: a cada 30 s, uma fila de patinhos
      const k = (t % 30) / 10;
      if (k < 1) for (let j = 0; j < 5; j++) { const x = W + 30 - k * (W + 260) + j * 32; ctx.save(); ctx.translate(x, wy - 2 + Math.sin(t * 3 + j) * 1.5); ctx.scale(-1, 1); pato(ctx, 8, t, j); ctx.restore(); }
      // a agua por cima (esconde a parte de baixo dos patos)
      ctx.fillStyle = u.rgba(u.mix(c[0], '#7fd6ff', 0.35), 0.75);
      ctx.beginPath(); ctx.moveTo(0, base); for (let x = 0; x <= W + 10; x += 10) ctx.lineTo(x, wy + Math.sin(x * 0.04 + t * 1.6) * 2.5); ctx.lineTo(W, base); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); for (let x = 0; x <= W + 10; x += 10) { const y = wy + Math.sin(x * 0.04 + t * 1.6) * 2.5; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    }
  };

  /* ================= os temas ================= */
  const P = HR.THEME_PRICE || { common: [3000, 55], rare: [10000, 170], epic: [36000, 540], legendary: [65000, 1050] };
  const NOVOS = [
    { id: 'banho',      rar: 'rare',      lvl: 5,  colors: ['#0e4a5a', '#0a3444', '#06222e'], shapes: 'none', stars: false, fx: 'banho', scene: 'banheira' },
    { id: 'aquario',    rar: 'rare',      lvl: 6,  colors: ['#0a3a5a', '#06243e', '#031423'], shapes: 'none', stars: false, fx: 'peixes', scene: 'algas' },
    { id: 'lousa',      rar: 'rare',      lvl: 8,  colors: ['#0f4478', '#0b3462', '#07264a'], shapes: 'none', stars: false, fx: 'rabiscos' },
    { id: 'lava',       rar: 'epic',      lvl: 12, colors: ['#3a0a3a', '#4a0c34', '#1e0418'], shapes: 'none', stars: false, fx: 'lava' },
    { id: 'gatos',      rar: 'epic',      lvl: 14, colors: ['#1c1838', '#2a2250', '#3a2a5a'], shapes: 'orbs', stars: true, fx: 'meteor', scene: 'telhados' },
    { id: 'invasores',  rar: 'epic',      lvl: 16, colors: ['#0a0a1e', '#0c0c28', '#05050f'], shapes: 'none', stars: false, fx: 'invasores' },
    { id: 'trem',       rar: 'epic',      lvl: 18, colors: ['#101a3a', '#1a2a5a', '#2a3a6a'], shapes: 'orbs', stars: true, fx: null, scene: 'trilhos' },
    { id: 'baleias',    rar: 'legendary', lvl: 20, colors: ['#1a1440', '#0e0c2a', '#050414'], shapes: 'nebula', stars: true, fx: 'baleias' },
    { id: 'planetario', rar: 'legendary', lvl: 22, colors: ['#120a24', '#0a0618', '#040210'], shapes: 'none', stars: true, fx: 'orrery' }
  ];
  NOVOS.forEach(t => {
    if (C.THEMES.some(x => x.id === t.id)) return;
    const pr = P[t.rar] || P.rare;
    t.cur = 'coins'; t.price = pr[0]; t.gems = pr[1]; t.sceneOpts = t.sceneOpts || {}; t.v9 = true;
    C.THEMES.push(t);
  });
})();

Object.assign(HR.I18N.pt, {
  theme_banho: 'Hora do Banho', flavor_theme_banho: 'Um pato. Às vezes, uma fila de patinhos.',
  theme_aquario: 'Aquário', flavor_theme_aquario: 'Dizem que um peixe dourado passa de vez em quando.',
  theme_lousa: 'Planta Azul', flavor_theme_lousa: 'O projeto de tudo isto, rabiscado a giz. Tem alguém conhecido no desenho.',
  theme_lava: 'Lâmpada de Lava', flavor_theme_lava: 'Sobe, desce, junta, separa. Hipnótico.',
  theme_gatos: 'Telhado dos Gatos', flavor_theme_gatos: 'Eles piscam quando acham que ninguém está olhando.',
  theme_invasores: 'Invasores 8-bit', flavor_theme_invasores: 'Descem um degrau por vez. Às vezes passa um disco vermelho.',
  theme_trem: 'Trem da Meia-Noite', flavor_theme_trem: 'Passa sempre no mesmo horário. Conte os vagões.',
  theme_baleias: 'Baleias do Céu', flavor_theme_baleias: 'Elas cantam baixinho. Quem espera, vê o canto.',
  theme_planetario: 'Planetário', flavor_theme_planetario: 'Tudo girando no lugar certo, sem pressa. E um cometa de vez em quando.'
});
Object.assign(HR.I18N.en, {
  theme_banho: 'Bath Time', flavor_theme_banho: 'One duck. Sometimes, a line of ducklings.',
  theme_aquario: 'Aquarium', flavor_theme_aquario: 'They say a golden fish swims by now and then.',
  theme_lousa: 'Blueprint', flavor_theme_lousa: 'The plan for all of this, sketched in chalk. Someone you know is in the drawing.',
  theme_lava: 'Lava Lamp', flavor_theme_lava: 'Up, down, together, apart. Hypnotic.',
  theme_gatos: 'Cat Rooftops', flavor_theme_gatos: 'They blink when they think no one is watching.',
  theme_invasores: '8-bit Invaders', flavor_theme_invasores: 'One step down at a time. Sometimes a red saucer flies by.',
  theme_trem: 'Midnight Train', flavor_theme_trem: 'Always on time. Count the cars.',
  theme_baleias: 'Sky Whales', flavor_theme_baleias: 'They sing softly. Wait, and you will see the song.',
  theme_planetario: 'Orrery', flavor_theme_planetario: 'Everything turning in its place, no hurry. And a comet now and then.'
});
Object.assign(HR.I18N.es, {
  theme_banho: 'Hora del Baño', flavor_theme_banho: 'Un pato. A veces, una fila de patitos.',
  theme_aquario: 'Acuario', flavor_theme_aquario: 'Dicen que a veces pasa un pez dorado.',
  theme_lousa: 'Plano Azul', flavor_theme_lousa: 'El proyecto de todo esto, dibujado con tiza. Hay alguien conocido en el dibujo.',
  theme_lava: 'Lámpara de Lava', flavor_theme_lava: 'Sube, baja, se junta, se separa. Hipnótico.',
  theme_gatos: 'Tejado de Gatos', flavor_theme_gatos: 'Parpadean cuando creen que nadie los mira.',
  theme_invasores: 'Invasores 8-bit', flavor_theme_invasores: 'Bajan un escalón a la vez. A veces pasa un platillo rojo.',
  theme_trem: 'Tren de Medianoche', flavor_theme_trem: 'Pasa siempre a la misma hora. Cuenta los vagones.',
  theme_baleias: 'Ballenas del Cielo', flavor_theme_baleias: 'Cantan bajito. Si esperas, ves el canto.',
  theme_planetario: 'Planetario', flavor_theme_planetario: 'Todo girando en su lugar, sin prisa. Y un cometa de vez en cuando.'
});
