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
  // bola dentro do arco: metade de trás do arco, Faísca, metade da frente.
  // Faísca é o yin-yang: divisa em S, mancha escura no lado claro e clara no
  // escuro. Inclinada 18° para acompanhar o arco.
  ball(accent, id) {
    const a = accent || '#4cf0ff';
    return '<svg class="lg-glyph" viewBox="0 0 64 64" aria-hidden="true">' +
      '<defs>' +
      '<radialGradient id="lgb' + id + '" cx="0.32" cy="0.26" r="0.86"><stop offset="0" stop-color="#ffffff"/><stop offset="0.55" stop-color="#eef6ff"/><stop offset="1" stop-color="#bcd6f2"/></radialGradient>' +
      '<linearGradient id="lgd' + id + '" x1="0.2" y1="0" x2="0.9" y2="1"><stop offset="0" stop-color="#2b2356"/><stop offset="1" stop-color="#100d20"/></linearGradient>' +
      '<radialGradient id="lgv' + id + '" cx="0.32" cy="0.26" r="0.9"><stop offset="0" stop-color="#ffffff" stop-opacity="0.38"/><stop offset="0.5" stop-color="#ffffff" stop-opacity="0.04"/><stop offset="1" stop-color="#000000" stop-opacity="0.34"/></radialGradient>' +
      '</defs>' +
      '<path d="M40 7.3 A19 26 -18 0 0 24 56.7" fill="none" stroke="' + a + '" stroke-opacity="0.28" stroke-width="14" stroke-linecap="round"/>' +
      '<path d="M40 7.3 A19 26 -18 0 0 24 56.7" fill="none" stroke="' + a + '" stroke-width="8" stroke-linecap="round"/>' +
      '<g transform="rotate(-18 32 32)">' +
      '<circle cx="32" cy="32" r="15" fill="url(#lgb' + id + ')"/>' +
      '<path d="M32,17 C45.2,23.3 20.9,35.6 32.9,47 A15,15 0 0,0 32,17 Z" fill="url(#lgd' + id + ')"/>' +
      '<circle cx="37.1" cy="27.5" r="3.1" fill="#f4f8ff"/>' +
      '<circle cx="27.2" cy="37.1" r="2.9" fill="#1a1530" fill-opacity="0.85"/>' +
      '<circle cx="32" cy="32" r="15" fill="url(#lgv' + id + ')"/>' +
      '<circle cx="32" cy="32" r="14.6" fill="none" stroke="#ffffff" stroke-opacity="0.3" stroke-width="0.9"/>' +
      '</g>' +
      '<path d="M40 7.3 A19 26 -18 0 1 24 56.7" fill="none" stroke="' + a + '" stroke-opacity="0.28" stroke-width="14" stroke-linecap="round"/>' +
      '<path d="M40 7.3 A19 26 -18 0 1 24 56.7" fill="none" stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>' +
      '<path d="M40 7.3 A19 26 -18 0 1 24 56.7" fill="none" stroke="' + a + '" stroke-width="4" stroke-linecap="round"/>' +
      '</svg>';
  },
  // v7: so o nome. Os arcos e a bola sairam — a marca e a palavra.
  logo() {
    return '<span class="lg lg-word" aria-label="ORBO">ORBO</span>';
  },
  // o letreiro antigo continua disponivel para quem precisar do simbolo
  logoIcon(accent) {
    const id = Math.random().toString(36).slice(2, 7);
    return '<span class="lg" aria-label="ORBO"><span class="lg-o">' + this.ring(accent, id) + '</span><span class="lg-t">RB</span><span class="lg-o">' + this.ball(accent, id) + '</span></span>';
  },
  mount() { HR.U.$$('[data-logo]').forEach(el => { el.innerHTML = this.logo(); }); }
};
