/* =====================================================================
   ORBO v9 — o piloto automatico avisa antes de soltar a bola.

   Com o piloto ligado a pessoa larga o controle, e com razao. O problema
   era a volta: o piloto desligava de uma vez (um alerta chegando, o
   pulso do Fluxo acabando) e a bola ficava solta sem ninguem esperando.
   Quem testou descreveu assim: "na hora que parava, eu ficava sem reacao".

   Agora, 3 segundos antes de o piloto desligar, aparece no alto da tela
   "PILOTO DESLIGA EM 3", com um tique por segundo e uma barra que esvazia.
   Vale para os tres jeitos de desligar:
     - o tempo do piloto (habilidade, cometa) acabando;
     - a janela do Fluxo (niveis 1 e 2) fechando;
     - um alerta do Infinito chegando (Anomalia, Corrente, Rasante, Pane),
       que desliga o piloto enquanto dura.
   Da para desligar o aviso nos Ajustes.
   ===================================================================== */
(function () {
  if (!HR.Game || !HR.Game.prototype) return;
  const G = HR.Game.prototype, AVISO = 3, MIN_LIGADO = 0.9;
  const ligado = () => { const s = HR.Store.data.settings; return !s || s.pilotWarn !== false; };

  // segundos ate o piloto desligar sozinho, ou null se nao vai desligar tao cedo
  function faltam(g) {
    const run = g.run;
    if (!run || g.demo || g.state !== 'playing') return null;
    if (!(run.autoT > 0) || run.anomalyActive || run.jetLeft > 0) return null;
    const M = run.mods || {};
    let fim = Infinity;
    if (!(M.autoflow >= 3)) {
      let flow = 0;
      if (M.autoflow) {
        const per = [0, 15, 12][M.autoflow], on = [0, 3, 6][M.autoflow], ph = run.flowClock % per;
        if (ph < on) flow = on - ph;
      }
      // o cometa segura o piloto enquanto dura: o fim e o do cometa
      fim = Math.max(run.autoT, run.cometT > 0 ? run.cometT : 0, flow);
    }
    if (run.mode === 'endless' && g.alertaCorre && g.alertaT > 0) fim = Math.min(fim, g.alertaT);
    return fim <= AVISO ? fim : null;
  }

  let el = null, barra = null, num = null, ultimo = null;
  function monta() {
    if (el && el.isConnected) return el;
    const hud = document.getElementById('screen-hud'); if (!hud) return null;
    el = HR.U.el('div', 'piloto-aviso',
      '<span class="pa-ic">' + HR.icon('pilot') + '</span>' +
      '<span class="pa-txt"><b></b><small></small></span>' +
      '<span class="pa-n"></span><i class="pa-barra"><i></i></i>');
    el.setAttribute('aria-live', 'polite');
    hud.appendChild(el);
    barra = el.querySelector('.pa-barra i'); num = el.querySelector('.pa-n');
    return el;
  }
  function mostra(seg) {
    if (!monta()) return;
    const n = Math.max(1, Math.ceil(seg));
    if (!el.classList.contains('show')) {
      el.querySelector('b').textContent = HR.t('pa_t');
      el.querySelector('small').textContent = HR.t('pa_d');
      el.classList.add('show');
      HR.U.vibrate([20, 30, 20]);
    }
    if (n !== ultimo) { num.textContent = String(n); HR.Audio.sfx('tick'); ultimo = n; }
    barra.style.transform = 'scaleX(' + Math.max(0, Math.min(1, seg / AVISO)).toFixed(3) + ')';
  }
  function esconde() {
    ultimo = null;
    if (el && el.classList.contains('show')) el.classList.remove('show');
  }

  const origUpdate = G.update;
  G.update = function (dt) {
    const r = origUpdate.apply(this, arguments);
    if (this.demo || this !== HR.game) return r;
    const run = this.run;
    // o piloto so "existe" depois de ligado por um instante: o empurrao curto
    // do fim do Jato nao merece aviso
    if (run && run.autoT > 0 && !run.anomalyActive && !run.jetLeft && this.state === 'playing') this.pilotoHa = (this.pilotoHa || 0) + dt;
    else this.pilotoHa = 0;
    const seg = ligado() && this.pilotoHa >= MIN_LIGADO ? faltam(this) : null;
    if (seg === null) esconde(); else mostra(seg);
    return r;
  };

  // nos Ajustes, logo abaixo da camera lenta ao fim dos poderes
  const origSettings = HR.UI.renderSettings;
  HR.UI.renderSettings = function () {
    const s = HR.Store.data.settings;
    if (s.pilotWarn === undefined) s.pilotWarn = true;
    const r = origSettings.apply(this, arguments);
    try {
      const vizinho = document.querySelector('#settings-body .toggle[aria-label="adaptSlowmo"]');
      const linha = vizinho && vizinho.closest('.setting');
      if (linha && !document.querySelector('#settings-body .toggle[aria-label="pilotWarn"]')) {
        const nova = linha.cloneNode(true);
        const ic = nova.querySelector('.s-ic');
        if (ic) {
          ic.innerHTML = HR.glyph ? HR.glyph('pilot') : HR.icon('pilot');
          const gc = HR.glyphColor && HR.glyphColor('pilot'); if (gc) ic.style.setProperty('--ic', gc);
        }
        const lb = nova.querySelector('.s-label');
        if (lb) { lb.textContent = HR.t('pa_set'); const sm = document.createElement('small'); sm.textContent = HR.t('pa_set_d'); lb.appendChild(sm); }
        const t = nova.querySelector('.toggle');
        t.setAttribute('aria-label', 'pilotWarn');
        t.classList.toggle('on', !!s.pilotWarn);
        t.addEventListener('click', () => { this.toggleSetting('pilotWarn'); t.classList.toggle('on', !!s.pilotWarn); });
        linha.parentNode.insertBefore(nova, linha.nextSibling);
      }
    } catch (e) { console.warn('piloto', e); }
    return r;
  };
})();

Object.assign(HR.I18N.pt, { pa_t: 'Piloto desliga em', pa_d: 'Assuma o controle', pa_set: 'Aviso do piloto automático', pa_set_d: 'Conta 3 segundos antes de o piloto soltar a bola.' });
Object.assign(HR.I18N.en, { pa_t: 'Autopilot off in', pa_d: 'Take the controls', pa_set: 'Autopilot warning', pa_set_d: 'Counts down 3 seconds before the autopilot lets go.' });
Object.assign(HR.I18N.es, { pa_t: 'Piloto se apaga en', pa_d: 'Toma el control', pa_set: 'Aviso del piloto automático', pa_set_d: 'Cuenta 3 segundos antes de que el piloto suelte la bola.' });
