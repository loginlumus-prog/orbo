/* =====================================================================
   Dicas (v5): qualquer elemento com data-tip="Título" (e data-tip-d="descrição")
   mostra uma dica — hover/foco no desktop, toque longo no celular.
   data-tip-tap: também abre com um toque simples (chips só de ícone).
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  let host = null, cur = null, hoverT = null, lpT = null, hideT = null, supT = null, suppress = false, sx = 0, sy = 0;
  // a marca de "engolir o clique" vale para UM clique e só por um instante
  function unsuppress() { clearTimeout(supT); supT = null; suppress = false; }
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const find = e => (e.target && e.target.closest) ? e.target.closest('[data-tip]') : null;
  function ensure() {
    if (host) return host;
    host = document.createElement('div'); host.id = 'tip-host'; host.setAttribute('role', 'tooltip');
    (document.getElementById('app') || document.body).appendChild(host);
    return host;
  }
  // A dica mora dentro do #app, e o #app tem transform: ali "fixed" conta a partir
  // da moldura do jogo, nao da janela. No celular as duas coincidem; no PC (jogo no
  // meio, faixas dos lados) a dica saia deslocada pela largura da faixa e aparecia
  // em cima de outro botao. Por isso a conta e feita na moldura.
  function place(el) {
    const r = el.getBoundingClientRect();
    host.style.left = '0px'; host.style.top = '0px';
    const hr = host.getBoundingClientRect(), ox = hr.left, oy = hr.top;
    const box = (host.parentElement && host.parentElement.getBoundingClientRect()) || { left: 0, top: 0, right: window.innerWidth };
    let x = r.left + r.width / 2 - hr.width / 2; x = Math.max(box.left + 8, Math.min(box.right - hr.width - 8, x));
    let y = r.top - hr.height - 10, below = false;
    if (y < box.top + 8) { y = r.bottom + 10; below = true; }
    host.style.left = (x - ox).toFixed(0) + 'px'; host.style.top = (y - oy).toFixed(0) + 'px';
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
    unsuppress();                                   // gesto novo: nada de sobra do anterior
    if (e.pointerType !== 'touch') { clearTimeout(hoverT); hide(); return; }
    const el = find(e); if (cur && cur !== el) hide();
    if (!el) return;
    sx = e.clientX; sy = e.clientY; clearTimeout(lpT);
    lpT = setTimeout(() => { lpT = null; suppress = true; show(el, 2600); if (HR.U && HR.U.vibrate) HR.U.vibrate(8); }, 380);
  }, true);
  document.addEventListener('pointermove', e => { if (lpT && Math.hypot(e.clientX - sx, e.clientY - sy) > 10) { clearTimeout(lpT); lpT = null; } }, true);
  const endPress = () => {
    clearTimeout(lpT); lpT = null;
    // o clique do toque longo chega logo depois; passado isso, a marca cai sozinha
    if (suppress) { clearTimeout(supT); supT = setTimeout(unsuppress, 400); }
  };
  document.addEventListener('pointerup', endPress, true);
  document.addEventListener('pointercancel', endPress, true);
  document.addEventListener('click', e => {
    if (suppress) { unsuppress(); e.stopPropagation(); e.preventDefault(); return; }
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
