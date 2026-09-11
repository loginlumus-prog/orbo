/* =====================================================================
   ORBO — Configuração e balanceamento
   Tudo que é "número de jogo" mora aqui: dificuldade do infinito, economia,
   loja, anúncios, cosméticos, produtos. Fases: js/modes.js · Conquistas e
   missões: js/content.js · Habilidades e perks: js/perks.js
   ===================================================================== */
window.HR = window.HR || {};

HR.CONFIG = {
  VERSION: '2.0.0',
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
    stickDead: 0.12,  // zona morta do analógico
    stickCurve: 1.35, // curva de resposta (1 = linear)
    stickLead: 40     // folga do alvo à frente da bola ao soltar
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
    reviveMax: 2, reviveGems: [20, 50], reviveSeconds: 5,
    reviveInvuln: 2.2, shieldInvuln: 1.4,
    deathSlowmo: 0.25, deathTime: 0.85,
    loopFrom: 3,                 // após a última fase, volta para esta (índice)
    loopRadiusMul: 0.96, loopTbMul: 0.95,
    masteredCoinMul: 1.25,       // Singularidade dominada (chefe da região 10)
    passNeed: 0.60,              // Galáxia: fração dos arcos que precisa passar para vencer a fase
    shieldCap: 3
  },

  // Linguagem de cores: a cor do arco diz o que ele faz (ver docs/PLANO_V3.md v3.1)
  RING_TYPES: {
    plain:   { color: '#4cf0ff', icon: 'ring' },
    wave:    { color: '#7cff6b', icon: 'wave' },
    tilt:    { color: '#ffd93d', icon: 'bolt' },
    spin:    { color: '#ff5e7e', icon: 'refresh' },
    pulse:   { color: '#a29bfe', icon: 'target' },
    ghost:   { color: '#e8f0ff', icon: 'eye' },
    gold:    { color: '#ffcf4a', icon: 'coins' },
    anomaly: { color: '#ff3d2e', icon: 'orbit' }
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
  PICKUP: { chance: 0.16, minGap: 4, offset: [90, 230], r: 20, starDur: 6, magnetDur: 8, slowDur: 4, coins: 10, magnetRange: 170 },
  OBSTACLE: { fromPhase: 3, fromRegion: 1, keepAway: 70, r: [12, 20] },
  ANOMALY: { fromRing: 60, every: 75, jitter: 15, warn: 2.6, radiusMul: 1.25, bonusCoins: 25, bonusScore: 5 },
  ASCENSION: { fromRing: 100, chance: 0.35 },
  AUTOPERK: { afterOffers: 3 },
  COMBO_MILESTONES: [5, 10, 20, 35],

  // Fases do modo Singularidade (infinito): 10 arcos cada. Cada fase adiciona uma mecânica.
  // tiltVar: inclinação máxima (rad) | osc: amplitude vertical | rot: oscilação da inclinação
  // dir: de onde os arcos vêm (right | top | left | bottom | swap = troca a cada 5 arcos)
  PHASES: [
    { key: 'phase_1', dir: 'right',  accent: '#4cf0ff', radius: 1.00, tiltVar: 0.00, osc: 0,   oscF: 0,   rot: 0,    rotF: 0,   yDelta: 200, tbMul: 1.00, coin: 0.45, dbl: 0.00, mix: 0, obs: 0, pick: 0.16 },
    { key: 'phase_2', dir: 'right',  accent: '#7cff6b', radius: 0.96, tiltVar: 0.00, osc: 0,   oscF: 0,   rot: 0,    rotF: 0,   yDelta: 290, tbMul: 0.96, coin: 0.45, dbl: 0.00, mix: 0.35, obs: 0, pick: 0.16 },
    { key: 'phase_3', dir: 'right',  accent: '#ffd93d', radius: 0.93, tiltVar: 0.00, osc: 70,  oscF: 1.3, rot: 0,    rotF: 0,   yDelta: 290, tbMul: 0.95, coin: 0.45, dbl: 0.00, mix: 0.5, obs: 0.18, pick: 0.16 },
    { key: 'phase_4', dir: 'top',    accent: '#ff7ad9', radius: 0.91, tiltVar: 0.48, osc: 0,   oscF: 0,   rot: 0,    rotF: 0,   yDelta: 310, tbMul: 0.94, coin: 0.45, dbl: 0.00, mix: 0.55, obs: 0.24, pick: 0.16 },
    { key: 'phase_5', dir: 'top',    accent: '#ff9f43', radius: 0.89, tiltVar: 0.52, osc: 80,  oscF: 1.6, rot: 0,    rotF: 0,   yDelta: 330, tbMul: 0.93, coin: 0.45, dbl: 0.00, mix: 0.6, obs: 0.3, pick: 0.16 },
    { key: 'phase_6', dir: 'bottom', accent: '#a29bfe', radius: 0.87, tiltVar: 0.30, osc: 0,   oscF: 0,   rot: 0.60, rotF: 1.3, yDelta: 340, tbMul: 0.92, coin: 0.45, dbl: 0.15, mix: 0.65, obs: 0.34, pick: 0.16 },
    { key: 'phase_7', dir: 'right',  accent: '#ff5e7e', radius: 0.74, tiltVar: 0.36, osc: 45,  oscF: 1.4, rot: 0,    rotF: 0,   yDelta: 340, tbMul: 0.92, coin: 0.50, dbl: 0.20, mix: 0.7, obs: 0.38, pick: 0.16 },
    { key: 'phase_8', dir: 'left',   accent: '#00e5a8', radius: 0.80, tiltVar: 0.62, osc: 90,  oscF: 1.9, rot: 0.50, rotF: 1.6, yDelta: 380, tbMul: 0.90, coin: 0.50, dbl: 0.30, mix: 0.75, obs: 0.42, pick: 0.16 },
    { key: 'phase_9', dir: 'swap',   accent: '#ffffff', radius: 0.78, tiltVar: 0.65, osc: 100, oscF: 2.1, rot: 0.65, rotF: 1.9, yDelta: 420, tbMul: 0.88, coin: 0.55, dbl: 0.40, mix: 0.85, obs: 0.5, pick: 0.16 }
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

  LEVEL_TITLES: [[1, 'title_1'], [3, 'title_3'], [5, 'title_5'], [8, 'title_8'], [12, 'title_12'], [16, 'title_16'], [20, 'title_20'], [30, 'title_30'], [40, 'title_40']],

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
    { id: 'plasma',  price: 0,    cur: 'pack',  lvl: 1,  base: '#ff9df5', dark: '#5a13c9', glow: '#ff5ecf', pattern: 'plasma' }
  ],

  TRAILS: [
    { id: 'none',    price: 0,   cur: 'coins', lvl: 1 },
    { id: 'dots',    price: 200, cur: 'coins', lvl: 1 },
    { id: 'stars',   price: 450, cur: 'coins', lvl: 3 },
    { id: 'fire',    price: 700, cur: 'coins', lvl: 5 },
    { id: 'bubbles', price: 40,  cur: 'gems',  lvl: 4 },
    { id: 'rainbow', price: 80,  cur: 'gems',  lvl: 7 }
  ],

  THEMES: [
    { id: 'aurora', price: 0,    cur: 'coins', lvl: 1, colors: ['#1b2450', '#0f1733', '#070b1a'], shapes: 'orbs',   stars: true },
    { id: 'sunset', price: 500,  cur: 'coins', lvl: 2, colors: ['#5a1f5c', '#2a1440', '#0d0a1e'], shapes: 'waves',  stars: true },
    { id: 'ocean',  price: 750,  cur: 'coins', lvl: 3, colors: ['#0b3c5d', '#07253d', '#03111f'], shapes: 'bubbles', stars: false },
    { id: 'cyber',  price: 50,   cur: 'gems',  lvl: 5, colors: ['#1a0b3d', '#0c0620', '#040210'], shapes: 'grid',   stars: false },
    { id: 'space',  price: 1100, cur: 'coins', lvl: 8, colors: ['#0a0f2a', '#05081a', '#000000'], shapes: 'nebula', stars: true },
    { id: 'candy',  price: 60,   cur: 'gems',  lvl: 6, colors: ['#5b1e63', '#3c1650', '#1a0b2a'], shapes: 'orbs',   stars: true }
  ],

  // ----- Compras (IAP). Preços de exibição; a loja real envia o preço localizado -----
  PRODUCTS: [
    { id: 'starter_pack', type: 'pack', gems: 300, noAds: true, skin: 'plasma', price: { pt: 'R$ 19,90', en: '$4.99', es: '$4.99' }, tag: 'popular' },
    { id: 'no_ads',       type: 'noads', price: { pt: 'R$ 12,90', en: '$2.99', es: '$2.99' } },
    { id: 'vip',          type: 'sub', gemsDaily: 15, coinsDaily: 150, price: { pt: 'R$ 14,90/mês', en: '$3.99/mo', es: '$3.99/mes' } },
    { id: 'gems_100',     type: 'gems', gems: 100,  price: { pt: 'R$ 4,90',  en: '$0.99',  es: '$0.99' } },
    { id: 'gems_550',     type: 'gems', gems: 550,  price: { pt: 'R$ 19,90', en: '$4.99',  es: '$4.99' }, tag: 'best' },
    { id: 'gems_1200',    type: 'gems', gems: 1200, price: { pt: 'R$ 39,90', en: '$9.99',  es: '$9.99' } },
    { id: 'gems_2600',    type: 'gems', gems: 2600, price: { pt: 'R$ 79,90', en: '$19.99', es: '$19.99' } },
    { id: 'gems_7000',    type: 'gems', gems: 7000, price: { pt: 'R$ 189,90', en: '$49.99', es: '$49.99' } }
  ],

  // missões: 3 diárias + 3 semanais (modelos em js/content.js)
  MISSIONS_DAILY: 3, MISSIONS_WEEKLY: 3, MISSION_REROLLS: 2, WEEKLY_TARGET_MUL: 3, WEEKLY_REWARD_MUL: 4,

  DAILY: [{ coins: 50 }, { coins: 80 }, { coins: 120 }, { gems: 8 }, { coins: 180 }, { coins: 250 }, { coins: 300, gems: 25 }],

  BOT_NAMES: ['Luna', 'Kai', 'Nova', 'Zed', 'Mika', 'Aria', 'Theo', 'Sora', 'Rin', 'Leo', 'Yuki', 'Max', 'Ivy', 'Noah', 'Zara', 'Bruno', 'Ana', 'Enzo', 'Lia', 'Davi', 'Bia', 'Rafa', 'Nina', 'Gael', 'Sofi', 'Tomi', 'Alê', 'Kaya', 'Ravi', 'Isa'],
  BOT_FLAGS: ['BR', 'US', 'MX', 'PT', 'AR', 'JP', 'DE', 'FR', 'IN', 'KR', 'GB', 'ES', 'IT', 'CA', 'CO']
};
