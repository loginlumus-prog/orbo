/* =====================================================================
   ORBO v8 — reconta os alvos das conquistas de colecao.

   As conquistas "todas as bolas", "todos os rastros", "todos os temas" e
   "colecao X completa" tinham o alvo calculado no momento em que
   content-v5.js e content-v51.js eram lidos. Tudo que entrou DEPOIS
   ficou de fora da conta: as 12 bolas do v6.0, as 10 Visitantes e os 12
   rastros do v8, e a bola Ponto Azul, que nasce no easter-v8.js.

   O efeito era um alvo velho: "Todas as bolas" fechava em 138 de 163, e
   quem comprasse as 25 restantes nao ganhava nada por isso.

   Este arquivo e o ultimo a falar de conteudo: ele so passa os olhos na
   lista final e acerta os numeros. Nada mais.
   ===================================================================== */
(function () {
  const C = HR.CONFIG, A = HR.ACHIEVEMENTS;
  if (!C || !A) return;
  const acha = id => A.filter(a => a.id === id)[0];
  const poe = (id, n) => { const a = acha(id); if (a && n > 0 && a.target !== n) { a.target = n; return id + ' ' + n; } return null; };
  const mudou = [];

  // bolas: o total conta tudo que existe, inclusive premio e sazonal,
  // porque a conquista sempre foi "todas"
  mudou.push(poe('skins_all', C.SKINS.length));
  mudou.push(poe('trails_all', C.TRAILS.filter(t => !t.season).length));
  mudou.push(poe('themes_all', C.THEMES.length));

  // uma por colecao
  (HR.COLLECTIONS || []).forEach(c => {
    mudou.push(poe('col_' + c.id, C.SKINS.filter(s => s.col === c.id).length));
  });

  // egide e jato: os alvos fixos (5 e 10) continuam validos, mas o
  // "todos" de cada um nao existia. Nao inventamos conquista aqui.
  const lista = mudou.filter(Boolean);
  if (lista.length && HR.DEBUG) console.log('[v8] alvos recontados:', lista.join(', '));
})();
