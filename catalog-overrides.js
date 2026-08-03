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
    // créations : nouveaux produits ajoutés depuis l'admin (new:true, absents du catalogue de base)
    for (var nid in ov) {
      var no = ov[nid];
      if (no && no['new'] && !no.deleted && MC.byId && !MC.byId(nid)) {
        MC.PRODUCTS.push({ id: nid, name: no.name || nid, price: (no.price != null ? no.price : null), old: (no.old != null ? no.old : null), cat: no.cat || 'Bonbons', brand: no.brand || null, tint: no.tint || (MC.T && MC.T.pink) || '#FFD1E8', img: no.img || null, sub: (no.sub || null), stock: no.stock, available: no.available !== false, reviews: 0, nouveau: true });
      }
    }
    MC.PRODUCTS.forEach(function (p) {
      var o = ov[p.id]; if (!o) return;
      if (o.name) p.name = o.name;
      if (o.cat) p.cat = o.cat;
      if (o.brand !== undefined) p.brand = (o.brand === null ? null : o.brand);
      if (o.price != null && !isNaN(o.price)) p.price = o.price;
      if (o.old !== undefined) p.old = (o.old === null ? null : o.old);
      if (o.sub !== undefined) p.sub = (o.sub === null ? null : o.sub);
      if (o.desc) p.desc = o.desc;
      if (o.img !== undefined) p.img = (o.img === null ? null : o.img);
      if (o.stock !== undefined) p.stock = o.stock;
      if (o.available !== undefined) p.available = o.available;
    });
    // suppressions : retire complètement les produits marqués supprimés
    var hasDel = false, id;
    for (id in ov) { if (ov[id] && ov[id].deleted) { hasDel = true; break; } }
    if (hasDel) {
      for (var i = MC.PRODUCTS.length - 1; i >= 0; i--) {
        var od = ov[MC.PRODUCTS[i].id];
        if (od && od.deleted) MC.PRODUCTS.splice(i, 1);
      }
    }
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
