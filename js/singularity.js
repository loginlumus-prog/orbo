/* =====================================================================
   Singularidade (v5): 11 camadas, cada uma guardada por um Arconte.
   Camada = Passagem (5 fases com um Eco cada) → Conversa → Prova do Arconte.
   A conversa define, de forma oculta, o caminho: U (entendimento), Q (questionamento)
   ou F (força). O caminho muda a dificuldade da Prova. Ver docs/PLANO_V5.md §4
   Textos da história: sg_* (PT/EN/ES) no fim deste arquivo.
   ===================================================================== */
window.HR = window.HR || {};

HR.ARCHONS = [
  { id: 'mirror',     sigil: 'mirror',     color: '#cfe8ff', word: 'humility' },
  { id: 'seed',       sigil: 'seed',       color: '#9dff8a', word: 'gratitude' },
  { id: 'debt',       sigil: 'debt',       color: '#ffcf4a', word: 'forgiveness' },
  { id: 'traveler',   sigil: 'hand',       color: '#ff8aa0', word: 'love' },
  { id: 'voice',      sigil: 'voice',      color: '#4cf0ff', word: 'truth' },
  { id: 'watcher',    sigil: 'waiting',    color: '#fff3a0', word: 'patience' },
  { id: 'lighthouse', sigil: 'lighthouse', color: '#ffb347', word: 'mercy' },
  { id: 'servant',    sigil: 'hands',      color: '#35e29a', word: 'service' },
  { id: 'bearer',     sigil: 'feather',    color: '#e6d8ff', word: 'surrender' },
  { id: 'builder',    sigil: 'bridge',     color: '#8fb8ff', word: 'faith' },
  { id: 'origin',     sigil: 'light',      color: '#ffffff', word: 'grace' }
];
HR.SG = {
  passages: 5,
  // v8: a Singularidade era mais difícil que o fim da campanha e sem nada novo.
  // Agora cada camada revisita uma galáxia (i % 10) e os caminhos se separam pelo
  // estilo, não pela impossibilidade: F pede 75 % dos arcos, não 85 %.
  paths: {
    U: { waves: 5, speed: 1.00, radius: 1.00, pass: 0.60, grace: true },
    Q: { waves: 6, speed: 1.06, radius: 0.95, pass: 0.66, req: { core: 20 } },
    F: { waves: 7, speed: 1.15, radius: 0.90, pass: 0.75, noAegis: true, req: { core: 30, rank: 56 } }
  },
  reconcileDays: 7, reconcileFails: 12,
  finalWords: ['love', 'forgiveness', 'service']
};

(function () {
  const N = HR.ARCHONS.length, NP = HR.SG.passages, DAY = 86400000;
  const r2 = v => Math.round(v * 100) / 100;
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9?\s]/g, ' ').replace(/\s+/g, ' ').trim();
  function lev(a, b) { if (Math.abs(a.length - b.length) > 1) return 9; const m = a.length, n = b.length, d = []; for (let i = 0; i <= m; i++) { d[i] = [i]; } for (let j = 1; j <= n; j++) d[0][j] = j; for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; }
  // palavras que mostram entendimento em cada camada (PT/EN/ES, sem acento)
  const SYN = [
    ['humildade', 'humilde', 'nada sou', 'pequeno', 'pequena', 'humility', 'humble', 'i am nothing', 'small', 'humildad', 'nada soy', 'pequeno'],
    ['gratidao', 'grato', 'grata', 'obrigado', 'obrigada', 'agradeco', 'agradecer', 'gratitude', 'grateful', 'thank', 'thanks', 'gratitud', 'agradecido', 'gracias'],
    ['perdao', 'perdoo', 'perdoar', 'perdoei', 'forgive', 'forgiveness', 'forgave', 'pardon', 'perdon', 'perdono', 'perdonar'],
    ['amor', 'amar', 'amo', 'compaixao', 'proximo', 'cuidar', 'love', 'compassion', 'neighbor', 'neighbour', 'care', 'compasion', 'projimo'],
    ['verdade', 'verdadeiro', 'sinceridade', 'sincero', 'honesto', 'truth', 'true', 'honest', 'sincere', 'verdad'],
    ['paciencia', 'esperar', 'espero', 'paciente', 'patience', 'patient', 'wait'],
    ['misericordia', 'compaixao', 'clemencia', 'piedade', 'mercy', 'merciful', 'compassion', 'piedad'],
    ['servir', 'servico', 'sirvo', 'ajudar', 'serve', 'service', 'help', 'servicio', 'ayudar'],
    ['entrega', 'entregar', 'soltar', 'solto', 'deixar ir', 'largar', 'surrender', 'let go', 'release'],
    ['fe', 'confiar', 'confio', 'confianca', 'crer', 'creio', 'acreditar', 'faith', 'trust', 'believe', 'confianza', 'creer', 'creo'],
    ['graca', 'amar', 'servir', 'perdoar', 'luz', 'grace', 'love', 'serve', 'forgive', 'light', 'gracia', 'perdonar']
  ];
  const FORCE = ['forca', 'vencer', 'venci', 'destruir', 'lutar', 'mereco', 'poder', 'derrotar', 'ganhar', 'sozinho', 'melhor', 'force', 'win', 'destroy', 'fight', 'deserve', 'power', 'defeat', 'alone', 'strength', 'best', 'fuerza', 'luchar', 'merezco', 'ganar', 'mejor'];
  const QUEST = ['por que', 'porque', 'quem', 'o que', 'como', 'qual', 'why', 'who', 'what', 'how', 'quien', 'que es', 'cual'];
  function has(text, list) {
    const t = ' ' + norm(text) + ' ', words = t.trim().split(' ');
    return list.some(w => { if (w.indexOf(' ') >= 0) return t.indexOf(' ' + w + ' ') >= 0; if (w.length <= 3) return words.includes(w); return words.some(x => x === w || (x.length >= 5 && lev(x, w) <= 1)); });
  }

  function data() { const d = HR.Store.data; d.singularity = d.singularity || { layers: {}, words: [], ecos: [], firstClear: null }; return d.singularity; }
  function L(i) { const s = data(); return s.layers[i] || (s.layers[i] = { cleared: [false, false, false, false, false], ecos: [false, false, false, false, false], path: null, talkedAt: 0, fails: 0, passed: false, passedAt: 0 }); }

  // v8: "uma camada por galáxia" — a camada i revisita a mecânica da galáxia (i % 10)
  // no sistema 6 (intensidade média), em vez de repetir 10-10-x com v0 800+.
  function passage(i, p) {
    const gi = i % 10;
    const base = HR.Campaign.gen(HR.REGIONS[gi], gi, 5, 2 + p);
    const lv = Object.assign({}, base, { id: 'S-' + (i + 1) + '-' + (p + 1), sg: true, archon: i, passage: p, boss: null, galaxyBoss: false, waves: 0 });
    lv.params = Object.assign({}, base.params);
    lv.rings = 26 + i + p; lv.v0 = Math.round(450 + i * 5 + p * 3); lv.speed = r2(lv.v0 / 265); lv.ramp = 0.12; lv.flowMul = 0.15; lv.tb0 = 0.98;
    const EV = ['asteroids', 'warp', 'sentinel', 'bonanza', 'guardian'];
    lv.events = [{ at: Math.round(lv.rings * 0.33), id: EV[(i + p) % 5] }, { at: Math.round(lv.rings * 0.76), id: EV[(i + p + 2) % 5] }];
    lv.dirs = ['right', 'top', 'left', 'bottom'].slice(0, 2 + ((i + p) % 3)); lv.dirEvery = 7 - ((i + p) % 3);
    lv.eco = true; lv.ecoAt = Math.round(lv.rings * 0.55);
    return lv;
  }
  // v8: a Prova é o chefe da galáxia que a camada revisita; só a 11ª é a Singularidade.
  function trial(i, path) {
    // gi = i % 10: a 11ª camada volta ao Berço — o fecho da história é a conversa,
    // não um muro. O que muda nela é a Singularidade em pessoa (5 ondas).
    const P = HR.SG.paths[path] || HR.SG.paths.Q, final = i === N - 1, gi = i % 10;
    const base = HR.Campaign.gen(HR.REGIONS[gi], gi, 9, 9);
    const lv = Object.assign({}, base, { id: 'S-' + (i + 1) + '-T', sg: true, archon: i, trial: true, boss: final ? 'singularity' : HR.REGIONS[gi].boss, galaxyBoss: true, waves: P.waves, path });
    lv.rings = 32 + i * 2 + (P.waves - 5) * 4 + (final ? 8 : 0); lv.v0 = Math.round((470 + i * 7) * P.speed); lv.speed = r2(lv.v0 / 265); lv.ramp = 0.12; lv.flowMul = 0.15; lv.tb0 = 0.92;
    lv.params = Object.assign({}, base.params, { radius: base.params.radius * P.radius });
    lv.passNeed = P.pass; lv.grace = !!P.grace; lv.noAegis = !!P.noAegis;
    const EV = ['sentinel', 'asteroids', 'warp', 'guardian', 'bonanza'], per = Math.ceil(lv.rings / P.waves);
    lv.events = []; for (let w = 1; w < P.waves; w += 2) lv.events.push({ at: per * w, id: EV[(i + w) % 5], wave: true });
    return lv;
  }

  HR.Singularity = {
    isLevel(id) { return typeof id === 'string' && id.indexOf('S-') === 0; },
    parse(id) { const p = String(id).split('-'); return { i: +p[1] - 1, p: p[2] === 'T' ? 'T' : +p[2] - 1 }; },
    level(id) { if (!this.isLevel(id)) return null; const x = this.parse(id); if (!(x.i >= 0 && x.i < N)) return null; return x.p === 'T' ? trial(x.i, L(x.i).path || 'Q') : (x.p >= 0 && x.p < NP ? passage(x.i, x.p) : null); },
    passage, trial,
    isOpen() { return HR.Campaign.singularityOpen(); },
    layer(i) { return L(i); },
    unlocked(i) { return this.isOpen() && (i === 0 || L(i - 1).passed); },
    passedCount() { let n = 0; for (let i = 0; i < N; i++) if (L(i).passed) n++; return n; },
    clearedCount(i) { return L(i).cleared.filter(Boolean).length; },
    ecosCount(i) { return L(i).ecos.filter(Boolean).length; },
    totalEcos() { let n = 0; for (let i = 0; i < N; i++) n += this.ecosCount(i); return n; },
    passageDone(i) { return this.clearedCount(i) >= NP; },
    current() { for (let i = 0; i < N; i++) if (!L(i).passed) return i; return N - 1; },
    canPlay(id) {
      const x = this.parse(id); if (!this.unlocked(x.i)) return false;
      if (x.p === 'T') return this.trialReady(x.i).ok;
      return x.p === 0 || L(x.i).cleared[x.p - 1];
    },
    canTalk(i) { const l = L(i); return this.unlocked(i) && this.passageDone(i) && !l.passed && (!l.path || this.reconcileReady(i)); },
    reconcileReady(i) { const l = L(i); return !!l.path && !l.passed && (Date.now() - l.talkedAt >= HR.SG.reconcileDays * DAY || l.fails >= HR.SG.reconcileFails); },
    reconcileLeft(i) { const l = L(i); return { days: Math.max(0, Math.ceil((l.talkedAt + HR.SG.reconcileDays * DAY - Date.now()) / DAY)), fails: Math.max(0, HR.SG.reconcileFails - l.fails) }; },
    // exigências da Prova conforme o caminho (a força exige poder)
    trialReady(i) {
      const l = L(i); if (!l.path || l.passed || !this.passageDone(i)) return { ok: false, items: [] };
      const req = HR.SG.paths[l.path].req || {}, items = [];
      if (req.core) items.push({ id: 'core', ok: HR.Core.level() >= req.core, a: HR.Core.level(), b: req.core });
      if (req.rank) items.push({ id: 'rank', ok: HR.Store.data.level >= req.rank + i, a: HR.Store.data.level, b: req.rank + i });
      return { ok: items.every(x => x.ok), items };
    },
    exchanges(i) { return i === N - 1 ? 5 : 3; },
    // resposta do jogador → caminho. picks = ['U'|'Q'|'F', ...] · message = texto livre · compose = ids de palavras (só na última)
    evaluate(i, picks, message, compose) {
      let score = 0;
      picks.forEach(v => { score += v === 'U' ? 2 : v === 'Q' ? 1 : 0; });
      const msg = message || '';
      if (msg.trim()) {
        if (has(msg, SYN[i])) score += 3;
        else if (msg.indexOf('?') >= 0 || has(msg, QUEST)) score += 1;
        if (has(msg, FORCE)) score -= 2;
      }
      const final = i === N - 1;
      if (final && compose) { const hit = HR.SG.finalWords.filter(w => compose.includes(w)).length, wrong = compose.filter(w => !HR.SG.finalWords.includes(w)).length; score += hit === 3 && !wrong ? 4 : hit >= 2 ? 2 : 0; }
      const max = final ? 17 : 9;
      const path = score >= (final ? 13 : 7) ? 'U' : score >= (final ? 6 : 3) ? 'Q' : 'F';
      return { path, score, max };
    },
    setPath(i, path) {
      const l = L(i), s5 = HR.Store.data.stats5; l.path = path; l.talkedAt = Date.now(); l.fails = 0;
      s5.dialogues = (s5.dialogues || 0) + 1;
      HR.Store.save(); HR.Analytics.log('archon_dialogue', { layer: i + 1, path });
    },
    foundEco(i, p) {
      const l = L(i); if (l.ecos[p]) return false;
      l.ecos[p] = true; HR.Store.data.stats5.ecosFound = (HR.Store.data.stats5.ecosFound || 0) + 1; HR.Store.save();
      return true;
    },
    wordsEarned() { return data().words.slice(); },
    nextLevel(level) {
      if (!level || !level.sg) return null;
      if (level.trial) return level.archon < N - 1 ? passage(level.archon + 1, 0) : null;
      return level.passage < NP - 1 ? passage(level.archon, level.passage + 1) : null;
    },
    // fim de uma fase da Singularidade; retorna { rewards, cleared, passed, final }
    complete(level, s) {
      const d = HR.Store.data, l = L(level.archon), out = { rewards: [], stars: 0, newStars: 0 };
      if (!level.trial) {
        if (s.success && !l.cleared[level.passage]) { l.cleared[level.passage] = true; const c = 800 + level.archon * 150; out.rewards.push({ coins: c }); HR.Economy.addCoins(c, 'sg_passage'); out.cleared = true; }
        else if (s.success) { const c = 150 + level.archon * 30; out.rewards.push({ coins: c }); HR.Economy.addCoins(c, 'sg_repeat'); }
        HR.Store.save(); return out;
      }
      if (!s.success) { l.fails++; HR.Store.save(); return out; }
      if (l.passed) { HR.Store.save(); return out; }
      l.passed = true; l.passedAt = Date.now(); out.passed = true;
      const s5 = d.stats5; s5.archonsPassed = this.passedCount(); s5[l.path === 'U' ? 'understood' : l.path === 'Q' ? 'questioned' : 'forced'] = (s5[l.path === 'U' ? 'understood' : l.path === 'Q' ? 'questioned' : 'forced'] || 0) + 1;
      const gems = 100 + level.archon * 20; out.rewards.push({ gems }); HR.Economy.addGems(gems, 'archon');
      const skin = 'arc_' + (level.archon + 1); if (!d.owned.skins.includes(skin)) { d.owned.skins.push(skin); out.rewards.push({ skin }); }
      const w = HR.ARCHONS[level.archon].word;
      if (l.path === 'U' && !data().words.includes(w)) { data().words.push(w); out.rewards.push({ word: w }); }
      if (level.archon === N - 1) {
        out.final = true; const t = l.path === 'U' ? 't_light_servant' : l.path === 'Q' ? 't_seeker' : 't_conqueror';
        if (!d.titles.includes(t)) d.titles.push(t); d.title = t; out.rewards.push({ title: t });
        if (!data().firstClear) data().firstClear = { at: Date.now(), path: l.path };
        HR.Economy.addGems(1000, 'singularity_clear'); out.rewards.push({ gems: 1000 });
      }
      HR.Store.save();
      HR.Analytics.log('archon_passed', { layer: level.archon + 1, path: l.path });
      if (HR.Online && HR.Online.submit) HR.Online.submit();
      return out;
    },
    dialogue(i) {
      const k = this.exchanges(i), t = (key, p) => HR.t('sg_' + key, p);
      const ex = []; for (let q = 0; q < k; q++) ex.push({ q: t('q_' + i + '_' + q), opts: ['U', 'Q', 'F'].map(v => ({ v, text: t('o_' + i + '_' + q + '_' + v) })) });
      return { name: t('name_' + i), title: t('title_' + i), intro: t('intro_' + i), ex, prompt: t('prompt_' + i), reply: v => t('reply_' + i + '_' + v), after: v => t('after_' + i + '_' + v) };
    }
  };
})();

/* ---------------- textos da história (subentendida) ---------------- */
Object.assign(HR.I18N.pt, {
  singularity_screen_d: 'Onze camadas descem até o centro. Cada uma tem um guardião. Não se atravessa só com reflexo.', sg_prize: 'Prêmio misterioso', sg_prize_d: 'Guardado para a primeira pessoa do mundo a atravessar as 11 camadas.',
  sg_layer_n: 'Camada {n}', sg_passage: 'Passagem', sg_passage_n: 'Passagem {n}/5', sg_trial: 'Prova do Arconte', sg_talk: 'Conversar', sg_talk_again: 'Conversar de novo', sg_ecos: 'Ecos', sg_eco_found: 'ECO', sg_eco_title: 'Eco encontrado', sg_eco_missing: 'Um eco ainda perdido nesta passagem.', sg_words: 'Palavras', sg_word_new: 'Nova palavra', sg_grace: 'GRAÇA +1',
  sg_locked: 'Atravesse a camada anterior.', sg_need_passage: 'Conclua as 5 fases da passagem para falar com o Arconte.', sg_need_talk: 'Converse com o Arconte antes da Prova.', sg_trial_req: 'O Arconte exige mais força para esta Prova:', sg_reconcile: 'O Arconte aceitará conversar de novo em {d} dias ou após {f} tentativas.', sg_reconcile_ready: 'O Arconte está disposto a ouvir de novo.',
  sg_passed: 'Atravessada', sg_path_level: 'Prova: {w} ondas · passar {p} %', sg_send: 'Enviar', sg_message_ph: 'Escreva sua mensagem…', sg_continue: 'Continuar', sg_go_trial: 'Enfrentar a Prova', sg_compose: 'Junte três palavras que você carrega e diga o caminho de volta.', sg_compose_none: 'Você não carrega nenhuma palavra.', sg_endless: 'Singularidade sem fim',
  sg_epilogue_U: 'A luz que te trouxe agora passa por você. Não há mais camadas: há gente no caminho. Volte e acenda.', sg_epilogue_Q: 'Você chegou ao centro ainda perguntando. A luz não se ofende com perguntas: ela espera, como esperou por você.', sg_epilogue_F: 'Você venceu cada guardião com as próprias forças. O centro está aberto. A luz continua esperando que você a entenda.',
  t_light_servant: 'Servo da Luz', t_seeker: 'Buscador', t_conqueror: 'Conquistador',
  sg_word_humility: 'Humildade', sg_word_gratitude: 'Gratidão', sg_word_forgiveness: 'Perdão', sg_word_love: 'Amor', sg_word_truth: 'Verdade', sg_word_patience: 'Paciência', sg_word_mercy: 'Misericórdia', sg_word_service: 'Servir', sg_word_surrender: 'Entrega', sg_word_faith: 'Fé', sg_word_grace: 'Graça',

  sg_name_0: 'O Reflexo', sg_title_0: 'O Espelho',
  sg_eco_0_0: 'Havia uma estrela que só olhava para o próprio brilho. Um dia apagou, e ninguém percebeu: ela nunca tinha iluminado ninguém.',
  sg_eco_0_1: 'No espelho do vácuo, a bola viu todas as vitórias que contava. Atrás dela, viu também todos os que tinham aberto o caminho.',
  sg_eco_0_2: 'Os anéis não se curvam para quem é grande. Eles se abrem para quem passa pelo centro.',
  sg_eco_0_3: 'Um cometa gritou que era o mais rápido. O silêncio respondeu com mil galáxias que ninguém jamais contaria.',
  sg_eco_0_4: 'O Reflexo não pergunta quanto você venceu. Pergunta o que você vê quando olha.',
  sg_intro_0: 'Chegaste à borda do que existe. Muitos chegam aqui cheios de si. Diz-me, viajante: quem é você?',
  sg_q_0_0: 'Quem é você?', sg_o_0_0_U: 'Uma luz pequena, que só chegou porque outros abriram o caminho.', sg_o_0_0_Q: 'Não sei ao certo. Por que isso importa aqui?', sg_o_0_0_F: 'Aquele que venceu mil fases. Eu mereço estar aqui.',
  sg_q_0_1: 'O que o espelho mostra?', sg_o_0_1_U: 'Mostra também os que ficaram atrás de mim.', sg_o_0_1_Q: 'Mostra o que eu quero ver, ou o que eu sou?', sg_o_0_1_F: 'Mostra um vencedor.',
  sg_q_0_2: 'Se a porta não abrir, o que fará?', sg_o_0_2_U: 'Vou me abaixar e passar pelo centro.', sg_o_0_2_Q: 'Vou tentar entender por que ela está fechada.', sg_o_0_2_F: 'Vou atravessá-la de qualquer jeito.',
  sg_prompt_0: 'Deixe uma palavra diante do espelho.',
  sg_reply_0_U: 'Então você viu. A porta nunca foi alta: quem se abaixa, passa.', sg_reply_0_Q: 'Você ainda procura. Procurar já é começar a ver.', sg_reply_0_F: 'Você vê só a própria luz. Veja, então, se ela basta.',
  sg_after_0_U: 'Leve a primeira palavra.', sg_after_0_Q: 'Um dia voltará a este espelho com outros olhos.', sg_after_0_F: 'Venceste. Mas o espelho continua mostrando só você.',

  sg_name_1: 'O Semeador', sg_title_1: 'A Semente',
  sg_eco_1_0: 'Um planeta pediu chuva por mil anos. Quando ela veio, reclamou do barulho.',
  sg_eco_1_1: 'Toda luz que chega até você saiu de uma estrela há muito tempo. Algumas já nem existem.',
  sg_eco_1_2: 'O Semeador planta sem saber quem vai colher. Ainda assim, planta.',
  sg_eco_1_3: 'Uma nebulosa guardou cada grão de poeira que recebeu. Dela nasceram sóis.',
  sg_eco_1_4: 'Quem conta só o que falta nunca termina a conta.',
  sg_intro_1: 'Tudo o que você usou para chegar aqui foi dado: a bola, o caminho, o fôlego. O que você traz nas mãos?',
  sg_q_1_0: 'O que você recebeu no caminho?', sg_o_1_0_U: 'Luz de estrelas que eu nem conheci.', sg_o_1_0_Q: 'Recebi? De quem, se o esforço foi meu?', sg_o_1_0_F: 'Nada. Conquistei tudo sozinho.',
  sg_q_1_1: 'E o que ainda falta?', sg_o_1_1_U: 'Falta agradecer pelo que já chegou.', sg_o_1_1_Q: 'Como saber se falta ou se já é suficiente?', sg_o_1_1_F: 'Falta o prêmio que me devem.',
  sg_q_1_2: 'Por que plantar o que outro vai colher?', sg_o_1_2_U: 'Porque alguém plantou para mim.', sg_o_1_2_Q: 'E quem garante que alguém vai colher?', sg_o_1_2_F: 'Não faz sentido. Eu planto para mim.',
  sg_prompt_1: 'Deixe uma palavra na terra.',
  sg_reply_1_U: 'A semente reconhece a mão que a plantou. Siga.', sg_reply_1_Q: 'Pergunte ao chão que te sustenta. Ele responde em silêncio.', sg_reply_1_F: 'Você só vê a colheita. Colha, então, o que semeou.',
  sg_after_1_U: 'Leve a segunda palavra.', sg_after_1_Q: 'O que você recebeu ainda vai te encontrar.', sg_after_1_F: 'Passou. Mas as mãos continuam fechadas.',

  sg_name_2: 'O Credor', sg_title_2: 'A Dívida',
  sg_eco_2_0: 'Um rei perdoou a enorme dívida de um servo. O servo saiu e cobrou, com raiva, uma moeda de um amigo.',
  sg_eco_2_1: 'Duas estrelas colidiram há bilhões de anos. Uma ainda guarda a cicatriz. A outra virou luz.',
  sg_eco_2_2: 'O peso que você não solta é você quem carrega.',
  sg_eco_2_3: 'O Credor tem um livro onde anota tudo. As páginas estão em branco.',
  sg_eco_2_4: 'Nem todo arco que te acertou fez por mal. Alguns só estavam no caminho.',
  sg_intro_2: 'Muitos arcos te feriram até aqui. Eu tenho o livro de todas as dívidas. Qual delas você quer cobrar?',
  sg_q_2_0: 'Quem te deve?', sg_o_2_0_U: 'Ninguém. Eu também já fui perdoado.', sg_o_2_0_Q: 'É justo esquecer quem me feriu?', sg_o_2_0_F: 'Todos que me fizeram cair.',
  sg_q_2_1: 'E se quem te feriu pedir para passar?', sg_o_2_1_U: 'Eu abro o caminho.', sg_o_2_1_Q: 'Depende. Ele mudou?', sg_o_2_1_F: 'Que pague primeiro.',
  sg_q_2_2: 'O que faço com o livro?', sg_o_2_2_U: 'Deixe as páginas em branco.', sg_o_2_2_Q: 'Por que você guarda um livro vazio?', sg_o_2_2_F: 'Leia em voz alta, para todos saberem.',
  sg_prompt_2: 'Escreva uma palavra no livro.',
  sg_reply_2_U: 'A página continua branca. É assim que se atravessa.', sg_reply_2_Q: 'Você está perto: a dúvida já afrouxou a mão.', sg_reply_2_F: 'Então cada dívida vira uma pedra no seu caminho.',
  sg_after_2_U: 'Leve a terceira palavra, leve.', sg_after_2_Q: 'Um dia a mão se abre sozinha.', sg_after_2_F: 'Venceu as pedras. Ainda carrega todas.',

  sg_name_3: 'O Viajante', sg_title_3: 'O Viajante Caído',
  sg_eco_3_0: 'Uma nave quebrada pedia ajuda no vácuo. Passaram por ela um cometa com pressa e um satélite importante. Parou um asteroide sem nome.',
  sg_eco_3_1: 'O asteroide dividiu seu calor com a nave até ela voltar a brilhar. Atrasou-se. Ninguém lembrou o nome dele.',
  sg_eco_3_2: 'O próximo não é quem está perto de você. É de quem você chega perto.',
  sg_eco_3_3: 'Nenhuma órbita existe sozinha. Cada uma se sustenta na força de outra.',
  sg_eco_3_4: 'O Viajante ainda procura quem pare. Às vezes ele parece um obstáculo no caminho.',
  sg_intro_3: 'Até aqui, quantas vezes você desviou de alguém caído para não perder o ritmo?',
  sg_q_3_0: 'Por que não parou?', sg_o_3_0_U: 'Não parei. E isso me pesa.', sg_o_3_0_Q: 'Parar pelos outros não atrasa a jornada?', sg_o_3_0_F: 'Eu estava ganhando. Parar é perder.',
  sg_q_3_1: 'Quem é o seu próximo?', sg_o_3_1_U: 'Quem está caído na minha frente.', sg_o_3_1_Q: 'Como saber quem merece ajuda?', sg_o_3_1_F: 'Quem pode me ajudar a subir.',
  sg_q_3_2: 'E se ajudar custar a sua vitória?', sg_o_3_2_U: 'Vale mais a nave que volta a brilhar.', sg_o_3_2_Q: 'Existe um jeito de não perder nada?', sg_o_3_2_F: 'Então não ajudo.',
  sg_prompt_3: 'Diga uma palavra a quem está caído.',
  sg_reply_3_U: 'Você parou. É isso que abre esta camada.', sg_reply_3_Q: 'Você pergunta quem merece. O caído não pergunta.', sg_reply_3_F: 'Então passe correndo, como os outros.',
  sg_after_3_U: 'Leve a quarta palavra no peito.', sg_after_3_Q: 'O próximo ainda vai cruzar o seu caminho.', sg_after_3_F: 'Passou. Sozinho.',

  sg_name_4: 'A Voz', sg_title_4: 'A Voz',
  sg_eco_4_0: 'Um planeta pintou-se de ouro para parecer uma estrela. Por dentro, esfriava.',
  sg_eco_4_1: 'A Voz nunca grita. Quem escuta, escuta de perto.',
  sg_eco_4_2: 'Mentiras orbitam rápido e caem cedo. A verdade orbita devagar e não cai.',
  sg_eco_4_3: 'Houve quem trocasse o próprio nome para ser aplaudido. Esqueceu o nome e o aplauso.',
  sg_eco_4_4: 'No silêncio entre dois arcos dá para ouvir o que você realmente é.',
  sg_intro_4: 'Aqui cada palavra ecoa pela eternidade. Cuidado com o que diz. O que você quer que eu acredite sobre você?',
  sg_q_4_0: 'Você já fingiu ser maior?', sg_o_4_0_U: 'Já. E me senti menor.', sg_o_4_0_Q: 'Todo mundo não finge um pouco?', sg_o_4_0_F: 'Nunca precisei fingir.',
  sg_q_4_1: 'O que é verdade?', sg_o_4_1_U: 'O que continua de pé quando ninguém está olhando.', sg_o_4_1_Q: 'Existe uma verdade só?', sg_o_4_1_F: 'O que eu decido que é.',
  sg_q_4_2: 'Por que a Voz não grita?', sg_o_4_2_U: 'Porque a verdade não precisa.', sg_o_4_2_Q: 'Porque ninguém escutaria?', sg_o_4_2_F: 'Porque é fraca.',
  sg_prompt_4: 'Diga uma palavra que ecoe.',
  sg_reply_4_U: 'Ecoou limpa. Pode passar.', sg_reply_4_Q: 'Sua dúvida é sincera, e isso já é começo de verdade.', sg_reply_4_F: 'O eco volta distorcido. Enfrente o que ele diz.',
  sg_after_4_U: 'Leve a quinta palavra.', sg_after_4_Q: 'O silêncio continuará te ensinando.', sg_after_4_F: 'Venceu o eco. O ruído continua.',

  sg_name_5: 'A Vigia', sg_title_5: 'A Estrela que Esperou',
  sg_eco_5_0: 'Uma estrela jovem quis brilhar antes do tempo. Explodiu cedo e virou pó.',
  sg_eco_5_1: 'Outra esperou bilhões de anos juntando luz. Hoje guia navegantes.',
  sg_eco_5_2: 'Os arcos vêm no ritmo deles, não no seu. Quem força, erra a borda.',
  sg_eco_5_3: 'A Vigia não conta o tempo. Conta as vezes em que não desistiu.',
  sg_eco_5_4: 'A pressa quebra o fluxo. A espera o constrói.',
  sg_intro_5: 'Você correu muito para chegar aqui. Agora eu peço o mais difícil: espere.',
  sg_q_5_0: 'Quanto tempo você esperaria?', sg_o_5_0_U: 'O tempo que for preciso.', sg_o_5_0_Q: 'Esperar pelo quê, exatamente?', sg_o_5_0_F: 'Nenhum. Abra agora.',
  sg_q_5_1: 'O que se aprende esperando?', sg_o_5_1_U: 'Que nem tudo depende de mim.', sg_o_5_1_Q: 'Não seria melhor aprender fazendo?', sg_o_5_1_F: 'Nada. Só se perde tempo.',
  sg_q_5_2: 'E se o ritmo dos arcos mudar?', sg_o_5_2_U: 'Eu acompanho.', sg_o_5_2_Q: 'Por que eles mudam?', sg_o_5_2_F: 'Eu imponho o meu.',
  sg_prompt_5: 'Deixe uma palavra e aguarde.',
  sg_reply_5_U: 'Você esperou. O caminho abriu sozinho.', sg_reply_5_Q: 'Perguntar também é esperar um pouco.', sg_reply_5_F: 'Então vá, e encontre a pressa do outro lado.',
  sg_after_5_U: 'Leve a sexta palavra, sem pressa.', sg_after_5_Q: 'O tempo ainda vai te responder.', sg_after_5_F: 'Venceu rápido. Não viu nada.',

  sg_name_6: 'O Faroleiro', sg_title_6: 'O Farol',
  sg_eco_6_0: 'O Faroleiro acende a luz também para as naves que o atacaram.',
  sg_eco_6_1: 'Um piloto errou o caminho mil vezes. Mil vezes o farol continuou aceso.',
  sg_eco_6_2: 'A luz não escolhe quem merece voltar.',
  sg_eco_6_3: 'Quem já se perdeu sabe o valor de uma luz acesa.',
  sg_eco_6_4: 'Alguns naufragam por orgulho. O farol brilha até para eles.',
  sg_intro_6: 'Você também errou muitas vezes. Quantas vezes pôde tentar de novo?',
  sg_q_6_0: 'Por que você recebeu outra chance?', sg_o_6_0_U: 'Porque alguém manteve a luz acesa.', sg_o_6_0_Q: 'Não foi só uma regra do jogo?', sg_o_6_0_F: 'Porque eu sou bom.',
  sg_q_6_1: 'E quem errou contra você?', sg_o_6_1_U: 'Também enxerga o farol.', sg_o_6_1_Q: 'Ele merece a mesma luz?', sg_o_6_1_F: 'Que fique no escuro.',
  sg_q_6_2: 'O que faria no meu lugar?', sg_o_6_2_U: 'Deixaria acesa.', sg_o_6_2_Q: 'Como decidir para quem brilhar?', sg_o_6_2_F: 'Apagaria para os inimigos.',
  sg_prompt_6: 'Deixe uma palavra no farol.',
  sg_reply_6_U: 'A luz reconheceu a própria luz. Siga.', sg_reply_6_Q: 'Você pesa quem merece. A luz não pesa.', sg_reply_6_F: 'Então atravesse o escuro que você escolheu.',
  sg_after_6_U: 'Leve a sétima palavra e mantenha acesa.', sg_after_6_Q: 'Um dia você vai precisar da luz.', sg_after_6_F: 'Passou pelo escuro. Ele ficou com você.',

  sg_name_7: 'O Servo', sg_title_7: 'As Mãos',
  sg_eco_7_0: 'O maior dos astros não é o que mais brilha. É o que sustenta mais órbitas.',
  sg_eco_7_1: 'O Servo limpa a poeira dos anéis por onde outros vão passar.',
  sg_eco_7_2: 'Quem quiser ser o primeiro, que sirva a todos.',
  sg_eco_7_3: 'Houve um sol que se gastou aquecendo planetas. Nenhum deles o chamou de fraco.',
  sg_eco_7_4: 'Mãos abertas não conseguem se fechar em punho.',
  sg_intro_7: 'Aqui, quem manda é quem serve. O que as suas mãos sabem fazer?',
  sg_q_7_0: 'Para que servem as suas mãos?', sg_o_7_0_U: 'Para levantar quem caiu.', sg_o_7_0_Q: 'Servir não é para quem é fraco?', sg_o_7_0_F: 'Para vencer.',
  sg_q_7_1: 'Quem é o maior aqui?', sg_o_7_1_U: 'Quem está servindo agora.', sg_o_7_1_Q: 'Não é quem tem mais estrelas?', sg_o_7_1_F: 'Quem chegou mais longe.',
  sg_q_7_2: 'Você limparia os anéis para outro passar?', sg_o_7_2_U: 'Já comecei.', sg_o_7_2_Q: 'E o que eu ganho com isso?', sg_o_7_2_F: 'Não é minha função.',
  sg_prompt_7: 'Ofereça uma palavra.',
  sg_reply_7_U: 'Suas mãos já abriram a porta.', sg_reply_7_Q: 'A pergunta sobre o ganho ainda fecha os seus dedos.', sg_reply_7_F: 'Então use o punho. Veja o que ele abre.',
  sg_after_7_U: 'Leve a oitava palavra nas mãos.', sg_after_7_Q: 'As mãos aprendem devagar.', sg_after_7_F: 'Venceu. As mãos continuam fechadas.',

  sg_name_8: 'O Carregador', sg_title_8: 'O Peso',
  sg_eco_8_0: 'Uma bola tentou atravessar a camada levando todos os troféus. Afundou.',
  sg_eco_8_1: 'O Carregador sustenta o mundo e, mesmo assim, flutua. Ele não carrega sozinho.',
  sg_eco_8_2: 'Soltar não é perder. É abrir espaço.',
  sg_eco_8_3: 'A pluma atravessa tempestades que derrubam montanhas.',
  sg_eco_8_4: 'Há coisas que só se seguram abrindo a mão.',
  sg_intro_8: 'Você está pesado. Traz vitórias, recordes, mágoas e medos. Nada disso passa por aqui.',
  sg_q_8_0: 'O que você carrega?', sg_o_8_0_U: 'Mais do que preciso.', sg_o_8_0_Q: 'Se eu soltar, o que sobra de mim?', sg_o_8_0_F: 'Minhas conquistas. São minhas.',
  sg_q_8_1: 'Por que tanto medo de soltar?', sg_o_8_1_U: 'Porque achei que eu era o que carregava.', sg_o_8_1_Q: 'Soltar não é desistir?', sg_o_8_1_F: 'Não tenho medo.',
  sg_q_8_2: 'Quem segura o que você soltar?', sg_o_8_2_U: 'Confio que não cai no vazio.', sg_o_8_2_Q: 'Tem alguém maior segurando?', sg_o_8_2_F: 'Ninguém. Por isso seguro.',
  sg_prompt_8: 'Solte uma palavra.',
  sg_reply_8_U: 'Mais leve. Agora você flutua.', sg_reply_8_Q: 'Você já afrouxou os dedos. Falta abrir.', sg_reply_8_F: 'Então atravesse com todo o peso.',
  sg_after_8_U: 'Leve a nona palavra, que não pesa nada.', sg_after_8_Q: 'O peso ainda vai pedir para ficar.', sg_after_8_F: 'Chegou. Cansado.',

  sg_name_9: 'O Construtor', sg_title_9: 'A Ponte Invisível',
  sg_eco_9_0: 'Diante do abismo, o Construtor não mostrou a ponte. Pediu apenas o primeiro passo.',
  sg_eco_9_1: 'Quem espera ver a ponte inteira nunca atravessa.',
  sg_eco_9_2: 'A luz das estrelas mais distantes já saiu. Basta confiar que ela chega.',
  sg_eco_9_3: 'Um viajante atravessou de olhos fechados. Não porque era cego, mas porque confiava em quem o chamava.',
  sg_eco_9_4: 'Crer não é não ter medo. É dar o passo com o medo junto.',
  sg_intro_9: 'À frente, só existe escuro. A ponte está aí, mas você não vai vê-la antes de pisar.',
  sg_q_9_0: 'Vai dar o passo?', sg_o_9_0_U: 'Vou.', sg_o_9_0_Q: 'Como você prova que a ponte existe?', sg_o_9_0_F: 'Só depois de ter certeza.',
  sg_q_9_1: 'E se cair?', sg_o_9_1_U: 'Quem me chamou até aqui não me deixa cair.', sg_o_9_1_Q: 'Quem me segura se eu cair?', sg_o_9_1_F: 'Então este lugar é uma mentira.',
  sg_q_9_2: 'Por que chegou até aqui, se nunca viu o centro?', sg_o_9_2_U: 'Porque confiei em cada luz do caminho.', sg_o_9_2_Q: 'Talvez por curiosidade?', sg_o_9_2_F: 'Porque sou forte.',
  sg_prompt_9: 'Diga uma palavra sobre o abismo.',
  sg_reply_9_U: 'O chão apareceu sob o seu passo.', sg_reply_9_Q: 'Perguntar é olhar para a ponte. Falta pisar.', sg_reply_9_F: 'Então salte com as suas forças.',
  sg_after_9_U: 'Leve a décima palavra.', sg_after_9_Q: 'O próximo abismo vai te perguntar de novo.', sg_after_9_F: 'Atravessou sem ponte. Sozinho, de novo.',

  sg_name_10: 'A Origem', sg_title_10: 'A Luz de Onde Viemos',
  sg_eco_10_0: 'No começo não havia arcos, nem pontos, nem recordes. Havia uma luz que queria ser compartilhada.',
  sg_eco_10_1: 'Tudo o que brilha pegou emprestada uma fagulha dela.',
  sg_eco_10_2: 'Ela não pede nada em troca. Mas se alegra quando a luz é passada adiante.',
  sg_eco_10_3: 'Os dez guardiões foram, cada um, um pedaço do caminho de volta.',
  sg_eco_10_4: 'Quem entende que não é nada descobre que é amado. Quem é amado aprende a amar.',
  sg_intro_10: 'Você atravessou dez camadas. Não para me vencer: para voltar. Sabe o que você é?',
  sg_q_10_0: 'O que você é?', sg_o_10_0_U: 'Nada, sem a luz que recebi.', sg_o_10_0_Q: 'Sou o que conquistei?', sg_o_10_0_F: 'O maior jogador do universo.',
  sg_q_10_1: 'Por que tanta luz foi dada a você?', sg_o_10_1_U: 'Para que eu a passe adiante.', sg_o_10_1_Q: 'Para eu provar alguma coisa?', sg_o_10_1_F: 'Porque eu mereci.',
  sg_q_10_2: 'O que fará com o que aprendeu?', sg_o_10_2_U: 'Voltar e ajudar quem ainda está no caminho.', sg_o_10_2_Q: 'Ainda não sei, e isso me assusta.', sg_o_10_2_F: 'Dominar o ranking.',
  sg_q_10_3: 'E os que te feriram na jornada?', sg_o_10_3_U: 'Também são chamados de volta.', sg_o_10_3_Q: 'Preciso mesmo me importar com eles?', sg_o_10_3_F: 'Que fiquem para trás.',
  sg_q_10_4: 'Então diga: o que sustenta tudo?', sg_o_10_4_U: 'O amor.', sg_o_10_4_Q: 'O conhecimento?', sg_o_10_4_F: 'A força.',
  sg_prompt_10: 'Diga, com suas palavras, o caminho de volta.',
  sg_reply_10_U: 'Você entendeu. Não havia nada para vencer: havia a quem amar, perdoar e servir. Bem-vindo de volta.', sg_reply_10_Q: 'Você chegou perto, e perto também é bonito. Mas ainda procura com os olhos, não com o coração.', sg_reply_10_F: 'Você chegou pela força. A força chega, mas não fica. Mostre, então, até onde ela vai.',
  sg_after_10_U: 'Esta luz agora é sua para dar.', sg_after_10_Q: 'A jornada continua, e a luz continua esperando.', sg_after_10_F: 'Você venceu o jogo. A luz ainda espera que você a entenda.'
});
Object.assign(HR.I18N.en, {
  singularity_screen_d: 'Eleven layers descend to the core. Each has a guardian. Reflexes alone won’t take you through.', sg_prize: 'Mystery prize', sg_prize_d: 'Kept for the first person in the world to cross all 11 layers.',
  sg_layer_n: 'Layer {n}', sg_passage: 'Passage', sg_passage_n: 'Passage {n}/5', sg_trial: 'Archon’s Trial', sg_talk: 'Talk', sg_talk_again: 'Talk again', sg_ecos: 'Echoes', sg_eco_found: 'ECHO', sg_eco_title: 'Echo found', sg_eco_missing: 'An echo is still lost in this passage.', sg_words: 'Words', sg_word_new: 'New word', sg_grace: 'GRACE +1',
  sg_locked: 'Cross the previous layer.', sg_need_passage: 'Clear the 5 passage levels to speak with the Archon.', sg_need_talk: 'Talk to the Archon before the Trial.', sg_trial_req: 'The Archon demands more strength for this Trial:', sg_reconcile: 'The Archon will talk again in {d} days or after {f} attempts.', sg_reconcile_ready: 'The Archon is willing to listen again.',
  sg_passed: 'Crossed', sg_path_level: 'Trial: {w} waves · pass {p}%', sg_send: 'Send', sg_message_ph: 'Write your message…', sg_continue: 'Continue', sg_go_trial: 'Face the Trial', sg_compose: 'Gather three words you carry and speak the way back.', sg_compose_none: 'You carry no words.', sg_endless: 'Endless Singularity',
  sg_epilogue_U: 'The light that brought you now passes through you. There are no more layers: there are people on the way. Go back and light them.', sg_epilogue_Q: 'You reached the core still asking. The light is not offended by questions: it waits, as it waited for you.', sg_epilogue_F: 'You beat every guardian with your own strength. The core is open. The light still waits for you to understand it.',
  t_light_servant: 'Servant of Light', t_seeker: 'Seeker', t_conqueror: 'Conqueror',
  sg_word_humility: 'Humility', sg_word_gratitude: 'Gratitude', sg_word_forgiveness: 'Forgiveness', sg_word_love: 'Love', sg_word_truth: 'Truth', sg_word_patience: 'Patience', sg_word_mercy: 'Mercy', sg_word_service: 'Service', sg_word_surrender: 'Surrender', sg_word_faith: 'Faith', sg_word_grace: 'Grace',
  sg_name_0: 'The Reflection', sg_title_0: 'The Mirror',
  sg_eco_0_0: 'There was a star that only looked at its own glow. One day it went out, and no one noticed: it had never lit anyone.', sg_eco_0_1: 'In the mirror of the void, the ball saw every victory it counted. Behind it, it also saw everyone who had opened the way.', sg_eco_0_2: 'Rings do not bow to the great. They open for whoever passes through the center.', sg_eco_0_3: 'A comet shouted that it was the fastest. Silence answered with a thousand galaxies no one would ever count.', sg_eco_0_4: 'The Reflection does not ask how much you won. It asks what you see when you look.',
  sg_intro_0: 'You have reached the edge of what exists. Many arrive here full of themselves. Tell me, traveler: who are you?',
  sg_q_0_0: 'Who are you?', sg_o_0_0_U: 'A small light that only arrived because others opened the way.', sg_o_0_0_Q: 'I’m not sure. Why does it matter here?', sg_o_0_0_F: 'The one who beat a thousand levels. I deserve to be here.',
  sg_q_0_1: 'What does the mirror show?', sg_o_0_1_U: 'It also shows those who stayed behind me.', sg_o_0_1_Q: 'Does it show what I want to see, or what I am?', sg_o_0_1_F: 'A winner.',
  sg_q_0_2: 'If the door doesn’t open, what will you do?', sg_o_0_2_U: 'Bow down and pass through the center.', sg_o_0_2_Q: 'Try to understand why it is closed.', sg_o_0_2_F: 'Get through it no matter what.',
  sg_prompt_0: 'Leave a word before the mirror.', sg_reply_0_U: 'So you saw. The door was never high: whoever bows, passes.', sg_reply_0_Q: 'You are still searching. Searching is already beginning to see.', sg_reply_0_F: 'You only see your own light. See, then, if it is enough.',
  sg_after_0_U: 'Take the first word.', sg_after_0_Q: 'One day you will return to this mirror with other eyes.', sg_after_0_F: 'You won. But the mirror still shows only you.',
  sg_name_1: 'The Sower', sg_title_1: 'The Seed',
  sg_eco_1_0: 'A planet begged for rain for a thousand years. When it came, it complained about the noise.', sg_eco_1_1: 'Every light that reaches you left its star long ago. Some of those stars no longer exist.', sg_eco_1_2: 'The Sower plants without knowing who will harvest. Still, it plants.', sg_eco_1_3: 'A nebula kept every grain of dust it received. Suns were born from it.', sg_eco_1_4: 'Whoever counts only what is missing never finishes counting.',
  sg_intro_1: 'Everything you used to get here was given: the ball, the path, the breath. What do you carry in your hands?',
  sg_q_1_0: 'What did you receive on the way?', sg_o_1_0_U: 'Light from stars I never knew.', sg_o_1_0_Q: 'Received? From whom, if the effort was mine?', sg_o_1_0_F: 'Nothing. I earned it all alone.',
  sg_q_1_1: 'And what is still missing?', sg_o_1_1_U: 'Being thankful for what already came.', sg_o_1_1_Q: 'How do I know if it’s missing or already enough?', sg_o_1_1_F: 'The prize they owe me.',
  sg_q_1_2: 'Why plant what another will harvest?', sg_o_1_2_U: 'Because someone planted for me.', sg_o_1_2_Q: 'And who guarantees anyone will harvest?', sg_o_1_2_F: 'It makes no sense. I plant for myself.',
  sg_prompt_1: 'Leave a word in the soil.', sg_reply_1_U: 'The seed knows the hand that planted it. Go on.', sg_reply_1_Q: 'Ask the ground that holds you. It answers in silence.', sg_reply_1_F: 'You only see the harvest. Reap, then, what you sowed.',
  sg_after_1_U: 'Take the second word.', sg_after_1_Q: 'What you received will still find you.', sg_after_1_F: 'You passed. But your hands are still closed.',
  sg_name_2: 'The Creditor', sg_title_2: 'The Debt',
  sg_eco_2_0: 'A king forgave a servant’s enormous debt. The servant went out and angrily demanded a single coin from a friend.', sg_eco_2_1: 'Two stars collided billions of years ago. One still keeps the scar. The other became light.', sg_eco_2_2: 'The weight you don’t let go is the weight you carry.', sg_eco_2_3: 'The Creditor keeps a book where everything is written. Its pages are blank.', sg_eco_2_4: 'Not every ring that hit you meant harm. Some were just in the way.',
  sg_intro_2: 'Many rings have hurt you on the way here. I hold the book of every debt. Which one do you want to collect?',
  sg_q_2_0: 'Who owes you?', sg_o_2_0_U: 'No one. I have been forgiven too.', sg_o_2_0_Q: 'Is it fair to forget who hurt me?', sg_o_2_0_F: 'Everyone who made me fall.',
  sg_q_2_1: 'And if the one who hurt you asks to pass?', sg_o_2_1_U: 'I open the way.', sg_o_2_1_Q: 'It depends. Have they changed?', sg_o_2_1_F: 'Let them pay first.',
  sg_q_2_2: 'What should I do with the book?', sg_o_2_2_U: 'Leave the pages blank.', sg_o_2_2_Q: 'Why do you keep an empty book?', sg_o_2_2_F: 'Read it aloud so everyone knows.',
  sg_prompt_2: 'Write a word in the book.', sg_reply_2_U: 'The page stays blank. That is how one crosses.', sg_reply_2_Q: 'You are close: doubt has already loosened your hand.', sg_reply_2_F: 'Then every debt becomes a stone on your way.',
  sg_after_2_U: 'Take the third word, lightly.', sg_after_2_Q: 'One day the hand opens by itself.', sg_after_2_F: 'You beat the stones. You still carry all of them.',
  sg_name_3: 'The Traveler', sg_title_3: 'The Fallen Traveler',
  sg_eco_3_0: 'A broken ship called for help in the void. A hurried comet and an important satellite passed it by. A nameless asteroid stopped.', sg_eco_3_1: 'The asteroid shared its warmth until the ship shone again. It fell behind. No one remembered its name.', sg_eco_3_2: 'Your neighbor is not who is near you. It is whoever you draw near to.', sg_eco_3_3: 'No orbit exists alone. Each one is held by the pull of another.', sg_eco_3_4: 'The Traveler still looks for someone who stops. Sometimes it looks like an obstacle in the way.',
  sg_intro_3: 'On your way here, how many times did you swerve around someone fallen so you wouldn’t lose your rhythm?',
  sg_q_3_0: 'Why didn’t you stop?', sg_o_3_0_U: 'I didn’t. And it weighs on me.', sg_o_3_0_Q: 'Doesn’t stopping for others slow the journey?', sg_o_3_0_F: 'I was winning. Stopping is losing.',
  sg_q_3_1: 'Who is your neighbor?', sg_o_3_1_U: 'Whoever is fallen in front of me.', sg_o_3_1_Q: 'How do I know who deserves help?', sg_o_3_1_F: 'Whoever can help me climb.',
  sg_q_3_2: 'And if helping costs you the win?', sg_o_3_2_U: 'The ship that shines again is worth more.', sg_o_3_2_Q: 'Is there a way to lose nothing?', sg_o_3_2_F: 'Then I don’t help.',
  sg_prompt_3: 'Say a word to the one who has fallen.', sg_reply_3_U: 'You stopped. That is what opens this layer.', sg_reply_3_Q: 'You ask who deserves it. The fallen do not ask.', sg_reply_3_F: 'Then rush past, like the others.',
  sg_after_3_U: 'Carry the fourth word in your chest.', sg_after_3_Q: 'Your neighbor will still cross your path.', sg_after_3_F: 'You passed. Alone.',
  sg_name_4: 'The Voice', sg_title_4: 'The Voice',
  sg_eco_4_0: 'A planet painted itself gold to look like a star. Inside, it was growing cold.', sg_eco_4_1: 'The Voice never shouts. Those who listen, listen closely.', sg_eco_4_2: 'Lies orbit fast and fall early. Truth orbits slowly and does not fall.', sg_eco_4_3: 'Someone traded their own name for applause. They forgot the name and the applause.', sg_eco_4_4: 'In the silence between two rings you can hear what you really are.',
  sg_intro_4: 'Here every word echoes forever. Be careful with what you say. What do you want me to believe about you?',
  sg_q_4_0: 'Have you ever pretended to be bigger?', sg_o_4_0_U: 'Yes. And I felt smaller.', sg_o_4_0_Q: 'Doesn’t everyone pretend a little?', sg_o_4_0_F: 'I never needed to pretend.',
  sg_q_4_1: 'What is truth?', sg_o_4_1_U: 'What still stands when no one is watching.', sg_o_4_1_Q: 'Is there only one truth?', sg_o_4_1_F: 'Whatever I decide it is.',
  sg_q_4_2: 'Why doesn’t the Voice shout?', sg_o_4_2_U: 'Because truth doesn’t need to.', sg_o_4_2_Q: 'Because no one would listen?', sg_o_4_2_F: 'Because it is weak.',
  sg_prompt_4: 'Say a word that echoes.', sg_reply_4_U: 'It echoed clean. You may pass.', sg_reply_4_Q: 'Your doubt is sincere, and that is a beginning of truth.', sg_reply_4_F: 'The echo comes back distorted. Face what it says.',
  sg_after_4_U: 'Take the fifth word.', sg_after_4_Q: 'Silence will keep teaching you.', sg_after_4_F: 'You beat the echo. The noise remains.',
  sg_name_5: 'The Watcher', sg_title_5: 'The Star That Waited',
  sg_eco_5_0: 'A young star wanted to shine before its time. It exploded early and became dust.', sg_eco_5_1: 'Another waited billions of years gathering light. Today it guides travelers.', sg_eco_5_2: 'Rings come at their rhythm, not yours. Whoever forces it hits the rim.', sg_eco_5_3: 'The Watcher does not count time. It counts the times it didn’t give up.', sg_eco_5_4: 'Hurry breaks the flow. Waiting builds it.',
  sg_intro_5: 'You ran hard to get here. Now I ask for the hardest thing: wait.',
  sg_q_5_0: 'How long would you wait?', sg_o_5_0_U: 'As long as it takes.', sg_o_5_0_Q: 'Wait for what, exactly?', sg_o_5_0_F: 'Not at all. Open now.',
  sg_q_5_1: 'What does waiting teach?', sg_o_5_1_U: 'That not everything depends on me.', sg_o_5_1_Q: 'Wouldn’t it be better to learn by doing?', sg_o_5_1_F: 'Nothing. It just wastes time.',
  sg_q_5_2: 'And if the rhythm of the rings changes?', sg_o_5_2_U: 'I follow it.', sg_o_5_2_Q: 'Why do they change?', sg_o_5_2_F: 'I impose mine.',
  sg_prompt_5: 'Leave a word and wait.', sg_reply_5_U: 'You waited. The way opened by itself.', sg_reply_5_Q: 'Asking is also waiting a little.', sg_reply_5_F: 'Then go, and meet the hurry on the other side.',
  sg_after_5_U: 'Take the sixth word, without hurry.', sg_after_5_Q: 'Time will still answer you.', sg_after_5_F: 'You won fast. You saw nothing.',
  sg_name_6: 'The Keeper', sg_title_6: 'The Lighthouse',
  sg_eco_6_0: 'The Keeper lights the lamp even for the ships that attacked it.', sg_eco_6_1: 'A pilot lost the way a thousand times. A thousand times the lighthouse stayed lit.', sg_eco_6_2: 'Light does not choose who deserves to come back.', sg_eco_6_3: 'Whoever has been lost knows the worth of a lit lamp.', sg_eco_6_4: 'Some sink out of pride. The lighthouse shines even for them.',
  sg_intro_6: 'You also failed many times. How many times were you allowed to try again?',
  sg_q_6_0: 'Why did you get another chance?', sg_o_6_0_U: 'Because someone kept the light on.', sg_o_6_0_Q: 'Wasn’t it just a game rule?', sg_o_6_0_F: 'Because I am good.',
  sg_q_6_1: 'And those who wronged you?', sg_o_6_1_U: 'They see the lighthouse too.', sg_o_6_1_Q: 'Do they deserve the same light?', sg_o_6_1_F: 'Let them stay in the dark.',
  sg_q_6_2: 'What would you do in my place?', sg_o_6_2_U: 'Keep it lit.', sg_o_6_2_Q: 'How would I decide who to shine for?', sg_o_6_2_F: 'Turn it off for enemies.',
  sg_prompt_6: 'Leave a word at the lighthouse.', sg_reply_6_U: 'The light recognized its own light. Go on.', sg_reply_6_Q: 'You weigh who deserves it. Light does not weigh.', sg_reply_6_F: 'Then cross the darkness you chose.',
  sg_after_6_U: 'Take the seventh word and keep it lit.', sg_after_6_Q: 'One day you will need the light.', sg_after_6_F: 'You crossed the dark. It stayed with you.',
  sg_name_7: 'The Servant', sg_title_7: 'The Hands',
  sg_eco_7_0: 'The greatest body is not the brightest. It is the one that holds the most orbits.', sg_eco_7_1: 'The Servant cleans the dust from rings others will pass through.', sg_eco_7_2: 'Whoever wants to be first, let them serve everyone.', sg_eco_7_3: 'There was a sun that spent itself warming planets. None of them called it weak.', sg_eco_7_4: 'Open hands cannot close into a fist.',
  sg_intro_7: 'Here, the one who leads is the one who serves. What do your hands know how to do?',
  sg_q_7_0: 'What are your hands for?', sg_o_7_0_U: 'To lift those who fell.', sg_o_7_0_Q: 'Isn’t serving for the weak?', sg_o_7_0_F: 'To win.',
  sg_q_7_1: 'Who is the greatest here?', sg_o_7_1_U: 'Whoever is serving right now.', sg_o_7_1_Q: 'Isn’t it whoever has the most stars?', sg_o_7_1_F: 'Whoever went the farthest.',
  sg_q_7_2: 'Would you clean the rings for another to pass?', sg_o_7_2_U: 'I already started.', sg_o_7_2_Q: 'And what do I get out of it?', sg_o_7_2_F: 'That is not my job.',
  sg_prompt_7: 'Offer a word.', sg_reply_7_U: 'Your hands have already opened the door.', sg_reply_7_Q: 'The question of gain still closes your fingers.', sg_reply_7_F: 'Then use the fist. See what it opens.',
  sg_after_7_U: 'Carry the eighth word in your hands.', sg_after_7_Q: 'Hands learn slowly.', sg_after_7_F: 'You won. Your hands are still closed.',
  sg_name_8: 'The Bearer', sg_title_8: 'The Weight',
  sg_eco_8_0: 'A ball tried to cross this layer carrying every trophy. It sank.', sg_eco_8_1: 'The Bearer holds the world and still floats. It does not carry alone.', sg_eco_8_2: 'Letting go is not losing. It is making room.', sg_eco_8_3: 'A feather crosses storms that topple mountains.', sg_eco_8_4: 'Some things can only be held with an open hand.',
  sg_intro_8: 'You are heavy. You carry victories, records, grudges and fears. None of it passes through here.',
  sg_q_8_0: 'What do you carry?', sg_o_8_0_U: 'More than I need.', sg_o_8_0_Q: 'If I let go, what is left of me?', sg_o_8_0_F: 'My achievements. They are mine.',
  sg_q_8_1: 'Why so afraid to let go?', sg_o_8_1_U: 'Because I thought I was what I carried.', sg_o_8_1_Q: 'Isn’t letting go giving up?', sg_o_8_1_F: 'I am not afraid.',
  sg_q_8_2: 'Who catches what you let go?', sg_o_8_2_U: 'I trust it doesn’t fall into the void.', sg_o_8_2_Q: 'Is someone bigger holding it?', sg_o_8_2_F: 'No one. That’s why I hold on.',
  sg_prompt_8: 'Let go of a word.', sg_reply_8_U: 'Lighter. Now you float.', sg_reply_8_Q: 'You have loosened your fingers. Now open them.', sg_reply_8_F: 'Then cross with all the weight.',
  sg_after_8_U: 'Take the ninth word, which weighs nothing.', sg_after_8_Q: 'The weight will still ask to stay.', sg_after_8_F: 'You arrived. Tired.',
  sg_name_9: 'The Builder', sg_title_9: 'The Invisible Bridge',
  sg_eco_9_0: 'Before the abyss, the Builder did not show the bridge. It only asked for the first step.', sg_eco_9_1: 'Whoever waits to see the whole bridge never crosses.', sg_eco_9_2: 'The light of the farthest stars has already left. You only need to trust it arrives.', sg_eco_9_3: 'A traveler crossed with eyes closed. Not because they were blind, but because they trusted the one who called.', sg_eco_9_4: 'Believing is not being unafraid. It is stepping forward with the fear along.',
  sg_intro_9: 'Ahead there is only darkness. The bridge is there, but you won’t see it before you step.',
  sg_q_9_0: 'Will you take the step?', sg_o_9_0_U: 'I will.', sg_o_9_0_Q: 'How do you prove the bridge exists?', sg_o_9_0_F: 'Only once I am certain.',
  sg_q_9_1: 'And if you fall?', sg_o_9_1_U: 'The one who called me here won’t let me fall.', sg_o_9_1_Q: 'Who catches me if I fall?', sg_o_9_1_F: 'Then this place is a lie.',
  sg_q_9_2: 'Why did you come this far, if you never saw the core?', sg_o_9_2_U: 'Because I trusted every light on the way.', sg_o_9_2_Q: 'Curiosity, maybe?', sg_o_9_2_F: 'Because I am strong.',
  sg_prompt_9: 'Say a word about the abyss.', sg_reply_9_U: 'The ground appeared beneath your step.', sg_reply_9_Q: 'Asking is looking at the bridge. Now step.', sg_reply_9_F: 'Then leap with your own strength.',
  sg_after_9_U: 'Take the tenth word.', sg_after_9_Q: 'The next abyss will ask you again.', sg_after_9_F: 'You crossed without a bridge. Alone, again.',
  sg_name_10: 'The Origin', sg_title_10: 'The Light We Came From',
  sg_eco_10_0: 'In the beginning there were no rings, no points, no records. There was a light that wanted to be shared.', sg_eco_10_1: 'Everything that shines borrowed a spark from it.', sg_eco_10_2: 'It asks for nothing in return. But it rejoices when the light is passed on.', sg_eco_10_3: 'The ten guardians were each a piece of the way back.', sg_eco_10_4: 'Whoever understands they are nothing discovers they are loved. Whoever is loved learns to love.',
  sg_intro_10: 'You crossed ten layers. Not to defeat me: to come back. Do you know what you are?',
  sg_q_10_0: 'What are you?', sg_o_10_0_U: 'Nothing, without the light I received.', sg_o_10_0_Q: 'Am I what I achieved?', sg_o_10_0_F: 'The greatest player in the universe.',
  sg_q_10_1: 'Why was so much light given to you?', sg_o_10_1_U: 'So that I pass it on.', sg_o_10_1_Q: 'So I could prove something?', sg_o_10_1_F: 'Because I earned it.',
  sg_q_10_2: 'What will you do with what you learned?', sg_o_10_2_U: 'Go back and help those still on the way.', sg_o_10_2_Q: 'I don’t know yet, and it scares me.', sg_o_10_2_F: 'Rule the leaderboard.',
  sg_q_10_3: 'And those who hurt you on the journey?', sg_o_10_3_U: 'They are called back too.', sg_o_10_3_Q: 'Do I really need to care about them?', sg_o_10_3_F: 'Let them stay behind.',
  sg_q_10_4: 'Then tell me: what holds everything together?', sg_o_10_4_U: 'Love.', sg_o_10_4_Q: 'Knowledge?', sg_o_10_4_F: 'Strength.',
  sg_prompt_10: 'In your own words, speak the way back.', sg_reply_10_U: 'You understood. There was nothing to defeat: there was someone to love, forgive and serve. Welcome back.', sg_reply_10_Q: 'You came close, and close is beautiful too. But you still search with your eyes, not your heart.', sg_reply_10_F: 'You came by strength. Strength arrives, but does not stay. Show me how far it goes.',
  sg_after_10_U: 'This light is now yours to give.', sg_after_10_Q: 'The journey goes on, and the light keeps waiting.', sg_after_10_F: 'You beat the game. The light still waits for you to understand it.'
});
Object.assign(HR.I18N.es, {
  singularity_screen_d: 'Once capas descienden hasta el centro. Cada una tiene un guardián. No se atraviesan solo con reflejos.', sg_prize: 'Premio misterioso', sg_prize_d: 'Guardado para la primera persona del mundo que cruce las 11 capas.',
  sg_layer_n: 'Capa {n}', sg_passage: 'Pasaje', sg_passage_n: 'Pasaje {n}/5', sg_trial: 'Prueba del Arconte', sg_talk: 'Conversar', sg_talk_again: 'Conversar de nuevo', sg_ecos: 'Ecos', sg_eco_found: 'ECO', sg_eco_title: 'Eco encontrado', sg_eco_missing: 'Un eco sigue perdido en este pasaje.', sg_words: 'Palabras', sg_word_new: 'Nueva palabra', sg_grace: 'GRACIA +1',
  sg_locked: 'Cruza la capa anterior.', sg_need_passage: 'Completa los 5 niveles del pasaje para hablar con el Arconte.', sg_need_talk: 'Habla con el Arconte antes de la Prueba.', sg_trial_req: 'El Arconte exige más fuerza para esta Prueba:', sg_reconcile: 'El Arconte volverá a hablar en {d} días o tras {f} intentos.', sg_reconcile_ready: 'El Arconte está dispuesto a escuchar de nuevo.',
  sg_passed: 'Cruzada', sg_path_level: 'Prueba: {w} oleadas · pasar {p} %', sg_send: 'Enviar', sg_message_ph: 'Escribe tu mensaje…', sg_continue: 'Continuar', sg_go_trial: 'Enfrentar la Prueba', sg_compose: 'Junta tres palabras que llevas y di el camino de vuelta.', sg_compose_none: 'No llevas ninguna palabra.', sg_endless: 'Singularidad sin fin',
  sg_epilogue_U: 'La luz que te trajo ahora pasa por ti. Ya no hay capas: hay gente en el camino. Vuelve y enciéndela.', sg_epilogue_Q: 'Llegaste al centro todavía preguntando. La luz no se ofende con preguntas: espera, como te esperó a ti.', sg_epilogue_F: 'Venciste a cada guardián con tus propias fuerzas. El centro está abierto. La luz sigue esperando que la entiendas.',
  t_light_servant: 'Siervo de la Luz', t_seeker: 'Buscador', t_conqueror: 'Conquistador',
  sg_word_humility: 'Humildad', sg_word_gratitude: 'Gratitud', sg_word_forgiveness: 'Perdón', sg_word_love: 'Amor', sg_word_truth: 'Verdad', sg_word_patience: 'Paciencia', sg_word_mercy: 'Misericordia', sg_word_service: 'Servir', sg_word_surrender: 'Entrega', sg_word_faith: 'Fe', sg_word_grace: 'Gracia',
  sg_name_0: 'El Reflejo', sg_title_0: 'El Espejo',
  sg_eco_0_0: 'Había una estrella que solo miraba su propio brillo. Un día se apagó y nadie lo notó: nunca había iluminado a nadie.', sg_eco_0_1: 'En el espejo del vacío, la bola vio todas las victorias que contaba. Detrás, vio también a todos los que habían abierto el camino.', sg_eco_0_2: 'Los aros no se inclinan ante los grandes. Se abren para quien pasa por el centro.', sg_eco_0_3: 'Un cometa gritó que era el más rápido. El silencio respondió con mil galaxias que nadie contaría jamás.', sg_eco_0_4: 'El Reflejo no pregunta cuánto ganaste. Pregunta qué ves cuando miras.',
  sg_intro_0: 'Llegaste al borde de lo que existe. Muchos llegan aquí llenos de sí. Dime, viajero: ¿quién eres?',
  sg_q_0_0: '¿Quién eres?', sg_o_0_0_U: 'Una luz pequeña, que llegó porque otros abrieron el camino.', sg_o_0_0_Q: 'No lo sé bien. ¿Por qué importa aquí?', sg_o_0_0_F: 'El que venció mil niveles. Merezco estar aquí.',
  sg_q_0_1: '¿Qué muestra el espejo?', sg_o_0_1_U: 'Muestra también a los que quedaron detrás de mí.', sg_o_0_1_Q: '¿Muestra lo que quiero ver o lo que soy?', sg_o_0_1_F: 'A un ganador.',
  sg_q_0_2: 'Si la puerta no se abre, ¿qué harás?', sg_o_0_2_U: 'Me agacharé y pasaré por el centro.', sg_o_0_2_Q: 'Intentaré entender por qué está cerrada.', sg_o_0_2_F: 'La cruzaré como sea.',
  sg_prompt_0: 'Deja una palabra ante el espejo.', sg_reply_0_U: 'Entonces viste. La puerta nunca fue alta: quien se agacha, pasa.', sg_reply_0_Q: 'Todavía buscas. Buscar ya es empezar a ver.', sg_reply_0_F: 'Solo ves tu propia luz. Mira, entonces, si basta.',
  sg_after_0_U: 'Lleva la primera palabra.', sg_after_0_Q: 'Un día volverás a este espejo con otros ojos.', sg_after_0_F: 'Venciste. Pero el espejo sigue mostrándote solo a ti.',
  sg_name_1: 'El Sembrador', sg_title_1: 'La Semilla',
  sg_eco_1_0: 'Un planeta pidió lluvia durante mil años. Cuando llegó, se quejó del ruido.', sg_eco_1_1: 'Toda luz que te llega salió de una estrella hace mucho. Algunas ya ni existen.', sg_eco_1_2: 'El Sembrador planta sin saber quién cosechará. Aun así, planta.', sg_eco_1_3: 'Una nebulosa guardó cada grano de polvo que recibió. De ella nacieron soles.', sg_eco_1_4: 'Quien cuenta solo lo que falta nunca termina la cuenta.',
  sg_intro_1: 'Todo lo que usaste para llegar aquí te fue dado: la bola, el camino, el aliento. ¿Qué llevas en las manos?',
  sg_q_1_0: '¿Qué recibiste en el camino?', sg_o_1_0_U: 'Luz de estrellas que ni conocí.', sg_o_1_0_Q: '¿Recibí? ¿De quién, si el esfuerzo fue mío?', sg_o_1_0_F: 'Nada. Lo conquisté todo solo.',
  sg_q_1_1: '¿Y qué falta todavía?', sg_o_1_1_U: 'Agradecer lo que ya llegó.', sg_o_1_1_Q: '¿Cómo saber si falta o si ya es suficiente?', sg_o_1_1_F: 'El premio que me deben.',
  sg_q_1_2: '¿Por qué plantar lo que otro cosechará?', sg_o_1_2_U: 'Porque alguien plantó para mí.', sg_o_1_2_Q: '¿Y quién garantiza que alguien cosechará?', sg_o_1_2_F: 'No tiene sentido. Yo planto para mí.',
  sg_prompt_1: 'Deja una palabra en la tierra.', sg_reply_1_U: 'La semilla reconoce la mano que la plantó. Sigue.', sg_reply_1_Q: 'Pregunta al suelo que te sostiene. Responde en silencio.', sg_reply_1_F: 'Solo ves la cosecha. Cosecha, entonces, lo que sembraste.',
  sg_after_1_U: 'Lleva la segunda palabra.', sg_after_1_Q: 'Lo que recibiste todavía te encontrará.', sg_after_1_F: 'Pasaste. Pero las manos siguen cerradas.',
  sg_name_2: 'El Acreedor', sg_title_2: 'La Deuda',
  sg_eco_2_0: 'Un rey perdonó la enorme deuda de un siervo. El siervo salió y le cobró con rabia una moneda a un amigo.', sg_eco_2_1: 'Dos estrellas chocaron hace miles de millones de años. Una aún guarda la cicatriz. La otra se volvió luz.', sg_eco_2_2: 'El peso que no sueltas lo cargas tú.', sg_eco_2_3: 'El Acreedor tiene un libro donde anota todo. Sus páginas están en blanco.', sg_eco_2_4: 'No todo aro que te golpeó lo hizo con maldad. Algunos solo estaban en el camino.',
  sg_intro_2: 'Muchos aros te hirieron hasta aquí. Tengo el libro de todas las deudas. ¿Cuál quieres cobrar?',
  sg_q_2_0: '¿Quién te debe?', sg_o_2_0_U: 'Nadie. A mí también me perdonaron.', sg_o_2_0_Q: '¿Es justo olvidar a quien me hirió?', sg_o_2_0_F: 'Todos los que me hicieron caer.',
  sg_q_2_1: '¿Y si quien te hirió pide pasar?', sg_o_2_1_U: 'Le abro el camino.', sg_o_2_1_Q: 'Depende. ¿Cambió?', sg_o_2_1_F: 'Que pague primero.',
  sg_q_2_2: '¿Qué hago con el libro?', sg_o_2_2_U: 'Deja las páginas en blanco.', sg_o_2_2_Q: '¿Por qué guardas un libro vacío?', sg_o_2_2_F: 'Léelo en voz alta para que todos sepan.',
  sg_prompt_2: 'Escribe una palabra en el libro.', sg_reply_2_U: 'La página sigue en blanco. Así se cruza.', sg_reply_2_Q: 'Estás cerca: la duda ya aflojó tu mano.', sg_reply_2_F: 'Entonces cada deuda será una piedra en tu camino.',
  sg_after_2_U: 'Lleva la tercera palabra, ligera.', sg_after_2_Q: 'Un día la mano se abre sola.', sg_after_2_F: 'Venciste las piedras. Aún las cargas todas.',
  sg_name_3: 'El Viajero', sg_title_3: 'El Viajero Caído',
  sg_eco_3_0: 'Una nave rota pedía ayuda en el vacío. Pasaron un cometa con prisa y un satélite importante. Se detuvo un asteroide sin nombre.', sg_eco_3_1: 'El asteroide compartió su calor hasta que la nave volvió a brillar. Se atrasó. Nadie recordó su nombre.', sg_eco_3_2: 'El prójimo no es quien está cerca de ti. Es a quien tú te acercas.', sg_eco_3_3: 'Ninguna órbita existe sola. Cada una se sostiene en la fuerza de otra.', sg_eco_3_4: 'El Viajero sigue buscando a alguien que se detenga. A veces parece un obstáculo en el camino.',
  sg_intro_3: 'Hasta aquí, ¿cuántas veces esquivaste a alguien caído para no perder el ritmo?',
  sg_q_3_0: '¿Por qué no te detuviste?', sg_o_3_0_U: 'No me detuve. Y me pesa.', sg_o_3_0_Q: '¿Detenerse por otros no retrasa el viaje?', sg_o_3_0_F: 'Iba ganando. Detenerse es perder.',
  sg_q_3_1: '¿Quién es tu prójimo?', sg_o_3_1_U: 'Quien está caído frente a mí.', sg_o_3_1_Q: '¿Cómo saber quién merece ayuda?', sg_o_3_1_F: 'Quien pueda ayudarme a subir.',
  sg_q_3_2: '¿Y si ayudar te cuesta la victoria?', sg_o_3_2_U: 'Vale más la nave que vuelve a brillar.', sg_o_3_2_Q: '¿Hay manera de no perder nada?', sg_o_3_2_F: 'Entonces no ayudo.',
  sg_prompt_3: 'Di una palabra a quien cayó.', sg_reply_3_U: 'Te detuviste. Eso abre esta capa.', sg_reply_3_Q: 'Preguntas quién lo merece. El caído no pregunta.', sg_reply_3_F: 'Entonces pasa corriendo, como los demás.',
  sg_after_3_U: 'Lleva la cuarta palabra en el pecho.', sg_after_3_Q: 'El prójimo todavía cruzará tu camino.', sg_after_3_F: 'Pasaste. Solo.',
  sg_name_4: 'La Voz', sg_title_4: 'La Voz',
  sg_eco_4_0: 'Un planeta se pintó de oro para parecer una estrella. Por dentro, se enfriaba.', sg_eco_4_1: 'La Voz nunca grita. Quien escucha, escucha de cerca.', sg_eco_4_2: 'Las mentiras orbitan rápido y caen pronto. La verdad orbita despacio y no cae.', sg_eco_4_3: 'Alguien cambió su nombre para ser aplaudido. Olvidó el nombre y el aplauso.', sg_eco_4_4: 'En el silencio entre dos aros se oye lo que realmente eres.',
  sg_intro_4: 'Aquí cada palabra resuena por la eternidad. Cuida lo que dices. ¿Qué quieres que crea de ti?',
  sg_q_4_0: '¿Alguna vez fingiste ser más grande?', sg_o_4_0_U: 'Sí. Y me sentí más pequeño.', sg_o_4_0_Q: '¿No finge todo el mundo un poco?', sg_o_4_0_F: 'Nunca necesité fingir.',
  sg_q_4_1: '¿Qué es la verdad?', sg_o_4_1_U: 'Lo que sigue en pie cuando nadie mira.', sg_o_4_1_Q: '¿Existe una sola verdad?', sg_o_4_1_F: 'Lo que yo decida.',
  sg_q_4_2: '¿Por qué la Voz no grita?', sg_o_4_2_U: 'Porque la verdad no lo necesita.', sg_o_4_2_Q: '¿Porque nadie escucharía?', sg_o_4_2_F: 'Porque es débil.',
  sg_prompt_4: 'Di una palabra que resuene.', sg_reply_4_U: 'Resonó limpia. Puedes pasar.', sg_reply_4_Q: 'Tu duda es sincera, y eso ya es comienzo de verdad.', sg_reply_4_F: 'El eco vuelve distorsionado. Enfrenta lo que dice.',
  sg_after_4_U: 'Lleva la quinta palabra.', sg_after_4_Q: 'El silencio seguirá enseñándote.', sg_after_4_F: 'Venciste el eco. El ruido sigue.',
  sg_name_5: 'La Vigía', sg_title_5: 'La Estrella que Esperó',
  sg_eco_5_0: 'Una estrella joven quiso brillar antes de tiempo. Explotó pronto y se volvió polvo.', sg_eco_5_1: 'Otra esperó miles de millones de años juntando luz. Hoy guía a los navegantes.', sg_eco_5_2: 'Los aros llegan a su ritmo, no al tuyo. Quien fuerza, golpea el borde.', sg_eco_5_3: 'La Vigía no cuenta el tiempo. Cuenta las veces que no se rindió.', sg_eco_5_4: 'La prisa rompe el flujo. La espera lo construye.',
  sg_intro_5: 'Corriste mucho para llegar aquí. Ahora te pido lo más difícil: espera.',
  sg_q_5_0: '¿Cuánto esperarías?', sg_o_5_0_U: 'El tiempo que haga falta.', sg_o_5_0_Q: '¿Esperar qué, exactamente?', sg_o_5_0_F: 'Nada. Ábrelo ya.',
  sg_q_5_1: '¿Qué se aprende esperando?', sg_o_5_1_U: 'Que no todo depende de mí.', sg_o_5_1_Q: '¿No sería mejor aprender haciendo?', sg_o_5_1_F: 'Nada. Solo se pierde tiempo.',
  sg_q_5_2: '¿Y si cambia el ritmo de los aros?', sg_o_5_2_U: 'Lo acompaño.', sg_o_5_2_Q: '¿Por qué cambian?', sg_o_5_2_F: 'Impongo el mío.',
  sg_prompt_5: 'Deja una palabra y espera.', sg_reply_5_U: 'Esperaste. El camino se abrió solo.', sg_reply_5_Q: 'Preguntar también es esperar un poco.', sg_reply_5_F: 'Entonces ve, y encuentra la prisa del otro lado.',
  sg_after_5_U: 'Lleva la sexta palabra, sin prisa.', sg_after_5_Q: 'El tiempo todavía te responderá.', sg_after_5_F: 'Venciste rápido. No viste nada.',
  sg_name_6: 'El Farero', sg_title_6: 'El Faro',
  sg_eco_6_0: 'El Farero enciende la luz también para las naves que lo atacaron.', sg_eco_6_1: 'Un piloto perdió el rumbo mil veces. Mil veces el faro siguió encendido.', sg_eco_6_2: 'La luz no elige quién merece volver.', sg_eco_6_3: 'Quien se ha perdido conoce el valor de una luz encendida.', sg_eco_6_4: 'Algunos naufragan por orgullo. El faro brilla incluso para ellos.',
  sg_intro_6: 'Tú también fallaste muchas veces. ¿Cuántas veces pudiste intentarlo de nuevo?',
  sg_q_6_0: '¿Por qué recibiste otra oportunidad?', sg_o_6_0_U: 'Porque alguien mantuvo la luz encendida.', sg_o_6_0_Q: '¿No fue solo una regla del juego?', sg_o_6_0_F: 'Porque soy bueno.',
  sg_q_6_1: '¿Y quien falló contra ti?', sg_o_6_1_U: 'También ve el faro.', sg_o_6_1_Q: '¿Merece la misma luz?', sg_o_6_1_F: 'Que se quede a oscuras.',
  sg_q_6_2: '¿Qué harías en mi lugar?', sg_o_6_2_U: 'La dejaría encendida.', sg_o_6_2_Q: '¿Cómo decidir para quién brillar?', sg_o_6_2_F: 'La apagaría para los enemigos.',
  sg_prompt_6: 'Deja una palabra en el faro.', sg_reply_6_U: 'La luz reconoció su propia luz. Sigue.', sg_reply_6_Q: 'Pesas quién lo merece. La luz no pesa.', sg_reply_6_F: 'Entonces cruza la oscuridad que elegiste.',
  sg_after_6_U: 'Lleva la séptima palabra y mantenla encendida.', sg_after_6_Q: 'Un día necesitarás la luz.', sg_after_6_F: 'Cruzaste la oscuridad. Se quedó contigo.',
  sg_name_7: 'El Siervo', sg_title_7: 'Las Manos',
  sg_eco_7_0: 'El mayor de los astros no es el que más brilla. Es el que sostiene más órbitas.', sg_eco_7_1: 'El Siervo limpia el polvo de los aros por donde otros pasarán.', sg_eco_7_2: 'Quien quiera ser el primero, que sirva a todos.', sg_eco_7_3: 'Hubo un sol que se gastó calentando planetas. Ninguno lo llamó débil.', sg_eco_7_4: 'Las manos abiertas no pueden cerrarse en puño.',
  sg_intro_7: 'Aquí manda quien sirve. ¿Qué saben hacer tus manos?',
  sg_q_7_0: '¿Para qué sirven tus manos?', sg_o_7_0_U: 'Para levantar a quien cayó.', sg_o_7_0_Q: '¿Servir no es para los débiles?', sg_o_7_0_F: 'Para vencer.',
  sg_q_7_1: '¿Quién es el mayor aquí?', sg_o_7_1_U: 'Quien está sirviendo ahora.', sg_o_7_1_Q: '¿No es quien tiene más estrellas?', sg_o_7_1_F: 'Quien llegó más lejos.',
  sg_q_7_2: '¿Limpiarías los aros para que otro pase?', sg_o_7_2_U: 'Ya empecé.', sg_o_7_2_Q: '¿Y qué gano con eso?', sg_o_7_2_F: 'No es mi función.',
  sg_prompt_7: 'Ofrece una palabra.', sg_reply_7_U: 'Tus manos ya abrieron la puerta.', sg_reply_7_Q: 'La pregunta por la ganancia todavía cierra tus dedos.', sg_reply_7_F: 'Entonces usa el puño. Mira lo que abre.',
  sg_after_7_U: 'Lleva la octava palabra en las manos.', sg_after_7_Q: 'Las manos aprenden despacio.', sg_after_7_F: 'Venciste. Las manos siguen cerradas.',
  sg_name_8: 'El Portador', sg_title_8: 'El Peso',
  sg_eco_8_0: 'Una bola intentó cruzar la capa llevando todos sus trofeos. Se hundió.', sg_eco_8_1: 'El Portador sostiene el mundo y, aun así, flota. No carga solo.', sg_eco_8_2: 'Soltar no es perder. Es hacer espacio.', sg_eco_8_3: 'La pluma atraviesa tormentas que derriban montañas.', sg_eco_8_4: 'Hay cosas que solo se sostienen con la mano abierta.',
  sg_intro_8: 'Vienes pesado. Traes victorias, récords, rencores y miedos. Nada de eso pasa por aquí.',
  sg_q_8_0: '¿Qué cargas?', sg_o_8_0_U: 'Más de lo que necesito.', sg_o_8_0_Q: 'Si suelto, ¿qué queda de mí?', sg_o_8_0_F: 'Mis logros. Son míos.',
  sg_q_8_1: '¿Por qué tanto miedo a soltar?', sg_o_8_1_U: 'Porque creí que yo era lo que cargaba.', sg_o_8_1_Q: '¿Soltar no es rendirse?', sg_o_8_1_F: 'No tengo miedo.',
  sg_q_8_2: '¿Quién sostiene lo que sueltes?', sg_o_8_2_U: 'Confío en que no cae al vacío.', sg_o_8_2_Q: '¿Hay alguien más grande sosteniéndolo?', sg_o_8_2_F: 'Nadie. Por eso lo sostengo.',
  sg_prompt_8: 'Suelta una palabra.', sg_reply_8_U: 'Más ligero. Ahora flotas.', sg_reply_8_Q: 'Ya aflojaste los dedos. Falta abrir.', sg_reply_8_F: 'Entonces cruza con todo el peso.',
  sg_after_8_U: 'Lleva la novena palabra, que no pesa nada.', sg_after_8_Q: 'El peso todavía pedirá quedarse.', sg_after_8_F: 'Llegaste. Cansado.',
  sg_name_9: 'El Constructor', sg_title_9: 'El Puente Invisible',
  sg_eco_9_0: 'Ante el abismo, el Constructor no mostró el puente. Solo pidió el primer paso.', sg_eco_9_1: 'Quien espera ver el puente entero nunca cruza.', sg_eco_9_2: 'La luz de las estrellas más lejanas ya salió. Basta confiar en que llega.', sg_eco_9_3: 'Un viajero cruzó con los ojos cerrados. No porque fuera ciego, sino porque confiaba en quien lo llamaba.', sg_eco_9_4: 'Creer no es no tener miedo. Es dar el paso con el miedo al lado.',
  sg_intro_9: 'Delante solo hay oscuridad. El puente está ahí, pero no lo verás antes de pisar.',
  sg_q_9_0: '¿Darás el paso?', sg_o_9_0_U: 'Sí.', sg_o_9_0_Q: '¿Cómo pruebas que el puente existe?', sg_o_9_0_F: 'Solo cuando esté seguro.',
  sg_q_9_1: '¿Y si caes?', sg_o_9_1_U: 'Quien me llamó hasta aquí no me deja caer.', sg_o_9_1_Q: '¿Quién me sostiene si caigo?', sg_o_9_1_F: 'Entonces este lugar es mentira.',
  sg_q_9_2: '¿Por qué llegaste hasta aquí si nunca viste el centro?', sg_o_9_2_U: 'Porque confié en cada luz del camino.', sg_o_9_2_Q: '¿Por curiosidad, tal vez?', sg_o_9_2_F: 'Porque soy fuerte.',
  sg_prompt_9: 'Di una palabra sobre el abismo.', sg_reply_9_U: 'El suelo apareció bajo tu paso.', sg_reply_9_Q: 'Preguntar es mirar el puente. Falta pisar.', sg_reply_9_F: 'Entonces salta con tus fuerzas.',
  sg_after_9_U: 'Lleva la décima palabra.', sg_after_9_Q: 'El próximo abismo te preguntará de nuevo.', sg_after_9_F: 'Cruzaste sin puente. Solo, otra vez.',
  sg_name_10: 'El Origen', sg_title_10: 'La Luz de Donde Venimos',
  sg_eco_10_0: 'Al principio no había aros, ni puntos, ni récords. Había una luz que quería ser compartida.', sg_eco_10_1: 'Todo lo que brilla tomó prestada una chispa de ella.', sg_eco_10_2: 'No pide nada a cambio. Pero se alegra cuando la luz se pasa a otros.', sg_eco_10_3: 'Los diez guardianes fueron, cada uno, un tramo del camino de vuelta.', sg_eco_10_4: 'Quien entiende que no es nada descubre que es amado. Quien es amado aprende a amar.',
  sg_intro_10: 'Cruzaste diez capas. No para vencerme: para volver. ¿Sabes lo que eres?',
  sg_q_10_0: '¿Qué eres?', sg_o_10_0_U: 'Nada, sin la luz que recibí.', sg_o_10_0_Q: '¿Soy lo que conquisté?', sg_o_10_0_F: 'El mejor jugador del universo.',
  sg_q_10_1: '¿Por qué se te dio tanta luz?', sg_o_10_1_U: 'Para que la pase a otros.', sg_o_10_1_Q: '¿Para demostrar algo?', sg_o_10_1_F: 'Porque lo merecí.',
  sg_q_10_2: '¿Qué harás con lo que aprendiste?', sg_o_10_2_U: 'Volver y ayudar a quien sigue en el camino.', sg_o_10_2_Q: 'Aún no lo sé, y eso me asusta.', sg_o_10_2_F: 'Dominar el ranking.',
  sg_q_10_3: '¿Y quienes te hirieron en el viaje?', sg_o_10_3_U: 'También son llamados de vuelta.', sg_o_10_3_Q: '¿De verdad debo preocuparme por ellos?', sg_o_10_3_F: 'Que se queden atrás.',
  sg_q_10_4: 'Entonces dime: ¿qué lo sostiene todo?', sg_o_10_4_U: 'El amor.', sg_o_10_4_Q: '¿El conocimiento?', sg_o_10_4_F: 'La fuerza.',
  sg_prompt_10: 'Di, con tus palabras, el camino de vuelta.', sg_reply_10_U: 'Entendiste. No había nada que vencer: había a quien amar, perdonar y servir. Bienvenido de vuelta.', sg_reply_10_Q: 'Llegaste cerca, y cerca también es hermoso. Pero todavía buscas con los ojos, no con el corazón.', sg_reply_10_F: 'Llegaste por la fuerza. La fuerza llega, pero no se queda. Muestra, entonces, hasta dónde llega.',
  sg_after_10_U: 'Esta luz ahora es tuya para dar.', sg_after_10_Q: 'El viaje sigue, y la luz sigue esperando.', sg_after_10_F: 'Venciste el juego. La luz todavía espera que la entiendas.'
});
