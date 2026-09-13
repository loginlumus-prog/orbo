/* =====================================================================
   Galáxia: 10 regiões × 10 fases (a 10ª é o chefe) + Singularidade (infinito).
   As 100 fases são GERADAS por função determinística a partir das curvas de
   cada região (HR.REGIONS[i]) — ajuste as curvas, não 100 entradas.
   API: HR.Campaign (level, all, region, stars, isUnlocked, complete…)
   ===================================================================== */
window.HR = window.HR || {};

HR.MODES = ['endless', 'campaign', 'practice'];
HR.DIRS = ['right', 'top', 'left', 'bottom'];

// mech = mecânica principal (parâmetros gerados em gen()) · boss = chave em HR.BOSSES
// colors/shapes = fundo da região (substitui o tema equipado durante a fase)
HR.REGIONS = [
  { id: 'berco', gal: 'magellan',      n: 1,  accent: '#4cf0ff', colors: ['#16305a', '#0d1a3a', '#070b1a'], shapes: 'orbs',    stars: true,  mech: 'basic',  boss: 'pulse',       music: 'r1',  reward: { skin: 'ice' }, fx: 'aurora' },
  { id: 'mare', gal: 'whirlpool',       n: 2,  accent: '#5aa9ff', colors: ['#0b3c5d', '#07253d', '#03111f'], shapes: 'waves',   stars: true,  mech: 'osc',    boss: 'tide',        music: 'r2',  reward: { theme: 'ocean' }, fx: 'water' },
  { id: 'jardim', gal: 'sunflower',     n: 3,  accent: '#7cff6b', colors: ['#0f3d2e', '#0a2620', '#04120e'], shapes: 'bubbles', stars: false, mech: 'swarm',  boss: 'swarm',       music: 'r3',  reward: { trail: 'stars' }, fx: 'garden' },
  { id: 'forja', gal: 'cigar',      n: 4,  accent: '#ff9f43', colors: ['#4a1d0c', '#2b1008', '#120604'], shapes: 'orbs',    stars: true,  mech: 'shrink', boss: 'shrink',      music: 'r4',  reward: { skin: 'lava' }, fx: 'ember' },
  { id: 'nevoa', gal: 'sombrero',      n: 5,  accent: '#a29bfe', colors: ['#2a2450', '#181538', '#0a0818'], shapes: 'nebula',  stars: true,  mech: 'fog',    boss: 'blink',       music: 'r5',  reward: { skin: 'ghost' }, fx: 'mist' },
  { id: 'cristal', gal: 'pinwheel',    n: 6,  accent: '#ff7ad9', colors: ['#4a1a48', '#2c1030', '#140818'], shapes: 'orbs',    stars: true,  mech: 'spin',   boss: 'spin',        music: 'r6',  reward: { theme: 'candy' }, fx: 'crystal' },
  { id: 'tempestade', gal: 'antennae', n: 7,  accent: '#ffd93d', colors: ['#3a3208', '#221d06', '#0f0d03'], shapes: 'grid',    stars: false, mech: 'storm',  boss: 'storm',       music: 'r7',  reward: { trail: 'fire' }, fx: 'storm' },
  { id: 'abismo', gal: 'blackeye',     n: 8,  accent: '#5b6cff', colors: ['#0a0f2a', '#05081a', '#000000'], shapes: 'nebula',  stars: true,  mech: 'dark',   boss: 'eclipse',     music: 'r8',  reward: { theme: 'space' }, fx: 'abyss' },
  { id: 'vortice', gal: 'cartwheel',    n: 9,  accent: '#ff5ecf', colors: ['#3d0d3a', '#240822', '#0f0410'], shapes: 'waves',   stars: true,  mech: 'vortex', boss: 'cyclone',     music: 'r9',  reward: { skin: 'galaxy' }, fx: 'vortex' },
  { id: 'horizonte', gal: 'andromeda',  n: 10, accent: '#ffcf4a', colors: ['#3a2c10', '#1f1808', '#0a0803'], shapes: 'orbs',    stars: true,  mech: 'hyper',  boss: 'singularity', music: 'r10', reward: { skin: 'eye' }, fx: 'horizon' }
];


HR.BOSSES = {
  pulse:       { icon: 'pulse',   waves: 3 }, // arcos expandem e contraem
  tide:        { icon: 'wave',    waves: 3 }, // ondas sincronizadas + rajadas
  swarm:       { icon: 'layers',  waves: 3 }, // enxame: arcos em pares e trios
  shrink:      { icon: 'target',  waves: 3 }, // arcos encolhem ao se aproximar
  blink:       { icon: 'eye',     waves: 3 }, // invisíveis até chegar perto
  spin:        { icon: 'refresh', waves: 3 }, // giram sem parar
  storm:       { icon: 'tornado', waves: 3 }, // direção a cada 4 arcos + rajadas
  eclipse:     { icon: 'moon',    waves: 3 }, // a luz pulsa; arcos somem em ciclos
  cyclone:     { icon: 'wind',    waves: 3 }, // direção a cada 3 arcos + oscilação
  singularity: { icon: 'orbit',   waves: 5 }  // uma onda por chefe anterior + tudo junto
};


/* ---------------- textos ---------------- */
Object.assign(HR.I18N.pt, {
  mode_endless: 'Infinito', mode_campaign: 'Galáxia', mode_practice: 'Treino',
  mode_endless_d: 'Sem fim. Farme pontos e moedas, suba no ranking.', mode_campaign_d: '10 regiões, 100 fases, 10 chefes.', mode_practice_d: 'Sem morte. Aprenda direções e habilidades.',
  region: 'Região', region_n: 'Região {n}', galaxy: 'Galáxia', singularity: 'Singularidade', singularity_d: 'O centro da galáxia. Vá até onde aguentar.', singularity_mastered: 'Singularidade dominada: +25 % moedas',
  reg_berco: 'Berço', reg_mare: 'Maré', reg_jardim: 'Jardim', reg_forja: 'Forja', reg_nevoa: 'Névoa', reg_cristal: 'Cristal', reg_tempestade: 'Tempestade', reg_abismo: 'Abismo', reg_vortice: 'Vórtice', reg_horizonte: 'Horizonte',
  reg_berco_t: 'Onde tudo começa', reg_mare_t: 'Os arcos sobem e descem', reg_jardim_t: 'Arcos em pares e trios', reg_forja_t: 'Menores e mais rápidos', reg_nevoa_t: 'Você só vê de perto',
  reg_cristal_t: 'Tudo gira', reg_tempestade_t: 'A direção não para', reg_abismo_t: 'A luz vai só até a bola', reg_vortice_t: 'Tudo ao mesmo tempo', reg_horizonte_t: 'A borda do buraco negro',
  reg_berco_d: 'Aprenda a flutuar. Na fase 7 os arcos passam a vir de cima.', reg_mare_d: 'Os arcos oscilam para cima e para baixo. Espere o momento certo.',
  reg_jardim_d: 'Arcos duplos e triplos aparecem colados. Mantenha a linha.', reg_forja_d: 'Os arcos encolhem enquanto se aproximam. Mire no centro cedo.',
  reg_nevoa_d: 'Uma névoa esconde os arcos até chegarem perto. Confie no ritmo.', reg_cristal_d: 'Os arcos giram e inclinam. Passe pelo eixo aberto.',
  reg_tempestade_d: 'A direção troca a cada poucos arcos e a velocidade vem em rajadas.', reg_abismo_d: 'Só se enxerga ao redor da bola. Os arcos saltam alto e baixo.',
  reg_vortice_d: 'Oscilação, rotação e trocas de direção — tudo junto.', reg_horizonte_d: 'Hipervelocidade e arcos mínimos. A última prova antes da Singularidade.',
  boss_pulse: 'Guardião Pulsante', boss_tide: 'Leviatã', boss_swarm: 'Colmeia', boss_shrink: 'Fornalha', boss_blink: 'Espectro', boss_spin: 'Prisma', boss_storm: 'Tempestade', boss_eclipse: 'Eclipse', boss_cyclone: 'Ciclone', boss_singularity: 'Singularidade',
  boss_pulse_d: 'Os arcos expandem e contraem. Entre no ritmo.', boss_tide_d: 'Todos os arcos sobem e descem juntos, com rajadas de velocidade.', boss_swarm_d: 'Um enxame: arcos em pares e trios, cada vez mais juntos.',
  boss_shrink_d: 'Os arcos encolhem quanto mais perto chegam. Decida cedo.', boss_blink_d: 'Os arcos só aparecem quando estão perto.', boss_spin_d: 'Os arcos giram sem parar. Passe pelo eixo aberto.',
  boss_storm_d: 'A direção muda a cada 4 arcos e a velocidade vem em rajadas.', boss_eclipse_d: 'A luz pulsa: os arcos somem e voltam em ciclos.', boss_cyclone_d: 'A direção muda a cada 3 arcos enquanto tudo oscila.',
  boss_singularity_d: 'Cinco ondas: pulso, invisibilidade, encolhimento, ciclone — e no fim, tudo junto no escuro.',
  level: 'Fase', level_n: 'Fase {n}', boss: 'CHEFE', wave: 'ONDA {n}', locked: 'Bloqueado', stars: 'Estrelas', rings_n: '{n} arcos',
  level_complete: 'FASE CONCLUÍDA', level_failed: 'FASE FALHOU', world_cleared: 'REGIÃO CONCLUÍDA!', next_level: 'PRÓXIMA FASE', retry: 'Repetir', levels: 'Fases',
  star_finish: 'Passar por 60 % dos arcos', star_perfects: '40 % de perfeitos', star_flawless: 'Sem dano, sem erros e todas as moedas', level_need: 'Passe por pelo menos {n} arcos ({p} de {t})', rewards: 'Recompensas', new_item: 'Novo item',
  direction_change: 'DIREÇÃO', dir_right: '←', dir_top: '↓', dir_left: '→', dir_bottom: '↑', practice_note: 'Treino: sem morte, metade das moedas, sem ranking.',
  life_lost: 'VIDA −1', second_chance_used: 'SEGUNDA CHANCE!', select_mode: 'Modo', play_mode: 'JOGAR', continue_campaign: 'Continuar: Fase {n}', world_progress: '{a}/{b} estrelas',
  region_locked_hint: 'Portal fechado. Abra primeiro o de {name}.', region_reward: 'Prêmio do chefe', region_music: 'Tema musical', region_mech: 'Mecânica', region_boss: 'Chefe da região',
  galaxy_sub: '{a}/{b} fases · {c} estrelas', tap_region: 'Toque numa região', enter_region: 'ENTRAR', play_endless: 'JOGAR INFINITO',
  gal_magellan: 'Nuvem de Magalhães', gal_whirlpool: 'Rodamoinho', gal_sunflower: 'Girassol', gal_cigar: 'Charuto', gal_sombrero: 'Sombrero', gal_pinwheel: 'Cata-vento', gal_antennae: 'Antenas', gal_blackeye: 'Olho Negro', gal_cartwheel: 'Roda de Carro', gal_andromeda: 'Andrômeda',
  gal_magellan_c: 'LMC', gal_whirlpool_c: 'M51', gal_sunflower_c: 'M63', gal_cigar_c: 'M82', gal_sombrero_c: 'M104', gal_pinwheel_c: 'M101', gal_antennae_c: 'NGC 4038', gal_blackeye_c: 'M64', gal_cartwheel_c: 'ESO 350-40', gal_andromeda_c: 'M31',
  gal_magellan_d: 'Galáxia-satélite da Via Láctea, berçário de estrelas visível a olho nu no céu do sul.', gal_whirlpool_d: 'Espiral clássica de braços em redemoinho, a 23 milhões de anos-luz.', gal_sunflower_d: 'Braços fofos como pétalas, cheios de aglomerados jovens.', gal_cigar_d: 'Galáxia em explosão de formação estelar: nasce 10 vezes mais estrelas que na Via Láctea.', gal_sombrero_d: 'Bojo brilhante e faixa de poeira escura, como uma aba de chapéu.', gal_pinwheel_d: 'Espiral gigante, quase o dobro da Via Láctea.', gal_antennae_d: 'Duas galáxias colidindo, com caudas de maré como antenas.', gal_blackeye_d: 'Faixa escura de poeira em frente ao núcleo: o "olho negro".', gal_cartwheel_d: 'Anel formado por uma galáxia que atravessou outra, como uma onda num lago.', gal_andromeda_d: 'A grande vizinha: 1 trilhão de estrelas, em rota de colisão com a Via Láctea.',
  bh_name: 'TON 618', bh_sub: 'Singularidade', bh_d: 'O maior buraco negro conhecido: cerca de 66 bilhões de vezes a massa do Sol, a 10 bilhões de anos-luz.', galaxy_n: 'Galáxia {n}'
});
Object.assign(HR.I18N.en, {
  mode_endless: 'Endless', mode_campaign: 'Galaxy', mode_practice: 'Practice',
  mode_endless_d: 'No end. Farm score and coins, climb the ranking.', mode_campaign_d: '10 regions, 100 levels, 10 bosses.', mode_practice_d: 'No death. Learn directions and abilities.',
  region: 'Region', region_n: 'Region {n}', galaxy: 'Galaxy', singularity: 'Singularity', singularity_d: 'The galactic core. Go as far as you can.', singularity_mastered: 'Singularity mastered: +25% coins',
  reg_berco: 'Cradle', reg_mare: 'Tide', reg_jardim: 'Garden', reg_forja: 'Forge', reg_nevoa: 'Mist', reg_cristal: 'Crystal', reg_tempestade: 'Storm', reg_abismo: 'Abyss', reg_vortice: 'Vortex', reg_horizonte: 'Horizon',
  reg_berco_t: 'Where it all begins', reg_mare_t: 'Rings rise and fall', reg_jardim_t: 'Rings in pairs and triples', reg_forja_t: 'Smaller and faster', reg_nevoa_t: 'You only see up close',
  reg_cristal_t: 'Everything spins', reg_tempestade_t: 'Direction never rests', reg_abismo_t: 'Light reaches only the ball', reg_vortice_t: 'All at once', reg_horizonte_t: 'The edge of the black hole',
  reg_berco_d: 'Learn to float. From level 7 the rings come from the top.', reg_mare_d: 'Rings swing up and down. Wait for the right moment.',
  reg_jardim_d: 'Double and triple rings appear back to back. Hold your line.', reg_forja_d: 'Rings shrink as they approach. Aim at the center early.',
  reg_nevoa_d: 'A mist hides the rings until they are close. Trust the rhythm.', reg_cristal_d: 'Rings spin and tilt. Pass through the open axis.',
  reg_tempestade_d: 'Direction changes every few rings and speed comes in bursts.', reg_abismo_d: 'You only see around the ball. Rings jump high and low.',
  reg_vortice_d: 'Oscillation, rotation and direction changes — all together.', reg_horizonte_d: 'Hyper speed and minimal rings. The last trial before the Singularity.',
  boss_pulse: 'Pulsing Guardian', boss_tide: 'Leviathan', boss_swarm: 'Hive', boss_shrink: 'Furnace', boss_blink: 'Specter', boss_spin: 'Prism', boss_storm: 'Storm', boss_eclipse: 'Eclipse', boss_cyclone: 'Cyclone', boss_singularity: 'Singularity',
  boss_pulse_d: 'Rings expand and contract. Find the rhythm.', boss_tide_d: 'Every ring rises and falls together, with speed bursts.', boss_swarm_d: 'A hive: rings in pairs and triples, closer every wave.',
  boss_shrink_d: 'Rings shrink the closer they get. Decide early.', boss_blink_d: 'Rings only appear when close.', boss_spin_d: 'Rings spin without rest. Pass through the open axis.',
  boss_storm_d: 'Direction changes every 4 rings and speed comes in bursts.', boss_eclipse_d: 'The light pulses: rings vanish and return in cycles.', boss_cyclone_d: 'Direction changes every 3 rings while everything swings.',
  boss_singularity_d: 'Five waves: pulse, invisibility, shrinking, cyclone — and finally everything at once in the dark.',
  level: 'Level', level_n: 'Level {n}', boss: 'BOSS', wave: 'WAVE {n}', locked: 'Locked', stars: 'Stars', rings_n: '{n} rings',
  level_complete: 'LEVEL COMPLETE', level_failed: 'LEVEL FAILED', world_cleared: 'REGION CLEARED!', next_level: 'NEXT LEVEL', retry: 'Retry', levels: 'Levels',
  star_finish: 'Pass 60% of the rings', star_perfects: '40% perfects', star_flawless: 'No damage, no misses and all coins', level_need: 'Pass at least {n} rings ({p} of {t})', rewards: 'Rewards', new_item: 'New item',
  direction_change: 'DIRECTION', dir_right: '←', dir_top: '↓', dir_left: '→', dir_bottom: '↑', practice_note: 'Practice: no death, half coins, no ranking.',
  life_lost: 'LIFE −1', second_chance_used: 'SECOND CHANCE!', select_mode: 'Mode', play_mode: 'PLAY', continue_campaign: 'Continue: Level {n}', world_progress: '{a}/{b} stars',
  region_locked_hint: 'Portal closed. Open the one for {name} first.', region_reward: 'Boss reward', region_music: 'Music theme', region_mech: 'Mechanic', region_boss: 'Region boss',
  galaxy_sub: '{a}/{b} levels · {c} stars', tap_region: 'Tap a region', enter_region: 'ENTER', play_endless: 'PLAY ENDLESS',
  gal_magellan: 'Magellanic Cloud', gal_whirlpool: 'Whirlpool', gal_sunflower: 'Sunflower', gal_cigar: 'Cigar', gal_sombrero: 'Sombrero', gal_pinwheel: 'Pinwheel', gal_antennae: 'Antennae', gal_blackeye: 'Black Eye', gal_cartwheel: 'Cartwheel', gal_andromeda: 'Andromeda',
  gal_magellan_c: 'LMC', gal_whirlpool_c: 'M51', gal_sunflower_c: 'M63', gal_cigar_c: 'M82', gal_sombrero_c: 'M104', gal_pinwheel_c: 'M101', gal_antennae_c: 'NGC 4038', gal_blackeye_c: 'M64', gal_cartwheel_c: 'ESO 350-40', gal_andromeda_c: 'M31',
  gal_magellan_d: 'Satellite of the Milky Way, a star nursery visible to the naked eye in the southern sky.', gal_whirlpool_d: 'The classic spiral with whirlpool arms, 23 million light-years away.', gal_sunflower_d: 'Fluffy arms like petals, full of young clusters.', gal_cigar_d: 'A starburst galaxy: stars are born 10 times faster than in the Milky Way.', gal_sombrero_d: 'Bright bulge and a dark dust lane, like a hat brim.', gal_pinwheel_d: 'A giant spiral, almost twice the size of the Milky Way.', gal_antennae_d: 'Two galaxies colliding, with tidal tails like antennae.', gal_blackeye_d: 'A dark dust band in front of the core: the "black eye".', gal_cartwheel_d: 'A ring made when one galaxy passed through another, like a ripple in a pond.', gal_andromeda_d: 'The big neighbor: a trillion stars, on a collision course with the Milky Way.',
  bh_name: 'TON 618', bh_sub: 'Singularity', bh_d: 'The most massive black hole known: about 66 billion Suns, 10 billion light-years away.', galaxy_n: 'Galaxy {n}'
});
Object.assign(HR.I18N.es, {
  mode_endless: 'Infinito', mode_campaign: 'Galaxia', mode_practice: 'Práctica',
  mode_endless_d: 'Sin fin. Farmea puntos y monedas, sube en el ranking.', mode_campaign_d: '10 regiones, 100 niveles, 10 jefes.', mode_practice_d: 'Sin muerte. Aprende direcciones y habilidades.',
  region: 'Región', region_n: 'Región {n}', galaxy: 'Galaxia', singularity: 'Singularidad', singularity_d: 'El centro de la galaxia. Llega hasta donde aguantes.', singularity_mastered: 'Singularidad dominada: +25 % monedas',
  reg_berco: 'Cuna', reg_mare: 'Marea', reg_jardim: 'Jardín', reg_forja: 'Forja', reg_nevoa: 'Niebla', reg_cristal: 'Cristal', reg_tempestade: 'Tormenta', reg_abismo: 'Abismo', reg_vortice: 'Vórtice', reg_horizonte: 'Horizonte',
  reg_berco_t: 'Donde todo empieza', reg_mare_t: 'Los aros suben y bajan', reg_jardim_t: 'Aros en pares y tríos', reg_forja_t: 'Más pequeños y rápidos', reg_nevoa_t: 'Solo ves de cerca',
  reg_cristal_t: 'Todo gira', reg_tempestade_t: 'La dirección no para', reg_abismo_t: 'La luz llega solo a la bola', reg_vortice_t: 'Todo a la vez', reg_horizonte_t: 'El borde del agujero negro',
  reg_berco_d: 'Aprende a flotar. Desde el nivel 7 los aros vienen de arriba.', reg_mare_d: 'Los aros oscilan arriba y abajo. Espera el momento justo.',
  reg_jardim_d: 'Aros dobles y triples aparecen pegados. Mantén la línea.', reg_forja_d: 'Los aros encogen al acercarse. Apunta al centro pronto.',
  reg_nevoa_d: 'Una niebla esconde los aros hasta que están cerca. Confía en el ritmo.', reg_cristal_d: 'Los aros giran e inclinan. Pasa por el eje abierto.',
  reg_tempestade_d: 'La dirección cambia cada pocos aros y la velocidad viene en ráfagas.', reg_abismo_d: 'Solo se ve alrededor de la bola. Los aros saltan alto y bajo.',
  reg_vortice_d: 'Oscilación, rotación y cambios de dirección, todo junto.', reg_horizonte_d: 'Hipervelocidad y aros mínimos. La última prueba antes de la Singularidad.',
  boss_pulse: 'Guardián Pulsante', boss_tide: 'Leviatán', boss_swarm: 'Colmena', boss_shrink: 'Horno', boss_blink: 'Espectro', boss_spin: 'Prisma', boss_storm: 'Tormenta', boss_eclipse: 'Eclipse', boss_cyclone: 'Ciclón', boss_singularity: 'Singularidad',
  boss_pulse_d: 'Los aros se expanden y contraen. Sigue el ritmo.', boss_tide_d: 'Todos los aros suben y bajan juntos, con ráfagas de velocidad.', boss_swarm_d: 'Una colmena: aros en pares y tríos, cada vez más juntos.',
  boss_shrink_d: 'Los aros encogen cuanto más cerca están. Decide pronto.', boss_blink_d: 'Los aros solo aparecen cuando están cerca.', boss_spin_d: 'Los aros giran sin parar. Pasa por el eje abierto.',
  boss_storm_d: 'La dirección cambia cada 4 aros y la velocidad viene en ráfagas.', boss_eclipse_d: 'La luz late: los aros desaparecen y vuelven en ciclos.', boss_cyclone_d: 'La dirección cambia cada 3 aros mientras todo oscila.',
  boss_singularity_d: 'Cinco olas: pulso, invisibilidad, encogimiento, ciclón, y al final todo junto a oscuras.',
  level: 'Nivel', level_n: 'Nivel {n}', boss: 'JEFE', wave: 'OLA {n}', locked: 'Bloqueado', stars: 'Estrellas', rings_n: '{n} aros',
  level_complete: 'NIVEL COMPLETADO', level_failed: 'NIVEL FALLIDO', world_cleared: '¡REGIÓN COMPLETADA!', next_level: 'SIGUIENTE NIVEL', retry: 'Repetir', levels: 'Niveles',
  star_finish: 'Pasar el 60 % de los aros', star_perfects: '40 % de perfectos', star_flawless: 'Sin daño, sin fallos y todas las monedas', level_need: 'Pasa al menos {n} aros ({p} de {t})', rewards: 'Recompensas', new_item: 'Nuevo objeto',
  direction_change: 'DIRECCIÓN', dir_right: '←', dir_top: '↓', dir_left: '→', dir_bottom: '↑', practice_note: 'Práctica: sin muerte, mitad de monedas, sin ranking.',
  life_lost: 'VIDA −1', second_chance_used: '¡SEGUNDA OPORTUNIDAD!', select_mode: 'Modo', play_mode: 'JUGAR', continue_campaign: 'Continuar: Nivel {n}', world_progress: '{a}/{b} estrellas',
  region_locked_hint: 'Portal cerrado. Abre primero el de {name}.', region_reward: 'Premio del jefe', region_music: 'Tema musical', region_mech: 'Mecánica', region_boss: 'Jefe de la región',
  galaxy_sub: '{a}/{b} niveles · {c} estrellas', tap_region: 'Toca una región', enter_region: 'ENTRAR', play_endless: 'JUGAR INFINITO',
  gal_magellan: 'Nube de Magallanes', gal_whirlpool: 'Remolino', gal_sunflower: 'Girasol', gal_cigar: 'Cigarro', gal_sombrero: 'Sombrero', gal_pinwheel: 'Molinete', gal_antennae: 'Antenas', gal_blackeye: 'Ojo Negro', gal_cartwheel: 'Rueda de Carro', gal_andromeda: 'Andrómeda',
  gal_magellan_c: 'LMC', gal_whirlpool_c: 'M51', gal_sunflower_c: 'M63', gal_cigar_c: 'M82', gal_sombrero_c: 'M104', gal_pinwheel_c: 'M101', gal_antennae_c: 'NGC 4038', gal_blackeye_c: 'M64', gal_cartwheel_c: 'ESO 350-40', gal_andromeda_c: 'M31',
  gal_magellan_d: 'Satélite de la Vía Láctea, un vivero de estrellas visible a simple vista en el cielo austral.', gal_whirlpool_d: 'La espiral clásica de brazos en remolino, a 23 millones de años luz.', gal_sunflower_d: 'Brazos esponjosos como pétalos, llenos de cúmulos jóvenes.', gal_cigar_d: 'Galaxia con brote estelar: nacen 10 veces más estrellas que en la Vía Láctea.', gal_sombrero_d: 'Bulbo brillante y franja de polvo oscuro, como el ala de un sombrero.', gal_pinwheel_d: 'Espiral gigante, casi el doble de la Vía Láctea.', gal_antennae_d: 'Dos galaxias chocando, con colas de marea como antenas.', gal_blackeye_d: 'Una franja oscura de polvo frente al núcleo: el "ojo negro".', gal_cartwheel_d: 'Un anillo formado cuando una galaxia atravesó otra, como una onda en un lago.', gal_andromeda_d: 'La gran vecina: un billón de estrellas, en rumbo de colisión con la Vía Láctea.',
  bh_name: 'TON 618', bh_sub: 'Singularidad', bh_d: 'El agujero negro más masivo conocido: unas 66 mil millones de masas solares, a 10 mil millones de años luz.', galaxy_n: 'Galaxia {n}'
});
