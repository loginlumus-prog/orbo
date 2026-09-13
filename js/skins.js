/* =====================================================================
   Coleção de bolas v5: 138 bolas em 15 coleções. Cada bola tem raridade e
   dois preços: moedas (grátis, jogando) ou gemas (pago). Prêmios (galáxias,
   Arcontes) só se ganham jogando. TON 618: 1.500.000 moedas ou R$ 99,90.
   Desenho: js/render-skins.js · Loja: js/ui-shop.js
   ===================================================================== */
window.HR = window.HR || {};

HR.RARITY.ultimate = { w: 0, color: '#ffe27a' };
HR.SKIN_PRICE = { common: [800, 40], rare: [3000, 90], epic: [15000, 220], legendary: [80000, 600], mythic: [400000, 1800], ultimate: [1500000, 0] };

HR.COLLECTIONS = [
  { id: 'classic',    icon: 'ball' },
  { id: 'planets',    icon: 'planet' },
  { id: 'stars',      icon: 'starShape' },
  { id: 'nebulae',    icon: 'nebula' },
  { id: 'blackholes', icon: 'blackhole' },
  { id: 'gems',       icon: 'gem' },
  { id: 'sports',     icon: 'sports' },
  { id: 'creatures',  icon: 'smile' },
  { id: 'elements',   icon: 'elements' },
  { id: 'tech',       icon: 'chip' },
  { id: 'arts',       icon: 'mandala' },
  { id: 'sweets',     icon: 'donut' },
  { id: 'season',     icon: 'season' },
  { id: 'galaxies',   icon: 'galaxy' },
  { id: 'archons',    icon: 'sigil' }
];

(function () {
  const C = HR.CONFIG;
  // coleção e raridade das 26 bolas do v4
  const OLD = {
    classic: ['classic', 'common'], neon: ['classic', 'rare'], lava: ['elements', 'rare'], ice: ['elements', 'rare'], soccer: ['sports', 'common'], gold: ['gems', 'epic'],
    galaxy: ['galaxies', 'epic'], ghost: ['creatures', 'epic'], eye: ['creatures', 'legendary'], rainbow: ['classic', 'legendary'], plasma: ['classic', 'legendary'],
    eight: ['sports', 'common'], moon: ['planets', 'common'], bee: ['creatures', 'rare'], sun: ['stars', 'rare'], toxic: ['elements', 'rare'], saturn: ['planets', 'epic'],
    pearl: ['gems', 'epic'], void: ['blackholes', 'legendary'], comet: ['classic', 'legendary'], dragon: ['creatures', 'legendary'],
    pumpkin: ['season', 'rare'], candycane: ['season', 'rare'], balloon: ['season', 'rare'], confetti: ['season', 'rare'], beach: ['season', 'rare']
  };
  C.SKINS.forEach(s => { const o = OLD[s.id]; if (o) { s.col = o[0]; s.rar = o[1]; } });

  const add = (col, rar, lvl, list) => list.forEach(([id, base, dark, glow, extra]) => C.SKINS.push(Object.assign({ id, col, rar, lvl, cur: 'coins', base, dark, glow, pattern: 'none' }, extra || {})));
  const L = (a) => a; // legibilidade

  // ---------- Sistema Solar ----------
  add('planets', 'common', 2, [['mercury', '#b8b0a6', '#4e4843', '#d9d2c9', { pattern: 'planet', pl: 'mercury' }], ['ceres', '#9a9690', '#3a3836', '#cfcbc4', { pattern: 'planet', pl: 'ceres', lvl: 4 }], ['venus', '#f0d59a', '#a0703a', '#ffe2a8', { pattern: 'planet', pl: 'venus', lvl: 3 }]]);
  add('planets', 'rare', 6, [['mars', '#d9673a', '#6b200c', '#ff8a5c', { pattern: 'planet', pl: 'mars' }], ['jupiter', '#e3c29b', '#7a4a26', '#ffd9a8', { pattern: 'planet', pl: 'jupiter', lvl: 8 }], ['uranus', '#b9f1f5', '#3e8fa0', '#bff8ff', { pattern: 'planet', pl: 'uranus', lvl: 9, decor: 'planetRing', ringTilt: 1.35 }], ['io', '#f2e35a', '#9a7a18', '#fff39a', { pattern: 'planet', pl: 'io', lvl: 10 }], ['europa', '#f3ece0', '#9a8c78', '#ffffff', { pattern: 'planet', pl: 'europa', lvl: 11 }], ['ganymede', '#a89a8a', '#3d342c', '#d7cbbd', { pattern: 'planet', pl: 'ganymede', lvl: 13 }]]);
  add('planets', 'epic', 12, [['earth', '#3b82d6', '#0b2a66', '#7fd0ff', { pattern: 'planet', pl: 'earth' }], ['neptune', '#4f7df0', '#0f2270', '#6f9bff', { pattern: 'planet', pl: 'neptune', lvl: 14 }], ['pluto', '#c9a888', '#5a3f2c', '#ffe0c4', { pattern: 'planet', pl: 'pluto', lvl: 16 }], ['titan', '#e9a54a', '#7a4210', '#ffc36b', { pattern: 'planet', pl: 'titan', lvl: 18 }]]);
  // ---------- Estrelas (forma de estrela) ----------
  add('stars', 'common', 3, [['reddwarf', '#ff8a5c', '#b3240f', '#ff5e3d', { shape: 'star', st: 'classic' }]]);
  add('stars', 'rare', 6, [['whitedwarf', '#f4fbff', '#9ec8ff', '#cfe8ff', { shape: 'star', st: 'whitedwarf' }], ['sirius', '#ffffff', '#a8d4ff', '#dff1ff', { shape: 'star', st: 'sirius', points: 4, lvl: 9 }], ['neutron', '#ffffff', '#8fb8ff', '#9fd0ff', { shape: 'star', st: 'neutron', lvl: 12 }]]);
  add('stars', 'epic', 14, [['bluegiant', '#9fd0ff', '#2456d6', '#6fb1ff', { shape: 'star', st: 'bluegiant', points: 6 }], ['betelgeuse', '#ff7a3d', '#8a1a0a', '#ff6a3d', { shape: 'star', st: 'betelgeuse', lvl: 18 }], ['nova', '#fff3c2', '#ff9f43', '#ffcf4a', { shape: 'star', st: 'nova', points: 6, lvl: 20 }]]);
  add('stars', 'legendary', 24, [['pulsar', '#e8f6ff', '#5aa9ff', '#9be7ff', { shape: 'star', st: 'pulsar', points: 4 }], ['binary', '#cfe8ff', '#4c7dff', '#bfe0ff', { shape: 'star', st: 'binary', base2: '#ffe2a8', dark2: '#ff7a1a', lvl: 27 }], ['magnetar', '#e6d8ff', '#6a45e0', '#a88bff', { shape: 'star', st: 'magnetar', lvl: 30 }]]);
  // ---------- Nebulosas ----------
  add('nebulae', 'rare', 7, [['orion', '#2a1446', '#0a0418', '#ff7ad9', { pattern: 'nebula', nb: 'cloud', c: ['#ff5ecf', '#6f9bff', '#b48cff'], seed: 1 }], ['carina', '#3a2410', '#120a04', '#ffb347', { pattern: 'nebula', nb: 'cloud', c: ['#ffb347', '#ff7a3d', '#6f9bff'], seed: 7, lvl: 10 }], ['ringneb', '#10102a', '#03030c', '#7cff6b', { pattern: 'nebula', nb: 'ring', c: ['#ff5e3d', '#7cff6b', '#4cf0ff'], seed: 3, lvl: 12 }], ['eagle', '#16301c', '#050e08', '#9dff8a', { pattern: 'nebula', nb: 'pillars', c: ['#9dff8a', '#ffcf4a', '#ff9f43'], seed: 11, lvl: 13 }]]);
  add('nebulae', 'epic', 15, [['crab', '#1a1030', '#05030d', '#ff9f43', { pattern: 'nebula', nb: 'crab', c: ['#ff9f43', '#4cf0ff', '#ff5e7e'], seed: 5 }], ['horsehead', '#4a0f1a', '#12040a', '#ff5e7e', { pattern: 'nebula', nb: 'horsehead', c: ['#ff3d5e', '#ff8a9c', '#8f6bff'], seed: 9, lvl: 17 }], ['helix', '#0f1a3a', '#040816', '#4cf0ff', { pattern: 'nebula', nb: 'helix', c: ['#ff5e3d', '#4cf0ff', '#ffcf4a'], seed: 13, lvl: 19 }], ['catseye', '#0d1f2a', '#02070c', '#35e29a', { pattern: 'nebula', nb: 'catseye', c: ['#35e29a', '#ff5ecf', '#4cf0ff'], seed: 15, lvl: 22 }]]);
  add('nebulae', 'legendary', 26, [['pillars', '#1d3a3a', '#061414', '#7cff6b', { pattern: 'nebula', nb: 'pillars', c: ['#7cff9b', '#ffcf4a', '#4cf0ff'], seed: 17 }], ['butterfly', '#2a0f3a', '#08030e', '#c39bff', { pattern: 'nebula', nb: 'butterfly', c: ['#c39bff', '#ff7ad9', '#4cf0ff'], seed: 19, lvl: 29 }]]);
  // ---------- Buracos Negros ----------
  add('blackholes', 'epic', 20, [['cygnus', '#000000', '#000000', '#9be7ff', { shape: 'blackhole', bh: 'cygnus', disk: ['#ffffff', '#9be7ff', '#4c7dff'] }]]);
  add('blackholes', 'legendary', 32, [['sgra', '#000000', '#000000', '#ffb347', { shape: 'blackhole', bh: 'sgra', disk: ['#fff6d8', '#ffb347', '#ff5e3d'] }]]);
  add('blackholes', 'mythic', 42, [['m87', '#000000', '#000000', '#ff9f43', { shape: 'blackhole', bh: 'm87', disk: ['#fff3c2', '#ffb347', '#8a2a0a'] }]]);
  add('blackholes', 'ultimate', 1, [['ton618', '#000000', '#000000', '#ffcf4a', { shape: 'blackhole', bh: 'ton618', disk: ['#fffbe6', '#ffcf4a', '#ff5e3d'], product: 'skin_ton618' }]]);
  // ---------- Gemas ----------
  add('gems', 'common', 3, [['amethyst', '#b48cff', '#4a1f8a', '#c39bff', { pattern: 'facets' }], ['topaz', '#ffcf4a', '#a0610a', '#ffe27a', { pattern: 'facets', lvl: 4 }]]);
  add('gems', 'rare', 6, [['ruby', '#ff4d6d', '#7a0b1f', '#ff5e7e', { pattern: 'facets' }], ['sapphire', '#4d7dff', '#0b1f7a', '#6f9bff', { pattern: 'facets', lvl: 7 }], ['emerald', '#35e29a', '#0b5a36', '#5cffb5', { pattern: 'facets', lvl: 8 }]]);
  add('gems', 'epic', 16, [['obsidian', '#2a2438', '#050308', '#8f6bff', { pattern: 'facets', facet: '#b48cff' }], ['opal', '#f3f0ff', '#b7c6e6', '#ffd6f2', { pattern: 'facets', opal: true, lvl: 19 }]]);
  add('gems', 'legendary', 25, [['diamond', '#f4fbff', '#9fc4e8', '#ffffff', { pattern: 'facets' }]]);
  // ---------- Esportes ----------
  add('sports', 'common', 2, [['basketball', '#ff8a3d', '#b34a0a', '#ffb070', { pattern: 'sport', sp: 'basketball' }], ['tennis', '#dfff4a', '#8aa80a', '#eaff8a', { pattern: 'sport', sp: 'tennis' }], ['volleyball', '#ffffff', '#cfd6e6', '#ffffff', { pattern: 'sport', sp: 'volleyball', lvl: 3 }], ['baseball', '#fbf6ea', '#c9bfa6', '#ffffff', { pattern: 'sport', sp: 'baseball', lvl: 3 }]]);
  add('sports', 'rare', 6, [['golf', '#ffffff', '#c9d0de', '#ffffff', { pattern: 'sport', sp: 'golf' }], ['bowling', '#3a3aa8', '#0b0b3a', '#8f6bff', { pattern: 'sport', sp: 'bowling', lvl: 7 }]]);
  // ---------- Criaturas ----------
  add('creatures', 'common', 1, [['smile', '#ffe24a', '#e89a0a', '#ffe27a', { pattern: 'face', fc: 'smile' }]]);
  add('creatures', 'rare', 6, [['cat', '#9aa3b8', '#4a5268', '#cfd6e6', { pattern: 'face', fc: 'cat', decor: 'ears', ears: 'cat', earColor: '#6b7390' }], ['panda', '#ffffff', '#cfd6e6', '#ffffff', { pattern: 'face', fc: 'panda', decor: 'ears', ears: 'round', earColor: '#15151c', lvl: 8 }], ['frog', '#5cd65c', '#1f6b1f', '#9dff8a', { pattern: 'face', fc: 'frog', decor: 'ears', ears: 'frog', lvl: 9 }], ['slime', '#8dff9a', '#1f9a4a', '#7cff9b', { pattern: 'face', fc: 'slime', lvl: 10 }]]);
  add('creatures', 'epic', 14, [['alien', '#8dff7a', '#1f7a2a', '#7cff6b', { pattern: 'face', fc: 'alien', decor: 'ears', ears: 'antennae', earColor: '#3fae3a' }], ['owl', '#a07048', '#4a2a14', '#ffcf4a', { pattern: 'face', fc: 'owl', decor: 'ears', ears: 'tufts', earColor: '#6b4424', lvl: 15 }], ['robot', '#c9d2e3', '#5a6478', '#4cf0ff', { pattern: 'face', fc: 'robot', decor: 'ears', ears: 'antenna', lvl: 17 }]]);
  // ---------- Elementos ----------
  add('elements', 'common', 2, [['rock', '#8a7d70', '#3a322a', '#bfb2a4', { pattern: 'element', el: 'rock' }], ['wind', '#bff8ff', '#5ab8d6', '#dff8ff', { pattern: 'element', el: 'wind', lvl: 3 }]]);
  add('elements', 'rare', 7, [['water', '#3aa0ff', '#0a2f7a', '#7fd6ff', { pattern: 'element', el: 'water' }], ['fire', '#ff6a2b', '#7a0f0a', '#ff8a3d', { pattern: 'element', el: 'fire', lvl: 8 }]]);
  add('elements', 'epic', 16, [['storm', '#4a5fa8', '#0a1030', '#9be7ff', { pattern: 'element', el: 'storm' }]]);
  add('elements', 'legendary', 28, [['light', '#fff6d0', '#ffcf4a', '#fff3a0', { pattern: 'element', el: 'light' }], ['shadow', '#1a1030', '#020108', '#8f6bff', { pattern: 'element', el: 'shadow', lvl: 31 }]]);
  // ---------- Tecnologia ----------
  add('tech', 'common', 2, [['pixel', '#ff5e7e', '#8a1030', '#ff8aa0', { pattern: 'tech', tc: 'pixel' }], ['vinyl', '#1b1b22', '#000000', '#e63946', { pattern: 'tech', tc: 'vinyl', lvl: 4 }]]);
  add('tech', 'rare', 9, [['chip', '#1f5a3a', '#08201a', '#35e29a', { pattern: 'tech', tc: 'chip' }], ['radar', '#0f2a1a', '#020a05', '#35e29a', { pattern: 'tech', tc: 'radar', lvl: 11 }]]);
  add('tech', 'epic', 15, [['disco', '#dfe6ff', '#6a7390', '#ffffff', { pattern: 'tech', tc: 'disco' }], ['hologram', '#4cf0ff', '#0a4a66', '#9be7ff', { pattern: 'tech', tc: 'hologram', lvl: 17 }], ['ufo', '#9aa6c9', '#4a5268', '#7cff9b', { shape: 'ufo', lvl: 20 }]]);
  add('tech', 'legendary', 26, [['glitch', '#1a1030', '#05030d', '#ff5ecf', { pattern: 'tech', tc: 'glitch' }]]);
  // ---------- Artes ----------
  add('arts', 'common', 3, [['origami', '#4cf0ff', '#1a6a8a', '#9be7ff', { pattern: 'art', ar: 'origami' }], ['maze', '#6a45e0', '#1f0f5a', '#4cf0ff', { pattern: 'art', ar: 'maze', lvl: 4 }]]);
  add('arts', 'rare', 8, [['compass', '#f3e3c2', '#a88a5a', '#ffe2a8', { pattern: 'art', ar: 'compass' }], ['clock', '#fbf6ea', '#c9bfa6', '#ffffff', { pattern: 'art', ar: 'clock', lvl: 10 }]]);
  add('arts', 'epic', 18, [['mandala', '#ff7ad9', '#6a1a5a', '#ffcf4a', { pattern: 'art', ar: 'mandala' }]]);
  add('arts', 'legendary', 27, [['stainedglass', '#2a2438', '#0a0810', '#ffcf4a', { pattern: 'art', ar: 'stainedglass' }]]);
  // ---------- Doces ----------
  add('sweets', 'common', 2, [['cookie', '#d9a066', '#8a5a2a', '#ffd6a0', { pattern: 'sweet', sw: 'cookie' }], ['orange', '#ffb347', '#e06a00', '#ffcf4a', { pattern: 'sweet', sw: 'orange' }], ['watermelon', '#ff4d6d', '#b3143a', '#ff8aa0', { pattern: 'sweet', sw: 'watermelon', lvl: 3 }], ['candy', '#ffffff', '#e8e8e8', '#ff5e7e', { pattern: 'sweet', sw: 'candy', lvl: 4 }]]);
  add('sweets', 'rare', 6, [['donut', '#ff8ac4', '#c2185b', '#ffb3d9', { shape: 'donut' }], ['marble', '#eef6ff', '#a8c0dc', '#ffffff', { pattern: 'sweet', sw: 'marble', lvl: 7 }]]);
  // ---------- Temporadas ----------
  add('season', 'rare', 1, [['ornament', '#e63946', '#7a0b1f', '#ff5e7e', { pattern: 'seasonal', ss: 'ornament', decor: 'ornamentCap', season: 'natal' }], ['snowglobe', '#dff4ff', '#6fa8d6', '#ffffff', { pattern: 'seasonal', ss: 'snowglobe', season: 'natal' }], ['sugarskull', '#ffffff', '#d6cfe6', '#ff5ecf', { pattern: 'seasonal', ss: 'sugarskull', season: 'halloween' }], ['mask', '#8f6bff', '#3b1f8a', '#ffcf4a', { pattern: 'seasonal', ss: 'mask', decor: 'feathers', season: 'carnaval' }], ['lantern', '#ffcf4a', '#c0392b', '#ffcf4a', { pattern: 'seasonal', ss: 'lantern', season: 'junina' }]]);
  // ---------- Galáxias (prêmio do chefe de cada galáxia) ----------
  const GX = [['magellan', '#4cf0ff', { style: 'irregular', c2: '#ff7ad9' }], ['whirlpool', '#5aa9ff', { arms: 2, companion: true }], ['sunflower', '#7cff6b', { arms: 5, flocc: true, wind: 2.4 }], ['cigar', '#ff9f43', { style: 'edge', plumes: true, tilt: 1, rot: -0.6 }], ['sombrero', '#a29bfe', { style: 'edge', dust: true, tilt: 1, rot: -0.2, c2: '#fff3c2' }], ['pinwheel', '#ff7ad9', { arms: 4, wind: 4.2 }], ['antennae', '#ffd93d', { style: 'pair', arms: 2, wind: 2 }], ['blackeye', '#5b6cff', { arms: 2, dust: true }], ['cartwheel', '#ff5ecf', { style: 'ring' }], ['andromeda', '#ffcf4a', { arms: 2, tilt: 0.38, wind: 4, c2: '#fff3c2' }]];
  GX.forEach(([g, col, gx], i) => { C.SKINS.push({ id: 'gal_' + g, col: 'galaxies', rar: 'legendary', lvl: 1, cur: 'reward', price: 0, base: '#0c1230', dark: '#01020a', glow: col, pattern: 'galaxyspin', gx, galaxy: i }); HR.REGIONS[i].galSkin = 'gal_' + g; });
  // ---------- Arcontes (prêmio de cada camada da Singularidade) ----------
  ['#cfe8ff', '#9dff8a', '#ffcf4a', '#ff8aa0', '#4cf0ff', '#fff3a0', '#ffb347', '#35e29a', '#e6d8ff', '#8fb8ff', '#ffffff'].forEach((col, i) => C.SKINS.push({ id: 'arc_' + (i + 1), col: 'archons', rar: 'mythic', lvl: 1, cur: 'archon', price: 0, base: '#1c1846', dark: '#04030c', glow: col, pattern: 'archon', ax: i, layer: i }));
  void L;

  // preço duplo: moedas (grátis) ou gemas (pago). Prêmios e IAP não entram.
  C.SKINS.forEach(s => {
    if (!s.col) s.col = 'classic';
    if (!s.rar) s.rar = 'common';
    if (['pack', 'reward', 'archon'].includes(s.cur) || s.id === 'classic') { s.gems = s.gems || 0; return; }
    if (s.cur === 'iap' && s.id !== 'ton618') return;
    const P = HR.SKIN_PRICE[s.rar] || HR.SKIN_PRICE.common;
    if (s.cur === 'gems') { s.gems = s.price; s.price = P[0]; s.cur = 'coins'; }
    else { if (!s.price) s.price = P[0]; if (!s.gems) s.gems = P[1]; }
    if (s.id === 'ton618') { s.cur = 'coins'; s.price = P[0]; s.gems = 0; }
    s.lvl = Math.min(s.lvl || 1, 50);
  });
  // trilhas e temas também com preço duplo (são cosméticos)
  C.TRAILS.concat(C.THEMES).forEach(s => { if (s.price === 0) { s.gems = 0; return; } if (s.cur === 'gems') { s.gems = s.price; s.price = s.price * 110; s.cur = 'coins'; } else if (!s.gems) s.gems = s.rar ? HR.SKIN_PRICE[s.rar][1] : Math.max(30, Math.round(s.price / 20)); });

  C.PRODUCTS.push({ id: 'skin_ton618', type: 'skin', skins: ['ton618'], price: { pt: 'R$ 99,90', en: '$19.99', es: '$19.99' }, tag: 'best' });
})();

/* ---------------- textos ---------------- */
Object.assign(HR.I18N.pt, {
  rarity_ultimate: 'Singular', collection: 'Coleção', col_all: 'Todas', buy_coins: 'Moedas', buy_gems: 'Gemas', reward_only: 'Só jogando', reward_galaxy: 'Prêmio: vença o chefe de {name}', reward_archon: 'Prêmio: atravesse a {n}ª camada da Singularidade', col_progress: '{a}/{b} na coleção',
  col_classic: 'Clássicas', col_planets: 'Sistema Solar', col_stars: 'Estrelas', col_nebulae: 'Nebulosas', col_blackholes: 'Buracos Negros', col_gems: 'Gemas', col_sports: 'Esportes', col_creatures: 'Criaturas', col_elements: 'Elementos', col_tech: 'Tecnologia', col_arts: 'Artes', col_sweets: 'Doces', col_season: 'Temporadas', col_galaxies: 'Galáxias', col_archons: 'Arcontes',
  prod_skin_ton618: 'TON 618', prod_skin_ton618_d: 'O maior buraco negro conhecido, com disco de acreção, jatos e lente de luz. Também sai por 1.500.000 moedas.',
  skin_mercury: 'Mercúrio', skin_venus: 'Vênus', skin_earth: 'Terra', skin_mars: 'Marte', skin_jupiter: 'Júpiter', skin_uranus: 'Urano', skin_neptune: 'Netuno', skin_pluto: 'Plutão', skin_io: 'Io', skin_europa: 'Europa', skin_titan: 'Titã', skin_ganymede: 'Ganimedes', skin_ceres: 'Ceres',
  skin_reddwarf: 'Anã Vermelha', skin_whitedwarf: 'Anã Branca', skin_bluegiant: 'Gigante Azul', skin_betelgeuse: 'Betelgeuse', skin_pulsar: 'Pulsar', skin_magnetar: 'Magnetar', skin_neutron: 'Estrela de Nêutrons', skin_nova: 'Nova', skin_binary: 'Estrela Binária', skin_sirius: 'Sírius',
  skin_orion: 'Órion', skin_crab: 'Caranguejo', skin_helix: 'Hélice', skin_carina: 'Carina', skin_pillars: 'Pilares da Criação', skin_horsehead: 'Cabeça de Cavalo', skin_ringneb: 'Nebulosa do Anel', skin_catseye: 'Olho de Gato', skin_butterfly: 'Borboleta', skin_eagle: 'Águia',
  skin_cygnus: 'Cygnus X-1', skin_sgra: 'Sagitário A*', skin_m87: 'M87*', skin_ton618: 'TON 618',
  skin_ruby: 'Rubi', skin_sapphire: 'Safira', skin_emerald: 'Esmeralda', skin_amethyst: 'Ametista', skin_topaz: 'Topázio', skin_diamond: 'Diamante', skin_obsidian: 'Obsidiana', skin_opal: 'Opala',
  skin_basketball: 'Basquete', skin_tennis: 'Tênis', skin_volleyball: 'Vôlei', skin_baseball: 'Beisebol', skin_bowling: 'Boliche', skin_golf: 'Golfe',
  skin_smile: 'Sorriso', skin_cat: 'Gato', skin_panda: 'Panda', skin_alien: 'Alienígena', skin_robot: 'Robô', skin_slime: 'Gosma', skin_owl: 'Coruja', skin_frog: 'Sapo',
  skin_fire: 'Fogo', skin_water: 'Água', skin_storm: 'Tempestade', skin_rock: 'Rocha', skin_wind: 'Vento', skin_light: 'Luz', skin_shadow: 'Sombra',
  skin_chip: 'Chip', skin_hologram: 'Holograma', skin_glitch: 'Glitch', skin_vinyl: 'Vinil', skin_radar: 'Radar', skin_pixel: 'Pixel', skin_ufo: 'Disco Voador', skin_disco: 'Globo de Espelhos',
  skin_mandala: 'Mandala', skin_stainedglass: 'Vitral', skin_compass: 'Bússola', skin_clock: 'Relógio', skin_origami: 'Origami', skin_maze: 'Labirinto',
  skin_donut: 'Rosquinha', skin_orange: 'Laranja', skin_watermelon: 'Melancia', skin_marble: 'Bola de Gude', skin_cookie: 'Biscoito', skin_candy: 'Bala de Hortelã',
  skin_ornament: 'Enfeite', skin_snowglobe: 'Globo de Neve', skin_sugarskull: 'Caveira Doce', skin_mask: 'Máscara', skin_lantern: 'Balão Junino',
  skin_gal_magellan: 'Nuvem de Magalhães', skin_gal_whirlpool: 'Rodamoinho', skin_gal_sunflower: 'Girassol', skin_gal_cigar: 'Charuto', skin_gal_sombrero: 'Sombrero', skin_gal_pinwheel: 'Cata-vento', skin_gal_antennae: 'Antenas', skin_gal_blackeye: 'Olho Negro', skin_gal_cartwheel: 'Roda de Carro', skin_gal_andromeda: 'Andrômeda',
  skin_arc_1: 'Espelho', skin_arc_2: 'Semente', skin_arc_3: 'Dívida Perdoada', skin_arc_4: 'Mão Estendida', skin_arc_5: 'Voz', skin_arc_6: 'Estrela que Esperou', skin_arc_7: 'Farol', skin_arc_8: 'Mãos', skin_arc_9: 'Pluma', skin_arc_10: 'Ponte', skin_arc_11: 'Luz de Onde Viemos',
  flavor_skin_mercury: 'O mais perto do Sol, cheio de crateras.', flavor_skin_venus: 'Nuvens douradas que nunca param.', flavor_skin_earth: 'Oceanos, continentes e nuvens: a nossa casa.', flavor_skin_mars: 'Poeira vermelha e calotas de gelo.', flavor_skin_jupiter: 'Faixas gigantes e a Grande Mancha Vermelha.', flavor_skin_uranus: 'Gira deitado, com um anel discreto.', flavor_skin_neptune: 'Azul profundo e ventos supersônicos.', flavor_skin_pluto: 'Pequeno, distante e com um coração de gelo.', flavor_skin_io: 'Vulcões por toda parte.', flavor_skin_europa: 'Gelo rachado sobre um oceano escondido.', flavor_skin_titan: 'Névoa laranja e lagos de metano.', flavor_skin_ganymede: 'A maior lua do Sistema Solar.', flavor_skin_ceres: 'Um planeta anão com pontos brilhantes.',
  flavor_skin_reddwarf: 'Pequena, fria e paciente.', flavor_skin_whitedwarf: 'O brilho que resta de uma estrela.', flavor_skin_bluegiant: 'Quente, jovem e ofuscante.', flavor_skin_betelgeuse: 'Uma supergigante que pulsa no ombro de Órion.', flavor_skin_pulsar: 'Um farol cósmico girando.', flavor_skin_magnetar: 'O campo magnético mais forte do universo.', flavor_skin_neutron: 'Uma colher dela pesaria uma montanha.', flavor_skin_nova: 'Explode de novo e de novo.', flavor_skin_binary: 'Duas estrelas dançando juntas.', flavor_skin_sirius: 'A estrela mais brilhante do céu noturno.',
  flavor_skin_orion: 'O berçário de estrelas mais famoso.', flavor_skin_crab: 'O que sobrou de uma supernova de 1054.', flavor_skin_helix: 'Um olho gigante no céu.', flavor_skin_carina: 'Nuvens douradas de gás e poeira.', flavor_skin_pillars: 'Colunas de gás onde nascem estrelas.', flavor_skin_horsehead: 'Uma silhueta escura contra o vermelho.', flavor_skin_ringneb: 'Um anel de fumaça cósmica.', flavor_skin_catseye: 'Camadas e camadas de luz.', flavor_skin_butterfly: 'Asas de gás abertas no espaço.', flavor_skin_eagle: 'A águia de poeira e luz.',
  flavor_skin_cygnus: 'Rouba o gás de uma estrela azul vizinha.', flavor_skin_sgra: 'O coração escuro da Via Láctea.', flavor_skin_m87: 'O primeiro buraco negro fotografado.', flavor_skin_ton618: 'Sessenta e seis bilhões de sóis. O maior que conhecemos.',
  flavor_skin_ruby: 'Vermelho de fogo lapidado.', flavor_skin_sapphire: 'Azul de céu profundo.', flavor_skin_emerald: 'Verde que brilha por dentro.', flavor_skin_amethyst: 'Violeta calmo e cristalino.', flavor_skin_topaz: 'Ouro transparente.', flavor_skin_diamond: 'Luz presa em cada face.', flavor_skin_obsidian: 'Vidro vulcânico com brilho roxo.', flavor_skin_opal: 'Todas as cores numa pedra só.',
  flavor_skin_basketball: 'Sobe, gira e cai na cesta.', flavor_skin_tennis: 'Felpuda e veloz.', flavor_skin_volleyball: 'Três cores no ar.', flavor_skin_baseball: 'Costura vermelha e rebatida longa.', flavor_skin_bowling: 'Pesada e brilhante.', flavor_skin_golf: 'Pequenas covinhas, grande distância.',
  flavor_skin_smile: 'Impossível não sorrir junto.', flavor_skin_cat: 'Curioso por todos os arcos.', flavor_skin_panda: 'Calmo, redondo e fofo.', flavor_skin_alien: 'Veio de muito longe para jogar.', flavor_skin_robot: 'Olhos de LED sempre atentos.', flavor_skin_slime: 'Balança, pinga e não desiste.', flavor_skin_owl: 'Enxerga tudo no escuro.', flavor_skin_frog: 'Pula de arco em arco.',
  flavor_skin_fire: 'Chamas que sobem sem parar.', flavor_skin_water: 'Ondas e bolhas dentro da bola.', flavor_skin_storm: 'Raios presos numa esfera.', flavor_skin_rock: 'Firme como uma montanha.', flavor_skin_wind: 'Redemoinhos leves.', flavor_skin_light: 'Irradia para todos os lados.', flavor_skin_shadow: 'Tentáculos de escuridão violeta.',
  flavor_skin_chip: 'Pulsos de dados correndo nas trilhas.', flavor_skin_hologram: 'Uma projeção que tremula.', flavor_skin_glitch: 'Erro de sistema com estilo.', flavor_skin_vinyl: 'O som girando.', flavor_skin_radar: 'Varredura contínua.', flavor_skin_pixel: 'Direto de um jogo de 8 bits.', flavor_skin_ufo: 'Com raio trator e tudo.', flavor_skin_disco: 'A pista é o espaço.',
  flavor_skin_mandala: 'Pétalas em harmonia.', flavor_skin_stainedglass: 'A luz atravessando cores.', flavor_skin_compass: 'Sempre sabe o norte.', flavor_skin_clock: 'O tempo corre enquanto você voa.', flavor_skin_origami: 'Papel dobrado com precisão.', flavor_skin_maze: 'Um labirinto que gira.',
  flavor_skin_donut: 'Cobertura rosa e confeitos.', flavor_skin_orange: 'Suco de energia.', flavor_skin_watermelon: 'Refrescante no verão.', flavor_skin_marble: 'Vidro com fitas coloridas.', flavor_skin_cookie: 'Gotas de chocolate.', flavor_skin_candy: 'Um giro de hortelã.',
  flavor_skin_ornament: 'Direto da árvore de Natal.', flavor_skin_snowglobe: 'Neve caindo sem parar.', flavor_skin_sugarskull: 'Colorida e festiva.', flavor_skin_mask: 'Plumas e brilho de Carnaval.', flavor_skin_lantern: 'Cores de Festa Junina.',
  flavor_skin_gal_magellan: 'A nuvem vizinha, irregular e viva.', flavor_skin_gal_whirlpool: 'Braços em redemoinho e uma companheira.', flavor_skin_gal_sunflower: 'Braços fofos como pétalas.', flavor_skin_gal_cigar: 'Plumas vermelhas saindo do centro.', flavor_skin_gal_sombrero: 'Aba de poeira escura.', flavor_skin_gal_pinwheel: 'Muitos braços girando.', flavor_skin_gal_antennae: 'Duas galáxias em colisão.', flavor_skin_gal_blackeye: 'Uma faixa escura sobre o núcleo.', flavor_skin_gal_cartwheel: 'Um anel de estrelas novas.', flavor_skin_gal_andromeda: 'A grande vizinha, inclinada.',
  flavor_skin_arc_1: 'Quem se vê como é, vê melhor os outros.', flavor_skin_arc_2: 'Tudo o que floresce começou pequeno.', flavor_skin_arc_3: 'Leve é quem solta o que lhe devem.', flavor_skin_arc_4: 'A estrada fica mais curta quando se para por alguém.', flavor_skin_arc_5: 'A verdade não precisa gritar.', flavor_skin_arc_6: 'A luz certa chega na hora certa.', flavor_skin_arc_7: 'Brilhar é para que outros voltem.', flavor_skin_arc_8: 'O maior é o que serve.', flavor_skin_arc_9: 'Voa quem deixa o peso.', flavor_skin_arc_10: 'Há passos que só se dão confiando.', flavor_skin_arc_11: 'Voltamos para a luz de onde viemos.'
});
Object.assign(HR.I18N.pt, {
  theme_twilight: 'Crepúsculo', theme_borealis: 'Aurora Boreal', theme_mars: 'Marte', theme_blizzard: 'Nevasca', theme_deepsea: 'Oceano Profundo', theme_synthwave: 'Synthwave', theme_sakura: 'Sakura', theme_matrix: 'Matriz', theme_crystalcave: 'Caverna de Cristal', theme_voidtheme: 'Vazio', theme_cosmos: 'Cosmos', theme_solarstorm: 'Tempestade Solar',
  flavor_theme_twilight: 'Céu lilás com névoa baixa.', flavor_theme_borealis: 'Cortinas verdes dançando no alto.', flavor_theme_mars: 'Tempestade de poeira vermelha.', flavor_theme_blizzard: 'Neve rodopiando sem parar.', flavor_theme_deepsea: 'Luz filtrada e bolhas no escuro azul.', flavor_theme_synthwave: 'Sol listrado e grade neon dos anos 80.', flavor_theme_sakura: 'Pétalas de cerejeira no espaço.', flavor_theme_matrix: 'Colunas de código verde caindo.', flavor_theme_crystalcave: 'Cristais girando na penumbra.', flavor_theme_voidtheme: 'Pontos de luz no fundo do nada.', flavor_theme_cosmos: 'A Via Láctea inteira atrás de você.', flavor_theme_solarstorm: 'Arcos de plasma de uma estrela furiosa.',
  theme_fx_note: 'No Infinito, este tema muda o fundo e o estilo dos arcos.'
});
Object.assign(HR.I18N.en, {
  theme_twilight: 'Twilight', theme_borealis: 'Northern Lights', theme_mars: 'Mars', theme_blizzard: 'Blizzard', theme_deepsea: 'Deep Sea', theme_synthwave: 'Synthwave', theme_sakura: 'Sakura', theme_matrix: 'Matrix', theme_crystalcave: 'Crystal Cave', theme_voidtheme: 'Void', theme_cosmos: 'Cosmos', theme_solarstorm: 'Solar Storm',
  flavor_theme_twilight: 'Lilac sky with low mist.', flavor_theme_borealis: 'Green curtains dancing above.', flavor_theme_mars: 'A red dust storm.', flavor_theme_blizzard: 'Snow swirling non-stop.', flavor_theme_deepsea: 'Filtered light and bubbles in deep blue.', flavor_theme_synthwave: 'Striped sun and an 80s neon grid.', flavor_theme_sakura: 'Cherry petals in space.', flavor_theme_matrix: 'Falling columns of green code.', flavor_theme_crystalcave: 'Crystals spinning in the dark.', flavor_theme_voidtheme: 'Specks of light at the bottom of nothing.', flavor_theme_cosmos: 'The whole Milky Way behind you.', flavor_theme_solarstorm: 'Plasma arcs from an angry star.',
  theme_fx_note: 'In Endless, this theme changes the background and the ring style.'
});
Object.assign(HR.I18N.es, {
  theme_twilight: 'Crepúsculo', theme_borealis: 'Aurora Boreal', theme_mars: 'Marte', theme_blizzard: 'Ventisca', theme_deepsea: 'Océano Profundo', theme_synthwave: 'Synthwave', theme_sakura: 'Sakura', theme_matrix: 'Matriz', theme_crystalcave: 'Cueva de Cristal', theme_voidtheme: 'Vacío', theme_cosmos: 'Cosmos', theme_solarstorm: 'Tormenta Solar',
  flavor_theme_twilight: 'Cielo lila con niebla baja.', flavor_theme_borealis: 'Cortinas verdes bailando arriba.', flavor_theme_mars: 'Tormenta de polvo rojo.', flavor_theme_blizzard: 'Nieve girando sin parar.', flavor_theme_deepsea: 'Luz filtrada y burbujas en azul profundo.', flavor_theme_synthwave: 'Sol a rayas y rejilla neón de los 80.', flavor_theme_sakura: 'Pétalos de cerezo en el espacio.', flavor_theme_matrix: 'Columnas de código verde cayendo.', flavor_theme_crystalcave: 'Cristales girando en la penumbra.', flavor_theme_voidtheme: 'Puntos de luz en el fondo de la nada.', flavor_theme_cosmos: 'Toda la Vía Láctea detrás de ti.', flavor_theme_solarstorm: 'Arcos de plasma de una estrella furiosa.',
  theme_fx_note: 'En Infinito, este tema cambia el fondo y el estilo de los aros.'
});
Object.assign(HR.I18N.en, {
  rarity_ultimate: 'Singular', collection: 'Collection', col_all: 'All', buy_coins: 'Coins', buy_gems: 'Gems', reward_only: 'Earned only', reward_galaxy: 'Reward: beat the {name} boss', reward_archon: 'Reward: cross layer {n} of the Singularity', col_progress: '{a}/{b} in collection',
  col_classic: 'Classics', col_planets: 'Solar System', col_stars: 'Stars', col_nebulae: 'Nebulae', col_blackholes: 'Black Holes', col_gems: 'Gems', col_sports: 'Sports', col_creatures: 'Creatures', col_elements: 'Elements', col_tech: 'Tech', col_arts: 'Arts', col_sweets: 'Sweets', col_season: 'Seasons', col_galaxies: 'Galaxies', col_archons: 'Archons',
  prod_skin_ton618: 'TON 618', prod_skin_ton618_d: 'The largest known black hole, with accretion disk, jets and lensing. Also available for 1,500,000 coins.',
  skin_mercury: 'Mercury', skin_venus: 'Venus', skin_earth: 'Earth', skin_mars: 'Mars', skin_jupiter: 'Jupiter', skin_uranus: 'Uranus', skin_neptune: 'Neptune', skin_pluto: 'Pluto', skin_io: 'Io', skin_europa: 'Europa', skin_titan: 'Titan', skin_ganymede: 'Ganymede', skin_ceres: 'Ceres',
  skin_reddwarf: 'Red Dwarf', skin_whitedwarf: 'White Dwarf', skin_bluegiant: 'Blue Giant', skin_betelgeuse: 'Betelgeuse', skin_pulsar: 'Pulsar', skin_magnetar: 'Magnetar', skin_neutron: 'Neutron Star', skin_nova: 'Nova', skin_binary: 'Binary Star', skin_sirius: 'Sirius',
  skin_orion: 'Orion', skin_crab: 'Crab', skin_helix: 'Helix', skin_carina: 'Carina', skin_pillars: 'Pillars of Creation', skin_horsehead: 'Horsehead', skin_ringneb: 'Ring Nebula', skin_catseye: 'Cat’s Eye', skin_butterfly: 'Butterfly', skin_eagle: 'Eagle',
  skin_cygnus: 'Cygnus X-1', skin_sgra: 'Sagittarius A*', skin_m87: 'M87*', skin_ton618: 'TON 618',
  skin_ruby: 'Ruby', skin_sapphire: 'Sapphire', skin_emerald: 'Emerald', skin_amethyst: 'Amethyst', skin_topaz: 'Topaz', skin_diamond: 'Diamond', skin_obsidian: 'Obsidian', skin_opal: 'Opal',
  skin_basketball: 'Basketball', skin_tennis: 'Tennis', skin_volleyball: 'Volleyball', skin_baseball: 'Baseball', skin_bowling: 'Bowling', skin_golf: 'Golf',
  skin_smile: 'Smile', skin_cat: 'Cat', skin_panda: 'Panda', skin_alien: 'Alien', skin_robot: 'Robot', skin_slime: 'Slime', skin_owl: 'Owl', skin_frog: 'Frog',
  skin_fire: 'Fire', skin_water: 'Water', skin_storm: 'Storm', skin_rock: 'Rock', skin_wind: 'Wind', skin_light: 'Light', skin_shadow: 'Shadow',
  skin_chip: 'Chip', skin_hologram: 'Hologram', skin_glitch: 'Glitch', skin_vinyl: 'Vinyl', skin_radar: 'Radar', skin_pixel: 'Pixel', skin_ufo: 'Flying Saucer', skin_disco: 'Disco Ball',
  skin_mandala: 'Mandala', skin_stainedglass: 'Stained Glass', skin_compass: 'Compass', skin_clock: 'Clock', skin_origami: 'Origami', skin_maze: 'Maze',
  skin_donut: 'Donut', skin_orange: 'Orange', skin_watermelon: 'Watermelon', skin_marble: 'Marble', skin_cookie: 'Cookie', skin_candy: 'Peppermint',
  skin_ornament: 'Ornament', skin_snowglobe: 'Snow Globe', skin_sugarskull: 'Sugar Skull', skin_mask: 'Carnival Mask', skin_lantern: 'Festival Lantern',
  skin_gal_magellan: 'Magellanic Cloud', skin_gal_whirlpool: 'Whirlpool', skin_gal_sunflower: 'Sunflower', skin_gal_cigar: 'Cigar', skin_gal_sombrero: 'Sombrero', skin_gal_pinwheel: 'Pinwheel', skin_gal_antennae: 'Antennae', skin_gal_blackeye: 'Black Eye', skin_gal_cartwheel: 'Cartwheel', skin_gal_andromeda: 'Andromeda',
  skin_arc_1: 'Mirror', skin_arc_2: 'Seed', skin_arc_3: 'Forgiven Debt', skin_arc_4: 'Outstretched Hand', skin_arc_5: 'Voice', skin_arc_6: 'The Star That Waited', skin_arc_7: 'Lighthouse', skin_arc_8: 'Hands', skin_arc_9: 'Feather', skin_arc_10: 'Bridge', skin_arc_11: 'The Light We Came From'
});
Object.assign(HR.I18N.es, {
  rarity_ultimate: 'Singular', collection: 'Colección', col_all: 'Todas', buy_coins: 'Monedas', buy_gems: 'Gemas', reward_only: 'Solo jugando', reward_galaxy: 'Premio: vence al jefe de {name}', reward_archon: 'Premio: cruza la capa {n} de la Singularidad', col_progress: '{a}/{b} en la colección',
  col_classic: 'Clásicas', col_planets: 'Sistema Solar', col_stars: 'Estrellas', col_nebulae: 'Nebulosas', col_blackholes: 'Agujeros Negros', col_gems: 'Gemas', col_sports: 'Deportes', col_creatures: 'Criaturas', col_elements: 'Elementos', col_tech: 'Tecnología', col_arts: 'Artes', col_sweets: 'Dulces', col_season: 'Temporadas', col_galaxies: 'Galaxias', col_archons: 'Arcontes',
  prod_skin_ton618: 'TON 618', prod_skin_ton618_d: 'El agujero negro más grande conocido, con disco de acreción, chorros y lente de luz. También por 1.500.000 monedas.',
  skin_mercury: 'Mercurio', skin_venus: 'Venus', skin_earth: 'Tierra', skin_mars: 'Marte', skin_jupiter: 'Júpiter', skin_uranus: 'Urano', skin_neptune: 'Neptuno', skin_pluto: 'Plutón', skin_io: 'Ío', skin_europa: 'Europa', skin_titan: 'Titán', skin_ganymede: 'Ganímedes', skin_ceres: 'Ceres',
  skin_reddwarf: 'Enana Roja', skin_whitedwarf: 'Enana Blanca', skin_bluegiant: 'Gigante Azul', skin_betelgeuse: 'Betelgeuse', skin_pulsar: 'Púlsar', skin_magnetar: 'Magnetar', skin_neutron: 'Estrella de Neutrones', skin_nova: 'Nova', skin_binary: 'Estrella Binaria', skin_sirius: 'Sirio',
  skin_orion: 'Orión', skin_crab: 'Cangrejo', skin_helix: 'Hélice', skin_carina: 'Carina', skin_pillars: 'Pilares de la Creación', skin_horsehead: 'Cabeza de Caballo', skin_ringneb: 'Nebulosa del Anillo', skin_catseye: 'Ojo de Gato', skin_butterfly: 'Mariposa', skin_eagle: 'Águila',
  skin_cygnus: 'Cygnus X-1', skin_sgra: 'Sagitario A*', skin_m87: 'M87*', skin_ton618: 'TON 618',
  skin_ruby: 'Rubí', skin_sapphire: 'Zafiro', skin_emerald: 'Esmeralda', skin_amethyst: 'Amatista', skin_topaz: 'Topacio', skin_diamond: 'Diamante', skin_obsidian: 'Obsidiana', skin_opal: 'Ópalo',
  skin_basketball: 'Baloncesto', skin_tennis: 'Tenis', skin_volleyball: 'Voleibol', skin_baseball: 'Béisbol', skin_bowling: 'Bolos', skin_golf: 'Golf',
  skin_smile: 'Sonrisa', skin_cat: 'Gato', skin_panda: 'Panda', skin_alien: 'Alienígena', skin_robot: 'Robot', skin_slime: 'Baba', skin_owl: 'Búho', skin_frog: 'Rana',
  skin_fire: 'Fuego', skin_water: 'Agua', skin_storm: 'Tormenta', skin_rock: 'Roca', skin_wind: 'Viento', skin_light: 'Luz', skin_shadow: 'Sombra',
  skin_chip: 'Chip', skin_hologram: 'Holograma', skin_glitch: 'Glitch', skin_vinyl: 'Vinilo', skin_radar: 'Radar', skin_pixel: 'Píxel', skin_ufo: 'Platillo Volador', skin_disco: 'Bola de Espejos',
  skin_mandala: 'Mandala', skin_stainedglass: 'Vitral', skin_compass: 'Brújula', skin_clock: 'Reloj', skin_origami: 'Origami', skin_maze: 'Laberinto',
  skin_donut: 'Dona', skin_orange: 'Naranja', skin_watermelon: 'Sandía', skin_marble: 'Canica', skin_cookie: 'Galleta', skin_candy: 'Caramelo de Menta',
  skin_ornament: 'Adorno', skin_snowglobe: 'Bola de Nieve', skin_sugarskull: 'Calavera de Azúcar', skin_mask: 'Máscara', skin_lantern: 'Farol de Fiesta',
  skin_gal_magellan: 'Nube de Magallanes', skin_gal_whirlpool: 'Remolino', skin_gal_sunflower: 'Girasol', skin_gal_cigar: 'Cigarro', skin_gal_sombrero: 'Sombrero', skin_gal_pinwheel: 'Molinete', skin_gal_antennae: 'Antenas', skin_gal_blackeye: 'Ojo Negro', skin_gal_cartwheel: 'Rueda de Carro', skin_gal_andromeda: 'Andrómeda',
  skin_arc_1: 'Espejo', skin_arc_2: 'Semilla', skin_arc_3: 'Deuda Perdonada', skin_arc_4: 'Mano Tendida', skin_arc_5: 'Voz', skin_arc_6: 'La Estrella que Esperó', skin_arc_7: 'Faro', skin_arc_8: 'Manos', skin_arc_9: 'Pluma', skin_arc_10: 'Puente', skin_arc_11: 'La Luz de Donde Venimos'
});
