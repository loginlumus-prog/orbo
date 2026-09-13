/* ===== Entrada: toque, mouse e teclado ===== */
window.HR = window.HR || {};

HR.Input = {
  el: null, down: false, pointerId: null, lastX: 0, lastY: 0, dx: 0, dy: 0, absY: 0, absX: 0, hasHover: false,
  keys: { up: false, down: false, left: false, right: false },
  // analógico virtual: origem no ponto do toque, arrastada junto quando o dedo passa do raio
  stick: { active: false, ox: 0, oy: 0, x: 0, y: 0, R: 46 }, onTap: null, onEscape: null, onAbility: null, lastPointerType: 'touch',

  attach(el) {
    this.el = el;
    const ignore = e => !!(e.target && e.target.closest && e.target.closest('button, .panel, .modal, .card, .tabs, input, .menu-nav, .topbar, .level-pill, .mode-seg, .loadout, .stats-strip, .hud-abilities'));

    el.addEventListener('pointerdown', e => {
      if (ignore(e)) return;
      this.lastPointerType = e.pointerType || 'touch';
      this.down = true; this.pointerId = e.pointerId;
      this.lastX = e.clientX; this.lastY = e.clientY; this.absY = e.clientY; this.absX = e.clientX;
      const S = this.stick; S.active = true; S.ox = e.clientX; S.oy = e.clientY; S.x = 0; S.y = 0;
      try { el.setPointerCapture(e.pointerId); } catch (_) { /* ok */ }
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
    el.addEventListener('touchmove', e => { if (!ignore(e)) e.preventDefault(); }, { passive: false });

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
      else if (e.code === 'Space' || e.code === 'Enter') { if (this.onTap && !e.target.closest('button,input')) this.onTap(e); }
      else if (e.code === 'Escape') { if (this.onEscape) this.onEscape(); }
    });
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
  consumeDelta() { const d = this.dy; this.dy = 0; this.dx = 0; return d; },
  consumeDelta2() { const d = { dx: this.dx, dy: this.dy }; this.dx = 0; this.dy = 0; return d; },
  reset() { this.dx = 0; this.dy = 0; this.down = false; this.releaseStick(); this.keys.up = this.keys.down = this.keys.left = this.keys.right = false; }
};
