/* =====================================================================
   ORBO v8 — a galaxia 6 vira a Via Lactea.

   Ela sempre foi uma espiral gigante de quatro bracos; era a Cata-vento
   (M101). Passa a ser a nossa: e a galaxia onde os pequenos do ponto
   azul olham para cima e chamam a linha no ceu de "o comeco" — o degrau
   do capitulo 6. A mecanica nao muda em nada (continua o giro), entao
   nenhum id interno e tocado: so os nomes, nos tres idiomas.

   O bioma "Cristal" vira "Espiral" pela mesma razao: o assunto da
   galaxia deixou de ser a pedra e passou a ser o braco que gira.
   ===================================================================== */
(function () {
  const T = {
    pt: {
      gal_pinwheel: 'Via Láctea', gal_pinwheel_c: 'Via Láctea',
      gal_pinwheel_d: 'A espiral gigante onde tudo isto está. Vista de dentro, é uma faixa de luz atravessando o céu.',
      skin_gal_pinwheel: 'Via Láctea',
      flavor_skin_gal_pinwheel: 'A nossa. Quatro braços, e um deles com um ponto azul.',
      reg_cristal: 'Espiral', reg_cristal_t: 'Tudo gira',
      reg_cristal_d: 'Os arcos giram e inclinam. Passe pelo eixo aberto.'
    },
    en: {
      gal_pinwheel: 'Milky Way', gal_pinwheel_c: 'Milky Way',
      gal_pinwheel_d: 'The giant spiral all of this sits in. Seen from inside, it is a band of light across the sky.',
      skin_gal_pinwheel: 'Milky Way',
      flavor_skin_gal_pinwheel: 'Ours. Four arms, and one of them holds a blue dot.',
      reg_cristal: 'Spiral', reg_cristal_t: 'Everything spins',
      reg_cristal_d: 'Rings spin and tilt. Pass through the open axis.'
    },
    es: {
      gal_pinwheel: 'Vía Láctea', gal_pinwheel_c: 'Vía Láctea',
      gal_pinwheel_d: 'La espiral gigante donde está todo esto. Vista desde dentro, es una franja de luz cruzando el cielo.',
      skin_gal_pinwheel: 'Vía Láctea',
      flavor_skin_gal_pinwheel: 'La nuestra. Cuatro brazos, y uno guarda un punto azul.',
      reg_cristal: 'Espiral', reg_cristal_t: 'Todo gira',
      reg_cristal_d: 'Los aros giran y se inclinan. Pasa por el eje abierto.'
    }
  };
  ['pt', 'en', 'es'].forEach(l => Object.assign(HR.I18N[l], T[l]));
})();
