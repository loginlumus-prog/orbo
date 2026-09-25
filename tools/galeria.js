/* Galeria de revisao de arte (ferramenta, nao entra no jogo).
   No console:  eval(await fetch('/tools/galeria.js').then(r => r.text())); __galeria('skins')
   Tipos: skins, trails, themes, aegis, jet, frags, perks, abilities, pickups
   Cada celula mostra o item grande, num tempo fixo, com o id embaixo. */
(function () {
  window.__galeria = function (tipo, o) {
    o = Object.assign({ cols: 5, cel: 128, t: 1.3, de: 0, ate: 999 }, o || {});
    let el = document.getElementById('__gal');
    if (el) el.remove();
    el = document.createElement('div');
    el.id = '__gal';
    el.style.cssText = 'position:fixed;inset:0;z-index:99999;overflow:auto;background:#0b1026;padding:6px;';
    document.body.appendChild(el);
    const lista = itens(tipo).slice(o.de, o.ate);
    const W = o.cols * o.cel, rows = Math.ceil(lista.length / o.cols), H = rows * (o.cel + 18);
    const cv = document.createElement('canvas');
    const dpr = 2;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    el.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    lista.forEach((it, i) => {
      const x = (i % o.cols) * o.cel, y = Math.floor(i / o.cols) * (o.cel + 18);
      ctx.save();
      ctx.fillStyle = '#0e1430';
      ctx.fillRect(x, y, o.cel, o.cel + 18);
      ctx.beginPath(); ctx.rect(x, y, o.cel, o.cel); ctx.clip();
      try { desenha(ctx, tipo, it, x, y, o.cel, o.t); } catch (e) { ctx.fillStyle = '#ff3d2e'; ctx.fillText('ERRO ' + e.message, x + 4, y + 20); console.error(tipo, it.id, e); }
      ctx.restore();
      ctx.fillStyle = '#cfd8ff'; ctx.font = '600 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(String(it.id).slice(0, 20), x + o.cel / 2, y + o.cel + 13);
    });
    el.addEventListener('dblclick', () => el.remove());
    return lista.length;
  };
  function itens(tipo) {
    const C = HR.CONFIG;
    if (tipo === 'skins') return C.SKINS;
    if (tipo === 'trails') return C.TRAILS;
    if (tipo === 'themes') return C.THEMES;
    if (tipo === 'aegis') return HR.GEAR.aegisSkins;
    if (tipo === 'jet') return HR.GEAR.jetSkins;
    if (tipo === 'perks') return HR.PERKS;
    if (tipo === 'abilities') return HR.ABILITIES;
    if (tipo === 'pickups') return C.PICKUPS;
    if (tipo === 'frags') return HR.FRAGMENTOS || HR.Fragments && HR.Fragments.list || [];
    return [];
  }
  const skinPadrao = () => HR.CONFIG.SKINS[0];
  function desenha(ctx, tipo, it, x, y, S, t) {
    const cx = x + S / 2, cy = y + S / 2, R = HR.Render;
    if (tipo === 'skins') { R.drawBall(ctx, cx, cy, S * 0.22, it, t, {}); return; }
    if (tipo === 'trails') {
      const pts = [];
      for (let i = 0; i < 18; i++) { const k = 18 - i; pts.push({ x: cx + S * 0.18 - k * S * 0.045, y: cy + Math.sin(t * 2 - k * 0.25) * S * 0.06, t: t - k * 0.03 }); }
      if (it.id !== 'none') R.drawTrail(ctx, it.id, pts, skinPadrao(), t);
      R.drawBall(ctx, cx + S * 0.18, cy, S * 0.14, skinPadrao(), t, {});
      return;
    }
    if (tipo === 'themes') {
      const bg = new R.Background(); bg.resize(S, S); bg.setTheme(it); bg.setFx(it.fx || null);
      bg.update(0.016, 70, { x: -1, y: 0 }, 0.15);
      ctx.translate(x, y); bg.draw(ctx, t);
      return;
    }
    if (tipo === 'aegis') { R.drawBall(ctx, cx, cy, S * 0.2, skinPadrao(), t, {}); R.drawAegis(ctx, cx, cy, S * 0.2, it, t, 30); return; }
    if (tipo === 'jet') { R.drawJet(ctx, cx + S * 0.12, cy, S * 0.16, it, t, 1); R.drawBall(ctx, cx + S * 0.12, cy, S * 0.16, skinPadrao(), t, {}); return; }
    if (tipo === 'perks' || tipo === 'abilities' || tipo === 'pickups') {
      // os icones sao SVG: vira imagem e desenha
      const col = it.color || (HR.RARITY && it.rarity && HR.RARITY[it.rarity] ? HR.RARITY[it.rarity].color : '#4cf0ff');
      const svg = HR.icon(it.icon || 'zap').replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" style="color:' + col + '"').replace(/currentColor/g, col);
      const img = new Image();
      img.onload = () => { ctx.save(); ctx.drawImage(img, cx - 32, cy - 32, 64, 64); ctx.restore(); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      return;
    }
  }
})();
