/* =====================================================================
   ORBO v8 — A arte dos fragmentos, em vetor.

   Os 33 cards nao sao 33 desenhos soltos: sao 33 arranjos dos MESMOS cinco
   elementos. E isso que faz uma serie parecer uma serie.

     ceu       o fundo chapado na cor do ato, com uma grade de pontos
     horizonte o rasgo — a linha entre os dois
     luzes     o pai (branco, aceso por dentro) e a mae (preta, acesa na borda)
     bola      Faisca, que comeca lavada e vai ganhando cor
     marca     o anel com o arranhao de quem segurou

   O estilo e de ilustracao vetorial feita a mao (cartaz, carta de baralho):
   - toda forma tem CONTORNO escuro, com espessura proporcional a altura;
   - cor chapada em dois tons: base + sombra embaixo/direita, e um fio de
     luz na beirada de cima/esquerda. Uma luz so, a mesma em tudo;
   - brilho e feito em degraus chapados (discos concentricos), nao em
     degrade difuso. No maximo UM brilho pontual por card (discoLuz);
   - cada card tem a sua moldura desenhada dentro do quadro, com cantos
     diferentes por ato e um selo com o numero.

   fundo() e discoLuz() continuam existindo porque a historia (ui-story) usa.
   helice() e coresFaisca() sao a Faisca do jogo (skin-faisca, brand): a
   assinatura e o comportamento delas nao mudam.

   API: HR.FragArt.{ceu, forma, cunhas, estrela, fio, pai, mae, bola, marca,
        horizonte, moldura, LW, ESC, tomAto, ...}
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const TAU = Math.PI * 2;
  const U = () => HR.U;

  /* ---------------- ferramentas ---------------- */

  // numero estavel a partir de uma semente: a mesma carta desenha igual sempre
  function rnd(s) { let x = Math.sin(s * 127.1) * 43758.5453; return x - Math.floor(x); }

  // brilho por sobreposicao (ainda usado por quem quer um halo em tracos)
  function bloom(ctx, cor, passes, desenha) {
    for (let i = passes.length - 1; i >= 0; i--) {
      const p = passes[i];
      ctx.strokeStyle = U().rgba(cor, p[1]);
      ctx.lineWidth = p[0];
      desenha();
    }
  }

  // o unico brilho difuso permitido: um por card, no assunto
  function discoLuz(ctx, x, y, r, cor, forca) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, U().rgba(cor, 0.55 * forca));
    g.addColorStop(0.35, U().rgba(cor, 0.22 * forca));
    g.addColorStop(1, U().rgba(cor, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }

  /* ---------------- o vocabulario do vetor ---------------- */

  // espessura do contorno: 2,2% da altura do quadro, nunca fina demais
  const LW = H => Math.max(1.4, H * 0.022);
  // a cor do contorno, a mesma no mural inteiro: e o que faz a serie ser uma
  const ESC = '#0a0812';
  // o tom do ceu de cada ato
  const TONS = { 1: '#0f1a2e', 2: '#1b1226', 3: '#1f0f14', 4: '#17111a' };
  const tomAto = ato => TONS[ato] || TONS[1];

  // uma forma chapada completa: base, sombra (crescente embaixo/direita),
  // fio de luz (cima/esquerda) e contorno. `caminho` monta o path (com
  // beginPath) e e chamado varias vezes, deslocado pelo translate.
  //   o = { base, sombra, luz, contorno, lw, d }
  function forma(ctx, caminho, o) {
    const lw = o.lw, d = o.d == null ? lw * 1.6 : o.d;
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    caminho(); ctx.fillStyle = o.base; ctx.fill();
    if (o.sombra) {
      ctx.save(); caminho(); ctx.clip();
      caminho(); ctx.fillStyle = o.sombra; ctx.fill();
      ctx.translate(-d, -d); caminho(); ctx.fillStyle = o.base; ctx.fill();
      ctx.restore();
    }
    if (o.luz) {
      ctx.save(); caminho(); ctx.clip();
      ctx.translate(d, d); caminho();
      ctx.strokeStyle = o.luz; ctx.lineWidth = lw * 0.9; ctx.stroke();
      ctx.restore();
    }
    if (o.contorno !== false) {
      caminho(); ctx.strokeStyle = o.contorno || ESC; ctx.lineWidth = lw; ctx.stroke();
    }
    ctx.restore();
  }

  // path de circulo pronto para a forma()
  const circ = (ctx, x, y, r) => () => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); };
  const elip = (ctx, x, y, rx, ry, rot) => () => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, TAU); };

  // raios em cunha, chapados: a coroa de quem esta aceso por dentro.
  //   o = { longo, curto, larg, giro, contorno, alt }  (alt: alterna longo/curto)
  function cunhas(ctx, x, y, r0, n, cor, lw, o) {
    o = o || {};
    const giro = o.giro || 0, longo = o.longo || 1.7, curto = o.curto || 1.3, larg = o.larg || 0.16;
    ctx.save(); ctx.lineJoin = 'round';
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + giro, par = o.alt === false ? 0 : i % 2;
      const L = r0 * (par ? curto : longo), w = r0 * larg * (par ? 0.72 : 1);
      const ca = Math.cos(a), sa = Math.sin(a), px = -sa, py = ca;
      ctx.beginPath();
      ctx.moveTo(x + ca * r0 + px * w, y + sa * r0 + py * w);
      ctx.lineTo(x + ca * L, y + sa * L);
      ctx.lineTo(x + ca * r0 - px * w, y + sa * r0 - py * w);
      ctx.closePath();
      ctx.fillStyle = cor; ctx.fill();
      if (o.contorno !== false) { ctx.strokeStyle = ESC; ctx.lineWidth = lw * 0.6; ctx.stroke(); }
    }
    ctx.restore();
  }

  // estrela de quatro pontas, chapada: a estrela do vetor, nao o ponto difuso
  function estrela(ctx, x, y, r, cor, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.quadraticCurveTo(x, y, x, y + r); ctx.quadraticCurveTo(x, y, x - r, y);
    ctx.quadraticCurveTo(x, y, x, y - r); ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  // um fio com contorno: a linha do vetor. afina 0..1 = quanto ela afina ate a ponta
  function fio(ctx, pts, cor, lw, o) {
    o = o || {};
    const afina = o.afina || 0, n = pts.length - 1;
    if (n < 1) return;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (o.tracejado) ctx.setLineDash(o.tracejado);
    const passo = (cor2, mult) => {
      ctx.strokeStyle = cor2;
      if (!afina) {
        ctx.lineWidth = lw * mult;
        ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke();
        return;
      }
      // em tres trechos, cada um mais fino: barato e le como tinta acabando
      const T = 3;
      for (let s = 0; s < T; s++) {
        const a = Math.floor(n * s / T), b = Math.min(n, Math.floor(n * (s + 1) / T));
        ctx.lineWidth = Math.max(0.6, lw * mult * (1 - afina * (s + 0.5) / T));
        ctx.beginPath();
        for (let i = a; i <= b; i++) i === a ? ctx.moveTo(pts[i][0], pts[i][1]) : ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.stroke();
      }
    };
    if (o.contorno !== false) passo(o.contorno || ESC, 2.2);
    passo(cor, 1);
    if (o.luz) passo(o.luz, 0.35);
    ctx.restore();
  }

  /* ---------------- 1. o ceu ---------------- */
  // fundo chapado na cor do ato, clareira em degraus e uma grade de pontos.
  // foco = [x, y] em fracao: onde a clareira fica (o assunto do card)
  // v9: o ceu de desenho animado. Cada ato tem o seu ceu (antes todos eram
  // o mesmo azul-escuro chapado), com nuvens de contorno, um planeta ao longe
  // e estrelas de quatro pontas. A clareira e a grade de pontos continuam: a
  // clareira aponta o assunto, a grade e a retícula de gibi.
  const CEU = { 1: ['#2d78b3', '#0c1a36'], 2: ['#6f3fa3', '#170c2e'], 3: ['#b04052', '#210b18'], 4: ['#b98f3c', '#1d1428'] };
  function nuvem(ctx, x, y, s, cor, lw) {
    const u = U(), bolas = [[0, 0, 1], [-0.9, 0.25, 0.72], [0.95, 0.2, 0.78], [-0.35, -0.45, 0.7], [0.45, -0.38, 0.62]];
    const caminho = () => { ctx.beginPath(); bolas.forEach(b => { ctx.moveTo(x + b[0] * s + b[2] * s, y + b[1] * s); ctx.arc(x + b[0] * s, y + b[1] * s, b[2] * s, 0, TAU); }); };
    ctx.save();
    caminho(); ctx.strokeStyle = u.rgba(ESC, 0.45); ctx.lineWidth = lw * 2.2; ctx.stroke();
    caminho(); ctx.fillStyle = u.rgba(cor, 0.9); ctx.fill();
    // sombra chapada embaixo e brilho em cima: o volume de desenho
    ctx.save(); caminho(); ctx.clip();
    ctx.fillStyle = u.rgba(ESC, 0.16); ctx.fillRect(x - s * 2.2, y + s * 0.28, s * 4.4, s * 1.4);
    ctx.fillStyle = u.rgba('#ffffff', 0.22); ctx.beginPath(); ctx.ellipse(x - s * 0.35, y - s * 0.55, s * 0.9, s * 0.32, -0.15, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.restore();
  }
  function planeta(ctx, x, y, r, cor, lw) {
    const u = U();
    ctx.save(); ctx.lineCap = 'round';
    // o anel de tras
    ctx.strokeStyle = ESC; ctx.lineWidth = lw * 2.4; ctx.beginPath(); ctx.ellipse(x, y, r * 1.75, r * 0.5, -0.35, Math.PI, TAU); ctx.stroke();
    ctx.strokeStyle = u.mix(cor, '#ffffff', 0.45); ctx.lineWidth = lw * 1.2; ctx.beginPath(); ctx.ellipse(x, y, r * 1.75, r * 0.5, -0.35, Math.PI, TAU); ctx.stroke();
    forma(ctx, circ(ctx, x, y, r), { base: u.mix(cor, '#ffffff', 0.18), sombra: u.mix(cor, '#000000', 0.35), luz: u.rgba('#ffffff', 0.7), lw });
    // faixa do planeta
    ctx.save(); circ(ctx, x, y, r)(); ctx.clip(); ctx.fillStyle = u.rgba('#ffffff', 0.16); ctx.fillRect(x - r, y - r * 0.18, r * 2, r * 0.22); ctx.restore();
    // o anel da frente
    ctx.strokeStyle = ESC; ctx.lineWidth = lw * 2.4; ctx.beginPath(); ctx.ellipse(x, y, r * 1.75, r * 0.5, -0.35, 0, Math.PI); ctx.stroke();
    ctx.strokeStyle = u.mix(cor, '#ffffff', 0.45); ctx.lineWidth = lw * 1.2; ctx.beginPath(); ctx.ellipse(x, y, r * 1.75, r * 0.5, -0.35, 0, Math.PI); ctx.stroke();
    ctx.restore();
  }
  function ceu(ctx, W, H, cor, ato, semente, foco, o) {
    const u = U(); o = o || {};
    const par = CEU[ato] || CEU[1], alto = u.mix(par[0], cor, 0.28), baixo = par[1], lw = LW(H) * 0.7;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, alto); g.addColorStop(0.58, u.mix(baixo, alto, 0.4)); g.addColorStop(1, baixo);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const fx = W * (foco ? foco[0] : 0.5), fy = H * (foco ? foco[1] : 0.46);
    // retícula de gibi: pontos que crescem para baixo
    const passo = Math.max(7, H * 0.05);
    for (let j = 0, y = passo * 0.6; y < H; y += passo, j++) {
      const k = y / H, pt = Math.max(0.8, H * (0.002 + k * 0.005));
      ctx.fillStyle = u.rgba('#000000', 0.06 + k * 0.08);
      for (let x = passo * (j % 2 ? 0.5 : 1); x < W; x += passo) { ctx.beginPath(); ctx.arc(x, y, pt, 0, TAU); ctx.fill(); }
    }
    // o planeta ao longe, num canto que nao e o do assunto
    if (o.planeta !== false && rnd(semente * 1.7) > 0.55) {
      // lado sorteado; se o assunto estiver daquele lado, vai para o outro
      let esq = rnd(semente * 4.9) > 0.5;
      if (esq && fx < W * 0.4) esq = false; else if (!esq && fx > W * 0.6) esq = true;
      const px = W * (esq ? 0.15 : 0.85), py = H * (0.17 + rnd(semente * 2.3) * 0.08);
      planeta(ctx, px, py, H * (0.04 + rnd(semente * 3.1) * 0.018), u.mix(cor, par[0], 0.4), lw);
    }
    // nuvens: duas, nas beiradas de baixo, longe do assunto
    if (o.nuvens !== false) {
      const cn = u.mix(par[0], '#ffffff', 0.22);
      [[0.1, 0.86], [0.9, 0.9], [0.5, 0.97]].forEach((c, i) => {
        if (i === 2 && rnd(semente + 9) < 0.5) return;
        if (Math.abs(c[0] * W - fx) < W * 0.2 && Math.abs(c[1] * H - fy) < H * 0.25) return;
        nuvem(ctx, W * c[0], H * c[1], H * (0.075 + rnd(semente + i * 4.1) * 0.03), cn, lw);
      });
    }
    // a clareira: tres degraus chapados, claros, em volta do assunto
    if (o.clareira !== false) {
      [[1.05, 0.06], [0.72, 0.07], [0.42, 0.08]].forEach(c => {
        ctx.fillStyle = u.rgba(u.mix(cor, '#ffffff', 0.35), c[1]);
        ctx.beginPath(); ctx.ellipse(fx, fy, H * c[0] * 1.15, H * c[0] * 0.82, 0, 0, TAU); ctx.fill();
      });
    }
    // estrelas de quatro pontas, maiores, algumas na cor do card
    const n = o.estrelas == null ? 9 : o.estrelas;
    for (let i = 0; i < n; i++) {
      const x = W * (0.06 + rnd(semente + i * 3.1) * 0.88), y = H * (0.05 + rnd(semente + i * 7.7) * 0.4);
      if (Math.abs(x - fx) < H * 0.22 && Math.abs(y - fy) < H * 0.2) continue;
      estrela(ctx, x, y, H * (0.012 + rnd(semente + i * 5.3) * 0.018), i % 3 ? '#ffffff' : u.mix(cor, '#ffffff', 0.5), 0.9);
    }
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = u.rgba('#ffffff', 0.35 + rnd(semente + i * 1.3) * 0.4);
      ctx.beginPath(); ctx.arc(W * rnd(semente + i * 2.9), H * rnd(semente + i * 6.1) * 0.55, Math.max(0.8, H * 0.004), 0, TAU); ctx.fill();
    }
  }

  // o fundo antigo (difuso): fica porque a historia usa
  function fundo(ctx, W, H, cor, semente, densidade) {
    const u = U();
    const base = ctx.createLinearGradient(0, 0, 0, H);
    base.addColorStop(0, u.mix(cor, '#05070f', 0.86));
    base.addColorStop(0.55, '#05070f');
    base.addColorStop(1, '#02030a');
    ctx.fillStyle = base; ctx.fillRect(0, 0, W, H);
    const clareira = ctx.createRadialGradient(W * 0.5, H * 0.52, 0, W * 0.5, H * 0.52, W * 0.62);
    clareira.addColorStop(0, u.rgba(cor, 0.16));
    clareira.addColorStop(0.5, u.rgba(cor, 0.05));
    clareira.addColorStop(1, u.rgba(cor, 0));
    ctx.fillStyle = clareira; ctx.fillRect(0, 0, W, H);
    const n = Math.round((densidade == null ? 1 : densidade) * 190);
    for (let i = 0; i < n; i++) {
      const a = rnd(semente + i * 3.1), b = rnd(semente + i * 7.7), c = rnd(semente + i * 11.3);
      const x = a * W, y = b * H, r = 0.4 + c * 1.5;
      ctx.fillStyle = u.rgba(c > 0.86 ? cor : '#ffffff', (0.10 + c * 0.55) * (1 - Math.abs(y / H - 0.5) * 0.6));
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
    const v = ctx.createRadialGradient(W * 0.5, H * 0.5, H * 0.35, W * 0.5, H * 0.5, H * 0.95);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }

  /* ---------------- 2. horizonte (o rasgo) ---------------- */
  // uma lente branca com contorno: a fenda no ceu. fechamento 0..1
  function horizonte(ctx, W, H, y, cor, fechamento, t, curva) {
    const u = U(), f = fechamento || 0, lw = LW(H);
    const meia = W * (0.46 - f * 0.34), cx = W / 2;
    const arco = curva == null ? 0 : curva, grosso = H * 0.024 * (1 - f * 0.4) + lw;
    const lente = () => {
      ctx.beginPath();
      ctx.moveTo(cx - meia, y);
      ctx.quadraticCurveTo(cx, y - arco - grosso, cx + meia, y);
      ctx.quadraticCurveTo(cx, y - arco + grosso, cx - meia, y);
      ctx.closePath();
    };
    ctx.save();
    // o halo em degraus, chapado
    ctx.lineJoin = 'round';
    ctx.strokeStyle = u.rgba(cor, 0.16); ctx.lineWidth = lw * 5; lente(); ctx.stroke();
    ctx.strokeStyle = u.rgba(cor, 0.28); ctx.lineWidth = lw * 2.4; lente(); ctx.stroke();
    forma(ctx, lente, { base: '#ffffff', sombra: u.mix(cor, '#ffffff', 0.45), lw: lw * 0.8, d: lw * 0.9 });
    ctx.restore();
  }

  /* ---------------- 3. as duas luzes ---------------- */
  // o pai: aceso por dentro. Coroa de cunhas, disco branco, miolo com cruz.
  function pai(ctx, x, y, r, t, forca) {
    const u = U(), k = forca == null ? 1 : forca, lw = Math.max(1.2, r * 0.09);
    ctx.save();
    ctx.globalAlpha = k;
    // halo em degraus
    ctx.fillStyle = u.rgba('#cfe4ff', 0.10); ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, TAU); ctx.fill();
    ctx.fillStyle = u.rgba('#cfe4ff', 0.12); ctx.beginPath(); ctx.arc(x, y, r * 1.65, 0, TAU); ctx.fill();
    // a coroa: respira devagar, e so o comprimento muda — nunca a moldura
    const resp = 1 + Math.sin(t * 0.9) * 0.05;
    cunhas(ctx, x, y, r * 1.02, 16, '#f4f8ff', lw, { longo: 1.75 * resp, curto: 1.32 * resp, larg: 0.15, giro: -Math.PI / 2 + t * 0.03 });
    // o corpo: branco, sombra azulada, contorno
    forma(ctx, circ(ctx, x, y, r), { base: '#ffffff', sombra: '#b9d3f2', lw });
    // o miolo: uma cruz de lente chapada e o ponto
    ctx.fillStyle = '#8fb6e6';
    const b = r * 0.06, L = r * 0.62;
    ctx.beginPath(); ctx.rect(x - b, y - L, b * 2, L * 2); ctx.rect(x - L, y - b, L * 2, b * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x, y, r * 0.22, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#8fb6e6'; ctx.lineWidth = lw * 0.5; ctx.stroke();
    ctx.restore();
  }

  // a mae: funda, acesa nas bordas — onde ele tem miolo, ela tem contorno.
  function mae(ctx, x, y, r, t, forca) {
    const u = U(), k = forca == null ? 1 : forca, lw = Math.max(1.2, r * 0.09);
    ctx.save();
    ctx.globalAlpha = k;
    // halo escuro em degraus (ela escurece em volta, nao ilumina)
    ctx.fillStyle = u.rgba('#3a2a70', 0.16); ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, TAU); ctx.fill();
    ctx.fillStyle = u.rgba('#3a2a70', 0.22); ctx.beginPath(); ctx.arc(x, y, r * 1.6, 0, TAU); ctx.fill();
    // a poeira puxada: cunhas apontando para dentro, sem contorno
    ctx.save();
    ctx.translate(x, y); ctx.rotate(-t * 0.03);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU, fora = r * (1.85 + rnd(i * 6.1) * 0.35), perto = r * 1.16, w = r * 0.045;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * fora - Math.sin(a) * w, Math.sin(a) * fora + Math.cos(a) * w);
      ctx.lineTo(Math.cos(a) * perto, Math.sin(a) * perto);
      ctx.lineTo(Math.cos(a) * fora + Math.sin(a) * w, Math.sin(a) * fora - Math.cos(a) * w);
      ctx.closePath();
      ctx.fillStyle = u.rgba('#9f86ff', 0.55); ctx.fill();
    }
    ctx.restore();
    // o corpo: escuro, mais escuro embaixo, com a luz na beirada de cima
    forma(ctx, circ(ctx, x, y, r), { base: '#150e2a', sombra: '#07050f', luz: '#c9b4ff', lw });
    // a borda acesa: um arco grosso roxo e um fio branco curto, no lado da luz
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#c9b4ff'; ctx.lineWidth = lw * 1.1;
    ctx.beginPath(); ctx.arc(x, y, r - lw * 0.2, -2.7, -0.9); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = lw * 0.5;
    ctx.beginPath(); ctx.arc(x, y, r - lw * 0.2, -2.2, -1.7); ctx.stroke();
    // uma orbita fina dentro: a luz que ela engoliu
    ctx.strokeStyle = u.rgba('#6a4fd0', 0.6); ctx.lineWidth = lw * 0.45;
    ctx.beginPath(); ctx.ellipse(x + r * 0.05, y + r * 0.05, r * 0.58, r * 0.4, -0.5, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  /* ---------------- 4. a bola: a dupla helice ---------------- */
  /* Faisca nasceu da mistura de dois. Duas ondas espelhadas descem pelo meio
     do disco, se cruzam, e a cada cruzamento as cores TROCAM de fita.
     helice() e chamada com o contexto ja no centro e recortado no circulo.
     lavada 1 = sem cor nenhuma (comeco) · 0 = inteira
     (assinatura e desenho usados pela skin Faisca: nao mudar) */
  function helice(ctx, r, c, t, giro) {
    const u = U();
    const N = 30, VOLTAS = 1.55, amp = r * 0.37;
    const fase = (giro || 0) + t * 0.10;
    const ang = k => k * VOLTAS * TAU + fase;
    const yy = k => -r + k * 2 * r;
    const env = k => amp * Math.abs(Math.sin(ang(k)));

    const cortes = [0];
    for (let m = Math.ceil(ang(0) / Math.PI); ; m++) {
      const k = (m * Math.PI - fase) / (VOLTAS * TAU);
      if (k >= 1) break;
      if (k > 0.001) cortes.push(k);
    }
    cortes.push(1);
    const par = k => {
      const m = Math.floor((ang(k) + 1e-5) / Math.PI);
      return ((m % 2) + 2) % 2;
    };

    const grad = (a, b, alto) => {
      const g = ctx.createLinearGradient(-r * 0.5, -r, r * 0.6, r);
      g.addColorStop(0, alto ? a : b); g.addColorStop(1, alto ? b : a);
      return g;
    };

    ctx.fillStyle = grad(c.claro, c.claro2, 1);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.fillStyle = grad(c.escuro2, c.escuro, 1);
    ctx.beginPath();
    for (let i = 0; i <= N; i++) { const k = i / N, x = env(k); i ? ctx.lineTo(x, yy(k)) : ctx.moveTo(x, yy(k)); }
    ctx.arc(0, 0, r, Math.PI / 2, -Math.PI / 2, true);
    ctx.closePath(); ctx.fill();

    for (let m = 0; m < cortes.length - 1; m++) {
      const a = cortes[m], b = cortes[m + 1];
      if (b - a < 0.02) continue;
      const q = par(a + (b - a) * 0.5);
      ctx.fillStyle = q ? grad(c.claro, c.claro2, 0) : grad(c.escuro2, c.escuro, 0);
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) { const k = a + (b - a) * (i / 10), x = env(k); i ? ctx.lineTo(x, yy(k)) : ctx.moveTo(x, yy(k)); }
      for (let i = 10; i >= 0; i--) { const k = a + (b - a) * (i / 10); ctx.lineTo(-env(k), yy(k)); }
      ctx.closePath(); ctx.fill();
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = u.rgba(q ? c.escuro2 : c.brilho, 0.32);
      ctx.lineWidth = Math.max(0.6, r * 0.026); ctx.lineCap = 'round';
      [0.32, 0.5, 0.68].forEach(q => {
        const k = a + (b - a) * q, x = env(k) * 0.8;
        if (x < r * 0.04) return;
        ctx.beginPath(); ctx.moveTo(-x, yy(k)); ctx.lineTo(x, yy(k)); ctx.stroke();
      });
      ctx.restore();
    }

    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let m = 0; m < cortes.length - 1; m++) {
      const a = cortes[m], b = cortes[m + 1];
      if (b - a < 0.02) continue;
      const fita = (sinal, cor, frente) => {
        const caminho = () => {
          ctx.beginPath();
          for (let i = 0; i <= 12; i++) { const k = a + (b - a) * (i / 12), x = sinal * env(k); i ? ctx.lineTo(x, yy(k)) : ctx.moveTo(x, yy(k)); }
        };
        const g = ctx.createLinearGradient(0, yy(a), 0, yy(b));
        const op = frente ? 1 : 0.5;
        g.addColorStop(0, u.rgba(cor, 0.12 * op));
        g.addColorStop(0.5, u.rgba(cor, 0.95 * op));
        g.addColorStop(1, u.rgba(cor, 0.12 * op));
        ctx.strokeStyle = u.rgba(cor, (frente ? 0.4 : 0.18));
        ctx.lineWidth = r * (frente ? 0.11 : 0.085); caminho(); ctx.stroke();
        ctx.strokeStyle = g;
        ctx.lineWidth = Math.max(0.8, r * (frente ? 0.046 : 0.032)); caminho(); ctx.stroke();
        if (frente) {
          ctx.strokeStyle = u.rgba('#ffffff', 0.34);
          ctx.lineWidth = Math.max(0.5, r * 0.012); caminho(); ctx.stroke();
        }
      };
      const q = par(a + (b - a) * 0.5);
      const dir = q ? c.brilhoClaro : c.escuroForte;
      const esq = q ? c.escuroForte : c.brilhoClaro;
      if (q) { fita(-1, esq, false); fita(1, dir, true); }
      else { fita(1, dir, false); fita(-1, esq, true); }
    }
    ctx.globalCompositeOperation = 'lighter';
    [1, -1].forEach(sinal => {
      ctx.beginPath();
      for (let i = 0; i <= N; i++) { const k = i / N, x = sinal * env(k); i ? ctx.lineTo(x, yy(k)) : ctx.moveTo(x, yy(k)); }
      ctx.strokeStyle = u.rgba(c.brilho, 0.16); ctx.lineWidth = r * 0.14; ctx.stroke();
    });
    ctx.restore();

    const mancha = (mx, my, cor, aro, tam) => {
      const g = ctx.createRadialGradient(mx - r * 0.04, my - r * 0.05, 0, mx, my, r * tam);
      g.addColorStop(0, u.rgba(cor, 1));
      g.addColorStop(0.6, u.rgba(cor, 0.85));
      g.addColorStop(0.85, u.rgba(cor, 0.4));
      g.addColorStop(1, u.rgba(cor, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mx, my, r * tam, 0, TAU); ctx.fill();
      ctx.strokeStyle = u.rgba('#ffffff', aro); ctx.lineWidth = Math.max(0.5, r * 0.014);
      ctx.beginPath(); ctx.arc(mx, my, r * tam * 0.6, 0, TAU); ctx.stroke();
    };
    mancha(r * 0.58, -r * 0.46, c.brilhoClaro, 0.32, 0.115);
    mancha(-r * 0.56, r * 0.48, c.escuroForte, 0.13, 0.135);

    const vol = ctx.createRadialGradient(-r * 0.36, -r * 0.42, r * 0.04, 0, 0, r * 1.05);
    vol.addColorStop(0, u.rgba('#ffffff', c.luz));
    vol.addColorStop(0.45, u.rgba('#ffffff', 0.05));
    vol.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = vol; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  }

  // as cores da helice a partir de "lavada" (1 = sem cor, 0 = inteira).
  // base permite a skin trocar as duas cores sem refazer o desenho.
  function coresFaisca(L, base) {
    const u = U(), b = base || {};
    return {
      claro:   u.mix(b.claro   || '#f6f8ff', '#b9bdca', L),
      claro2:  u.mix(b.claro2  || '#c9d8f2', '#9aa0ae', L),
      escuro:  u.mix(b.escuro  || '#120f22', '#3a3a46', L),
      escuro2: u.mix(b.escuro2 || '#2a2352', '#4a4a58', L),
      brilho:  u.mix(b.brilho  || '#9fe8ff', '#8a8fa6', L),
      brilhoClaro: u.mix(b.claroForte || '#ffffff', '#cfd3dd', L),
      escuroForte: u.mix(b.escuroForte || '#0b0818', '#2e2e38', L),
      luz: 0.4 * (1 - L * 0.5)
    };
  }

  // a bola no card: helice dentro, contorno e fio de luz por fora, halo em degraus
  function bola(ctx, x, y, r, t, lavada, giro) {
    const u = U(), L = lavada == null ? 0 : lavada;
    const c = coresFaisca(L), lw = Math.max(1.2, r * 0.11);
    // halo em degraus: dois aneis chapados, mais fracos quanto mais lavada
    ctx.fillStyle = u.rgba(c.brilho, 0.10 * (1 - L * 0.5)); ctx.beginPath(); ctx.arc(x, y, r * 1.75, 0, TAU); ctx.fill();
    ctx.fillStyle = u.rgba(c.brilho, 0.14 * (1 - L * 0.5)); ctx.beginPath(); ctx.arc(x, y, r * 1.32, 0, TAU); ctx.fill();
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((giro || 0) * 0.25 + Math.sin(t * 0.25) * 0.05);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.clip();
    helice(ctx, r, c, t, 0);
    ctx.restore();
    // contorno e o fio de luz de cima/esquerda
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = ESC; ctx.lineWidth = lw;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    ctx.strokeStyle = u.rgba('#ffffff', 0.85 - L * 0.3); ctx.lineWidth = lw * 0.55;
    ctx.beginPath(); ctx.arc(x, y, r - lw * 0.9, -2.7, -1.1); ctx.stroke();
    // v9: o reflexo de desenho animado — uma gota branca e um ponto
    ctx.fillStyle = u.rgba('#ffffff', 0.8 - L * 0.35);
    ctx.beginPath(); ctx.ellipse(x - r * 0.38, y - r * 0.42, r * 0.24, r * 0.13, -0.7, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(x - r * 0.12, y - r * 0.6, r * 0.06, 0, TAU); ctx.fill();
    ctx.restore();
  }

  /* ---------------- 5. a marca (o anel arranhado) ---------------- */
  // anel em traco grosso com contorno dos dois lados e luz na beirada de cima.
  // tracado 0..1: quanto do arranhao ja foi escrito
  function marca(ctx, x, y, r, cor, tracado, t, o) {
    const u = U(), lw = o && o.lw || Math.max(1.2, r * 0.06);
    const rx = r * 0.42, ry = r;
    ctx.save(); ctx.lineCap = 'round';
    // halo chapado
    ctx.strokeStyle = u.rgba(cor, 0.18); ctx.lineWidth = lw * 5;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.stroke();
    // contorno, corpo, luz
    ctx.strokeStyle = ESC; ctx.lineWidth = lw * 2.6;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = cor; ctx.lineWidth = lw * 1.5;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.stroke();
    ctx.strokeStyle = u.rgba('#ffffff', 0.85); ctx.lineWidth = lw * 0.5;
    ctx.beginPath(); ctx.ellipse(x, y, rx - lw * 0.35, ry - lw * 0.35, 0, -2.9, -1.2); ctx.stroke();
    // o arranhao: sempre no mesmo lugar, escrito da esquerda para a direita
    const k = tracado == null ? 1 : Math.max(0, Math.min(1, tracado));
    if (k > 0.01) {
      const ax = x - rx, ay = y - r * 0.22;
      const risco = () => {
        ctx.beginPath(); ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo(ax + rx * 0.55 * k, ay + r * 0.16 * k, ax + rx * k, ay + r * 0.44 * k);
      };
      ctx.strokeStyle = ESC; ctx.lineWidth = lw * 2.2; risco(); ctx.stroke();
      ctx.strokeStyle = '#fff3c2'; ctx.lineWidth = lw * 1.1; risco(); ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.arc(ax + rx * k, ay + r * 0.44 * k, lw * 0.9, 0, TAU); ctx.fill();
    }
    ctx.restore();
  }

  /* ---------------- 6. moldura ---------------- */
  // a bordinha desenhada dentro do card: borda dupla, cantos por ato e selo.
  //   o = { ato, num, mini, trancado, selo: 'base' | 'topo' | false, tom }
  // sem `o` desenha so a borda (compatibilidade com quem chamava antes).
  const ROMANO = ['', 'I', 'II', 'III', 'IV'];
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
  }

  function moldura(ctx, W, H, cor, raio, o) {
    const u = U(), R = raio == null ? 22 : raio;
    if (!o) {
      ctx.save();
      ctx.strokeStyle = u.rgba(cor, 0.30); ctx.lineWidth = 1.5;
      rr(ctx, 0.75, 0.75, W - 1.5, H - 1.5, R); ctx.stroke();
      ctx.restore();
      return;
    }
    const mini = !!o.mini, base = Math.min(W, H);
    const m = Math.max(4, Math.round(base * (mini ? 0.055 : 0.042)));
    const lw = Math.max(1.1, base * (mini ? 0.014 : 0.0075));
    const tom = o.tom || ESC;
    // mt: margem de cima maior quando ha cabecalho por cima (card em tela cheia)
    const mt = o.mt == null ? m : o.mt;
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    // a sombra da borda (por baixo), a borda, e a hairline de dentro
    ctx.strokeStyle = u.rgba(ESC, 0.85); ctx.lineWidth = lw * 4.6;
    rr(ctx, m, mt, W - 2 * m, H - mt - m, R * 0.7); ctx.stroke();
    ctx.strokeStyle = cor; ctx.lineWidth = lw * 2.6;
    rr(ctx, m, mt, W - 2 * m, H - mt - m, R * 0.7); ctx.stroke();
    // v9: o bisel da moldura, um fio claro em cima da faixa (volume de desenho)
    ctx.strokeStyle = u.rgba(u.mix(cor, '#ffffff', 0.6), 0.75); ctx.lineWidth = lw * 0.8;
    rr(ctx, m - lw * 0.45, mt - lw * 0.45, W - 2 * m, H - mt - m, R * 0.7); ctx.stroke();
    const mi = m + lw * 3.4, mti = mt + lw * 3.4;
    ctx.strokeStyle = u.rgba(cor, 0.42); ctx.lineWidth = lw * 0.7;
    rr(ctx, mi, mti, W - 2 * mi, H - mti - mi, Math.max(2, R * 0.45)); ctx.stroke();

    // os cantos: um enfeite por ato, nos quatro cantos, sempre apontando para dentro
    const ato = o.ato || 1, e = lw * (mini ? 3.2 : 4.2);
    [[m, mt, 1, 1], [W - m, mt, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]].forEach(c => {
      ctx.save();
      ctx.translate(c[0], c[1]); ctx.scale(c[2], c[3]);
      // fundo do canto: tapa a borda para o enfeite ficar limpo
      ctx.fillStyle = tom; ctx.strokeStyle = cor; ctx.lineWidth = lw;
      if (ato === 1) {
        // o berco: cantos com pontinhos, tres na diagonal
        ctx.beginPath(); ctx.arc(e * 0.5, e * 0.5, e * 0.55, 0, TAU); ctx.fill();
        for (let i = 0; i < 3; i++) {
          ctx.beginPath(); ctx.arc(e * (0.25 + i * 0.35), e * (0.25 + i * 0.35), lw * (i === 1 ? 1.0 : 0.65), 0, TAU);
          ctx.fillStyle = cor; ctx.fill();
        }
      } else if (ato === 2) {
        // lembrar: mares — duas ondas curtas saindo do canto
        ctx.fillStyle = tom; ctx.beginPath(); ctx.arc(e * 0.4, e * 0.4, e * 0.6, 0, TAU); ctx.fill();
        for (let i = 0; i < 2; i++) {
          const q = e * (0.35 + i * 0.4);
          ctx.beginPath(); ctx.arc(0, 0, q, 0.15, Math.PI / 2 - 0.15); ctx.stroke();
        }
        ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(e * 0.12, e * 0.12, lw * 0.9, 0, TAU); ctx.fill();
      } else if (ato === 3) {
        // escolher: brasa e gume — um losango com uma ponta viva
        ctx.fillStyle = tom; ctx.beginPath(); ctx.arc(e * 0.45, e * 0.45, e * 0.6, 0, TAU); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(e * 0.1, e * 0.5); ctx.lineTo(e * 0.5, e * 0.1); ctx.lineTo(e * 0.9, e * 0.5); ctx.lineTo(e * 0.5, e * 0.9); ctx.closePath();
        ctx.fillStyle = cor; ctx.fill(); ctx.strokeStyle = tom; ctx.lineWidth = lw * 0.5; ctx.stroke();
        ctx.strokeStyle = cor; ctx.lineWidth = lw;
        ctx.beginPath(); ctx.moveTo(e * 0.5, e * 0.9); ctx.lineTo(e * 1.25, e * 1.25); ctx.stroke();
      } else {
        // depois do fim: chave e porta — um arco de porta com a fechadura
        ctx.fillStyle = tom; ctx.beginPath(); ctx.arc(e * 0.45, e * 0.45, e * 0.62, 0, TAU); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(e * 0.15, e * 0.95); ctx.lineTo(e * 0.15, e * 0.45);
        ctx.arc(e * 0.5, e * 0.45, e * 0.35, Math.PI, 0);
        ctx.lineTo(e * 0.85, e * 0.95); ctx.closePath();
        ctx.strokeStyle = cor; ctx.lineWidth = lw; ctx.stroke();
        ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(e * 0.5, e * 0.55, lw * 0.9, 0, TAU); ctx.fill();
        ctx.fillRect(e * 0.5 - lw * 0.35, e * 0.55, lw * 0.7, e * 0.25);
      }
      ctx.restore();
    });

    // o selo: numero e ato, sentado na borda (em cima ou embaixo)
    if (o.selo !== false) {
      const txt = o.trancado ? '?' : (String(o.num || 0).padStart(2, '0') + (mini ? '' : ' · ' + (ROMANO[ato] || '')));
      const tam = Math.max(8, Math.round(base * (mini ? 0.095 : 0.038)));
      ctx.font = '700 ' + tam + "px 'Fredoka', 'Rubik', sans-serif";
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const lg = Math.max(tam * 1.6, ctx.measureText(txt).width + tam * 1.2), al = tam * 1.55;
      const cy = o.selo === 'topo' ? mt : H - m, cx = W / 2;
      ctx.fillStyle = tom; ctx.strokeStyle = cor; ctx.lineWidth = lw * 1.2;
      rr(ctx, cx - lg / 2, cy - al / 2, lg, al, al / 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = o.trancado ? u.rgba(cor, 0.7) : cor;
      ctx.fillText(txt, cx, cy + tam * 0.06);
    }
    ctx.restore();
  }

  HR.FragArt = {
    fundo, ceu, horizonte, pai, mae, bola, marca, moldura, discoLuz, bloom, rnd, helice, coresFaisca,
    forma, circ, elip, cunhas, estrela, fio, LW, ESC, tomAto, rr
  };
})();
