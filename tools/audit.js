/* =====================================================================
   Revisao completa do ORBO (ferramenta de desenvolvimento).
   Nao e carregado pelo jogo. Para rodar, no console do jogo:
     const s=document.createElement("script"); s.src="/tools/audit.js"; document.head.appendChild(s);
     await __audit();
   Devolve { erros, avisos, resumo }.
   ===================================================================== */
// Revisão completa: roda dentro do jogo e devolve uma lista de problemas.
window.__audit = async function () {
  const bad = [], warn = [], C = HR.CONFIG;
  const has = (k) => HR.I18N.pt[k] != null;
  const T = (k) => HR.t(k) !== k;

  /* ---------- 1. idiomas ---------- */
  const pt = Object.keys(HR.I18N.pt), en = Object.keys(HR.I18N.en), es = Object.keys(HR.I18N.es);
  const faltaEn = pt.filter(k => HR.I18N.en[k] == null), faltaEs = pt.filter(k => HR.I18N.es[k] == null);
  if (faltaEn.length) bad.push('i18n EN sem ' + faltaEn.length + ' chaves: ' + faltaEn.slice(0, 6).join(', '));
  if (faltaEs.length) bad.push('i18n ES sem ' + faltaEs.length + ' chaves: ' + faltaEs.slice(0, 6).join(', '));
  const sobraEn = en.filter(k => HR.I18N.pt[k] == null);
  if (sobraEn.length) warn.push('EN tem ' + sobraEn.length + ' chaves que o PT não tem');

  /* ---------- 2. cosméticos ---------- */
  const ids = {};
  C.SKINS.forEach(s => {
    if (ids['sk' + s.id]) bad.push('bola repetida: ' + s.id); ids['sk' + s.id] = 1;
    if (!T('skin_' + s.id)) bad.push('bola sem nome: ' + s.id);
    if (!T('flavor_skin_' + s.id)) warn.push('bola sem descrição: ' + s.id);
    if (s.cur === 'coins' && s.price !== 0 && !(s.price > 0)) bad.push('bola sem preco: ' + s.id);
    if (s.price != null && isNaN(s.price)) bad.push('preço NaN: ' + s.id);
    if (!s.col) bad.push('bola sem coleção: ' + s.id);
  });
  C.TRAILS.forEach(t => {
    if (ids['tr' + t.id]) bad.push('rastro repetido: ' + t.id); ids['tr' + t.id] = 1;
    if (!T('trail_' + t.id)) bad.push('rastro sem nome: ' + t.id);
    if (t.cur === 'coins' && t.price !== 0 && !(t.price > 0) && t.id !== 'none') bad.push('rastro sem preco: ' + t.id);
  });
  C.THEMES.forEach(t => {
    if (ids['th' + t.id]) bad.push('tema repetido: ' + t.id); ids['th' + t.id] = 1;
    if (!T('theme_' + t.id)) bad.push('tema sem nome: ' + t.id);
    if (!t.colors || t.colors.length < 3) bad.push('tema sem 3 cores: ' + t.id);
    if (t.cur === 'coins' && t.price !== 0 && !(t.price > 0)) bad.push('tema sem preco: ' + t.id);
  });
  (HR.GEAR.aegisSkins || []).forEach(a => { if (!T('aegisskin_' + a.id)) bad.push('égide sem nome: ' + a.id); });
  (HR.GEAR.jetSkins || []).forEach(j => { if (!T('jetskin_' + j.id)) bad.push('jato sem nome: ' + j.id); });

  /* ---------- 3. conquistas ---------- */
  const st = HR.Achievements.stats();
  HR.ACHIEVEMENTS.forEach(a => {
    if (!T('a_' + a.id)) bad.push('conquista sem nome: ' + a.id);
    if (!T('a_d_' + a.stat)) warn.push('conquista sem descrição do alvo: ' + a.id + ' (' + a.stat + ')');
    if (st[a.stat] === undefined) warn.push('conquista com estatística inexistente: ' + a.id + ' (' + a.stat + ')');
  });

  /* ---------- 4. campanha ---------- */
  let semMoeda = 0, nan = 0, semAnel = 0;
  const todos = HR.Campaign.all();
  if (todos.length !== 1000) bad.push('campanha com ' + todos.length + ' fases (esperado 1000)');
  todos.forEach(l => {
    const c = HR.Campaign.firstClearReward(l).coins;
    if (!(c > 0)) semMoeda++;
    if (isNaN(c) || isNaN(l.rings) || isNaN(l.v0)) nan++;
    if (!(l.rings > 0)) semAnel++;
  });
  if (semMoeda) bad.push(semMoeda + ' fases sem moeda');
  if (nan) bad.push(nan + ' fases com número inválido');
  if (semAnel) bad.push(semAnel + ' fases sem anéis');

  /* ---------- 5. história ---------- */
  let cenas = 0, semOpcao = 0;
  for (let g = 1; g <= 10; g++) {
    for (const id of ['g' + g, 'g' + g + 'c']) if (HR.Story.exists(id)) cenas++;
    for (let b = 1; b <= 10; b++) {
      const id = 'g' + g + 'b' + b;
      if (!HR.Story.exists(id)) continue;
      cenas++;
      const sc = HR.Story.scene(id);
      if (sc.ask && sc.opts.length !== 3) { semOpcao++; bad.push('cena ' + id + ' com ' + sc.opts.length + ' respostas'); }
      ['U', 'Q', 'F'].forEach(ax => { if (sc.ask && !sc.reply(ax)) bad.push('cena ' + id + ' sem resposta ' + ax); });
    }
  }
  if (!HR.Story.exists('open')) bad.push('abertura da história não existe');
  void semOpcao;

  /* ---------- 6. fendas ---------- */
  if (HR.Rifts) {
    for (let n = 1; n <= 10; n++) {
      if (!T('rift_' + (n - 1))) bad.push('fenda sem nome: ' + n);
      const m = HR.Rifts.mul(n);
      if (!(m >= 1 && m < 4)) bad.push('multiplicador estranho na fenda ' + n + ': ' + m);
    }
    if (HR.Rifts.unlocked(2) && !HR.Campaign.isRegionUnlocked(1)) bad.push('fenda 2 aberta sem a galáxia 2');
  } else bad.push('HR.Rifts não carregou');

  /* ---------- 7. gráficos ---------- */
  if (!HR.Perf || !HR.Perf.TABLE || HR.Perf.TABLE.length !== 4) bad.push('níveis de gráfico fora do esperado');
  else {
    const t0 = HR.Perf.TABLE;
    for (let i = 1; i < 4; i++) {
      if (!(t0[i].dpr >= t0[i - 1].dpr)) bad.push('resolução não cresce do nível ' + (i - 1) + ' para o ' + i);
      if (!(t0[i].part >= t0[i - 1].part)) bad.push('partículas não crescem do nível ' + (i - 1) + ' para o ' + i);
    }
  }

  /* ---------- 8. telas ---------- */
  ['menu', 'hud', 'over', 'levelend', 'pause'].forEach(s => { if (!document.getElementById('screen-' + s)) bad.push('tela sumida: ' + s); });
  (HR.UI.PANELS || []).forEach(p => { if (!document.getElementById('screen-' + p)) bad.push('painel sem tela: ' + p); });

  return { erros: bad, avisos: warn, resumo: { skins: C.SKINS.length, rastros: C.TRAILS.length, temas: C.THEMES.length, fases: todos.length, cenas, conquistas: HR.ACHIEVEMENTS.length, chaves: pt.length } };
};
