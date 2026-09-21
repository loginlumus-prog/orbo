/* =====================================================================
   ORBO — Configuração e balanceamento
   Tudo que é "número de jogo" mora aqui: dificuldade do infinito, economia,
   loja, anúncios, cosméticos, produtos. Fases: js/modes.js · Conquistas e
   missões: js/content.js · Habilidades e perks: js/perks.js
   ===================================================================== */
window.HR = window.HR || {};

HR.CONFIG = {
  VERSION: '7.2.2',
  NAME: 'ORBO',
  TAGLINE: { pt: 'Atravesse a galáxia.', en: 'Cross the galaxy.', es: 'Cruza la galaxia.' },
  SAVE_KEY: 'orbo.save.v3',
  LEGACY_SAVE_KEY: 'halorush.save.v1',
  SHARE_URL: 'https://playorbo.app',      // troque pelo link da loja / site
  WORLD_H: 800,                            // altura lógica do mundo (px)
  MAX_ASPECT: 0.85,                        // largura/altura máxima (desktop vira "celular")

  BALL: {
    r: 22,
    xFrac: 0.30,      // posição inicial no eixo de viagem (fração do comprimento)
    xMax: 260,        // limite absoluto da posição inicial
    uMin: 0.10,       // faixa em que a bola pode recuar/avançar (fração do comprimento de viagem)
    uMax: 0.62,
    spring: 110,      // rigidez da mola que puxa a bola para o alvo do dedo
    damping: 15,      // amortecimento (abaixo do crítico → leve balanço, sensação solta)
    maxVy: 2600,      // velocidade máxima (px/s)
    keySpeed: 1000,   // velocidade com teclado (px/s)
    stickSpeed: 1150, // analógico no máximo (px/s)
    stickDead: 0.07,  // zona morta do analógico
    stickCurve: 1.12, // curva de resposta (1 = linear)
    stickLead: 40,    // (v5.1) folga do alvo; o analógico direto da v5.3 não usa
    stickResponse: 32 // analógico direto: quão rápido a bola chega à velocidade pedida (1/s; 32 ≈ 90% em 70 ms)
  },

  RUN: {
    baseSpeed: 265, speedPerRing: 6.5, maxSpeed: 880,   // velocidade dos arcos (px/s)
    tbStart: 1.40, tbEnd: 0.70, tbPerRing: 0.0070,      // segundos entre arcos (mais denso: errar não mata)
    ringR: 98, ringMinR: 56, ringRx: 0.26,              // raio base, mínimo, "espessura" da elipse
    marginY: 60,
    perfectZone: 0.30,   // fração do raio que conta como PERFEITO
    coinZone: 0.72,      // fração do raio para pegar a moeda
    forgiveness: 0.55,   // fração do raio da bola que "perdoa" na borda
    nearZone: 0.78,      // acima desta fração do limite conta como "raspou a borda"
    ringsPerPhase: 10,
    reviveMax: 2, reviveGems: [20, 50], reviveCoins: [600, 1500], reviveSeconds: 5,   // v5: continuar só com moedas ou anúncio
    reviveInvuln: 2.2, shieldInvuln: 1.4,
    deathSlowmo: 0.25, deathTime: 0.85,
    loopFrom: 3,                 // após a última fase, volta para esta (índice)
    loopRadiusMul: 0.96, loopTbMul: 0.95,
    masteredCoinMul: 1.25,       // Singularidade dominada (chefe da região 10)
    passNeed: 0.60,              // Galáxia: fração dos arcos que precisa passar para vencer a fase
    shieldCap: 3,
    flowSpeedMul: 0.08           // velocidade extra dos arcos no fluxo máximo (v4)
  },

  // Fluxo (ritmo): sobe a cada arco, zera ao errar/levar dano; move o fundo (parallax) e a música
  FLOW: { perPass: 0.045, perPerfect: 0.07, rise: 1.6, fall: 5.0, bgMul: 2.6, bgBase: 0.6 },

  // Linguagem de cores: a cor do arco diz o que ele faz (ver docs/PLANO_V3.md v3.1)
  RING_TYPES: {
    plain:   { color: '#4cf0ff', icon: 'ring' },
    wave:    { color: '#7cff6b', icon: 'wave' },
    tilt:    { color: '#ffd93d', icon: 'bolt' },
    spin:    { color: '#ff5e7e', icon: 'refresh' },
    pulse:   { color: '#a29bfe', icon: 'target' },
    ghost:   { color: '#e8f0ff', icon: 'eye' },
    gold:    { color: '#ffcf4a', icon: 'coins' },
    anomaly: { color: '#ff3d2e', icon: 'orbit' },
    guardian: { color: '#c3b8ff', icon: 'crown' }
  },

  // Itens que aparecem fora da linha dos arcos (o jogador sai da linha para pegar)
  PICKUPS: [
    { id: 'coins',  w: 30, color: '#ffcf4a', icon: 'coins' },
    { id: 'shield', w: 22, color: '#4cf0ff', icon: 'shield' },
    { id: 'magnet', w: 12, color: '#ffd93d', icon: 'magnet' },
    { id: 'slow',   w: 10, color: '#9be7ff', icon: 'hourglass' },
    { id: 'star',   w: 15, color: '#fff3a0', icon: 'star' },
    { id: 'life',   w: 8,  color: '#ff5e7e', icon: 'heart' },
    { id: 'gem',    w: 3,  color: '#c39bff', icon: 'gem' }
  ],
  PICKUP: { chance: 0.20, centerChance: 0.4, minGap: 4, offset: [90, 230], r: 20, starDur: 6, magnetDur: 8, slowDur: 4, coins: 10, magnetRange: 170 },
  OBSTACLE: { fromPhase: 3, fromRegion: 1, keepAway: 70, r: [12, 20], rock: [11, 24] },
  ANOMALY: { fromRing: 60, every: 75, jitter: 15, warn: 2.6, radiusMul: 1.25, bonusCoins: 25, bonusScore: 5 },
  ASCENSION: { fromRing: 100, chance: 0.35 },
  // Progressão longa (v4): cada região tem um Portal com 5 portas — ver docs/PLANO_V4.md §4
  // v5: Galáxia → 10 sistemas → 10 fases. Índice 10 = Singularidade (as 11 camadas). Ver docs/PLANO_V5.md §2
  PROGRESSION: {
    regionRank:  [1, 27, 35, 41, 45, 49, 52, 55, 58, 61, 63],                 // patente para entrar na galáxia
    regionStars: [0, 170, 180, 190, 200, 210, 215, 220, 225, 230, 240],        // estrelas na galáxia anterior (de 300)
    regionCore:  [0, 3, 6, 9, 12, 15, 18, 21, 24, 27, 30],                    // nível do Núcleo
    systemStars: [14, 15, 16, 17, 18, 19, 20, 21, 22, 23],                    // estrelas no sistema anterior (de 30), por galáxia
    contractsNeed: 5,                                                         // contratos da galáxia anterior (de 8)
    xpRunCap: 900,                                                            // XP máximo por partida
    dailyBonusRuns: 10, dailyBonusMul: 2                                      // as primeiras partidas do dia dão XP em dobro
  },
  // v5: velocidade sentida (Galáxia). g = progresso global 0..1 nas 1.000 fases
  SPEED: { base: 245, span: 575, pow: 1.15, rampBase: 0.06, rampSpan: 0.22, flowBase: 0.05, flowSpan: 0.15, bossMul: 1.03, galaxyBossMul: 1.06, tbStart: 1.40, tbSpan: 0.62, tbMin: 0.72, endlessFlowBase: 0.05, endlessFlowSpan: 0.15 },
  // Núcleo da bola: 30 níveis comprados com moedas; bônus por nível e marcos
  CORE: { maxLevel: 30, cost(n) { return 120 + 16 * n * n + 50 * n; }, coinMul: 0.02, forgive: 0.008, perfect: 0.005, xp: 0.01, shieldAt: [5, 15, 25], startShieldAt: 10, lifeAt: 20, pickupAt: 30 },
  AUTOPERK: { afterOffers: 0 },
  // câmera lenta de adaptação (v5.1): escala mínima do tempo e duração (s) da volta à velocidade normal
  ADAPT: { powerEnd: { min: 0.5, dur: 1.1 }, aegis: { min: 0.3, dur: 1.2 }, hit: { min: 0.42, dur: 1.0 }, miss: { min: 0.5, dur: 0.9 }, streak: { min: 0.58, dur: 0.8 }, perk: { min: 0.35, dur: 1.3 }, autoperk: { min: 0.62, dur: 0.7 }, turn: { min: 0.35, dur: 1.4 } },
  // Eventos (v4): mudam a dinâmica no meio da partida — ver docs/PLANO_V4.md §5
  EVENTS: {
    asteroids: { dur: 9,  color: '#ff9f43', icon: 'skull', coins: 15, score: 3, every: 0.2 },
    warp:      { dur: 8,  color: '#4cf0ff', icon: 'zap',   speed: 1.65, radius: 1.35 },
    sentinel:  { dur: 14, color: '#ff5e7e', icon: 'eye',   coins: 20, score: 5, fire: 1.6, shot: 270 },
    bonanza:   { dur: 7,  color: '#ffcf4a', icon: 'coins', every: 0.13, val: 3 },
    guardian:  { dur: 0,  color: '#c3b8ff', icon: 'crown', coins: 30, score: 10, sizes: [2.0, 1.6, 1.25] }
  },
  EVENT: { endlessFrom: 18, every: [22, 30], warnMin: 1.2 },
  COMBO_MILESTONES: [5, 10, 20, 35],
  // Temporadas (mês-dia, inclusive). HR.SEASON_FORCE = 'natal' força uma para teste.
  SEASONS: [
    { id: 'verao',     from: '01-02', to: '01-31', accent: '#4cf0ff', sprinkle: 'bubbles' },
    { id: 'carnaval',  from: '02-08', to: '02-26', accent: '#ff5ecf', sprinkle: 'confetti' },
    { id: 'junina',    from: '06-08', to: '06-30', accent: '#ffcf4a', sprinkle: 'balloons' },
    { id: 'halloween', from: '10-15', to: '11-02', accent: '#ff8a3d', sprinkle: 'bats' },
    { id: 'natal',     from: '12-06', to: '01-01', accent: '#ff5e7e', sprinkle: 'snow' }
  ],

  // Fases do modo Singularidade (infinito): 10 arcos cada. Cada fase adiciona uma mecânica.
  // tiltVar: inclinação máxima (rad) | osc: amplitude vertical | rot: oscilação da inclinação
  // dir: de onde os arcos vêm (right | top | left | bottom | swap = troca a cada 5 arcos)
  PHASES: [
    { key: 'phase_1', dir: 'right',  fx: 'aurora',  accent: '#4cf0ff', radius: 1.00, tiltVar: 0.00, osc: 0,   oscF: 0,   rot: 0,    rotF: 0,   yDelta: 200, tbMul: 1.00, coin: 0.45, dbl: 0.00, mix: 0, obs: 0, pick: 0.16 },
    { key: 'phase_2', dir: 'right',  fx: 'garden',  accent: '#7cff6b', radius: 0.96, tiltVar: 0.00, osc: 0,   oscF: 0,   rot: 0,    rotF: 0,   yDelta: 290, tbMul: 0.96, coin: 0.45, dbl: 0.00, mix: 0.35, obs: 0, pick: 0.16 },
    { key: 'phase_3', dir: 'right',  fx: 'water',   accent: '#ffd93d', radius: 0.93, tiltVar: 0.00, osc: 70,  oscF: 1.3, rot: 0,    rotF: 0,   yDelta: 290, tbMul: 0.95, coin: 0.45, dbl: 0.00, mix: 0.5, obs: 0.18, pick: 0.16 },
    { key: 'phase_4', dir: 'top',    fx: 'crystal', accent: '#ff7ad9', radius: 0.91, tiltVar: 0.48, osc: 0,   oscF: 0,   rot: 0,    rotF: 0,   yDelta: 310, tbMul: 0.94, coin: 0.45, dbl: 0.00, mix: 0.55, obs: 0.24, pick: 0.16 },
    { key: 'phase_5', dir: 'top',    fx: 'ember',   accent: '#ff9f43', radius: 0.89, tiltVar: 0.52, osc: 80,  oscF: 1.6, rot: 0,    rotF: 0,   yDelta: 330, tbMul: 0.93, coin: 0.45, dbl: 0.00, mix: 0.6, obs: 0.3, pick: 0.16 },
    { key: 'phase_6', dir: 'bottom', fx: 'mist',    accent: '#a29bfe', radius: 0.87, tiltVar: 0.30, osc: 0,   oscF: 0,   rot: 0.60, rotF: 1.3, yDelta: 340, tbMul: 0.92, coin: 0.45, dbl: 0.15, mix: 0.65, obs: 0.34, pick: 0.16 },
    { key: 'phase_7', dir: 'right',  fx: 'storm',   accent: '#ff5e7e', radius: 0.74, tiltVar: 0.36, osc: 45,  oscF: 1.4, rot: 0,    rotF: 0,   yDelta: 340, tbMul: 0.92, coin: 0.50, dbl: 0.20, mix: 0.7, obs: 0.38, pick: 0.16 },
    { key: 'phase_8', dir: 'left',   fx: 'abyss',   accent: '#00e5a8', radius: 0.80, tiltVar: 0.62, osc: 90,  oscF: 1.9, rot: 0.50, rotF: 1.6, yDelta: 380, tbMul: 0.90, coin: 0.50, dbl: 0.30, mix: 0.75, obs: 0.42, pick: 0.16 },
    { key: 'phase_9', dir: 'swap',   fx: 'vortex',  accent: '#ffffff', radius: 0.78, tiltVar: 0.65, osc: 100, oscF: 2.1, rot: 0.65, rotF: 1.9, yDelta: 420, tbMul: 0.88, coin: 0.55, dbl: 0.40, mix: 0.85, obs: 0.5, pick: 0.16 }
  ],

  ECONOMY: {
    coinPickup: 1,
    endBonusDiv: 4,            // bônus de moedas no fim = pontos / 4
    comboEvery: 5,             // a cada N perfeitos seguidos...
    comboCoins: 5,             // ...ganha N moedas
    exchangeGems: 10, exchangeCoins: 600,
    xp: { perRing: 3, perPerfect: 2, perPhase: 6, perLevel: 40, perStar: 15 }
  },

  ADS: {
    interstitialEvery: 3,      // a cada N partidas
    interstitialMinGap: 90,    // segundos entre intersticiais
    skipFirstRuns: 3,          // primeiras partidas sem intersticial
    freeGems: 10, freeGemsPerDay: 3,
    doubleCoinsMin: 4,         // só oferece "dobrar" se ganhou pelo menos N moedas
    bannerInMenu: true,
    mockDuration: 5
  },

  LEVEL_TITLES: [[1, 'title_1'], [3, 'title_3'], [5, 'title_5'], [8, 'title_8'], [12, 'title_12'], [16, 'title_16'], [20, 'title_20'], [30, 'title_30'], [40, 'title_40'], [50, 'title_50'], [60, 'title_60'], [70, 'title_70']],

  xpToNext(level) { return Math.round(100 + (level - 1) * (level - 1) * 18 + (level - 1) * 40); },
  levelRewards(level) {
    const r = { coins: 60 + level * 25 };
    if (level % 2 === 0) r.gems = 5 + Math.floor(level / 4) * 2;
    return r;
  },

  // ----- Bolas (skins). pattern é interpretado em render.js -----
  SKINS: [
    { id: 'classic', price: 0,    cur: 'coins', lvl: 1,  base: '#ffffff', dark: '#8fd8ff', glow: '#4cf0ff', pattern: 'none' },
    { id: 'neon',    price: 300,  cur: 'coins', lvl: 1,  base: '#5ff5ff', dark: '#0b4fd6', glow: '#4cf0ff', pattern: 'ring' },
    { id: 'lava',    price: 500,  cur: 'coins', lvl: 2,  base: '#ffb347', dark: '#b3140f', glow: '#ff6a2b', pattern: 'cracks' },
    { id: 'ice',     price: 650,  cur: 'coins', lvl: 3,  base: '#f2fdff', dark: '#6cc0ff', glow: '#a6f0ff', pattern: 'glass' },
    { id: 'soccer',  price: 800,  cur: 'coins', lvl: 4,  base: '#ffffff', dark: '#cfd6e6', glow: '#ffffff', pattern: 'soccer' },
    { id: 'gold',    price: 60,   cur: 'gems',  lvl: 5,  base: '#fff3bf', dark: '#c27a00', glow: '#ffcf4a', pattern: 'shine' },
    { id: 'galaxy',  price: 1200, cur: 'coins', lvl: 6,  base: '#7b5cff', dark: '#12083d', glow: '#b48cff', pattern: 'galaxy' },
    { id: 'ghost',   price: 90,   cur: 'gems',  lvl: 8,  base: '#e8f4ff', dark: '#6f8dc9', glow: '#cfe9ff', pattern: 'ghost' },
    { id: 'eye',     price: 1600, cur: 'coins', lvl: 10, base: '#ffffff', dark: '#1b1b1b', glow: '#ff5e7e', pattern: 'eye' },
    { id: 'rainbow', price: 150,  cur: 'gems',  lvl: 12, base: '#ffffff', dark: '#ff5ecf', glow: '#ffffff', pattern: 'rainbow' },
    { id: 'plasma',  price: 0,    cur: 'pack',  lvl: 1,  base: '#ff9df5', dark: '#5a13c9', glow: '#ff5ecf', pattern: 'plasma' },
    // v4
    { id: 'eight',   price: 550,  cur: 'coins', lvl: 2,  base: '#f4f4f4', dark: '#141418', glow: '#ffffff', pattern: 'eight' },
    { id: 'moon',    price: 450,  cur: 'coins', lvl: 2,  base: '#e6e9f2', dark: '#7f889e', glow: '#cfd8ff', pattern: 'craters' },
    { id: 'bee',     price: 700,  cur: 'coins', lvl: 3,  base: '#ffd93d', dark: '#2b2410', glow: '#ffe27a', pattern: 'stripes', stripe: '#1b1a12' },
    { id: 'sun',     price: 900,  cur: 'coins', lvl: 4,  base: '#fff0a0', dark: '#ff7a1a', glow: '#ffb347', pattern: 'corona' },
    { id: 'toxic',   price: 1000, cur: 'coins', lvl: 5,  base: '#7cff6b', dark: '#0e4a1c', glow: '#35e29a', pattern: 'toxic' },
    { id: 'saturn',  price: 70,   cur: 'gems',  lvl: 6,  base: '#ffe1a8', dark: '#a0612c', glow: '#ffcf4a', pattern: 'saturn', decor: 'planetRing', ringR: 1.5, ringW: 0.17 },
    { id: 'pearl',   price: 80,   cur: 'gems',  lvl: 7,  base: '#fff5fb', dark: '#b7a7d6', glow: '#ffd6f2', pattern: 'pearl' },
    { id: 'void',    price: 110,  cur: 'gems',  lvl: 9,  base: '#2a1b4a', dark: '#05030d', glow: '#8f6bff', pattern: 'void' },
    { id: 'comet',   price: 0,    cur: 'iap',   lvl: 1,  base: '#e9fbff', dark: '#3b8cff', glow: '#9be7ff', pattern: 'comet', product: 'skin_comet' },
    { id: 'dragon',  price: 0,    cur: 'iap',   lvl: 1,  base: '#ff9d3d', dark: '#7a1216', glow: '#ff5e3d', pattern: 'scales', product: 'skin_dragon' },
    // sazonais (só na janela da temporada; o que foi comprado fica)
    { id: 'pumpkin',   price: 900,  cur: 'coins', lvl: 1, base: '#ff9d3d', dark: '#8a3a08', glow: '#ff8a3d', pattern: 'pumpkin', season: 'halloween' },
    { id: 'candycane', price: 900,  cur: 'coins', lvl: 1, base: '#ffffff', dark: '#c9102f', glow: '#ff5e7e', pattern: 'stripes', stripe: '#e0173a', season: 'natal' },
    { id: 'balloon',   price: 900,  cur: 'coins', lvl: 1, base: '#ffcf4a', dark: '#c0392b', glow: '#ffcf4a', pattern: 'stripes', stripe: '#2e86de', season: 'junina' },
    { id: 'confetti',  price: 900,  cur: 'coins', lvl: 1, base: '#ffffff', dark: '#8f6bff', glow: '#ff5ecf', pattern: 'confetti', season: 'carnaval' },
    { id: 'beach',     price: 900,  cur: 'coins', lvl: 1, base: '#fff3a0', dark: '#0b7fb0', glow: '#4cf0ff', pattern: 'stripes', stripe: '#4cf0ff', season: 'verao' }
  ],

  TRAILS: [
    { id: 'none',    price: 0,   cur: 'coins', lvl: 1 },
    { id: 'dots',    price: 200, cur: 'coins', lvl: 1 },
    { id: 'stars',   price: 450, cur: 'coins', lvl: 3 },
    { id: 'fire',    price: 700, cur: 'coins', lvl: 5 },
    { id: 'bubbles', price: 40,  cur: 'gems',  lvl: 4 },
    { id: 'rainbow', price: 80,  cur: 'gems',  lvl: 7 },
    { id: 'comet',     price: 900, cur: 'coins', lvl: 6 },
    { id: 'petals',    price: 60,  cur: 'gems',  lvl: 8 },
    { id: 'lightning', price: 90,  cur: 'gems',  lvl: 10 },
    { id: 'snow',      price: 600, cur: 'coins', lvl: 1, season: 'natal' },
    { id: 'bats',      price: 600, cur: 'coins', lvl: 1, season: 'halloween' }
  ],

  THEMES: [
    { id: 'aurora', price: 0,    cur: 'coins', lvl: 1, colors: ['#1b2450', '#0f1733', '#070b1a'], shapes: 'orbs',   stars: true },
    { id: 'sunset', price: 500,  cur: 'coins', lvl: 2, colors: ['#5a1f5c', '#2a1440', '#0d0a1e'], shapes: 'waves',  stars: true },
    { id: 'ocean',  price: 750,  cur: 'coins', lvl: 3, colors: ['#0b3c5d', '#07253d', '#03111f'], shapes: 'bubbles', stars: false },
    { id: 'cyber',  price: 50,   cur: 'gems',  lvl: 5, colors: ['#1a0b3d', '#0c0620', '#040210'], shapes: 'grid',   stars: false },
    { id: 'space',  price: 1100, cur: 'coins', lvl: 8, colors: ['#0a0f2a', '#05081a', '#000000'], shapes: 'nebula', stars: true },
    { id: 'candy',  price: 60,   cur: 'gems',  lvl: 6, colors: ['#5b1e63', '#3c1650', '#1a0b2a'], shapes: 'orbs',   stars: true },
    { id: 'forest',    price: 900,  cur: 'coins', lvl: 4,  colors: ['#0f3d2e', '#0a2620', '#04120e'], shapes: 'bubbles', stars: false, fx: 'garden' },
    { id: 'inferno',   price: 1300, cur: 'coins', lvl: 9,  colors: ['#4a1d0c', '#2b1008', '#120604'], shapes: 'orbs',    stars: true,  fx: 'ember' },
    { id: 'prism',     price: 90,   cur: 'gems',  lvl: 11, colors: ['#4a1a48', '#2c1030', '#140818'], shapes: 'orbs',    stars: true,  fx: 'crystal' },
    { id: 'halloween', price: 700,  cur: 'coins', lvl: 1,  colors: ['#3a1a4a', '#1f0d2a', '#0a0510'], shapes: 'nebula',  stars: true,  fx: 'mist', season: 'halloween' },
    { id: 'natal',     price: 700,  cur: 'coins', lvl: 1,  colors: ['#0d3b2e', '#08261f', '#04120e'], shapes: 'orbs',    stars: true,  season: 'natal' },
    // v5: temas que mudam o fundo e o estilo do arco no Infinito
    { id: 'twilight',    price: 800,   cur: 'coins', lvl: 2,  rar: 'common',    colors: ['#4a2a5a', '#2a1838', '#0e0814'], shapes: 'waves',   stars: true,  fx: 'mist' },
    { id: 'borealis',    price: 3000,  cur: 'coins', lvl: 4,  rar: 'rare',      colors: ['#0a2a3a', '#061822', '#02090e'], shapes: 'orbs',    stars: true,  fx: 'aurora' },
    { id: 'mars',        price: 3000,  cur: 'coins', lvl: 5,  rar: 'rare',      colors: ['#5a1e0e', '#2e0f08', '#110503'], shapes: 'orbs',    stars: false, fx: 'dust' },
    { id: 'blizzard',    price: 3000,  cur: 'coins', lvl: 6,  rar: 'rare',      colors: ['#1a3350', '#0e1f33', '#050b14'], shapes: 'nebula',  stars: false, fx: 'snow' },
    { id: 'deepsea',     price: 3000,  cur: 'coins', lvl: 7,  rar: 'rare',      colors: ['#06304a', '#031a2c', '#010a12'], shapes: 'bubbles', stars: false, fx: 'water' },
    { id: 'synthwave',   price: 15000, cur: 'coins', lvl: 8,  rar: 'epic',      colors: ['#2a0a4a', '#140628', '#05020e'], shapes: 'grid',    stars: true,  fx: 'synth' },
    { id: 'sakura',      price: 15000, cur: 'coins', lvl: 10, rar: 'epic',      colors: ['#4a1a3a', '#2a0f24', '#10060e'], shapes: 'orbs',    stars: true,  fx: 'sakura' },
    { id: 'matrix',      price: 15000, cur: 'coins', lvl: 12, rar: 'epic',      colors: ['#021a0c', '#010f07', '#000502'], shapes: 'grid',    stars: false, fx: 'matrix' },
    { id: 'crystalcave', price: 15000, cur: 'coins', lvl: 14, rar: 'epic',      colors: ['#1a1a48', '#0e0e2c', '#050514'], shapes: 'orbs',    stars: false, fx: 'crystal' },
    { id: 'voidtheme',   price: 15000, cur: 'coins', lvl: 16, rar: 'epic',      colors: ['#08061a', '#04030e', '#000000'], shapes: 'nebula',  stars: true,  fx: 'abyss' },
    { id: 'cosmos',      price: 80000, cur: 'coins', lvl: 20, rar: 'legendary', colors: ['#0c0a2a', '#060418', '#010008'], shapes: 'nebula',  stars: true,  fx: 'cosmos' },
    { id: 'solarstorm',  price: 80000, cur: 'coins', lvl: 24, rar: 'legendary', colors: ['#4a1a08', '#2a0c04', '#0e0402'], shapes: 'orbs',    stars: false, fx: 'flare' }
  ],

  // ----- Compras (IAP). Preços de exibição; a loja real envia o preço localizado -----
  PRODUCTS: [
    { id: 'starter_pack', type: 'pack', gems: 300, noAds: true, skin: 'plasma', price: { pt: 'R$ 19,90', en: '$4.99', es: '$4.99' }, tag: 'popular' },
    { id: 'no_ads',       type: 'noads', price: { pt: 'R$ 12,90', en: '$2.99', es: '$2.99' } },
    { id: 'vip',          type: 'sub', gemsDaily: 20, coinsDaily: 0, price: { pt: 'R$ 14,90/mês', en: '$3.99/mo', es: '$3.99/mes' } },
    { id: 'gems_100',     type: 'gems', gems: 100,  price: { pt: 'R$ 4,90',  en: '$0.99',  es: '$0.99' } },
    { id: 'gems_550',     type: 'gems', gems: 550,  price: { pt: 'R$ 19,90', en: '$4.99',  es: '$4.99' }, tag: 'best' },
    { id: 'gems_1200',    type: 'gems', gems: 1200, price: { pt: 'R$ 39,90', en: '$9.99',  es: '$9.99' } },
    { id: 'gems_2600',    type: 'gems', gems: 2600, price: { pt: 'R$ 79,90', en: '$19.99', es: '$19.99' } },
    { id: 'gems_7000',    type: 'gems', gems: 7000, price: { pt: 'R$ 189,90', en: '$49.99', es: '$49.99' } },
    // bolas pagas (menor preço que existe nas duas lojas: tier 1 da App Store)
    { id: 'skin_comet',   type: 'skin', skins: ['comet'],  price: { pt: 'R$ 4,90', en: '$0.99', es: '$0.99' } },
    { id: 'skin_dragon',  type: 'skin', skins: ['dragon'], price: { pt: 'R$ 4,90', en: '$0.99', es: '$0.99' } },
    { id: 'legends_pack', type: 'pack', skins: ['comet', 'dragon'], gems: 200, price: { pt: 'R$ 9,90', en: '$1.99', es: '$1.99' }, tag: 'best' }
  ],

  // missões: 3 diárias + 3 semanais (modelos em js/content.js)
  MISSIONS_DAILY: 3, MISSIONS_WEEKLY: 3, MISSION_REROLLS: 2, WEEKLY_TARGET_MUL: 3, WEEKLY_REWARD_MUL: 4,

  DAILY: [{ coins: 50 }, { coins: 80 }, { coins: 120 }, { gems: 8 }, { coins: 180 }, { coins: 250 }, { coins: 300, gems: 25 }],

  BOT_NAMES: ['Luna', 'Kai', 'Nova', 'Zed', 'Mika', 'Aria', 'Theo', 'Sora', 'Rin', 'Leo', 'Yuki', 'Max', 'Ivy', 'Noah', 'Zara', 'Bruno', 'Ana', 'Enzo', 'Lia', 'Davi', 'Bia', 'Rafa', 'Nina', 'Gael', 'Sofi', 'Tomi', 'Alê', 'Kaya', 'Ravi', 'Isa'],
  BOT_FLAGS: ['BR', 'US', 'MX', 'PT', 'AR', 'JP', 'DE', 'FR', 'IN', 'KR', 'GB', 'ES', 'IT', 'CA', 'CO']
};
