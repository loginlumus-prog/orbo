/* =====================================================================
   ORBO v7 — A arte dos fragmentos.

   Os 33 cards nao sao 33 desenhos soltos: sao 33 arranjos dos MESMOS cinco
   elementos. E isso que faz uma serie parecer uma serie.

     fundo     o ceu da galaxia, em camadas, com poeira fina
     horizonte o rasgo — a linha entre os dois
     luzes     o pai (branco, aceso por dentro) e a mae (preta, acesa na borda)
     bola      Faisca, que comeca lavada e vai ganhando cor
     marca     o anel com o arranhao de quem segurou

   Qualidade de vetor vem de tres coisas, e todas estao aqui:
   - nada de preenchimento chapado: tudo e degrade com pelo menos tres paradas;
   - brilho feito com tracos sobrepostos (nao com shadowBlur, que borra e custa);
   - uma direcao de luz so, respeitada por todos os elementos.

   API: HR.FragArt.draw(ctx, W, H, cena, t)
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const TAU = Math.PI * 2;
  const U = () => HR.U;

  /* ---------------- ferramentas ---------------- */

  // numero estavel a partir de uma semente: a mesma carta desenha igual sempre
  function rnd(s) { let x = Math.sin(s * 127.1) * 43758.5453; return x - Math.floor(x); }

  // brilho por sobreposicao: 3 passadas, da mais larga e fraca para a mais fina e forte
  function bloom(ctx, cor, passes, desenha) {
    for (let i = passes.length - 1; i >= 0; i--) {
      const p = passes[i];
      ctx.strokeStyle = U().rgba(cor, p[1]);
      ctx.lineWidth = p[0];
      desenha();
    }
  }

  function discoLuz(ctx, x, y, r, cor, forca) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, U().rgba(cor, 0.55 * forca));
    g.addColorStop(0.35, U().rgba(cor, 0.22 * forca));
    g.addColorStop(1, U().rgba(cor, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }

  /* ---------------- 1. fundo ---------------- */
  function fundo(ctx, W, H, cor, semente, densidade) {
    const u = U();
    // ceu em tres camadas: base fria, clareira na altura do olhar, vinheta
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

    // poeira: o que da textura de arte feita a mao em vez de degrade de editor
    const n = Math.round((densidade == null ? 1 : densidade) * 190);
    for (let i = 0; i < n; i++) {
      const a = rnd(semente + i * 3.1), b = rnd(semente + i * 7.7), c = rnd(semente + i * 11.3);
      const x = a * W, y = b * H, r = 0.4 + c * 1.5;
      const brilho = 0.10 + c * 0.55;
      ctx.fillStyle = u.rgba(c > 0.86 ? cor : '#ffffff', brilho * (1 - Math.abs(y / H - 0.5) * 0.6));
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }

    // vinheta: fecha a composicao e faz o olho ir para o centro
    const v = ctx.createRadialGradient(W * 0.5, H * 0.5, H * 0.35, W * 0.5, H * 0.5, H * 0.95);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }

  /* ---------------- 2. horizonte (o rasgo) ---------------- */
  // fechamento 0 = aberto de par em par · 1 = quase fechado
  function horizonte(ctx, W, H, y, cor, fechamento, t, curva) {
    const u = U(), f = fechamento || 0;
    const meia = W * (0.46 - f * 0.34);
    const cx = W / 2;
    const arco = curva == null ? 0 : curva;
    const caminho = () => {
      ctx.beginPath();
      ctx.moveTo(cx - meia, y);
      ctx.quadraticCurveTo(cx, y - arco, cx + meia, y);
    };
    // halo largo por tras
    const g = ctx.createLinearGradient(cx - meia, y, cx + meia, y);
    g.addColorStop(0, u.rgba(cor, 0));
    g.addColorStop(0.5, u.rgba(cor, 0.30));
    g.addColorStop(1, u.rgba(cor, 0));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = g; ctx.fillRect(cx - meia, y - 26, meia * 2, 52);
    ctx.lineCap = 'round';
    bloom(ctx, cor, [[1.4, 0.95], [4, 0.35], [11, 0.12]], caminho.bind(null), caminho);
    // o traco de cima, branco, e o que da o "fio de luz"
    ctx.strokeStyle = u.rgba('#ffffff', 0.85 - f * 0.3); ctx.lineWidth = 1;
    caminho(); ctx.stroke();
    ctx.restore();
  }

  /* ---------------- 3. as duas luzes ---------------- */
  // o pai: aceso por dentro. Coroa de raios, camadas concentricas, miolo com
  // cruz de lente. A luz dele e toda de dentro para fora.
  function pai(ctx, x, y, r, t, forca) {
    const u = U(), k = forca == null ? 1 : forca;
    discoLuz(ctx, x, y, r * 3.4, '#cfe4ff', 0.8 * k);

    // coroa: raios finos de comprimento variavel, respirando devagar
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * TAU + t * 0.04;
      const L = r * (1.15 + (rnd(i * 4.7) * 0.75) * (0.75 + 0.25 * Math.sin(t * 1.3 + i)));
      const g = ctx.createLinearGradient(x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.95,
                                         x + Math.cos(a) * L, y + Math.sin(a) * L);
      g.addColorStop(0, u.rgba('#ffffff', 0.5 * k));
      g.addColorStop(1, u.rgba('#9fc3ee', 0));
      ctx.strokeStyle = g; ctx.lineWidth = r * (i % 4 === 0 ? 0.05 : 0.022);
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.95);
      ctx.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L);
      ctx.stroke();
    }
    ctx.restore();

    // corpo
    const corpo = ctx.createRadialGradient(x - r * 0.26, y - r * 0.3, r * 0.08, x, y, r);
    corpo.addColorStop(0, u.rgba('#ffffff', 0.99 * k));
    corpo.addColorStop(0.38, u.rgba('#f2f8ff', 0.95 * k));
    corpo.addColorStop(0.74, u.rgba('#b9d6f7', 0.85 * k));
    corpo.addColorStop(0.93, u.rgba('#7ba4d6', 0.7 * k));
    corpo.addColorStop(1, u.rgba('#4a6fa4', 0.5 * k));
    ctx.fillStyle = corpo; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();

    // camadas concentricas: o "por dentro" em cascas, nao em riscos soltos
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r * 0.99, 0, TAU); ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    // tres cascas, elipticas e desencontradas: insinuam profundidade sem virar alvo
    for (let i = 0; i < 3; i++) {
      const rr = r * (0.34 + i * 0.24) + Math.sin(t * 0.7 + i * 1.2) * r * 0.01;
      ctx.strokeStyle = u.rgba('#ffffff', (0.085 - i * 0.02) * k);
      ctx.lineWidth = r * 0.07;
      ctx.beginPath();
      ctx.ellipse(x - r * (0.10 + i * 0.03), y - r * (0.08 + i * 0.02), rr, rr * (0.86 - i * 0.05), -0.5 + i * 0.22, 0, TAU);
      ctx.stroke();
    }
    // dois filamentos atravessando, so para quebrar a simetria
    ctx.lineCap = 'round';
    for (let i = 0; i < 2; i++) {
      const a = i * 1.9 + Math.sin(t * 0.4 + i) * 0.2;
      ctx.strokeStyle = u.rgba('#ffffff', 0.3 * k);
      ctx.lineWidth = r * 0.045;
      ctx.beginPath();
      ctx.moveTo(x - r, y + Math.sin(a) * r * 0.6);
      ctx.quadraticCurveTo(x, y + Math.sin(a + 1.4) * r * 0.2, x + r, y + Math.sin(a + 2.6) * r * 0.6);
      ctx.stroke();
    }
    ctx.restore();

    // miolo: disco pulsando + cruz de lente, que e o que da o "aceso"
    const p = 0.5 + 0.5 * Math.sin(t * 1.1);
    discoLuz(ctx, x, y, r * (0.46 + p * 0.14), '#ffffff', 0.95 * k);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    [[1, 0], [0, 1]].forEach(d => {
      const L = r * (1.7 + p * 0.3);
      const g = ctx.createLinearGradient(x - d[0] * L, y - d[1] * L, x + d[0] * L, y + d[1] * L);
      g.addColorStop(0, u.rgba('#cfe4ff', 0)); g.addColorStop(0.5, u.rgba('#ffffff', 0.5 * k)); g.addColorStop(1, u.rgba('#cfe4ff', 0));
      ctx.strokeStyle = g; ctx.lineWidth = r * 0.05;
      ctx.beginPath(); ctx.moveTo(x - d[0] * L, y - d[1] * L); ctx.lineTo(x + d[0] * L, y + d[1] * L); ctx.stroke();
    });
    ctx.restore();

    // borda: dupla, uma quente por fora e uma branca por dentro
    ctx.strokeStyle = u.rgba('#dbeaff', 0.4 * k); ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(x, y, r * 1.012, 0, TAU); ctx.stroke();
    ctx.strokeStyle = u.rgba('#ffffff', 0.7 * k); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  }

  // a mae: funda, acesa nas bordas — onde ele tem miolo, ela tem contorno.
  // O oposto da coroa dele: a poeira nao sai, e puxada para dentro.
  function mae(ctx, x, y, r, t, forca) {
    const u = U(), k = forca == null ? 1 : forca;
    discoLuz(ctx, x, y, r * 3.4, '#6a4fd0', 0.55 * k);

    // poeira sendo puxada: riscos apontando para o centro, mais curtos perto dela
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * TAU - t * 0.05;
      const fora = r * (1.9 + rnd(i * 6.1) * 0.9);
      const perto = r * (1.06 + ((t * 0.35 + rnd(i * 2.9)) % 1) * 0.5);
      const g = ctx.createLinearGradient(x + Math.cos(a) * fora, y + Math.sin(a) * fora,
                                         x + Math.cos(a) * perto, y + Math.sin(a) * perto);
      g.addColorStop(0, u.rgba('#8f74e8', 0));
      g.addColorStop(1, u.rgba('#d9ccff', 0.45 * k));
      ctx.strokeStyle = g; ctx.lineWidth = r * 0.03;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a) * fora, y + Math.sin(a) * fora);
      ctx.lineTo(x + Math.cos(a) * perto, y + Math.sin(a) * perto);
      ctx.stroke();
    }
    ctx.restore();

    // corpo: fundo de verdade, com uma leve tonalidade roxa so na casca
    const corpo = ctx.createRadialGradient(x + r * 0.12, y + r * 0.1, r * 0.05, x, y, r);
    corpo.addColorStop(0, u.rgba('#020108', 1 * k));
    corpo.addColorStop(0.55, u.rgba('#080514', 0.99 * k));
    corpo.addColorStop(0.88, u.rgba('#190f34', 0.97 * k));
    corpo.addColorStop(1, u.rgba('#331f63', 0.95 * k));
    ctx.fillStyle = corpo; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();

    // o anel de dentro: a luz que ela engoliu e nao devolve
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r * 0.99, 0, TAU); ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = u.rgba('#6a4fd0', 0.30 * k); ctx.lineWidth = r * 0.05;
    ctx.beginPath(); ctx.ellipse(x + r * 0.06, y + r * 0.04, r * 0.62, r * 0.5, -0.4, 0, TAU); ctx.stroke();
    ctx.strokeStyle = u.rgba('#9f86ff', 0.16 * k); ctx.lineWidth = r * 0.03;
    ctx.beginPath(); ctx.ellipse(x - r * 0.04, y - r * 0.02, r * 0.38, r * 0.3, 0.5, 0, TAU); ctx.stroke();
    ctx.restore();

    // a borda acesa: tres trechos, de forcas diferentes, que e o que a define
    ctx.save(); ctx.lineCap = 'round';
    const a0 = -1.0 + Math.sin(t * 0.4) * 0.12;
    bloom(ctx, '#d9ccff', [[2, 1], [6, 0.32], [17, 0.12]], () => {
      ctx.beginPath(); ctx.arc(x, y, r * 0.995, a0, a0 + 2.3); ctx.stroke();
    });
    bloom(ctx, '#8f74e8', [[1.4, 0.75], [5, 0.22]], () => {
      ctx.beginPath(); ctx.arc(x, y, r * 0.995, a0 + 3.1, a0 + 4.6); ctx.stroke();
    });
    const a1 = a0 + 2.6 + Math.sin(t * 0.9) * 0.25;
    bloom(ctx, '#ffffff', [[1.1, 0.5 * (0.5 + 0.5 * Math.sin(t * 1.4))]], () => {
      ctx.beginPath(); ctx.arc(x, y, r * 0.995, a1, a1 + 0.42); ctx.stroke();
    });
    ctx.restore();

    // pouquissimos pontos dentro: ela absorve, nao brilha
    for (let i = 0; i < 3; i++) {
      const an = i * 2.2 + t * 0.18, rr = r * (0.28 + rnd(i * 5.5) * 0.4);
      ctx.fillStyle = u.rgba('#d9ccff', 0.42 * k);
      ctx.beginPath(); ctx.arc(x + Math.cos(an) * rr, y + Math.sin(an) * rr, 1.5, 0, TAU); ctx.fill();
    }
  }

  /* ---------------- 4. a bola ---------------- */
  // Yin-yang: a divisa em S, e cada metade carregando uma mancha da outra.
  // lavada 1 = sem cor nenhuma (comeco) · 0 = inteira
  function bola(ctx, x, y, r, t, lavada, giro) {
    const u = U(), L = lavada == null ? 0 : lavada;
    const claro = u.mix('#f6f8ff', '#b9bdca', L);
    const claro2 = u.mix('#c9d8f2', '#9aa0ae', L);
    const escuro = u.mix('#120f22', '#3a3a46', L);
    const escuro2 = u.mix('#2a2352', '#4a4a58', L);

    discoLuz(ctx, x, y, r * 2.8, u.mix('#9fe8ff', '#8a8fa6', L), 0.6 * (1 - L * 0.45));

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((giro || 0) + Math.sin(t * 0.25) * 0.05);   // ondula devagar, alem de girar
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.clip();

    // metade clara: o disco inteiro
    const gc = ctx.createLinearGradient(-r, -r, r * 0.6, r);
    gc.addColorStop(0, claro); gc.addColorStop(1, claro2);
    ctx.fillStyle = gc; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();

    // a divisa: uma onda livre do topo ao fundo. Nao e o S de compasso do
    // taijitu — os dois lados tem curvatura diferente e ela respira.
    const onda = Math.sin(t * 0.55) * 0.07;
    const c1x = r * (0.88 + onda), c1y = -r * 0.58;
    const c2x = -r * (0.74 - onda), c2y = r * 0.24;
    const divisa = () => {
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.bezierCurveTo(c1x, c1y, c2x, c2y, r * 0.06, r);
    };

    // metade escura: a onda, fechada pelo lado direito do disco
    const ge = ctx.createLinearGradient(-r * 0.4, -r, r, r);
    ge.addColorStop(0, escuro2); ge.addColorStop(1, escuro);
    ctx.fillStyle = ge;
    divisa();
    ctx.arc(0, 0, r, Math.PI / 2, -Math.PI / 2, true);
    ctx.closePath(); ctx.fill();

    // o fio de luz correndo pela divisa: a "mistura"
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = u.rgba('#9fe8ff', 0.22 * (1 - L * 0.7)); ctx.lineWidth = r * 0.15; divisa(); ctx.stroke();
    ctx.strokeStyle = u.rgba('#ffffff', 0.6 * (1 - L * 0.6)); ctx.lineWidth = r * 0.03; divisa(); ctx.stroke();
    ctx.restore();

    // as duas marcas: borroes com halo, na barriga de cada metade.
    // Nao sao circulos recortados — sao manchas, como tinta que passou.
    const mancha = (mx, my, cor, forca, tam) => {
      const g = ctx.createRadialGradient(mx - r * 0.04, my - r * 0.05, 0, mx, my, r * tam);
      g.addColorStop(0, u.rgba(cor, 1));
      g.addColorStop(0.62, u.rgba(cor, 0.88));
      g.addColorStop(0.85, u.rgba(cor, 0.45));
      g.addColorStop(1, u.rgba(cor, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mx, my, r * tam, 0, TAU); ctx.fill();
      ctx.strokeStyle = u.rgba('#ffffff', forca); ctx.lineWidth = r * 0.016;
      ctx.beginPath(); ctx.arc(mx, my, r * tam * 0.62, 0, TAU); ctx.stroke();
    };
    mancha(r * 0.34, -r * 0.30, '#f4f8ff', 0.45 * (1 - L * 0.5), 0.185);  // clara, dentro do escuro
    mancha(-r * 0.31, r * 0.33, u.mix('#120d24', '#454550', L), 0.16 * (1 - L), 0.215);  // escura, dentro do claro

    // volume: uma luz so, de cima a esquerda, por cima de tudo
    const vol = ctx.createRadialGradient(-r * 0.36, -r * 0.42, r * 0.04, 0, 0, r * 1.05);
    vol.addColorStop(0, u.rgba('#ffffff', 0.4 * (1 - L * 0.5)));
    vol.addColorStop(0.45, u.rgba('#ffffff', 0.05));
    vol.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = vol; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.restore();

    // acabamento: aro externo suave + risco de luz no alto
    ctx.strokeStyle = u.rgba('#ffffff', 0.28); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = u.rgba('#ffffff', 0.5 * (1 - L * 0.5)); ctx.lineWidth = r * 0.055;
    ctx.beginPath(); ctx.arc(x, y, r * 0.93, -2.5, -1.5); ctx.stroke();
    ctx.restore();
  }

  /* ---------------- 5. a marca (o anel arranhado) ---------------- */
  // tracado 0..1: quanto do arranhao ja foi escrito
  function marca(ctx, x, y, r, cor, tracado, t) {
    const u = U();
    ctx.save();
    ctx.lineCap = 'round';
    // o anel
    bloom(ctx, cor, [[2, 0.85], [6, 0.22], [16, 0.08]], () => {
      ctx.beginPath(); ctx.ellipse(x, y, r * 0.42, r, 0, 0, TAU); ctx.stroke();
    });
    ctx.strokeStyle = u.rgba('#ffffff', 0.5); ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.42, r, 0, 0, TAU); ctx.stroke();
    // o arranhao: sempre no mesmo lugar, escrito da esquerda para a direita
    const k = tracado == null ? 1 : Math.max(0, Math.min(1, tracado));
    if (k > 0.01) {
      const ax = x - r * 0.42, ay = y - r * 0.22;
      ctx.strokeStyle = u.rgba('#fff3c2', 0.95); ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo(ax + r * 0.22 * k, ay + r * 0.16 * k, ax + r * 0.42 * k, ay + r * 0.44 * k);
      ctx.stroke();
      discoLuz(ctx, ax + r * 0.42 * k, ay + r * 0.44 * k, 9, '#fff3c2', 0.9);
    }
    ctx.restore();
  }

  /* ---------------- 6. moldura ---------------- */
  // o acabamento: hairline por dentro, brilho no topo, canto arredondado
  function moldura(ctx, W, H, cor, raio) {
    const u = U(), R = raio == null ? 22 : raio;
    const rr = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
    };
    ctx.save();
    ctx.strokeStyle = u.rgba(cor, 0.30); ctx.lineWidth = 1.5;
    rr(0.75, 0.75, W - 1.5, H - 1.5, R); ctx.stroke();
    const topo = ctx.createLinearGradient(0, 0, 0, H * 0.22);
    topo.addColorStop(0, u.rgba('#ffffff', 0.12));
    topo.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = topo; rr(0.75, 0.75, W - 1.5, H - 1.5, R); ctx.fill();
    ctx.restore();
  }

  HR.FragArt = {
    fundo, horizonte, pai, mae, bola, marca, moldura, discoLuz, bloom, rnd
  };
})();
