/* =====================================================================
   ORBO v7 — Os 33 fragmentos.

   Faisca acorda sem lembrar de nada. Cada fragmento e um pedaco dela que
   volta, e ela so volta inteira quem procurou: 26 vem da campanha, 7 so por
   segredo. Da para ver um final com 26. O mural so fecha com os 33.

   Regra do texto: DUAS FRASES, no maximo. O peso fica na imagem e no que a
   frase implica, nunca no tamanho dela.

   Cada fragmento aponta para um arranjo de js/frag-scenes.js e traz os
   parametros do desenho. "lavada" vai de 1 (sem cor nenhuma) a 0 (inteira):
   os primeiros fragmentos sao quase brancos e o fim tem a bola completa.

   API: HR.Frag.has(id) · unlock(id) · count() · TOTAL · check(evento, dados)
   ===================================================================== */
window.HR = window.HR || {};

/* cor por ato: I frio e lavado · II quente · III fundo e contrastado */
HR.FRAGMENTS = [
  /* ---------------- ATO I — ACORDAR ---------------- */
  { id: 'giro',      ato: 1, cena: 'giro',      p: { cor: '#4cf0ff', lavada: 1.0 },  t: { k: 'fase', v: '1-1-1' } },
  { id: 'faltava',   ato: 1, cena: 'faltava',   p: { cor: '#4cf0ff', lavada: 0.95 }, t: { k: 'perfeitos', v: 20 } },
  { id: 'escuro',    ato: 1, cena: 'escuro',    p: { cor: '#5aa9ff', lavada: 0.92 }, t: { k: 'queda', v: 1 } },
  { id: 'cinza',     ato: 1, cena: 'cinza',     p: { cor: '#5aa9ff', lavada: 0.9 },  t: { k: 'mural', v: 1 } },
  { id: 'apelido',   ato: 1, cena: 'apelido',   p: { cor: '#4cf0ff', palavraK: 'fr_pal_faisca' }, t: { k: 'sistema', v: '1-1' } },
  { id: 'berco',     ato: 1, cena: 'berco',     p: { cor: '#4cf0ff', lavada: 0.88 }, t: { k: 'galaxia', v: 0 } },
  { id: 'maisnovo',  ato: 1, cena: 'maisnovo',  p: { cor: '#5aa9ff' },               t: { k: 'sistema', v: '2-3' } },
  { id: 'naofecha',  ato: 1, cena: 'naofecha',  p: { cor: '#ffcf4a' },               t: { k: 'perfeitos', v: 100 } },
  { id: 'dois',      ato: 1, cena: 'dois',      p: { cor: '#5aa9ff', afast: 0.24, lavada: 0.85 }, t: { k: 'galaxia', v: 1 } },

  /* ---------------- ATO II — LEMBRAR ---------------- */
  { id: 'mesmodia',  ato: 2, cena: 'mesmodia',  p: { cor: '#7cff6b' },               t: { k: 'sistema', v: '3-2' } },
  { id: 'instante',  ato: 2, cena: 'instante',  p: { cor: '#ff9f43' },               t: { k: 'sistema', v: '4-1' } },
  { id: 'quente',    ato: 2, cena: 'quente',    p: { cor: '#ff9f43', lavada: 0.7 },  t: { k: 'egide', v: 1 } },
  { id: 'delonge',   ato: 2, cena: 'delonge',   p: { cor: '#a29bfe', lavada: 0.65, curva: 16 }, t: { k: 'galaxia', v: 4 } },
  { id: 'quemsegur', ato: 2, cena: 'quemsegur', p: { cor: '#a29bfe', lavada: 0.6 },  t: { k: 'sistema', v: '5-8' } },
  { id: 'contempla', ato: 2, cena: 'contempla', p: { cor: '#20304f' },               t: { k: 'segredo', v: 'contempla' } },
  { id: 'pontoazul', ato: 2, cena: 'pontoazul', p: { cor: '#20304f' },               t: { k: 'segredo', v: 'pontoazul' } },
  { id: 'espiral',   ato: 2, cena: 'espiral',   p: { cor: '#ff7ad9', bracos: 4 },    t: { k: 'galaxia', v: 5 } },
  { id: 'eraeu',     ato: 2, cena: 'eraeu',     p: { cor: '#ffd93d', palavraK: 'fr_pal_faisca' }, t: { k: 'sistema', v: '7-1' } },
  { id: 'fechando',  ato: 2, cena: 'fechando',  p: { cor: '#ffd93d', lavada: 0.5, fecha: 0.42 }, t: { k: 'sistema', v: '7-6' } },
  { id: 'queeuabri', ato: 2, cena: 'queeuabri', p: { cor: '#ffd93d', lavada: 0.45 }, t: { k: 'galaxia', v: 6 } },
  { id: 'ninho',     ato: 2, cena: 'ninho',     p: { cor: '#7cff6b', lavada: 0.55 }, t: { k: 'segredo', v: 'ninho' } },

  /* ---------------- ATO III — ESCOLHER ---------------- */
  { id: 'asmarcas',  ato: 3, cena: 'asmarcas',  p: { cor: '#5b6cff' },               t: { k: 'sistema', v: '8-1' } },
  { id: 'letradele', ato: 3, cena: 'letradele', p: { cor: '#cfe4ff' },               t: { k: 'sistema', v: '8-5' } },
  { id: 'letradela', ato: 3, cena: 'letradela', p: { cor: '#c9b4ff' },               t: { k: 'sistema', v: '8-7' } },
  { id: 'juntosant', ato: 3, cena: 'juntosant', p: { cor: '#ffb08a' },               t: { k: 'galaxia', v: 7 } },
  { id: 'paraeu',    ato: 3, cena: 'paraeu',    p: { cor: '#ff5ecf', afast: 0.19, lavada: 0.2 }, t: { k: 'sistema', v: '9-6' } },
  { id: 'opreco',    ato: 3, cena: 'opreco',    p: { cor: '#ff5ecf', afast: 0.22 },  t: { k: 'galaxia', v: 8 } },
  { id: 'muitasmaos',ato: 3, cena: 'muitasmaos',p: { cor: '#ffcf4a', lavada: 0.25 }, t: { k: 'segredo', v: 'muitasmaos' } },
  { id: 'costura',   ato: 3, cena: 'costura',   p: { cor: '#7cff6b', lavada: 0.3 },  t: { k: 'segredo', v: 'costura' } },
  { id: 'aporta',    ato: 3, cena: 'aporta',    p: { cor: '#ffcf4a', lavada: 0.15 }, t: { k: 'singularidade', v: 1 } },

  /* ---------------- DEPOIS DO FIM ---------------- */
  { id: 'nomeinteir',ato: 4, cena: 'nomeinteir',p: { cor: '#ffcf4a', palavraK: 'fr_pal_orbo' }, t: { k: 'final', v: 1 } },
  { id: 'oqueficou', ato: 4, cena: 'oqueficou', p: { cor: '#ffcf4a', lavada: 0 },    t: { k: 'final', v: 2 } },
  { id: 'todasmaos', ato: 4, cena: 'todasmaos', p: { cor: '#ffffff' },               t: { k: 'final', v: 4 } }
];

HR.Frag = {
  TOTAL: HR.FRAGMENTS.length,
  def(id) { return HR.FRAGMENTS.find(f => f.id === id); },
  _d() { const d = HR.Store.data; if (!d.frags) d.frags = []; return d.frags; },
  has(id) { return this._d().indexOf(id) >= 0; },
  count() { return this._d().length; },
  // 0..1 — e isto que devolve a cor da bola de Faisca
  inteira() { return this.count() / this.TOTAL; },
  novos() { const d = HR.Store.data; return d.fragsNovos || []; },
  verNovo(id) { const d = HR.Store.data; d.fragsNovos = (d.fragsNovos || []).filter(x => x !== id); HR.Store.save(); },

  unlock(id) {
    if (!this.def(id) || this.has(id)) return false;
    const d = HR.Store.data;
    this._d().push(id);
    d.fragsNovos = (d.fragsNovos || []).concat([id]);
    HR.Store.save();
    if (HR.Analytics) HR.Analytics.log('fragment', { id });
    if (HR.UI && HR.UI.fragPopup) HR.UI.fragPopup(id);
    return true;
  },

  // check('galaxia', 3) · check('perfeitos', 120) · check('segredo', 'ninho')
  check(tipo, valor) {
    let mudou = false;
    HR.FRAGMENTS.forEach(f => {
      if (f.t.k !== tipo || this.has(f.id)) return;
      const ok = typeof f.t.v === 'number' ? (+valor >= f.t.v) : (String(valor) === String(f.t.v));
      if (ok) mudou = this.unlock(f.id) || mudou;
    });
    return mudou;
  },

  // varre o que ja aconteceu: usado ao abrir o jogo e ao terminar uma fase
  sync() {
    const d = HR.Store.data, st = d.stats || {};
    this.check('perfeitos', d.totalPerfects || 0);
    if (HR.Campaign) {
      for (let ri = 0; ri < 10; ri++) if (HR.Campaign.regionState && HR.Campaign.regionState(ri) === 'done') this.check('galaxia', ri);
      for (let ri = 0; ri < 10; ri++) for (let si = 0; si < 10; si++) {
        if (HR.Campaign.systemBossBeaten && HR.Campaign.systemBossBeaten(ri, si)) this.check('sistema', (ri + 1) + '-' + (si + 1));
      }
      if ((d.campaign && d.campaign.stars && d.campaign.stars['1-1-1'] > 0)) this.check('fase', '1-1-1');
    }
    if ((st.revives || d.revives || 0) > 0 || (st.deaths || 0) > 0) this.check('queda', 1);
    if ((d.stats5 || {}).aegisSaves > 0) this.check('egide', 1);
    if (HR.Singularity && HR.Singularity.passedCount && HR.Singularity.passedCount() > 0) this.check('singularidade', 1);
    this.check('final', (d.finais || []).length);
  }
};

/* ---------------- texto ---------------- */
Object.assign(HR.I18N.pt, {
  fr_pal_faisca: 'FAÍSCA', fr_pal_orbo: 'ORBO',
  alb_frags: 'Fragmentos',
  frag_titulo: 'Fragmentos', frag_sub: 'O que ela lembra',
  frag_de: '{a} de {b}', frag_novo: 'FRAGMENTO', frag_onde: 'Onde',
  frag_bloq: 'Ainda não lembra', frag_segredo: 'Nada aqui',
  frag_dica: 'Ela lembra fazendo. Jogue e ela volta.',
  frag_completo: 'Ela voltou inteira.',

  fr_giro: 'O primeiro giro',
  fr_giro_1: 'Ela girou antes de saber que estava girando.', fr_giro_2: 'Foi a primeira coisa que soube fazer.', fr_giro_o: 'Fase 1-1-1',
  fr_faltava: 'Faltava alguém',
  fr_faltava_1: 'Não lembrava de ninguém.', fr_faltava_2: 'Mas o lugar ao lado estava vazio de um jeito específico.', fr_faltava_o: '20 arcos perfeitos',
  fr_escuro: 'O escuro não é vazio',
  fr_escuro_1: 'Ela caiu, e o escuro segurou.', fr_escuro_2: 'Não machucou.', fr_escuro_o: 'Cair e continuar',
  fr_cinza: 'Cinza',
  fr_cinza_1: 'Ela se viu pela primeira vez.', fr_cinza_2: 'Não tinha cor nenhuma, e isso pareceu errado.', fr_cinza_o: 'Abrir os Fragmentos',
  fr_apelido: 'O nome pequeno',
  fr_apelido_1: 'Alguém, em algum lugar, a chamava assim.', fr_apelido_2: 'Ela não lembra quem.', fr_apelido_o: 'Sistema 1-1',
  fr_berco: 'Berço',
  fr_berco_1: 'Este lugar tem cheiro de coisa nova.', fr_berco_2: 'Como se ninguém tivesse usado antes dela.', fr_berco_o: 'Galáxia 1',
  fr_maisnovo: 'Mais novo que eu',
  fr_maisnovo_1: 'A maré disse a idade que tinha.', fr_maisnovo_2: 'Era menor que a dela.', fr_maisnovo_o: 'Sistema 2-3',
  fr_naofecha: 'A mão que não fecha',
  fr_naofecha_1: 'Todo anel tem um arranhão no mesmo lugar.', fr_naofecha_2: 'Como se alguém segurasse para ele não fechar.', fr_naofecha_o: '100 arcos perfeitos',
  fr_dois: 'Dois',
  fr_dois_1: 'Ela sonhou com duas luzes.', fr_dois_2: 'Uma acesa por dentro, outra acesa nas beiradas.', fr_dois_o: 'Galáxia 2',

  fr_mesmodia: 'Tudo no mesmo dia',
  fr_mesmodia_1: 'As coisas do jardim nasceram todas juntas.', fr_mesmodia_2: 'Nenhuma é mais velha que a outra.', fr_mesmodia_o: 'Sistema 3-2',
  fr_instante: 'O instante',
  fr_instante_1: 'Houve um instante em que não havia nada.', fr_instante_2: 'Tudo daqui começou nele.', fr_instante_o: 'Sistema 4-1',
  fr_quente: 'Quente',
  fr_quente_1: 'Antes do instante havia calor.', fr_quente_2: 'Ela lembra de estar dentro de alguma coisa.', fr_quente_o: 'Ser salva pela Égide',
  fr_delonge: 'De longe',
  fr_delonge_1: 'Viu uma linha no céu que não era estrela.', fr_delonge_2: 'Doeu olhar.', fr_delonge_o: 'Galáxia 5',
  fr_quemsegur: 'Quem segurava',
  fr_quemsegur_1: 'Duas mãos, uma de cada lado da linha.', fr_quemsegur_2: 'Ela não lembra o rosto de nenhuma.', fr_quemsegur_o: 'Sistema 5-8',
  fr_contempla: 'A contemplação',
  fr_contempla_1: 'Encontrou quem não pode ajudar em nada.', fr_contempla_2: 'E mesmo assim olha para cima.', fr_contempla_o: '?',
  fr_pontoazul: 'O ponto azul',
  fr_pontoazul_1: 'Um ponto azul, pequeno, cheio de gente olhando.', fr_pontoazul_2: 'São os únicos que poderiam saber.', fr_pontoazul_o: '?',
  fr_espiral: 'Espiral',
  fr_espiral_1: 'A galáxia girava como algo que já girou muito.', fr_espiral_2: 'E ainda assim era nova.', fr_espiral_o: 'Galáxia 6',
  fr_eraeu: 'O instante era eu',
  fr_eraeu_1: 'O instante tinha um nome.', fr_eraeu_2: 'O nome era o dela.', fr_eraeu_o: 'Sistema 7-1',
  fr_fechando: 'Está fechando',
  fr_fechando_1: 'A linha no céu está menor do que estava.', fr_fechando_2: 'Devagar, mas está.', fr_fechando_o: 'Sistema 7-6',
  fr_queeuabri: 'O que eu abri',
  fr_queeuabri_1: 'Se o instante foi ela, o espaço também foi.', fr_queeuabri_2: 'Tudo isto cabe numa coisa que ela fez sem querer.', fr_queeuabri_o: 'Galáxia 7',
  fr_ninho: 'O Ninho',
  fr_ninho_1: 'Há um lugar onde nada pode dar errado.', fr_ninho_2: 'Ela ficou mais do que precisava.', fr_ninho_o: '?',

  fr_asmarcas: 'As marcas',
  fr_asmarcas_1: 'Casco leu os anéis em voz alta.', fr_asmarcas_2: 'Não eram obstáculos: eram recados.', fr_asmarcas_o: 'Sistema 8-1',
  fr_letradele: 'A letra dele',
  fr_letradele_1: 'A marca de um lado é firme e funda.', fr_letradele_2: 'Quem fez, fez com força.', fr_letradele_o: 'Sistema 8-5',
  fr_letradela: 'A letra dela',
  fr_letradela_1: 'A do outro lado é leve e não termina.', fr_letradela_2: 'Como quem escreve com pressa para não esquecer.', fr_letradela_o: 'Sistema 8-7',
  fr_juntosant: 'Juntos antes',
  fr_juntosant_1: 'Eles eram um.', fr_juntosant_2: 'Ela lembra do escuro morno de antes de haver espaço.', fr_juntosant_o: 'Galáxia 8',
  fr_paraeu: 'Para eu existir',
  fr_paraeu_1: 'Um não vira dois sozinho.', fr_paraeu_2: 'Alguém tem que querer.', fr_paraeu_o: 'Sistema 9-6',
  fr_opreco: 'O preço',
  fr_opreco_1: 'Se os dois se encostarem de novo, o espaço fecha.', fr_opreco_2: 'E tudo que está dentro fecha junto.', fr_opreco_o: 'Galáxia 9',
  fr_muitasmaos: 'Muitas mãos',
  fr_muitasmaos_1: 'Ela não veio sozinha.', fr_muitasmaos_2: 'Nunca tinha reparado nisso.', fr_muitasmaos_o: '?',
  fr_costura: 'A costura',
  fr_costura_1: 'Há um fio atravessando tudo.', fr_costura_2: 'Dá para segui-lo sem soltar.', fr_costura_o: '?',
  fr_aporta: 'A porta',
  fr_aporta_1: 'O fim do caminho é uma porta.', fr_aporta_2: 'Do outro lado, duas luzes paradas.', fr_aporta_o: 'Chegar à Singularidade',

  fr_nomeinteir: 'O nome inteiro',
  fr_nomeinteir_1: 'Faísca era o apelido.', fr_nomeinteir_2: 'O nome é o que gira em volta de algo maior que si.', fr_nomeinteir_o: 'Ver um final',
  fr_oqueficou: 'O que ficou',
  fr_oqueficou_1: 'Ela voltou com cor.', fr_oqueficou_2: 'Foi preciso ir duas vezes para ver as duas metades.', fr_oqueficou_o: 'Ver dois finais',
  fr_todasmaos: 'Todas as mãos',
  fr_todasmaos_1: 'Os quatro caminhos levam ao mesmo lugar.', fr_todasmaos_2: 'A diferença é quem chega junto.', fr_todasmaos_o: 'Ver os quatro finais'
});

Object.assign(HR.I18N.en, {
  fr_pal_faisca: 'SPARK', fr_pal_orbo: 'ORBO',
  alb_frags: 'Fragments',
  frag_titulo: 'Fragments', frag_sub: 'What she remembers',
  frag_de: '{a} of {b}', frag_novo: 'FRAGMENT', frag_onde: 'Where',
  frag_bloq: 'She does not remember yet', frag_segredo: 'Nothing here',
  frag_dica: 'She remembers by doing. Play and she comes back.',
  frag_completo: 'She came back whole.',

  fr_giro: 'The first spin',
  fr_giro_1: 'She spun before she knew she was spinning.', fr_giro_2: 'It was the first thing she knew how to do.', fr_giro_o: 'Level 1-1-1',
  fr_faltava: 'Someone was missing',
  fr_faltava_1: 'She remembered no one.', fr_faltava_2: 'But the space beside her was empty in a specific way.', fr_faltava_o: '20 perfect rings',
  fr_escuro: 'The dark is not empty',
  fr_escuro_1: 'She fell, and the dark held.', fr_escuro_2: 'It did not hurt.', fr_escuro_o: 'Fall and go on',
  fr_cinza: 'Grey',
  fr_cinza_1: 'She saw herself for the first time.', fr_cinza_2: 'She had no colour at all, and that felt wrong.', fr_cinza_o: 'Open the Fragments',
  fr_apelido: 'The small name',
  fr_apelido_1: 'Someone, somewhere, called her that.', fr_apelido_2: 'She does not remember who.', fr_apelido_o: 'System 1-1',
  fr_berco: 'Cradle',
  fr_berco_1: 'This place smells of something new.', fr_berco_2: 'As if no one had used it before her.', fr_berco_o: 'Galaxy 1',
  fr_maisnovo: 'Younger than me',
  fr_maisnovo_1: 'The tide told her how old it was.', fr_maisnovo_2: 'It was younger than she is.', fr_maisnovo_o: 'System 2-3',
  fr_naofecha: 'The hand that will not close',
  fr_naofecha_1: 'Every ring has a scratch in the same place.', fr_naofecha_2: 'As if someone held it open.', fr_naofecha_o: '100 perfect rings',
  fr_dois: 'Two',
  fr_dois_1: 'She dreamed of two lights.', fr_dois_2: 'One lit inside, one lit at the edges.', fr_dois_o: 'Galaxy 2',

  fr_mesmodia: 'All on the same day',
  fr_mesmodia_1: 'Everything in the garden was born together.', fr_mesmodia_2: 'None of it is older than the rest.', fr_mesmodia_o: 'System 3-2',
  fr_instante: 'The instant',
  fr_instante_1: 'There was an instant when there was nothing.', fr_instante_2: 'Everything here started in it.', fr_instante_o: 'System 4-1',
  fr_quente: 'Warm',
  fr_quente_1: 'Before the instant there was warmth.', fr_quente_2: 'She remembers being inside something.', fr_quente_o: 'Be saved by the Aegis',
  fr_delonge: 'From far away',
  fr_delonge_1: 'She saw a line in the sky that was not a star.', fr_delonge_2: 'It hurt to look.', fr_delonge_o: 'Galaxy 5',
  fr_quemsegur: 'Who was holding',
  fr_quemsegur_1: 'Two hands, one on each side of the line.', fr_quemsegur_2: 'She remembers neither face.', fr_quemsegur_o: 'System 5-8',
  fr_contempla: 'The contemplation',
  fr_contempla_1: 'She found the ones who can help with nothing.', fr_contempla_2: 'And who look up anyway.', fr_contempla_o: '?',
  fr_pontoazul: 'The blue dot',
  fr_pontoazul_1: 'A blue dot, small, full of people looking.', fr_pontoazul_2: 'They are the only ones who could ever know.', fr_pontoazul_o: '?',
  fr_espiral: 'Spiral',
  fr_espiral_1: 'The galaxy turned like something that has turned a long time.', fr_espiral_2: 'And it was still new.', fr_espiral_o: 'Galaxy 6',
  fr_eraeu: 'The instant was me',
  fr_eraeu_1: 'The instant had a name.', fr_eraeu_2: 'The name was hers.', fr_eraeu_o: 'System 7-1',
  fr_fechando: 'It is closing',
  fr_fechando_1: 'The line in the sky is smaller than it was.', fr_fechando_2: 'Slowly, but it is.', fr_fechando_o: 'System 7-6',
  fr_queeuabri: 'What I opened',
  fr_queeuabri_1: 'If the instant was her, the space was too.', fr_queeuabri_2: 'All of this fits inside something she did without meaning to.', fr_queeuabri_o: 'Galaxy 7',
  fr_ninho: 'The Nest',
  fr_ninho_1: 'There is a place where nothing can go wrong.', fr_ninho_2: 'She stayed longer than she needed to.', fr_ninho_o: '?',

  fr_asmarcas: 'The marks',
  fr_asmarcas_1: 'Hull read the rings out loud.', fr_asmarcas_2: 'They were not obstacles: they were messages.', fr_asmarcas_o: 'System 8-1',
  fr_letradele: 'His hand',
  fr_letradele_1: 'The mark on one side is firm and deep.', fr_letradele_2: 'Whoever made it made it with force.', fr_letradele_o: 'System 8-5',
  fr_letradela: 'Her hand',
  fr_letradela_1: 'The one on the other side is light and never ends.', fr_letradela_2: 'Like writing fast so as not to forget.', fr_letradela_o: 'System 8-7',
  fr_juntosant: 'Together before',
  fr_juntosant_1: 'They were one.', fr_juntosant_2: 'She remembers the warm dark from before there was space.', fr_juntosant_o: 'Galaxy 8',
  fr_paraeu: 'So that I could exist',
  fr_paraeu_1: 'One does not become two on its own.', fr_paraeu_2: 'Someone has to want it.', fr_paraeu_o: 'System 9-6',
  fr_opreco: 'The price',
  fr_opreco_1: 'If the two touch again, the space closes.', fr_opreco_2: 'And everything inside closes with it.', fr_opreco_o: 'Galaxy 9',
  fr_muitasmaos: 'Many hands',
  fr_muitasmaos_1: 'She did not come alone.', fr_muitasmaos_2: 'She had never noticed.', fr_muitasmaos_o: '?',
  fr_costura: 'The seam',
  fr_costura_1: 'There is a thread crossing everything.', fr_costura_2: 'You can follow it without letting go.', fr_costura_o: '?',
  fr_aporta: 'The door',
  fr_aporta_1: 'The end of the road is a door.', fr_aporta_2: 'On the other side, two still lights.', fr_aporta_o: 'Reach the Singularity',

  fr_nomeinteir: 'The whole name',
  fr_nomeinteir_1: 'Spark was the nickname.', fr_nomeinteir_2: 'The name means the one that turns around something greater than itself.', fr_nomeinteir_o: 'See one ending',
  fr_oqueficou: 'What remained',
  fr_oqueficou_1: 'She came back with colour.', fr_oqueficou_2: 'It took going twice to see both halves.', fr_oqueficou_o: 'See two endings',
  fr_todasmaos: 'All the hands',
  fr_todasmaos_1: 'The four roads lead to the same place.', fr_todasmaos_2: 'The difference is who arrives with you.', fr_todasmaos_o: 'See all four endings'
});

Object.assign(HR.I18N.es, {
  fr_pal_faisca: 'CHISPA', fr_pal_orbo: 'ORBO',
  alb_frags: 'Fragmentos',
  frag_titulo: 'Fragmentos', frag_sub: 'Lo que ella recuerda',
  frag_de: '{a} de {b}', frag_novo: 'FRAGMENTO', frag_onde: 'Dónde',
  frag_bloq: 'Todavía no recuerda', frag_segredo: 'Nada aquí',
  frag_dica: 'Ella recuerda haciendo. Juega y vuelve.',
  frag_completo: 'Volvió entera.',

  fr_giro: 'El primer giro',
  fr_giro_1: 'Giró antes de saber que estaba girando.', fr_giro_2: 'Fue lo primero que supo hacer.', fr_giro_o: 'Nivel 1-1-1',
  fr_faltava: 'Faltaba alguien',
  fr_faltava_1: 'No recordaba a nadie.', fr_faltava_2: 'Pero el lugar de al lado estaba vacío de un modo específico.', fr_faltava_o: '20 aros perfectos',
  fr_escuro: 'La oscuridad no está vacía',
  fr_escuro_1: 'Cayó, y la oscuridad la sostuvo.', fr_escuro_2: 'No dolió.', fr_escuro_o: 'Caer y seguir',
  fr_cinza: 'Gris',
  fr_cinza_1: 'Se vio por primera vez.', fr_cinza_2: 'No tenía color, y eso pareció un error.', fr_cinza_o: 'Abrir los Fragmentos',
  fr_apelido: 'El nombre pequeño',
  fr_apelido_1: 'Alguien, en algún lugar, la llamaba así.', fr_apelido_2: 'No recuerda quién.', fr_apelido_o: 'Sistema 1-1',
  fr_berco: 'Cuna',
  fr_berco_1: 'Este lugar huele a cosa nueva.', fr_berco_2: 'Como si nadie lo hubiera usado antes que ella.', fr_berco_o: 'Galaxia 1',
  fr_maisnovo: 'Más joven que yo',
  fr_maisnovo_1: 'La marea le dijo la edad que tenía.', fr_maisnovo_2: 'Era menor que la suya.', fr_maisnovo_o: 'Sistema 2-3',
  fr_naofecha: 'La mano que no cierra',
  fr_naofecha_1: 'Cada aro tiene un rasguño en el mismo sitio.', fr_naofecha_2: 'Como si alguien lo sujetara para que no cerrara.', fr_naofecha_o: '100 aros perfectos',
  fr_dois: 'Dos',
  fr_dois_1: 'Soñó con dos luces.', fr_dois_2: 'Una encendida por dentro, otra encendida en los bordes.', fr_dois_o: 'Galaxia 2',

  fr_mesmodia: 'Todo el mismo día',
  fr_mesmodia_1: 'Las cosas del jardín nacieron todas juntas.', fr_mesmodia_2: 'Ninguna es más vieja que otra.', fr_mesmodia_o: 'Sistema 3-2',
  fr_instante: 'El instante',
  fr_instante_1: 'Hubo un instante en que no había nada.', fr_instante_2: 'Todo esto empezó en él.', fr_instante_o: 'Sistema 4-1',
  fr_quente: 'Calor',
  fr_quente_1: 'Antes del instante había calor.', fr_quente_2: 'Recuerda estar dentro de algo.', fr_quente_o: 'Ser salvada por la Égida',
  fr_delonge: 'De lejos',
  fr_delonge_1: 'Vio una línea en el cielo que no era estrella.', fr_delonge_2: 'Dolió mirar.', fr_delonge_o: 'Galaxia 5',
  fr_quemsegur: 'Quién sostenía',
  fr_quemsegur_1: 'Dos manos, una a cada lado de la línea.', fr_quemsegur_2: 'No recuerda ninguna cara.', fr_quemsegur_o: 'Sistema 5-8',
  fr_contempla: 'La contemplación',
  fr_contempla_1: 'Encontró a quienes no pueden ayudar en nada.', fr_contempla_2: 'Y que aun así miran hacia arriba.', fr_contempla_o: '?',
  fr_pontoazul: 'El punto azul',
  fr_pontoazul_1: 'Un punto azul, pequeño, lleno de gente mirando.', fr_pontoazul_2: 'Son los únicos que podrían saberlo.', fr_pontoazul_o: '?',
  fr_espiral: 'Espiral',
  fr_espiral_1: 'La galaxia giraba como algo que ya giró mucho.', fr_espiral_2: 'Y aun así era nueva.', fr_espiral_o: 'Galaxia 6',
  fr_eraeu: 'El instante era yo',
  fr_eraeu_1: 'El instante tenía nombre.', fr_eraeu_2: 'El nombre era el suyo.', fr_eraeu_o: 'Sistema 7-1',
  fr_fechando: 'Se está cerrando',
  fr_fechando_1: 'La línea del cielo es menor que antes.', fr_fechando_2: 'Despacio, pero lo es.', fr_fechando_o: 'Sistema 7-6',
  fr_queeuabri: 'Lo que abrí',
  fr_queeuabri_1: 'Si el instante fue ella, el espacio también.', fr_queeuabri_2: 'Todo esto cabe en algo que hizo sin querer.', fr_queeuabri_o: 'Galaxia 7',
  fr_ninho: 'El Nido',
  fr_ninho_1: 'Hay un lugar donde nada puede salir mal.', fr_ninho_2: 'Se quedó más de lo que hacía falta.', fr_ninho_o: '?',

  fr_asmarcas: 'Las marcas',
  fr_asmarcas_1: 'Casco leyó los aros en voz alta.', fr_asmarcas_2: 'No eran obstáculos: eran recados.', fr_asmarcas_o: 'Sistema 8-1',
  fr_letradele: 'Su letra',
  fr_letradele_1: 'La marca de un lado es firme y honda.', fr_letradele_2: 'Quien la hizo, la hizo con fuerza.', fr_letradele_o: 'Sistema 8-5',
  fr_letradela: 'La letra de ella',
  fr_letradela_1: 'La del otro lado es leve y no termina.', fr_letradela_2: 'Como quien escribe deprisa para no olvidar.', fr_letradela_o: 'Sistema 8-7',
  fr_juntosant: 'Juntos antes',
  fr_juntosant_1: 'Eran uno.', fr_juntosant_2: 'Recuerda la oscuridad tibia de antes de que hubiera espacio.', fr_juntosant_o: 'Galaxia 8',
  fr_paraeu: 'Para que yo exista',
  fr_paraeu_1: 'Uno no se vuelve dos solo.', fr_paraeu_2: 'Alguien tiene que quererlo.', fr_paraeu_o: 'Sistema 9-6',
  fr_opreco: 'El precio',
  fr_opreco_1: 'Si los dos se tocan otra vez, el espacio se cierra.', fr_opreco_2: 'Y todo lo que está dentro se cierra con él.', fr_opreco_o: 'Galaxia 9',
  fr_muitasmaos: 'Muchas manos',
  fr_muitasmaos_1: 'No vino sola.', fr_muitasmaos_2: 'Nunca se había dado cuenta.', fr_muitasmaos_o: '?',
  fr_costura: 'La costura',
  fr_costura_1: 'Hay un hilo que atraviesa todo.', fr_costura_2: 'Se puede seguir sin soltarlo.', fr_costura_o: '?',
  fr_aporta: 'La puerta',
  fr_aporta_1: 'El final del camino es una puerta.', fr_aporta_2: 'Del otro lado, dos luces quietas.', fr_aporta_o: 'Llegar a la Singularidad',

  fr_nomeinteir: 'El nombre entero',
  fr_nomeinteir_1: 'Chispa era el apodo.', fr_nomeinteir_2: 'El nombre significa lo que gira alrededor de algo mayor que sí.', fr_nomeinteir_o: 'Ver un final',
  fr_oqueficou: 'Lo que quedó',
  fr_oqueficou_1: 'Volvió con color.', fr_oqueficou_2: 'Hizo falta ir dos veces para ver las dos mitades.', fr_oqueficou_o: 'Ver dos finales',
  fr_todasmaos: 'Todas las manos',
  fr_todasmaos_1: 'Los cuatro caminos llevan al mismo lugar.', fr_todasmaos_2: 'La diferencia es quién llega contigo.', fr_todasmaos_o: 'Ver los cuatro finales'
});
