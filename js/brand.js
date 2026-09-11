/* =====================================================================
   Marca ORBO: letreiro em que o 1º "O" é um arco inclinado (o anel do jogo)
   e o último "O" é a bola atravessando um arco. Vetorial, escala por font-size.
   Uso: HR.Brand.logo() → HTML · HR.Brand.mount() preenche [data-logo]
   ===================================================================== */
window.HR = window.HR || {};

HR.Brand = {
  // arco (elipse inclinada, metade de trás mais escura) — mesmo desenho dos arcos do jogo
  ring(accent, id) {
    const a = accent || '#4cf0ff';
    return '<svg class="lg-glyph" viewBox="0 0 64 64" aria-hidden="true">' +
      '<defs><linearGradient id="lgr' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="' + a + '"/></linearGradient></defs>' +
      '<ellipse cx="32" cy="32" rx="19" ry="26" transform="rotate(-18 32 32)" fill="none" stroke="' + a + '" stroke-opacity="0.28" stroke-width="14" stroke-linecap="round"/>' +
      '<ellipse cx="32" cy="32" rx="19" ry="26" transform="rotate(-18 32 32)" fill="none" stroke="url(#lgr' + id + ')" stroke-width="8" stroke-linecap="round"/>' +
      '</svg>';
  },
  // bola dentro do arco: metade de trás do arco, bola, metade da frente
  ball(accent, id) {
    const a = accent || '#4cf0ff';
    return '<svg class="lg-glyph" viewBox="0 0 64 64" aria-hidden="true">' +
      '<defs><radialGradient id="lgb' + id + '" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#ffffff"/><stop offset="0.5" stop-color="#e9f6ff"/><stop offset="1" stop-color="#8fd8ff"/></radialGradient></defs>' +
      '<path d="M40 7.3 A19 26 -18 0 0 24 56.7" fill="none" stroke="' + a + '" stroke-opacity="0.28" stroke-width="14" stroke-linecap="round"/>' +
      '<path d="M40 7.3 A19 26 -18 0 0 24 56.7" fill="none" stroke="' + a + '" stroke-width="8" stroke-linecap="round"/>' +
      '<circle cx="32" cy="32" r="15" fill="url(#lgb' + id + ')"/>' +
      '<ellipse cx="26" cy="25" rx="4.5" ry="2.6" fill="#fff" fill-opacity="0.85" transform="rotate(-30 26 25)"/>' +
      '<path d="M40 7.3 A19 26 -18 0 1 24 56.7" fill="none" stroke="' + a + '" stroke-opacity="0.28" stroke-width="14" stroke-linecap="round"/>' +
      '<path d="M40 7.3 A19 26 -18 0 1 24 56.7" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M40 7.3 A19 26 -18 0 1 24 56.7" fill="none" stroke="' + a + '" stroke-width="4" stroke-linecap="round"/>' +
      '</svg>';
  },
  logo(accent) {
    const id = Math.random().toString(36).slice(2, 7);
    return '<span class="lg" aria-label="ORBO"><span class="lg-o">' + this.ring(accent, id) + '</span><span class="lg-t">RB</span><span class="lg-o">' + this.ball(accent, id) + '</span></span>';
  },
  mount() { HR.U.$$('[data-logo]').forEach(el => { el.innerHTML = this.logo(); }); }
};
