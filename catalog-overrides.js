/* My Candy's — applique les recatégorisations (catégorie/marque) faites depuis l'admin.
   Se charge APRÈS app.js (pour avoir window.MC_API) et AVANT le script de rendu de la page.
   1) applique le cache localStorage tout de suite (avant le rendu, pour les visites suivantes)
   2) va chercher les surcharges fraîches sur le Worker, met à jour + réaffiche */
(function () {
  'use strict';
  if (!window.MC || !MC.PRODUCTS) return;
  var LS = 'mcCatOverridesV1';
  var API = (window.MC_API || '').replace(/\/$/, '');

  function apply(ov) {
    if (!ov) return;
    MC.PRODUCTS.forEach(function (p) {
      var o = ov[p.id]; if (!o) return;
      if (o.cat) p.cat = o.cat;
      if (o.brand !== undefined) p.brand = (o.brand === null ? null : o.brand);
      if (o.price != null && !isNaN(o.price)) p.price = o.price;
      if (o.desc) p.desc = o.desc;
      if (o.img !== undefined) p.img = (o.img === null ? null : o.img);
      if (o.stock !== undefined) p.stock = o.stock;
      if (o.available !== undefined) p.available = o.available;
    });
  }

  // 1) cache immédiat (synchrone)
  try { apply(JSON.parse(localStorage.getItem(LS) || 'null')); } catch (e) {}

  // 2) surcharges fraîches
  if (API) {
    fetch(API + '/catalog').then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.ok && d.overrides) {
        var s = JSON.stringify(d.overrides);
        if (s !== localStorage.getItem(LS)) {
          try { localStorage.setItem(LS, s); } catch (e) {}
          apply(d.overrides);
          window.dispatchEvent(new Event('mc-catalog-updated')); // les pages réaffichent
        }
      }
    }).catch(function () {});
  }

  window.MCcatalog = { apply: apply };
})();
