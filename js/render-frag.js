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
    // bloom so acende se o desenho passado traçar: antes o caminho era montado
    // e nunca riscado, entao o rasgo ficava sem brilho nenhum.
    bloom(ctx, cor, [[1.4, 0.95], [4, 0.35], [11, 0.12]], () => { caminho(); ctx.stroke(); });
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

  /* ---------------- 4. a bola: a dupla helice ---------------- */
  /* Faisca nasceu da mistura de dois. Entao ela nao e um lado e outro lado: ela
     e as duas coisas enroscadas. Duas ondas espelhadas descem pelo meio do
     disco, se cruzam, e a cada cruzamento as cores TROCAM de fita — e por isso
     que nenhuma das duas e dona da bola.

     Lembra o taijitu de longe, que e o que se quer, e nao e copia dele.

     helice() e chamada com o contexto ja no centro e recortado no circulo.
     lavada 1 = sem cor nenhuma (comeco) · 0 = inteira */
  function helice(ctx, r, c, t, giro) {
    const u = U();
    const N = 30, VOLTAS = 1.55, amp = r * 0.37;
    const fase = (giro || 0) + t * 0.10;
    const ang = k => k * VOLTAS * TAU + fase;
    const yy = k => -r + k * 2 * r;
    const env = k => amp * Math.abs(Math.sin(ang(k)));   // a beirada das duas fitas

    // os cruzamentos: onde as duas se encostam e as cores trocam de lado.
    // Guardamos o numero ABSOLUTO de cada um: e dele que sai a cor da celula,
    // senao um cruzamento novo entrando pelo topo inverte o desenho inteiro.
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

    // o fundo: claro do lado de fora esquerdo, escuro do lado de fora direito
    ctx.fillStyle = grad(c.claro, c.claro2, 1);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.fillStyle = grad(c.escuro2, c.escuro, 1);
    ctx.beginPath();
    for (let i = 0; i <= N; i++) { const k = i / N, x = env(k); i ? ctx.lineTo(x, yy(k)) : ctx.moveTo(x, yy(k)); }
    ctx.arc(0, 0, r, Math.PI / 2, -Math.PI / 2, true);
    ctx.closePath(); ctx.fill();

    // as celulas entre as duas fitas: alternando, que e a inversao acontecendo
    for (let m = 0; m < cortes.length - 1; m++) {
      const a = cortes[m], b = cortes[m + 1];
      if (b - a < 0.02) continue;
      const q = par(a + (b - a) * 0.5);
      ctx.fillStyle = q ? grad(c.claro, c.claro2, 0) : grad(c.escuro2, c.escuro, 0);
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) { const k = a + (b - a) * (i / 10), x = env(k); i ? ctx.lineTo(x, yy(k)) : ctx.moveTo(x, yy(k)); }
      for (let i = 10; i >= 0; i--) { const k = a + (b - a) * (i / 10); ctx.lineTo(-env(k), yy(k)); }
      ctx.closePath(); ctx.fill();
      // as pontes: sao elas que fazem ler DNA e nao so duas ondas
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

    // as duas fitas. Cada pedaco vem da cor contraria a da celula que ele fecha:
    // e assim que a cor "vira" no cruzamento. E a cada cruzamento uma passa por
    // TRAS da outra — e isso, mais que a onda, que faz o olho ler uma helice.
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let m = 0; m < cortes.length - 1; m++) {
      const a = cortes[m], b = cortes[m + 1];
      if (b - a < 0.02) continue;
      // fundo: a fita que esta atras neste pedaco chega apagada nas pontas
      const fita = (sinal, cor, frente) => {
        const caminho = () => {
          ctx.beginPath();
          for (let i = 0; i <= 12; i++) { const k = a + (b - a) * (i / 12), x = sinal * env(k); i ? ctx.lineTo(x, yy(k)) : ctx.moveTo(x, yy(k)); }
        };
        // o degrade ao longo do pedaco: cheia no meio, sumindo no cruzamento
        const g = ctx.createLinearGradient(0, yy(a), 0, yy(b));
        const op = frente ? 1 : 0.5;
        g.addColorStop(0, u.rgba(cor, 0.12 * op));
        g.addColorStop(0.5, u.rgba(cor, 0.95 * op));
        g.addColorStop(1, u.rgba(cor, 0.12 * op));
        ctx.strokeStyle = u.rgba(cor, (frente ? 0.4 : 0.18));
        ctx.lineWidth = r * (frente ? 0.11 : 0.085); caminho(); ctx.stroke();
        ctx.strokeStyle = g;
        ctx.lineWidth = Math.max(0.8, r * (frente ? 0.046 : 0.032)); caminho(); ctx.stroke();
        // a beirada acesa: e o que deixa a fita escura visivel no lado escuro
        if (frente) {
          ctx.strokeStyle = u.rgba('#ffffff', 0.34);
          ctx.lineWidth = Math.max(0.5, r * 0.012); caminho(); ctx.stroke();
        }
      };
      const q = par(a + (b - a) * 0.5);
      const dir = q ? c.brilhoClaro : c.escuroForte;
      const esq = q ? c.escuroForte : c.brilhoClaro;
      // a de tras primeiro, a da frente por cima
      if (q) { fita(-1, esq, false); fita(1, dir, true); }
      else { fita(1, dir, false); fita(-1, esq, true); }
    }
    // o halo da mistura, por cima das duas: so o brilho, sem contorno
    ctx.globalCompositeOperation = 'lighter';
    [1, -1].forEach(sinal => {
      ctx.beginPath();
      for (let i = 0; i <= N; i++) { const k = i / N, x = sinal * env(k); i ? ctx.lineTo(x, yy(k)) : ctx.moveTo(x, yy(k)); }
      ctx.strokeStyle = u.rgba(c.brilho, 0.16); ctx.lineWidth = r * 0.14; ctx.stroke();
    });
    ctx.restore();

    // as duas marcas: cada metade guardando um pedaco da outra
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

    // volume: uma luz so, de cima a esquerda, por cima de tudo
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

  function bola(ctx, x, y, r, t, lavada, giro) {
    const u = U(), L = lavada == null ? 0 : lavada;
    const c = coresFaisca(L);

    discoLuz(ctx, x, y, r * 2.8, c.brilho, 0.6 * (1 - L * 0.45));

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((giro || 0) * 0.25 + Math.sin(t * 0.25) * 0.05);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.clip();
    helice(ctx, r, c, t, 0);
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
    fundo, horizonte, pai, mae, bola, marca, moldura, discoLuz, bloom, rnd, helice, coresFaisca
  };
})();
