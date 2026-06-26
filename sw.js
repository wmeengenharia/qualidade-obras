// Service Worker - FV WME Engenharia
const CACHE = 'wme-fv-v20';

// Arquivos do app shell para cache offline
const SHELL = ['./', './index.html', './icon.svg', './manifest.json'];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(SHELL).catch(function() {
        // Se algum arquivo nao existir ainda, continua sem erro
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; }).map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(e) {
  // Nunca interceptar chamadas para o JSONBin (dados da nuvem)
  if (e.request.url.includes('api.jsonbin.io')) return;
  // Nunca interceptar chamadas para o Supabase (dados/fotos)
  if (e.request.url.includes('supabase.co')) return;
  // Para o app shell: tenta cache primeiro, senao busca na rede
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      return cached || fetch(e.request).then(function(response) {
        // Atualiza o cache com a versao mais recente
        if (response && response.status === 200 && e.request.method === 'GET') {
          var clone = response.clone();
          caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        }
        return response;
      });
    }).catch(function() {
      // Offline e nao tem cache: retorna pagina principal
      return caches.match('./') || caches.match('./index.html');
    })
  );
});
