/* Service worker: cache do app shell para jogar offline (PWA). Suba a versão ao publicar. */
const CACHE = 'orbo-v8.0.0';
const ASSETS = [
  './', './index.html', './manifest.json', './assets/icon.svg',
  './css/style.css', './css/hud.css', './css/shop.css', './css/galaxy.css', './css/v5.css', './css/v51.css', './css/v52.css', './css/v53.css', './css/v54.css', './css/v55.css', './css/v56.css', './css/v58.css', './css/story.css', './css/v60.css', './css/rifts.css', './css/perf.css', './css/fragments.css', './css/menu-v7.css',
  './js/config.js', './js/utils.js', './js/icons.js', './js/tips.js', './js/i18n.js', './js/brand.js', './js/storage.js', './js/perf.js', './js/audio.js', './js/music.js', './js/input.js',
  './js/services.js', './js/content.js', './js/seasons.js', './js/systems.js', './js/perks.js', './js/gear.js', './js/modes.js', './js/campaign.js', './js/skins.js', './js/cosmetics-v51.js', './js/singularity.js', './js/online.js', './js/content-v5.js', './js/content-v51.js',
  './js/render.js', './js/render-gear.js', './js/render-skins.js', './js/render-trails.js', './js/render-scenes.js', './js/render-gear-v51.js', './js/game.js', './js/game-v53.js',
  './js/ui.js', './js/ui-hud.js', './js/ui-shop.js', './js/ui-galaxy.js', './js/ui-singularity.js', './js/ui-trophies.js', './js/ui-v52.js', './js/ui-v53.js', './js/ui-system-v54.js', './js/ui-lean-v55.js', './js/ui-perks-v56.js', './js/cosmetics-v60.js', './js/ui-glyph-v58.js', './js/rifts.js', './js/story.js', './js/story-g1.js', './js/story-g2.js', './js/story-g3.js', './js/story-g4.js', './js/story-g5.js', './js/story-nest.js', './js/ui-story.js', './js/ui-rifts.js', './js/ui-perf.js', './js/fx-v65.js', './js/ui-v7.js', './js/ui-menu-v7.js', './js/ui-dock-v7.js', './js/fragments.js', './js/render-frag.js', './js/frag-scenes.js', './js/ui-fragments.js', './js/skin-faisca.js', './js/jet-lanes.js', './js/visit-mode.js', './js/balance-v8.js', './js/perks-v8.js', './js/cosmetics-v8.js', './js/story-g6.js', './js/story-g7.js', './js/story-g8.js', './js/story-g9.js', './js/story-g10.js', './js/milkyway-v8.js', './js/render-cosmetics-v8.js', './js/easter-v8.js', './js/costura-v8.js', './js/safety-v8.js', './js/recount-v8.js', './js/main.js'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
/* A pagina pede os arquivos com ?v=..., a lista acima nao tem query: sem
   ignoreSearch nenhum pedido casava com o que o install baixou (1,75 MB
   baixados duas vezes e offline so a partir do 2.o carregamento).
   A navegacao (o index.html) vai pela rede primeiro e so cai no cache se
   estiver offline — assim a versao nova aparece no primeiro recarregamento. */
const guardar = (req, res) => {
  if (res && res.ok && new URL(req.url).origin === location.origin) {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy));
  }
  return res;
};
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => guardar(req, res)).catch(() =>
      caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html', { ignoreSearch: true }))));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit =>
    hit || fetch(req).then(res => guardar(req, res)).catch(() => hit)));
});
