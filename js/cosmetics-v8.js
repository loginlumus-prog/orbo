/* =====================================================================
   ORBO v8: os Visitantes, e mais coisa para se ver.
   - colecao nova "Visitantes": 10 bolas (cometas, asteroides e um errante)
   - +12 rastros com desenho proprio, +8 jatos e +6 egides
   Nada aqui mexe em jogabilidade: e so o que se ve.
   Desenho: js/render-cosmetics-v8.js · carregado depois de cosmetics-v60.js
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const C = HR.CONFIG, G = HR.GEAR;
  const price = (item, table) => { const P = table[item.rar] || table.rare; item.cur = 'coins'; item.price = P[0]; item.gems = P[1]; };

  /* ---------------- colecao ---------------- */
  if (HR.COLLECTIONS && !HR.COLLECTIONS.some(c => c.id === 'visitors')) HR.COLLECTIONS.push({ id: 'visitors', icon: 'comet' });

  /* ---------------- bolas ---------------- */
  // cometas: base = coma, dark = nucleo, glow = brilho de fora; ion/dust = cor de cada cauda
  const SK = [
    ['bennu',       'common',    3,  '#5d5a5c', '#141214', '#9aa6c9', { shape: 'spintop', top: 'bennu' }],
    ['halley',      'rare',      6,  '#dff0ff', '#2a2420', '#bfe0ff', { shape: 'comet', cm: 'halley', ion: '#7fd0ff', dust: '#fff1d0' }],
    ['ryugu',       'rare',      8,  '#6b625a', '#1c1814', '#c4b6a4', { shape: 'spintop', top: 'ryugu' }],
    ['neowise',     'rare',      11, '#ffe6c0', '#7a4a1a', '#ffc27a', { shape: 'comet', cm: 'neowise', ion: '#8fd8ff', dust: '#ffd28a' }],
    ['tsuchinshan', 'epic',      16, '#fff4dc', '#5a4a3a', '#ffe0a8', { shape: 'comet', cm: 'tsuchinshan', ion: '#9fd8ff', dust: '#fff0c8' }],
    ['halebopp',    'epic',      20, '#f4f8ff', '#3a4a7a', '#bfe0ff', { shape: 'comet', cm: 'halebopp', ion: '#5ab8ff', dust: '#fff8ea' }],
    ['borisov',     'epic',      24, '#cfe8ff', '#1a3a6a', '#7fd0ff', { shape: 'comet', cm: 'borisov', ion: '#7fd0ff', dust: '#e8f4ff' }],
    ['oumuamua',    'legendary', 30, '#a8563c', '#3a1a10', '#ff9a6a', { shape: 'cigar' }],
    ['atlas3i',     'legendary', 36, '#8fe8d0', '#0f4a3e', '#5cffd0', { shape: 'comet', cm: 'atlas3i', ion: '#bffff0', dust: '#8fe8d0' }],
    ['wanderer',    'mythic',    42, '#1c1b30', '#050408', '#6a5cff', { shape: 'rogue' }]
  ];
  SK.forEach(([id, rar, lvl, base, dark, glow, extra]) => {
    if (C.SKINS.some(s => s.id === id)) return;
    const s = Object.assign({ id, col: 'visitors', rar, lvl, base, dark, glow, pattern: 'none' }, extra);
    price(s, HR.SKIN_PRICE); C.SKINS.push(s);
  });
  // conquista da colecao, como as outras colecoes tem (content-v5.js ja rodou sem esta)
  if (HR.ACHIEVEMENTS && !HR.ACHIEVEMENTS.some(a => a.id === 'col_visitors')) {
    HR.ACHIEVEMENTS.push({ id: 'col_visitors', cat: 'collection', stat: 'col_visitors', target: SK.length, gems: 150, icon: 'comet' });
  }

  /* ---------------- rastros (desenho em render-cosmetics-v8.js) ---------------- */
  const TR = [
    ['rings', 'common', 2], ['sparks', 'common', 4], ['binary', 'common', 5],
    ['wave', 'rare', 7], ['shards', 'rare', 9], ['lanterns', 'rare', 12], ['orbiters', 'rare', 14],
    ['iontail', 'epic', 18], ['paint', 'epic', 21], ['moth', 'epic', 25],
    ['dna', 'legendary', 30], ['spiral', 'legendary', 36]
  ];
  TR.forEach(([id, rar, lvl]) => { if (C.TRAILS.some(x => x.id === id)) return; const o = { id, rar, lvl }; price(o, HR.TRAIL_PRICE); C.TRAILS.push(o); });

  /* ---------------- Jato e Egide ---------------- */
  const JT = [
    { id: 'comet',      rar: 'rare',      color: '#9be7ff', color2: '#fff3d6', style: 'comet' },
    { id: 'petals',     rar: 'rare',      color: '#ff8ac4', color2: '#ffe0f0', style: 'petals' },
    { id: 'ember',      rar: 'rare',      color: '#ff7a2b', color2: '#6a5a54', style: 'ember' },
    { id: 'binary',     rar: 'epic',      color: '#35e29a', color2: '#d7ffe9', style: 'binary' },
    { id: 'crystal',    rar: 'epic',      color: '#8fd8ff', color2: '#ffffff', style: 'crystal' },
    { id: 'neonline',   rar: 'epic',      color: '#ff3df0', color2: '#35f0ff', style: 'neonline' },
    { id: 'aurora',     rar: 'legendary', color: '#7cff6b', color2: '#b48cff', style: 'aurora' },
    { id: 'dragonfire', rar: 'legendary', color: '#ff4a1a', color2: '#ffd24a', style: 'dragonfire' }
  ];
  JT.forEach(j => { if (G.jetSkins.some(x => x.id === j.id)) return; price(j, HR.GEAR_PRICE); G.jetSkins.push(j); });
  const AE = [
    { id: 'lace',   rar: 'rare',      color: '#ffd6e8', color2: '#ffffff', style: 'lace' },
    { id: 'thorns', rar: 'rare',      color: '#3fbf5a', color2: '#ff4d6d', style: 'thorns' },
    { id: 'orbit',  rar: 'epic',      color: '#cfe0ff', color2: '#ffe2a8', style: 'orbit' },
    { id: 'prism',  rar: 'epic',      color: '#ffffff', color2: '#dff6ff', style: 'prism' },
    { id: 'halo',   rar: 'legendary', color: '#ffe27a', color2: '#ffffff', style: 'halo' },
    { id: 'nebula', rar: 'legendary', color: '#ff7ad9', color2: '#4cf0ff', style: 'nebula' }
  ];
  AE.forEach(a => { if (G.aegisSkins.some(x => x.id === a.id)) return; price(a, HR.GEAR_PRICE); G.aegisSkins.push(a); });

  /* ---------------- textos ---------------- */
  Object.assign(HR.I18N.pt, {
    col_visitors: 'Visitantes', a_col_visitors: 'Visitantes de passagem', a_d_col_visitors: 'Tenha as {n} bolas dos Visitantes',
    skin_bennu: 'Bennu', skin_halley: 'Halley', skin_ryugu: 'Ryugu', skin_neowise: 'NEOWISE', skin_tsuchinshan: 'Tsuchinshan-ATLAS',
    skin_halebopp: 'Hale-Bopp', skin_borisov: '2I/Borisov', skin_oumuamua: 'ʻOumuamua', skin_atlas3i: '3I/ATLAS', skin_wanderer: 'Errante',
    flavor_skin_bennu: 'Um pião de cascalho. Uma sonda trouxe um punhado dele.', flavor_skin_halley: 'Volta a cada 76 anos. Quase todo mundo o vê uma vez.',
    flavor_skin_ryugu: 'Escuro como carvão, em forma de diamante.', flavor_skin_neowise: 'Iluminou o céu de 2020 a olho nu.',
    flavor_skin_tsuchinshan: 'Uma cauda tão longa que atravessou o céu de 2024.', flavor_skin_halebopp: 'Duas caudas: uma azul de gás, outra branca de poeira.',
    flavor_skin_borisov: 'Um cometa de outra estrela, com cauda e tudo.', flavor_skin_oumuamua: 'O primeiro visitante de fora. Passou, não parou.',
    flavor_skin_atlas3i: 'Mais velho que o Sol. Veio de longe para passar uma vez só.', flavor_skin_wanderer: 'Um planeta sem estrela. Só a aurora nos polos lhe faz companhia.',
    trail_rings: 'Anéis', trail_sparks: 'Fagulhas', trail_binary: 'Binário', trail_wave: 'Onda Sonora', trail_shards: 'Cacos', trail_lanterns: 'Lanternas',
    trail_orbiters: 'Luas', trail_iontail: 'Cauda de Íons', trail_paint: 'Pincelada', trail_moth: 'Mariposas', trail_dna: 'DNA', trail_spiral: 'Espiral',
    flavor_trail_rings: 'Arcos pequenos que ficam para trás e somem.', flavor_trail_sparks: 'Sobem, estalam e apagam.', flavor_trail_binary: 'Zeros e uns caindo do seu rastro.',
    flavor_trail_wave: 'A forma do som que você faz ao passar.', flavor_trail_shards: 'Vidro quebrado girando devagar.', flavor_trail_lanterns: 'Lanternas de papel subindo devagar.',
    flavor_trail_orbiters: 'Duas luas pequenas girando no seu caminho.', flavor_trail_iontail: 'Gás azul em linha reta, poeira curvando atrás.', flavor_trail_paint: 'Tinta grossa, cerdas marcadas.',
    flavor_trail_moth: 'Mariposas noturnas atraídas pela sua luz.', flavor_trail_dna: 'Duas fitas trançadas, com pontes entre elas.', flavor_trail_spiral: 'Espirais que se desenrolam e somem.',
    jetskin_comet: 'Cometa', jetskin_petals: 'Pétalas', jetskin_ember: 'Brasa', jetskin_binary: 'Binário', jetskin_crystal: 'Cristal', jetskin_neonline: 'Linha Neon', jetskin_aurora: 'Aurora', jetskin_dragonfire: 'Fogo de Dragão',
    aegisskin_lace: 'Renda', aegisskin_thorns: 'Espinhos', aegisskin_orbit: 'Órbita', aegisskin_prism: 'Prisma', aegisskin_halo: 'Auréola', aegisskin_nebula: 'Nebulosa'
  });
  Object.assign(HR.I18N.en, {
    col_visitors: 'Visitors', a_col_visitors: 'Passing visitors', a_d_col_visitors: 'Own all {n} Visitors balls',
    skin_bennu: 'Bennu', skin_halley: 'Halley', skin_ryugu: 'Ryugu', skin_neowise: 'NEOWISE', skin_tsuchinshan: 'Tsuchinshan-ATLAS',
    skin_halebopp: 'Hale-Bopp', skin_borisov: '2I/Borisov', skin_oumuamua: 'ʻOumuamua', skin_atlas3i: '3I/ATLAS', skin_wanderer: 'Wanderer',
    flavor_skin_bennu: 'A spinning top of rubble. A probe brought a handful home.', flavor_skin_halley: 'Comes back every 76 years. Most people see it once.',
    flavor_skin_ryugu: 'Dark as coal, shaped like a diamond.', flavor_skin_neowise: 'Lit up the sky of 2020 to the naked eye.',
    flavor_skin_tsuchinshan: 'A tail so long it crossed the sky of 2024.', flavor_skin_halebopp: 'Two tails: one blue of gas, one white of dust.',
    flavor_skin_borisov: 'A comet from another star, tail and all.', flavor_skin_oumuamua: 'The first visitor from outside. It passed by and never stopped.',
    flavor_skin_atlas3i: 'Older than the Sun. Came from far away to pass just once.', flavor_skin_wanderer: 'A planet with no star. Only the aurora at its poles keeps it company.',
    trail_rings: 'Rings', trail_sparks: 'Sparks', trail_binary: 'Binary', trail_wave: 'Waveform', trail_shards: 'Shards', trail_lanterns: 'Lanterns',
    trail_orbiters: 'Moons', trail_iontail: 'Ion Tail', trail_paint: 'Brushstroke', trail_moth: 'Moths', trail_dna: 'DNA', trail_spiral: 'Spiral',
    flavor_trail_rings: 'Little rings left behind, fading away.', flavor_trail_sparks: 'They rise, crackle and go out.', flavor_trail_binary: 'Zeros and ones falling from your wake.',
    flavor_trail_wave: 'The shape of the sound you make passing by.', flavor_trail_shards: 'Broken glass turning slowly.', flavor_trail_lanterns: 'Paper lanterns rising slowly.',
    flavor_trail_orbiters: 'Two small moons circling your path.', flavor_trail_iontail: 'Blue gas in a straight line, dust curving behind.', flavor_trail_paint: 'Thick paint, bristles showing.',
    flavor_trail_moth: 'Night moths drawn to your light.', flavor_trail_dna: 'Two braided strands with bridges between them.', flavor_trail_spiral: 'Spirals unwinding and fading.',
    jetskin_comet: 'Comet', jetskin_petals: 'Petals', jetskin_ember: 'Ember', jetskin_binary: 'Binary', jetskin_crystal: 'Crystal', jetskin_neonline: 'Neon Line', jetskin_aurora: 'Aurora', jetskin_dragonfire: 'Dragonfire',
    aegisskin_lace: 'Lace', aegisskin_thorns: 'Thorns', aegisskin_orbit: 'Orbit', aegisskin_prism: 'Prism', aegisskin_halo: 'Halo', aegisskin_nebula: 'Nebula'
  });
  Object.assign(HR.I18N.es, {
    col_visitors: 'Visitantes', a_col_visitors: 'Visitantes de paso', a_d_col_visitors: 'Ten las {n} bolas de los Visitantes',
    skin_bennu: 'Bennu', skin_halley: 'Halley', skin_ryugu: 'Ryugu', skin_neowise: 'NEOWISE', skin_tsuchinshan: 'Tsuchinshan-ATLAS',
    skin_halebopp: 'Hale-Bopp', skin_borisov: '2I/Borisov', skin_oumuamua: 'ʻOumuamua', skin_atlas3i: '3I/ATLAS', skin_wanderer: 'Errante',
    flavor_skin_bennu: 'Un trompo de grava. Una sonda trajo un puñado de él.', flavor_skin_halley: 'Vuelve cada 76 años. Casi todos lo ven una vez.',
    flavor_skin_ryugu: 'Oscuro como el carbón, con forma de diamante.', flavor_skin_neowise: 'Iluminó el cielo de 2020 a simple vista.',
    flavor_skin_tsuchinshan: 'Una cola tan larga que cruzó el cielo de 2024.', flavor_skin_halebopp: 'Dos colas: una azul de gas, otra blanca de polvo.',
    flavor_skin_borisov: 'Un cometa de otra estrella, con cola y todo.', flavor_skin_oumuamua: 'El primer visitante de fuera. Pasó, no se detuvo.',
    flavor_skin_atlas3i: 'Más viejo que el Sol. Vino de lejos para pasar una sola vez.', flavor_skin_wanderer: 'Un planeta sin estrella. Solo la aurora en los polos le hace compañía.',
    trail_rings: 'Aros', trail_sparks: 'Chispas', trail_binary: 'Binario', trail_wave: 'Onda de Sonido', trail_shards: 'Esquirlas', trail_lanterns: 'Farolillos',
    trail_orbiters: 'Lunas', trail_iontail: 'Cola de Iones', trail_paint: 'Pincelada', trail_moth: 'Polillas', trail_dna: 'ADN', trail_spiral: 'Espiral',
    flavor_trail_rings: 'Aros pequeños que quedan atrás y se apagan.', flavor_trail_sparks: 'Suben, chispean y se apagan.', flavor_trail_binary: 'Ceros y unos cayendo de tu estela.',
    flavor_trail_wave: 'La forma del sonido que haces al pasar.', flavor_trail_shards: 'Vidrio roto girando despacio.', flavor_trail_lanterns: 'Farolillos de papel subiendo despacio.',
    flavor_trail_orbiters: 'Dos lunas pequeñas girando en tu camino.', flavor_trail_iontail: 'Gas azul en línea recta, polvo curvándose detrás.', flavor_trail_paint: 'Pintura gruesa, cerdas marcadas.',
    flavor_trail_moth: 'Polillas atraídas por tu luz.', flavor_trail_dna: 'Dos hebras trenzadas, con puentes entre ellas.', flavor_trail_spiral: 'Espirales que se desenrollan y desaparecen.',
    jetskin_comet: 'Cometa', jetskin_petals: 'Pétalos', jetskin_ember: 'Brasa', jetskin_binary: 'Binario', jetskin_crystal: 'Cristal', jetskin_neonline: 'Línea Neón', jetskin_aurora: 'Aurora', jetskin_dragonfire: 'Fuego de Dragón',
    aegisskin_lace: 'Encaje', aegisskin_thorns: 'Espinas', aegisskin_orbit: 'Órbita', aegisskin_prism: 'Prisma', aegisskin_halo: 'Aureola', aegisskin_nebula: 'Nebulosa'
  });
})();
