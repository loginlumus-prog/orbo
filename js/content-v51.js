/* =====================================================================
   ORBO v5.1: troféus novos (compras, chefes, feitos especiais), estatísticas que
   alimentam esses troféus e os textos de tudo que entrou na v5.1.
   Carregado depois de content-v5.js (e de cosmetics-v51.js).
   ===================================================================== */
window.HR = window.HR || {};

(function () {
  const C = HR.CONFIG;
  const A = (id, cat, stat, target, gems, icon, extra) => HR.ACHIEVEMENTS.push(Object.assign({ id, cat, stat, target, gems, icon }, extra || {}));

  // ---------- Compras ----------
  A('buy_first', 'shopping', 'itemsBought', 1, 10, 'bag');
  A('buy_10', 'shopping', 'itemsBought', 10, 40, 'bag');
  A('buy_50', 'shopping', 'itemsBought', 50, 150, 'shop');
  A('buy_150', 'shopping', 'itemsBought', 150, 500, 'shop', { title: 't_patron' });
  A('skin_buy_1', 'shopping', 'skinsBought', 1, 15, 'ball');
  A('skin_buy_10', 'shopping', 'skinsBought', 10, 80, 'ball');
  A('skin_buy_30', 'shopping', 'skinsBought', 30, 300, 'ball');
  A('trail_buy_1', 'shopping', 'trailsBought', 1, 15, 'trail');
  A('trails_15', 'shopping', 'trailsCore', 15, 120, 'trail');
  A('trails_all', 'shopping', 'trailsCore', C.TRAILS.filter(t => !t.season).length, 800, 'trail', { title: 't_trailblazer' });
  A('theme_buy_1', 'shopping', 'themesBought', 1, 20, 'palette');
  A('scenes_6', 'shopping', 'sceneThemes', 6, 150, 'palette');
  A('scenes_all', 'shopping', 'sceneThemes', C.THEMES.filter(t => t.scene && !t.season).length, 700, 'palette', { title: 't_worldwalker' });
  A('gear_skin_1', 'shopping', 'gearSkinsBought', 1, 20, 'aegis');
  A('aegisskins_all', 'shopping', 'aegisSkins', HR.GEAR.aegisSkins.length, 900, 'aegis');
  A('jetskins_10', 'shopping', 'jetSkins', 10, 300, 'jet');
  A('jetskins_all', 'shopping', 'jetSkins', HR.GEAR.jetSkins.length, 700, 'megajet');
  A('consumables_10', 'shopping', 'consumablesBought', 10, 40, 'aegis');
  A('consumables_50', 'shopping', 'consumablesBought', 50, 150, 'aegis');
  A('spend_100k', 'shopping', 'coinsSpent', 100000, 150, 'coins');
  A('spend_1m', 'shopping', 'coinsSpent', 1000000, 600, 'coins', { title: 't_magnate' });

  // ---------- Chefes ----------
  HR.REGIONS.forEach((R, i) => A('gboss_' + (i + 1), 'bosses', 'gboss_' + i, 1, 60 + i * 25, (HR.BOSSES[R.boss] || {}).icon || 'crown'));
  A('sysboss_25', 'bosses', 'systemsCleared', 25, 90, 'system');
  A('boss_flawless_1', 'bosses', 'bossFlawless', 1, 40, 'crown');
  A('boss_flawless_10', 'bosses', 'bossFlawless', 10, 150, 'crown');
  A('boss_flawless_50', 'bosses', 'bossFlawless', 50, 500, 'crown', { title: 't_untouched' });
  A('aegis_close', 'bosses', 'aegisBossSaves', 1, 80, 'shieldHalf');

  // ---------- Feitos especiais ----------
  A('perfect_level_1', 'feats', 'perfectLevels', 1, 30, 'target');
  A('perfect_level_25', 'feats', 'perfectLevels', 25, 200, 'target');
  A('three_system_1', 'feats', 'threeStarSystems', 1, 60, 'starGlow');
  A('three_system_10', 'feats', 'threeStarSystems', 10, 300, 'starGlow');
  A('revive_win', 'feats', 'reviveWins', 1, 40, 'heartbeat');
  A('dir_run_6', 'feats', 'bestDirRun', 6, 60, 'compass');
  A('dir_run_10', 'feats', 'bestDirRun', 10, 200, 'compass', { hidden: true });
  A('coins_run_300', 'feats', 'bestRunCoins', 300, 60, 'coins');
  A('coins_run_800', 'feats', 'bestRunCoins', 800, 250, 'coins');
  A('controls_3', 'feats', 'controlsUsed', 3, 20, 'ctrlStick');
  A('autoperk_50', 'feats', 'autoPerksTotal', 50, 40, 'sparkle');

  HR.ACH_CATS = ['galaxy', 'bosses', 'singularity', 'flight', 'precision', 'feats', 'power', 'collection', 'shopping', 'wealth', 'dedication', 'secret'];
  ['t_patron', 't_trailblazer', 't_worldwalker', 't_magnate', 't_untouched'].forEach(k => { if (!HR.TITLES.includes(k)) HR.TITLES.push(k); });

  // nível da medalha pelo tamanho do prêmio
  HR.Achievements.tier = a => { const g = a.gems || 0; return g <= 20 ? 'bronze' : g <= 60 ? 'silver' : g <= 200 ? 'gold' : g <= 600 ? 'platinum' : 'diamond'; };

  /* ---------------- estatísticas ---------------- */
  const s5 = () => HR.Store.data.stats5 || (HR.Store.data.stats5 = {});
  const bump = (k, n) => { const x = s5(); x[k] = (x[k] || 0) + (n == null ? 1 : n); };
  const after = (obj, fn, cb) => {
    const f = obj && obj[fn]; if (!f) return;
    obj[fn] = function () { const r = f.apply(this, arguments); if (r) { try { cb.apply(this, arguments); } catch (e) { console.error(e); } } return r; };
  };
  const check = () => setTimeout(() => { if (HR.UI && HR.UI.trophyCheck) HR.UI.trophyCheck(); }, 80);
  after(HR.Unlocks, 'buy', type => { bump(type + 'Bought'); HR.Store.save(); check(); });
  after(HR.Gear, 'buy', () => { bump('gearSkinsBought'); HR.Store.save(); check(); });
  after(HR.Consumables, 'buy', (id, bundle) => { const g = HR.GEAR.consumables[id]; bump('consumablesBought', bundle && g ? g.bundle.n : 1); HR.Store.save(); check(); });
  after(HR.Abilities, 'buy', () => check());
  after(HR.Core, 'upgrade', () => check());
  after(HR.Campaign, 'complete', (level, s) => {
    if (level.boss && s.hits === 0) bump('bossFlawless');
    if (s.perfects >= level.rings) bump('perfectLevels');
    if (s.revives > 0) bump('reviveWins');
    if (level.boss && s.aegisSaves > 0) bump('aegisBossSaves');
  });

  // quando o troféu foi ganho e quais ainda não foram vistos na Sala de Troféus
  const chk = HR.Achievements.check;
  HR.Achievements.check = function () {
    const out = chk.apply(this, arguments);
    if (out.length) { const d = HR.Store.data; d.achAt = d.achAt || {}; d.achNew = d.achNew || []; out.forEach(a => { d.achAt[a.id] = Date.now(); if (!d.achNew.includes(a.id)) d.achNew.push(a.id); }); HR.Store.save(); }
    return out;
  };
  const stats5 = HR.Achievements.stats5;
  HR.Achievements.stats5 = function () {
    const out = stats5.call(this), d = HR.Store.data, x = d.stats5 || {}, CP = HR.Campaign;
    ['skinsBought', 'trailsBought', 'themesBought', 'gearSkinsBought', 'consumablesBought', 'bossFlawless', 'perfectLevels', 'reviveWins', 'aegisBossSaves', 'bestDirRun', 'bestRunCoins', 'autoPerksTotal'].forEach(k => { out[k] = x[k] || 0; });
    out.controlsUsed = (x.controlsUsed || []).length;
    out.trailsCore = d.owned.trails.filter(id => { const t = C.TRAILS.find(q => q.id === id); return t && !t.season; }).length;
    out.sceneThemes = d.owned.themes.filter(id => { const t = C.THEMES.find(q => q.id === id); return t && t.scene && !t.season; }).length;
    HR.REGIONS.forEach((R, i) => { out['gboss_' + i] = CP && CP.bossBeaten(i) ? 1 : 0; });
    let three = 0;
    if (CP && CP.systemStars) for (let ri = 0; ri < HR.REGIONS.length; ri++) for (let si = 0; si < 10; si++) if (CP.systemStars(ri, si) >= 30) three++;
    out.threeStarSystems = three;
    return out;
  };
})();

/* ---------------- textos ---------------- */
(function () {
  const L = {
    pt: {
      trophies: 'Conquistas', collection_btn: 'Coleção', album: 'Conquistas', alb_ach: 'Troféus', alb_gear: 'Itens',
      tr_title: 'Sala de Troféus', tr_progress: '{a} de {b} troféus', tr_done: 'completo', tr_near: 'Quase lá', tr_recent: 'Conquistados agora', tr_all: 'Todos', tr_got: 'Ganhos', tr_missing: 'Faltando',
      tr_unlocked: 'Troféu', tr_on: 'Conquistado em {d}', tr_got_old: 'Conquistado', tr_reward: 'Prêmio', tr_gems_total: 'gemas ganhas com troféus', tr_new: 'NOVO', tr_hidden_d: 'Um feito secreto. Continue jogando para descobrir.',
      tier_bronze: 'Bronze', tier_silver: 'Prata', tier_gold: 'Ouro', tier_platinum: 'Platina', tier_diamond: 'Diamante',
      ach_shopping: 'Compras', ach_bosses: 'Chefes', ach_feats: 'Feitos especiais',
      adapt_slowmo: 'Câmera lenta de adaptação', adapt_slowmo_d: 'Depois de erros, curvas e poderes, o tempo desacelera um pouco e volta devagar.',
      perk_auto_d: 'Os poderes são escolhidos na hora, sem pausar a partida.',
      a_buy_first: 'Primeira Compra', a_buy_10: 'Cliente Fiel', a_buy_50: 'Sacolas Cheias', a_buy_150: 'Mecenas', a_skin_buy_1: 'Bola Nova', a_skin_buy_10: 'Vitrine', a_skin_buy_30: 'Armário Cheio',
      a_trail_buy_1: 'Deixando Rastro', a_trails_15: 'Caminhos Diversos', a_trails_all: 'Todos os Rastros', a_theme_buy_1: 'Novo Horizonte', a_scenes_6: 'Viajante de Cenários', a_scenes_all: 'Todos os Mundos',
      a_gear_skin_1: 'Estilo de Batalha', a_aegisskins_all: 'Arsenal de Égides', a_jetskins_10: 'Mestre das Chamas', a_jetskins_all: 'Todas as Chamas', a_consumables_10: 'Precavido', a_consumables_50: 'Estoque Cheio', a_spend_100k: 'Gastador', a_spend_1m: 'Magnata',
      a_sysboss_25: 'Caçador de Sistemas', a_boss_flawless_1: 'Sem Um Arranhão', a_boss_flawless_10: 'Intocável', a_boss_flawless_50: 'Lenda Intocada', a_aegis_close: 'Salvo pela Égide',
      a_perfect_level_1: 'Fase Perfeita', a_perfect_level_25: 'Perfeccionista', a_three_system_1: 'Sistema Dourado', a_three_system_10: 'Constelação de Ouro', a_revive_win: 'Volta por Cima',
      a_dir_run_6: 'Piloto de Curvas', a_dir_run_10: 'Labirinto Vencido', a_coins_run_300: 'Bolso Cheio', a_coins_run_800: 'Cofre Voador', a_controls_3: 'Três Jeitos de Voar', a_autoperk_50: 'Confia no Instinto',
      a_d_skinsBought: 'Compre {n} bolas', a_d_trailsBought: 'Compre {n} rastros', a_d_trailsCore: 'Tenha {n} rastros', a_d_themesBought: 'Compre {n} temas', a_d_sceneThemes: 'Tenha {n} temas com cenário',
      a_d_gearSkinsBought: 'Compre {n} visuais de Égide ou Jato', a_d_consumablesBought: 'Compre {n} Égides ou Jatos', a_d_bossFlawless: 'Vença {n} chefes sem levar dano', a_d_aegisBossSaves: 'Seja salvo pela Égide durante um chefe',
      a_d_perfectLevels: 'Termine {n} fases com todos os arcos perfeitos', a_d_threeStarSystems: 'Faça 3 estrelas em todas as fases de {n} sistemas', a_d_reviveWins: 'Conclua uma fase depois de continuar',
      a_d_bestDirRun: 'Mude de direção {n} vezes numa partida', a_d_bestRunCoins: 'Ganhe {n} moedas numa partida', a_d_controlsUsed: 'Jogue com os {n} tipos de controle', a_d_autoPerksTotal: 'Receba {n} poderes pela escolha automática',
      t_patron: 'Mecenas', t_trailblazer: 'Desbravador', t_worldwalker: 'Andarilho dos Mundos', t_magnate: 'Magnata', t_untouched: 'Intocado',
      trail_ribbon: 'Fita de Seda', trail_neon: 'Neon', trail_smoke: 'Fumaça', trail_drops: 'Gotas', trail_confetti: 'Confete', trail_helix: 'Hélice', trail_notes: 'Melodia', trail_hearts: 'Corações', trail_leaves: 'Outono', trail_pixel: 'Pixel', trail_laser: 'Laser', trail_halos: 'Halos', trail_frost: 'Geada',
      trail_ink: 'Nanquim', trail_stardust: 'Pó Estelar', trail_feathers: 'Penas', trail_vine: 'Trepadeira', trail_butterflies: 'Borboletas', trail_zigzag: 'Zigue-zague', trail_gold: 'Tesouro', trail_blueflame: 'Fogo Azul', trail_meteors: 'Chuva de Meteoros',
      trail_fireworks: 'Fogos', trail_glitch: 'Glitch', trail_clones: 'Clones', trail_runes: 'Runas', trail_aurora: 'Aurora', trail_prism: 'Prisma',
      flavor_trail_ribbon: 'Uma fita de seda que torce no ar.', flavor_trail_neon: 'Tubo de neon com núcleo branco.', flavor_trail_smoke: 'Fumaça macia que se espalha.', flavor_trail_drops: 'Gotas de água caindo atrás de você.', flavor_trail_confetti: 'Festa em cada movimento.',
      flavor_trail_helix: 'Duas fitas girando como DNA.', flavor_trail_notes: 'Notas musicais subindo.', flavor_trail_hearts: 'Corações que flutuam.', flavor_trail_leaves: 'Folhas de outono rodopiando.', flavor_trail_pixel: 'Blocos de 8 bits.', flavor_trail_laser: 'Feixe tracejado vermelho.', flavor_trail_halos: 'Arcos de luz que se abrem.', flavor_trail_frost: 'Cristais de gelo e névoa fria.',
      flavor_trail_ink: 'Pincelada de nanquim com respingos.', flavor_trail_stardust: 'Brilho de estrelas cintilando.', flavor_trail_feathers: 'Penas planando devagar.', flavor_trail_vine: 'Uma trepadeira que floresce.', flavor_trail_butterflies: 'Borboletas coloridas batendo asas.', flavor_trail_zigzag: 'Descarga elétrica em zigue-zague.', flavor_trail_gold: 'Moedas de ouro girando.', flavor_trail_blueflame: 'Chamas azuis e brancas.', flavor_trail_meteors: 'Pequenos meteoros riscando o céu.',
      flavor_trail_fireworks: 'Fogos de artifício estourando.', flavor_trail_glitch: 'A realidade falhando em RGB.', flavor_trail_clones: 'Ecos translúcidos da sua bola.', flavor_trail_runes: 'Runas antigas acesas.', flavor_trail_aurora: 'Três faixas de aurora ondulando.', flavor_trail_prism: 'A luz se abre em todas as cores.',
      theme_skies: 'Céu Aberto', theme_alpine: 'Alpes', theme_desert: 'Deserto', theme_tropical: 'Tropical', theme_metropolis: 'Metrópole', theme_harbor: 'Porto do Farol', theme_zen: 'Jardim Zen', theme_jungle: 'Selva', theme_savanna: 'Savana', theme_arcade: 'Fliperama', theme_neonrain: 'Chuva Neon', theme_moonbase: 'Base Lunar',
      flavor_theme_skies: 'Nuvens fofas e vento correndo.', flavor_theme_alpine: 'Montanhas nevadas ao amanhecer.', flavor_theme_desert: 'Dunas, pirâmides e cactos sob o sol.', flavor_theme_tropical: 'Ilhas com coqueiros e o sol no mar.', flavor_theme_metropolis: 'Arranha-céus com janelas acesas.', flavor_theme_harbor: 'Farol girando sobre o mar escuro.',
      flavor_theme_zen: 'Pagodes, torii e cerejeiras.', flavor_theme_jungle: 'Folhas gigantes, cipós e ruínas.', flavor_theme_savanna: 'Acácias e capim sob um sol enorme.', flavor_theme_arcade: 'Montanhas e cidade de pixels.', flavor_theme_neonrain: 'Chuva sobre uma cidade neon.', flavor_theme_moonbase: 'Cúpulas na Lua com a Terra no céu.',
      flavor_theme_sunset: 'Praia ao pôr do sol, com o sol no mar.', flavor_theme_ocean: 'Recife de corais e algas balançando.', flavor_theme_cyber: 'Cidade neon com janelas piscando.', flavor_theme_candy: 'Pirulitos, bengalas e colinas doces.', flavor_theme_forest: 'Pinheiros em camadas e vaga-lumes.', flavor_theme_inferno: 'Um vulcão ativo soltando fumaça.',
      flavor_theme_prism: 'Caverna de cristais rosados.', flavor_theme_halloween: 'Cemitério, casa assombrada e lua cheia.', flavor_theme_natal: 'Pinheiros cobertos de neve.',
      aegisskin_bubble: 'Bolha de Sabão', aegisskin_hearts: 'Corações', aegisskin_leaves: 'Guirlanda', aegisskin_ripple: 'Maré', aegisskin_circuit: 'Circuito', aegisskin_stained: 'Vitral', aegisskin_sonar: 'Sonar', aegisskin_cube: 'Hipercubo', aegisskin_clockwork: 'Relojoaria', aegisskin_galaxy: 'Galáxia', aegisskin_wings: 'Asas', aegisskin_dragon: 'Dragão', aegisskin_glitch: 'Glitch', aegisskin_crown: 'Coroa',
      jetskin_ion: 'Íon', jetskin_smoke: 'Foguete', jetskin_bubbles: 'Bolhas', jetskin_hearts: 'Corações', jetskin_pixel: 'Pixel', jetskin_frost: 'Gelo', jetskin_starfall: 'Estrelas', jetskin_twin: 'Turbina Dupla', jetskin_lightning: 'Relâmpago', jetskin_phoenix: 'Fênix', jetskin_void: 'Vazio', jetskin_gold: 'Ouro'
    },
    en: {
      trophies: 'Trophies', collection_btn: 'Collection', album: 'Trophies', alb_ach: 'Trophies', alb_gear: 'Items',
      tr_title: 'Trophy Room', tr_progress: '{a} of {b} trophies', tr_done: 'complete', tr_near: 'Almost there', tr_recent: 'Just earned', tr_all: 'All', tr_got: 'Earned', tr_missing: 'Missing',
      tr_unlocked: 'Trophy', tr_on: 'Earned on {d}', tr_got_old: 'Earned', tr_reward: 'Reward', tr_gems_total: 'gems earned from trophies', tr_new: 'NEW', tr_hidden_d: 'A secret feat. Keep playing to find it.',
      tier_bronze: 'Bronze', tier_silver: 'Silver', tier_gold: 'Gold', tier_platinum: 'Platinum', tier_diamond: 'Diamond',
      ach_shopping: 'Shopping', ach_bosses: 'Bosses', ach_feats: 'Special feats',
      adapt_slowmo: 'Adaptive slow motion', adapt_slowmo_d: 'After mistakes, turns and perks, time slows a little and speeds back up gently.',
      perk_auto_d: 'Perks are picked instantly, without pausing the run.',
      a_buy_first: 'First Purchase', a_buy_10: 'Loyal Customer', a_buy_50: 'Full Bags', a_buy_150: 'Patron', a_skin_buy_1: 'New Ball', a_skin_buy_10: 'Showcase', a_skin_buy_30: 'Full Closet',
      a_trail_buy_1: 'Leaving a Trail', a_trails_15: 'Many Paths', a_trails_all: 'Every Trail', a_theme_buy_1: 'New Horizon', a_scenes_6: 'Scene Traveler', a_scenes_all: 'Every World',
      a_gear_skin_1: 'Battle Style', a_aegisskins_all: 'Aegis Arsenal', a_jetskins_10: 'Flame Master', a_jetskins_all: 'Every Flame', a_consumables_10: 'Prepared', a_consumables_50: 'Fully Stocked', a_spend_100k: 'Big Spender', a_spend_1m: 'Tycoon',
      a_sysboss_25: 'System Hunter', a_boss_flawless_1: 'Not a Scratch', a_boss_flawless_10: 'Untouchable', a_boss_flawless_50: 'Untouched Legend', a_aegis_close: 'Saved by the Aegis',
      a_perfect_level_1: 'Perfect Level', a_perfect_level_25: 'Perfectionist', a_three_system_1: 'Golden System', a_three_system_10: 'Golden Constellation', a_revive_win: 'Comeback',
      a_dir_run_6: 'Turn Pilot', a_dir_run_10: 'Maze Beaten', a_coins_run_300: 'Full Pockets', a_coins_run_800: 'Flying Vault', a_controls_3: 'Three Ways to Fly', a_autoperk_50: 'Trust Your Instinct',
      a_d_skinsBought: 'Buy {n} balls', a_d_trailsBought: 'Buy {n} trails', a_d_trailsCore: 'Own {n} trails', a_d_themesBought: 'Buy {n} themes', a_d_sceneThemes: 'Own {n} themes with scenery',
      a_d_gearSkinsBought: 'Buy {n} Aegis or Jet looks', a_d_consumablesBought: 'Buy {n} Aegis or Jets', a_d_bossFlawless: 'Beat {n} bosses without taking damage', a_d_aegisBossSaves: 'Get saved by the Aegis during a boss',
      a_d_perfectLevels: 'Finish {n} levels with every ring perfect', a_d_threeStarSystems: 'Get 3 stars on every level of {n} systems', a_d_reviveWins: 'Clear a level after continuing',
      a_d_bestDirRun: 'Change direction {n} times in one run', a_d_bestRunCoins: 'Earn {n} coins in one run', a_d_controlsUsed: 'Play with all {n} control types', a_d_autoPerksTotal: 'Get {n} perks from auto pick',
      t_patron: 'Patron', t_trailblazer: 'Trailblazer', t_worldwalker: 'Worldwalker', t_magnate: 'Tycoon', t_untouched: 'Untouched',
      trail_ribbon: 'Silk Ribbon', trail_neon: 'Neon', trail_smoke: 'Smoke', trail_drops: 'Drops', trail_confetti: 'Confetti', trail_helix: 'Helix', trail_notes: 'Melody', trail_hearts: 'Hearts', trail_leaves: 'Autumn', trail_pixel: 'Pixel', trail_laser: 'Laser', trail_halos: 'Halos', trail_frost: 'Frost',
      trail_ink: 'Ink', trail_stardust: 'Stardust', trail_feathers: 'Feathers', trail_vine: 'Vine', trail_butterflies: 'Butterflies', trail_zigzag: 'Zigzag', trail_gold: 'Treasure', trail_blueflame: 'Blue Flame', trail_meteors: 'Meteor Shower',
      trail_fireworks: 'Fireworks', trail_glitch: 'Glitch', trail_clones: 'Clones', trail_runes: 'Runes', trail_aurora: 'Aurora', trail_prism: 'Prism',
      flavor_trail_ribbon: 'A silk ribbon twisting in the air.', flavor_trail_neon: 'A neon tube with a white core.', flavor_trail_smoke: 'Soft smoke that spreads out.', flavor_trail_drops: 'Water drops falling behind you.', flavor_trail_confetti: 'A party in every move.',
      flavor_trail_helix: 'Two strands spinning like DNA.', flavor_trail_notes: 'Musical notes rising.', flavor_trail_hearts: 'Floating hearts.', flavor_trail_leaves: 'Autumn leaves swirling.', flavor_trail_pixel: '8-bit blocks.', flavor_trail_laser: 'A red dashed beam.', flavor_trail_halos: 'Rings of light opening up.', flavor_trail_frost: 'Ice crystals and cold mist.',
      flavor_trail_ink: 'An ink stroke with splatters.', flavor_trail_stardust: 'Twinkling star glitter.', flavor_trail_feathers: 'Feathers gliding slowly.', flavor_trail_vine: 'A vine that blooms.', flavor_trail_butterflies: 'Colorful butterflies fluttering.', flavor_trail_zigzag: 'An electric zigzag discharge.', flavor_trail_gold: 'Spinning gold coins.', flavor_trail_blueflame: 'Blue and white flames.', flavor_trail_meteors: 'Tiny meteors streaking by.',
      flavor_trail_fireworks: 'Fireworks bursting.', flavor_trail_glitch: 'Reality glitching in RGB.', flavor_trail_clones: 'See-through echoes of your ball.', flavor_trail_runes: 'Ancient glowing runes.', flavor_trail_aurora: 'Three aurora bands waving.', flavor_trail_prism: 'Light splitting into every color.',
      theme_skies: 'Open Skies', theme_alpine: 'Alps', theme_desert: 'Desert', theme_tropical: 'Tropical', theme_metropolis: 'Metropolis', theme_harbor: 'Lighthouse Harbor', theme_zen: 'Zen Garden', theme_jungle: 'Jungle', theme_savanna: 'Savanna', theme_arcade: 'Arcade', theme_neonrain: 'Neon Rain', theme_moonbase: 'Moon Base',
      flavor_theme_skies: 'Fluffy clouds and rushing wind.', flavor_theme_alpine: 'Snowy mountains at dawn.', flavor_theme_desert: 'Dunes, pyramids and cacti under the sun.', flavor_theme_tropical: 'Palm islands and the sun on the sea.', flavor_theme_metropolis: 'Skyscrapers with lit windows.', flavor_theme_harbor: 'A lighthouse sweeping the dark sea.',
      flavor_theme_zen: 'Pagodas, torii gates and cherry trees.', flavor_theme_jungle: 'Giant leaves, vines and ruins.', flavor_theme_savanna: 'Acacias and grass under a huge sun.', flavor_theme_arcade: 'Pixel mountains and a pixel city.', flavor_theme_neonrain: 'Rain over a neon city.', flavor_theme_moonbase: 'Domes on the Moon with Earth in the sky.',
      flavor_theme_sunset: 'A beach at sunset, the sun sinking into the sea.', flavor_theme_ocean: 'A coral reef with swaying kelp.', flavor_theme_cyber: 'A neon city with blinking windows.', flavor_theme_candy: 'Lollipops, candy canes and sweet hills.', flavor_theme_forest: 'Layered pines and fireflies.', flavor_theme_inferno: 'An active volcano puffing smoke.',
      flavor_theme_prism: 'A cave of pink crystals.', flavor_theme_halloween: 'Graveyard, haunted house and full moon.', flavor_theme_natal: 'Pines covered in snow.',
      aegisskin_bubble: 'Soap Bubble', aegisskin_hearts: 'Hearts', aegisskin_leaves: 'Wreath', aegisskin_ripple: 'Tide', aegisskin_circuit: 'Circuit', aegisskin_stained: 'Stained Glass', aegisskin_sonar: 'Sonar', aegisskin_cube: 'Hypercube', aegisskin_clockwork: 'Clockwork', aegisskin_galaxy: 'Galaxy', aegisskin_wings: 'Wings', aegisskin_dragon: 'Dragon', aegisskin_glitch: 'Glitch', aegisskin_crown: 'Crown',
      jetskin_ion: 'Ion', jetskin_smoke: 'Rocket', jetskin_bubbles: 'Bubbles', jetskin_hearts: 'Hearts', jetskin_pixel: 'Pixel', jetskin_frost: 'Ice', jetskin_starfall: 'Stars', jetskin_twin: 'Twin Turbine', jetskin_lightning: 'Lightning', jetskin_phoenix: 'Phoenix', jetskin_void: 'Void', jetskin_gold: 'Gold'
    },
    es: {
      trophies: 'Logros', collection_btn: 'Colección', album: 'Logros', alb_ach: 'Trofeos', alb_gear: 'Objetos',
      tr_title: 'Sala de Trofeos', tr_progress: '{a} de {b} trofeos', tr_done: 'completo', tr_near: 'Casi listo', tr_recent: 'Recién ganados', tr_all: 'Todos', tr_got: 'Ganados', tr_missing: 'Faltan',
      tr_unlocked: 'Trofeo', tr_on: 'Ganado el {d}', tr_got_old: 'Ganado', tr_reward: 'Premio', tr_gems_total: 'gemas ganadas con trofeos', tr_new: 'NUEVO', tr_hidden_d: 'Una hazaña secreta. Sigue jugando para descubrirla.',
      tier_bronze: 'Bronce', tier_silver: 'Plata', tier_gold: 'Oro', tier_platinum: 'Platino', tier_diamond: 'Diamante',
      ach_shopping: 'Compras', ach_bosses: 'Jefes', ach_feats: 'Hazañas especiales',
      adapt_slowmo: 'Cámara lenta de adaptación', adapt_slowmo_d: 'Tras errores, curvas y poderes, el tiempo se frena un poco y vuelve despacio.',
      perk_auto_d: 'Los poderes se eligen al instante, sin pausar la partida.',
      a_buy_first: 'Primera Compra', a_buy_10: 'Cliente Fiel', a_buy_50: 'Bolsas Llenas', a_buy_150: 'Mecenas', a_skin_buy_1: 'Bola Nueva', a_skin_buy_10: 'Vitrina', a_skin_buy_30: 'Armario Lleno',
      a_trail_buy_1: 'Dejando Rastro', a_trails_15: 'Muchos Caminos', a_trails_all: 'Todas las Estelas', a_theme_buy_1: 'Nuevo Horizonte', a_scenes_6: 'Viajero de Escenarios', a_scenes_all: 'Todos los Mundos',
      a_gear_skin_1: 'Estilo de Batalla', a_aegisskins_all: 'Arsenal de Égidas', a_jetskins_10: 'Maestro de las Llamas', a_jetskins_all: 'Todas las Llamas', a_consumables_10: 'Precavido', a_consumables_50: 'Bien Abastecido', a_spend_100k: 'Derrochador', a_spend_1m: 'Magnate',
      a_sysboss_25: 'Cazador de Sistemas', a_boss_flawless_1: 'Sin un Rasguño', a_boss_flawless_10: 'Intocable', a_boss_flawless_50: 'Leyenda Intacta', a_aegis_close: 'Salvado por la Égida',
      a_perfect_level_1: 'Nivel Perfecto', a_perfect_level_25: 'Perfeccionista', a_three_system_1: 'Sistema Dorado', a_three_system_10: 'Constelación de Oro', a_revive_win: 'Remontada',
      a_dir_run_6: 'Piloto de Curvas', a_dir_run_10: 'Laberinto Vencido', a_coins_run_300: 'Bolsillo Lleno', a_coins_run_800: 'Bóveda Voladora', a_controls_3: 'Tres Formas de Volar', a_autoperk_50: 'Confía en tu Instinto',
      a_d_skinsBought: 'Compra {n} bolas', a_d_trailsBought: 'Compra {n} estelas', a_d_trailsCore: 'Ten {n} estelas', a_d_themesBought: 'Compra {n} temas', a_d_sceneThemes: 'Ten {n} temas con escenario',
      a_d_gearSkinsBought: 'Compra {n} aspectos de Égida o Propulsor', a_d_consumablesBought: 'Compra {n} Égidas o Propulsores', a_d_bossFlawless: 'Vence a {n} jefes sin recibir daño', a_d_aegisBossSaves: 'Sálvate con la Égida durante un jefe',
      a_d_perfectLevels: 'Termina {n} niveles con todos los aros perfectos', a_d_threeStarSystems: 'Consigue 3 estrellas en todos los niveles de {n} sistemas', a_d_reviveWins: 'Supera un nivel después de continuar',
      a_d_bestDirRun: 'Cambia de dirección {n} veces en una partida', a_d_bestRunCoins: 'Gana {n} monedas en una partida', a_d_controlsUsed: 'Juega con los {n} tipos de control', a_d_autoPerksTotal: 'Recibe {n} poderes por elección automática',
      t_patron: 'Mecenas', t_trailblazer: 'Pionero', t_worldwalker: 'Caminante de Mundos', t_magnate: 'Magnate', t_untouched: 'Intacto',
      trail_ribbon: 'Cinta de Seda', trail_neon: 'Neón', trail_smoke: 'Humo', trail_drops: 'Gotas', trail_confetti: 'Confeti', trail_helix: 'Hélice', trail_notes: 'Melodía', trail_hearts: 'Corazones', trail_leaves: 'Otoño', trail_pixel: 'Píxel', trail_laser: 'Láser', trail_halos: 'Halos', trail_frost: 'Escarcha',
      trail_ink: 'Tinta', trail_stardust: 'Polvo Estelar', trail_feathers: 'Plumas', trail_vine: 'Enredadera', trail_butterflies: 'Mariposas', trail_zigzag: 'Zigzag', trail_gold: 'Tesoro', trail_blueflame: 'Fuego Azul', trail_meteors: 'Lluvia de Meteoros',
      trail_fireworks: 'Fuegos Artificiales', trail_glitch: 'Glitch', trail_clones: 'Clones', trail_runes: 'Runas', trail_aurora: 'Aurora', trail_prism: 'Prisma',
      flavor_trail_ribbon: 'Una cinta de seda que se retuerce.', flavor_trail_neon: 'Tubo de neón con núcleo blanco.', flavor_trail_smoke: 'Humo suave que se expande.', flavor_trail_drops: 'Gotas de agua cayendo detrás de ti.', flavor_trail_confetti: 'Una fiesta en cada movimiento.',
      flavor_trail_helix: 'Dos hebras girando como ADN.', flavor_trail_notes: 'Notas musicales que suben.', flavor_trail_hearts: 'Corazones que flotan.', flavor_trail_leaves: 'Hojas de otoño girando.', flavor_trail_pixel: 'Bloques de 8 bits.', flavor_trail_laser: 'Un haz rojo discontinuo.', flavor_trail_halos: 'Aros de luz que se abren.', flavor_trail_frost: 'Cristales de hielo y niebla fría.',
      flavor_trail_ink: 'Un trazo de tinta con salpicaduras.', flavor_trail_stardust: 'Brillo de estrellas titilando.', flavor_trail_feathers: 'Plumas que planean despacio.', flavor_trail_vine: 'Una enredadera que florece.', flavor_trail_butterflies: 'Mariposas de colores aleteando.', flavor_trail_zigzag: 'Una descarga eléctrica en zigzag.', flavor_trail_gold: 'Monedas de oro girando.', flavor_trail_blueflame: 'Llamas azules y blancas.', flavor_trail_meteors: 'Pequeños meteoros cruzando.',
      flavor_trail_fireworks: 'Fuegos artificiales estallando.', flavor_trail_glitch: 'La realidad fallando en RGB.', flavor_trail_clones: 'Ecos translúcidos de tu bola.', flavor_trail_runes: 'Runas antiguas encendidas.', flavor_trail_aurora: 'Tres franjas de aurora ondulando.', flavor_trail_prism: 'La luz se abre en todos los colores.',
      theme_skies: 'Cielo Abierto', theme_alpine: 'Alpes', theme_desert: 'Desierto', theme_tropical: 'Tropical', theme_metropolis: 'Metrópolis', theme_harbor: 'Puerto del Faro', theme_zen: 'Jardín Zen', theme_jungle: 'Selva', theme_savanna: 'Sabana', theme_arcade: 'Arcade', theme_neonrain: 'Lluvia Neón', theme_moonbase: 'Base Lunar',
      flavor_theme_skies: 'Nubes esponjosas y viento corriendo.', flavor_theme_alpine: 'Montañas nevadas al amanecer.', flavor_theme_desert: 'Dunas, pirámides y cactus bajo el sol.', flavor_theme_tropical: 'Islas con palmeras y el sol en el mar.', flavor_theme_metropolis: 'Rascacielos con ventanas encendidas.', flavor_theme_harbor: 'Un faro barriendo el mar oscuro.',
      flavor_theme_zen: 'Pagodas, torii y cerezos.', flavor_theme_jungle: 'Hojas gigantes, lianas y ruinas.', flavor_theme_savanna: 'Acacias y hierba bajo un sol enorme.', flavor_theme_arcade: 'Montañas y ciudad de píxeles.', flavor_theme_neonrain: 'Lluvia sobre una ciudad neón.', flavor_theme_moonbase: 'Cúpulas en la Luna con la Tierra en el cielo.',
      flavor_theme_sunset: 'Playa al atardecer, con el sol en el mar.', flavor_theme_ocean: 'Arrecife de coral y algas meciéndose.', flavor_theme_cyber: 'Ciudad neón con ventanas parpadeando.', flavor_theme_candy: 'Piruletas, bastones y colinas dulces.', flavor_theme_forest: 'Pinos en capas y luciérnagas.', flavor_theme_inferno: 'Un volcán activo echando humo.',
      flavor_theme_prism: 'Cueva de cristales rosados.', flavor_theme_halloween: 'Cementerio, casa encantada y luna llena.', flavor_theme_natal: 'Pinos cubiertos de nieve.',
      aegisskin_bubble: 'Pompa de Jabón', aegisskin_hearts: 'Corazones', aegisskin_leaves: 'Guirnalda', aegisskin_ripple: 'Marea', aegisskin_circuit: 'Circuito', aegisskin_stained: 'Vitral', aegisskin_sonar: 'Sonar', aegisskin_cube: 'Hipercubo', aegisskin_clockwork: 'Relojería', aegisskin_galaxy: 'Galaxia', aegisskin_wings: 'Alas', aegisskin_dragon: 'Dragón', aegisskin_glitch: 'Glitch', aegisskin_crown: 'Corona',
      jetskin_ion: 'Ion', jetskin_smoke: 'Cohete', jetskin_bubbles: 'Burbujas', jetskin_hearts: 'Corazones', jetskin_pixel: 'Píxel', jetskin_frost: 'Hielo', jetskin_starfall: 'Estrellas', jetskin_twin: 'Turbina Doble', jetskin_lightning: 'Relámpago', jetskin_phoenix: 'Fénix', jetskin_void: 'Vacío', jetskin_gold: 'Oro'
    }
  };
  HR.I18N_V51 = L;
  ['pt', 'en', 'es'].forEach(lang => {
    const T = Object.assign({}, L[lang]);
    HR.REGIONS.forEach((R, i) => {
      T['a_gboss_' + (i + 1)] = (HR.I18N[lang]['boss_' + R.boss] || HR.I18N.pt['boss_' + R.boss] || R.boss);
      const gal = HR.I18N[lang]['gal_' + R.gal] || HR.I18N.pt['gal_' + R.gal] || R.gal;
      T['a_d_gboss_' + i] = lang === 'en' ? 'Beat the boss of ' + gal : lang === 'es' ? 'Vence al jefe de ' + gal : 'Vença o chefe de ' + gal;
    });
    Object.assign(HR.I18N[lang], T);
  });
})();
