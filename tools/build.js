/* =====================================================================
   ORBO — gera as versoes para os portais.

     node tools/build.js              -> as tres (crazygames, itch, newgrounds)
     node tools/build.js itch         -> so uma

   Cada versao sai em dist/<portal>/ e num zip dist/orbo-<portal>.zip, que e
   o arquivo que se envia no site do portal.

   O que muda em relacao ao site:
     - os 86 scripts viram um arquivo so (orbo.js) e os 18 estilos, um so
       (orbo.css): portal mede o tempo ate o primeiro quadro, e 104 pedidos
       custam mais que dois;
     - sem manifest e sem service worker (o portal serve o jogo num iframe,
       de outro dominio);
     - window.HR_PLATFORM diz ao js/platform.js onde o jogo esta;
     - CrazyGames: o script do SDK entra no <head>.

   Os links de apoio (itch/newgrounds) ficam em tools/plataformas.json.
   ===================================================================== */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const DIST = path.join(RAIZ, 'dist');
const TODAS = ['crazygames', 'itch', 'newgrounds'];

const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
const cfg = (() => { try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'plataformas.json'), 'utf8')); } catch (_) { return {}; } })();
const versao = (fs.readFileSync(path.join(RAIZ, 'js/config.js'), 'utf8').match(/VERSION:\s*'([^']+)'/) || [])[1] || '0';

const semQuery = s => s.split('?')[0];
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => semQuery(m[1]));
const estilos = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m => semQuery(m[1]));

function junta(lista, sep) {
  return lista.map(f => {
    const txt = fs.readFileSync(path.join(RAIZ, f), 'utf8').replace(/^﻿/, '');
    return sep(f) + '\n' + txt.replace(/\s+$/, '') + '\n';
  }).join('\n');
}

function gera(portal) {
  const out = path.join(DIST, portal);
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(path.join(out, 'assets'), { recursive: true });

  // o codigo: cada arquivo termina com ; para nenhum colar no proximo
  const js = '/* ORBO ' + versao + ' — ' + portal + ' */\n' + junta(scripts, f => ';/* ' + f + ' */');
  const css = '/* ORBO ' + versao + ' — ' + portal + ' */\n' + junta(estilos, f => '/* ' + f + ' */');
  fs.writeFileSync(path.join(out, 'orbo.js'), js);
  fs.writeFileSync(path.join(out, 'orbo.css'), css);
  fs.copyFileSync(path.join(RAIZ, 'assets/icon.svg'), path.join(out, 'assets/icon.svg'));

  const links = (cfg[portal] || {});
  const cabeca = [
    '<script>window.HR_PLATFORM=' + JSON.stringify(portal) + ';window.HR_LINKS=' + JSON.stringify({ apoio: links.apoio || '' }) + ';</script>',
    portal === 'crazygames' ? '<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>' : ''
  ].filter(Boolean).join('\n');

  let h = html;
  h = h.replace(/\s*<link rel="manifest"[^>]*>/, '');
  h = h.replace(/\s*<link rel="apple-touch-icon"[^>]*>/, '');
  // os estilos: o primeiro vira o pacote, o resto some
  let primeiro = true;
  h = h.replace(/[ \t]*<link rel="stylesheet" href="css\/[^"]+">\r?\n?/g, () => {
    if (!primeiro) return '';
    primeiro = false;
    return '<link rel="stylesheet" href="orbo.css?v=' + versao + '">\n' + cabeca + '\n';
  });
  // os scripts: somem todos, e o pacote entra no lugar do ultimo (main.js)
  h = h.replace(/<script src="js\/[^"]+"><\/script>\r?\n?/g, m => (/main\.js/.test(m) ? '<script src="orbo.js?v=' + versao + '"></script>\n' : ''));
  fs.writeFileSync(path.join(out, 'index.html'), h);

  // as regras de tamanho da CrazyGames: 50 MB no inicio, 1500 arquivos
  const arquivos = [], soma = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => { const p = path.join(d, e.name); if (e.isDirectory()) soma(p); else arquivos.push(fs.statSync(p).size); });
  soma(out);
  const kb = Math.round(arquivos.reduce((a, b) => a + b, 0) / 1024);

  const zip = path.join(DIST, 'orbo-' + portal + '.zip');
  fs.rmSync(zip, { force: true });
  let zipou = false;
  try {
    execFileSync('powershell', ['-NoProfile', '-Command', 'Compress-Archive -Path "' + path.join(out, '*') + '" -DestinationPath "' + zip + '" -Force'], { stdio: 'ignore' });
    zipou = fs.existsSync(zip);
  } catch (_) {
    try { execFileSync('zip', ['-rq', zip, '.'], { cwd: out, stdio: 'ignore' }); zipou = fs.existsSync(zip); } catch (__) { /* sem zip: a pasta basta */ }
  }
  const zkb = zipou ? Math.round(fs.statSync(zip).size / 1024) : 0;
  console.log(portal.padEnd(11) + ' ' + arquivos.length + ' arquivos, ' + kb + ' KB' + (zipou ? '  ->  dist/orbo-' + portal + '.zip (' + zkb + ' KB)' : '  (zip nao gerado: envie a pasta dist/' + portal + ')'));
}

const pedidas = process.argv.slice(2).filter(a => TODAS.indexOf(a) >= 0);
fs.mkdirSync(DIST, { recursive: true });
console.log('ORBO ' + versao + ': ' + scripts.length + ' scripts, ' + estilos.length + ' estilos');
(pedidas.length ? pedidas : TODAS).forEach(gera);
