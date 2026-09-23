/* =====================================================================
   ORBO v8 — Os 33 arranjos dos cards, em vetor. UM para cada fragmento.

   Cada fragmento tem o seu desenho, e o desenho diz o que a frase diz: se a
   frase fala de idade, o quadro mede idade; se fala de duas maos, tem duas
   maos; se fala de um instante em que nao havia nada, o quadro comeca vazio.
   (O ASSUNTO de cada card foi revisado na v7 e nao muda aqui: o que muda e
   o ESTILO.)

   Estilo: ilustracao vetorial de cartaz. Contorno escuro em tudo, cor
   chapada em dois tons, luz de cima/esquerda, fundo chapado com grade de
   pontos, e no maximo um brilho difuso por card. Os elementos vem de
   js/render-frag.js — e por isso que a serie continua sendo uma serie.

   Regras de composicao, iguais em todos:
   - a luz vem de cima e da esquerda;
   - o assunto fica na faixa de ouro (38% ou 62% da altura), nunca no meio
     exato, salvo quando a simetria E o assunto;
   - sobra e parte do desenho: nada encosta na beirada (a moldura mora la);
   - a animacao e um respiro ou um giro lento. Nunca treme.

   p.ato chega de ui-fragments (o ato do fragmento) e escolhe o tom do ceu.

   API: HR.FragScenes[id do fragmento](ctx, W, H, p, t)
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const TAU = Math.PI * 2;
  const A = () => HR.FragArt;
  const U = () => HR.U;
  const S = {};

  /* ================= ferramentas comuns ================= */

  // traco que afina ate a ponta, com contorno: o rastro do vetor
  function rastro(ctx, pts, cor, larg, forca) {
    ctx.save(); ctx.globalAlpha = forca == null ? 1 : Math.min(1, forca);
    A().fio(ctx, pts, cor, larg, { afina: 0.8 });
    ctx.restore();
  }

  // palavra de cartaz: contorno grosso escuro, uma copia deslocada na cor
  // (a sombra chapada) e a letra branca por cima
  function palavra(ctx, cx, cy, txt, cor, tam, nitidez) {
    const u = U(), n = nitidez == null ? 1 : nitidez, d = Math.max(1.5, tam * 0.07);
    ctx.save();
    ctx.globalAlpha = n;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.font = "700 " + Math.round(tam) + "px 'Fredoka', 'Rubik', sans-serif";
    ctx.strokeStyle = A().ESC; ctx.lineWidth = Math.max(3, tam * 0.16);
    ctx.strokeText(txt, cx + d, cy + d);
    ctx.fillStyle = cor; ctx.fillText(txt, cx + d, cy + d);
    ctx.strokeText(txt, cx, cy);
    ctx.fillStyle = '#ffffff'; ctx.fillText(txt, cx, cy);
    ctx.fillStyle = u.rgba(cor, 0.35); ctx.fillText(txt, cx, cy);
    ctx.restore();
  }

  // a palavra do card segue o idioma: p.palavraK e uma chave, p.palavra e texto
  function oTexto(p, padrao) {
    if (p.palavraK) { const v = HR.t(p.palavraK); if (v && v !== p.palavraK) return v; }
    return p.palavra || padrao;
  }

  // anel em traco com contorno e luz: a forma base dos aneis
  function aro(ctx, cx, cy, rx, ry, cor, forca, lw) {
    const u = U(), f = forca == null ? 1 : forca;
    ctx.save(); ctx.lineCap = 'round'; ctx.globalAlpha = f;
    const el = () => { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU); };
    ctx.strokeStyle = u.rgba(cor, 0.18); ctx.lineWidth = lw * 5; el(); ctx.stroke();
    ctx.strokeStyle = A().ESC; ctx.lineWidth = lw * 2.6; el(); ctx.stroke();
    ctx.strokeStyle = cor; ctx.lineWidth = lw * 1.5; el(); ctx.stroke();
    ctx.strokeStyle = u.rgba('#ffffff', 0.85); ctx.lineWidth = lw * 0.5;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx - lw * 0.35, ry - lw * 0.35, 0, -2.9, -1.2); ctx.stroke();
    ctx.restore();
  }

  // uma mao: palma chapada, quatro dedos e o polegar, tudo com contorno.
  // Sem detalhe nenhum — no jogo inteiro ninguem tem rosto, e ela nao lembra.
  // O x local aponta para o que a mao esta segurando.
  function mao(ctx, x, y, r, ang, cor, lw) {
    const a = A(), u = U(), sombra = u.mix(cor, a.ESC, 0.35);
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const dedo = (y0, comp, esp) => () => {
      ctx.beginPath(); ctx.moveTo(-r * 0.5, y0);
      ctx.quadraticCurveTo(r * 0.28, y0 * 1.06, r * comp, y0 * 0.42);
      ctx.lineWidth = esp;
    };
    const dedos = [dedo(-r * 0.56, 0.74, r * 0.22), dedo(-r * 0.19, 0.92, r * 0.24), dedo(r * 0.19, 0.86, r * 0.23), dedo(r * 0.54, 0.62, r * 0.20)];
    const polegar = () => {
      ctx.beginPath(); ctx.moveTo(-r * 0.6, r * 0.5);
      ctx.quadraticCurveTo(-r * 0.1, r * 1.0, r * 0.42, r * 0.78);
      ctx.lineWidth = r * 0.24;
    };
    // contorno de tudo primeiro (traco mais grosso), depois a cor por cima
    const todos = dedos.concat([polegar]);
    ctx.strokeStyle = a.ESC;
    todos.forEach(f => { f(); ctx.lineWidth += lw * 2; ctx.stroke(); });
    a.forma(ctx, a.elip(ctx, -r * 0.42, 0, r * 0.62, r * 0.8), { base: cor, sombra, lw });
    ctx.strokeStyle = sombra; todos.forEach(f => { f(); ctx.stroke(); });
    ctx.strokeStyle = cor; todos.forEach(f => { f(); ctx.lineWidth *= 0.62; ctx.stroke(); });
    ctx.strokeStyle = u.rgba('#ffffff', 0.7); dedos.forEach(f => { f(); ctx.lineWidth *= 0.22; ctx.stroke(); });
    ctx.restore();
  }

  // galaxia pequena, chapada: um disco, dois bracos e o miolo
  function miniGalaxia(ctx, cx, cy, R, cor, giro, lw) {
    const a = A(), u = U();
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(giro); ctx.scale(1, 0.42);
    ctx.fillStyle = u.rgba(cor, 0.22); ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
    ctx.lineCap = 'round';
    for (let b = 0; b < 2; b++) {
      ctx.rotate(Math.PI);
      const braco = () => {
        ctx.beginPath();
        for (let i = 0; i <= 14; i++) { const k = i / 14, an = k * 4.2, rr = k * R * 0.94; i ? ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr) : ctx.moveTo(0, 0); }
      };
      ctx.strokeStyle = a.ESC; ctx.lineWidth = lw * 2.4; braco(); ctx.stroke();
      ctx.strokeStyle = cor; ctx.lineWidth = lw * 1.3; braco(); ctx.stroke();
    }
    ctx.restore();
    a.forma(ctx, a.circ(ctx, cx, cy, R * 0.2), { base: '#fff3c2', sombra: u.mix(cor, '#fff3c2', 0.5), lw: lw * 0.8 });
  }

  // o escuro morno de antes de haver espaco: nenhuma estrela, nenhuma grade
  function escuroMorno(ctx, W, H, cor) {
    const u = U();
    ctx.fillStyle = '#120a10'; ctx.fillRect(0, 0, W, H);
    [[1.0, 0.05], [0.7, 0.06], [0.42, 0.07]].forEach(c => {
      ctx.fillStyle = u.rgba(u.mix(cor, '#ff9a7a', 0.5), c[1]);
      ctx.beginPath(); ctx.ellipse(W * 0.48, H * 0.46, H * c[0] * 1.1, H * c[0] * 0.85, 0, 0, TAU); ctx.fill();
    });
  }

  // linha pontilhada com contorno, para caminhos e olhares
  function pontilhado(ctx, pts, cor, lw, t) {
    ctx.save(); ctx.lineCap = 'round';
    ctx.setLineDash([lw * 1.2, lw * 3.2]); ctx.lineDashOffset = -(t || 0) * lw * 4;
    ctx.strokeStyle = cor; ctx.lineWidth = lw;
    ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke();
    ctx.restore();
  }

  // o chao: uma faixa chapada embaixo, com o fio de cima aceso
  function chao(ctx, W, H, y, cor, lw, curva) {
    const u = U(), c = curva || 0;
    const p = () => { ctx.beginPath(); ctx.moveTo(-lw, y + c); ctx.quadraticCurveTo(W / 2, y - c, W + lw, y + c); ctx.lineTo(W + lw, H + lw); ctx.lineTo(-lw, H + lw); ctx.closePath(); };
    A().forma(ctx, p, { base: u.mix(cor, '#0a0812', 0.82), sombra: u.mix(cor, '#0a0812', 0.9), luz: u.rgba(cor, 0.55), lw });
  }

  /* ================= ATO I — ACORDAR ================= */

  /* 1. giro — "girou antes de saber que estava girando".
     O assunto e o giro, nao a bola: o rastro do proprio giro fica na tela. */
  S.giro = (ctx, W, H, p, t) => {
    const a = A(), cx = W * 0.5, cy = H * 0.46, r = H * 0.115, lw = a.LW(H);
    a.ceu(ctx, W, H, p.cor, p.ato, 3, [0.5, 0.46]);
    chao(ctx, W, H, H * 0.80, p.cor, lw, H * 0.03);
    // o rastro: uma espiral que se abre e afina para tras
    for (let v = 0; v < 2; v++) {
      const pts = [];
      for (let i = 0; i <= 40; i++) {
        const k = i / 40, ang = -k * 6.6 + t * 0.45 + v * 3.14, rr = r * (1.3 + k * 2.3);
        pts.push([cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr * 0.34]);
      }
      a.fio(ctx, pts, v ? p.cor : '#ffffff', lw * (1.6 - v * 0.5), { afina: 0.85 });
    }
    a.bola(ctx, cx, cy, r, t, p.lavada, t * 0.55);
  };

  /* 2. faltava — "o lugar ao lado estava vazio de um jeito especifico".
     O vazio tem a forma exata de alguem, e nada em volta encosta nele. */
  S.faltava = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cy = H * 0.52, r = H * 0.105, bx = W * 0.34, vx = W * 0.66, lw = a.LW(H);
    a.ceu(ctx, W, H, p.cor, p.ato, 11, [0.34, 0.52]);
    // o oco: um disco mais escuro que o ceu, com a beirada pontilhada
    ctx.fillStyle = u.rgba(a.ESC, 0.55); ctx.beginPath(); ctx.arc(vx, cy, r * 1.9, 0, TAU); ctx.fill();
    ctx.fillStyle = u.rgba(a.ESC, 0.8); ctx.beginPath(); ctx.arc(vx, cy, r * 1.25, 0, TAU); ctx.fill();
    ctx.save(); ctx.setLineDash([lw * 1.2, lw * 3]); ctx.lineDashOffset = -t * lw * 3;
    ctx.strokeStyle = u.rgba('#ffffff', 0.55); ctx.lineWidth = lw * 0.8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(vx, cy, r * 1.06, 0, TAU); ctx.stroke();
    ctx.restore();
    // o fio entre os dois lugares, quase apagado
    pontilhado(ctx, [[bx + r * 1.5, cy], [vx - r * 1.5, cy]], u.rgba(p.cor, 0.5), lw * 0.7, 0);
    a.bola(ctx, bx, cy, r, t, p.lavada, -t * 0.2);
  };

  /* 3. escuro — "ela caiu, e o escuro segurou. Nao machucou".
     A concha embaixo e uma mao aberta: o escuro nao e vazio, ele ampara. */
  S.escuro = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.60, r = H * 0.10, lw = a.LW(H);
    a.ceu(ctx, W, H, p.cor, p.ato, 21, [0.5, 0.6], { estrelas: 5 });
    // a concha: uma mao aberta vista de frente, chapada. A palma e uma tigela
    // larga e os tres dedos sobem so ate a altura dela — o escuro ampara,
    // nao prende. Respira devagar, sem sair do lugar.
    const resp = Math.sin(t * 0.5) * H * 0.006;
    const R = W * 0.36, palma = cy + r * 0.92 + resp;
    const concha = () => {
      // a tigela: larga e rasa, para caber ela inteira com folga
      ctx.beginPath();
      ctx.moveTo(cx - R, palma);
      ctx.quadraticCurveTo(cx - R * 0.98, palma + H * 0.16, cx, palma + H * 0.18);
      ctx.quadraticCurveTo(cx + R * 0.98, palma + H * 0.16, cx + R, palma);
      // quatro dedos: so uns calombos na beirada, nenhum sobe alto.
      // Vao da direita para a esquerda, cada um com meio raio de largura.
      for (let i = 0; i < 4; i++) {
        ctx.quadraticCurveTo(cx + R * (1 - (i + 0.5) * 0.5), palma - H * 0.055,
                             cx + R * (1 - (i + 1) * 0.5), palma);
      }
      ctx.closePath();
    };
    a.forma(ctx, concha, { base: u.mix(p.cor, a.ESC, 0.72), sombra: u.mix(p.cor, a.ESC, 0.88), luz: u.rgba(p.cor, 0.85), lw });
    // a queda, ja afinando: vem de cima e para em cima dela
    const pts = []; for (let i = 0; i <= 10; i++) pts.push([cx + Math.sin(i * 0.8) * lw * 0.8, cy - r * 1.6 - i * H * 0.028]);
    a.fio(ctx, pts.reverse(), '#ffffff', lw, { afina: 0.9 });
    a.bola(ctx, cx, cy, r, t, p.lavada, t * 0.15);
  };

  /* 4. cinza — "ela se viu pela primeira vez, e nao tinha cor nenhuma".
     O reflexo e ainda mais lavado que ela: e o que assusta. */
  S.cinza = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cy = H * 0.38, r = H * 0.105, cx = W * 0.5, lw = a.LW(H);
    a.ceu(ctx, W, H, p.cor, p.ato, 33, [0.5, 0.38], { estrelas: 4 });
    // o espelho: uma faixa chapada com o fio da beirada
    ctx.fillStyle = u.rgba(p.cor, 0.10); ctx.fillRect(0, H * 0.56, W, H * 0.44);
    ctx.strokeStyle = u.rgba('#ffffff', 0.4); ctx.lineWidth = lw * 0.6;
    ctx.beginPath(); ctx.moveTo(W * 0.08, H * 0.56); ctx.lineTo(W * 0.92, H * 0.56); ctx.stroke();
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.translate(0, H * 1.12); ctx.scale(1, -1);
    a.bola(ctx, cx, cy, r, t, 1, 0);
    ctx.restore();
    a.bola(ctx, cx, cy, r, t, p.lavada, 0);
  };

  /* 5. apelido — "alguem a chamava assim. Ela nao lembra quem".
     A palavra esta acesa; quem disse e um lugar vazio embaixo dela. */
  S.apelido = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, lw = a.LW(H);
    a.ceu(ctx, W, H, p.cor, p.ato, 97, [0.5, 0.42]);
    palavra(ctx, cx, H * 0.42, oTexto(p, 'FAÍSCA'), p.cor, H * 0.165, 1);
    // de onde veio a voz: um oco escuro, e o fio pontilhado ate a palavra
    ctx.fillStyle = u.rgba(a.ESC, 0.6); ctx.beginPath(); ctx.arc(cx, H * 0.74, H * 0.13, 0, TAU); ctx.fill();
    ctx.fillStyle = u.rgba(a.ESC, 0.85); ctx.beginPath(); ctx.arc(cx, H * 0.74, H * 0.075, 0, TAU); ctx.fill();
    ctx.save(); ctx.setLineDash([lw, lw * 2.6]); ctx.lineDashOffset = -t * lw * 3; ctx.lineCap = 'round';
    ctx.strokeStyle = u.rgba('#ffffff', 0.5); ctx.lineWidth = lw * 0.7;
    ctx.beginPath(); ctx.moveTo(cx, H * 0.70); ctx.lineTo(cx, H * 0.55); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, H * 0.74, H * 0.075, 0, TAU); ctx.stroke();
    ctx.restore();
  };

  /* 6. berco — "tem cheiro de coisa nova; ninguem usou antes dela".
     Nao e uma galaxia velha: e um lugar ainda se formando, aberto em cima. */
  S.berco = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.58, lw = a.LW(H);
    a.ceu(ctx, W, H, p.cor, p.ato, 67, [0.5, 0.55], { estrelas: 0 });
    // colunas de gas: a materia ainda de pe, chapada, sem contorno
    [[0.22, 0.30], [0.78, 0.24], [0.40, 0.16]].forEach((c, i) => {
      const x = W * c[0], larg = W * c[1] * 0.3, osc = Math.sin(t * 0.2 + i) * lw;
      ctx.fillStyle = u.rgba(p.cor, 0.09);
      ctx.beginPath();
      ctx.moveTo(x - larg, H * 0.82);
      ctx.quadraticCurveTo(x - larg * 0.5 + osc, H * 0.46, x - larg * 0.2, H * 0.20);
      ctx.lineTo(x + larg * 0.2, H * 0.20);
      ctx.quadraticCurveTo(x + larg * 0.5 + osc, H * 0.46, x + larg, H * 0.82);
      ctx.closePath(); ctx.fill();
    });
    // o berco: uma concha larga embaixo, aberta para cima
    const berco = () => { ctx.beginPath(); ctx.ellipse(cx, cy + H * 0.13, W * 0.34, H * 0.15, 0, Math.PI * 0.06, Math.PI * 0.94); ctx.closePath(); };
    a.forma(ctx, berco, { base: u.mix(p.cor, a.ESC, 0.7), sombra: u.mix(p.cor, a.ESC, 0.86), luz: u.rgba(p.cor, 0.8), lw });
    // luz nova acendendo: estrelas pequenas, todas do mesmo tamanho, nenhuma gasta
    for (let i = 0; i < 14; i++) {
      const x = W * (0.16 + a.rnd(i * 7.3) * 0.68), y = H * (0.24 + a.rnd(i * 4.1) * 0.40);
      const f = 0.45 + 0.55 * Math.abs(Math.sin(t * 0.5 + i));
      a.estrela(ctx, x, y, H * 0.016, '#ffffff', f);
    }
    a.bola(ctx, cx, cy, H * 0.085, t, p.lavada, t * 0.12);
  };

  /* 7. maisnovo — "a mare disse a idade que tinha. Era menor que a dela".
     Duas pilhas de marcas: o lugar tem poucas, ela tem muitas. O quadro mede. */
  S.maisnovo = (ctx, W, H, p, t) => {
    const a = A(), u = U(), lw = a.LW(H), cy = H * 0.47;
    a.ceu(ctx, W, H, p.cor, p.ato, 13, [0.5, 0.47], { estrelas: 4 });
    // a pilha maior tem 9 mares: o passo sai da largura que sobra, contando o
    // traco do aro, para que nem ela nem a regua encostem na beirada
    const E = Math.min(H * 0.030, (W * 0.20 - H * 0.055 * 0.86) / (8 * 0.86));
    const pilha = (x, n, cor, rot) => {
      ctx.save(); ctx.lineCap = 'round';
      for (let i = n - 1; i >= 0; i--) {
        const rr = H * 0.055 + i * E;
        const el = () => { ctx.beginPath(); ctx.ellipse(x, cy, rr * 0.86, rr, rot, 0, TAU); };
        ctx.strokeStyle = a.ESC; ctx.lineWidth = lw * 1.9; el(); ctx.stroke();
        ctx.strokeStyle = u.mix(cor, a.ESC, 0.45 - (i / n) * 0.35); ctx.lineWidth = lw * 0.9; el(); ctx.stroke();
      }
      ctx.restore();
      a.forma(ctx, a.circ(ctx, x, cy, H * 0.028), { base: cor, sombra: u.mix(cor, a.ESC, 0.4), lw: lw * 0.8 });
    };
    pilha(W * 0.28, 4, '#8fa2c8', -0.12);   // o lugar: quatro mares, e frias
    pilha(W * 0.72, 9, '#ffd08a', 0.1);     // ela: nove, e quentes
    // a regua: ate onde cada um chega. O quadro inteiro e essa comparacao.
    const meia = Math.min(W * 0.17, W * 0.24);
    [[W * 0.28, 4, '#8fa2c8'], [W * 0.72, 9, '#ffd08a']].forEach(c => {
      const alto = cy - (H * 0.055 + (c[1] - 1) * E);
      a.fio(ctx, [[c[0] - meia, alto], [c[0] + meia, alto]], c[2], lw * 0.7);
      a.fio(ctx, [[c[0] - meia, alto - H * 0.02], [c[0] - meia, alto + H * 0.02]], c[2], lw * 0.7);
      a.fio(ctx, [[c[0] + meia, alto - H * 0.02], [c[0] + meia, alto + H * 0.02]], c[2], lw * 0.7);
    });
    const a1 = cy - (H * 0.055 + 3 * E), a2 = cy - (H * 0.055 + 8 * E);
    pontilhado(ctx, [[W * 0.28, a1], [W * 0.72, a2]], u.rgba('#ffffff', 0.45), lw * 0.6, 0);
  };

  /* 8. naofecha — "todo anel tem um arranhao no mesmo lugar, como se alguem
     segurasse para ele nao fechar". O anel tem uma falha, e uma mao nela. */
  S.naofecha = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.54, cy = H * 0.48, R = H * 0.31, lw = a.LW(H);
    a.ceu(ctx, W, H, p.cor, p.ato, 59, [0.5, 0.48]);
    // um anel atras, longe: e o que cria profundidade
    ctx.strokeStyle = u.rgba(p.cor, 0.22); ctx.lineWidth = lw * 2.5;
    ctx.beginPath(); ctx.ellipse(W * 0.2, cy - H * 0.05, R * 0.3, R * 0.74, -0.1, 0, TAU); ctx.stroke();
    // o anel da frente, inteiro: ele fechou. O que nao fecha e a mao.
    aro(ctx, cx, cy, R * 0.44, R, p.cor, 1, lw * 1.3);
    // a impressao de quem segurou: a palma como um disco morno atras, e as
    // quatro pontas de dedo pousadas no aro. Nao se ve a mao — se ve a marca.
    ctx.fillStyle = u.rgba('#fff3c2', 0.14); ctx.beginPath(); ctx.arc(cx - R * 0.46, cy - R * 0.10, R * 0.55, 0, TAU); ctx.fill();
    for (let i = 0; i < 4; i++) {
      const ang = Math.PI - 0.62 + i * 0.41;
      const fx = cx + Math.cos(ang) * R * 0.44, fy = cy + Math.sin(ang) * R;
      a.forma(ctx, a.elip(ctx, fx, fy, R * 0.075, R * 0.05, ang + Math.PI / 2), { base: '#fff8dd', sombra: '#ffd08a', lw: lw * 0.8 });
    }
    // o arranhao, sempre no mesmo lugar, do lado de dentro da marca
    const ax = cx - R * 0.40, ay = cy - R * 0.26;
    a.fio(ctx, [[ax, ay], [ax + R * 0.2, ay + R * 0.18], [ax + R * 0.46, ay + R * 0.54]], '#fff3c2', lw * 1.3, { luz: '#ffffff' });
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ax + R * 0.46, ay + R * 0.54, lw * 1.1, 0, TAU); ctx.fill();
  };

  /* 9. dois — "ela SONHOU com duas luzes". Entao esta fora de foco, dobrado,
     e ela esta dormindo embaixo. Nao e uma lembranca: ainda nao. */
  S.dois = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cy = H * 0.42, lw = a.LW(H);
    const r = Math.min(H * 0.10, W * 0.085);
    // a copia do sonho e 15% maior e a coroa vai a 1,75 do raio: o afastamento
    // tem de caber nisso tudo
    const afastPx = Math.min((p.afast == null ? 0.22 : p.afast) * W, W * 0.5 - r * 2.1);
    a.ceu(ctx, W, H, p.cor, p.ato, 41, [0.5, 0.42], { estrelas: 4 });
    const px = W * 0.5 - afastPx, mx = W * 0.5 + afastPx;
    // a camada de sonho: as mesmas duas luzes, deslocadas e fracas
    a.pai(ctx, px - lw * 3, cy + lw * 2, r * 1.15, t, 0.22);
    a.mae(ctx, mx + lw * 3, cy + lw * 2, r * 1.15, t, 0.22);
    a.pai(ctx, px, cy, r, t, 0.7);
    a.mae(ctx, mx, cy, r, t, 0.7);
    // a bruma por cima: e isso que faz parecer sonho e nao lembranca
    ctx.fillStyle = u.rgba('#ffffff', 0.06); ctx.fillRect(0, H * 0.22, W, H * 0.42);
    // ela dormindo: parada, sem rastro, e tres aros do sono subindo
    a.bola(ctx, W * 0.5, H * 0.78, H * 0.055, t, Math.min(1, (p.lavada || 0) + 0.2), 0);
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const k = ((t * 0.25 + i * 0.33) % 1);
      ctx.strokeStyle = u.rgba('#ffffff', 0.5 * Math.sin(k * Math.PI)); ctx.lineWidth = lw * 0.7;
      ctx.beginPath(); ctx.arc(W * 0.5, H * 0.78, H * 0.075 + k * H * 0.08, -2.4, -0.7); ctx.stroke();
    }
    ctx.restore();
  };

  /* ================= ATO II — LEMBRAR ================= */

  /* 10. mesmodia — "nasceram todas juntas; nenhuma e mais velha que a outra".
     Uma fila de sementes do MESMO tamanho, acesas pelo MESMO clarao. */
  S.mesmodia = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cy = H * 0.46, n = 7, lw = a.LW(H);
    a.ceu(ctx, W, H, p.cor, p.ato, 23, [0.5, 0.46]);
    // o clarao que passou por todas: uma faixa chapada, ainda quente
    ctx.fillStyle = u.rgba(p.cor, 0.14); ctx.fillRect(W * 0.06, cy - H * 0.05, W * 0.88, H * 0.10);
    ctx.fillStyle = u.rgba(p.cor, 0.18); ctx.fillRect(W * 0.06, cy - H * 0.022, W * 0.88, H * 0.044);
    const f = 1 + 0.06 * Math.sin(t * 0.8);   // todas respiram JUNTAS
    for (let i = 0; i < n; i++) {
      const x = W * (0.13 + (i / (n - 1)) * 0.74);
      a.forma(ctx, a.circ(ctx, x, cy, H * 0.03 * f), { base: '#ffffff', sombra: u.mix(p.cor, '#ffffff', 0.35), lw });
      // a marca de idade de cada uma: uma risca so, igual em todas
      a.fio(ctx, [[x, cy + H * 0.07], [x, cy + H * 0.10]], '#ffffff', lw * 0.7);
    }
    a.fio(ctx, [[W * 0.13, cy + H * 0.125], [W * 0.87, cy + H * 0.125]], u.rgba('#ffffff', 0.5), lw * 0.6);
  };

  /* 11. instante — "houve um instante em que nao havia nada; tudo comecou nele".
     Comeca vazio de verdade: sem grade, sem estrela. So o ponto, e o que saiu. */
  S.instante = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.44, lw = a.LW(H);
    ctx.fillStyle = '#07050d'; ctx.fillRect(0, 0, W, H);
    // o que saiu do ponto: cunhas em dois tamanhos, e a poeira so perto dele
    ctx.fillStyle = u.rgba(p.cor, 0.07); ctx.beginPath(); ctx.arc(cx, cy, H * 0.42, 0, TAU); ctx.fill();
    ctx.fillStyle = u.rgba(p.cor, 0.09); ctx.beginPath(); ctx.arc(cx, cy, H * 0.26, 0, TAU); ctx.fill();
    a.cunhas(ctx, cx, cy, H * 0.05, 20, u.rgba(p.cor, 0.9), lw, { longo: 7.5, curto: 4.2, larg: 0.5, giro: 0.2, contorno: false });
    a.cunhas(ctx, cx, cy, H * 0.05, 20, '#ffffff', lw, { longo: 3.4, curto: 2.0, larg: 0.22, giro: 0.2, contorno: false });
    for (let i = 0; i < 40; i++) {
      const ang = a.rnd(i * 2.7) * TAU, d = H * (0.14 + a.rnd(i * 5.3) * 0.5);
      a.estrela(ctx, cx + Math.cos(ang) * d, cy + Math.sin(ang) * d * 0.9, H * (0.006 + a.rnd(i * 3.3) * 0.008), a.rnd(i * 9.1) > 0.7 ? '#ffffff' : p.cor, 0.7 * (1 - d / (H * 0.7)));
    }
    // o ponto: o menor desenho do jogo inteiro, e o mais importante
    a.discoLuz(ctx, cx, cy, H * 0.16, '#ffffff', 0.8);
    a.forma(ctx, a.circ(ctx, cx, cy, H * 0.024 + Math.sin(t * 1.2) * H * 0.002), { base: '#ffffff', sombra: u.mix(p.cor, '#ffffff', 0.5), lw });
  };

  /* 12. quente — "antes do instante havia calor; lembra de estar DENTRO de
     alguma coisa". Entao ela esta dentro de uma casca, nao no meio do nada. */
  S.quente = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.5, lw = a.LW(H);
    ctx.fillStyle = '#1c0c12'; ctx.fillRect(0, 0, W, H);
    // o calor em degraus: cinco discos chapados, cada um um pouco mais claro
    for (let i = 5; i >= 1; i--) {
      const r = H * (0.13 + i * 0.075) + Math.sin(t * 0.4 + i) * lw * 0.6;
      ctx.fillStyle = u.mix('#1c0c12', '#ff8a5a', 0.05 + (6 - i) * 0.055);
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
    }
    // a casca: dois arcos fechando em volta dela, um mais perto que o outro
    [[0.31, 1.3], [0.39, 0.8]].forEach(c => aro(ctx, cx, cy, H * c[0] * 0.92, H * c[0], '#ffb98a', 1, lw * c[1]));
    a.forma(ctx, a.circ(ctx, cx, cy, H * 0.14), { base: '#ffd0a8', sombra: '#ff9d6b', lw, contorno: '#3a1a1c' });
    a.bola(ctx, cx, cy, H * 0.07, t, Math.min(1, (p.lavada || 0) + 0.3), t * 0.1);
  };

  /* 13. delonge — "viu uma linha no ceu que nao era estrela. Doeu olhar".
     A linha esta longe e fina; o que doi e o brilho dela, nao o tamanho. */
  S.delonge = (ctx, W, H, p, t) => {
    const a = A(), u = U(), r = H * 0.05, lw = a.LW(H);
    a.ceu(ctx, W, H, p.cor, p.ato, 53, [0.5, 0.30]);
    // o que doi: raios chapados so aqui, em cruz
    a.cunhas(ctx, W * 0.5, H * 0.30, H * 0.02, 4, '#ffffff', lw, { longo: 16, curto: 9, larg: 0.5, contorno: false, giro: 0 });
    a.horizonte(ctx, W, H, H * 0.30, '#dfe6ff', 0.52, t, p.curva || 16);
    // ela embaixo, pequena, e o olhar subindo
    pontilhado(ctx, [[W * 0.5, H * 0.76 - r * 1.8], [W * 0.5, H * 0.36]], u.rgba('#ffffff', 0.4), lw * 0.6, t);
    a.bola(ctx, W * 0.5, H * 0.76, r, t, p.lavada, t * 0.2);
  };

  /* 14. quemsegur — "duas maos, uma de cada lado da linha. Nao lembra o rosto
     de nenhuma". As maos aparecem; os donos, nao. */
  S.quemsegur = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cy = H * 0.46, lw = a.LW(H);
    a.ceu(ctx, W, H, p.cor, p.ato, 43, [0.5, 0.46]);
    // quem segura: dois vultos sem forma, so escuro mais denso, chapado
    [-1, 1].forEach(s => {
      const x = W * (0.5 + s * 0.36);
      ctx.fillStyle = u.rgba(a.ESC, 0.5); ctx.beginPath(); ctx.ellipse(x, cy, H * 0.26, H * 0.36, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = u.rgba(a.ESC, 0.7); ctx.beginPath(); ctx.ellipse(x, cy, H * 0.16, H * 0.26, 0, 0, TAU); ctx.fill();
    });
    a.horizonte(ctx, W, H, cy, '#e6ecff', 0.18, t, 0);
    mao(ctx, W * 0.27, cy, H * 0.12, -0.22, '#cfe4ff', lw);
    mao(ctx, W * 0.73, cy, H * 0.12, Math.PI + 0.22, '#c9b4ff', lw);
    // ela embaixo, olhando de longe
    a.bola(ctx, W * 0.5, H * 0.80, H * 0.045, t, p.lavada, t * 0.2);
  };

  /* 15. contempla — "encontrou quem nao pode ajudar em nada, e mesmo assim
     olha para cima". O assunto nao e a ajuda: e o olhar. */
  S.contempla = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, base = H * 0.80, lw = a.LW(H);
    a.ceu(ctx, W, H, '#8fd0ff', p.ato, 77, [0.5, 0.26], { estrelas: 14 });
    // o olhar: um cone morno e estreito, em dois degraus — ele abre para o
    // ceu, mas o ceu e que e o assunto, nao o cone
    const py = base - H * 0.085;
    [[0.24, 0.05], [0.13, 0.06]].forEach(c => {
      ctx.fillStyle = u.rgba('#ffe2a8', c[1]);
      ctx.beginPath(); ctx.moveTo(cx, py - H * 0.03);
      ctx.lineTo(cx - W * c[0], H * 0.05); ctx.lineTo(cx + W * c[0], H * 0.05); ctx.closePath(); ctx.fill();
    });
    // o mundinho: uma curva pequena embaixo, nada mais
    chao(ctx, W, H, base + H * 0.03, '#8fd0ff', lw, H * 0.09);
    // quem olha: uma marca minuscula, sem rosto e sem poder nenhum.
    // Este e o unico brilho difuso do card.
    a.discoLuz(ctx, cx, py, H * 0.08, '#ffe2a8', 0.55);
    const corpo = () => {
      const b = H * 0.014, h = H * 0.042;
      ctx.beginPath();
      ctx.moveTo(cx - b * 0.55, py - h * 0.35);
      ctx.quadraticCurveTo(cx - b * 1.5, py + h * 0.7, cx - b * 1.1, py + h * 0.75);
      ctx.lineTo(cx + b * 1.1, py + h * 0.75);
      ctx.quadraticCurveTo(cx + b * 1.5, py + h * 0.7, cx + b * 0.55, py - h * 0.35);
      ctx.closePath();
    };
    a.forma(ctx, corpo, { base: '#ffe2a8', sombra: '#d9a35e', lw: lw * 0.8 });
    a.forma(ctx, a.circ(ctx, cx, py - H * 0.048, H * 0.017), { base: '#fff6df', sombra: '#ffc98a', lw: lw * 0.8 });
  };

  /* 16. pontoazul — "um ponto azul, pequeno, cheio de gente olhando".
     Uma foto de sonda: feixe de luz atravessando e o ponto dentro dele. */
  S.pontoazul = (ctx, W, H, p, t) => {
    const a = A(), u = U(), lw = a.LW(H);
    a.ceu(ctx, W, H, '#20304f', p.ato, 79, [0.62, 0.44], { estrelas: 10 });
    // o feixe: uma faixa chapada atravessada
    ctx.save(); ctx.translate(W * 0.55, H * 0.5); ctx.rotate(0.9);
    ctx.fillStyle = u.rgba('#ffd9a0', 0.07); ctx.fillRect(-H, -H * 0.16, H * 2, H * 0.32);
    ctx.fillStyle = u.rgba('#ffd9a0', 0.09); ctx.fillRect(-H, -H * 0.07, H * 2, H * 0.14);
    ctx.restore();
    const px = W * 0.62, py = H * 0.44;
    a.cunhas(ctx, px, py, H * 0.018, 4, '#cfeaff', lw, { longo: 6, curto: 6, larg: 0.4, contorno: false, alt: false });
    a.discoLuz(ctx, px, py, H * 0.09, '#8fd0ff', 0.9);
    a.forma(ctx, a.circ(ctx, px, py, Math.max(2.8, H * 0.011)), { base: '#9fd8ff', sombra: '#4aa0e0', lw: lw * 0.6 });
  };

  /* 17. espiral — "girava como algo que ja girou muito, e ainda assim era nova". */
  S.espiral = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.5, lw = a.LW(H), nb = p.bracos || 4;
    a.ceu(ctx, W, H, p.cor, p.ato, 67, [0.5, 0.5]);
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(t * 0.06 * (p.sentido || 1)); ctx.scale(1, 0.42);
    ctx.fillStyle = u.rgba(p.cor, 0.14); ctx.beginPath(); ctx.arc(0, 0, H * 0.74, 0, TAU); ctx.fill();
    ctx.fillStyle = u.rgba(p.cor, 0.16); ctx.beginPath(); ctx.arc(0, 0, H * 0.46, 0, TAU); ctx.fill();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let b = 0; b < nb; b++) {
      ctx.rotate(TAU / nb);
      const braco = () => {
        ctx.beginPath();
        for (let i = 0; i <= 22; i++) { const k = i / 22, an = k * 4.6, rr = H * 0.06 + k * H * 0.64; i ? ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr) : ctx.moveTo(Math.cos(an) * rr, Math.sin(an) * rr); }
      };
      // o braco afina para fora: tres trechos
      ctx.strokeStyle = a.ESC; ctx.lineWidth = lw * 4.4; braco(); ctx.stroke();
      ctx.strokeStyle = p.cor; ctx.lineWidth = lw * 2.6; braco(); ctx.stroke();
      ctx.strokeStyle = u.rgba('#ffffff', 0.55); ctx.lineWidth = lw * 0.8;
      ctx.beginPath();
      for (let i = 0; i <= 12; i++) { const k = i / 22, an = k * 4.6, rr = H * 0.06 + k * H * 0.64; i ? ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr) : ctx.moveTo(Math.cos(an) * rr, Math.sin(an) * rr); }
      ctx.stroke();
      // as estrelas velhas no braco
      for (let i = 0; i < 6; i++) {
        const k = 0.25 + a.rnd(b * 31 + i) * 0.7, an = k * 4.6 + (a.rnd(i * 7.7) - 0.5) * 0.3, rr = H * 0.06 + k * H * 0.64;
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(Math.cos(an) * rr, Math.sin(an) * rr, lw * (0.6 + a.rnd(i * 5.9) * 0.6), 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
    // o miolo: novo, branco, chapado
    a.forma(ctx, a.elip(ctx, cx, cy, H * 0.11, H * 0.06), { base: '#fff3c2', sombra: u.mix(p.cor, '#fff3c2', 0.5), lw });
    a.forma(ctx, a.circ(ctx, cx, cy, H * 0.025), { base: '#ffffff', sombra: '#fff3c2', lw: lw * 0.7 });
  };

  /* 18. eraeu — "o instante tinha um nome, e o nome era o dela".
     O mesmo ponto do fragmento 11 — so que agora da para ler o que esta nele. */
  S.eraeu = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.46, lw = a.LW(H);
    ctx.fillStyle = '#0d0a12'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = u.rgba(p.cor, 0.08); ctx.beginPath(); ctx.arc(cx, cy, H * 0.46, 0, TAU); ctx.fill();
    ctx.fillStyle = u.rgba(p.cor, 0.10); ctx.beginPath(); ctx.arc(cx, cy, H * 0.30, 0, TAU); ctx.fill();
    a.cunhas(ctx, cx, cy, H * 0.16, 18, u.rgba(p.cor, 0.85), lw, { longo: 2.9, curto: 2.0, larg: 0.16, giro: 0.2 + t * 0.02 });
    a.forma(ctx, a.circ(ctx, cx, cy, H * 0.165), { base: '#ffffff', sombra: u.mix(p.cor, '#ffffff', 0.45), lw });
    palavra(ctx, cx, cy, oTexto(p, 'FAÍSCA'), p.cor, H * 0.095, 1);
  };

  /* 19. fechando — "a linha esta menor do que estava. Devagar, mas esta".
     So da para ver que diminuiu se o tamanho antigo continuar marcado. */
  S.fechando = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cy = H * 0.40, lw = a.LW(H);
    a.ceu(ctx, W, H, p.cor, p.ato, 31, [0.5, 0.40]);
    // onde a linha chegava antes: o vinco que ficou, e as setas fechando
    pontilhado(ctx, [[W * 0.08, cy], [W * 0.92, cy]], u.rgba('#ffffff', 0.4), lw * 0.6, 0);
    [-1, 1].forEach(s => {
      const x = W * (0.5 + s * 0.42);
      a.fio(ctx, [[x, cy - H * 0.04], [x, cy + H * 0.04]], '#ffffff', lw * 0.8);
      a.fio(ctx, [[x - s * H * 0.04, cy], [x - s * H * 0.10, cy]], p.cor, lw * 0.8);
      a.fio(ctx, [[x - s * H * 0.075, cy - H * 0.02], [x - s * H * 0.10, cy], [x - s * H * 0.075, cy + H * 0.02]], p.cor, lw * 0.8);
    });
    // a linha de hoje: menor
    a.horizonte(ctx, W, H, cy, '#dfe6ff', p.fecha == null ? 0.42 : p.fecha, t, 0);
    a.bola(ctx, W * 0.5, H * 0.76, H * 0.05, t, p.lavada, t * 0.2);
  };

  /* 20. queeuabri — "tudo isto cabe numa coisa que ela fez sem querer".
     Entao o quadro mostra TUDO dentro da fenda, e ela do lado de fora. */
  S.queeuabri = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.44, lw = a.LW(H);
    a.ceu(ctx, W, H, p.cor, p.ato, 37, [0.5, 0.44], { estrelas: 3 });
    const meia = W * 0.40, alt = H * 0.20;
    const lente = () => {
      ctx.beginPath(); ctx.moveTo(cx - meia, cy);
      ctx.quadraticCurveTo(cx, cy - alt, cx + meia, cy);
      ctx.quadraticCurveTo(cx, cy + alt, cx - meia, cy); ctx.closePath();
    };
    // o halo da fenda, em degraus
    ctx.strokeStyle = u.rgba('#ffffff', 0.12); ctx.lineWidth = lw * 5; ctx.lineJoin = 'round'; lente(); ctx.stroke();
    // dentro da fenda: o universo inteiro
    ctx.save(); lente(); ctx.clip();
    ctx.fillStyle = '#070a1c'; ctx.fillRect(cx - meia, cy - alt, meia * 2, alt * 2);
    for (let i = 0; i < 40; i++) {
      const x = cx - meia + a.rnd(i * 4.3) * meia * 2, y = cy - alt + a.rnd(i * 8.7) * alt * 2;
      a.estrela(ctx, x, y, H * (0.005 + a.rnd(i * 3.1) * 0.008), a.rnd(i * 2.1) > 0.7 ? '#ffffff' : p.cor, 0.8);
    }
    miniGalaxia(ctx, cx - meia * 0.42, cy - alt * 0.18, H * 0.115, '#9be7ff', t * 0.05, lw * 0.7);
    miniGalaxia(ctx, cx + meia * 0.40, cy + alt * 0.20, H * 0.085, '#ff9f43', -t * 0.04 + 1.2, lw * 0.6);
    miniGalaxia(ctx, cx + meia * 0.02, cy - alt * 0.44, H * 0.06, '#c9b4ff', t * 0.03 + 2.4, lw * 0.5);
    ctx.restore();
    // a borda da fenda: branca, com contorno
    ctx.strokeStyle = a.ESC; ctx.lineWidth = lw * 2.6; lente(); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = lw * 1.3; lente(); ctx.stroke();
    // ela, do lado de fora, pequena: foi sem querer
    a.bola(ctx, W * 0.5, H * 0.80, H * 0.048, t, p.lavada, t * 0.2);
  };

  /* 21. ninho — "ha um lugar onde nada pode dar errado. Ela ficou mais do que
     precisava". Um casulo fechado por todos os lados, e ela parada dentro. */
  S.ninho = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.48, lw = a.LW(H);
    a.ceu(ctx, W, H, p.cor, p.ato, 61, [0.5, 0.48], { estrelas: 3 });
    // o casulo: aros fechados, um dentro do outro, em dois tons alternados
    for (let i = 4; i >= 0; i--) {
      const rr = H * (0.13 + i * 0.062);
      a.forma(ctx, a.elip(ctx, cx, cy, rr * 0.92, rr, Math.sin(i * 1.3) * 0.12),
        { base: u.mix(p.cor, a.tomAto(p.ato), i % 2 ? 0.82 : 0.72), sombra: u.mix(p.cor, a.ESC, 0.9), luz: u.rgba(p.cor, 0.5), lw: lw * 0.9 });
    }
    // as marcas do tempo parado: uma risca para cada volta que ela nao deu
    for (let i = 0; i < 11; i++) {
      const x = W * 0.35 + i * W * 0.03;
      a.fio(ctx, [[x, H * 0.85], [x, H * 0.885]], '#ffffff', lw * 0.6);
    }
    // ela, parada: nenhum rastro, nenhum giro
    a.bola(ctx, cx, cy, H * 0.085, t, p.lavada, 0);
  };

  /* ================= ATO III — ESCOLHER ================= */

  /* 22. asmarcas — "Casco leu os aneis em voz alta: nao eram obstaculos, eram
     recados". Varios aneis em fila, cada um com a sua marca: uma frase. */
  S.asmarcas = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cy = H * 0.46, n = 5, lw = a.LW(H);
    a.ceu(ctx, W, H, p.cor, p.ato, 29, [0.5, 0.46]);
    // o dedo do Casco passando: vai e volta, e acende por perto em vez de
    // ligar e desligar — assim nada pisca no fim da fila
    const onde = (n - 1) * (0.5 - 0.5 * Math.cos(t * 0.30));
    for (let i = 0; i < n; i++) {
      const x = W * (0.16 + (i / (n - 1)) * 0.68), R = H * 0.15;
      const lido = Math.max(0, 1 - Math.abs(i - onde) * 0.75);
      aro(ctx, x, cy, R * 0.42, R, u.mix(p.cor, '#ffffff', lido * 0.5), 1, lw * 0.75);
      // a marca de cada anel: todas diferentes, todas no mesmo lugar
      const ax = x - R * 0.36, ay = cy - R * 0.3;
      a.fio(ctx, [[ax, ay], [ax + R * (0.2 + a.rnd(i * 3.7) * 0.25), ay + R * (0.2 + a.rnd(i * 5.1) * 0.25)], [ax + R * 0.58, ay + R * (0.42 + a.rnd(i * 2.3) * 0.36)]],
        u.mix('#fff3c2', p.cor, 0.5 - lido * 0.5), lw * 0.9);
    }
    // a linha de leitura: e uma frase, da esquerda para a direita
    pontilhado(ctx, [[W * 0.1, H * 0.70], [W * 0.9, H * 0.70]], u.rgba('#ffffff', 0.4), lw * 0.6, 0);
    a.fio(ctx, [[W * 0.1 + (W * 0.8) * (onde / (n - 1)), H * 0.68], [W * 0.1 + (W * 0.8) * (onde / (n - 1)), H * 0.72]], '#fff3c2', lw);
  };

  /* 23. letradele — "firme e funda. Quem fez, fez com forca".
     Um anel so, de perto, e um traco curto que afunda. */
  S.letradele = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.46, cy = H * 0.48, R = H * 0.33, lw = a.LW(H);
    a.ceu(ctx, W, H, p.cor, p.ato, 17, [0.46, 0.48]);
    aro(ctx, cx, cy, R * 0.44, R, p.cor, 1, lw * 1.2);
    // o traco: curto, grosso, com a pressao aparecendo em volta (uma faixa chapada)
    const ax = cx - R * 0.30, ay = cy - R * 0.22, bx = cx + R * 0.16, by = cy + R * 0.30;
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = u.rgba('#ffffff', 0.12); ctx.lineWidth = R * 0.30;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    ctx.restore();
    a.fio(ctx, [[ax, ay], [bx, by]], '#ffffff', lw * 2.6, { luz: '#7ba4d6' });
    // o fundo do risco: a sombra que a forca deixou, deslocada para baixo/direita
    a.fio(ctx, [[ax + lw * 1.2, ay + lw * 1.2], [bx + lw * 1.2, by + lw * 1.2]], u.rgba(a.ESC, 0.5), lw * 1.2, { contorno: false });
    a.forma(ctx, a.circ(ctx, bx, by, lw * 1.9), { base: '#ffffff', sombra: '#7ba4d6', lw: lw * 0.7 });
  };

  /* 24. letradela — "leve e nao termina. Como quem escreve com pressa para nao
     esquecer". O mesmo anel, e um traco que se desfaz sem acabar. */
  S.letradela = (ctx, W, H, p, t) => {
    const a = A(), cx = W * 0.54, cy = H * 0.48, R = H * 0.33, lw = a.LW(H);
    a.ceu(ctx, W, H, p.cor, p.ato, 19, [0.54, 0.48]);
    aro(ctx, cx, cy, R * 0.44, R, p.cor, 1, lw * 1.2);
    // o traco: longo, fino, e afinando no fim — nunca termina
    const pts = [];
    for (let i = 0; i <= 30; i++) {
      const k = i / 30;
      pts.push([cx - R * 0.30 + k * R * 0.66 + Math.sin(k * 5.2) * R * 0.06, cy - R * 0.38 + k * R * 0.82 - Math.sin(k * 3.1) * R * 0.05]);
    }
    a.fio(ctx, pts, '#e8dcff', lw * 1.5, { afina: 0.92, luz: '#ffffff' });
    a.forma(ctx, a.circ(ctx, pts[1][0], pts[1][1], lw * 1.4), { base: '#ffffff', sombra: '#c9b4ff', lw: lw * 0.6 });
  };

  /* 25. juntosant — "eles eram UM. O escuro morno de antes de haver espaco".
     Nao sao dois encostados: e um corpo so. E nao ha estrela nenhuma ainda. */
  S.juntosant = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.48, R = H * 0.28, lw = a.LW(H);
    escuroMorno(ctx, W, H, p.cor);
    a.discoLuz(ctx, cx, cy, R * 2.2, u.mix(p.cor, '#ffd9c0', 0.4), 0.5);
    // o corpo unico: metade acesa por dentro, metade acesa na beirada
    const seam = () => {
      ctx.beginPath(); ctx.moveTo(cx + R * 0.02, cy - R * 1.05);
      ctx.bezierCurveTo(cx + R * 0.7, cy - R * 0.4, cx - R * 0.5, cy + R * 0.3, cx + R * 0.1, cy + R * 1.05);
    };
    a.forma(ctx, a.circ(ctx, cx, cy, R), { base: '#ffffff', sombra: '#b9d3f2', lw });
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R - lw * 0.5, 0, TAU); ctx.clip();
    seam(); ctx.lineTo(cx + R * 1.2, cy + R * 1.2); ctx.lineTo(cx + R * 1.2, cy - R * 1.2); ctx.closePath();
    ctx.fillStyle = '#150e2a'; ctx.fill();
    // a sombra dela e a luz de beirada dela: o oposto dele
    ctx.fillStyle = '#07050f'; ctx.beginPath(); ctx.arc(cx + R * 0.15, cy + R * 0.15, R, 0, TAU);
    ctx.arc(cx, cy, R * 0.86, 0, TAU, true); ctx.fill();
    ctx.strokeStyle = '#c9b4ff'; ctx.lineWidth = lw * 1.1; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, R - lw * 0.9, -1.2, 1.5); ctx.stroke();
    ctx.restore();
    // a costura entre as duas naturezas: uma onda, nao uma reta. Recortada no
    // circulo, senao as pontas do traco viram dois nos fora dele.
    ctx.save(); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, R - lw * 0.5, 0, TAU); ctx.clip();
    ctx.strokeStyle = a.ESC; ctx.lineWidth = lw * 1.2; seam(); ctx.stroke();
    ctx.strokeStyle = '#ffd9c0'; ctx.lineWidth = lw * 0.5; seam(); ctx.stroke();
    ctx.restore();
    a.forma(ctx, a.circ(ctx, cx, cy, R), { base: 'rgba(0,0,0,0)', lw });
  };

  /* 26. paraeu — "um nao vira dois sozinho. Alguem tem que querer".
     A separacao acontecendo, e a faisca nascendo no meio da fenda. */
  S.paraeu = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cy = H * 0.44, R = H * 0.18, lw = a.LW(H);
    const afast = p.afast == null ? 0.17 : p.afast;
    escuroMorno(ctx, W, H, p.cor);
    const px = W * (0.5 - afast), mx = W * (0.5 + afast);
    // os dois lados, ainda com a forma de quem foi um so
    a.forma(ctx, a.circ(ctx, px, cy, R), { base: '#ffffff', sombra: '#b9d3f2', lw });
    a.forma(ctx, a.circ(ctx, mx, cy, R), { base: '#150e2a', sombra: '#07050f', luz: '#c9b4ff', lw });
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = '#c9b4ff'; ctx.lineWidth = lw * 1.1;
    ctx.beginPath(); ctx.arc(mx, cy, R - lw * 0.9, -2.7, -0.9); ctx.stroke();
    // os fios que ainda ligam os dois: o que se rasgou
    for (let i = 0; i < 5; i++) {
      const y = cy + (i - 2) * R * 0.30, f = 1 - Math.abs(i - 2) * 0.22;
      const pts = [];
      for (let k = 0; k <= 8; k++) { const q = k / 8; pts.push([px + R * 0.9 + q * (mx - px - R * 1.8), y + Math.sin(q * Math.PI) * Math.sin(i * 1.7 + t * 0.4) * R * 0.12]); }
      a.fio(ctx, pts, u.rgba('#ffd9c0', f), lw * 0.9 * f);
    }
    ctx.restore();
    // ela: nasce no meio, e e por isso que ha um meio
    a.discoLuz(ctx, W * 0.5, cy, R * 1.6, '#fff3c2', 0.9);
    a.bola(ctx, W * 0.5, cy, R * 0.42, t, Math.min(1, (p.lavada || 0) + 0.15), t * 0.4);
  };

  /* 27. opreco — "se os dois se encostarem de novo, o espaco fecha. E tudo que
     esta dentro fecha junto". O que esta dentro precisa aparecer. */
  S.opreco = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cy = H * 0.46, lw = a.LW(H);
    // as duas luzes tem coroa e halo: o raio e o afastamento saem da largura,
    // senao a coroa do pai sai pela beirada num quadro estreito
    const R = Math.min(H * 0.13, W * 0.105);
    const afastPx = Math.min((p.afast == null ? 0.26 : p.afast) * W, W * 0.5 - R * 2.0);
    a.ceu(ctx, W, H, p.cor, p.ato, 71, [0.5, 0.46], { estrelas: 4 });
    const px = W * 0.5 - afastPx, mx = W * 0.5 + afastPx;
    // a fresta comeca onde a coroa do pai acaba: e ela que tem de ser lida
    const meia = afastPx - R * 1.72, cxm = W * 0.5;
    // a fresta, e o universo apertado dentro dela
    if (meia > 4) {
      const fresta = () => {
        ctx.beginPath(); ctx.moveTo(cxm - meia, cy);
        ctx.quadraticCurveTo(cxm, cy - H * 0.20, cxm + meia, cy);
        ctx.quadraticCurveTo(cxm, cy + H * 0.20, cxm - meia, cy); ctx.closePath();
      };
      ctx.save(); fresta(); ctx.clip();
      ctx.fillStyle = '#070a1c'; ctx.fillRect(cxm - meia, cy - H * 0.2, meia * 2, H * 0.4);
      for (let i = 0; i < 22; i++) {
        const x = cxm - meia + a.rnd(i * 4.3) * meia * 2, y = cy - H * 0.2 + a.rnd(i * 8.7) * H * 0.4;
        a.estrela(ctx, x, y, H * (0.005 + a.rnd(i * 3.1) * 0.007), a.rnd(i * 2.1) > 0.7 ? '#ffffff' : '#9be7ff', 0.8);
      }
      miniGalaxia(ctx, cxm, cy, Math.min(meia * 0.9, H * 0.10), '#9be7ff', t * 0.05, lw * 0.6);
      ctx.restore();
      ctx.save(); ctx.lineJoin = 'round';
      ctx.strokeStyle = a.ESC; ctx.lineWidth = lw * 2.4; fresta(); ctx.stroke();
      ctx.strokeStyle = '#ff8fa8'; ctx.lineWidth = lw * 1.1; fresta(); ctx.stroke();
      ctx.restore();
    }
    a.pai(ctx, px, cy, R, t, 1);
    a.mae(ctx, mx, cy, R, t, 1);
    // as setas de quem esta vindo: o preco e isso acontecer
    [-1, 1].forEach(s => {
      const x = W * 0.5 + s * Math.min(afastPx + R * 1.3, W * 0.42), y = H * 0.76;
      a.fio(ctx, [[x, y], [x - s * H * 0.08, y]], '#ff8fa8', lw * 0.8);
      a.fio(ctx, [[x - s * H * 0.05, y - H * 0.022], [x - s * H * 0.08, y], [x - s * H * 0.05, y + H * 0.022]], '#ff8fa8', lw * 0.8);
    });
  };

  /* 28. muitasmaos — "ela nao veio sozinha. Nunca tinha reparado nisso". */
  S.muitasmaos = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.48, R = H * 0.30, lw = a.LW(H), n = 22;
    a.ceu(ctx, W, H, p.cor, p.ato, 83, [0.5, 0.5]);
    // o fio de cada um ate ela: e isso que ela nunca tinha reparado
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * TAU + t * 0.05;
      ctx.strokeStyle = u.rgba(p.cor, 0.25); ctx.lineWidth = lw * 0.5;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R * 0.92); ctx.lineTo(cx, cy + H * 0.06); ctx.stroke();
    }
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * TAU + t * 0.05;
      const x = cx + Math.cos(ang) * R, y = cy + Math.sin(ang) * R * 0.92;
      const rr = H * (0.020 + a.rnd(i * 2.3) * 0.014);
      a.forma(ctx, a.circ(ctx, x, y, rr), { base: '#ffffff', sombra: u.mix(p.cor, '#ffffff', 0.3), lw: lw * 0.8 });
    }
    a.bola(ctx, cx, cy + H * 0.06, H * 0.075, t, p.lavada, t * 0.2);
  };

  /* 29. costura — "ha um fio atravessando tudo. Da para segui-lo sem soltar". */
  S.costura = (ctx, W, H, p, t) => {
    const a = A(), u = U(), lw = a.LW(H);
    a.ceu(ctx, W, H, p.cor, p.ato, 89, [0.5, 0.5]);
    const ponto = k => [k * W, H * 0.5 + Math.sin(k * 5 + t * 0.5) * H * 0.22 * Math.sin(k * Math.PI)];
    const pts = []; for (let i = 0; i <= 40; i++) pts.push(ponto(i / 40));
    a.fio(ctx, pts, p.cor, lw * 1.4, { luz: '#ffffff' });
    // os pontos da costura: o fio passa POR dentro das coisas
    for (let i = 1; i < 6; i++) {
      const q = ponto(i / 6);
      a.forma(ctx, a.circ(ctx, q[0], q[1], H * 0.035), { base: 'rgba(0,0,0,0)', contorno: u.rgba('#ffffff', 0.6), lw: lw * 0.6 });
    }
    // vai e volta pelo fio: da para segui-lo sem soltar, e sem salto no fim
    const q = ponto(0.5 - 0.5 * Math.cos(t * 0.22));
    a.bola(ctx, q[0], q[1], H * 0.045, t, p.lavada, t * 0.3);
  };

  /* 30. aporta — "o fim do caminho e uma porta. Do outro lado, duas luzes paradas". */
  S.aporta = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.46, R = H * 0.27, lw = a.LW(H);
    a.ceu(ctx, W, H, p.cor, p.ato, 73, [0.5, 0.46]);
    // a porta: um arco chapado com contorno grosso; dentro, outro ceu
    const porta = () => { ctx.beginPath(); ctx.moveTo(cx - R, cy + R * 1.1); ctx.lineTo(cx - R, cy); ctx.arc(cx, cy, R, Math.PI, 0); ctx.lineTo(cx + R, cy + R * 1.1); ctx.closePath(); };
    ctx.strokeStyle = u.rgba(p.cor, 0.18); ctx.lineWidth = lw * 6; ctx.lineJoin = 'round'; porta(); ctx.stroke();
    ctx.save(); porta(); ctx.clip();
    ctx.fillStyle = '#100c22'; ctx.fillRect(cx - R, cy - R, R * 2, R * 2.2);
    ctx.fillStyle = u.rgba('#3a2a70', 0.5); ctx.beginPath(); ctx.arc(cx, cy, R * 0.8, 0, TAU); ctx.fill();
    a.pai(ctx, cx - R * 0.42, cy + R * 0.05, R * 0.26, 0, 1);
    a.mae(ctx, cx + R * 0.42, cy + R * 0.05, R * 0.26, 0, 1);
    ctx.restore();
    ctx.strokeStyle = a.ESC; ctx.lineWidth = lw * 3.2; porta(); ctx.stroke();
    ctx.strokeStyle = p.cor; ctx.lineWidth = lw * 1.8; porta(); ctx.stroke();
    ctx.strokeStyle = u.rgba('#ffffff', 0.8); ctx.lineWidth = lw * 0.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, R - lw * 0.5, -2.9, -1.3); ctx.stroke();
    // a soleira e o caminho que acaba aqui, e ela no fim dele
    a.fio(ctx, [[cx - R * 1.15, cy + R * 1.1], [cx + R * 1.15, cy + R * 1.1]], p.cor, lw * 0.9);
    pontilhado(ctx, [[cx, H * 0.85], [cx, cy + R * 1.16]], u.rgba('#ffffff', 0.45), lw * 0.6, t);
    a.bola(ctx, cx, H * 0.88, H * 0.042, t, p.lavada, t * 0.2);
  };

  /* ================= DEPOIS DO FIM ================= */

  /* 31. nomeinteir — "o nome e o que gira em volta de algo maior que si".
     Entao a palavra tem uma orbita, e ela e que esta girando. */
  S.nomeinteir = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.48, lw = a.LW(H);
    a.ceu(ctx, W, H, p.cor, p.ato, 101, [0.5, 0.48]);
    ctx.fillStyle = u.rgba(p.cor, 0.10); ctx.beginPath(); ctx.ellipse(cx, cy, W * 0.36, H * 0.20, 0, 0, TAU); ctx.fill();
    // a orbita em volta da palavra
    [[0.40, 1.0], [0.46, 0.6]].forEach(c => {
      ctx.strokeStyle = a.ESC; ctx.lineWidth = lw * 1.6 * c[1];
      ctx.beginPath(); ctx.ellipse(cx, cy, W * c[0], H * c[0] * 0.52, -0.16, 0, TAU); ctx.stroke();
      ctx.strokeStyle = p.cor; ctx.lineWidth = lw * 0.8 * c[1];
      ctx.beginPath(); ctx.ellipse(cx, cy, W * c[0], H * c[0] * 0.52, -0.16, 0, TAU); ctx.stroke();
    });
    palavra(ctx, cx, cy, oTexto(p, 'ORBO'), p.cor, H * 0.20, 1);
    // ela, girando em volta do proprio nome
    const ang = t * 0.35;
    const ox = cx + Math.cos(ang) * W * 0.40, oy = cy + Math.sin(ang) * H * 0.208;
    a.bola(ctx, ox, oy, H * 0.05, t, 0, ang);
  };

  /* 32. oqueficou — "ela voltou com cor. Foi preciso ir duas vezes para ver as
     duas metades". Dois caminhos, vindos de lados opostos, no mesmo ponto. */
  S.oqueficou = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.46, r = H * 0.115, lw = a.LW(H);
    a.ceu(ctx, W, H, p.cor, p.ato, 103, [0.5, 0.46]);
    // os dois caminhos: um claro pela esquerda, um escuro pela direita
    [[-1, '#f2f6ff'], [1, '#b79bff']].forEach(c => {
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const k = i / 24;
        pts.push([cx + c[0] * (r * 1.5 + k * W * 0.40), cy + Math.sin(k * 2.6) * H * 0.13 * c[0] + k * H * 0.05]);
      }
      a.fio(ctx, pts, c[1], lw * 1.3, { afina: 0.8 });
    });
    a.discoLuz(ctx, cx, cy, r * 2.4, p.cor, 0.6);
    a.bola(ctx, cx, cy, r, t, 0, t * 0.3);
    // as duas metades, marcadas em volta
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = a.ESC; ctx.lineWidth = lw * 1.8;
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.4, -2.6, -0.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.4, 0.5, 2.6); ctx.stroke();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = lw * 0.8;
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.4, -2.6, -0.5); ctx.stroke();
    ctx.strokeStyle = '#b79bff';
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.4, 0.5, 2.6); ctx.stroke();
    ctx.restore();
  };

  /* 33. todasmaos — "os quatro caminhos levam ao mesmo lugar. A diferenca e
     quem chega junto". Quatro entradas, um ponto, e as maos em volta. */
  S.todasmaos = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.47, lw = a.LW(H);
    a.ceu(ctx, W, H, '#ffcf4a', p.ato, 107, [0.5, 0.47]);
    // os quatro caminhos, de quatro cantos, chegando no mesmo ponto
    const cantos = [[-1, -1, '#9be7ff'], [1, -1, '#ffd93d'], [-1, 1, '#7cff6b'], [1, 1, '#ff7ad9']];
    cantos.forEach((c, i) => {
      const pts = [];
      for (let k = 0; k <= 16; k++) {
        const q = k / 16;
        pts.push([cx + c[0] * (1 - q) * W * 0.42 + Math.sin(q * 3 + i) * W * 0.02, cy + c[1] * (1 - q) * H * 0.33]);
      }
      a.fio(ctx, pts.reverse(), c[2], lw * 1.3, { afina: 0.8 });
    });
    // as maos em volta: quem chega junto
    const n = 16;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * TAU + t * 0.04;
      const x = cx + Math.cos(ang) * H * 0.32, y = cy + Math.sin(ang) * H * 0.30;
      const rr = H * (0.017 + a.rnd(i * 2.3) * 0.012);
      a.forma(ctx, a.circ(ctx, x, y, rr), { base: '#ffffff', sombra: u.mix(cantos[i % 4][2], '#ffffff', 0.3), lw: lw * 0.7 });
    }
    a.discoLuz(ctx, cx, cy, H * 0.16, '#ffffff', 0.9);
    a.bola(ctx, cx, cy, H * 0.07, t, 0, t * 0.2);
  };

  HR.FragScenes = S;
  HR.FRAG_ARRANJOS = Object.keys(S);
})();
