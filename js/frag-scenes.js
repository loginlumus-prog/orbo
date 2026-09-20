/* =====================================================================
   ORBO v7.2 — Os 33 arranjos dos cards. UM para cada fragmento.

   Antes eram 15 composicoes repartidas entre os 33, e isso custava caro: a
   espiral servia de "Berco", de "Tudo no mesmo dia" e de "Espiral"; quatro
   fragmentos diferentes mostravam o mesmo anel; "O Ninho" era a bola sozinha.
   A arte nao falava a mesma coisa que o texto.

   Agora cada fragmento tem o seu desenho, e o desenho diz o que a frase diz:
   se a frase fala de idade, o quadro mede idade; se fala de duas maos, tem
   duas maos; se fala de um instante em que nao havia nada, o quadro comeca
   vazio de verdade.

   Todos continuam sendo os mesmos cinco elementos de js/render-frag.js, entao
   a serie continua sendo uma serie.

   Regras de composicao, iguais em todos:
   - a luz vem de cima e da esquerda;
   - o assunto fica na faixa de ouro (38% ou 62% da altura), nunca no meio
     exato, salvo quando a simetria E o assunto;
   - sobra e parte do desenho: nada encosta na beirada;
   - nada de preenchimento chapado, e brilho por tracos sobrepostos.

   API: HR.FragScenes[id do fragmento](ctx, W, H, p, t)
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const TAU = Math.PI * 2;
  const A = () => HR.FragArt;
  const U = () => HR.U;

  const S = {};

  /* ================= ferramentas comuns ================= */

  // traco que apaga na ponta: desenhado em pedacos, com a forca caindo
  function rastro(ctx, pts, cor, larg, forca) {
    const u = U();
    ctx.save(); ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter';
    for (let i = 1; i < pts.length; i++) {
      const k = i / (pts.length - 1), f = (1 - k) * (1 - k);
      ctx.strokeStyle = u.rgba(cor, forca * f);
      ctx.lineWidth = Math.max(0.5, larg * (1 - k * 0.72));
      ctx.beginPath(); ctx.moveTo(pts[i - 1][0], pts[i - 1][1]); ctx.lineTo(pts[i][0], pts[i][1]); ctx.stroke();
    }
    ctx.restore();
  }

  // palavra em luz: o brilho vem de copias da propria letra, ampliadas a partir
  // do centro. Nada de strokeText — traco grosso em letra de junta fechada
  // engrossa a perna e borra o desenho.
  function palavra(ctx, cx, cy, txt, cor, tam, nitidez) {
    const u = U(), n = nitidez == null ? 1 : nitidez;
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = "600 " + Math.round(tam) + "px 'Fredoka', 'Rubik', sans-serif";
    ctx.globalCompositeOperation = 'lighter';
    [[1.055, 0.10], [1.03, 0.14], [1.014, 0.2]].forEach(e => {
      ctx.save();
      ctx.translate(cx, cy); ctx.scale(e[0], e[0]); ctx.translate(-cx, -cy);
      ctx.fillStyle = u.rgba(cor, e[1] * n);
      ctx.fillText(txt, cx, cy);
      ctx.restore();
    });
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = u.rgba('#ffffff', 0.92 * n);
    ctx.fillText(txt, cx, cy);
    ctx.restore();
  }

  // a palavra do card segue o idioma: p.palavraK e uma chave, p.palavra e texto
  function oTexto(p, padrao) {
    if (p.palavraK) { const v = HR.t(p.palavraK); if (v && v !== p.palavraK) return v; }
    return p.palavra || padrao;
  }

  // elipse acesa, com parede e fio branco por dentro: a forma base dos aneis
  function aro(ctx, cx, cy, rx, ry, cor, forca) {
    const a = A(), u = U(), f = forca == null ? 1 : forca;
    ctx.save(); ctx.lineCap = 'round';
    a.bloom(ctx, cor, [[2.4, 0.8 * f], [7, 0.2 * f], [18, 0.08 * f]], () => {
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.stroke();
    });
    ctx.strokeStyle = u.rgba('#ffffff', 0.5 * f); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); ctx.stroke();
    ctx.restore();
  }

  // uma mao de luz: palma, quatro dedos e o polegar, tudo em traco.
  // Sem detalhe nenhum — no jogo inteiro ninguem tem rosto, e ela nao lembra.
  // O x local aponta para o que a mao esta segurando.
  function maoLuz(ctx, x, y, r, ang, cor, forca) {
    const a = A(), u = U(), f = forca == null ? 1 : forca;
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // a palma: uma mancha, para a mao ter peso
    const g = ctx.createRadialGradient(-r * 0.5, -r * 0.1, 0, -r * 0.42, 0, r * 0.95);
    g.addColorStop(0, u.rgba(cor, 0.5 * f));
    g.addColorStop(0.6, u.rgba(cor, 0.18 * f));
    g.addColorStop(1, u.rgba(cor, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(-r * 0.42, 0, r * 0.7, r * 0.85, 0, 0, TAU); ctx.fill();
    // os quatro dedos, curvando por cima do que seguram
    const dedo = (y0, comp, esp) => {
      a.bloom(ctx, cor, [[esp, 0.85 * f], [esp * 2.6, 0.22 * f], [esp * 6, 0.08 * f]], () => {
        ctx.beginPath();
        ctx.moveTo(-r * 0.55, y0);
        ctx.quadraticCurveTo(r * 0.28, y0 * 1.06, r * comp, y0 * 0.42);
        ctx.stroke();
      });
    };
    dedo(-r * 0.56, 0.74, r * 0.14);
    dedo(-r * 0.19, 0.92, r * 0.155);
    dedo(r * 0.19, 0.86, r * 0.15);
    dedo(r * 0.54, 0.62, r * 0.125);
    // o polegar, do outro lado: e ele que diz que e uma mao
    a.bloom(ctx, cor, [[r * 0.15, 0.8 * f], [r * 0.4, 0.2 * f]], () => {
      ctx.beginPath();
      ctx.moveTo(-r * 0.72, r * 0.5);
      ctx.quadraticCurveTo(-r * 0.1, r * 1.0, r * 0.42, r * 0.78);
      ctx.stroke();
    });
    ctx.restore();
  }

  // galaxia pequena, para caber dentro de outra coisa
  function miniGalaxia(ctx, cx, cy, R, cor, giro) {
    const a = A(), u = U();
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(giro); ctx.scale(1, 0.4);
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
    g.addColorStop(0, u.rgba(cor, 0.4)); g.addColorStop(0.5, u.rgba(cor, 0.1)); g.addColorStop(1, u.rgba(cor, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
    for (let b = 0; b < 2; b++) {
      ctx.rotate(Math.PI);
      for (let i = 0; i < 34; i++) {
        const k = i / 34, ang = k * 5.2, rr = k * R * 0.94;
        ctx.fillStyle = u.rgba(a.rnd(i * 3.3) > 0.8 ? '#ffffff' : cor, 0.55 * (1 - k * 0.5));
        ctx.beginPath(); ctx.arc(Math.cos(ang) * rr, Math.sin(ang) * rr, 0.7 + a.rnd(i * 5.9) * 1.3, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
    a.discoLuz(ctx, cx, cy, R * 0.34, '#fff3c2', 0.85);
  }

  // o escuro morno de antes de haver espaco: nenhuma estrela, nenhuma poeira
  function escuroMorno(ctx, W, H, cor) {
    const u = U();
    const g = ctx.createRadialGradient(W * 0.46, H * 0.44, 0, W * 0.5, H * 0.5, H * 0.95);
    g.addColorStop(0, u.mix(cor, '#1a0f14', 0.55));
    g.addColorStop(0.55, '#140c12');
    g.addColorStop(1, '#07040a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  /* ================= ATO I — ACORDAR ================= */

  /* 1. giro — "girou antes de saber que estava girando".
     O assunto e o giro, nao a bola: o rastro do proprio giro fica na tela. */
  S.giro = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.46, r = H * 0.115;
    a.fundo(ctx, W, H, p.cor, 3, 0.85);
    // o chao insinuado, so para o giro ter onde acontecer
    const ch = ctx.createLinearGradient(0, H * 0.76, 0, H);
    ch.addColorStop(0, u.rgba(p.cor, 0)); ch.addColorStop(1, u.rgba(p.cor, 0.13));
    ctx.fillStyle = ch; ctx.fillRect(0, H * 0.76, W, H * 0.24);
    // o rastro: uma espiral que se abre e apaga para tras
    for (let v = 0; v < 2; v++) {
      const pts = [];
      for (let i = 0; i <= 54; i++) {
        const k = i / 54, ang = -k * 6.6 + t * 0.45 + v * 3.14, rr = r * (1.22 + k * 2.4);
        pts.push([cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr * 0.34]);
      }
      rastro(ctx, pts, v ? p.cor : '#ffffff', 3.4 - v * 1.1, 0.85 - v * 0.3);
    }
    a.bola(ctx, cx, cy, r, t, p.lavada, t * 0.55);
  };

  /* 2. faltava — "o lugar ao lado estava vazio de um jeito especifico".
     O vazio tem a forma exata de alguem, e a poeira se afasta dele. */
  S.faltava = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cy = H * 0.52, r = H * 0.105, bx = W * 0.34, vx = W * 0.66;
    a.fundo(ctx, W, H, p.cor, 11, 0.8);
    const oco = ctx.createRadialGradient(vx, cy, r * 0.15, vx, cy, r * 2.6);
    oco.addColorStop(0, 'rgba(0,0,0,0.92)');
    oco.addColorStop(0.42, 'rgba(0,0,0,0.5)');
    oco.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = oco; ctx.beginPath(); ctx.arc(vx, cy, r * 2.6, 0, TAU); ctx.fill();
    // o contorno do que falta, desenhado com o que nao esta la
    ctx.save();
    ctx.setLineDash([3, 11]); ctx.lineDashOffset = -t * 9;
    ctx.strokeStyle = u.rgba('#ffffff', 0.3); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(vx, cy, r * 1.06, 0, TAU); ctx.stroke();
    ctx.restore();
    // o fio entre os dois lugares, quase apagado
    ctx.strokeStyle = u.rgba(p.cor, 0.16); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(bx + r * 1.4, cy); ctx.lineTo(vx - r * 1.4, cy); ctx.stroke();
    a.bola(ctx, bx, cy, r, t, p.lavada, -t * 0.2);
  };

  /* 3. escuro — "ela caiu, e o escuro segurou. Nao machucou".
     A concha embaixo e uma mao aberta: o escuro nao e vazio, ele ampara. */
  S.escuro = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.60, r = H * 0.10;
    a.fundo(ctx, W, H, p.cor, 21, 0.7);
    const topo = H * 0.70 + Math.sin(t * 0.5) * 4;
    const g = ctx.createLinearGradient(0, topo - 44, 0, H);
    g.addColorStop(0, u.rgba(p.cor, 0));
    g.addColorStop(0.35, u.rgba(p.cor, 0.08));
    g.addColorStop(1, u.rgba(p.cor, 0.16));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, H); ctx.lineTo(0, H * 0.95);
    ctx.quadraticCurveTo(cx, topo, W, H * 0.95);
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.lineCap = 'round';
    a.bloom(ctx, p.cor, [[1.4, 0.55], [4, 0.16], [12, 0.06]], () => {
      ctx.beginPath(); ctx.moveTo(0, H * 0.95);
      ctx.quadraticCurveTo(cx, topo, W, H * 0.95); ctx.stroke();
    });
    // os dedos da concha: dois bracos subindo dos lados, sem fechar
    [-1, 1].forEach(s => {
      a.bloom(ctx, p.cor, [[1.2, 0.34], [4, 0.1]], () => {
        ctx.beginPath();
        ctx.moveTo(cx + s * W * 0.30, topo + H * 0.06);
        ctx.quadraticCurveTo(cx + s * W * 0.40, cy, cx + s * W * 0.33, cy - H * 0.10);
        ctx.stroke();
      });
    });
    ctx.restore();
    // a queda, ja apagando, e o pouso morno
    const pts = []; for (let i = 0; i <= 18; i++) pts.push([cx + Math.sin(i * 0.5) * 3, cy - r * 1.5 - i * H * 0.022]);
    rastro(ctx, pts, '#ffffff', 2, 0.3);
    a.discoLuz(ctx, cx, cy + r * 0.9, r * 2.4, p.cor, 0.55);
    a.bola(ctx, cx, cy, r, t, p.lavada, t * 0.15);
  };

  /* 4. cinza — "ela se viu pela primeira vez, e nao tinha cor nenhuma".
     O reflexo e ainda mais lavado que ela: e o que assusta. */
  S.cinza = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cy = H * 0.38, r = H * 0.105, cx = W * 0.5;
    a.fundo(ctx, W, H, p.cor, 33, 0.6);
    const esp = ctx.createLinearGradient(0, H * 0.56, 0, H);
    esp.addColorStop(0, u.rgba(p.cor, 0.15)); esp.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = esp; ctx.fillRect(0, H * 0.56, W, H * 0.44);
    ctx.strokeStyle = u.rgba('#ffffff', 0.16); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W * 0.08, H * 0.56); ctx.lineTo(W * 0.92, H * 0.56); ctx.stroke();
    ctx.save();
    ctx.globalAlpha = 0.32;
    ctx.translate(0, H * 1.12); ctx.scale(1, -1);
    a.bola(ctx, cx, cy, r, t, 1, 0);
    ctx.restore();
    a.bola(ctx, cx, cy, r, t, p.lavada, 0);
  };

  /* 5. apelido — "alguem a chamava assim. Ela nao lembra quem".
     A palavra esta acesa; quem disse e um lugar vazio embaixo dela. */
  S.apelido = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5;
    a.fundo(ctx, W, H, p.cor, 97, 0.45);
    palavra(ctx, cx, H * 0.42, oTexto(p, 'FAÍSCA'), p.cor, H * 0.165, 1);
    // de onde veio a voz: um oco sem forma, com o fio chegando ate a palavra
    const oco = ctx.createRadialGradient(cx, H * 0.74, 0, cx, H * 0.74, H * 0.2);
    oco.addColorStop(0, 'rgba(0,0,0,0.8)'); oco.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = oco; ctx.beginPath(); ctx.arc(cx, H * 0.74, H * 0.2, 0, TAU); ctx.fill();
    ctx.save();
    ctx.setLineDash([2, 9]); ctx.lineDashOffset = -t * 7;
    ctx.strokeStyle = u.rgba('#ffffff', 0.24); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, H * 0.70); ctx.lineTo(cx, H * 0.55); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, H * 0.74, H * 0.075, 0, TAU); ctx.stroke();
    ctx.restore();
  };

  /* 6. berco — "tem cheiro de coisa nova; ninguem usou antes dela".
     Nao e uma galaxia velha: e um lugar ainda se formando, aberto em cima. */
  S.berco = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.58;
    a.fundo(ctx, W, H, p.cor, 67, 0.4);
    // colunas de gas: a materia ainda de pe, sem ter virado nada
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    [[0.22, 0.30], [0.78, 0.24], [0.38, 0.16]].forEach((c, i) => {
      const x = W * c[0], larg = W * c[1] * 0.28;
      const g = ctx.createLinearGradient(0, H * 0.78, 0, H * 0.20);
      g.addColorStop(0, u.rgba(p.cor, 0.10)); g.addColorStop(0.45, u.rgba(p.cor, 0.035)); g.addColorStop(1, u.rgba(p.cor, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - larg, H * 0.80);
      ctx.quadraticCurveTo(x - larg * 0.5 + Math.sin(t * 0.2 + i) * 4, H * 0.46, x - larg * 0.18, H * 0.22);
      ctx.lineTo(x + larg * 0.18, H * 0.22);
      ctx.quadraticCurveTo(x + larg * 0.5 + Math.sin(t * 0.2 + i) * 4, H * 0.46, x + larg, H * 0.80);
      ctx.closePath(); ctx.fill();
    });
    ctx.restore();
    // o berco: uma concha larga embaixo, aberta para cima
    ctx.save(); ctx.lineCap = 'round';
    a.bloom(ctx, p.cor, [[2, 0.5], [6, 0.16], [16, 0.06]], () => {
      ctx.beginPath(); ctx.ellipse(cx, cy + H * 0.14, W * 0.34, H * 0.16, 0, Math.PI * 0.08, Math.PI * 0.92); ctx.stroke();
    });
    ctx.restore();
    // luz nova acendendo: pontos pequenos, todos do mesmo tamanho, nenhum gasto
    for (let i = 0; i < 16; i++) {
      const x = W * (0.16 + a.rnd(i * 7.3) * 0.68), y = H * (0.26 + a.rnd(i * 4.1) * 0.46);
      const f = 0.35 + 0.65 * Math.abs(Math.sin(t * 0.5 + i));
      a.discoLuz(ctx, x, y, H * 0.035, '#ffffff', 0.5 * f);
      ctx.fillStyle = u.rgba('#ffffff', 0.85 * f);
      ctx.beginPath(); ctx.arc(x, y, 1.5, 0, TAU); ctx.fill();
    }
    a.bola(ctx, cx, cy, H * 0.085, t, p.lavada, t * 0.12);
  };

  /* 7. maisnovo — "a mare disse a idade que tinha. Era menor que a dela".
     Duas pilhas de marcas: o lugar tem poucas, ela tem muitas. O quadro mede. */
  S.maisnovo = (ctx, W, H, p, t) => {
    const a = A(), u = U();
    a.fundo(ctx, W, H, p.cor, 13, 0.5);
    const pilha = (x, n, cor, rot) => {
      ctx.save(); ctx.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        const rr = H * 0.055 + i * H * 0.030;
        ctx.strokeStyle = u.rgba(cor, 0.18 + (i / n) * 0.42);
        ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.ellipse(x, H * 0.47, rr * 0.86, rr, rot, 0, TAU); ctx.stroke();
      }
      ctx.restore();
      a.discoLuz(ctx, x, H * 0.47, H * 0.05, cor, 0.9);
    };
    pilha(W * 0.29, 4, '#6f7f9e', -0.12);   // o lugar: quatro mares, e frias
    pilha(W * 0.71, 9, '#ffd08a', 0.1);     // ela: nove, e quentes
    // a regua: ate onde cada um chega. E o quadro inteiro e essa comparacao.
    ctx.save();
    ctx.lineCap = 'round';
    [[W * 0.29, 4, '#6f7f9e'], [W * 0.71, 9, '#ffd08a']].forEach(c => {
      const alto = H * 0.47 - (H * 0.055 + (c[1] - 1) * H * 0.030);
      ctx.strokeStyle = u.rgba(c[2], 0.5); ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 5]);
      ctx.beginPath(); ctx.moveTo(c[0] - W * 0.16, alto); ctx.lineTo(c[0] + W * 0.16, alto); ctx.stroke();
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(c[0] - W * 0.16, alto - H * 0.018); ctx.lineTo(c[0] - W * 0.16, alto + H * 0.018); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(c[0] + W * 0.16, alto - H * 0.018); ctx.lineTo(c[0] + W * 0.16, alto + H * 0.018); ctx.stroke();
    });
    // a linha que liga as duas alturas: da para ver de longe qual e a menor
    ctx.strokeStyle = u.rgba('#ffffff', 0.16); ctx.lineWidth = 1; ctx.setLineDash([2, 7]);
    const a1 = H * 0.47 - (H * 0.055 + 3 * H * 0.030), a2 = H * 0.47 - (H * 0.055 + 8 * H * 0.030);
    ctx.beginPath(); ctx.moveTo(W * 0.29, a1); ctx.lineTo(W * 0.71, a2); ctx.stroke();
    ctx.restore();
  };

  /* 8. naofecha — "todo anel tem um arranhao no mesmo lugar, como se alguem
     segurasse para ele nao fechar". O anel tem uma falha, e uma mao nela. */
  S.naofecha = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.54, cy = H * 0.48, R = H * 0.31;
    a.fundo(ctx, W, H, p.cor, 59, 0.5);
    // um anel atras, longe e fora de foco: e o que cria profundidade
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = u.rgba(p.cor, 0.09); ctx.lineWidth = 9;
    ctx.beginPath(); ctx.ellipse(W * 0.2, cy - H * 0.05, R * 0.3, R * 0.74, -0.1, 0, TAU); ctx.stroke();
    ctx.restore();
    // o anel da frente, inteiro: ele fechou. O que nao fecha e a mao.
    ctx.save(); ctx.lineCap = 'round';
    const elipse = () => { ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.44, R, 0, 0, TAU); };
    a.bloom(ctx, p.cor, [[3, 0.82], [9, 0.22], [24, 0.09]], () => { elipse(); ctx.stroke(); });
    const par = ctx.createLinearGradient(cx - R * 0.44, cy - R, cx + R * 0.44, cy + R);
    par.addColorStop(0, u.rgba('#ffffff', 0.85));
    par.addColorStop(0.45, u.rgba(p.cor, 0.75));
    par.addColorStop(1, u.rgba(u.mix(p.cor, '#000000', 0.5), 0.8));
    ctx.strokeStyle = par; ctx.lineWidth = 5; elipse(); ctx.stroke();
    ctx.strokeStyle = u.rgba('#ffffff', 0.5); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.40, R * 0.955, 0, 0, TAU); ctx.stroke();
    ctx.restore();
    // a impressao de quem segurou: quatro pontas de dedo acesas no aro, e a
    // palma como um borrao morno atras delas. Nao se ve a mao — se ve a marca.
    const bor = ctx.createRadialGradient(cx - R * 0.46, cy - R * 0.10, 0, cx - R * 0.46, cy - R * 0.10, R * 0.62);
    bor.addColorStop(0, u.rgba('#fff3c2', 0.20)); bor.addColorStop(1, u.rgba('#fff3c2', 0));
    ctx.fillStyle = bor; ctx.beginPath(); ctx.arc(cx - R * 0.46, cy - R * 0.10, R * 0.62, 0, TAU); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 4; i++) {
      const ang = Math.PI - 0.62 + i * 0.41;
      const fx = cx + Math.cos(ang) * R * 0.44, fy = cy + Math.sin(ang) * R;
      a.discoLuz(ctx, fx, fy, R * 0.16, '#fff3c2', 0.75);
      ctx.save();
      ctx.translate(fx, fy); ctx.rotate(ang + Math.PI / 2);
      ctx.fillStyle = u.rgba('#fff8dd', 0.75);
      ctx.beginPath(); ctx.ellipse(0, 0, R * 0.055, R * 0.024, 0, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    // o arranhao, sempre no mesmo lugar, do lado de dentro da marca
    const ax = cx - R * 0.40, ay = cy - R * 0.26;
    ctx.save(); ctx.lineCap = 'round';
    a.bloom(ctx, '#fff3c2', [[3, 0.9], [8, 0.28], [20, 0.1]], () => {
      ctx.beginPath(); ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo(ax + R * 0.28, ay + R * 0.2, ax + R * 0.46, ay + R * 0.54);
      ctx.stroke();
    });
    a.discoLuz(ctx, ax + R * 0.46, ay + R * 0.54, R * 0.10, '#fff3c2', 0.95);
    ctx.restore();
  };

  /* 9. dois — "ela SONHOU com duas luzes". Entao esta fora de foco, dobrado,
     e ela esta dormindo embaixo. Nao e uma lembranca: ainda nao. */
  S.dois = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cy = H * 0.42, r = H * 0.10;
    const afast = p.afast == null ? 0.22 : p.afast;
    a.fundo(ctx, W, H, p.cor, 41, 0.4);
    const px = W * (0.5 - afast), mx = W * (0.5 + afast);
    // a camada de sonho: as mesmas duas luzes, deslocadas e fracas
    ctx.save(); ctx.globalAlpha = 0.22;
    a.pai(ctx, px - 7, cy + 5, r * 1.18, t, 0.9);
    a.mae(ctx, mx + 7, cy + 5, r * 1.18, t, 0.9);
    ctx.restore();
    ctx.save(); ctx.globalAlpha = 0.62;
    a.pai(ctx, px, cy, r, t, 1);
    a.mae(ctx, mx, cy, r, t, 1);
    ctx.restore();
    // a bruma por cima: e isso que faz parecer sonho e nao lembranca
    const br = ctx.createLinearGradient(0, H * 0.18, 0, H * 0.72);
    br.addColorStop(0, u.rgba(p.cor, 0.06));
    br.addColorStop(0.5, u.rgba('#ffffff', 0.05));
    br.addColorStop(1, u.rgba(p.cor, 0));
    ctx.fillStyle = br; ctx.fillRect(0, H * 0.18, W, H * 0.54);
    // ela dormindo: parada, sem rastro, e tres aros do sono subindo
    a.bola(ctx, W * 0.5, H * 0.78, H * 0.055, t, Math.min(1, (p.lavada || 0) + 0.2), 0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const k = ((t * 0.25 + i * 0.33) % 1);
      // nasce e morre em fade: sem pipoco no comeco nem no fim
      ctx.strokeStyle = u.rgba('#ffffff', 0.2 * Math.sin(k * Math.PI)); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(W * 0.5, H * 0.78, H * 0.07 + k * H * 0.08, -2.4, -0.7); ctx.stroke();
    }
    ctx.restore();
  };

  /* ================= ATO II — LEMBRAR ================= */

  /* 10. mesmodia — "nasceram todas juntas; nenhuma e mais velha que a outra".
     Uma fila de sementes do MESMO tamanho, acesas pelo MESMO clarao. */
  S.mesmodia = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cy = H * 0.46, n = 7;
    a.fundo(ctx, W, H, p.cor, 23, 0.5);
    // o clarao que passou por todas: uma linha so, ainda quente
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(W * 0.06, cy, W * 0.94, cy);
    g.addColorStop(0, u.rgba(p.cor, 0)); g.addColorStop(0.5, u.rgba(p.cor, 0.3)); g.addColorStop(1, u.rgba(p.cor, 0));
    ctx.fillStyle = g; ctx.fillRect(0, cy - H * 0.035, W, H * 0.07);
    ctx.restore();
    for (let i = 0; i < n; i++) {
      const x = W * (0.13 + (i / (n - 1)) * 0.74);
      const f = 0.72 + 0.28 * Math.sin(t * 0.8);   // todas pulsam JUNTAS
      a.discoLuz(ctx, x, cy, H * 0.075, p.cor, 0.85 * f);
      const gg = ctx.createRadialGradient(x - 2, cy - 2, 0, x, cy, H * 0.026);
      gg.addColorStop(0, u.rgba('#ffffff', 0.98)); gg.addColorStop(1, u.rgba(p.cor, 0.8));
      ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(x, cy, H * 0.026, 0, TAU); ctx.fill();
      // a marca de idade de cada uma: uma risca so, igual em todas
      ctx.strokeStyle = u.rgba('#ffffff', 0.3); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(x, cy + H * 0.07); ctx.lineTo(x, cy + H * 0.10); ctx.stroke();
    }
    ctx.strokeStyle = u.rgba('#ffffff', 0.12); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W * 0.13, cy + H * 0.115); ctx.lineTo(W * 0.87, cy + H * 0.115); ctx.stroke();
  };

  /* 11. instante — "houve um instante em que nao havia nada; tudo comecou nele".
     Comeca vazio de verdade: sem poeira, sem estrela. So o ponto, e o que saiu. */
  S.instante = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.44;
    // nada: preto liso, sem fundo estrelado
    const vaz = ctx.createRadialGradient(cx, cy, 0, cx, cy, H * 1.05);
    vaz.addColorStop(0, '#0b0714'); vaz.addColorStop(1, '#03020a');
    ctx.fillStyle = vaz; ctx.fillRect(0, 0, W, H);
    // o que saiu do ponto: raios finos, e a poeira so existe perto dele
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (let i = 0; i < 44; i++) {
      const ang = (i / 44) * TAU + 0.2, L = H * (0.18 + a.rnd(i * 6.1) * 0.5);
      const g = ctx.createLinearGradient(cx, cy, cx + Math.cos(ang) * L, cy + Math.sin(ang) * L);
      g.addColorStop(0, u.rgba('#ffffff', 0.5));
      g.addColorStop(1, u.rgba(p.cor, 0));
      ctx.strokeStyle = g; ctx.lineWidth = i % 4 === 0 ? 1.6 : 0.8;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * L, cy + Math.sin(ang) * L); ctx.stroke();
    }
    for (let i = 0; i < 70; i++) {
      const ang = a.rnd(i * 2.7) * TAU, d = H * (0.1 + a.rnd(i * 5.3) * 0.55);
      ctx.fillStyle = u.rgba(a.rnd(i * 9.1) > 0.8 ? '#ffffff' : p.cor, 0.5 * (1 - d / (H * 0.68)));
      ctx.beginPath(); ctx.arc(cx + Math.cos(ang) * d, cy + Math.sin(ang) * d * 0.9, 0.6 + a.rnd(i * 3.3) * 1.2, 0, TAU); ctx.fill();
    }
    ctx.restore();
    // o ponto: o menor desenho do jogo inteiro, e o mais importante
    a.discoLuz(ctx, cx, cy, H * 0.22, '#ffffff', 1);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(cx, cy, H * 0.014 + Math.sin(t * 1.2) * H * 0.002, 0, TAU); ctx.fill();
  };

  /* 12. quente — "antes do instante havia calor; lembra de estar DENTRO de
     alguma coisa". Entao ela esta dentro de uma casca, nao no meio do nada. */
  S.quente = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.5;
    const g0 = ctx.createRadialGradient(cx, cy * 0.9, 0, cx, cy, H * 0.95);
    g0.addColorStop(0, '#6a3038'); g0.addColorStop(0.55, '#3a1824'); g0.addColorStop(1, '#140812');
    ctx.fillStyle = g0; ctx.fillRect(0, 0, W, H);
    for (let i = 5; i >= 1; i--) {
      const r = H * (0.13 + i * 0.072) + Math.sin(t * 0.4 + i) * 3;
      const g = ctx.createRadialGradient(cx, cy, r * 0.62, cx, cy, r);
      g.addColorStop(0, u.rgba('#ff9d6b', 0.05 * i));
      g.addColorStop(1, u.rgba('#ff6a4a', 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
    }
    // a casca: dois arcos fechando em volta dela, um mais perto que o outro
    ctx.save(); ctx.lineCap = 'round';
    [[0.30, 0.34], [0.38, 0.18]].forEach(c => {
      a.bloom(ctx, '#ffb98a', [[2, c[1]], [7, c[1] * 0.4], [18, c[1] * 0.15]], () => {
        ctx.beginPath(); ctx.ellipse(cx, cy, H * c[0] * 0.92, H * c[0], 0, 0, TAU); ctx.stroke();
      });
    });
    ctx.restore();
    a.discoLuz(ctx, cx, cy, H * 0.2, '#ffd0a8', 0.85);
    a.bola(ctx, cx, cy, H * 0.07, t, Math.min(1, (p.lavada || 0) + 0.3), t * 0.1);
  };

  /* 13. delonge — "viu uma linha no ceu que nao era estrela. Doeu olhar".
     A linha esta longe e fina; o que dói é o brilho dela, nao o tamanho. */
  S.delonge = (ctx, W, H, p, t) => {
    const a = A(), u = U(), r = H * 0.05;
    a.fundo(ctx, W, H, p.cor, 53, 0.9);
    a.horizonte(ctx, W, H, H * 0.30, '#dfe6ff', 0.52, t, p.curva || 16);
    // o que dói: o clarao de lente, so aqui
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    [[1, 0], [0, 1], [0.7, 0.7], [-0.7, 0.7]].forEach((d, i) => {
      const L = H * (i < 2 ? 0.34 : 0.17);
      const g = ctx.createLinearGradient(W * 0.5 - d[0] * L, H * 0.30 - d[1] * L, W * 0.5 + d[0] * L, H * 0.30 + d[1] * L);
      g.addColorStop(0, u.rgba('#dfe6ff', 0)); g.addColorStop(0.5, u.rgba('#ffffff', i < 2 ? 0.36 : 0.18)); g.addColorStop(1, u.rgba('#dfe6ff', 0));
      ctx.strokeStyle = g; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(W * 0.5 - d[0] * L, H * 0.30 - d[1] * L); ctx.lineTo(W * 0.5 + d[0] * L, H * 0.30 + d[1] * L); ctx.stroke();
    });
    ctx.restore();
    // ela embaixo, pequena, e o olhar subindo
    ctx.save();
    ctx.setLineDash([3, 10]); ctx.lineDashOffset = -t * 6;
    ctx.strokeStyle = u.rgba('#ffffff', 0.12); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W * 0.5, H * 0.76 - r * 1.7); ctx.lineTo(W * 0.5, H * 0.35); ctx.stroke();
    ctx.restore();
    a.bola(ctx, W * 0.5, H * 0.76, r, t, p.lavada, t * 0.2);
  };

  /* 14. quemsegur — "duas maos, uma de cada lado da linha. Nao lembra o rosto
     de nenhuma". As maos aparecem; os donos, nao. */
  S.quemsegur = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cy = H * 0.46;
    a.fundo(ctx, W, H, p.cor, 43, 0.6);
    a.horizonte(ctx, W, H, cy, '#e6ecff', 0.18, t, 0);
    // quem segura: dois vultos sem forma, so escuro mais denso
    [-1, 1].forEach(s => {
      const x = W * (0.5 + s * 0.33);
      const g = ctx.createRadialGradient(x, cy, 0, x, cy, H * 0.3);
      g.addColorStop(0, 'rgba(0,0,0,0.8)'); g.addColorStop(0.55, 'rgba(0,0,0,0.4)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, cy, H * 0.34, 0, TAU); ctx.fill();
    });
    maoLuz(ctx, W * 0.27, cy, H * 0.125, -0.22, '#cfe4ff', 1);
    maoLuz(ctx, W * 0.73, cy, H * 0.125, Math.PI + 0.22, '#c9b4ff', 1);
    // ela embaixo, olhando de longe
    a.bola(ctx, W * 0.5, H * 0.80, H * 0.045, t, p.lavada, t * 0.2);
  };

  /* 15. contempla — "encontrou quem nao pode ajudar em nada, e mesmo assim
     olha para cima". O assunto nao e a ajuda: e o olhar. */
  S.contempla = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, chao = H * 0.80;
    a.fundo(ctx, W, H, p.cor, 77, 1.0);
    // o mundinho: uma curva pequena embaixo, nada mais
    ctx.save();
    const g = ctx.createLinearGradient(0, chao - H * 0.05, 0, H);
    g.addColorStop(0, u.rgba('#3a4a6a', 0.5)); g.addColorStop(1, '#070a14');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, chao + H * 0.06);
    ctx.quadraticCurveTo(cx, chao - H * 0.055, W, chao + H * 0.06);
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    ctx.lineCap = 'round';
    a.bloom(ctx, '#8fd0ff', [[1.2, 0.4], [4, 0.12]], () => {
      ctx.beginPath(); ctx.moveTo(0, chao + H * 0.06);
      ctx.quadraticCurveTo(cx, chao - H * 0.055, W, chao + H * 0.06); ctx.stroke();
    });
    ctx.restore();
    // quem olha: uma marca minuscula, sem rosto e sem poder nenhum
    const py = chao - H * 0.085;
    a.discoLuz(ctx, cx, py, H * 0.05, '#ffe2a8', 0.55);
    ctx.strokeStyle = u.rgba('#ffe2a8', 0.95); ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, py + H * 0.022); ctx.lineTo(cx, py - H * 0.012); ctx.stroke();
    ctx.fillStyle = '#fff6df';
    ctx.beginPath(); ctx.arc(cx, py - H * 0.024, H * 0.013, 0, TAU); ctx.fill();
    // o olhar: um cone que se abre para o ceu inteiro
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const co = ctx.createLinearGradient(cx, py, cx, H * 0.10);
    co.addColorStop(0, u.rgba('#ffe2a8', 0.16)); co.addColorStop(1, u.rgba('#ffe2a8', 0));
    ctx.fillStyle = co;
    ctx.beginPath(); ctx.moveTo(cx, py - H * 0.03);
    ctx.lineTo(cx - W * 0.30, H * 0.08); ctx.lineTo(cx + W * 0.30, H * 0.08); ctx.closePath(); ctx.fill();
    ctx.restore();
  };

  /* 16. pontoazul — "um ponto azul, pequeno, cheio de gente olhando".
     Uma foto de sonda: feixe de luz atravessando e o ponto dentro dele. */
  S.pontoazul = (ctx, W, H, p, t) => {
    const a = A(), u = U();
    a.fundo(ctx, W, H, '#20304f', 79, 1.1);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(W * 0.2, 0, W * 0.9, H);
    g.addColorStop(0, u.rgba('#ffd9a0', 0));
    g.addColorStop(0.5, u.rgba('#ffd9a0', 0.11));
    g.addColorStop(1, u.rgba('#ffd9a0', 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    const px = W * 0.62, py = H * 0.44;
    a.discoLuz(ctx, px, py, H * 0.10, '#8fd0ff', 0.9);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    [[1, 0], [0, 1]].forEach(d => {
      const L = H * 0.13;
      const g2 = ctx.createLinearGradient(px - d[0] * L, py - d[1] * L, px + d[0] * L, py + d[1] * L);
      g2.addColorStop(0, u.rgba('#8fd0ff', 0)); g2.addColorStop(0.5, u.rgba('#cfeaff', 0.5)); g2.addColorStop(1, u.rgba('#8fd0ff', 0));
      ctx.strokeStyle = g2; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(px - d[0] * L, py - d[1] * L); ctx.lineTo(px + d[0] * L, py + d[1] * L); ctx.stroke();
    });
    ctx.restore();
    ctx.fillStyle = '#9fd8ff';
    ctx.beginPath(); ctx.arc(px, py, Math.max(2.6, H * 0.008), 0, TAU); ctx.fill();
    ctx.fillStyle = u.rgba('#ffffff', 0.95);
    ctx.beginPath(); ctx.arc(px - 0.9, py - 0.9, Math.max(1.1, H * 0.003), 0, TAU); ctx.fill();
  };

  /* 17. espiral — "girava como algo que ja girou muito, e ainda assim era nova". */
  S.espiral = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.5;
    a.fundo(ctx, W, H, p.cor, 67, 0.5);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.translate(cx, cy); ctx.rotate(t * 0.06 * (p.sentido || 1)); ctx.scale(1, 0.40);
    const nb = p.bracos || 4;
    const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, H * 0.78);
    halo.addColorStop(0, u.rgba(p.cor, 0.22));
    halo.addColorStop(0.55, u.rgba(p.cor, 0.07));
    halo.addColorStop(1, u.rgba(p.cor, 0));
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(0, 0, H * 0.78, 0, TAU); ctx.fill();
    for (let b = 0; b < nb; b++) {
      ctx.rotate(TAU / nb);
      for (let i = 0; i < 150; i++) {
        const k = i / 150, ang = k * 5.4, rr = k * H * 0.70;
        const esp = (a.rnd(b * 31 + i) - 0.5) * H * 0.07 * (0.4 + k);
        const x = Math.cos(ang) * rr + Math.cos(ang + 1.57) * esp;
        const y = Math.sin(ang) * rr + Math.sin(ang + 1.57) * esp;
        const brilho = 0.45 * (1 - k * 0.55) * (0.5 + a.rnd(i * 7.1) * 0.9);
        ctx.fillStyle = u.rgba(a.rnd(i * 3.3) > 0.82 ? '#ffffff' : p.cor, brilho);
        ctx.beginPath(); ctx.arc(x, y, 1.1 + a.rnd(i * 5.9) * 2.4 * (1 - k * 0.4), 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
    // a faixa de poeira: e o que faz parecer galaxia de verdade
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(t * 0.06 * (p.sentido || 1) + 0.35);
    const po = ctx.createLinearGradient(-H * 0.7, 0, H * 0.7, 0);
    po.addColorStop(0, 'rgba(0,0,0,0)'); po.addColorStop(0.5, 'rgba(0,0,0,0.42)'); po.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = po; ctx.fillRect(-H * 0.7, -H * 0.028, H * 1.4, H * 0.056);
    ctx.restore();
    a.discoLuz(ctx, cx, cy, H * 0.22, '#fff3c2', 1);
    a.discoLuz(ctx, cx, cy, H * 0.07, '#ffffff', 1);
  };

  /* 18. eraeu — "o instante tinha um nome, e o nome era o dela".
     O mesmo ponto do fragmento 11 — so que agora da para ler o que esta nele. */
  S.eraeu = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.46;
    const vaz = ctx.createRadialGradient(cx, cy, 0, cx, cy, H * 1.05);
    vaz.addColorStop(0, '#120c16'); vaz.addColorStop(1, '#04030a');
    ctx.fillStyle = vaz; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (let i = 0; i < 36; i++) {
      const ang = (i / 36) * TAU + 0.2, L = H * (0.26 + a.rnd(i * 6.1) * 0.5);
      const g = ctx.createLinearGradient(cx, cy, cx + Math.cos(ang) * L, cy + Math.sin(ang) * L);
      g.addColorStop(0, u.rgba(p.cor, 0.42)); g.addColorStop(1, u.rgba(p.cor, 0));
      ctx.strokeStyle = g; ctx.lineWidth = i % 4 === 0 ? 1.5 : 0.7;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(ang) * L, cy + Math.sin(ang) * L); ctx.stroke();
    }
    ctx.restore();
    a.discoLuz(ctx, cx, cy, H * 0.30, p.cor, 0.9);
    a.discoLuz(ctx, cx, cy, H * 0.15, '#ffffff', 0.8);
    palavra(ctx, cx, cy, oTexto(p, 'FAÍSCA'), p.cor, H * 0.125, 1);
  };

  /* 19. fechando — "a linha esta menor do que estava. Devagar, mas esta".
     So da para ver que diminuiu se o tamanho antigo continuar marcado. */
  S.fechando = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cy = H * 0.40;
    a.fundo(ctx, W, H, p.cor, 31, 0.7);
    // onde a linha chegava antes: o vinco que ficou
    ctx.save();
    ctx.setLineDash([4, 7]);
    ctx.strokeStyle = u.rgba('#ffffff', 0.16); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W * 0.08, cy); ctx.lineTo(W * 0.92, cy); ctx.stroke();
    ctx.setLineDash([]);
    [-1, 1].forEach(s => {
      const x = W * (0.5 + s * 0.42);
      ctx.strokeStyle = u.rgba('#ffffff', 0.3); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(x, cy - H * 0.035); ctx.lineTo(x, cy + H * 0.035); ctx.stroke();
      // a seta do fechamento, apontando para dentro
      ctx.beginPath();
      ctx.moveTo(x - s * H * 0.05, cy); ctx.lineTo(x - s * H * 0.085, cy);
      ctx.moveTo(x - s * H * 0.085, cy); ctx.lineTo(x - s * H * 0.062, cy - H * 0.016);
      ctx.moveTo(x - s * H * 0.085, cy); ctx.lineTo(x - s * H * 0.062, cy + H * 0.016);
      ctx.strokeStyle = u.rgba(p.cor, 0.5); ctx.stroke();
    });
    ctx.restore();
    // a linha de hoje: menor
    a.horizonte(ctx, W, H, cy, '#dfe6ff', p.fecha == null ? 0.42 : p.fecha, t, 0);
    a.bola(ctx, W * 0.5, H * 0.76, H * 0.05, t, p.lavada, t * 0.2);
  };

  /* 20. queeuabri — "tudo isto cabe numa coisa que ela fez sem querer".
     Entao o quadro mostra TUDO dentro da fenda, e ela do lado de fora. */
  S.queeuabri = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.44;
    a.fundo(ctx, W, H, p.cor, 37, 0.35);
    const meia = W * 0.40, alt = H * 0.20;
    const lente = () => {
      ctx.beginPath();
      ctx.moveTo(cx - meia, cy);
      ctx.quadraticCurveTo(cx, cy - alt, cx + meia, cy);
      ctx.quadraticCurveTo(cx, cy + alt, cx - meia, cy);
      ctx.closePath();
    };
    // dentro da fenda: o universo inteiro
    ctx.save();
    lente(); ctx.clip();
    const dentro = ctx.createLinearGradient(0, cy - alt, 0, cy + alt);
    dentro.addColorStop(0, '#0a1030'); dentro.addColorStop(1, '#04030e');
    ctx.fillStyle = dentro; ctx.fillRect(cx - meia, cy - alt, meia * 2, alt * 2);
    for (let i = 0; i < 80; i++) {
      const x = cx - meia + a.rnd(i * 4.3) * meia * 2, y = cy - alt + a.rnd(i * 8.7) * alt * 2;
      ctx.fillStyle = u.rgba(a.rnd(i * 2.1) > 0.8 ? '#ffffff' : p.cor, 0.2 + a.rnd(i * 6.7) * 0.6);
      ctx.beginPath(); ctx.arc(x, y, 0.5 + a.rnd(i * 3.1) * 1.3, 0, TAU); ctx.fill();
    }
    miniGalaxia(ctx, cx - meia * 0.42, cy - alt * 0.18, H * 0.115, '#9be7ff', t * 0.05);
    miniGalaxia(ctx, cx + meia * 0.40, cy + alt * 0.20, H * 0.085, '#ff9f43', -t * 0.04 + 1.2);
    miniGalaxia(ctx, cx + meia * 0.02, cy - alt * 0.44, H * 0.06, '#c9b4ff', t * 0.03 + 2.4);
    ctx.restore();
    // a borda da fenda
    ctx.save(); ctx.lineCap = 'round';
    a.bloom(ctx, '#ffffff', [[1.4, 0.8], [5, 0.24], [14, 0.09]], () => { lente(); ctx.stroke(); });
    ctx.restore();
    // ela, do lado de fora, pequena: foi sem querer
    a.bola(ctx, W * 0.5, H * 0.80, H * 0.048, t, p.lavada, t * 0.2);
  };

  /* 21. ninho — "ha um lugar onde nada pode dar errado. Ela ficou mais do que
     precisava". Um casulo fechado por todos os lados, e ela parada dentro. */
  S.ninho = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.48;
    a.fundo(ctx, W, H, p.cor, 61, 0.3);
    const gg = ctx.createRadialGradient(cx, cy, 0, cx, cy, H * 0.45);
    gg.addColorStop(0, u.rgba(p.cor, 0.16)); gg.addColorStop(1, u.rgba(p.cor, 0));
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(cx, cy, H * 0.45, 0, TAU); ctx.fill();
    // o casulo: aros fechados, um dentro do outro, sem nenhuma abertura
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const rr = H * (0.13 + i * 0.062);
      ctx.strokeStyle = u.rgba(p.cor, 0.34 - i * 0.05); ctx.lineWidth = 1.6 - i * 0.2;
      ctx.beginPath(); ctx.ellipse(cx, cy, rr * 0.92, rr, Math.sin(i * 1.3) * 0.12, 0, TAU); ctx.stroke();
    }
    ctx.restore();
    // as marcas do tempo parado: uma risca para cada volta que ela nao deu
    ctx.save();
    ctx.strokeStyle = u.rgba('#ffffff', 0.3); ctx.lineWidth = 1.3; ctx.lineCap = 'round';
    for (let i = 0; i < 11; i++) {
      const x = W * (0.5 - 0.15) + i * W * 0.03;
      ctx.beginPath(); ctx.moveTo(x, H * 0.85); ctx.lineTo(x, H * 0.885); ctx.stroke();
    }
    ctx.restore();
    // ela, parada: nenhum rastro, nenhum giro
    a.bola(ctx, cx, cy, H * 0.085, t, p.lavada, 0);
  };

  /* ================= ATO III — ESCOLHER ================= */

  /* 22. asmarcas — "Casco leu os aneis em voz alta: nao eram obstaculos, eram
     recados". Varios aneis em fila, cada um com a sua marca: uma frase. */
  S.asmarcas = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cy = H * 0.46, n = 5;
    a.fundo(ctx, W, H, p.cor, 29, 0.45);
    for (let i = 0; i < n; i++) {
      const x = W * (0.16 + (i / (n - 1)) * 0.68);
      // o dedo do Casco passando: vai e volta, e acende por perto em vez de
      // ligar e desligar — assim nada pisca no fim da fila
      const onde = (n - 1) * (0.5 - 0.5 * Math.cos(t * 0.30));
      const lido = Math.max(0, 1 - Math.abs(i - onde) * 0.75);
      const R = H * 0.15;
      aro(ctx, x, cy, R * 0.42, R, p.cor, 0.4 + lido * 0.6);
      // a marca de cada anel: todas diferentes, todas no mesmo lugar
      const ax = x - R * 0.36, ay = cy - R * 0.3;
      ctx.save(); ctx.lineCap = 'round';
      a.bloom(ctx, '#fff3c2', [[2.2, 0.28 + lido * 0.62], [6, 0.07 + lido * 0.17]], () => {
        ctx.beginPath(); ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo(ax + R * (0.2 + a.rnd(i * 3.7) * 0.3), ay + R * (0.2 + a.rnd(i * 5.1) * 0.3),
                             ax + R * 0.58, ay + R * (0.42 + a.rnd(i * 2.3) * 0.36));
        ctx.stroke();
      });
      ctx.restore();
    }
    // a linha de leitura: e uma frase, da esquerda para a direita
    ctx.save();
    ctx.setLineDash([2, 7]);
    ctx.strokeStyle = u.rgba('#ffffff', 0.14); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W * 0.1, H * 0.70); ctx.lineTo(W * 0.9, H * 0.70); ctx.stroke();
    ctx.restore();
  };

  /* 23. letradele — "firme e funda. Quem fez, fez com forca".
     Um anel so, de perto, e um traco curto que afunda. */
  S.letradele = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.46, cy = H * 0.48, R = H * 0.33;
    a.fundo(ctx, W, H, p.cor, 17, 0.4);
    aro(ctx, cx, cy, R * 0.44, R, p.cor, 1);
    // o traco: curto, grosso, e com a pressao aparecendo em volta
    const ax = cx - R * 0.30, ay = cy - R * 0.22;
    const bx = cx + R * 0.16, by = cy + R * 0.30;
    ctx.save(); ctx.lineCap = 'round';
    // a pressao: o metal cedendo em volta do risco
    const pr = ctx.createLinearGradient(ax, ay, bx, by);
    pr.addColorStop(0, u.rgba('#ffffff', 0)); pr.addColorStop(0.5, u.rgba('#ffffff', 0.16)); pr.addColorStop(1, u.rgba('#ffffff', 0));
    ctx.strokeStyle = pr; ctx.lineWidth = R * 0.30;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    a.bloom(ctx, '#ffffff', [[5.5, 0.95], [12, 0.3], [26, 0.1]], () => {
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    });
    // o fundo do risco: uma linha escura dentro da clara, que da profundidade
    ctx.strokeStyle = u.rgba('#7ba4d6', 0.7); ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(ax + 1, ay + 1); ctx.lineTo(bx - 1, by - 1); ctx.stroke();
    ctx.restore();
    a.discoLuz(ctx, bx, by, R * 0.17, '#ffffff', 0.9);
  };

  /* 24. letradela — "leve e nao termina. Como quem escreve com pressa para nao
     esquecer". O mesmo anel, e um traco que se desfaz sem acabar. */
  S.letradela = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.54, cy = H * 0.48, R = H * 0.33;
    a.fundo(ctx, W, H, p.cor, 19, 0.4);
    aro(ctx, cx, cy, R * 0.44, R, p.cor, 1);
    // o traco: longo, fino, e apagando no fim — nunca termina
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const k = i / 40;
      pts.push([cx - R * 0.30 + k * R * 0.66 + Math.sin(k * 5.2) * R * 0.06,
                cy - R * 0.38 + k * R * 0.82 - Math.sin(k * 3.1) * R * 0.05]);
    }
    rastro(ctx, pts, '#e8dcff', 3.4, 0.95);
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = u.rgba('#ffffff', 0.5); ctx.lineWidth = 1;
    ctx.beginPath();
    pts.slice(0, 26).forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]));
    ctx.stroke();
    ctx.restore();
    a.discoLuz(ctx, pts[2][0], pts[2][1], R * 0.13, '#e8dcff', 0.8);
  };

  /* 25. juntosant — "eles eram UM. O escuro morno de antes de haver espaco".
     Nao sao dois encostados: e um corpo so. E nao ha estrela nenhuma ainda. */
  S.juntosant = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.48, R = H * 0.28;
    escuroMorno(ctx, W, H, p.cor);
    a.discoLuz(ctx, cx, cy, R * 2.6, u.mix(p.cor, '#ffd9c0', 0.4), 0.75);
    // o corpo unico: metade acesa por dentro, metade acesa na beirada
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    const cl = ctx.createRadialGradient(cx - R * 0.5, cy - R * 0.4, 0, cx - R * 0.35, cy, R * 1.25);
    cl.addColorStop(0, u.rgba('#ffffff', 0.98));
    cl.addColorStop(0.45, u.rgba('#e8f2ff', 0.8));
    cl.addColorStop(1, u.rgba('#6f8fc0', 0.2));
    ctx.fillStyle = cl; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    const es = ctx.createRadialGradient(cx + R * 0.45, cy + R * 0.25, R * 0.1, cx + R * 0.4, cy, R * 1.1);
    es.addColorStop(0, 'rgba(8,5,18,0.96)');
    es.addColorStop(0.7, 'rgba(14,9,26,0.8)');
    es.addColorStop(1, 'rgba(20,14,36,0)');
    ctx.fillStyle = es; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    // a beirada dela acesa por fora, que e o oposto dele
    ctx.strokeStyle = u.rgba('#c9b4ff', 0.75); ctx.lineWidth = R * 0.05;
    ctx.beginPath(); ctx.arc(cx, cy, R * 0.97, -1.2, 1.5); ctx.stroke();
    ctx.restore();
    // a costura entre as duas naturezas: uma onda, nao uma reta
    ctx.save(); ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter';
    const div = () => {
      ctx.beginPath(); ctx.moveTo(cx + R * 0.02, cy - R);
      ctx.bezierCurveTo(cx + R * 0.7, cy - R * 0.4, cx - R * 0.5, cy + R * 0.3, cx + R * 0.1, cy + R);
    };
    ctx.strokeStyle = u.rgba('#ffd9c0', 0.3); ctx.lineWidth = R * 0.14; div(); ctx.stroke();
    ctx.strokeStyle = u.rgba('#ffffff', 0.55); ctx.lineWidth = 1.4; div(); ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = u.rgba('#ffffff', 0.22); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
  };

  /* 26. paraeu — "um nao vira dois sozinho. Alguem tem que querer".
     A separacao acontecendo, e a faisca nascendo no meio da fenda. */
  S.paraeu = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cy = H * 0.44, R = H * 0.18;
    const afast = p.afast == null ? 0.17 : p.afast;
    escuroMorno(ctx, W, H, p.cor);
    const px = W * (0.5 - afast), mx = W * (0.5 + afast);
    // os dois lados, ainda com a forma de quem foi um so: metades, nao circulos
    ctx.save();
    ctx.beginPath(); ctx.arc(px, cy, R, 0, TAU); ctx.clip();
    const cl = ctx.createRadialGradient(px - R * 0.4, cy - R * 0.4, 0, px, cy, R * 1.2);
    cl.addColorStop(0, u.rgba('#ffffff', 0.98)); cl.addColorStop(1, u.rgba('#7ba4d6', 0.45));
    ctx.fillStyle = cl; ctx.fillRect(px - R, cy - R, R * 2, R * 2);
    ctx.restore();
    ctx.save();
    ctx.beginPath(); ctx.arc(mx, cy, R, 0, TAU); ctx.clip();
    const es = ctx.createRadialGradient(mx + R * 0.3, cy + R * 0.2, R * 0.08, mx, cy, R * 1.1);
    es.addColorStop(0, 'rgba(10,6,20,0.98)'); es.addColorStop(1, 'rgba(26,18,48,0.6)');
    ctx.fillStyle = es; ctx.fillRect(mx - R, cy - R, R * 2, R * 2);
    ctx.strokeStyle = u.rgba('#c9b4ff', 0.8); ctx.lineWidth = R * 0.07;
    ctx.beginPath(); ctx.arc(mx, cy, R * 0.96, 0, TAU); ctx.stroke();
    ctx.restore();
    // os fios que ainda ligam os dois: o que se rasgou
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const y = cy + (i - 2) * R * 0.30;
      ctx.strokeStyle = u.rgba('#ffd9c0', 0.6 - Math.abs(i - 2) * 0.13);
      ctx.lineWidth = 1.8 - Math.abs(i - 2) * 0.3;
      ctx.beginPath();
      ctx.moveTo(px + R * 0.92, y);
      ctx.quadraticCurveTo(W * 0.5, y + Math.sin(i * 1.7 + t * 0.4) * R * 0.12, mx - R * 0.92, y);
      ctx.stroke();
    }
    ctx.restore();
    // ela: nasce no meio, e e por isso que ha um meio
    a.discoLuz(ctx, W * 0.5, cy, R * 2.1, '#ffffff', 1);
    a.discoLuz(ctx, W * 0.5, cy, R * 0.9, '#fff3c2', 0.9);
    a.bola(ctx, W * 0.5, cy, R * 0.42, t, Math.min(1, (p.lavada || 0) + 0.15), t * 0.4);
  };

  /* 27. opreco — "se os dois se encostarem de novo, o espaco fecha. E tudo que
     esta dentro fecha junto". O que esta dentro precisa aparecer. */
  S.opreco = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cy = H * 0.46, R = H * 0.155;
    const afast = p.afast == null ? 0.26 : p.afast;
    a.fundo(ctx, W, H, p.cor, 71, 0.4);
    const px = W * (0.5 - afast), mx = W * (0.5 + afast);
    const meia = (mx - px) * 0.5 - R * 0.95, cxm = W * 0.5;
    // a fresta, e o universo apertado dentro dela
    if (meia > 4) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(cxm - meia, cy);
      ctx.quadraticCurveTo(cxm, cy - H * 0.20, cxm + meia, cy);
      ctx.quadraticCurveTo(cxm, cy + H * 0.20, cxm - meia, cy);
      ctx.closePath(); ctx.clip();
      ctx.fillStyle = '#05040e'; ctx.fillRect(cxm - meia, cy - H * 0.2, meia * 2, H * 0.4);
      for (let i = 0; i < 46; i++) {
        const x = cxm - meia + a.rnd(i * 4.3) * meia * 2, y = cy - H * 0.2 + a.rnd(i * 8.7) * H * 0.4;
        ctx.fillStyle = u.rgba(a.rnd(i * 2.1) > 0.75 ? '#ffffff' : '#9be7ff', 0.25 + a.rnd(i * 6.7) * 0.6);
        ctx.beginPath(); ctx.arc(x, y, 0.5 + a.rnd(i * 3.1) * 1.2, 0, TAU); ctx.fill();
      }
      miniGalaxia(ctx, cxm, cy, Math.min(meia * 0.9, H * 0.10), '#9be7ff', t * 0.05);
      ctx.restore();
      ctx.save(); ctx.lineCap = 'round';
      a.bloom(ctx, '#ff8fa8', [[1.3, 0.7], [4.5, 0.2], [12, 0.08]], () => {
        ctx.beginPath();
        ctx.moveTo(cxm - meia, cy);
        ctx.quadraticCurveTo(cxm, cy - H * 0.20, cxm + meia, cy);
        ctx.quadraticCurveTo(cxm, cy + H * 0.20, cxm - meia, cy);
        ctx.stroke();
      });
      ctx.restore();
    }
    a.pai(ctx, px, cy, R, t, 1);
    a.mae(ctx, mx, cy, R, t, 1);
    // as setas de quem esta vindo: o preco e isso acontecer
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = u.rgba('#ff8fa8', 0.55); ctx.lineWidth = 1.5;
    [-1, 1].forEach(s => {
      const x = W * 0.5 + s * (afast * W + R * 1.5);
      ctx.beginPath();
      ctx.moveTo(x, H * 0.76); ctx.lineTo(x - s * H * 0.07, H * 0.76);
      ctx.moveTo(x - s * H * 0.07, H * 0.76); ctx.lineTo(x - s * H * 0.045, H * 0.745);
      ctx.moveTo(x - s * H * 0.07, H * 0.76); ctx.lineTo(x - s * H * 0.045, H * 0.775);
      ctx.stroke();
    });
    ctx.restore();
  };

  /* 28. muitasmaos — "ela nao veio sozinha. Nunca tinha reparado nisso". */
  S.muitasmaos = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.48, R = H * 0.30;
    a.fundo(ctx, W, H, p.cor, 83, 0.6);
    const n = 22;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * TAU + t * 0.05;
      const x = cx + Math.cos(ang) * R, y = cy + Math.sin(ang) * R * 0.92;
      const rr = H * (0.020 + a.rnd(i * 2.3) * 0.015);
      a.discoLuz(ctx, x, y, rr * 2.6, p.cor, 0.5);
      const g = ctx.createRadialGradient(x - rr * 0.3, y - rr * 0.3, 0, x, y, rr);
      g.addColorStop(0, u.rgba('#ffffff', 0.9));
      g.addColorStop(1, u.rgba(p.cor, 0.7));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill();
      // o fio de cada um ate ela: e isso que ela nunca tinha reparado
      ctx.strokeStyle = u.rgba(p.cor, 0.10); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(cx, cy + H * 0.06); ctx.stroke();
    }
    a.bola(ctx, cx, cy + H * 0.06, H * 0.075, t, p.lavada, t * 0.2);
  };

  /* 29. costura — "ha um fio atravessando tudo. Da para segui-lo sem soltar". */
  S.costura = (ctx, W, H, p, t) => {
    const a = A(), u = U();
    a.fundo(ctx, W, H, p.cor, 89, 0.5);
    ctx.save(); ctx.lineCap = 'round';
    const caminho = () => {
      ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const k = i / 60, x = k * W;
        const y = H * 0.5 + Math.sin(k * 5 + t * 0.5) * H * 0.22 * Math.sin(k * Math.PI);
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
    };
    a.bloom(ctx, p.cor, [[1.6, 0.9], [5, 0.25], [14, 0.08]], () => { caminho(); ctx.stroke(); });
    ctx.strokeStyle = u.rgba('#ffffff', 0.7); ctx.lineWidth = 0.9;
    caminho(); ctx.stroke();
    // os pontos da costura: o fio passa POR dentro das coisas
    for (let i = 1; i < 6; i++) {
      const k = i / 6, x = k * W;
      const y = H * 0.5 + Math.sin(k * 5 + t * 0.5) * H * 0.22 * Math.sin(k * Math.PI);
      ctx.strokeStyle = u.rgba('#ffffff', 0.3); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y, H * 0.035, 0, TAU); ctx.stroke();
    }
    ctx.restore();
    // vai e volta pelo fio: da para segui-lo sem soltar, e sem salto no fim
    const k = 0.5 - 0.5 * Math.cos(t * 0.22), x = k * W;
    const y = H * 0.5 + Math.sin(k * 5 + t * 0.5) * H * 0.22 * Math.sin(k * Math.PI);
    a.bola(ctx, x, y, H * 0.045, t, p.lavada, t * 0.3);
  };

  /* 30. aporta — "o fim do caminho e uma porta. Do outro lado, duas luzes paradas". */
  S.aporta = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.46, R = H * 0.27;
    a.fundo(ctx, W, H, p.cor, 73, 0.6);
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    const dentro = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    dentro.addColorStop(0, u.rgba('#1a1736', 1));
    dentro.addColorStop(1, u.rgba('#05030c', 1));
    ctx.fillStyle = dentro; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    a.pai(ctx, cx - R * 0.42, cy, R * 0.28, t, 0.9);
    a.mae(ctx, cx + R * 0.42, cy, R * 0.28, t, 0.9);
    ctx.restore();
    ctx.save(); ctx.lineCap = 'round';
    a.bloom(ctx, p.cor, [[2.4, 0.9], [7, 0.25], [18, 0.1]], () => {
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    });
    ctx.strokeStyle = u.rgba('#ffffff', 0.55); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    ctx.restore();
    // o caminho que acaba aqui, e ela no fim dele
    ctx.save();
    ctx.setLineDash([4, 9]); ctx.lineDashOffset = -t * 8;
    ctx.strokeStyle = u.rgba('#ffffff', 0.14); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, H * 0.84); ctx.lineTo(cx, cy + R * 1.12); ctx.stroke();
    ctx.restore();
    a.bola(ctx, cx, H * 0.87, H * 0.042, t, p.lavada, t * 0.2);
  };

  /* ================= DEPOIS DO FIM ================= */

  /* 31. nomeinteir — "o nome e o que gira em volta de algo maior que si".
     Entao a palavra tem uma orbita, e ela e que esta girando. */
  S.nomeinteir = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.48;
    a.fundo(ctx, W, H, p.cor, 101, 0.45);
    a.discoLuz(ctx, cx, cy, H * 0.34, p.cor, 0.7);
    // a orbita em volta da palavra
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    [[0.40, 0.30], [0.46, 0.16]].forEach(c => {
      ctx.strokeStyle = u.rgba(p.cor, c[1]); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(cx, cy, W * c[0], H * c[0] * 0.52, -0.16, 0, TAU); ctx.stroke();
    });
    ctx.restore();
    palavra(ctx, cx, cy, oTexto(p, 'ORBO'), p.cor, H * 0.20, 1);
    // ela, girando em volta do proprio nome
    const ang = t * 0.35;
    const ox = cx + Math.cos(ang) * W * 0.40, oy = cy + Math.sin(ang) * H * 0.208;
    a.bola(ctx, ox, oy, H * 0.05, t, 0, ang);
  };

  /* 32. oqueficou — "ela voltou com cor. Foi preciso ir duas vezes para ver as
     duas metades". Dois caminhos, vindos de lados opostos, no mesmo ponto. */
  S.oqueficou = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.46, r = H * 0.115;
    a.fundo(ctx, W, H, p.cor, 103, 0.6);
    // os dois caminhos: um claro pela esquerda, um escuro pela direita
    [[-1, '#f2f6ff'], [1, '#b79bff']].forEach(c => {
      const pts = [];
      for (let i = 0; i <= 34; i++) {
        const k = i / 34;
        pts.push([cx + c[0] * (r * 1.4 + k * W * 0.42),
                  cy + Math.sin(k * 2.6) * H * 0.13 * c[0] + k * H * 0.05]);
      }
      rastro(ctx, pts, c[1], 2.6, 0.55);
    });
    a.discoLuz(ctx, cx, cy, r * 3, p.cor, 0.7);
    a.bola(ctx, cx, cy, r, t, 0, t * 0.3);
    // as duas metades, marcadas de leve em volta
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = u.rgba('#ffffff', 0.32); ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.35, -2.6, -0.5); ctx.stroke();
    ctx.strokeStyle = u.rgba('#b79bff', 0.32);
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.35, 0.5, 2.6); ctx.stroke();
    ctx.restore();
  };

  /* 33. todasmaos — "os quatro caminhos levam ao mesmo lugar. A diferenca e
     quem chega junto". Quatro entradas, um ponto, e as maos em volta. */
  S.todasmaos = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.47;
    a.fundo(ctx, W, H, p.cor, 107, 0.5);
    // os quatro caminhos, de quatro cantos, chegando no mesmo ponto
    const cantos = [[-1, -1, '#9be7ff'], [1, -1, '#ffd93d'], [-1, 1, '#7cff6b'], [1, 1, '#ff7ad9']];
    cantos.forEach((c, i) => {
      const pts = [];
      for (let k = 0; k <= 26; k++) {
        const q = k / 26;
        pts.push([cx + c[0] * (1 - q) * W * 0.44 + Math.sin(q * 3 + i) * W * 0.02,
                  cy + c[1] * (1 - q) * H * 0.34]);
      }
      rastro(ctx, pts.slice().reverse(), c[2], 2.4, 0.6);
    });
    // as maos em volta: quem chega junto
    const n = 16;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * TAU + t * 0.04;
      const x = cx + Math.cos(ang) * H * 0.32, y = cy + Math.sin(ang) * H * 0.30;
      const rr = H * (0.017 + a.rnd(i * 2.3) * 0.012);
      a.discoLuz(ctx, x, y, rr * 2.6, p.cor, 0.45);
      const g = ctx.createRadialGradient(x - rr * 0.3, y - rr * 0.3, 0, x, y, rr);
      g.addColorStop(0, u.rgba('#ffffff', 0.9)); g.addColorStop(1, u.rgba(p.cor, 0.7));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill();
    }
    a.discoLuz(ctx, cx, cy, H * 0.16, '#ffffff', 0.95);
    a.bola(ctx, cx, cy, H * 0.07, t, 0, t * 0.2);
  };

  HR.FragScenes = S;
  HR.FRAG_ARRANJOS = Object.keys(S);
})();
