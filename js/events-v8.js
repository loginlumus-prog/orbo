/* =====================================================================
   ORBO v8 — Seis eventos novos.

   Os cinco eventos antigos (asteroides, dobra, sentinela, bonanca e
   guardiao) diziam quase sempre a mesma coisa: "desvie". Faltava o
   comeco (um evento amigavel para a terceira fase da vida da pessoa),
   faltava o que premia a mira, faltava o que so muda o que se ve, e
   faltava a respirada.

   Os onze daqui, cada um com uma regra de uma frase:
     cauda     uma cauda de poeira atravessa na diagonal: moedas e pedras
     enxame    o Cardume voa ao lado; cada perfeito solta uma moeda
     linha     dois aneis ligados por um fio de moedas: na ordem vale tres
     cometa    uma esteira a frente: voar perto dela da moeda e empurrao
     mare      so se ve o que esta perto da bola e do anel; arco em dobro
     silencio  a musica para; cada arco vale o dobro de pontos
     filao     uma veia de ouro: moeda seguida sobe o multiplicador (×1..×5)
     cofre     um cofre trancado: tres travessias e ele arrebenta
     escolha   tres orbes, um so: moedas, escudo ou um poder na hora
     fenda     um rasgo jorra moedas e encolhe: cedo vale mais
     gemas     de tres a seis GEMAS num arco largo. O raro do jogo

   A regra que os une: cada um da o que PERSEGUIR ou o que DECIDIR. Nenhum
   se resolve esperando o apito — o Silencio e a Mare, que eram so clima,
   ganharam os pontos em dobro justamente por isso.

   Quatro deles (enxame, cometa, mare, silencio) sao "passivos": a
   partida continua correndo por baixo, com os aneis nascendo normal.
   Os outros tomam a tela para si, como os antigos.

   Tudo por embrulho, no padrao de js/costura-v8.js: nenhum arquivo do
   jogo e alterado.
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const G = HR.Game && HR.Game.prototype;
  if (!G || !HR.CONFIG || !HR.CONFIG.EVENTS) return;
  const U = HR.U, C = HR.CONFIG;
  const TAU = Math.PI * 2;
  // 0 = aparelho fraco: menos graos, menos luzes, menos ornamento
  const obj = () => (!HR.Perf || HR.Perf.obj);
  // setLineDash aloca um array a cada chamada: estes ficam prontos uma vez so
  const D_FIO = [7, 9], D_OFF = [];

  const NOVOS = {
    cauda:    { dur: 7, color: '#ffd9a0', icon: 'wind',     coins: 12, score: 2, every: 0.2 },
    enxame:   { dur: 8, color: '#9dff8a', icon: 'hive',     coins: 10, score: 2 },
    linha:    { dur: 0, color: '#8fe3ff', icon: 'link',     coins: 10, score: 4 },
    cometa:   { dur: 9, color: '#9be7ff', icon: 'comet',    coins: 14, score: 3 },
    mare:     { dur: 8, color: '#bfe3ff', icon: 'light',    coins: 12, score: 3 },
    silencio: { dur: 8, color: '#cfd8ff', icon: 'feather',  coins: 12, score: 3 },
    // v8.1 — os cinco de perseguir e decidir
    filao:    { dur: 9, color: '#ffcf4a', icon: 'goldrush', coins: 10, score: 4, every: 0.42, val: 1.5, maxMul: 5 },
    cofre:    { dur: 0, color: '#ffd98a', icon: 'chest',    coins: 0,  score: 6, trincas: 3, val: 3 },
    escolha:  { dur: 0, color: '#cbb6ff', icon: 'hand',     coins: 0,  score: 4, moedas: 45, escudos: 2 },
    fenda:    { dur: 8, color: '#ff7ad9', icon: 'prism',    coins: 0,  score: 5, every: 0.50, orc: 26 },
    gemas:    { dur: 6, color: '#c39bff', icon: 'gem',      coins: 0,  score: 6, min: 3, max: 6 }
  };
  const IDS = Object.keys(NOVOS);
  // os que deixam a partida correr por baixo (aneis continuam nascendo)
  const PASSIVO = { enxame: 1, cometa: 1, mare: 1, silencio: 1 };
  // os que dobram os pontos de cada arco enquanto duram: o clima passa a valer
  const DOBRO = { mare: 1, silencio: 1 };
  IDS.forEach(id => { if (!C.EVENTS[id]) C.EVENTS[id] = NOVOS[id]; });

  const meu = id => !!NOVOS[id];
  const duracao = ev => ev.dur || C.EVENTS[ev.id].dur || 1;
  // entra e sai suave: 0 nos primeiros e nos ultimos 0,7 s
  function rampa(ev) {
    const d = duracao(ev);
    return U.clamp(ev.t / 0.7, 0, 1) * U.clamp((d - ev.t) / 0.7, 0, 1);
  }
  // os de duracao aberta (Cofre, Escolha) nao tem fim conhecido: so entram
  const entra = ev => U.clamp(ev.t / 0.5, 0, 1);

  /* ---------------------------------------------------------------------
     Moedas com impulso proprio (o leque do Cofre e da Fenda).
     O motor so anda com os pickups junto com o mundo; o empurrao do leque
     vive aqui, e freia sozinho em cerca de um segundo.
     --------------------------------------------------------------------- */
  function leque(g, sdt) {
    const P = g.pickups, k = Math.pow(0.16, sdt);
    for (let i = 0; i < P.length; i++) {
      const p = P[i];
      if (!p.fvx && !p.fvy) continue;
      p.x += p.fvx * sdt; p.baseY = U.clamp(p.baseY + p.fvy * sdt, 24, g.Lv - 24);
      p.fvx *= k; p.fvy *= k;
      if (Math.abs(p.fvx) < 5 && Math.abs(p.fvy) < 5) { p.fvx = 0; p.fvy = 0; }
    }
  }
  function moeda(g, x, y, val, cor, extra) {
    const p = { x, y, baseY: y, r: 14, id: 'coins', val, color: cor || '#ffcf4a', seed: U.rand(0, 6.28), taken: false };
    if (extra) for (const k in extra) p[k] = extra[k];
    g.pickups.push(p);
    return p;
  }

  /* =====================================================================
     A musica do Silencio.
     Abaixar o ganho mestre e melhor do que HR.Music.stop(): o sequenciador
     continua andando, entao a musica volta exatamente de onde parou — e
     religar nao custa um crossfade de 1,5 s no meio da partida.
     ===================================================================== */
  let mudo = false;
  function abafa() {
    const M = HR.Music, A = HR.Audio;
    if (!M || !A || !A.ctx || !M.master) return;
    mudo = true;
    const g = M.master.gain, now = A.ctx.currentTime;
    g.cancelScheduledValues(now); g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0.0001, now + 0.7);
  }
  function devolve() {
    if (!mudo) return;
    mudo = false;
    const M = HR.Music, A = HR.Audio;
    if (!M || !A || !A.ctx || !M.master) return;
    const g = M.master.gain, now = A.ctx.currentTime;
    g.cancelScheduledValues(now); g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(1, now + 1.4);
  }

  /* =====================================================================
     1. CAUDA — a poeira na diagonal
     Os graos nascem na borda de tras, sempre na altura da faixa; a faixa
     desce do topo ao chao ao longo do evento. Como cada grao anda para a
     esquerda depois de nascer, o conjunto vira uma diagonal de verdade,
     sem precisar mover nada fora do mundo.
     ===================================================================== */
  const PEDRA_EM = [0.14, 0.32, 0.50, 0.68];
  function cauY(g, k) { const m = 72, Lv = g.Lv || g.H; return m + (Lv - m * 2) * U.clamp(k, 0, 1); }

  function iniciaCauda(ev) {
    ev.proxGrao = 0.2; ev.pedra = 0;
    ev.pedras = obj() ? 4 : 3;
  }
  function atualizaCauda(g, ev, sdt) {
    const E = C.EVENTS.cauda, dur = duracao(ev), Lv = g.Lv;
    const k = U.clamp(ev.t / dur, 0, 1);
    ev.proxGrao -= sdt;
    if (ev.proxGrao <= 0 && k < 0.82) {
      ev.proxGrao = E.every * (obj() ? 1 : 2.4);
      const y = U.clamp(cauY(g, k) + U.rand(-30, 30), 26, Lv - 26);
      g.pickups.push({ x: g.Lu + 40, y, baseY: y, r: 13, id: 'coins', val: 2, color: '#ffcf4a', seed: U.rand(0, 6.28), taken: false, cauda: true });
    }
    // as pedras vem no meio da faixa, espacadas, e todas antes do fim: quem
    // desviou da ultima ja viu a cauda inteira passar
    while (ev.pedra < ev.pedras && k >= PEDRA_EM[ev.pedra]) {
      const y = U.clamp(cauY(g, PEDRA_EM[ev.pedra]) + U.rand(-16, 16), 32, Lv - 32);
      g.obstacles.push({ x: g.Lu + 50, y, r: U.rand(20, 27), rot: U.rand(0, 6.28), vr: U.rand(-1.4, 1.4), seed: Math.random() * 100, dead: false, rock: true, cauda: true });
      ev.pedra++;
    }
  }
  function desenhaCauda(g, ev) {
    const ctx = g.ctx, E = C.EVENTS.cauda, Lv = g.Lv, Lu = g.Lu, dur = duracao(ev);
    const k = U.clamp(ev.t / dur, 0, 1);
    const v = Math.max(140, g.speedAt(g.run.ringsPassed));
    const taxa = (Lv - 144) / dur;          // px por segundo que a faixa desce
    const y0 = cauY(g, k);
    const y1 = U.clamp(y0 - (Lu + 160) / v * taxa, 18, Lv - 18);
    const a = rampa(ev);
    ctx.globalAlpha = 1; ctx.lineCap = 'round';
    if (obj()) { ctx.strokeStyle = U.rgba(E.color, 0.09 * a); ctx.lineWidth = 80; ctx.beginPath(); ctx.moveTo(Lu + 90, y0); ctx.lineTo(-90, y1); ctx.stroke(); }
    ctx.strokeStyle = U.rgba(E.color, 0.24 * a); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(Lu + 90, y0); ctx.lineTo(-90, y1); ctx.stroke();
  }

  /* =====================================================================
     2. ENXAME — o Cardume ao lado da bola
     Nao machuca, nao atrapalha e nao pede nada: so responde. Perfeito, o
     bando pisca e solta uma moeda (que voa para a bola). Errar, ele se
     afasta um pouco — e volta sozinho.
     ===================================================================== */
  function iniciaEnxame(g, ev) {
    const n = obj() ? 11 : 8, f = [];
    for (let i = 0; i < n; i++) f.push(U.rand(0, 6.28));
    ev.enx = { off: 92, pisca: 0, fase: f, lado: -1 };
  }
  function enxCentro(g, ev) {
    const b = g.ball, e = ev.enx, Lv = g.Lv;
    const y = U.clamp(b.y + e.lado * e.off + Math.sin(g.time * 1.4) * 7, 30, Lv - 30);
    return { x: b.x - 46 + Math.sin(g.time * 0.9) * 10, y };
  }
  function atualizaEnxame(g, ev, sdt) {
    const e = ev.enx; if (!e) return;
    const Lv = g.Lv, b = g.ball;
    if (b.y < Lv * 0.36) e.lado = 1; else if (b.y > Lv * 0.64) e.lado = -1;
    e.pisca = Math.max(0, e.pisca - sdt * 2.2);
    e.off = U.damp(e.off, 92, 0.4, sdt);
  }
  function enxamePerfeito(g, ev) {
    const e = ev.enx; if (!e) return;
    const c = enxCentro(g, ev);
    e.pisca = 1; e.off = Math.max(74, e.off - 10);
    g.pickups.push({ x: c.x, y: c.y, baseY: c.y, r: 14, id: 'coins', val: 3, color: '#9dff8a', seed: U.rand(0, 6.28), taken: false, pulled: true, enx: true });
    if (obj()) g.particles.burst({ x: c.x, y: c.y, n: 6, speed: 150, color: ['#9dff8a', '#ffffff'], size: 4, life: 0.5, type: 'spark' });
  }
  function enxameAfasta(ev) { const e = ev && ev.enx; if (e) e.off = Math.min(210, e.off + 30); }
  function desenhaEnxame(g, ev) {
    const ctx = g.ctx, E = C.EVENTS.enxame, e = ev.enx; if (!e) return;
    const c = enxCentro(g, ev), t = g.time, a = rampa(ev);
    ctx.globalAlpha = 1;
    // o halo. No aparelho fraco nao ha gradiente: um circulo chapado faz o
    // mesmo servico por uma primitiva — sem ele o Cardume sumia no fundo e a
    // moeda do perfeito parecia vir do nada.
    if (e.pisca > 0.02) {
      if (obj()) {
        const gr = ctx.createRadialGradient(c.x, c.y, 4, c.x, c.y, 54);
        gr.addColorStop(0, U.rgba(E.color, 0.3 * e.pisca * a)); gr.addColorStop(1, U.rgba(E.color, 0));
        ctx.fillStyle = gr;
      } else ctx.fillStyle = U.rgba(E.color, 0.12 * e.pisca * a);
      ctx.beginPath(); ctx.arc(c.x, c.y, obj() ? 54 : 38, 0, TAU); ctx.fill();
    }
    const cor = e.pisca > 0.3 ? '#ffffff' : E.color;
    for (let i = 0; i < e.fase.length; i++) {
      const f = e.fase[i];
      const x = c.x + Math.cos(t * 1.7 + f) * (20 + 8 * Math.sin(t * 0.9 + f));
      const y = c.y + Math.sin(t * 2.3 + f * 1.7) * 13;
      ctx.fillStyle = U.rgba(cor, U.clamp((0.78 + 0.22 * Math.sin(t * 5 + f)) * a, 0, 1));
      ctx.beginPath(); ctx.arc(x, y, 3.2 + 1.2 * e.pisca, 0, TAU); ctx.fill();
    }
  }

  /* =====================================================================
     3. LINHA — dois aneis e um fio
     Os dois nascem em fila, ligados, e cada um tem o seu numero. Quem
     chega primeiro nem sempre e o numero 1: quando nao e, o jeito de
     fazer na ordem e deixar esse passar de lado e pega-lo na volta —
     o fio traz o anel nao usado de novo para a frente, sem castigo.
     ===================================================================== */
  const VOLTAS = 3;
  function aneLinha(g, k, x, y, r) {
    const E = C.EVENTS.linha;
    return {
      x, baseY: y, y, r, baseR: r, tilt0: 0, tilt: 0, osc: 0, oscF: 0, oscP: 0, rot: 0, rotF: 0, rotP: 0,
      shrinkK: 0, pulse: false, type: 'plain', color: E.color, accent: E.color, fx: g.fx,
      coin: false, coinTaken: false, centerItem: false, resolved: false, missed: false, index: 940 + k,
      flash: 0, hit: false, prevAcross: null, aligned: false, phaseNumber: g.run.phaseNumber, gold: false,
      alpha: 1, reflexUsed: false, dbl: false, event: true, k, linha: k
    };
  }
  function iniciaLinha(g, ev) {
    const R = C.RUN, run = g.run, Lv = g.Lv;
    const r0 = R.ringR * 1.1 * (1 + run.mods.ringRadius);
    const minY = R.marginY + r0, maxY = Lv - R.marginY - r0;
    const cima = U.chance(0.5);
    const yA = U.clamp(Lv * (cima ? 0.32 : 0.68), minY, maxY);
    const yB = U.clamp(Lv * (cima ? 0.68 : 0.32), minY, maxY);
    const invertido = U.chance(0.5);        // o primeiro a chegar e o numero 2
    ev.par = [
      { feito: false, voltas: 0, num: invertido ? 2 : 1 },
      { feito: false, voltas: 0, num: invertido ? 1 : 2 }
    ];
    ev.ordem = []; ev.triplo = false;
    const xA = g.Lu + 300, xB = g.Lu + 620;
    g.rings.push(aneLinha(g, 0, xA, yA, r0));
    g.rings.push(aneLinha(g, 1, xB, yB, r0));
    // o fio deixa de ser enfeite: as moedas moram nele. Andam junto com os
    // aneis (mesma velocidade do mundo), entao ficam na linha o tempo todo.
    const n = obj() ? 7 : 5;
    for (let i = 1; i <= n; i++) {
      const k = i / (n + 1);
      moeda(g, xA + (xB - xA) * k, yA + (yB - yA) * k, 2, '#ffcf4a', { fio: true });
    }
  }
  function podeVoltar(ev, r) {
    if (!ev.par || r.linha == null) return false;
    const p = ev.par[r.linha];
    return !!p && !p.feito && p.voltas < VOLTAS;
  }
  function recolocaLinha(g, r) {
    const ev = g.event, p = ev.par[r.linha];
    p.voltas++;
    let x = g.Lu + 320;
    for (let i = 0; i < g.rings.length; i++) { const o = g.rings[i]; if (o !== r && o.linha != null && !ev.par[o.linha].feito) x = Math.max(x, o.x + 320); }
    r.x = x; r.resolved = false; r.missed = false; r.hit = false; r.counted = false;
    r.prevAcross = null; r.flash = 0.4; r.shatterT = 0;
    HR.Audio.sfx('near');
    g.particles.text(g.ball.x, g.ball.y - 54, HR.t('ev_linha_volta'), C.EVENTS.linha.color, 20);
  }
  function atualizaLinha(g, ev) {
    if (!ev.par || !ev.par[0].feito || !ev.par[1].feito) return;
    ev.triplo = ev.ordem.length === 2 && ev.ordem[0] === 1;
    g.endEvent(ev.ordem.length === 2);
  }
  function desenhaLinha(g, ev) {
    const ctx = g.ctx, E = C.EVENTS.linha; if (!ev.par) return;
    let r0 = null, r1 = null;
    for (let i = 0; i < g.rings.length; i++) { const r = g.rings[i]; if (r.linha === 0) r0 = r; else if (r.linha === 1) r1 = r; }
    ctx.globalAlpha = 1;
    if (r0 && r1 && !ev.par[0].feito && !ev.par[1].feito) {
      ctx.strokeStyle = U.rgba(E.color, 0.3 + 0.14 * Math.sin(g.time * 3));
      ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      ctx.setLineDash(D_FIO); ctx.lineDashOffset = -g.time * 26;
      ctx.beginPath(); ctx.moveTo(r0.x, r0.y); ctx.lineTo(r1.x, r1.y); ctx.stroke();
      ctx.setLineDash(D_OFF); ctx.lineDashOffset = 0;
    }
    // o numero de cada anel, sempre em pe (o mundo pode estar girado)
    ctx.font = '700 26px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i < g.rings.length; i++) {
      const r = g.rings[i];
      if (r.linha == null || ev.par[r.linha].feito) continue;
      ctx.save(); ctx.translate(r.x, r.y - r.r - 26); ctx.rotate(-g.frame.angle);
      ctx.fillStyle = U.rgba(ev.par[r.linha].num === 1 ? '#ffffff' : E.color, 0.9);
      ctx.fillText(String(ev.par[r.linha].num), 0, 0);
      ctx.restore();
    }
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
  }

  /* =====================================================================
     4. COMETA — a esteira da frente
     Entra por tras, ultrapassa a bola e fica a frente dela. A esteira
     fica no mundo (anda para tras junto com tudo). Voar dentro da faixa
     da moeda e um empurrao leve; voar fora nao custa nada.
     ===================================================================== */
  function iniciaCometa(g, ev) {
    ev.com = { x: -110, y: g.ball.y, perto: 0, empurrao: 0, passo: 0, esteira: [] };
  }
  function atualizaCometa(g, ev, sdt) {
    const c = ev.com; if (!c) return;
    const b = g.ball, Lv = g.Lv;
    const v = g.speedAt(g.run.ringsPassed);
    const alvoX = b.x + 190;
    const alvoY = U.clamp(b.y + Math.sin(g.time * 0.7) * Lv * 0.1, 44, Lv - 44);
    c.x = U.damp(c.x, alvoX, ev.t < 1.8 ? 1.0 : 2.4, sdt);
    c.y = U.damp(c.y, alvoY, 1.5, sdt);
    const cap = obj() ? 26 : 10;
    for (let i = 0; i < c.esteira.length; i++) c.esteira[i].x -= v * sdt;
    c.passo -= sdt;
    if (c.passo <= 0) {
      c.passo = obj() ? 0.05 : 0.13;
      c.esteira.push({ x: c.x, y: c.y });
      while (c.esteira.length > cap) c.esteira.shift();
    }
    // a bola esta na faixa? olha so os pontos da esteira na altura dela
    const faixa = Lv * 0.12;
    let dist = 1e9;
    for (let i = 0; i < c.esteira.length; i++) {
      const p = c.esteira[i];
      if (Math.abs(p.x - b.x) < 70) { const d = Math.abs(p.y - b.y); if (d < dist) dist = d; }
    }
    if (dist < faixa) {
      c.perto += sdt;
      c.empurrao = Math.min(1, c.empurrao + sdt * 1.6);
      if (c.perto >= 0.6) { c.perto = 0; g.addCoins(2, b.x, b.y - 44); HR.Audio.sfx('coin'); }
    } else {
      c.perto = Math.max(0, c.perto - sdt * 0.5);
      c.empurrao = Math.max(0, c.empurrao - sdt * 1.1);
    }
  }
  function desenhaCometa(g, ev) {
    const ctx = g.ctx, E = C.EVENTS.cometa, c = ev.com; if (!c) return;
    const a = rampa(ev), Lv = g.Lv, n = c.esteira.length;
    ctx.globalAlpha = 1; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (n > 1) {
      ctx.beginPath(); ctx.moveTo(c.esteira[0].x, c.esteira[0].y);
      for (let i = 1; i < n; i++) ctx.lineTo(c.esteira[i].x, c.esteira[i].y);
      ctx.lineTo(c.x, c.y);
      // a faixa larga e a propria tolerancia: o que se ve e o que vale
      ctx.strokeStyle = U.rgba(E.color, 0.09 * a); ctx.lineWidth = Lv * 0.22; ctx.stroke();
      ctx.strokeStyle = U.rgba(E.color, (0.4 + 0.25 * c.empurrao) * a); ctx.lineWidth = 3; ctx.stroke();
    }
    if (obj()) {
      const gr = ctx.createRadialGradient(c.x, c.y, 2, c.x, c.y, 28);
      gr.addColorStop(0, U.rgba('#ffffff', 0.75 * a)); gr.addColorStop(1, U.rgba(E.color, 0));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(c.x, c.y, 28, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = a;
    ctx.fillStyle = '#eaf9ff'; ctx.beginPath(); ctx.arc(c.x, c.y, 6.5, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
  }

  /* =====================================================================
     5. MARE DE LUZ — o veu com dois buracos
     Um veu escuro por cima do mundo, com um buraco em volta da bola e
     outro em volta do anel da vez. Feito numa tela propria, em resolucao
     menor (o escuro e mole, ninguem ve a diferenca), com
     'destination-out' para abrir os buracos: 5 primitivas por quadro.
     Zero shadowBlur, zero gradiente novo por quadro.
     ===================================================================== */
  function veuGrad(cx, g) {
    if (g._mareGrad) return g._mareGrad;
    const gr = cx.createRadialGradient(0, 0, 1, 0, 0, 100);
    gr.addColorStop(0, 'rgba(0,0,0,1)');
    gr.addColorStop(0.55, 'rgba(0,0,0,0.94)');
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g._mareGrad = gr; return gr;
  }
  function buraco(cx, gr, x, y, r) {
    cx.save(); cx.translate(x, y); cx.scale(r / 100, r / 100);
    cx.fillStyle = gr; cx.fillRect(-100, -100, 200, 200);
    cx.restore();
  }
  function desenhaMare(g, ev) {
    const ctx = g.ctx, W = g.W, H = g.H, b = g.ball;
    const esc = obj() ? 0.5 : 0.32;
    const cv = g._mareCv || (g._mareCv = document.createElement('canvas'));
    const w = Math.max(2, Math.round(W * esc)), h = Math.max(2, Math.round(H * esc));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; g._mareGrad = null; }
    const cx = cv.getContext('2d'); if (!cx) return;
    const gr = veuGrad(cx, g);
    const a = rampa(ev);
    cx.setTransform(esc, 0, 0, esc, 0, 0);
    cx.globalCompositeOperation = 'source-over';
    cx.globalAlpha = 1;
    cx.clearRect(0, 0, W, H);
    cx.globalAlpha = 0.86 * a;
    cx.fillStyle = '#04060f';
    cx.fillRect(0, 0, W, H);
    cx.globalAlpha = 1;
    cx.globalCompositeOperation = 'destination-out';
    const sb = g.toScreen(b.x, b.y);
    buraco(cx, gr, sb.x, sb.y, 150 + Math.sin(g.time * 1.6) * 10);
    let anel = null;
    for (let i = 0; i < g.rings.length; i++) { const r = g.rings[i]; if (!r.resolved && r.x > b.x - 40 && (!anel || r.x < anel.x)) anel = r; }
    if (anel) { const sa = g.toScreen(anel.x, anel.y); buraco(cx, gr, sa.x, sa.y, Math.max(130, anel.r * 1.9)); }
    cx.globalCompositeOperation = 'source-over';
    ctx.drawImage(cv, 0, 0, W, H);
  }

  /* =====================================================================
     6. SILENCIO — a respirada
     A musica para, o mundo perde um pouco da cor, e nada mais muda. Tem
     de ser bonito, nao assustador: e uma lavagem clara (nao um escuro),
     com uma poeira lenta em cima. Terminar o trecho sem errar um arco
     da moedas e a conquista.
     ===================================================================== */
  function iniciaSilencio(g, ev) {
    const run = g.run, p = [];
    ev.misses0 = run.misses; ev.res0 = run.ringsResolved;
    const n = obj() ? 9 : 0;
    for (let i = 0; i < n; i++) p.push({ x: U.rand(0, 1), y: U.rand(0, 1), f: U.rand(0, 6.28), v: U.rand(0.02, 0.06) });
    ev.poeira = p;
    abafa();
  }
  function fechaSilencio(g, ev) {
    const run = g.run;
    if (g.demo) return false;
    if (run.misses !== ev.misses0 || run.hits !== ev.hits0 || run.ringsResolved <= ev.res0) return false;
    const d = HR.Store.data, x = d.stats5 || (d.stats5 = {});
    const novo = !x.silencioEv;
    x.silencioEv = 1;
    const moedas = g.addCoins(40, g.ball.x, g.ball.y - 86);
    HR.Store.save();
    if (HR.UI && HR.UI.toast) HR.UI.toast(HR.icon('feather') + ' ' + HR.t('silencio_ev_feito', { n: moedas }), 'good');
    if (novo) setTimeout(() => { if (HR.UI && HR.UI.trophyCheck) HR.UI.trophyCheck(); }, 400);
    return true;
  }
  function desenhaSilencio(g, ev) {
    const ctx = g.ctx, W = g.W, H = g.H, a = rampa(ev), P = ev.poeira;
    ctx.save();
    ctx.globalAlpha = 0.16 * a; ctx.fillStyle = '#c6cee8'; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.09 * a; ctx.fillStyle = '#0a0e1e'; ctx.fillRect(0, 0, W, H);
    if (P && P.length) {
      ctx.globalAlpha = 0.5 * a; ctx.fillStyle = '#e8f0ff';
      for (let i = 0; i < P.length; i++) {
        const p = P[i];
        const px = ((p.x + Math.sin(g.time * 0.25 + p.f) * 0.04) % 1 + 1) % 1;
        const py = ((p.y - p.v * ev.t * 0.35) % 1 + 1) % 1;
        ctx.beginPath(); ctx.arc(px * W, py * H, 1.6 + Math.sin(g.time * 1.3 + p.f) * 0.6, 0, TAU); ctx.fill();
      }
    }
    ctx.restore();
  }

  /* =====================================================================
     7. FILAO — a veia de ouro
     Uma linha de moedas serpenteia. Cada moeda pega em seguida sobe o
     multiplicador (×1 a ×5); deixar uma passar por tras da bola zera.
     O numero anda com a bola, grande, porque o que se perde tem de doer
     na hora — e nao no fim.
     ===================================================================== */
  function serpY(g, t) {
    const Lv = g.Lv, m = 74;
    return m + (Lv - m * 2) * (0.5 + 0.5 * Math.sin(t * 1.9));
  }
  function iniciaFilao(ev) {
    ev.fil = { mul: 1, melhor: 1, brilho: 0, zerou: 0, prox: 0.35, fase: U.rand(0, 6.28) };
  }
  function atualizaFilao(g, ev, sdt) {
    const E = C.EVENTS.filao, f = ev.fil, b = g.ball, dur = duracao(ev);
    if (!f) return;
    f.brilho = Math.max(0, f.brilho - sdt * 2.4);
    f.zerou = Math.max(0, f.zerou - sdt * 1.6);
    f.prox -= sdt;
    // para de semear 2 s antes do fim: a ultima moeda chega antes do apito
    if (f.prox <= 0 && ev.t < dur - 2) {
      f.prox = E.every;
      const y = serpY(g, g.time + f.fase);
      moeda(g, g.Lu + 40, y, E.val, '#ffcf4a', { filao: true });
    }
    // escapou: passou por tras da bola sem ser pega
    const P = g.pickups;
    for (let i = 0; i < P.length; i++) {
      const p = P[i];
      if (!p.filao || p.taken || p.perdida || p.x > b.x - 46) continue;
      p.perdida = true;
      if (f.mul > 1) {
        f.mul = 1; f.zerou = 1;
        HR.Audio.sfx('miss');
        g.particles.text(b.x, b.y - 88, HR.t('ev_filao_zerou'), '#8d97b3', 20);
      }
    }
  }
  function filaoPegou(g, ev) {
    const E = C.EVENTS.filao, f = ev.fil; if (!f) return;
    f.brilho = 1;
    f.melhor = Math.max(f.melhor, f.mul);   // o que ESTA moeda acabou de valer
    if (f.mul < E.maxMul) {
      f.mul++;
      if (f.mul === E.maxMul) {
        HR.Audio.sfx('great');
        g.particles.text(g.ball.x, g.ball.y - 92, HR.t('ev_filao_cheio'), '#fff6c8', 24);
      }
    }
  }
  function desenhaFilao(g, ev) {
    const ctx = g.ctx, E = C.EVENTS.filao, f = ev.fil; if (!f) return;
    const Lu = g.Lu, b = g.ball, a = rampa(ev);
    const v = Math.max(140, g.speedAt(g.run.ringsPassed));
    // a veia: passa exatamente por onde as moedas vao passar (o mesmo seno,
    // lido para tras no tempo). Um traco so, mesmo no aparelho fraco.
    const n = obj() ? 26 : 14;
    ctx.globalAlpha = 1; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i <= n; i++) {
      const x = (Lu + 40) * (1 - i / n);
      const t = g.time + f.fase - (Lu + 40 - x) / v;
      const y = serpY(g, t);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = U.rgba(E.color, (0.16 + 0.1 * f.brilho) * a); ctx.lineWidth = 3; ctx.stroke();
    // o multiplicador, grande, do lado da bola
    const cor = f.zerou > 0.05 ? '#ff5e7e' : f.mul >= E.maxMul ? '#fff6c8' : E.color;
    // preso a tela: com a bola recuada ao maximo o numero saia pela borda
    const nx = U.clamp(b.x - 54, 46, g.Lu - 46), ny = U.clamp(b.y - 48, 40, g.Lv - 40);
    ctx.save();
    ctx.translate(nx, ny); ctx.rotate(-g.frame.angle);
    ctx.font = '800 ' + Math.round(32 + 14 * f.brilho) + 'px system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = U.rgba(cor, (0.55 + 0.4 * f.brilho) * a);
    ctx.fillText('×' + f.mul, 0, 0);
    ctx.restore();
    ctx.textAlign = 'start'; ctx.textBaseline = 'alphabetic';
  }

  /* =====================================================================
     8. COFRE — tres passagens
     Entra pela direita na linha dos aneis e freia quase por completo perto
     da bola: e ali que se atravessa. Cada travessia racha; na terceira ele
     arrebenta e cospe moedas. Se sair de tela antes, nao paga nada — e e
     esse "nao paga nada" que faz a pessoa ir atras.
     ===================================================================== */
  const COF_W = 54, COF_H = 62;
  function iniciaCofre(g, ev) {
    ev.cof = {
      x: g.Lu + 90, y: U.clamp(g.Lv * 0.5, 90, g.Lv - 90),
      trincas: 0, tremor: 0, lado: null, aberto: 0, prox: 0, sai: false
    };
  }
  function atualizaCofre(g, ev, sdt) {
    const E = C.EVENTS.cofre, c = ev.cof, b = g.ball; if (!c) return;
    c.tremor = Math.max(0, c.tremor - sdt * 3);
    if (c.aberto > 0) {
      // arrebentou: cospe o leque por um segundo e fecha o evento
      c.aberto += sdt; c.prox -= sdt;
      if (c.prox <= 0 && c.aberto < 1.15) {
        c.prox = 0.09;
        const an = U.rand(0, TAU), sp = U.rand(120, 300);
        moeda(g, c.x, c.y, E.val, '#ffd98a', { fvx: Math.cos(an) * sp - 60, fvy: Math.sin(an) * sp, cofre: true });
      }
      leque(g, sdt);
      if (c.aberto >= 1.5) g.endEvent(true);
      return;
    }
    // vem rapido de longe e passa a rastejar na coluna da bola
    const d = Math.abs(c.x - b.x);
    const vel = c.sai ? 620 : 24 + 300 * U.clamp((d - 70) / 170, 0, 1);
    c.x -= vel * sdt;
    c.y = U.damp(c.y, U.clamp(g.Lv * 0.5 + Math.sin(g.time * 0.5) * g.Lv * 0.08, 90, g.Lv - 90), 0.9, sdt);
    // atravessar: cruzar a altura do cofre estando dentro dele
    const dentro = Math.abs(b.x - c.x) < COF_W * 0.5 + b.r + 4;
    const lado = b.y < c.y ? -1 : 1;
    if (dentro) {
      if (c.lado !== null && c.lado !== lado) racha(g, ev);
      c.lado = lado;
    } else c.lado = null;
    if (c.x < -COF_W || ev.t > 20) g.endEvent(false);
  }
  function racha(g, ev) {
    const E = C.EVENTS.cofre, c = ev.cof;
    c.trincas++; c.tremor = 1;
    g.shake = Math.max(g.shake, 4);
    HR.Audio.sfx(c.trincas >= E.trincas ? 'reward' : 'shield');
    HR.U.vibrate([10, 20]);
    if (obj()) g.particles.burst({ x: c.x, y: c.y, n: 10, speed: 240, color: [E.color, '#ffffff'], size: 5, life: 0.5, type: 'shard' });
    if (c.trincas >= E.trincas) {
      c.aberto = 0.001; c.prox = 0;
      g.particles.burst({ x: c.x, y: c.y, n: 1, speed: 0, color: E.color, size: 40, life: 0.8, type: 'wave' });
      g.particles.text(c.x, c.y - 56, HR.t('ev_cofre_abriu'), E.color, 26);
    } else {
      g.particles.text(c.x, c.y - 52, (E.trincas - c.trincas) + '', '#ffffff', 26);
    }
  }
  function desenhaCofre(g, ev) {
    const ctx = g.ctx, E = C.EVENTS.cofre, c = ev.cof; if (!c) return;
    const a = entra(ev), tr = c.tremor;
    const x = c.x + (tr > 0 ? U.rand(-3, 3) * tr : 0), y = c.y + (tr > 0 ? U.rand(-3, 3) * tr : 0);
    const w = COF_W, h = COF_H, abre = c.aberto > 0 ? U.clamp(c.aberto * 3, 0, 1) : 0;
    ctx.save();
    ctx.globalAlpha = a * (1 - abre * 0.85);
    // o corpo escuro
    ctx.fillStyle = '#0d1020';
    ctx.fillRect(x - w / 2, y - h / 2, w, h);
    ctx.strokeStyle = U.rgba(E.color, 0.85); ctx.lineWidth = 3;
    ctx.strokeRect(x - w / 2, y - h / 2, w, h);
    // a tampa e as duas dobradicas: sem elas a caixa nao le como cofre
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y - h / 2 + 15); ctx.lineTo(x + w / 2, y - h / 2 + 15);
    ctx.moveTo(x - w / 2 - 4, y - 12); ctx.lineTo(x - w / 2 - 4, y + 12);
    ctx.moveTo(x + w / 2 + 4, y - 12); ctx.lineTo(x + w / 2 + 4, y + 12);
    ctx.stroke();
    // a fresta de luz: o que se ve por dentro, e o que cresce a cada trinca
    const fw = 6 + c.trincas * 5;
    ctx.fillStyle = U.rgba('#fff6c8', 0.5 + 0.2 * Math.sin(g.time * 4) + 0.1 * c.trincas);
    ctx.fillRect(x - fw / 2, y - h / 2 + 6, fw, h - 12);
    // as trincas: uma risca a cada passagem, do canto para o meio
    if (c.trincas > 0) {
      ctx.strokeStyle = U.rgba('#fff6c8', 0.9); ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < c.trincas; i++) {
        const s = i % 2 ? 1 : -1, k = 0.2 + i * 0.22;
        ctx.moveTo(x + s * w / 2, y - h / 2 + h * k);
        ctx.lineTo(x + s * 6, y - h / 2 + h * (k + 0.18));
        ctx.lineTo(x - s * 4, y - h / 2 + h * (k + 0.34));
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  /* =====================================================================
     9. ESCOLHA — tres orbes, uma so
     Dourado (moedas), azul (escudo) e roxo (um poder agora). Chegam na
     mesma coluna, em tres alturas: a decisao e onde estar quando passarem.
     Tocar num faz os outros dois estalarem e o evento acaba ali.
     ===================================================================== */
  const ESC = [
    { k: 'moedas', cor: '#ffcf4a' },
    { k: 'escudo', cor: '#4cf0ff' },
    { k: 'poder',  cor: '#c39bff' }
  ];
  function iniciaEscolha(g, ev) {
    const Lv = g.Lv, ordem = [0, 1, 2];
    for (let i = ordem.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)), t = ordem[i]; ordem[i] = ordem[j]; ordem[j] = t; }
    ev.esc = {
      x: g.Lu + 120, r: 26, escolhido: -1, estalo: 0,
      // 0,26 e nao 0,22: mais em cima o de cima ficava debaixo da faixa do HUD
      orbes: ordem.map((k, i) => ({ k, y: U.clamp(Lv * (0.26 + i * 0.24), 76, Lv - 76), vivo: true }))
    };
  }
  function atualizaEscolha(g, ev, sdt) {
    const e = ev.esc, b = g.ball; if (!e) return;
    if (e.escolhido >= 0) { e.estalo += sdt; if (e.estalo > 0.5) g.endEvent(true); return; }
    // Os tres orbes vinham na velocidade do mundo e passavam antes de a pessoa
    // decidir: virava reflexo, nao escolha. Chegando perto da bola eles PARAM
    // por um tempo — o unico momento do jogo em que o mundo espera por voce.
    const PARADA = 0.9, PERTO = 150;
    if (e.x - b.x < PERTO && e.parou == null) e.parou = 0;
    if (e.parou != null && e.parou < PARADA) { e.parou += sdt; return; }
    e.x -= g.speedAt(g.run.ringsPassed) * sdt;
    for (let i = 0; i < e.orbes.length; i++) {
      const o = e.orbes[i];
      if (Math.hypot(b.x - e.x, b.y - o.y) < b.r + e.r + 4) { pegaOrbe(g, ev, i); return; }
    }
    if (e.x < b.x - e.r - 40 || ev.t > 16) g.endEvent(false);
  }
  function pegaOrbe(g, ev, i) {
    const E = C.EVENTS.escolha, e = ev.esc, run = g.run, b = g.ball;
    const o = e.orbes[i], d = ESC[o.k];
    e.escolhido = i; e.estalo = 0.001;
    for (let j = 0; j < e.orbes.length; j++) if (j !== i) {
      e.orbes[j].vivo = false;
      if (obj()) g.particles.burst({ x: e.x, y: e.orbes[j].y, n: 8, speed: 200, color: [ESC[e.orbes[j].k].cor, '#ffffff'], size: 4, life: 0.4, type: 'spark' });
    }
    g.particles.burst({ x: e.x, y: o.y, n: 1, speed: 0, color: d.cor, size: 34, life: 0.7, type: 'wave' });
    HR.Audio.sfx('reward');
    let texto = '';
    if (d.k === 'moedas') { texto = '+' + g.addCoins(E.moedas) + ''; }
    else if (d.k === 'escudo') {
      const antes = run.shields;
      run.shields = Math.min(g.shieldCap(), run.shields + E.escudos);
      g.emit('status', run);
      texto = HR.t('perk_shield') + ' +' + (run.shields - antes);
    } else {
      const of = HR.Perks.offer(run, 1), p = of && of[0];
      if (p) {
        HR.Perks.take(run, p.id);
        if (!g.demo && HR.Store.data.stats) HR.Store.data.stats.perksTaken++;
        texto = HR.Perks.name(p.id);
        if (HR.UI && HR.UI.toast) HR.UI.toast(HR.icon('sparkles') + ' ' + HR.Perks.name(p.id), 'good');
      } else { texto = '+' + g.addCoins(20); }
    }
    g.particles.text(b.x, b.y - 74, texto, d.cor, 24);
  }
  function desenhaEscolha(g, ev) {
    const ctx = g.ctx, e = ev.esc; if (!e) return;
    const a = entra(ev), t = g.time;
    ctx.globalAlpha = 1; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < e.orbes.length; i++) {
      const o = e.orbes[i]; if (!o.vivo) continue;
      const d = ESC[o.k];
      const esc = e.escolhido === i ? 1 + e.estalo * 1.6 : 1;
      const r = e.r * esc, x = e.x, y = o.y + Math.sin(t * 2 + i) * 4;
      const al = a * (e.escolhido === i ? Math.max(0, 1 - e.estalo * 2) : 1);
      ctx.globalAlpha = al;
      if (obj()) {
        const gr = ctx.createRadialGradient(x, y, 3, x, y, r * 2.2);
        gr.addColorStop(0, U.rgba(d.cor, 0.34)); gr.addColorStop(1, U.rgba(d.cor, 0));
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, r * 2.2, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = 'rgba(10,14,32,0.62)'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = U.rgba(d.cor, 0.95); ctx.lineWidth = 3; ctx.stroke();
      // o desenho de dentro diz o que e sem uma palavra
      const s = r * 0.5;
      ctx.fillStyle = d.cor; ctx.strokeStyle = d.cor; ctx.lineWidth = 2.4;
      if (d.k === 'moedas') {
        for (let j = 2; j >= 0; j--) {
          ctx.fillStyle = j === 0 ? d.cor : U.mix(d.cor, '#000000', 0.3);
          ctx.beginPath(); ctx.ellipse(x, y + j * s * 0.34 - s * 0.32, s * 0.9, s * 0.42, 0, 0, TAU); ctx.fill();
        }
      } else if (d.k === 'escudo') {
        ctx.beginPath();
        ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.85, y - s * 0.6); ctx.lineTo(x + s * 0.7, y + s * 0.25);
        ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.7, y + s * 0.25); ctx.lineTo(x - s * 0.85, y - s * 0.6);
        ctx.closePath(); ctx.stroke();
      } else {
        ctx.beginPath();
        for (let j = 0; j < 8; j++) { const rr = j % 2 ? s * 0.4 : s; const an = -Math.PI / 2 + j * Math.PI / 4; ctx.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); }
        ctx.closePath(); ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  /* =====================================================================
     10. FENDA — o rasgo que fecha
     Um rasgo se abre no meio da tela e jorra moedas num leque enquanto
     encolhe. As primeiras valem tres, as ultimas valem uma: a pressa esta
     no preco, nao num aviso na tela.
     ===================================================================== */
  function iniciaFenda(g, ev) {
    const E = C.EVENTS.fenda;
    ev.fen = { x: g.Lu * 0.72, y: g.Lv * 0.5, orc: E.orc, prox: 0.3, pulso: 0 };
  }
  function atualizaFenda(g, ev, sdt) {
    const E = C.EVENTS.fenda, f = ev.fen, dur = duracao(ev); if (!f) return;
    const k = U.clamp(ev.t / dur, 0, 1);
    f.pulso = Math.max(0, f.pulso - sdt * 3);
    f.prox -= sdt;
    // o preco cai com o relogio: o que faz correr nao e um aviso, e a conta
    const val = ev.t < 2.2 ? 3 : ev.t < 4.6 ? 2 : 1;
    if (f.prox <= 0 && k < 0.92 && f.orc >= val) {
      f.prox = E.every;
      f.orc -= val; f.pulso = 1;
      const an = Math.PI + U.rand(-1.15, 1.15), sp = U.rand(130, 260);
      moeda(g, f.x, f.y + U.rand(-10, 10), val, val >= 3 ? '#fff6c8' : '#ffcf4a', { fvx: Math.cos(an) * sp, fvy: Math.sin(an) * sp, fenda: true });
      if (obj()) g.particles.burst({ x: f.x, y: f.y, n: 3, speed: 170, color: [E.color, '#ffffff'], size: 3, life: 0.4, type: 'spark' });
    }
    leque(g, sdt);
  }
  function desenhaFenda(g, ev) {
    const ctx = g.ctx, E = C.EVENTS.fenda, f = ev.fen; if (!f) return;
    const dur = duracao(ev), k = U.clamp(ev.t / dur, 0, 1), a = rampa(ev);
    const h = (g.Lv * 0.30) * (1 - k) + 14, w = (10 + 8 * f.pulso) * (1 - k * 0.7) + 2;
    ctx.save();
    ctx.translate(f.x, f.y);
    if (obj()) {
      const gr = ctx.createRadialGradient(0, 0, 2, 0, 0, h * 1.5);
      gr.addColorStop(0, U.rgba(E.color, 0.3 * a)); gr.addColorStop(1, U.rgba(E.color, 0));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(0, 0, h * 0.8, h * 1.5, 0, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = a;
    ctx.fillStyle = U.rgba(E.color, 0.85);
    ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath(); ctx.ellipse(0, 0, Math.max(1, w * 0.3), h * 0.86, 0, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  /* =====================================================================
     11. GEMAS — o raro
     De tres a seis gemas num arco largo. Mesmo caminho do pickup 'gem':
     quem pega ganha gema de verdade. Nao aparece em toda fase, e e disso
     que a pessoa vai falar.
     ===================================================================== */
  function iniciaGemas(g, ev) {
    const E = C.EVENTS.gemas;
    const n = E.min + Math.floor(Math.random() * (E.max - E.min + 1));
    // o intervalo se ajusta ao numero: tres ou seis, o arco ocupa o mesmo
    // tempo e a ultima gema ainda chega antes do apito
    ev.gem = { n, feitas: 0, prox: 0.5, passo: 3.3 / Math.max(1, n - 1), lado: U.chance(0.5) ? 1 : -1, brilho: 0 };
  }
  function atualizaGemas(g, ev, sdt) {
    const gm = ev.gem; if (!gm) return;
    gm.brilho = Math.max(0, gm.brilho - sdt * 2);
    gm.prox -= sdt;
    // todas nascem nos primeiros 3,8 s: a ultima chega antes do apito
    if (gm.prox <= 0 && gm.feitas < gm.n) {
      gm.prox = gm.passo;
      const k = gm.n > 1 ? gm.feitas / (gm.n - 1) : 0.5;
      const y = U.clamp(g.Lv * 0.5 + gm.lado * Math.sin(k * Math.PI) * g.Lv * 0.34, 56, g.Lv - 56);
      g.pickups.push({ x: g.Lu + 40, y, baseY: y, r: 18, id: 'gem', color: '#c39bff', seed: U.rand(0, 6.28), taken: false, gema: true });
      gm.feitas++; gm.brilho = 1;
      HR.Audio.sfx('near');
    }
  }
  function desenhaGemas(g, ev) {
    if (!obj()) return;                       // no aparelho fraco a gema se basta
    const ctx = g.ctx, E = C.EVENTS.gemas, a = rampa(ev), t = g.time;
    const P = g.pickups;
    ctx.globalAlpha = 1;
    for (let i = 0; i < P.length; i++) {
      const p = P[i]; if (!p.gema || p.taken) continue;
      const r = p.r * (2.1 + 0.2 * Math.sin(t * 5 + p.seed));
      const gr = ctx.createRadialGradient(p.x, p.y, 3, p.x, p.y, r);
      gr.addColorStop(0, U.rgba('#ffffff', 0.34 * a)); gr.addColorStop(0.5, U.rgba(E.color, 0.26 * a)); gr.addColorStop(1, U.rgba(E.color, 0));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
    }
  }

  /* =====================================================================
     Os embrulhos
     ===================================================================== */
  const origStartEvent = G.startEvent;
  G.startEvent = function (id) {
    const passivo = PASSIVO[id];
    const aneis = this.rings, nx = this.nextX;
    origStartEvent.apply(this, arguments);
    const ev = this.event;
    if (!ev || ev.id !== id || !meu(id)) return;
    // passivo: a partida segue por baixo, com os aneis que ja estavam na tela
    if (passivo) { this.rings = aneis; this.nextX = nx; }
    if (id === 'cauda') iniciaCauda(ev);
    else if (id === 'enxame') iniciaEnxame(this, ev);
    else if (id === 'linha') iniciaLinha(this, ev);
    else if (id === 'cometa') iniciaCometa(this, ev);
    else if (id === 'silencio') iniciaSilencio(this, ev);
    else if (id === 'filao') iniciaFilao(ev);
    else if (id === 'cofre') iniciaCofre(this, ev);
    else if (id === 'escolha') iniciaEscolha(this, ev);
    else if (id === 'fenda') iniciaFenda(this, ev);
    else if (id === 'gemas') iniciaGemas(this, ev);
  };

  const origUpdateEvent = G.updateEvent;
  G.updateEvent = function (sdt, dt) {
    const ev = this.event;
    if (!ev || !meu(ev.id)) return origUpdateEvent.apply(this, arguments);
    origUpdateEvent.apply(this, arguments);   // conta o tempo e fecha no fim
    if (this.event !== ev) return;            // ja fechou neste quadro
    if (ev.id === 'cauda') atualizaCauda(this, ev, sdt);
    else if (ev.id === 'enxame') atualizaEnxame(this, ev, sdt);
    else if (ev.id === 'linha') atualizaLinha(this, ev);
    else if (ev.id === 'cometa') atualizaCometa(this, ev, sdt);
    else if (ev.id === 'filao') atualizaFilao(this, ev, sdt);
    else if (ev.id === 'cofre') atualizaCofre(this, ev, sdt);
    else if (ev.id === 'escolha') atualizaEscolha(this, ev, sdt);
    else if (ev.id === 'fenda') atualizaFenda(this, ev, sdt);
    else if (ev.id === 'gemas') atualizaGemas(this, ev, sdt);
  };

  // o Filao conta as moedas pegas em seguida: o valor da moeda e o
  // multiplicador da hora, e so depois ele sobe
  const origCollect = G.collect;
  G.collect = function (p) {
    const ev = this.event;
    if (ev && ev.id === 'filao' && ev.fil && p && p.filao && !p.taken) {
      p.val = C.EVENTS.filao.val * ev.fil.mul;
      origCollect.apply(this, arguments);
      if (this.event === ev) filaoPegou(this, ev);
      return;
    }
    return origCollect.apply(this, arguments);
  };

  const origEndEvent = G.endEvent;
  G.endEvent = function (ok) {
    const ev = this.event;
    if (!ev || !meu(ev.id)) return origEndEvent.apply(this, arguments);
    const id = ev.id, E = C.EVENTS[id], passivo = PASSIVO[id];
    const aneis = this.rings, nx = this.nextX;
    let extra = 0, texto = '';
    if (id === 'linha' && ok && ev.triplo) { extra = E.coins * 2; texto = HR.t('ev_linha_triplo'); }
    // o Filao paga o troféu do multiplicador: e o numero que a pessoa perseguiu
    else if (id === 'filao' && ok && ev.fil && ev.fil.melhor > 1) { extra = 3 * ev.fil.melhor; texto = '×' + ev.fil.melhor; }
    if (id === 'silencio' && ok) fechaSilencio(this, ev);
    origEndEvent.call(this, ok);
    if (extra) {
      this.addCoins(extra, this.ball.x, this.ball.y - 74);
      this.particles.text(this.ball.x, this.ball.y - 108, texto, E.color, 24);
      HR.Audio.sfx('reward');
    }
    if (passivo) { this.rings = aneis; this.nextX = nx; }
    // nada fica para tras: as pedras da cauda que ainda estavam a frente somem
    if (this.obstacles.some(o => o.cauda && o.x > this.ball.x + 30)) this.obstacles = this.obstacles.filter(o => !(o.cauda && o.x > this.ball.x + 30));
    // as moedas que ja estao na tela ficam (pegar o que sobrou e justo), mas o
    // impulso do leque morre aqui: sem evento ninguem o atualiza
    for (let i = 0; i < this.pickups.length; i++) { const p = this.pickups[i]; if (p.fvx || p.fvy) { p.fvx = 0; p.fvy = 0; } }
    devolve();
  };

  // aneis continuam nascendo nos eventos passivos: o jogo nao para
  const origFill = G.fill;
  G.fill = function () {
    const ev = this.event;
    if (!ev || !PASSIVO[ev.id]) return origFill.apply(this, arguments);
    this.event = null;
    try { origFill.apply(this, arguments); } finally { this.event = ev; }
  };

  // o empurrao do cometa (suave, e so enquanto a bola esta na faixa)
  const origSpeedAt = G.speedAt;
  G.speedAt = function (n, base) {
    const v = origSpeedAt.apply(this, arguments);
    const ev = this.event;
    if (ev && ev.id === 'cometa' && ev.com && ev.com.empurrao > 0) return v * (1 + 0.16 * ev.com.empurrao);
    return v;
  };

  // na Linha, sair de lado de um anel ainda pendente nao e erro: ele volta
  const origResolve = G.resolve;
  G.resolve = function (r, along) {
    const ev = this.event;
    if (ev && ev.id === 'linha' && r && r.linha != null && podeVoltar(ev, r)) {
      if (Math.abs(along) > r.r + this.ballR() * 0.9) { recolocaLinha(this, r); return; }
    }
    return origResolve.apply(this, arguments);
  };

  const origMiss = G.miss;
  G.miss = function (r) {
    const ev = this.event;
    if (ev && ev.id === 'linha' && r && r.linha != null && podeVoltar(ev, r)) { recolocaLinha(this, r); return; }
    origMiss.apply(this, arguments);
    if (ev && ev.id === 'enxame' && this.event === ev) enxameAfasta(ev);
  };

  const origDamage = G.damage;
  G.damage = function () {
    const ev = this.event;
    origDamage.apply(this, arguments);
    if (ev && ev.id === 'enxame' && this.event === ev) enxameAfasta(ev);
  };

  const origPass = G.pass;
  G.pass = function (r, along, limit) {
    const ev = this.event, p0 = this.run ? this.run.perfects : 0;
    const s0 = this.run ? this.run.score : 0;
    origPass.apply(this, arguments);
    if (this.demo || !ev || this.event !== ev) return;
    if (ev.id === 'enxame' && this.run.perfects > p0) enxamePerfeito(this, ev);
    // Silencio e Mare: o arco vale o dobro enquanto duram. O clima passa a ser
    // uma aposta — antes era so um efeito, e efeito sozinho parece defeito.
    if (DOBRO[ev.id] && r && !r.event) {
      const d = this.run.score - s0;
      if (d > 0) {
        this.run.score += d;
        this.particles.text(r.x, r.y + r.r + 28, HR.t('ev_dobro'), C.EVENTS[ev.id].color, 22);
        this.emit('score', this.run, false);
      }
    }
  };

  const origOnEventRing = G.onEventRing;
  G.onEventRing = function (r) {
    const ev = this.event;
    if (ev && ev.id === 'linha' && r && r.linha != null && ev.par) {
      const p = ev.par[r.linha];
      if (p && !p.feito) { p.feito = true; if (!r.missed && !r.hit) ev.ordem.push(p.num); }
      return;
    }
    return origOnEventRing.apply(this, arguments);
  };

  // telas em que o evento nao manda mais no que se ve (morreu, fase acabou,
  // voltou para o menu): nem veu, nem cauda, nem musica abafada
  const FORA = { idle: 1, over: 1, levelend: 1, revive: 1 };

  const origRender = G.render;
  G.render = function () {
    origRender.apply(this, arguments);
    const ev = this.event;
    if (!ev || !meu(ev.id) || FORA[this.state]) return;
    const ctx = this.ctx;
    if (ev.id === 'mare') { desenhaMare(this, ev); return; }
    if (ev.id === 'silencio') { desenhaSilencio(this, ev); return; }
    ctx.save();
    ctx.translate(this.frame.ox, this.frame.oy);
    ctx.rotate(this.frame.angle);
    if (ev.id === 'cauda') desenhaCauda(this, ev);
    else if (ev.id === 'enxame') desenhaEnxame(this, ev);
    else if (ev.id === 'linha') desenhaLinha(this, ev);
    else if (ev.id === 'cometa') desenhaCometa(this, ev);
    else if (ev.id === 'filao') desenhaFilao(this, ev);
    else if (ev.id === 'cofre') desenhaCofre(this, ev);
    else if (ev.id === 'escolha') desenhaEscolha(this, ev);
    else if (ev.id === 'fenda') desenhaFenda(this, ev);
    else if (ev.id === 'gemas') desenhaGemas(this, ev);
    ctx.restore();
  };

  // rede de seguranca: se a partida acabou (morreu, saiu pela pausa, a fase
  // fechou) no meio do Silencio, a musica volta no quadro seguinte. Sem isto,
  // sair no meio do evento deixava o jogo mudo para sempre.
  const origUpdate = G.update;
  G.update = function () {
    origUpdate.apply(this, arguments);
    if (mudo && (FORA[this.state] || !(this.event && this.event.id === 'silencio'))) devolve();
  };

  /* ---------------- a conquista do Silencio ---------------- */
  if (HR.ACHIEVEMENTS && !HR.ACHIEVEMENTS.some(a => a.id === 'silencio_ev')) {
    HR.ACHIEVEMENTS.push({ id: 'silencio_ev', cat: 'secret', hidden: true, stat: 'silencio_ev', target: 1, gems: 60, icon: 'feather' });
  }
  if (HR.Achievements && typeof HR.Achievements.stats5 === 'function') {
    const origStats5 = HR.Achievements.stats5;
    HR.Achievements.stats5 = function () {
      const out = origStats5.apply(this, arguments);
      out.silencio_ev = (HR.Store.data.stats5 || {}).silencioEv ? 1 : 0;
      return out;
    };
  }

  HR.EventosV8 = { ids: IDS, passivos: Object.keys(PASSIVO) };
})();

/* ---------------- textos ---------------- */
Object.assign(HR.I18N.pt, {
  ev_cauda: 'Chuva de cauda', ev_cauda_d: 'Atravesse a cauda pegando moedas e desvie das pedras',
  ev_enxame: 'Enxame', ev_enxame_d: 'Cada perfeito faz o Cardume soltar uma moeda',
  ev_linha: 'A Linha', ev_linha_d: 'Pegue as moedas do fio e passe nos dois arcos na ordem',
  ev_cometa: 'Cometa', ev_cometa_d: 'Voe perto da esteira do cometa',
  ev_mare: 'Maré de luz', ev_mare_d: 'A luz acaba em volta — e cada arco vale o dobro',
  ev_silencio: 'Silêncio', ev_silencio_d: 'A música para e cada arco vale o dobro de pontos',
  ev_filao: 'O Filão', ev_filao_d: 'Cada moeda seguida sobe o multiplicador — não erre',
  ev_cofre: 'O Cofre', ev_cofre_d: 'Atravesse o cofre três vezes antes que ele suma',
  ev_escolha: 'A Escolha', ev_escolha_d: 'Três orbes, um só: moedas, escudo ou um poder agora',
  ev_fenda: 'A Fenda', ev_fenda_d: 'O rasgo jorra moedas e vai fechando: corra',
  ev_gemas: 'Chuva de gemas', ev_gemas_d: 'Gemas de verdade num arco largo. Não deixe passar',
  ev_linha_volta: 'ELE VOLTA', ev_linha_triplo: 'NA ORDEM · ×3',
  ev_dobro: '×2', ev_filao_zerou: 'ZEROU', ev_filao_cheio: 'FILÃO CHEIO', ev_cofre_abriu: 'ARREBENTOU',
  a_silencio_ev: 'Respiração', a_d_silencio_ev: 'Atravesse o Silêncio sem errar um arco.',
  silencio_ev_feito: 'O Silêncio passou inteiro · +{n}'
});
Object.assign(HR.I18N.en, {
  ev_cauda: 'Dust tail', ev_cauda_d: 'Cross the tail for the coins and dodge the rocks',
  ev_enxame: 'Swarm', ev_enxame_d: 'Every perfect makes the Shoal drop a coin',
  ev_linha: 'The Line', ev_linha_d: 'Take the coins on the wire and pass both rings in order',
  ev_cometa: 'Comet', ev_cometa_d: 'Fly close to the comet trail',
  ev_mare: 'Tide of light', ev_mare_d: 'The light goes out around you — and every ring counts double',
  ev_silencio: 'Silence', ev_silencio_d: 'The music stops and every ring is worth double',
  ev_filao: 'The Vein', ev_filao_d: 'Each coin in a row raises the multiplier. Do not miss',
  ev_cofre: 'The Vault', ev_cofre_d: 'Cross the vault three times before it is gone',
  ev_escolha: 'The Choice', ev_escolha_d: 'Three orbs, only one: coins, a shield or a power right now',
  ev_fenda: 'The Rift', ev_fenda_d: 'The rift spills coins and is closing: hurry',
  ev_gemas: 'Gem shower', ev_gemas_d: 'Real gems in a wide arc. Do not let them pass',
  ev_linha_volta: 'IT COMES BACK', ev_linha_triplo: 'IN ORDER · ×3',
  ev_dobro: '×2', ev_filao_zerou: 'RESET', ev_filao_cheio: 'VEIN MAXED', ev_cofre_abriu: 'BURST OPEN',
  a_silencio_ev: 'A breath', a_d_silencio_ev: 'Cross the Silence without missing a ring.',
  silencio_ev_feito: 'The Silence passed whole · +{n}'
});
Object.assign(HR.I18N.es, {
  ev_cauda: 'Lluvia de cola', ev_cauda_d: 'Cruza la cola tomando monedas y esquiva las rocas',
  ev_enxame: 'Enjambre', ev_enxame_d: 'Cada perfecto hace que el Cardumen suelte una moneda',
  ev_linha: 'La Línea', ev_linha_d: 'Toma las monedas del hilo y pasa los dos aros en orden',
  ev_cometa: 'Cometa', ev_cometa_d: 'Vuela cerca de la estela del cometa',
  ev_mare: 'Marea de luz', ev_mare_d: 'La luz se apaga alrededor — y cada aro vale el doble',
  ev_silencio: 'Silencio', ev_silencio_d: 'La música para y cada aro vale el doble de puntos',
  ev_filao: 'El Filón', ev_filao_d: 'Cada moneda seguida sube el multiplicador. No falles',
  ev_cofre: 'El Cofre', ev_cofre_d: 'Cruza el cofre tres veces antes de que se vaya',
  ev_escolha: 'La Elección', ev_escolha_d: 'Tres orbes, solo uno: monedas, escudo o un poder ya',
  ev_fenda: 'La Grieta', ev_fenda_d: 'La grieta escupe monedas y se cierra: corre',
  ev_gemas: 'Lluvia de gemas', ev_gemas_d: 'Gemas de verdad en un arco amplio. No las dejes pasar',
  ev_linha_volta: 'VUELVE', ev_linha_triplo: 'EN ORDEN · ×3',
  ev_dobro: '×2', ev_filao_zerou: 'BORRADO', ev_filao_cheio: 'FILÓN LLENO', ev_cofre_abriu: 'REVENTÓ',
  a_silencio_ev: 'Respiración', a_d_silencio_ev: 'Cruza el Silencio sin fallar un aro.',
  silencio_ev_feito: 'El Silencio pasó entero · +{n}'
});
