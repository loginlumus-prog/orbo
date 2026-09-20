/* =====================================================================
   ORBO v7 — Os arranjos dos cards.

   Quinze composicoes feitas com os cinco elementos de js/render-frag.js.
   Cada um dos 33 fragmentos escolhe um arranjo e ajusta os parametros, entao
   todos sao diferentes e todos sao da mesma familia.

   Regras de composicao, iguais em todos:
   - a luz vem de cima e da esquerda;
   - o assunto fica na faixa de ouro (38% ou 62% da altura), nunca no meio exato,
     salvo quando a simetria E o assunto;
   - sobra e parte do desenho: nada encosta na moldura.

   API: HR.FragScenes[arranjo](ctx, W, H, p, t)
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const TAU = Math.PI * 2;
  const A = () => HR.FragArt;
  const U = () => HR.U;

  const S = {};

  /* 1. sozinha — a bola no vazio, com um unico rastro de giro */
  S.sozinha = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.52, r = H * 0.115;
    a.fundo(ctx, W, H, p.cor, 3, 0.85);
    // horizonte insinuado bem embaixo: da chao ao quadro sem competir
    const ch = ctx.createLinearGradient(0, H * 0.78, 0, H);
    ch.addColorStop(0, u.rgba(p.cor, 0)); ch.addColorStop(1, u.rgba(p.cor, 0.13));
    ctx.fillStyle = ch; ctx.fillRect(0, H * 0.78, W, H * 0.22);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // tres orbitas em profundidade, da mais longe para a mais perto
    [[3.6, 0.6, 0.07], [2.5, 0.85, 0.13], [1.7, 1.0, 0.2]].forEach((o, i) => {
      ctx.strokeStyle = u.rgba(i === 2 ? '#ffffff' : p.cor, o[2]);
      ctx.lineWidth = 0.9 + i * 0.5;
      ctx.beginPath(); ctx.ellipse(cx, cy, r * o[0], r * o[0] * 0.3 * o[1], -0.22 + i * 0.06, 0, TAU); ctx.stroke();
    });
    ctx.restore();
    a.bola(ctx, cx, cy, r, t, p.lavada, t * 0.25);
  };

  /* 2. vazio — a bola, e ao lado um lugar com formato de alguem */
  S.vazio = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cy = H * 0.54, r = H * 0.105, vx = W * 0.64, bx = W * 0.36;
    a.fundo(ctx, W, H, p.cor, 11, 0.8);
    // o vazio: um buraco na poeira, com um halo de ausencia em volta
    const oco = ctx.createRadialGradient(vx, cy, r * 0.2, vx, cy, r * 2.4);
    oco.addColorStop(0, 'rgba(0,0,0,0.85)');
    oco.addColorStop(0.45, 'rgba(0,0,0,0.45)');
    oco.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = oco; ctx.beginPath(); ctx.arc(vx, cy, r * 2.4, 0, TAU); ctx.fill();
    ctx.save();
    ctx.setLineDash([3, 11]); ctx.lineDashOffset = -t * 10;
    ctx.strokeStyle = u.rgba('#ffffff', 0.26); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(vx, cy, r * 1.1, 0, TAU); ctx.stroke();
    ctx.restore();
    // o fio que liga os dois lugares, quase apagado
    ctx.strokeStyle = u.rgba(p.cor, 0.18); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(bx + r * 1.3, cy); ctx.lineTo(vx - r * 1.3, cy); ctx.stroke();
    a.bola(ctx, bx, cy, r, t, p.lavada, -t * 0.2);
  };

  /* 3. queda — a bola embaixo, e o escuro fazendo concha */
  S.queda = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cy = H * 0.66, r = H * 0.10;
    a.fundo(ctx, W, H, p.cor, 21, 0.7);
    const topo = H * 0.68 + Math.sin(t * 0.6) * 5;
    const g = ctx.createLinearGradient(0, topo - 40, 0, H);
    g.addColorStop(0, u.rgba(p.cor, 0));
    g.addColorStop(0.35, u.rgba(p.cor, 0.07));
    g.addColorStop(1, u.rgba(p.cor, 0.14));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, H); ctx.lineTo(0, H * 0.94);
    ctx.quadraticCurveTo(W * 0.5, topo, W, H * 0.94);
    ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.lineCap = 'round';
    a.bloom(ctx, p.cor, [[1.3, 0.55], [4, 0.16], [12, 0.06]], () => {
      ctx.beginPath(); ctx.moveTo(0, H * 0.94);
      ctx.quadraticCurveTo(W * 0.5, topo, W, H * 0.94); ctx.stroke();
    });
    ctx.restore();
    a.bola(ctx, W * 0.5, cy, r, t, p.lavada, t * 0.15);
  };

  /* 4. reflexo — ela se ve, e nao tem cor */
  S.reflexo = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cy = H * 0.40, r = H * 0.10;
    a.fundo(ctx, W, H, p.cor, 33, 0.6);
    const esp = ctx.createLinearGradient(0, H * 0.58, 0, H);
    esp.addColorStop(0, u.rgba(p.cor, 0.14));
    esp.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = esp; ctx.fillRect(0, H * 0.58, W, H * 0.42);
    ctx.strokeStyle = u.rgba('#ffffff', 0.14); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W * 0.1, H * 0.58); ctx.lineTo(W * 0.9, H * 0.58); ctx.stroke();
    ctx.save();
    ctx.globalAlpha = 0.34;
    ctx.translate(0, H * 1.16); ctx.scale(1, -1);
    a.bola(ctx, W * 0.5, cy, r, t, Math.min(1, (p.lavada || 0) + 0.25), 0);
    ctx.restore();
    a.bola(ctx, W * 0.5, cy, r, t, p.lavada, 0);
  };

  /* 5. duas — o pai e a mae, afastados, com o rasgo entre eles */
  S.duas = (ctx, W, H, p, t) => {
    const a = A(), cy = H * 0.48, r = H * 0.13;
    const afast = p.afast == null ? 0.22 : p.afast;
    a.fundo(ctx, W, H, p.cor, 41, 0.75);
    a.horizonte(ctx, W, H, cy, p.cor, p.fecha || 0, t, 0);
    a.pai(ctx, W * (0.5 - afast), cy, r, t, 1);
    a.mae(ctx, W * (0.5 + afast), cy, r, t, 1);
  };

  /* 6. juntos — antes: os dois encostados, quase um so */
  S.juntos = (ctx, W, H, p, t) => {
    const a = A(), cy = H * 0.5, r = H * 0.135;
    a.fundo(ctx, W, H, p.cor, 47, 0.5);
    const d = r * (0.62 + Math.sin(t * 0.35) * 0.04);
    a.mae(ctx, W * 0.5 + d, cy, r, t, 1);
    a.pai(ctx, W * 0.5 - d, cy, r, t, 1);
    a.discoLuz(ctx, W * 0.5, cy, r * 1.5, '#ffffff', 0.5);
  };

  /* 7. rasgo — a linha no ceu, e ela pequena embaixo, olhando */
  S.rasgo = (ctx, W, H, p, t) => {
    const a = A(), r = H * 0.055;
    a.fundo(ctx, W, H, p.cor, 53, 0.9);
    a.horizonte(ctx, W, H, H * 0.32, '#dfe6ff', p.fecha || 0, t, p.curva || 0);
    a.bola(ctx, W * 0.5, H * 0.74, r, t, p.lavada, t * 0.2);
    ctx.strokeStyle = U().rgba('#ffffff', 0.10); ctx.lineWidth = 1;
    ctx.setLineDash([3, 10]);
    ctx.beginPath(); ctx.moveTo(W * 0.5, H * 0.74 - r * 1.6); ctx.lineTo(W * 0.5, H * 0.36); ctx.stroke();
    ctx.setLineDash([]);
  };

  /* 8. anel — o arranhao sendo escrito agora */
  S.anel = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.52, cy = H * 0.5, R = H * 0.34;
    a.fundo(ctx, W, H, p.cor, 59, 0.55);
    // um anel atras, longe e fora de foco: e o que cria profundidade
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = u.rgba(p.cor, 0.10); ctx.lineWidth = 10;
    ctx.beginPath(); ctx.ellipse(W * 0.22, cy - H * 0.06, R * 0.34, R * 0.8, -0.1, 0, TAU); ctx.stroke();
    ctx.restore();
    // o anel da frente, com espessura de verdade: parede interna e externa
    ctx.save(); ctx.lineCap = 'round';
    const elipse = (kx, ky) => { ctx.beginPath(); ctx.ellipse(cx, cy, R * kx, R * ky, 0, 0, TAU); };
    a.bloom(ctx, p.cor, [[3, 0.85], [9, 0.22], [26, 0.09]], () => { elipse(0.44, 1); ctx.stroke(); });
    // parede: degrade atravessando o anel, claro em cima a esquerda
    const par = ctx.createLinearGradient(cx - R * 0.44, cy - R, cx + R * 0.44, cy + R);
    par.addColorStop(0, u.rgba('#ffffff', 0.85));
    par.addColorStop(0.45, u.rgba(p.cor, 0.75));
    par.addColorStop(1, u.rgba(u.mix(p.cor, '#000000', 0.5), 0.8));
    ctx.strokeStyle = par; ctx.lineWidth = 5; elipse(0.44, 1); ctx.stroke();
    ctx.strokeStyle = u.rgba('#ffffff', 0.55); ctx.lineWidth = 1; elipse(0.40, 0.955); ctx.stroke();
    ctx.restore();
    // o arranhao, grande e legivel, com a ponta acesa como se escrevesse agora
    const k = p.fixo ? 1 : Math.min(1, (t * 0.32) % 1.7);
    const ax = cx - R * 0.42, ay = cy - R * 0.30;
    ctx.save(); ctx.lineCap = 'round';
    a.bloom(ctx, '#fff3c2', [[3.2, 0.95], [8, 0.3], [20, 0.1]], () => {
      ctx.beginPath(); ctx.moveTo(ax, ay);
      ctx.quadraticCurveTo(ax + R * 0.30 * k, ay + R * 0.22 * k, ax + R * 0.52 * k, ay + R * 0.62 * k);
      ctx.stroke();
    });
    a.discoLuz(ctx, ax + R * 0.52 * k, ay + R * 0.62 * k, 16, '#fff3c2', 1);
    ctx.restore();
  };

  /* 9. galaxia — a espiral girando devagar */
  S.galaxia = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.5;
    a.fundo(ctx, W, H, p.cor, 67, 0.5);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.translate(cx, cy); ctx.rotate(t * 0.06 * (p.sentido || 1)); ctx.scale(1, 0.40);
    const nb = p.bracos || 2;
    // halo do disco, por tras de tudo
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
    // faixa de poeira atravessando, que e o que faz parecer uma galaxia de verdade
    ctx.save();
    ctx.translate(cx, cy); ctx.rotate(t * 0.06 * (p.sentido || 1) + 0.35);
    const po = ctx.createLinearGradient(-H * 0.7, 0, H * 0.7, 0);
    po.addColorStop(0, 'rgba(0,0,0,0)'); po.addColorStop(0.5, 'rgba(0,0,0,0.5)'); po.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = po; ctx.fillRect(-H * 0.7, -H * 0.035, H * 1.4, H * 0.07);
    ctx.restore();
    a.discoLuz(ctx, cx, cy, H * 0.22, '#fff3c2', 1);
    a.discoLuz(ctx, cx, cy, H * 0.07, '#ffffff', 1);
  };

  /* 10. porta — o circulo abrindo, e as duas luzes paradas atras */
  S.porta = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.5, R = H * 0.28;
    a.fundo(ctx, W, H, p.cor, 71, 0.6);
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.clip();
    const dentro = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    dentro.addColorStop(0, u.rgba('#1a1736', 1));
    dentro.addColorStop(1, u.rgba('#05030c', 1));
    ctx.fillStyle = dentro; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    a.pai(ctx, cx - R * 0.42, cy, R * 0.3, t, 0.9);
    a.mae(ctx, cx + R * 0.42, cy, R * 0.3, t, 0.9);
    ctx.restore();
    ctx.lineCap = 'round';
    a.bloom(ctx, p.cor, [[2.4, 0.9], [7, 0.25], [18, 0.1]], () => {
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
    });
    ctx.strokeStyle = u.rgba('#ffffff', 0.55); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
  };

  /* 11. ponto — um ponto azul, pequeno, no escuro grande */
  S.ponto = (ctx, W, H, p, t) => {
    const a = A(), u = U();
    a.fundo(ctx, W, H, '#20304f', 79, 1.1);
    // feixe de luz atravessando, como numa foto de sonda
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(W * 0.2, 0, W * 0.9, H);
    g.addColorStop(0, u.rgba('#ffd9a0', 0));
    g.addColorStop(0.5, u.rgba('#ffd9a0', 0.10));
    g.addColorStop(1, u.rgba('#ffd9a0', 0));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.restore();
    const px = W * 0.62, py = H * 0.44;
    a.discoLuz(ctx, px, py, H * 0.11, '#8fd0ff', 0.9);
    // reflexo de lente: quatro pontas finas, o que da a sensacao de foto real
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    [[1, 0], [0, 1]].forEach(d => {
      const g2 = ctx.createLinearGradient(px - d[0] * 60, py - d[1] * 60, px + d[0] * 60, py + d[1] * 60);
      g2.addColorStop(0, u.rgba('#8fd0ff', 0)); g2.addColorStop(0.5, u.rgba('#cfeaff', 0.5)); g2.addColorStop(1, u.rgba('#8fd0ff', 0));
      ctx.strokeStyle = g2; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.moveTo(px - d[0] * 60, py - d[1] * 60); ctx.lineTo(px + d[0] * 60, py + d[1] * 60); ctx.stroke();
    });
    ctx.restore();
    ctx.fillStyle = '#9fd8ff';
    ctx.beginPath(); ctx.arc(px, py, 3.4, 0, TAU); ctx.fill();
    ctx.fillStyle = u.rgba('#ffffff', 0.95);
    ctx.beginPath(); ctx.arc(px - 0.9, py - 0.9, 1.4, 0, TAU); ctx.fill();
  };

  /* 12. maos — muita gente formando um anel */
  S.maos = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.5, R = H * 0.30;
    a.fundo(ctx, W, H, p.cor, 83, 0.6);
    const n = 22;
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * TAU + t * 0.05;
      const x = cx + Math.cos(ang) * R, y = cy + Math.sin(ang) * R * 0.92;
      const rr = H * (0.022 + a.rnd(i * 2.3) * 0.016);
      a.discoLuz(ctx, x, y, rr * 2.6, p.cor, 0.5);
      const g = ctx.createRadialGradient(x - rr * 0.3, y - rr * 0.3, 0, x, y, rr);
      g.addColorStop(0, u.rgba('#ffffff', 0.9));
      g.addColorStop(1, u.rgba(p.cor, 0.7));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill();
    }
    a.pai(ctx, cx - H * 0.08, cy, H * 0.062, t, 0.95);
    a.mae(ctx, cx + H * 0.08, cy, H * 0.062, t, 0.95);
    a.bola(ctx, cx, cy + H * 0.11, H * 0.05, t, 0, t * 0.2);
  };

  /* 13. fio — um unico fio atravessando o quadro */
  S.fio = (ctx, W, H, p, t) => {
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
    ctx.restore();
    const k = (t * 0.12) % 1, x = k * W;
    const y = H * 0.5 + Math.sin(k * 5 + t * 0.5) * H * 0.22 * Math.sin(k * Math.PI);
    a.bola(ctx, x, y, H * 0.045, t, p.lavada, t * 0.3);
  };

  /* 14. nome — uma palavra sendo escrita em luz */
  S.nome = (ctx, W, H, p, t) => {
    const a = A(), u = U();
    a.fundo(ctx, W, H, p.cor, 97, 0.45);
    const txt = p.palavra || 'ORBO';
    const cx = W * 0.5, cy = H * 0.5;
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '600 ' + Math.round(H * 0.20) + "px 'Fredoka', 'Rubik', sans-serif";
    // o brilho vem de copias da propria letra, ampliadas a partir do centro.
    // Nada de strokeText: traco grosso em letra com junta fechada (o R) engrossa
    // a perna e borra o desenho.
    ctx.globalCompositeOperation = 'lighter';
    [[1.055, 0.10], [1.03, 0.14], [1.014, 0.2]].forEach(e => {
      ctx.save();
      ctx.translate(cx, cy); ctx.scale(e[0], e[0]); ctx.translate(-cx, -cy);
      ctx.fillStyle = u.rgba(p.cor, e[1]);
      ctx.fillText(txt, cx, cy);
      ctx.restore();
    });
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = u.rgba('#ffffff', 0.92);
    ctx.fillText(txt, cx, cy);
    ctx.restore();
  };

  /* 15. calor — o antes: estar dentro de alguma coisa */
  S.calor = (ctx, W, H, p, t) => {
    const a = A(), u = U(), cx = W * 0.5, cy = H * 0.5;
    a.fundo(ctx, W, H, '#5a2a3a', 101, 0.35);
    for (let i = 5; i >= 1; i--) {
      const r = H * (0.12 + i * 0.075) + Math.sin(t * 0.4 + i) * 3;
      const g = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r);
      g.addColorStop(0, u.rgba('#ff9d6b', 0.05 * i));
      g.addColorStop(1, u.rgba('#ff6a4a', 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.fill();
    }
    a.discoLuz(ctx, cx, cy, H * 0.2, '#ffd0a8', 0.8);
    a.bola(ctx, cx, cy, H * 0.07, t, Math.min(1, (p.lavada || 0) + 0.3), t * 0.1);
  };

  HR.FragScenes = S;
  HR.FRAG_ARRANJOS = Object.keys(S);
})();
