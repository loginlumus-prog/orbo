/* =====================================================================
   ORBO v5.1: cosméticos novos, preços e efeitos de fundo por galáxia (docs/PLANO_V5_1.md)
   - +28 rastros (desenho em render-trails.js)
   - +12 temas com cenário, e cenário também nos temas antigos (render-scenes.js)
   - +14 visuais de Égide, estilos de chama do Jato e +12 Jatos (render-gear-v51.js)
   - preços por raridade: bolas, rastros, temas e visuais se conquistam jogando
   - cada sistema da Galáxia combina dois efeitos de fundo do conjunto da sua galáxia
   Carregado depois de skins.js (sobrescreve os preços normalizados) e antes de content-v5.js.
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const C = HR.CONFIG;
  const SPECIAL = ['pack', 'iap', 'reward', 'archon'];

  // ---------- preços por raridade: [moedas, gemas] ----------
  HR.SKIN_PRICE = { common: [2500, 60], rare: [9000, 150], epic: [32000, 380], legendary: [140000, 900], mythic: [550000, 2400], ultimate: [1500000, 0] };
  HR.TRAIL_PRICE = { common: [2000, 50], rare: [7000, 130], epic: [24000, 320], legendary: [95000, 800] };
  HR.THEME_PRICE = { common: [3000, 70], rare: [10000, 180], epic: [36000, 420], legendary: [120000, 1000] };
  HR.GEAR_PRICE = { rare: [20000, 180], epic: [45000, 380], legendary: [120000, 900] };
  const price = (item, table) => {
    if (item.price === 0 || item.season || SPECIAL.includes(item.cur)) return;
    const P = table[item.rar] || table.rare;
    item.cur = 'coins'; item.price = P[0]; item.gems = P[1];
  };

  // ---------- bolas ----------
  C.SKINS.forEach(s => { if (s.rar !== 'ultimate') price(s, HR.SKIN_PRICE); });

  // ---------- rastros ----------
  const OLD_TRAIL = { none: 'common', dots: 'common', stars: 'rare', fire: 'rare', bubbles: 'epic', rainbow: 'legendary', comet: 'rare', petals: 'epic', lightning: 'legendary', snow: 'epic', bats: 'epic' };
  C.TRAILS.forEach(t => { if (!t.rar) t.rar = OLD_TRAIL[t.id] || 'common'; });
  [
    ['ribbon', 'common', 2], ['neon', 'common', 3], ['smoke', 'common', 2], ['drops', 'common', 4], ['confetti', 'common', 5],
    ['helix', 'rare', 6], ['notes', 'rare', 5], ['hearts', 'rare', 4], ['leaves', 'rare', 7], ['pixel', 'rare', 8], ['laser', 'rare', 9], ['halos', 'rare', 10], ['frost', 'rare', 11],
    ['ink', 'epic', 12], ['stardust', 'epic', 13], ['feathers', 'epic', 14], ['vine', 'epic', 15], ['butterflies', 'epic', 16], ['zigzag', 'epic', 17], ['gold', 'epic', 18], ['blueflame', 'epic', 19], ['meteors', 'epic', 20],
    ['fireworks', 'legendary', 22], ['glitch', 'legendary', 24], ['clones', 'legendary', 26], ['runes', 'legendary', 28], ['aurora', 'legendary', 30], ['prism', 'legendary', 32]
  ].forEach(([id, rar, lvl]) => C.TRAILS.push({ id, rar, lvl, cur: 'coins', price: 1 }));
  C.TRAILS.forEach(t => price(t, HR.TRAIL_PRICE));

  // ---------- temas: cenário em camadas (render-scenes.js) ----------
  const OLD_THEME = { aurora: 'common', sunset: 'rare', ocean: 'rare', cyber: 'epic', space: 'epic', candy: 'legendary', forest: 'rare', inferno: 'epic', prism: 'legendary', halloween: 'epic', natal: 'epic' };
  const SCENE = {
    sunset: ['ocean', {}], ocean: ['reef', {}], cyber: ['city', { lights: '#ff5ecf', neon: '#4cf0ff' }], candy: ['candy', {}], forest: ['forest', {}],
    inferno: ['volcano', {}], prism: ['cave', { glow: '#ff7ad9' }], halloween: ['haunted', {}], natal: ['forest', { snow: true }], twilight: ['mountains', {}],
    borealis: ['arctic', {}], mars: ['mesa', {}], blizzard: ['mountains', { snow: true }], deepsea: ['reef', { deep: true }], matrix: ['city', { lights: '#35e29a', neon: '#35e29a' }],
    sakura: ['temple', {}], crystalcave: ['cave', { glow: '#8fb8ff' }]
  };
  C.THEMES.forEach(t => { if (!t.rar) t.rar = OLD_THEME[t.id] || 'rare'; const s = SCENE[t.id]; if (s) { t.scene = s[0]; t.sceneOpts = s[1]; } });
  [
    { id: 'skies',      rar: 'common',    lvl: 2,  colors: ['#4f6fb3', '#8aa6d8', '#e8b9a8'], shapes: 'orbs',   stars: false, fx: 'wind',      scene: 'clouds',    sceneOpts: {} },
    { id: 'alpine',     rar: 'common',    lvl: 3,  colors: ['#23355e', '#4a5f8f', '#c98c7a'], shapes: 'orbs',   stars: true,  fx: 'snow',      scene: 'mountains', sceneOpts: { snow: true, sun: '#ffd6a8' } },
    { id: 'desert',     rar: 'rare',      lvl: 5,  colors: ['#4a2340', '#a84a36', '#f0a45a'], shapes: 'orbs',   stars: false, fx: 'dust',      scene: 'desert',    sceneOpts: {} },
    { id: 'tropical',   rar: 'rare',      lvl: 6,  colors: ['#3a1f5c', '#b8406a', '#ff9a5a'], shapes: 'orbs',   stars: false, fx: null,        scene: 'ocean',     sceneOpts: { palms: true } },
    { id: 'metropolis', rar: 'rare',      lvl: 8,  colors: ['#1a1f4a', '#0d1030', '#05060f'], shapes: 'orbs',   stars: true,  fx: null,        scene: 'city',      sceneOpts: { lights: '#ffd98a', neon: '#4cf0ff' } },
    { id: 'harbor',     rar: 'rare',      lvl: 10, colors: ['#0e1e3a', '#0a1428', '#040810'], shapes: 'nebula', stars: true,  fx: 'mist',      scene: 'harbor',    sceneOpts: {} },
    { id: 'zen',        rar: 'epic',      lvl: 12, colors: ['#2a1838', '#5a2a4a', '#d98a8a'], shapes: 'orbs',   stars: true,  fx: 'sakura',    scene: 'temple',    sceneOpts: {} },
    { id: 'jungle',     rar: 'epic',      lvl: 14, colors: ['#0c2a1c', '#0a1f16', '#03100a'], shapes: 'orbs',   stars: false, fx: 'fireflies', scene: 'jungle',    sceneOpts: {} },
    { id: 'savanna',    rar: 'epic',      lvl: 16, colors: ['#3a1a2a', '#b8482e', '#ffb35a'], shapes: 'orbs',   stars: false, fx: null,        scene: 'savanna',   sceneOpts: {} },
    { id: 'arcade',     rar: 'epic',      lvl: 18, colors: ['#140a3a', '#2a0a4a', '#4a0a3a'], shapes: 'orbs',   stars: true,  fx: null,        scene: 'arcade',    sceneOpts: {} },
    { id: 'neonrain',   rar: 'legendary', lvl: 22, colors: ['#0a0f26', '#070a1a', '#020308'], shapes: 'orbs',   stars: false, fx: 'rain',      scene: 'city',      sceneOpts: { lights: '#ff5ecf', neon: '#35f0ff', wet: true } },
    { id: 'moonbase',   rar: 'legendary', lvl: 26, colors: ['#05060f', '#0a0c1c', '#1a1c2a'], shapes: 'nebula', stars: true,  fx: 'meteor',    scene: 'moonbase',  sceneOpts: {} }
  ].forEach(t => C.THEMES.push(Object.assign({ cur: 'coins', price: 1 }, t)));
  C.THEMES.forEach(t => price(t, HR.THEME_PRICE));

  // ---------- Égide e Jato: mais visuais ----------
  const G = HR.GEAR;
  G.aegisSkins.push(
    { id: 'bubble',    rar: 'rare',      color: '#9be7ff', color2: '#ff9ad9', style: 'bubble' },
    { id: 'hearts',    rar: 'rare',      color: '#ff7aa8', color2: '#ffd1e0', style: 'hearts' },
    { id: 'leaves',    rar: 'rare',      color: '#7cff6b', color2: '#d8ff9a', style: 'leaves' },
    { id: 'ripple',    rar: 'rare',      color: '#4cc9ff', color2: '#e0f7ff', style: 'ripple' },
    { id: 'circuit',   rar: 'epic',      color: '#35f0c0', color2: '#c8fff0', style: 'circuit' },
    { id: 'stained',   rar: 'epic',      color: '#ffcf4a', color2: '#ff5e7e', style: 'stained' },
    { id: 'sonar',     rar: 'epic',      color: '#35e29a', color2: '#d7ffe9', style: 'sonar' },
    { id: 'cube',      rar: 'epic',      color: '#a29bfe', color2: '#ffffff', style: 'cube' },
    { id: 'clockwork', rar: 'epic',      color: '#e0b36a', color2: '#fff3d6', style: 'clockwork' },
    { id: 'galaxy',    rar: 'legendary', color: '#b48cff', color2: '#ffe8ff', style: 'galaxy' },
    { id: 'wings',     rar: 'legendary', color: '#fff3c2', color2: '#ffffff', style: 'wings' },
    { id: 'dragon',    rar: 'legendary', color: '#ff5a3a', color2: '#ffcf4a', style: 'dragon' },
    { id: 'glitch',    rar: 'legendary', color: '#ff3df0', color2: '#35f0ff', style: 'glitch' },
    { id: 'crown',     rar: 'legendary', color: '#ffd24a', color2: '#fff6c8', style: 'crown' }
  );
  const JET_STYLE = { blue: 'flame', solar: 'flame', emerald: 'flame', plasma: 'plasma', rainbow: 'rainbow' };
  G.jetSkins.forEach(j => { j.style = j.style || JET_STYLE[j.id] || 'flame'; });
  G.jetSkins.push(
    { id: 'ion',       rar: 'rare',      color: '#6fd8ff', color2: '#ffffff', style: 'ion' },
    { id: 'smoke',     rar: 'rare',      color: '#ff9f43', color2: '#d9dde8', style: 'smoke' },
    { id: 'bubbles',   rar: 'rare',      color: '#4cf0ff', color2: '#e0fbff', style: 'bubbles' },
    { id: 'hearts',    rar: 'rare',      color: '#ff6fa8', color2: '#ffd1e0', style: 'hearts' },
    { id: 'pixel',     rar: 'epic',      color: '#ffb347', color2: '#fff07a', style: 'pixel' },
    { id: 'frost',     rar: 'epic',      color: '#bdefff', color2: '#ffffff', style: 'frost' },
    { id: 'starfall',  rar: 'epic',      color: '#ffe27a', color2: '#ffffff', style: 'starfall' },
    { id: 'twin',      rar: 'epic',      color: '#ff7a3d', color2: '#ffe0a0', style: 'twin' },
    { id: 'lightning', rar: 'legendary', color: '#9be7ff', color2: '#ffffff', style: 'lightning' },
    { id: 'phoenix',   rar: 'legendary', color: '#ff6a2b', color2: '#ffe27a', style: 'phoenix' },
    { id: 'void',      rar: 'legendary', color: '#8f6bff', color2: '#140a2e', style: 'void' },
    { id: 'gold',      rar: 'legendary', color: '#ffcf4a', color2: '#fff6c8', style: 'gold' }
  );
  G.aegisSkins.concat(G.jetSkins).forEach(s => { const P = HR.GEAR_PRICE[s.rar]; if (!P || s.price === 0) return; s.price = P[0]; s.gems = P[1]; });

  // ---------- efeitos de fundo por galáxia ----------
  // sistema 1 e sistema do chefe usam o efeito da galáxia; os outros alternam o conjunto e somam um segundo efeito
  HR.REGION_FX = {
    berco:      ['aurora', 'meteor', 'fireflies', 'lines', 'bubbles', 'crystal'],
    mare:       ['water', 'bubbles', 'rain', 'jelly', 'mist'],
    jardim:     ['garden', 'leaves', 'fireflies', 'wind', 'sakura'],
    forja:      ['ember', 'firestorm', 'ash', 'sparks', 'dust'],
    nevoa:      ['mist', 'wind', 'snow', 'meteor', 'abyss'],
    cristal:    ['crystal', 'plasma', 'power', 'snow', 'fireflies'],
    tempestade: ['storm', 'lightning', 'rain', 'wind', 'sparks'],
    abismo:     ['abyss', 'toxic', 'jelly', 'circuit', 'meteor'],
    vortice:    ['vortex', 'plasma', 'power', 'lines', 'toxic'],
    horizonte:  ['horizon', 'lines', 'meteor', 'power', 'plasma']
  };
  // efeitos que ocupam a tela inteira não entram como segundo efeito
  const FULL = ['water', 'vortex', 'horizon', 'aurora', 'synth', 'cosmos', 'flare', 'storm'];
  HR.systemFx = function (ri, si) {
    const R = HR.REGIONS[ri], pool = HR.REGION_FX[R.id] || [R.fx || 'aurora'], n = pool.length;
    const fx = si === 0 || si === 9 ? (R.fx || pool[0]) : pool[si % n];
    let fx2 = null;
    for (let k = 1; k <= n; k++) { const c = pool[(si * 3 + k) % n]; if (c !== fx && !FULL.includes(c)) { fx2 = c; break; } }
    return { fx, fx2 };
  };
})();
