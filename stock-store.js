/* My Candy's — couche stock TEMPS RÉEL (miroir Firebase du stock caisse SumUp).
   Lecture SEULE côté client : on ne fait qu'AFFICHER le stock, jamais l'écrire.
   Les écritures de stock passeront plus tard par le Cloudflare Worker (webhook SumUp).

   Expose window.MCStock :
     MCStock.get(id)     -> quantité connue (nombre) ou null si inconnue
     MCStock.isOut(id)   -> true si épuisé (quantité connue <= 0)
     MCStock.isLow(id)   -> true si bientôt épuisé (0 < quantité <= LOW)
     MCStock.isKnown(id) -> true si Firebase connaît ce produit
     MCStock.all()       -> l'objet {id: quantité}
     MCStock.ready()     -> true dès qu'une première donnée est arrivée
     MCStock.LOW         -> seuil "bientôt épuisé"
   Émet l'événement window 'mc-stock-change' à chaque mise à jour.

   Données Firebase : /stock/{productId} = quantité (entier).
   Produit absent de /stock  => quantité inconnue => considéré DISPONIBLE
   (le site ne se bloque jamais si Firebase est vide/injoignable). */
window.MCStock = (function () {
  'use strict';

  var BASE = 'https://my-candy-s-default-rtdb.europe-west1.firebasedatabase.app';
  var PATH = '/stock';      // /stock/{productId} = quantité
  var LOW  = 5;             // seuil d'alerte "plus que X"
  var POLL_MS = 45000;      // filet de sécurité : relecture toutes les 45 s

  var map = {};             // { productId: quantité }
  var ready = false;

  function emit() {
    ready = true;
    try { window.dispatchEvent(new CustomEvent('mc-stock-change')); } catch (e) {}
  }

  /* Applique un événement Firebase 'put' (remplacement) à la carte locale.
     path '/' => données complètes ; path '/xxx' => un seul produit. */
  function applyPut(path, data) {
    if (path === '/' || path === '' || path == null) {
      map = (data && typeof data === 'object') ? data : {};
    } else {
      var key = String(path).replace(/^\//, '');
      if (data === null || data === undefined) { delete map[key]; }
      else { map[key] = data; }
    }
    emit();
  }

  /* Applique un événement Firebase 'patch' (mise à jour partielle). */
  function applyPatch(path, data) {
    if (!data || typeof data !== 'object') { emit(); return; }
    var base = String(path).replace(/^\//, '');
    Object.keys(data).forEach(function (k) {
      var key = base ? base + '/' + k : k;   // /stock étant plat, key = productId
      if (data[k] === null) { delete map[key]; } else { map[key] = data[k]; }
    });
    emit();
  }

  /* --- Filet de sécurité : lecture ponctuelle + polling --- */
  var polling = false;
  function fetchOnce() {
    if (typeof fetch === 'undefined') return;
    fetch(BASE + PATH + '.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d && typeof d === 'object') { map = d; emit(); } else if (d === null) { map = {}; emit(); } })
      .catch(function () {});
  }
  function startPolling() {
    if (polling) return;
    polling = true;
    fetchOnce();
    try { setInterval(fetchOnce, POLL_MS); } catch (e) {}
  }

  /* --- Source principale : flux temps réel Firebase (Server-Sent Events) --- */
  function startStream() {
    if (typeof EventSource === 'undefined' || location.protocol === 'file:') {
      startPolling();
      return;
    }
    var es;
    try { es = new EventSource(BASE + PATH + '.json'); }
    catch (e) { startPolling(); return; }

    var gotData = false;
    es.addEventListener('put', function (ev) {
      try { var m = JSON.parse(ev.data); gotData = true; applyPut(m.path, m.data); } catch (e) {}
    });
    es.addEventListener('patch', function (ev) {
      try { var m = JSON.parse(ev.data); gotData = true; applyPatch(m.path, m.data); } catch (e) {}
    });
    es.onerror = function () {
      // Flux jamais arrivé (refusé/indispo) -> on bascule sur le polling.
      // (Un simple hoquet réseau est ignoré : EventSource se reconnecte tout seul.)
      if (!gotData && !polling) { startPolling(); }
    };
  }

  function get(id) {
    var v = map[id];
    return (typeof v === 'number') ? v : null;
  }

  // Démarrage : lecture immédiate (affichage instantané) + flux temps réel.
  fetchOnce();
  startStream();

  return {
    LOW: LOW,
    ready:   function () { return ready; },
    all:     function () { return map; },
    get:     get,
    isKnown: function (id) { return get(id) !== null; },
    isOut:   function (id) { var v = get(id); return v !== null && v <= 0; },
    isLow:   function (id) { var v = get(id); return v !== null && v > 0 && v <= LOW; }
  };
})();
