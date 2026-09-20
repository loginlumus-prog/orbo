/* =====================================================================
   Égide e Jato (v5): consumíveis comprados só com moedas (mecânica) e
   visuais comprados com moedas ou gemas (cosmético). Ver docs/PLANO_V5.md §10
   - Égide: bolha por 30 s; o primeiro erro quebra a Égide e a bola segue; recarga de 30 s.
   - Jato / Mega Jato: só antes do 1º arco; atravessa 25 / 60 arcos voando.
   ===================================================================== */
window.HR = window.HR || {};

HR.GEAR = {
  consumables: {
    aegis:   { icon: 'aegis',   color: '#4cf0ff', price: 1800, bundle: { n: 5, price: 8500 },  dur: 30, cd: 30 },
    jet:     { icon: 'jet',     color: '#ffb347', price: 1200, bundle: { n: 5, price: 5600 },  rings: 25, speed: 2.4 },
    megajet: { icon: 'megajet', color: '#ff5ecf', price: 3500, bundle: { n: 3, price: 9900 },  rings: 60, speed: 2.8 }
  },
  // style = desenho da bolha em render.js (drawAegis)
  aegisSkins: [
    { id: 'crystal', price: 0,     gems: 0,   rar: 'common',    color: '#4cf0ff', color2: '#ffffff', style: 'hex' },
    { id: 'petals',  price: 9000,  gems: 80,  rar: 'rare',      color: '#ff7ad9', color2: '#ffd6f2', style: 'petals' },
    { id: 'frost',   price: 9000,  gems: 80,  rar: 'rare',      color: '#bdefff', color2: '#ffffff', style: 'snow' },
    { id: 'aurora',  price: 12000, gems: 100, rar: 'rare',      color: '#7cff6b', color2: '#8f6bff', style: 'aurora' },
    { id: 'ember',   price: 12000, gems: 100, rar: 'rare',      color: '#ff9f43', color2: '#ff3d2e', style: 'flame' },
    { id: 'hive',    price: 18000, gems: 140, rar: 'epic',      color: '#ffd93d', color2: '#fff3a0', style: 'hive' },
    { id: 'solar',   price: 22000, gems: 160, rar: 'epic',      color: '#ffcf4a', color2: '#fff3c2', style: 'rays' },
    { id: 'void',    price: 26000, gems: 180, rar: 'epic',      color: '#a88bff', color2: '#1a0b3d', style: 'void' },
    { id: 'runes',   price: 45000, gems: 300, rar: 'legendary', color: '#c3b8ff', color2: '#ffffff', style: 'runes' },
    { id: 'storm',   price: 60000, gems: 380, rar: 'legendary', color: '#9be7ff', color2: '#ffffff', style: 'bolts' }
  ],
  jetSkins: [
    { id: 'blue',    price: 0,     gems: 0,   rar: 'common',    color: '#4cf0ff', color2: '#ffffff' },
    { id: 'solar',   price: 8000,  gems: 70,  rar: 'rare',      color: '#ffb347', color2: '#ff3d2e' },
    { id: 'emerald', price: 14000, gems: 110, rar: 'epic',      color: '#35e29a', color2: '#d7ffe9' },
    { id: 'plasma',  price: 14000, gems: 110, rar: 'epic',      color: '#ff5ecf', color2: '#8f6bff' },
    { id: 'rainbow', price: 50000, gems: 320, rar: 'legendary', color: 'rainbow', color2: '#ffffff' }
  ]
};

HR.Consumables = {
  def(id) { return HR.GEAR.consumables[id]; },
  count(id) { const c = HR.Store.data.consumables || {}; return c[id] || 0; },
  add(id, n, src) {
    const d = HR.Store.data; d.consumables = d.consumables || {};
    d.consumables[id] = Math.max(0, (d.consumables[id] || 0) + n); HR.Store.save();
    HR.Analytics.log('consumable_add', { id, n, src });
  },
  use(id) {
    if (this.count(id) <= 0) return false;
    this.add(id, -1, 'use');
    return true;
  },
  // compra só com moedas (é mecânica)
  buy(id, bundle) {
    const g = this.def(id); if (!g) return false;
    const n = bundle ? g.bundle.n : 1, price = bundle ? g.bundle.price : g.price;
    if (!HR.Economy.spendCoins(price, 'consumable_' + id)) return false;
    this.add(id, n, 'shop'); HR.Store.data.stats.itemsBought++;
    HR.Audio.sfx('buy');
    return true;
  }
};

HR.Gear = {
  list(kind) { return kind === 'jet' ? HR.GEAR.jetSkins : HR.GEAR.aegisSkins; },
  item(kind, id) { return this.list(kind).find(s => s.id === id) || this.list(kind)[0]; },
  current(kind) { const g = HR.Store.data.gear || {}; return this.item(kind, g[kind]); },
  owned(kind, id) { const g = HR.Store.data.gear || {}; const arr = kind === 'jet' ? g.ownedJet : g.ownedAegis; return id === this.list(kind)[0].id || !!(arr && arr.includes(id)); },
  equip(kind, id) { if (!this.owned(kind, id)) return false; HR.Store.data.gear[kind] = id; HR.Store.save(); return true; },
  // visual: moedas (grátis) ou gemas (pago)
  buy(kind, id, cur) {
    const it = this.item(kind, id); if (!it || this.owned(kind, id)) return false;
    const ok = cur === 'gems' ? HR.Economy.spendGems(it.gems, kind + '_skin_' + id) : HR.Economy.spendCoins(it.price, kind + '_skin_' + id);
    if (!ok) return false;
    const g = HR.Store.data.gear; (kind === 'jet' ? g.ownedJet : g.ownedAegis).push(id); g[kind] = id;
    HR.Store.data.stats.itemsBought++; HR.Store.save(); HR.Audio.sfx('buy');
    HR.Analytics.log('gear_buy', { kind, id, cur });
    return true;
  }
};

/* ---------------- textos ---------------- */
Object.assign(HR.I18N.pt, {
  aegis: 'Égide', aegis_d: 'Uma bolha envolve a bola por 30 s. O primeiro erro quebra a Égide e você continua. Recarga de 30 s. Use quantas tiver.',
  jet: 'Jato', jet_d: 'Só no começo: abre um corredor de três faixas por ~20 s. Sem arcos — escolha a faixa e colha. Dá para usar até 5 no mesmo corredor, e a fase começa inteira depois.', megajet: 'Mega Jato', megajet_d: 'O mesmo corredor, mas ~45 s por unidade e mais rápido. Cinco deles passam quase três minutos no grau 5.',
  tab_gear: 'Itens', gear_consumables: 'Consumíveis', gear_consumables_d: 'Só com moedas: é mecânica. Na partida, a Égide fica no botão ao lado das habilidades e os Jatos aparecem antes do 1º arco.',
  gear_aegis_skins: 'Visuais da Égide', gear_jet_skins: 'Chamas do Jato', gear_owned_n: 'Você tem {n}', gear_bundle: 'Pacote ×{n}', gear_buy_one: 'Comprar 1', gear_equip: 'Usar', gear_cosmetic_note: 'Visuais são só estética: moedas ou gemas.',
  aegis_on: 'ÉGIDE ATIVA', aegis_broken: 'ÉGIDE QUEBROU', aegis_end: 'ÉGIDE ACABOU', aegis_none: 'Sem Égides. Compre na loja (Itens).', aegis_cd: 'Recarga da Égide: {n} s', aegis_blocked: 'O Arconte não aceita a Égide neste caminho.',
  jet_go: 'JATO!', megajet_go: 'MEGA JATO!', jet_end: 'FIM DO JATO', jet_hint: 'Usar antes do 1º arco', jet_boss: 'Jatos não entram em chefes.',
  aegisskin_crystal: 'Cristal', aegisskin_petals: 'Pétalas', aegisskin_frost: 'Geada', aegisskin_aurora: 'Aurora', aegisskin_ember: 'Brasa', aegisskin_hive: 'Colmeia', aegisskin_solar: 'Solar', aegisskin_void: 'Vazio', aegisskin_runes: 'Runas', aegisskin_storm: 'Tempestade',
  jetskin_blue: 'Azul', jetskin_solar: 'Solar', jetskin_emerald: 'Esmeralda', jetskin_plasma: 'Plasma', jetskin_rainbow: 'Arco-íris'
});
Object.assign(HR.I18N.en, {
  aegis: 'Aegis', aegis_d: 'A bubble wraps the ball for 30 s. The first mistake breaks the Aegis and you keep going. 30 s cooldown. Use as many as you own.',
  jet: 'Jet', jet_d: 'Start only: opens a three-lane corridor for ~20 s. No rings — pick a lane and collect. Up to 5 in the same corridor, and the level starts whole afterwards.', megajet: 'Mega Jet', megajet_d: 'The same corridor, but ~45 s per unit and faster. Five of them spend almost three minutes at grade 5.',
  tab_gear: 'Items', gear_consumables: 'Consumables', gear_consumables_d: 'Coins only: it is a mechanic. In a run, the Aegis sits next to the abilities and Jets show up before the 1st ring.',
  gear_aegis_skins: 'Aegis looks', gear_jet_skins: 'Jet flames', gear_owned_n: 'You have {n}', gear_bundle: 'Bundle ×{n}', gear_buy_one: 'Buy 1', gear_equip: 'Use', gear_cosmetic_note: 'Looks are cosmetic only: coins or gems.',
  aegis_on: 'AEGIS ON', aegis_broken: 'AEGIS BROKEN', aegis_end: 'AEGIS ENDED', aegis_none: 'No Aegis left. Buy more in the shop (Items).', aegis_cd: 'Aegis cooldown: {n} s', aegis_blocked: 'The Archon refuses the Aegis on this path.',
  jet_go: 'JET!', megajet_go: 'MEGA JET!', jet_end: 'JET OVER', jet_hint: 'Use before the 1st ring', jet_boss: 'Jets are not allowed in boss fights.',
  aegisskin_crystal: 'Crystal', aegisskin_petals: 'Petals', aegisskin_frost: 'Frost', aegisskin_aurora: 'Aurora', aegisskin_ember: 'Ember', aegisskin_hive: 'Hive', aegisskin_solar: 'Solar', aegisskin_void: 'Void', aegisskin_runes: 'Runes', aegisskin_storm: 'Storm',
  jetskin_blue: 'Blue', jetskin_solar: 'Solar', jetskin_emerald: 'Emerald', jetskin_plasma: 'Plasma', jetskin_rainbow: 'Rainbow'
});
Object.assign(HR.I18N.es, {
  aegis: 'Égida', aegis_d: 'Una burbuja envuelve la bola por 30 s. El primer error rompe la Égida y sigues. Recarga de 30 s. Usa todas las que tengas.',
  jet: 'Propulsor', jet_d: 'Solo al inicio: abre un pasillo de tres carriles por ~20 s. Sin aros — elige el carril y recoge. Hasta 5 en el mismo pasillo, y el nivel empieza entero después.', megajet: 'Mega Propulsor', megajet_d: 'El mismo pasillo, pero ~45 s por unidad y más rápido. Cinco de ellos pasan casi tres minutos en el grado 5.',
  tab_gear: 'Objetos', gear_consumables: 'Consumibles', gear_consumables_d: 'Solo con monedas: es mecánica. En la partida, la Égida está junto a las habilidades y los Propulsores aparecen antes del 1.er aro.',
  gear_aegis_skins: 'Estilos de Égida', gear_jet_skins: 'Llamas del Propulsor', gear_owned_n: 'Tienes {n}', gear_bundle: 'Paquete ×{n}', gear_buy_one: 'Comprar 1', gear_equip: 'Usar', gear_cosmetic_note: 'Los estilos son solo estéticos: monedas o gemas.',
  aegis_on: 'ÉGIDA ACTIVA', aegis_broken: 'ÉGIDA ROTA', aegis_end: 'ÉGIDA TERMINADA', aegis_none: 'Sin Égidas. Compra en la tienda (Objetos).', aegis_cd: 'Recarga de la Égida: {n} s', aegis_blocked: 'El Arconte no acepta la Égida en este camino.',
  jet_go: '¡PROPULSOR!', megajet_go: '¡MEGA PROPULSOR!', jet_end: 'FIN DEL PROPULSOR', jet_hint: 'Úsalo antes del 1.er aro', jet_boss: 'Los propulsores no entran en jefes.',
  aegisskin_crystal: 'Cristal', aegisskin_petals: 'Pétalos', aegisskin_frost: 'Escarcha', aegisskin_aurora: 'Aurora', aegisskin_ember: 'Brasa', aegisskin_hive: 'Colmena', aegisskin_solar: 'Solar', aegisskin_void: 'Vacío', aegisskin_runes: 'Runas', aegisskin_storm: 'Tormenta',
  jetskin_blue: 'Azul', jetskin_solar: 'Solar', jetskin_emerald: 'Esmeralda', jetskin_plasma: 'Plasma', jetskin_rainbow: 'Arcoíris'
});
