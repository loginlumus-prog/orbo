/* Service worker: cache do app shell para jogar offline (PWA). Suba a versão ao publicar. */
const CACHE = 'orbo-v6.5.2';
const ASSETS = [
  './', './index.html', './manifest.json', './assets/icon.svg',
  './css/style.css', './css/hud.css', './css/shop.css', './css/galaxy.css', './css/v5.css', './css/v51.css', './css/v52.css', './css/v53.css', './css/v54.css', './css/v55.css', './css/v56.css', './css/v58.css', './css/story.css', './css/v60.css', './css/rifts.css', './css/perf.css',
  './js/config.js', './js/utils.js', './js/icons.js', './js/tips.js', './js/i18n.js', './js/brand.js', './js/storage.js', './js/perf.js', './js/audio.js', './js/music.js', './js/input.js',
  './js/services.js', './js/content.js', './js/seasons.js', './js/systems.js', './js/perks.js', './js/gear.js', './js/modes.js', './js/campaign.js', './js/skins.js', './js/cosmetics-v51.js', './js/singularity.js', './js/online.js', './js/content-v5.js', './js/content-v51.js',
  './js/render.js', './js/render-gear.js', './js/render-skins.js', './js/render-trails.js', './js/render-scenes.js', './js/render-gear-v51.js', './js/game.js', './js/game-v53.js',
  './js/ui.js', './js/ui-hud.js', './js/ui-shop.js', './js/ui-galaxy.js', './js/ui-singularity.js', './js/ui-trophies.js', './js/ui-v52.js', './js/ui-v53.js', './js/ui-system-v54.js', './js/ui-lean-v55.js', './js/ui-perks-v56.js', './js/cosmetics-v60.js', './js/ui-glyph-v58.js', './js/rifts.js', './js/story.js', './js/story-g1.js', './js/story-g2.js', './js/story-g3.js', './js/story-g4.js', './js/story-g5.js', './js/story-nest.js', './js/ui-story.js', './js/ui-rifts.js', './js/ui-perf.js', './js/fx-v65.js', './js/jet-lanes.js', './js/visit-mode.js', './js/main.js'
];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  }).catch(() => hit)));
});
