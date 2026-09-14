/* =====================================================================
   Dicas (v5): qualquer elemento com data-tip="Título" (e data-tip-d="descrição")
   mostra uma dica — hover/foco no desktop, toque longo no celular.
   data-tip-tap: também abre com um toque simples (chips só de ícone).
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  let host = null, cur = null, hoverT = null, lpT = null, hideT = null, suppress = false, sx = 0, sy = 0;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const find = e => (e.target && e.target.closest) ? e.target.closest('[data-tip]') : null;
  function ensure() {
    if (host) return host;
    host = document.createElement('div'); host.id = 'tip-host'; host.setAttribute('role', 'tooltip');
    (document.getElementById('app') || document.body).appendChild(host);
    return host;
  }
  function place(el) {
    const r = el.getBoundingClientRect(), W = window.innerWidth;
    host.style.left = '0px'; host.style.top = '0px';
    const hr = host.getBoundingClientRect();
    let x = r.left + r.width / 2 - hr.width / 2; x = Math.max(8, Math.min(W - hr.width - 8, x));
    let y = r.top - hr.height - 10, below = false;
    if (y < 8) { y = r.bottom + 10; below = true; }
    host.style.left = x.toFixed(0) + 'px'; host.style.top = y.toFixed(0) + 'px';
    host.classList.toggle('below', below);
    host.style.setProperty('--ax', Math.max(12, Math.min(hr.width - 12, r.left + r.width / 2 - x)).toFixed(0) + 'px');
  }
  function show(el, autoHide) {
    const t = el.getAttribute('data-tip'); if (!t) return;
    const d = el.getAttribute('data-tip-d'), c = el.getAttribute('data-tip-c');
    ensure();
    host.innerHTML = '<b>' + esc(t) + '</b>' + (d ? '<span>' + esc(d) + '</span>' : '');
    host.style.setProperty('--tc', c || '#4cf0ff');
    host.classList.add('on'); cur = el; place(el);
    clearTimeout(hideT); if (autoHide) hideT = setTimeout(hide, autoHide);
  }
  function hide() { clearTimeout(hideT); if (host) host.classList.remove('on'); cur = null; }

  document.addEventListener('pointerover', e => {
    if (e.pointerType === 'touch') return;
    const el = find(e); if (!el || el === cur) return;
    clearTimeout(hoverT); hoverT = setTimeout(() => show(el), 160);
  });
  document.addEventListener('pointerout', e => {
    if (e.pointerType === 'touch') return;
    const el = find(e); if (!el) return;
    if (e.relatedTarget && el.contains(e.relatedTarget)) return;
    clearTimeout(hoverT); if (cur === el) hide();
  });
  document.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'touch') { clearTimeout(hoverT); hide(); return; }
    const el = find(e); if (cur && cur !== el) hide();
    if (!el) return;
    sx = e.clientX; sy = e.clientY; clearTimeout(lpT);
    lpT = setTimeout(() => { lpT = null; suppress = true; show(el, 2600); if (HR.U && HR.U.vibrate) HR.U.vibrate(8); }, 380);
  }, true);
  document.addEventListener('pointermove', e => { if (lpT && Math.hypot(e.clientX - sx, e.clientY - sy) > 10) { clearTimeout(lpT); lpT = null; } }, true);
  document.addEventListener('pointerup', () => { clearTimeout(lpT); lpT = null; }, true);
  document.addEventListener('pointercancel', () => { clearTimeout(lpT); lpT = null; }, true);
  document.addEventListener('click', e => {
    if (suppress) { suppress = false; e.stopPropagation(); e.preventDefault(); return; }
    const el = find(e);
    if (el && el.hasAttribute('data-tip-tap')) { e.stopPropagation(); if (cur === el) hide(); else show(el, 2600); }
  }, true);
  document.addEventListener('contextmenu', e => { if (find(e)) e.preventDefault(); });
  document.addEventListener('focusin', e => { const el = find(e); let fv = false; try { fv = !!(e.target.matches && e.target.matches(':focus-visible')); } catch (_) { fv = false; } if (el && fv) show(el); });
  document.addEventListener('focusout', () => hide());
  window.addEventListener('scroll', () => hide(), true);
  window.addEventListener('resize', () => hide());

  HR.Tips = { show, hide };
})();
