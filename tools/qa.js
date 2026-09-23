/* Passeio completo pelo jogo, para rodar no console do navegador.
   Abre cada tela, cada aba, cada painel; anota erro de console, texto
   estourando a largura, chave de idioma faltando e tela que nao abre.
   Uso:  const s = await fetch('/tools/../scratchpad/qa-v8.js'); ...
   ou cole o conteudo direto. Devolve um objeto com o resumo.        */
window.__qa = async function (opts) {
  opts = opts || {};
  const LARG = opts.larg || 375;
  const erros = [], avisos = [], visitadas = [];
  const dorme = ms => new Promise(r => setTimeout(r, ms || 320));

  // captura erro de console e de promessa
  const origErr = console.error, pilha = [];
  console.error = function () { pilha.push([].slice.call(arguments).join(' ')); return origErr.apply(console, arguments); };
  const onErr = e => pilha.push('window.error: ' + (e.message || e));
  const onRej = e => pilha.push('unhandled: ' + (e.reason && e.reason.message || e.reason));
  window.addEventListener('error', onErr); window.addEventListener('unhandledrejection', onRej);

  function larguras(onde) {
    const fora = [];
    document.querySelectorAll('.screen.visible *, .modal.visible *').forEach(e => {
      if (!e.offsetParent) return;
      const r = e.getBoundingClientRect();
      if (r.width > 0 && (r.right > LARG + 1 || r.left < -1) && getComputedStyle(e).position !== 'fixed') {
        fora.push(onde + ': ' + e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + '.' + String(e.className || '').split(' ')[0]);
      }
    });
    return fora.slice(0, 3);
  }

  function chavesCruas(onde) {
    // texto que ficou como chave (ex.: "st_g6_1" aparecendo na tela)
    const m = [];
    document.querySelectorAll('.screen.visible, .modal.visible').forEach(s => {
      const t = s.innerText || '';
      const achou = t.match(/\b(st_|a_d?_|fr_|reg_|gal_|perk_|build_|trail_|skin_|theme_)[a-z0-9_]{3,}\b/g);
      if (achou) m.push(onde + ': ' + achou.slice(0, 3).join(', '));
    });
    return m;
  }

  async function ver(nome, fn) {
    const antes = pilha.length;
    try { await fn(); } catch (e) { erros.push(nome + ' explodiu: ' + e.message); return; }
    await dorme(opts.espera);
    visitadas.push(nome);
    larguras(nome).forEach(x => avisos.push('estoura a largura · ' + x));
    chavesCruas(nome).forEach(x => erros.push('chave crua na tela · ' + x));
    pilha.slice(antes).forEach(x => erros.push(nome + ' · ' + x));
  }

  const U = HR.UI;
  HR.NO_AUTOPAUSE = true;

  // 1. telas do menu
  for (const n of ['shop', 'galaxy', 'abilities', 'missions', 'achievements', 'daily', 'leaderboard', 'settings', 'rifts', 'singularity']) {
    await ver('tela ' + n, async () => { U.open(n); });
    await ver('voltar de ' + n, async () => { U.back(); });
  }

  // 2. abas da loja
  for (const t of ['skins', 'trails', 'themes', 'gear']) {
    await ver('loja/' + t, async () => { U.open('shop'); U.shopTab = t; U.renderShop && U.renderShop(); });
  }
  U.back();

  // 3. abas das conquistas (inclui o mural de fragmentos)
  for (const t of ['all', 'frags', 'trophies']) {
    await ver('conquistas/' + t, async () => { U.open('achievements', t); });
  }
  U.back();

  // 4. mapa: galaxia, regiao, sistema, ficha da fase
  await ver('mapa galaxia', async () => { U.open('galaxy'); });
  await ver('mapa regiao', async () => { U.renderRegion && U.openRegion ? U.openRegion(0) : U.open('region'); });
  await ver('mapa sistema', async () => { U.openSystem ? U.openSystem(0, 0) : U.open('system'); });
  await ver('ficha da fase', async () => { U.openLevelDetail && U.openLevelDetail('1-1-1'); });
  U.hideModals && U.hideModals(); U.closePanels && U.closePanels();

  // 5. os tres idiomas em cada tela grande
  const idiomaOrig = HR.lang;
  for (const l of ['en', 'es', 'pt']) {
    await ver('idioma ' + l, async () => { HR.setLang(l); U.open('shop'); });
    U.back();
  }
  HR.setLang(idiomaOrig);

  // 6. cenas da historia: uma por galaxia, a carta e os finais
  if (HR.Story && U.storyScene) {
    const cenas = ['open', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g9', 'g10',
      'g6b10', 'g7b10', 'g8b10', 'g9b10', 'g10b10', 'g6c', 'g7c', 'g8c', 'g9c',
      'end_U', 'end_Q', 'end_F', 'end_M'];
    for (const id of cenas) {
      if (!HR.Story.exists(id)) { erros.push('cena que nao existe: ' + id); continue; }
      await ver('cena ' + id, async () => {
        U.storyScene(id);
        await dorme(260);
        const box = document.querySelector('.story-card');
        if (!box || !box.closest('.visible')) { /* pode estar na fila */ }
        const pular = document.querySelector('.story-skip');
        if (pular) pular.click();
        await dorme(200);
      });
    }
  }

  // 7. auditoria de dados
  let aud = null;
  try {
    const src = await fetch('/tools/audit.js').then(r => r.text());
    eval(src); aud = await window.__audit();
    (aud.erros || []).forEach(e => erros.push('auditoria · ' + e));
    (aud.avisos || []).forEach(a => avisos.push('auditoria · ' + a));
  } catch (e) { avisos.push('auditoria nao rodou: ' + e.message); }

  window.removeEventListener('error', onErr); window.removeEventListener('unhandledrejection', onRej);
  console.error = origErr;

  return {
    telas: visitadas.length,
    erros: erros.length, avisos: avisos.length,
    resumo: aud && aud.resumo,
    listaErros: erros.slice(0, 30),
    listaAvisos: avisos.slice(0, 20)
  };
};
