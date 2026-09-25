/* =====================================================================
   ORBO v6.0: mais variedade na loja.
   +12 bolas, +10 temas, +4 rastros (com desenho próprio) e +10 visuais de
   Égide e Jato. Nada aqui mexe em jogabilidade: é só o que se vê.
   ===================================================================== */
(function () {
  const C = HR.CONFIG, R = HR.Render;
  const price = (item, table) => { const P = table[item.rar] || table.rare; item.cur = 'coins'; item.price = P[0]; item.gems = P[1]; };

  /* ---------------- bolas ---------------- */
  const SK = [
    // luas e mundos que faltavam
    ['callisto', 'planets', 'rare', 12, '#7d7268', '#2a231c', '#c4b6a4', { pattern: 'planet', pl: 'ganymede' }],
    ['triton', 'planets', 'rare', 14, '#e8d6e2', '#8a6f86', '#ffd9f2', { pattern: 'planet', pl: 'europa' }],
    ['vesta', 'planets', 'common', 7, '#b9a68c', '#4a3d2c', '#e4d6bc', { pattern: 'planet', pl: 'mercury' }],
    ['eris', 'planets', 'epic', 20, '#eef2f6', '#9aa6b8', '#ffffff', { pattern: 'planet', pl: 'ceres' }],
    // gemas novas
    ['jade', 'gems', 'rare', 9, '#4fd9a4', '#0d5a3e', '#8affd0', { pattern: 'facets' }],
    ['amber', 'gems', 'common', 5, '#ffb347', '#8a4a0a', '#ffd88a', { pattern: 'facets' }],
    ['garnet', 'gems', 'epic', 18, '#b2264a', '#4a0a18', '#ff6f8a', { pattern: 'facets', facet: '#ff9ab0' }],
    // bichos
    ['fox', 'creatures', 'rare', 11, '#ff9a4a', '#8a3a0a', '#ffc48a', { pattern: 'face', fc: 'cat', decor: 'ears', ears: 'tufts', earColor: '#c25a14' }],
    ['bear', 'creatures', 'rare', 12, '#a8794a', '#4a2a12', '#d8b48a', { pattern: 'face', fc: 'panda', decor: 'ears', ears: 'round', earColor: '#6b4424' }],
    // elementos
    ['sand', 'elements', 'common', 4, '#e0c48a', '#8a6a2a', '#ffe7b0', { pattern: 'element', el: 'rock' }],
    ['magma', 'elements', 'epic', 17, '#ff5a2b', '#5a0a04', '#ffb347', { pattern: 'element', el: 'fire' }],
    // doce
    ['mint', 'sweets', 'rare', 10, '#bff7dd', '#3a8a6a', '#e6fff4', { pattern: 'candy' }]
  ];
  SK.forEach(([id, col, rar, lvl, base, dark, glow, extra]) => {
    if (C.SKINS.some(s => s.id === id)) return;
    const s = Object.assign({ id, col, rar, lvl, base, dark, glow, pattern: 'none' }, extra);
    price(s, HR.SKIN_PRICE); C.SKINS.push(s);
  });

  /* ---------------- temas ---------------- */
  const TH = [
    { id: 'mirage', rar: 'common', lvl: 4, colors: ['#5a2a1a', '#c07a3a', '#ffd9a0'], shapes: 'orbs', stars: false, fx: 'dust', scene: 'desert', sceneOpts: {} },
    { id: 'glacier', rar: 'rare', lvl: 7, colors: ['#123a52', '#0a2030', '#04101a'], shapes: 'orbs', stars: true, fx: 'snow', scene: 'arctic', sceneOpts: {} },
    { id: 'reefnight', rar: 'rare', lvl: 9, colors: ['#06283a', '#041c2a', '#020c14'], shapes: 'waves', stars: true, fx: 'mist', scene: 'reef', sceneOpts: { deep: true } },
    { id: 'skyline', rar: 'rare', lvl: 11, colors: ['#2a1a4a', '#4a2a6a', '#ff8a5a'], shapes: 'orbs', stars: false, fx: null, scene: 'city', sceneOpts: { lights: '#ffd98a', neon: '#ff7ad9' } },
    { id: 'oasis', rar: 'rare', lvl: 12, colors: ['#173a2a', '#2a5a3a', '#d9c98a'], shapes: 'bubbles', stars: false, fx: 'wind', scene: 'savanna', sceneOpts: {} },
    { id: 'ashfall', rar: 'epic', lvl: 13, colors: ['#2a1410', '#4a1c10', '#120806'], shapes: 'orbs', stars: false, fx: 'ember', scene: 'volcano', sceneOpts: {} },
    { id: 'lanterns', rar: 'epic', lvl: 15, colors: ['#2a1030', '#5a1a3a', '#ff9a5a'], shapes: 'orbs', stars: true, fx: 'fireflies', scene: 'temple', sceneOpts: {} },
    { id: 'nightmarket', rar: 'epic', lvl: 17, colors: ['#1a0a2a', '#3a0a3a', '#5a0a2a'], shapes: 'grid', stars: false, fx: null, scene: 'arcade', sceneOpts: {} },
    { id: 'stormcoast', rar: 'epic', lvl: 19, colors: ['#0a1424', '#08101c', '#03070e'], shapes: 'waves', stars: false, fx: 'rain', scene: 'harbor', sceneOpts: {} },
    { id: 'firstlight', rar: 'legendary', lvl: 24, colors: ['#3a2a5a', '#a85a6a', '#ffd9a8'], shapes: 'orbs', stars: true, fx: 'wind', scene: 'mountains', sceneOpts: { sun: '#ffd6a8' } }
  ];
  TH.forEach(t => { if (C.THEMES.some(x => x.id === t.id)) return; price(t, HR.THEME_PRICE); C.THEMES.push(t); });

  /* ---------------- rastros novos (desenho próprio) ---------------- */
  const T = R.TRAILS, U = () => HR.U;
  if (T) {
    // bolhas de sabão que sobem
    T.soap = (ctx, pts, sk, t, heat) => {
      const u = U(), n = pts.length;
      for (let i = 0; i < n; i += 2) {
        const k = i / n, p = pts[i], s = (2 + k * 7) * (1 + heat * 0.5), rise = (1 - k) * 14;
        ctx.strokeStyle = u.rgba(sk.glow, Math.min(1, k * 0.7)); ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(p.x + Math.sin(t * 3 + i) * 3, p.y - rise, s, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = u.rgba('#ffffff', Math.min(1, k * 0.5));
        ctx.beginPath(); ctx.arc(p.x - s * 0.3 + Math.sin(t * 3 + i) * 3, p.y - rise - s * 0.3, s * 0.22, 0, Math.PI * 2); ctx.fill();
      }
    };
    // fita dupla que cruza (dois fios trançados)
    T.braid = (ctx, pts, sk, t, heat) => {
      const u = U(), n = pts.length, wm = 1 + heat * 0.6;
      [0, Math.PI].forEach((ph, j) => {
        ctx.strokeStyle = u.rgba(j ? sk.glow : (sk.dark || sk.base), 0.85); ctx.lineWidth = 3 * wm;
        ctx.beginPath();
        for (let i = 0; i < n; i++) {
          const k = i / n, p = pts[i], nn = { x: -(pts[Math.min(n - 1, i + 1)].y - p.y), y: pts[Math.min(n - 1, i + 1)].x - p.x };
          const l = Math.hypot(nn.x, nn.y) || 1, w = Math.sin(i * 0.45 - t * 6 + ph) * (3 + k * 9) * wm;
          const x = p.x + nn.x / l * w, y = p.y + nn.y / l * w;
          if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.stroke();
      });
    };
    // rastro de cinzas com brasas
    T.embers = (ctx, pts, sk, t, heat) => {
      const u = U(), n = pts.length;
      for (let i = 0; i < n; i++) {
        const k = i / n, p = pts[i], s = (1.6 + k * 4) * (1 + heat * 0.7);
        const hot = (i % 3 === 0);
        ctx.fillStyle = u.rgba(hot ? sk.glow : '#6b6157', Math.min(1, k * (hot ? 0.95 : 0.55)));
        ctx.beginPath(); ctx.arc(p.x + Math.sin(t * 4 + i) * 2, p.y - (1 - k) * 10 + Math.cos(t * 3 + i) * 2, s, 0, Math.PI * 2); ctx.fill();
      }
    };
    // ondas de sonar que se abrem para trás
    T.sonar = (ctx, pts, sk, t, heat) => {
      const u = U(), n = pts.length;
      // as ondas abrem PARA TRAS (antes abriam para a frente, contra o movimento)
      for (let i = 2; i < n; i += 3) {
        const k = i / n, p = pts[i], rr = (6 + (1 - k) * 30) * (1 + heat * 0.4);
        ctx.strokeStyle = u.rgba(sk.glow, Math.min(1, 0.18 + k * 0.7)); ctx.lineWidth = 1.2 + 2 * k;
        ctx.beginPath(); ctx.arc(p.x, p.y, rr, Math.PI - 0.95, Math.PI + 0.95); ctx.stroke();
      }
    };
  }
  const TR = [['soap', 'rare', 9], ['braid', 'epic', 15], ['embers', 'epic', 21], ['sonar', 'legendary', 27]];
  TR.forEach(([id, rar, lvl]) => { if (C.TRAILS.some(x => x.id === id)) return; const o = { id, rar, lvl }; price(o, HR.TRAIL_PRICE); C.TRAILS.push(o); });

  /* ---------------- Égide e Jato: mais cores ---------------- */
  const G = HR.GEAR;
  const AE = [
    { id: 'coral', rar: 'rare', color: '#ff7a5a', color2: '#ffd6c4', style: 'bubble' },
    { id: 'mintshield', rar: 'rare', color: '#5cffc4', color2: '#d8fff0', style: 'ripple' },
    { id: 'goldleaf', rar: 'epic', color: '#ffcf4a', color2: '#fff3c8', style: 'leaves' },
    { id: 'violetcircuit', rar: 'epic', color: '#b48cff', color2: '#efe4ff', style: 'circuit' },
    { id: 'rosewindow', rar: 'epic', color: '#ff7ad9', color2: '#ffd9f2', style: 'stained' },
    { id: 'deepsonar', rar: 'legendary', color: '#4cc9ff', color2: '#e0f7ff', style: 'sonar' }
  ];
  AE.forEach(a => { if (G.aegisSkins.some(x => x.id === a.id)) return; price(a, HR.GEAR_PRICE); G.aegisSkins.push(a); });
  const JT = [
    { id: 'violet', rar: 'rare', color: '#b48cff', color2: '#efe4ff' },
    { id: 'mintjet', rar: 'rare', color: '#5cffc4', color2: '#d8fff0' },
    { id: 'sunset', rar: 'epic', color: '#ff7a5a', color2: '#ffd6a8' },
    { id: 'ghostjet', rar: 'epic', color: '#dfe8ff', color2: '#ffffff' }
  ];
  JT.forEach(j => { if (G.jetSkins.some(x => x.id === j.id)) return; price(j, HR.GEAR_PRICE); G.jetSkins.push(j); });

  /* ---------------- nomes ---------------- */
  Object.assign(HR.I18N.pt, {
    skin_callisto: 'Calisto', skin_triton: 'Tritão', skin_vesta: 'Vesta', skin_eris: 'Éris',
    skin_jade: 'Jade', skin_amber: 'Âmbar', skin_garnet: 'Granada', skin_fox: 'Raposa', skin_bear: 'Urso',
    skin_sand: 'Areia', skin_magma: 'Magma', skin_mint: 'Menta',
    flavor_skin_callisto: 'A lua mais marcada de crateras.', flavor_skin_triton: 'Gelo rosado que anda ao contrário.',
    flavor_skin_vesta: 'Um asteroide grande demais para ser só pedra.', flavor_skin_eris: 'Branca e distante, ela mudou a conta dos planetas.',
    flavor_skin_jade: 'Verde de água parada.', flavor_skin_amber: 'Resina antiga com sol dentro.', flavor_skin_garnet: 'Vermelho fundo, quase roxo.',
    flavor_skin_fox: 'Esperta e do tamanho certo.', flavor_skin_bear: 'Calma até deixar de ser.',
    flavor_skin_sand: 'Grão por grão, também é montanha.', flavor_skin_magma: 'Pedra que ainda não esfriou.', flavor_skin_mint: 'Gelada por fora, doce por dentro.',
    theme_mirage: 'Miragem', theme_glacier: 'Geleira', theme_reefnight: 'Recife Noturno', theme_skyline: 'Horizonte Urbano', theme_oasis: 'Oásis',
    theme_ashfall: 'Chuva de Cinzas', theme_lanterns: 'Lanternas', theme_nightmarket: 'Feira Noturna', theme_stormcoast: 'Costa da Tempestade', theme_firstlight: 'Primeira Luz',
    flavor_theme_mirage: 'Areia quente e o que ela promete ao longe.', flavor_theme_glacier: 'Azul de gelo antigo.',
    flavor_theme_reefnight: 'O recife quando as luzes se apagam.', flavor_theme_skyline: 'A cidade entre o dia e a noite.',
    flavor_theme_oasis: 'Verde no meio do seco.', flavor_theme_ashfall: 'O vulcão respira devagar.',
    flavor_theme_lanterns: 'Papel, fogo pequeno e silêncio.', flavor_theme_nightmarket: 'Barulho, luz e gente.',
    flavor_theme_stormcoast: 'Chuva no porto, barco amarrado.', flavor_theme_firstlight: 'O primeiro sol nas montanhas.',
    trail_soap: 'Bolhas de Sabão', trail_braid: 'Trança', trail_embers: 'Brasas', trail_sonar: 'Sonar',
    flavor_trail_soap: 'Sobem e estouram sozinhas.', flavor_trail_braid: 'Dois fios que se cruzam sem parar.',
    flavor_trail_embers: 'Cinza que ainda tem fogo.', flavor_trail_sonar: 'Ondas que dizem onde você passou.',
    aegisskin_coral: 'Coral', aegisskin_mintshield: 'Menta', aegisskin_goldleaf: 'Folha de Ouro', aegisskin_violetcircuit: 'Circuito Violeta', aegisskin_rosewindow: 'Rosácea', aegisskin_deepsonar: 'Sonar Profundo',
    jetskin_violet: 'Violeta', jetskin_mintjet: 'Menta', jetskin_sunset: 'Pôr do Sol', jetskin_ghostjet: 'Fantasma'
  });
  Object.assign(HR.I18N.en, {
    skin_callisto: 'Callisto', skin_triton: 'Triton', skin_vesta: 'Vesta', skin_eris: 'Eris',
    skin_jade: 'Jade', skin_amber: 'Amber', skin_garnet: 'Garnet', skin_fox: 'Fox', skin_bear: 'Bear',
    skin_sand: 'Sand', skin_magma: 'Magma', skin_mint: 'Mint',
    flavor_skin_callisto: 'The most cratered moon of all.', flavor_skin_triton: 'Pink ice that orbits backwards.',
    flavor_skin_vesta: 'An asteroid too big to be just a rock.', flavor_skin_eris: 'White and far away, it changed the planet count.',
    flavor_skin_jade: 'Green as still water.', flavor_skin_amber: 'Old resin with sunlight inside.', flavor_skin_garnet: 'Deep red, almost purple.',
    flavor_skin_fox: 'Clever, and exactly the right size.', flavor_skin_bear: 'Calm until it is not.',
    flavor_skin_sand: 'Grain by grain, it is also a mountain.', flavor_skin_magma: 'Rock that has not cooled yet.', flavor_skin_mint: 'Cold outside, sweet inside.',
    theme_mirage: 'Mirage', theme_glacier: 'Glacier', theme_reefnight: 'Night Reef', theme_skyline: 'Skyline', theme_oasis: 'Oasis',
    theme_ashfall: 'Ashfall', theme_lanterns: 'Lanterns', theme_nightmarket: 'Night Market', theme_stormcoast: 'Storm Coast', theme_firstlight: 'First Light',
    flavor_theme_mirage: 'Hot sand and what it promises far away.', flavor_theme_glacier: 'The blue of old ice.',
    flavor_theme_reefnight: 'The reef once the lights go out.', flavor_theme_skyline: 'The city between day and night.',
    flavor_theme_oasis: 'Green in the middle of dry.', flavor_theme_ashfall: 'The volcano breathes slowly.',
    flavor_theme_lanterns: 'Paper, small fire and silence.', flavor_theme_nightmarket: 'Noise, light and people.',
    flavor_theme_stormcoast: 'Rain on the harbour, boat tied up.', flavor_theme_firstlight: 'First sun on the mountains.',
    trail_soap: 'Soap Bubbles', trail_braid: 'Braid', trail_embers: 'Embers', trail_sonar: 'Sonar',
    flavor_trail_soap: 'They rise and pop on their own.', flavor_trail_braid: 'Two threads crossing without stopping.',
    flavor_trail_embers: 'Ash that still holds fire.', flavor_trail_sonar: 'Waves that say where you passed.',
    aegisskin_coral: 'Coral', aegisskin_mintshield: 'Mint', aegisskin_goldleaf: 'Gold Leaf', aegisskin_violetcircuit: 'Violet Circuit', aegisskin_rosewindow: 'Rose Window', aegisskin_deepsonar: 'Deep Sonar',
    jetskin_violet: 'Violet', jetskin_mintjet: 'Mint', jetskin_sunset: 'Sunset', jetskin_ghostjet: 'Ghost'
  });
  Object.assign(HR.I18N.es, {
    skin_callisto: 'Calisto', skin_triton: 'Tritón', skin_vesta: 'Vesta', skin_eris: 'Eris',
    skin_jade: 'Jade', skin_amber: 'Ámbar', skin_garnet: 'Granate', skin_fox: 'Zorro', skin_bear: 'Oso',
    skin_sand: 'Arena', skin_magma: 'Magma', skin_mint: 'Menta',
    flavor_skin_callisto: 'La luna con más cráteres de todas.', flavor_skin_triton: 'Hielo rosado que gira al revés.',
    flavor_skin_vesta: 'Un asteroide demasiado grande para ser solo piedra.', flavor_skin_eris: 'Blanca y lejana, cambió la cuenta de los planetas.',
    flavor_skin_jade: 'Verde de agua quieta.', flavor_skin_amber: 'Resina antigua con sol dentro.', flavor_skin_garnet: 'Rojo hondo, casi morado.',
    flavor_skin_fox: 'Lista y del tamaño justo.', flavor_skin_bear: 'Tranquilo hasta que deja de serlo.',
    flavor_skin_sand: 'Grano a grano también es montaña.', flavor_skin_magma: 'Piedra que aún no se enfrió.', flavor_skin_mint: 'Fría por fuera, dulce por dentro.',
    theme_mirage: 'Espejismo', theme_glacier: 'Glaciar', theme_reefnight: 'Arrecife Nocturno', theme_skyline: 'Horizonte Urbano', theme_oasis: 'Oasis',
    theme_ashfall: 'Lluvia de Ceniza', theme_lanterns: 'Farolillos', theme_nightmarket: 'Feria Nocturna', theme_stormcoast: 'Costa de la Tormenta', theme_firstlight: 'Primera Luz',
    flavor_theme_mirage: 'Arena caliente y lo que promete a lo lejos.', flavor_theme_glacier: 'El azul del hielo antiguo.',
    flavor_theme_reefnight: 'El arrecife cuando se apagan las luces.', flavor_theme_skyline: 'La ciudad entre el día y la noche.',
    flavor_theme_oasis: 'Verde en medio de lo seco.', flavor_theme_ashfall: 'El volcán respira despacio.',
    flavor_theme_lanterns: 'Papel, fuego pequeño y silencio.', flavor_theme_nightmarket: 'Ruido, luz y gente.',
    flavor_theme_stormcoast: 'Lluvia en el puerto, barco amarrado.', flavor_theme_firstlight: 'El primer sol en las montañas.',
    trail_soap: 'Burbujas de Jabón', trail_braid: 'Trenza', trail_embers: 'Brasas', trail_sonar: 'Sonar',
    flavor_trail_soap: 'Suben y estallan solas.', flavor_trail_braid: 'Dos hilos que se cruzan sin parar.',
    flavor_trail_embers: 'Ceniza que todavía tiene fuego.', flavor_trail_sonar: 'Ondas que dicen por dónde pasaste.',
    aegisskin_coral: 'Coral', aegisskin_mintshield: 'Menta', aegisskin_goldleaf: 'Hoja de Oro', aegisskin_violetcircuit: 'Circuito Violeta', aegisskin_rosewindow: 'Rosetón', aegisskin_deepsonar: 'Sonar Profundo',
    jetskin_violet: 'Violeta', jetskin_mintjet: 'Menta', jetskin_sunset: 'Atardecer', jetskin_ghostjet: 'Fantasma'
  });
})();
