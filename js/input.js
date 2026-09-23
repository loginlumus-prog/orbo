/* ===== Entrada: toque, mouse e teclado ===== */
window.HR = window.HR || {};

HR.Input = {
  el: null, down: false, pointerId: null, lastX: 0, lastY: 0, dx: 0, dy: 0, absY: 0, absX: 0, hasHover: false,
  keys: { up: false, down: false, left: false, right: false },
  // deslocamento do dedo desde o toque, normalizado pelo raio: quem usa e o
  // corredor do Jato (trocar de faixa inclinando). A bola anda pelo arrasto (dx/dy).
  stick: { active: false, ox: 0, oy: 0, x: 0, y: 0, R: 46 }, onTap: null, onEscape: null, onAbility: null, onDoubleTap: null, lastPointerType: 'touch',
  tap_: { t: 0, x: 0, y: 0 },

  attach(el) {
    this.el = el;
    const SEL = 'button, .panel, .modal, .card, .tabs, input, .menu-nav, .topbar, .level-pill, .mode-seg, .loadout, .stats-strip, .hud-abilities';
    const ignore = e => !!(e.target && e.target.closest && e.target.closest(SEL));
    // O closest() de 14 seletores rodava em TODO touchmove (60-120 Hz). A resposta
    // e a mesma do pointerdown que abriu o arrasto, entao fica guardada ali.
    let ignorando = false;

    el.addEventListener('pointerdown', e => {
      ignorando = ignore(e);
      if (ignorando) return;
      this.lastPointerType = e.pointerType || 'touch';
      this.down = true; this.pointerId = e.pointerId;
      this.lastX = e.clientX; this.lastY = e.clientY; this.absY = e.clientY; this.absX = e.clientX;
      const S = this.stick; S.active = true; S.ox = e.clientX; S.oy = e.clientY; S.x = 0; S.y = 0;
      try { el.setPointerCapture(e.pointerId); } catch (_) { /* ok */ }
      // dois toques rápidos e no mesmo lugar: atalho da Égide
      const T = this.tap_, now = e.timeStamp || Date.now();
      if (now - T.t < 320 && Math.hypot(e.clientX - T.x, e.clientY - T.y) < 28) { T.t = 0; if (this.onDoubleTap) this.onDoubleTap(e); }
      else { T.t = now; T.x = e.clientX; T.y = e.clientY; }
      if (this.onTap) this.onTap(e);
    }, { passive: true });

    el.addEventListener('pointermove', e => {
      if (e.pointerType === 'mouse' && !this.down) { this.hasHover = true; this.absY = e.clientY; this.absX = e.clientX; return; }
      if (!this.down || e.pointerId !== this.pointerId) return;
      this.dx += e.clientX - this.lastX; this.dy += e.clientY - this.lastY;
      this.lastX = e.clientX; this.lastY = e.clientY; this.absY = e.clientY; this.absX = e.clientX;
      this.moveStick(e.clientX, e.clientY);
    }, { passive: true });

    const up = e => { if (e.pointerId === this.pointerId) { this.down = false; this.pointerId = null; this.releaseStick(); } };
    el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); el.addEventListener('lostpointercapture', up);
    el.addEventListener('contextmenu', e => e.preventDefault());
    el.addEventListener('touchmove', e => { if (!(ignorando || ignore(e))) e.preventDefault(); }, { passive: false });

    window.addEventListener('keydown', e => {
      if (e.repeat) return;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') { this.keys.up = true; e.preventDefault(); }
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') { this.keys.down = true; e.preventDefault(); }
      else if (e.code === 'ArrowLeft' || e.code === 'KeyA') { this.keys.left = true; e.preventDefault(); }
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') { this.keys.right = true; e.preventDefault(); }
      else if (e.code === 'KeyQ') { if (this.onAbility) this.onAbility(0); }
      else if (e.code === 'KeyE') { if (this.onAbility) this.onAbility(1); }
      else if (e.code === 'KeyF') { if (this.onAegis) this.onAegis(); }
      else if (e.code === 'KeyJ') { if (this.onJet) this.onJet(); }
      // Espaço é a tecla do jogo (começa, joga de novo, próxima fase): nunca aciona o botão que ficou com foco
      else if (e.code === 'Space') { if (e.target.closest && e.target.closest('input,textarea,select')) return; e.preventDefault(); const ae = document.activeElement; if (ae && ae !== document.body && ae.blur) ae.blur(); if (this.onTap) this.onTap(e); }
      else if (e.code === 'Enter') { if (this.onTap && !e.target.closest('button,input,textarea,select')) this.onTap(e); }
      else if (e.code === 'Escape') { if (this.onEscape) this.onEscape(); }
    });
    // clique de mouse/toque não deixa o botão com foco (evita o Espaço repetir o último clique e mostrar a dica)
    document.addEventListener('click', e => { const b = e.detail > 0 && e.target.closest && e.target.closest('button'); if (b) b.blur(); }, true);
    // janela perdeu o foco com uma tecla apertada: o keyup nunca chega e a tecla fica
    // presa. Sem isto a bola anda sozinha e o teclado para de responder de vez.
    window.addEventListener('blur', () => this.reset());
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.reset(); });
    window.addEventListener('keyup', e => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') this.keys.up = false;
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') this.keys.down = false;
      else if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.keys.left = false;
      else if (e.code === 'ArrowRight' || e.code === 'KeyD') this.keys.right = false;
    });
  },

  moveStick(cx, cy) {
    const S = this.stick; if (!S.active) return;
    let sx = cx - S.ox, sy = cy - S.oy; const d = Math.hypot(sx, sy);
    if (d > S.R) { const k = 1 - S.R / d; S.ox += sx * k; S.oy += sy * k; sx = cx - S.ox; sy = cy - S.oy; }
    S.x = sx / S.R; S.y = sy / S.R;
  },
  releaseStick() { const S = this.stick; S.active = false; S.x = 0; S.y = 0; },
  consumeDelta2() { const d = { dx: this.dx, dy: this.dy }; this.dx = 0; this.dy = 0; return d; },
  reset() { this.dx = 0; this.dy = 0; this.down = false; this.releaseStick(); this.keys.up = this.keys.down = this.keys.left = this.keys.right = false; }
};
