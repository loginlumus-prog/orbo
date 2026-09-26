/* =====================================================================
   ORBO v9 — o Infinito ganha teto, alertas e saida.

   1) O TETO. A cada volta pelas fases o arco encolhia 4 % e o intervalo
      5 %, sem limite. Aos 20 minutos o arco tinha metade do tamanho e o
      dobro da densidade: nao era mais dificil, era ilegivel — e no
      celular, era onde o jogo engasgava. Agora a escalada para na 4a
      volta (arco ~270, uns 5 minutos). Dali em diante o Infinito e rapido
      e dificil, mas estavel: quem chegou, fica pelo que sabe fazer.
      Os impulsos (Jato, Cometa, Dobra) tambem ganham um limite menor.

   2) OS ALERTAS. Com a build certa o Infinito se joga sozinho, e so a
      Anomalia pedia a pessoa. Agora sao quatro, e todos desligam o
      piloto automatico enquanto duram:
        Anomalia   um arco imune a poderes, longe da bola   (ja existia)
        Corrente   tres arcos imunes em zigue-zague
        Rasante    uma faixa vermelha marca a sua altura; saia antes
                   do meteoro
        Pane       piloto e fantasma desligam por 6 segundos
      Do arco 60 ao 100 so a Anomalia. Do 100 em diante, os quatro. No
      teto, eles vem mais seguidos.

   3) ENCERRAR E RECEBER. O Infinito e onde se junta moeda, e nao havia
      como parar com dignidade: "Menu" encerrava calado. Agora a pausa do
      Infinito tem "Encerrar e receber", que leva a tela de resultado.

   Tudo por embrulho. game.js nao e tocado.
   ===================================================================== */
(function () {
  if (!HR.Game || !HR.Game.prototype) return;
  const G = HR.Game.prototype, C = HR.CONFIG;

  const TETO = {
    voltas: 4,          // a escalada para aqui (arco ~270)
    impulso: 1.55,      // teto dos impulsos, em multiplos de maxSpeed (era 1,9)
    // alertas: intervalo em segundos [antes do 100, do 100 ao teto, no teto]
    cada: [[75, 15], [45, 8], [32, 6]],
    deAlertas: 100
  };
  HR.TETO = TETO;

  /* ---------------- 1) o teto ---------------- */
  const origPhaseAt = G.phaseAt;
  G.phaseAt = function (n) {
    const r = origPhaseAt.apply(this, arguments);
    if (r && r.loops > TETO.voltas) r.loops = TETO.voltas;
    return r;
  };
  function arcoDoTeto() {
    const R = C.RUN, P = C.PHASES.length;
    return (P + (P - R.loopFrom) * (TETO.voltas - 1)) * R.ringsPerPhase;
  }
  HR.TETO.arco = arcoDoTeto;

  const origSpeedAt = G.speedAt;
  G.speedAt = function (n, base) {
    const v = origSpeedAt.apply(this, arguments);
    if (!this.run || this.run.level) return v;   // so o Infinito: a Galaxia tem a curva dela
    const lim = C.RUN.maxSpeed * TETO.impulso;
    return v > lim ? lim : v;
  };

  /* ---------------- 2) os alertas ---------------- */
  const vinheta = (cls, ms) => {
    const v = document.getElementById('fx-vignette'); if (!v) return;
    v.classList.add(cls); setTimeout(() => v.classList.remove(cls), ms);
  };
  const s5 = () => { const d = HR.Store.data; d.stats5 = d.stats5 || {}; return d.stats5; };

  const origPrepare = G.prepareRun;
  G.prepareRun = function () {
    const r = origPrepare.apply(this, arguments);
    this.alerta = null; this.alertaT = 0; this.alertaUlt = null; this.correnteLeft = 0; this.correnteIdx = 0;
    if (this.run) this.run.tetoVisto = false;
    return r;
  };

  function intervalo(g) {
    const n = g.run.ringsPassed, k = n >= arcoDoTeto() ? 2 : n >= TETO.deAlertas ? 1 : 0;
    const c = TETO.cada[k];
    return c[0] + HR.U.rand(-c[1], c[1]);
  }

  function escolhe(g) {
    const run = g.run;
    if (run.ringsPassed < TETO.deAlertas) return 'anomalia';
    const auto = !!(run.mods && (run.mods.autoflow || run.mods.intangible));
    const pool = [['anomalia', 1], ['corrente', 1], ['rasante', 1.2]];
    if (auto) pool.push(['pane', 1.1]);
    const ok = pool.filter(p => p[0] !== g.alertaUlt);
    let tot = 0; ok.forEach(p => { tot += p[1]; });
    let r = Math.random() * tot;
    for (const p of ok) { r -= p[1]; if (r <= 0) return p[0]; }
    return ok[0][0];
  }

  function dispara(g, id) {
    g.alertaUlt = id;
    const run = g.run;
    if (id === 'anomalia') {
      // a de sempre: o proprio jogo cuida do aviso e do arco
      g.anomalyPending = true;
      HR.Audio.sfx('alarm');
      g.emit('anomaly', { phase: 'warn' });
      return;
    }
    HR.Audio.sfx('alarm');
    HR.U.vibrate([30, 40, 30]);
    if (id === 'corrente') {
      g.correnteLeft = 3; g.correnteIdx = 0; g.correnteOk = 0; g.anomalyPending = true;
      g.emit('banner', { title: HR.t('al_corrente'), sub: HR.t('al_corrente_d'), color: '#ff3d2e' });
      vinheta('anomaly', 2600);
      return;
    }
    if (id === 'rasante') {
      const golpes = run.ringsPassed >= arcoDoTeto() ? 2 : 1;
      g.alerta = { id, suspende: true, fase: 'aviso', t: 0, aviso: 1.6, v: g.ball.y, golpes, feitos: 0, mx: 0, acertou: false };
      g.emit('banner', { title: HR.t('al_rasante'), sub: HR.t('al_rasante_d'), color: '#ff5e3d' });
      vinheta('anomaly', 1600);
      return;
    }
    if (id === 'pane') {
      g.alerta = { id, suspende: true, t: 0, dur: 6, apanhou: false };
      g.emit('banner', { title: HR.t('al_pane'), sub: HR.t('al_pane_d'), color: '#9aa6c9' });
      vinheta('pane', 6000);
    }
  }

  function atualiza(g, dt) {
    const a = g.alerta, run = g.run, b = g.ball, P = g.particles;
    if (!a) return;
    a.t += dt;
    if (a.id === 'pane') {
      if (a.t >= a.dur) {
        g.alerta = null;
        if (!a.apanhou) {
          g.addCoins(15, b.x, b.y - 30);
          P.text(b.x, b.y - 70, HR.t('al_pane_ok'), '#cfd8ff', 24);
          s5().panes = (s5().panes || 0) + 1;
        }
        HR.Audio.sfx('whoosh');
      }
      return;
    }
    if (a.id === 'rasante') {
      const meia = b.r * 1.6 + 18;
      if (a.fase === 'aviso') {
        if (a.t >= a.aviso) { a.fase = 'golpe'; a.t = 0; a.mx = g.Lu + 120; a.passou = false; HR.Audio.sfx('whoosh'); }
        return;
      }
      // o meteoro atravessa a tela em ~0,3 s
      const vel = (g.Lu + 240) / 0.3;
      const antes = a.mx;
      a.mx -= vel * dt;
      if (!a.passou && antes >= b.x && a.mx < b.x) {
        a.passou = true;
        const dentro = Math.abs(b.y - a.v) < meia + b.r * 0.4;
        if (dentro && !(run.invuln > 0)) {
          a.acertou = true;
          g.shake = 12;
          P.burst({ x: b.x, y: b.y, n: 30, speed: 480, color: ['#ff3d2e', '#ff8a3d', '#ffffff'], size: 7, life: 0.8, type: 'spark', drag: 0.93 });
          g.damage(null, true);   // como a Anomalia: escudo nao segura, vai direto na vida
        } else if (!dentro) {
          P.text(b.x, b.y - 70, HR.t('al_rasante_ok'), '#ff8a3d', 24);
          g.addCoins(10, b.x, b.y - 30);
          run.score += 3;
          s5().rasantes = (s5().rasantes || 0) + 1;
          HR.U.vibrate(15);
        }
      }
      if (a.mx < -140) {
        a.feitos++;
        if (a.feitos < a.golpes && g.state === 'playing') {
          // o segundo golpe mira de novo: ficar parado depois de desviar tambem custa
          a.fase = 'aviso'; a.t = 0; a.aviso = 1.1; a.v = b.y; a.passou = false;
          HR.Audio.sfx('alarm');
        } else g.alerta = null;
      }
    }
  }

  // o agendador: substitui o da Anomalia (mesmas regras de quando nao disparar)
  G.updateAnomaly = function (dt) {
    const run = this.run, A = C.ANOMALY;
    this.alertaCorre = false;   // o relogio do proximo alerta esta andando? (o aviso do piloto le isto)
    run.anomalyActive = this.rings.some(r => r.type === 'anomaly' && !r.resolved);
    if (this.alerta) {
      atualiza(this, dt);
      if (this.alerta && this.alerta.suspende) run.anomalyActive = true;
    }
    if (run.mode !== 'endless' || run.ringsPassed < A.fromRing || this.event || this.pendingEvent) return;
    // o teto: um aviso, uma vez por corrida
    if (!run.tetoVisto && run.ringsPassed >= arcoDoTeto()) {
      run.tetoVisto = true;
      this.emit('banner', { title: HR.t('teto_t'), sub: HR.t('teto_d'), color: '#ffcf4a' });
      const d = s5(); d.tetos = (d.tetos || 0) + 1;
    }
    if (!this.alertaT) this.alertaT = A.every * 0.5;
    if (run.anomalyActive || this.anomalyPending || this.alerta || this.correnteLeft > 0) return;
    this.alertaCorre = true;
    this.alertaT -= dt;
    if (this.alertaT <= 0) {
      dispara(this, escolhe(this));
      this.alertaT = intervalo(this);
    }
  };

  // Corrente: tres Anomalias seguidas, em zigue-zague, com um respiro a mais entre elas
  const origType = G.ringTypeFor;
  G.ringTypeFor = function () {
    const t = origType.apply(this, arguments);
    if (t === 'anomaly' && this.correnteLeft > 0) {
      this.correnteLeft--;
      this.correnteMarca = true;
      if (this.correnteLeft > 0) this.anomalyPending = true;
    }
    return t;
  };
  const origSpawn = G.spawnRing;
  G.spawnRing = function () {
    this.correnteMarca = false;
    const r = origSpawn.apply(this, arguments);
    if (this.correnteMarca && this.lastRing && this.lastRing.type === 'anomaly') {
      const ring = this.lastRing, R = C.RUN;
      const minY = R.marginY + ring.r + ring.osc, maxY = this.Lv - R.marginY - ring.r - ring.osc;
      const alto = (this.correnteIdx++ % 2) === 0;
      const y = HR.U.clamp(alto ? this.Lv * 0.24 : this.Lv * 0.76, minY, maxY);
      ring.baseY = ring.y = y; this.lastY = y; ring.corrente = true;
      const passo = this.nextX - ring.x;
      if (passo > 0) this.nextX += passo * 0.4;
    }
    this.correnteMarca = false;
    return r;
  };
  const origPassAnomaly = G.passAnomaly;
  G.passAnomaly = function (r) {
    const out = origPassAnomaly.apply(this, arguments);
    if (r && r.corrente) this.correnteOk = (this.correnteOk || 0) + 1;
    if (r && r.corrente && this.correnteOk === 3) {
      const d = s5(); d.correntes = (d.correntes || 0) + 1;
      this.particles.text(this.ball.x, this.ball.y - 100, HR.t('al_corrente_ok'), '#ff8a3d', 26);
      this.addCoins(20, this.ball.x, this.ball.y - 40);
    }
    return out;
  };

  // Pane: sem piloto e sem fantasma, nem os de perk nem os de habilidade
  const origAbil = G.updateAbilities;
  G.updateAbilities = function () {
    const r = origAbil.apply(this, arguments);
    if (this.alerta && this.alerta.id === 'pane') { this.run.ghostT = 0; this.run.autoT = 0; }
    return r;
  };
  const origDamage = G.damage;
  G.damage = function () {
    if (this.alerta && this.alerta.id === 'pane') this.alerta.apanhou = true;
    return origDamage.apply(this, arguments);
  };

  /* ---------------- o desenho dos alertas ---------------- */
  const FORA = { idle: 1, over: 1, levelend: 1, revive: 1 };
  const origRender = G.render;
  G.render = function () {
    origRender.apply(this, arguments);
    const a = this.alerta;
    if (!a || FORA[this.state]) return;
    const ctx = this.ctx;
    if (a.id === 'pane') { desenhaPane(this, a, ctx); return; }
    if (a.id !== 'rasante') return;
    ctx.save();
    ctx.translate(this.frame.ox, this.frame.oy);
    ctx.rotate(this.frame.angle);
    const b = this.ball, meia = b.r * 1.6 + 18, L = this.Lu;
    if (a.fase === 'aviso') {
      const k = Math.min(1, a.t / a.aviso);
      const pisca = 0.5 + 0.5 * Math.sin(this.time * 14);
      ctx.fillStyle = 'rgba(255,61,46,' + (0.07 + 0.06 * pisca).toFixed(3) + ')';
      ctx.fillRect(-60, a.v - meia, L + 120, meia * 2);
      // o relogio: a faixa enche da direita para a esquerda
      ctx.fillStyle = 'rgba(255,61,46,0.16)';
      ctx.fillRect(L + 60 - (L + 120) * k, a.v - meia, (L + 120) * k, meia * 2);
      ctx.strokeStyle = 'rgba(255,94,61,0.85)'; ctx.lineWidth = 2;
      ctx.setLineDash([14, 10]); ctx.lineDashOffset = -this.time * 60;
      ctx.beginPath(); ctx.moveTo(-60, a.v - meia); ctx.lineTo(L + 60, a.v - meia); ctx.moveTo(-60, a.v + meia); ctx.lineTo(L + 60, a.v + meia); ctx.stroke();
      ctx.setLineDash([]);
      // setas na borda de entrada
      ctx.fillStyle = 'rgba(255,94,61,' + (0.6 + 0.4 * pisca).toFixed(3) + ')';
      const x0 = L - 26;
      for (let i = 0; i < 2; i++) {
        const x = x0 - i * 22;
        ctx.beginPath(); ctx.moveTo(x + 10, a.v - 11); ctx.lineTo(x - 4, a.v); ctx.lineTo(x + 10, a.v + 11); ctx.closePath(); ctx.fill();
      }
    } else if (a.fase === 'golpe') {
      const x = a.mx, y = a.v, cauda = 260;
      const gr = ctx.createLinearGradient(x, y, x + cauda, y);
      gr.addColorStop(0, 'rgba(255,240,220,0.95)'); gr.addColorStop(0.25, 'rgba(255,138,61,0.7)'); gr.addColorStop(1, 'rgba(255,61,46,0)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.moveTo(x, y - 13); ctx.lineTo(x + cauda, y - 3); ctx.lineTo(x + cauda, y + 3); ctx.lineTo(x, y + 13); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,138,61,0.35)';
      ctx.beginPath(); ctx.arc(x, y, 26, 0, 6.283); ctx.fill();
      ctx.fillStyle = '#fff3e0';
      ctx.beginPath(); ctx.arc(x, y, 13, 0, 6.283); ctx.fill();
      ctx.strokeStyle = '#ff8a3d'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y, 13, 0, 6.283); ctx.stroke();
    }
    ctx.restore();
  };
  function desenhaPane(g, a, ctx) {
    // uma barra fina no alto conta os 6 segundos; nada de texto piscando
    const W = g.W, k = Math.max(0, 1 - a.t / a.dur);
    ctx.save();
    ctx.fillStyle = 'rgba(154,166,201,0.18)'; ctx.fillRect(0, 0, W, 5);
    ctx.fillStyle = 'rgba(207,216,255,0.85)'; ctx.fillRect(0, 0, W * k, 5);
    ctx.restore();
  }

  /* ---------------- conquistas dos alertas ---------------- */
  if (HR.ACHIEVEMENTS) {
    const add = (id, stat, target, gems, icon) => { if (!HR.ACHIEVEMENTS.some(a => a.id === id)) HR.ACHIEVEMENTS.push({ id, cat: 'flight', stat, target, gems, icon }); };
    add('al_rasante', 'al_rasante', 25, 40, 'comet');
    add('al_corrente', 'al_corrente', 10, 40, 'orbit');
    add('al_pane', 'al_pane', 10, 40, 'chip');
    add('al_teto', 'al_teto', 1, 60, 'crown');
  }
  if (HR.Achievements && typeof HR.Achievements.stats5 === 'function') {
    const orig = HR.Achievements.stats5;
    HR.Achievements.stats5 = function () {
      const out = orig.apply(this, arguments), d = s5();
      out.al_rasante = d.rasantes || 0; out.al_corrente = d.correntes || 0; out.al_pane = d.panes || 0; out.al_teto = d.tetos || 0;
      return out;
    };
  }

  /* ---------------- 3) encerrar e receber ---------------- */
  function botaoEncerrar() {
    const pausa = document.querySelector('#screen-pause .card-menu'), ref = document.getElementById('btn-restart');
    if (!pausa || !ref || document.getElementById('btn-cashout')) return;
    const b = document.createElement('button');
    b.className = 'btn btn-ghost btn-cashout'; b.id = 'btn-cashout';
    b.innerHTML = '<span class="ic">' + HR.icon('coins') + '</span><span class="btn-label">' + HR.t('cashout') + '</span>';
    ref.parentNode.insertBefore(b, ref);
    b.addEventListener('click', () => {
      const g = HR.game; if (!g || !g.run || g.run.mode !== 'endless') return;
      HR.Audio.sfx('reward');
      HR.UI.hideScreen('pause');
      g.alerta = null;
      g.run.cashout = true;
      g.finishRun(false);
    });
  }
  if (HR.UI && HR.UI.pause) {
    const origPause = HR.UI.pause;
    HR.UI.pause = function () {
      const r = origPause.apply(this, arguments);
      botaoEncerrar();
      const b = document.getElementById('btn-cashout'), g = HR.game;
      if (b) {
        const ok = !!(g && g.run && g.run.mode === 'endless' && g.run.ringsPassed > 0);
        b.style.display = ok ? '' : 'none';
        const lab = b.querySelector('.btn-label'); if (lab) lab.textContent = HR.t('cashout');
      }
      return r;
    };
  }
})();

Object.assign(HR.I18N.pt, {
  teto_t: 'VELOCIDADE MÁXIMA', teto_d: 'Daqui não acelera mais. Agora é você.',
  al_corrente: 'CORRENTE', al_corrente_d: 'Três arcos imunes em zigue-zague',
  al_corrente_ok: 'CORRENTE QUEBRADA',
  al_rasante: 'RASANTE', al_rasante_d: 'Saia da faixa vermelha antes do meteoro',
  al_rasante_ok: 'DESVIOU',
  al_pane: 'PANE', al_pane_d: 'Piloto e fantasma desligados por 6 s',
  al_pane_ok: 'SEGUROU A PANE',
  cashout: 'Encerrar e receber',
  a_al_rasante: 'Olho no céu', a_d_al_rasante: 'Desvie de 25 Rasantes no Infinito.',
  a_al_corrente: 'Elo por elo', a_d_al_corrente: 'Quebre 10 Correntes no Infinito.',
  a_al_pane: 'Mão firme', a_d_al_pane: 'Atravesse 10 Panes sem levar dano.',
  a_al_teto: 'No teto', a_d_al_teto: 'Chegue à velocidade máxima do Infinito.'
});
Object.assign(HR.I18N.en, {
  teto_t: 'TOP SPEED', teto_d: 'It won’t get any faster. Now it’s you.',
  al_corrente: 'CHAIN', al_corrente_d: 'Three immune rings in a zigzag',
  al_corrente_ok: 'CHAIN BROKEN',
  al_rasante: 'STRAFE', al_rasante_d: 'Leave the red lane before the meteor',
  al_rasante_ok: 'DODGED',
  al_pane: 'BLACKOUT', al_pane_d: 'Pilot and ghost off for 6 s',
  al_pane_ok: 'HELD THROUGH',
  cashout: 'End and collect',
  a_al_rasante: 'Eyes on the sky', a_d_al_rasante: 'Dodge 25 Strafes in Endless.',
  a_al_corrente: 'Link by link', a_d_al_corrente: 'Break 10 Chains in Endless.',
  a_al_pane: 'Steady hand', a_d_al_pane: 'Get through 10 Blackouts without damage.',
  a_al_teto: 'At the top', a_d_al_teto: 'Reach Endless top speed.'
});
Object.assign(HR.I18N.es, {
  teto_t: 'VELOCIDAD MÁXIMA', teto_d: 'Ya no acelera más. Ahora eres tú.',
  al_corrente: 'CADENA', al_corrente_d: 'Tres aros inmunes en zigzag',
  al_corrente_ok: 'CADENA ROTA',
  al_rasante: 'RASANTE', al_rasante_d: 'Sal de la franja roja antes del meteoro',
  al_rasante_ok: 'ESQUIVADO',
  al_pane: 'APAGÓN', al_pane_d: 'Piloto y fantasma apagados 6 s',
  al_pane_ok: 'AGUANTÓ EL APAGÓN',
  cashout: 'Terminar y cobrar',
  a_al_rasante: 'Ojos al cielo', a_d_al_rasante: 'Esquiva 25 Rasantes en el Infinito.',
  a_al_corrente: 'Eslabón a eslabón', a_d_al_corrente: 'Rompe 10 Cadenas en el Infinito.',
  a_al_pane: 'Mano firme', a_d_al_pane: 'Supera 10 Apagones sin recibir daño.',
  a_al_teto: 'En el techo', a_d_al_teto: 'Llega a la velocidad máxima del Infinito.'
});
