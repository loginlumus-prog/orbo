/* =====================================================================
   ORBO v6.5 — Etapa 2: o Corredor do Jato.

   Antes: o jato atravessava 25 (ou 60) arcos voando. Ficava confuso — arcos
   passando sem contar para nada, e a pessoa sem saber o que fazer com eles.

   Agora, enquanto o jato esta ligado NAO existe arco nenhum. Abre um corredor
   com tres faixas (alta, do meio e baixa) e a pessoa escolhe por onde voar
   para colher. Uma das faixas e sempre a rica e vai trocando, entao ha uma
   decisao a cada poucos segundos em vez de um voo passivo. Quando o corredor
   acaba, a fase comeca INTEIRA — nenhum arco e gasto durante o jato.

   CINCO GRAUS. O corredor sobe de grau a cada ~10 s e para no grau 5. Cada
   grau troca a faixa rica mais rapido, paga mais por moeda e enche mais o
   caminho. Empilhar jatos (ate 5) nao muda a velocidade da subida: muda
   quanto tempo voce fica la em cima. Um Jato sozinho percorre os graus 1 a 3
   (~20 s); cinco Jatos dao ~1min40; cinco Mega Jatos dao ~3min45, com quase
   tres minutos no grau 5.

   Tecnico: run.jetLeft deixa de ser "arcos restantes" e passa a ser "passos de
   corredor restantes" (numero quebrado), descontado por DISTANCIA. Assim todo
   o resto do jogo, que so pergunta "jetLeft > 0", continua valendo, e a barra
   do HUD anda liso em vez de aos saltos.
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const PASSO = 190;                 // distancia entre um grupo de moedas e o proximo
  const FAIXAS = [0.27, 0.5, 0.73];  // alta, meio, baixa (fracao da altura do corredor)
  const PASSOS = { jet: 62, megajet: 140 };   // ~20 s e ~45 s por unidade usada
  const MAX_PILHA = 5;               // ate cinco jatos no mesmo corredor
  const SOBE_A_CADA = 30;            // passos para subir um grau (~10 s): um Jato sozinho
                                     // ja percorre os graus 1, 2 e 3; empilhar compra tempo no topo

  // os cinco graus: de quanto em quanto a faixa rica troca, quanto vale a moeda
  // comum e a rica, de quantos em quantos passos vem um item, e o desenho do caminho
  const GRAUS = [
    { troca: 8, comum: 2, rica: 5,  item: 24, forma: 'simples', nome: 'jet_g1', cor: '#9be7ff' },
    { troca: 6, comum: 3, rica: 8,  item: 18, forma: 'rampa',   nome: 'jet_g2', cor: '#9be7ff' },
    { troca: 4, comum: 4, rica: 12, item: 14, forma: 'coluna',  nome: 'jet_g3', cor: '#7cff6b' },
    { troca: 3, comum: 6, rica: 18, item: 11, forma: 'ambos',   nome: 'jet_g4', cor: '#ff9d1c' },
    { troca: 2, comum: 9, rica: 26, item: 9,  forma: 'cheio',   nome: 'jet_g5', cor: '#ffcf4a' }
  ];
  const ITENS = [['magnet', '#ffcf4a'], ['shield', '#4cf0ff'], ['star', '#ffe27a']];
  // pontos por moeda rica, por grau (a comum vale um quarto). Um arco normal vale 1 ponto,
  // entao um corredor de grau 1 a 3 rende mais ou menos o dobro de uma fase curta.
  const PONTOS = [0.35, 0.5, 0.8, 1.2, 2.0];

  const G = HR.Game && HR.Game.prototype;
  if (!G) return;

  const grauDe = passo => Math.min(GRAUS.length - 1, Math.floor(passo / SOBE_A_CADA));

  /* ---------------- ligar o jato abre (ou estende) o corredor ---------------- */
  const origUseJet = G.useJet;
  G.useJet = function (kind) {
    const run = this.run, g = HR.GEAR.consumables[kind];
    if (!g) return false;

    // ja esta voando: gasta mais um e estende, ate cinco no total
    if (run.jetLeft > 0) {
      if ((run.jetStacks || 1) >= MAX_PILHA) {
        this.emit('banner', { title: HR.t('jet_full'), color: '#8d97b3' });
        return false;
      }
      if (!HR.Consumables.use(kind)) return false;
      const add = PASSOS[kind] || 62;
      run.jetLeft += add; run.jetTotal = (run.jetTotal || 0) + add;
      run.jetStacks = (run.jetStacks || 1) + 1;
      run.jetsUsed++;
      HR.Store.data.stats5[kind === 'megajet' ? 'megajetsUsed' : 'jetsUsed']++; HR.Store.save();
      this.jetSurge(run.jetStacks);
      this.emit('banner', { title: HR.t('jet_stack', { n: run.jetStacks }), sub: HR.t('jet_stack_d'), color: '#ffcf4a' });
      this.emit('gear', { kind: 'jet' });
      return true;
    }

    const ok = origUseJet.apply(this, arguments);
    if (!ok) return ok;
    // o corredor comeca limpo: os arcos que ja estavam a frente voltam para a fila
    this.rings = []; this.obstacles = []; this.pickups = [];
    this.pendingDir = null; this.lastRing = null; this.lastPickupRing = -99;
    run.ringsSpawned = 0;
    this.nextX = this.Lu + 260;
    this.jetStep = 0;
    run.jetLeft = run.jetTotal = PASSOS[kind] || 62;
    run.jetStacks = 1; run.jetGrau = -1; run.jetCoins = 0; run.jetOffLane = false;
    run.jetScore = 0; run.jetScoreAcc = 0; run.jetStreak = 0; run.jetSurgeT = 0;
    this.jetSurge(1);                     // o primeiro tambem empurra a tela
    this.emit('gear', { kind: 'jet' });   // redesenha o selo ja com 1/5
    return ok;
  };

  /* ---------------- dentro do corredor, quem pilota e a pessoa ---------------- */
  // O jato mantem o piloto automatico ligado (e ele que segura a bola nos arcos
  // normais). No corredor nao ha arco, entao o piloto nao mira em nada e a bola
  // travava. Aqui a mira passa a ser a FAIXA escolhida, e o resto da fisica de
  // sempre leva a bola ate la com o mesmo deslize macio.
  const origUpdateBall = G.updateBall;
  G.updateBall = function (sdt, dt) {
    const run = this.run;
    if (run.jetLeft > 0 && (this.state === 'playing' || this.state === 'ready')) {
      try { this.jetLaneControl(dt); } catch (_) { /* nunca derruba o quadro */ }
    } else if (run.jetLane != null) run.jetLane = null;
    return origUpdateBall.apply(this, arguments);
  };

  G.jetStepLane = function (passo) {
    const run = this.run, antes = run.jetLane;
    run.jetLane = Math.max(0, Math.min(2, (run.jetLane == null ? 1 : run.jetLane) + passo));
    if (run.jetLane !== antes) {
      HR.Audio.sfx('tick'); HR.U.vibrate(8);
      this.particles.burst({
        x: this.ball.x - this.ball.r, y: this.ball.y, n: 6, speed: 180,
        angle: passo > 0 ? Math.PI / 2 : -Math.PI / 2, spread: 0.8,
        color: ['#ffffff', HR.Gear.current('jet').color2 || '#ffffff'], size: 3, life: 0.3, type: 'spark'
      });
    }
  };

  G.jetLaneControl = function (dt) {
    const I = HR.Input, b = this.ball, run = this.run, V = this.vAxis();
    if (run.jetLane == null) {
      // comeca na faixa mais perto de onde a bola ja esta
      let melhor = 1, dist = 1e9;
      FAIXAS.forEach((f, i) => { const d = Math.abs(b.y - this.Lv * f); if (d < dist) { dist = d; melhor = i; } });
      run.jetLane = melhor;
      this._jUp = this._jDown = this._jSU = this._jSD = false; this._jAcc = 0;
    }

    // teclado: um passo por toque, nao por quadro
    const cima = !!I.keys.up, baixo = !!I.keys.down;
    if (cima && !this._jUp) this.jetStepLane(-1);
    if (baixo && !this._jDown) this.jetStepLane(1);
    this._jUp = cima; this._jDown = baixo;

    // analogico do celular: inclinar um pouco ja troca de faixa (e solta para trocar de novo)
    const S = I.stick, m = Math.hypot(S.x, S.y);
    const sv = S.active && m > 0.05 ? (S.x * V.x + S.y * V.y) : 0;
    if (sv > 0.40 && !this._jSD) { this.jetStepLane(1); this._jSD = true; }
    if (sv < -0.40 && !this._jSU) { this.jetStepLane(-1); this._jSU = true; }
    if (Math.abs(sv) < 0.20) { this._jSU = this._jSD = false; }

    // arrasto (modos que usam deslocamento): acumula ate dar um passo
    const d = I.consumeDelta2();
    const dv = d.dx * V.x + d.dy * V.y;
    this._jAcc = (this._jAcc || 0) + dv;
    if (this._jAcc > 24) { this.jetStepLane(1); this._jAcc = 0; }
    else if (this._jAcc < -24) { this.jetStepLane(-1); this._jAcc = 0; }
    else this._jAcc *= Math.exp(-4 * dt);

    b.ty = this.Lv * FAIXAS[run.jetLane];
  };

  /* ---------------- o impulso: onda, tremida, risco e velocidade ---------------- */
  // cada jato novo empurra a tela de novo. A sensacao importa tanto quanto o numero:
  // sem isso, empilhar parecia so gastar dinheiro.
  G.jetSurge = function (n) {
    const run = this.run, b = this.ball, sk = HR.Gear.current('jet');
    const cor = sk.color === 'rainbow' ? '#ff5ecf' : sk.color;
    run.jetSurgeT = 1;                       // vai a zero em ~1,2 s
    this.shake = Math.max(this.shake, 10 + n * 2);
    this.particles.burst({ x: b.x, y: b.y, n: 1, speed: 0, color: '#ffffff', size: 40 + n * 10, life: 0.55, type: 'wave' });
    this.particles.burst({ x: b.x, y: b.y, n: 1, speed: 0, color: cor, size: 26 + n * 8, life: 0.7, type: 'wave' });
    this.particles.burst({
      x: b.x - b.r, y: b.y, n: 22 + n * 6, speed: 620, angle: Math.PI, spread: 0.55,
      color: [cor, sk.color2 || '#ffffff', '#ffffff'], size: 5, life: 0.5, type: 'spark'
    });
    this.particles.text(b.x, b.y - 60, '+' + n, '#ffcf4a', 26);
    HR.Audio.sfx('levelup'); HR.U.vibrate([18, 30, 50]);
  };

  // enquanto o impulso dura, o corredor corre mais rapido de verdade
  const origSpeedAt = G.speedAt;
  G.speedAt = function (n, base) {
    const v = origSpeedAt.apply(this, arguments);
    const run = this.run;
    if (!base && run && run.jetLeft > 0 && run.jetSurgeT > 0) return v * (1 + run.jetSurgeT * 0.45);
    return v;
  };

  /* ---------------- o corredor acaba por distancia ---------------- */
  const origUpdAb = G.updateAbilities;
  G.updateAbilities = function (dt) {
    const run = this.run;
    if (run.jetSurgeT > 0) run.jetSurgeT = Math.max(0, run.jetSurgeT - dt / 1.2);
    if (run.jetLeft > 0) {
      const v = this.speedAt(run.ringsPassed) * this.timeScale;   // ja inclui a velocidade do jato
      run.jetLeft = Math.max(0, run.jetLeft - (v * dt) / PASSO);
      if (run.jetLeft <= 0) this.endJet();
    }
    return origUpdAb.apply(this, arguments);
  };

  /* ---------------- enquanto voa, nada de arco ---------------- */
  const origFill = G.fill;
  G.fill = function () {
    if (this.run.jetLeft > 0 && !this.demo) return this.fillJetTrack();
    return origFill.apply(this, arguments);
  };

  G.fillJetTrack = function () {
    const U = HR.U, run = this.run, K = HR.CONFIG.PICKUP;
    let guarda = 0;
    while (this.nextX < this.Lu + 760 && guarda++ < 40) {
      const passo = this.jetStep = (this.jetStep || 0) + 1;
      const ig = grauDe(passo + 3);            // o que nasce agora sera visto daqui a pouco
      const F = GRAUS[ig];
      const rica = Math.floor(passo / F.troca) % 3;

      // aviso curto quando o corredor sobe de grau
      if (ig !== run.jetGrau) {
        run.jetGrau = ig;
        if (ig > 0) {
          this.emit('banner', { title: HR.t(F.nome), sub: HR.t('jet_grau', { n: ig + 1 }), color: F.cor });
          HR.Audio.sfx('levelup');
        }
      }

      const moeda = (ehRica, y, cor) => this.pickups.push({
        x: this.nextX, y, baseY: y, r: ehRica ? 16 : 14, id: 'coins',
        val: ehRica ? F.rica : F.comum, color: cor || (ehRica ? '#ffcf4a' : '#cfe0ff'),
        seed: U.rand(0, 6.28), taken: false, jet: true, rica: ehRica
      });

      // item de ajuda, sempre na faixa rica
      if (passo % F.item === Math.floor(F.item / 2)) {
        const it = ITENS[Math.floor(passo / F.item) % ITENS.length], y = this.Lv * FAIXAS[rica];
        this.pickups.push({ x: this.nextX, y, baseY: y, r: K.r || 16, id: it[0], color: it[1], seed: U.rand(0, 6.28), taken: false, jet: true });
        this.nextX += PASSO; continue;
      }

      const coluna = (F.forma === 'coluna' || F.forma === 'ambos') && passo % 5 === 0;
      const rampa = (F.forma === 'rampa' || F.forma === 'ambos') && passo % F.troca === F.troca - 1;

      if (F.forma === 'cheio' || coluna) {
        for (let i = 0; i < 3; i++) moeda(i === rica, this.Lv * FAIXAS[i]);
      } else if (rampa) {
        // uma rampa ligando a faixa rica de agora a proxima: mostra para onde ir
        const prox = Math.floor((passo + 1) / F.troca) % 3;
        const y0 = this.Lv * FAIXAS[rica], y1 = this.Lv * FAIXAS[prox];
        for (let k = 0; k < 3; k++) {
          const y = y0 + (y1 - y0) * (k / 2);
          this.pickups.push({ x: this.nextX + k * (PASSO / 3), y, baseY: y, r: 14, id: 'coins', val: F.comum, color: '#9be7ff', seed: U.rand(0, 6.28), taken: false, jet: true, rica: true });
        }
      } else {
        for (let i = 0; i < 3; i++) {
          const ehRica = i === rica;
          if (!ehRica && passo % 2 === 0) continue;
          moeda(ehRica, this.Lv * FAIXAS[i]);
        }
      }
      this.nextX += PASSO;
    }
  };

  /* ---------------- ao acabar, os arcos voltam do comeco ---------------- */
  const origEndJet = G.endJet;
  G.endJet = function () {
    const r = origEndJet.apply(this, arguments);
    // distancia de respiro: o primeiro arco nao pode nascer em cima da bola
    this.nextX = Math.max(this.nextX, this.Lu + 320);
    this.pickups = this.pickups.filter(p => !p.jet || p.x > this.ball.x);
    const run = this.run, d = HR.Store.data;
    d.stats5 = d.stats5 || {};
    if (run.jetCoins >= 20 && !run.jetOffLane) d.stats5.jetGoldRuns = (d.stats5.jetGoldRuns || 0) + 1;
    if ((run.jetGrau || 0) >= 4) d.stats5.jetMaxGrade = (d.stats5.jetMaxGrade || 0) + 1;
    HR.Store.save();
    if (run.jetScore > 0) this.emit('banner', { title: HR.t('jet_done', { n: run.jetScore }), sub: HR.t('jet_done_d', { n: run.jetCoins }), color: '#ffcf4a' });
    run.jetCoins = 0; run.jetOffLane = false; run.jetStacks = 0; run.jetGrau = -1;
    run.jetScore = 0; run.jetScoreAcc = 0; run.jetStreak = 0; run.jetSurgeT = 0;
    run.jetLane = null; this.ball.ty = this.ball.y;
    return r;
  };

  /* ---------------- quem fica so na faixa rica ganha uma conquista ---------------- */
  const origCollect = G.collect;
  G.collect = function (p) {
    if (p && p.jet && p.id === 'coins') {
      const run = this.run;
      run.jetCoins = (run.jetCoins || 0) + 1;
      if (!p.rica) run.jetOffLane = true;

      // sequencia: so cresce na faixa rica, e zera ao sair dela
      run.jetStreak = p.rica ? Math.min(30, (run.jetStreak || 0) + 1) : 0;
      const mult = 1 + Math.min(2, (run.jetStreak || 0) / 15);          // ate x3
      const base = PONTOS[Math.max(0, Math.min(4, run.jetGrau || 0))] * (p.rica ? 1 : 0.25);
      run.jetScoreAcc = (run.jetScoreAcc || 0) + base * mult;
      if (run.jetScoreAcc >= 1) {
        const ganho = Math.floor(run.jetScoreAcc);
        run.jetScoreAcc -= ganho;
        run.score += ganho;
        run.jetScore = (run.jetScore || 0) + ganho;
        this.emit('score', run, false);
      }
      if (run.jetStreak && run.jetStreak % 10 === 0) {
        this.particles.text(p.x, p.y - 52, 'x' + mult.toFixed(1), '#ffcf4a', 20);
      }
    }
    return origCollect.apply(this, arguments);
  };

  /* ---------------- as tres faixas ficam visiveis ---------------- */
  const origRender = G.render;
  G.render = function () {
    origRender.apply(this, arguments);
    if (this.run && this.run.jetLeft > 0 && this.state !== 'idle') {
      try { this.drawJetLanes(this.ctx); } catch (_) { /* nunca derruba o quadro */ }
    }
  };

  G.drawJetLanes = function (ctx) {
    const U = HR.U, run = this.run;
    const F = GRAUS[Math.max(0, run.jetGrau || 0)];
    const sk = HR.Gear.current('jet');
    const cor = sk.color === 'rainbow' ? U.hsl((this.time * 200) % 360, 90, 65, 1) : F.cor;
    const desl = (this.time * 260) % 34;
    const forca = 0.12 + (run.jetGrau || 0) * 0.055 + (run.jetSurgeT || 0) * 0.5;
    ctx.save();
    ctx.translate(this.frame.ox, this.frame.oy); ctx.rotate(this.frame.angle);
    ctx.lineCap = 'round';
    ctx.setLineDash([12, 22]); ctx.lineDashOffset = -desl;
    for (let i = 0; i < 3; i++) {
      const y = this.Lv * FAIXAS[i];
      ctx.strokeStyle = U.rgba(cor, forca);
      ctx.lineWidth = 2 + (run.jetGrau || 0) * 0.5;
      ctx.beginPath(); ctx.moveTo(-40, y); ctx.lineTo(this.Lu + 80, y); ctx.stroke();
    }
    ctx.setLineDash([]);
    // riscos de velocidade durante o impulso
    if (run.jetSurgeT > 0) {
      const s = run.jetSurgeT;
      ctx.strokeStyle = U.rgba('#ffffff', 0.45 * s); ctx.lineWidth = 2;
      for (let i = 0; i < 14; i++) {
        const y = ((i * 97 + this.time * 90) % 1) * 0 + (i + 0.5) * (this.Lv / 14);
        const x0 = this.Lu - ((this.time * 2600 + i * 211) % (this.Lu + 400));
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 - 60 - s * 120, y); ctx.stroke();
      }
    }
    ctx.restore();
  };

  HR.JetTrack = { PASSOS, MAX_PILHA, GRAUS, SOBE_A_CADA, PASSO, grauDe };
})();

/* ---------------- texto ---------------- */
Object.assign(HR.I18N.pt, {
  jet_track: 'Corredor aberto: escolha a faixa e colha',
  jet_grau: 'Grau {n} de 5',
  jet_g1: 'SUBIDA', jet_g2: 'CORRENTE', jet_g3: 'ENXAME', jet_g4: 'TURBILHÃO', jet_g5: 'CHUVA DE OURO',
  jet_stack: 'CORREDOR +{n}', jet_stack_d: 'Mais tempo lá em cima',
  jet_full: 'O corredor já está no limite (5)',
  jet_done: 'CORREDOR: +{n} PONTOS', jet_done_d: '{n} moedas colhidas',
  a_jetgold: 'Faixa de ouro', a_d_jetGoldRuns: 'Termine {n} corredores só na faixa rica',
  a_jetgrade: 'Chuva de ouro', a_d_jetMaxGrade: 'Chegue ao grau 5 do corredor {n} vezes'
});
Object.assign(HR.I18N.en, {
  jet_track: 'Corridor open: pick a lane and collect',
  jet_grau: 'Grade {n} of 5',
  jet_g1: 'CLIMB', jet_g2: 'CURRENT', jet_g3: 'SWARM', jet_g4: 'WHIRL', jet_g5: 'GOLD RAIN',
  jet_stack: 'CORRIDOR +{n}', jet_stack_d: 'More time up there',
  jet_full: 'The corridor is already at the limit (5)',
  jet_done: 'CORRIDOR: +{n} POINTS', jet_done_d: '{n} coins collected',
  a_jetgold: 'Golden lane', a_d_jetGoldRuns: 'Finish {n} corridors on the rich lane only',
  a_jetgrade: 'Gold rain', a_d_jetMaxGrade: 'Reach corridor grade 5 {n} times'
});
Object.assign(HR.I18N.es, {
  jet_track: 'Pasillo abierto: elige el carril y recoge',
  jet_grau: 'Grado {n} de 5',
  jet_g1: 'SUBIDA', jet_g2: 'CORRIENTE', jet_g3: 'ENJAMBRE', jet_g4: 'TORBELLINO', jet_g5: 'LLUVIA DE ORO',
  jet_stack: 'PASILLO +{n}', jet_stack_d: 'Más tiempo allá arriba',
  jet_full: 'El pasillo ya está al límite (5)',
  jet_done: 'PASILLO: +{n} PUNTOS', jet_done_d: '{n} monedas recogidas',
  a_jetgold: 'Carril dorado', a_d_jetGoldRuns: 'Termina {n} pasillos solo por el carril rico',
  a_jetgrade: 'Lluvia de oro', a_d_jetMaxGrade: 'Llega al grado 5 del pasillo {n} veces'
});
