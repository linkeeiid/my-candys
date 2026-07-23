/* My Candy's — comportements partagés (habillage commun à toutes les pages).
   Dépend de cart-store.js (MCCart/MCWish) et products.js (MC). Vanilla, zéro framework. */
(function () {
  'use strict';
  var FREE = 39; // seuil livraison offerte (€)
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var money = function (n) { return (window.MC ? MC.money(n) : n.toFixed(2).replace('.', ',') + ' €'); };

  /* ---------- Compte à rebours 24h (boucle) ---------- */
  function initCountdown() {
    var h = $('#cd-h'), m = $('#cd-m'), s = $('#cd-s');
    if (!h || !m || !s) return;
    var KEY = 'mcCountdownEnd';
    // Fin du compte à rebours partagée entre les pages (persistée en localStorage)
    // → le chrono reste continu pendant tout le parcours, ne se réinitialise pas.
    function loadEnd() {
      var e;
      try { e = parseInt(localStorage.getItem(KEY), 10); } catch (x) {}
      if (!e || isNaN(e) || e <= Date.now()) {
        e = Date.now() + 24 * 3600 * 1000;
        try { localStorage.setItem(KEY, String(e)); } catch (x) {}
      }
      return e;
    }
    var end = loadEnd();
    var p2 = function (n) { return String(n).padStart(2, '0'); };
    function tick() {
      var left = Math.max(0, Math.round((end - Date.now()) / 1000));
      if (left === 0) { end = loadEnd(); left = Math.max(0, Math.round((end - Date.now()) / 1000)); }
      h.textContent = p2(Math.floor(left / 3600));
      m.textContent = p2(Math.floor((left % 3600) / 60));
      s.textContent = p2(left % 60);
    }
    tick(); setInterval(tick, 1000);
  }

  /* ---------- Badges panier + favoris ---------- */
  function updateBadges() {
    var cb = $('#cart-badge');
    if (cb) { var n = (window.MCCart ? MCCart.count() : 0); cb.textContent = n; cb.style.display = n > 0 ? 'flex' : 'none'; }
    var wb = $('#wish-badge');
    if (wb) { var w = (window.MCWish ? MCWish.count() : 0); wb.textContent = w; wb.style.display = w > 0 ? 'flex' : 'none'; }
  }

  /* ---------- Toast ---------- */
  var toastT;
  function toast(msg) {
    var el = $('#mc-toast');
    if (!el) return;
    el.textContent = '✅ ' + msg;
    el.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { el.classList.remove('is-on'); }, 2400);
  }
  window.MCui = { toast: toast };

  /* ---------- Menu drawer (gauche) ---------- */
  function initMenu() {
    var menu = $('#mc-menu'), ov = $('#mc-menu-ov');
    if (!menu || !ov) return;
    function set(open) {
      menu.style.transform = open ? 'translateX(0)' : 'translateX(-100%)';
      ov.style.opacity = open ? '1' : '0';
      ov.style.pointerEvents = open ? 'auto' : 'none';
      try { document.body.style.overflow = open ? 'hidden' : ''; } catch (e) {}
    }
    $$('[data-menu-open]').forEach(function (b) { b.addEventListener('click', function () { set(true); }); });
    var burger = $('#mc-burger'); if (burger) burger.addEventListener('click', function () { set(true); });
    var close = $('#mc-menu-close'); if (close) close.addEventListener('click', function () { set(false); });
    ov.addEventListener('click', function () { set(false); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  }

  /* ---------- Panier drawer (droite) — branché sur MCCart ---------- */
  var cartApi = null;
  function initCart() {
    var drawer = $('#mc-cart'), ov = $('#mc-cart-ov');
    if (!drawer || !ov) return null;
    var lines = $('#mc-cart-lines'), empty = $('#mc-cart-empty'), foot = $('#mc-cart-foot');
    function set(open) {
      drawer.style.transform = open ? 'translateX(0)' : 'translateX(100%)';
      ov.style.opacity = open ? '1' : '0';
      ov.style.pointerEvents = open ? 'auto' : 'none';
      try { document.body.style.overflow = open ? 'hidden' : ''; } catch (e) {}
    }
    function render() {
      var items = window.MCCart ? MCCart.items() : [];
      var count = items.reduce(function (n, l) { return n + l.qty; }, 0);
      var sub = items.reduce(function (n, l) { return n + l.price * l.qty; }, 0);
      var lbl = $('#mc-cart-count'); if (lbl) lbl.textContent = count > 0 ? '(' + count + ')' : '';
      if (empty) empty.style.display = count === 0 ? 'block' : 'none';
      if (foot) foot.style.display = count > 0 ? 'block' : 'none';
      if (lines) {
        lines.innerHTML = items.map(function (l) {
          return '' +
            '<div class="mc-cline">' +
              '<div class="mc-cline-img" style="background:' + (l.tint || '#FFE3F1') + '"><div class="mc-stripes"></div></div>' +
              '<div class="mc-cline-mid">' +
                '<div class="mc-cline-name">' + MC.esc(l.name) + '</div>' +
                '<div class="mc-cline-price">' + money(l.price) + '</div>' +
                '<div class="mc-cline-ctrls">' +
                  '<div class="mc-step"><button data-dec="' + MC.esc(l.id) + '" aria-label="Moins">−</button><span>' + l.qty + '</span><button data-inc="' + MC.esc(l.id) + '" aria-label="Plus">+</button></div>' +
                  '<button class="mc-cline-rm" data-rm="' + MC.esc(l.id) + '">Retirer</button>' +
                '</div>' +
              '</div>' +
              '<div class="mc-cline-total">' + money(l.price * l.qty) + '</div>' +
            '</div>';
        }).join('');
      }
      var subEl = $('#mc-cart-sub'); if (subEl) subEl.textContent = money(sub);
      var remaining = Math.max(0, FREE - sub);
      var msg = $('#mc-free-msg'), bar = $('#mc-free-bar');
      if (msg) msg.textContent = remaining <= 0 ? '🎉 Livraison offerte débloquée !' : 'Plus que ' + money(remaining) + ' pour la livraison offerte';
      if (bar) bar.style.width = Math.min(100, Math.round(sub / FREE * 100)) + '%';
    }
    $$('[data-cart-open]').forEach(function (b) { b.addEventListener('click', function () { set(true); }); });
    var btn = $('#mc-cart-btn'); if (btn) btn.addEventListener('click', function () { set(true); });
    var close = $('#mc-cart-close'); if (close) close.addEventListener('click', function () { set(false); });
    var cont = $('#mc-cart-continue'); if (cont) cont.addEventListener('click', function () { set(false); });
    ov.addEventListener('click', function () { set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
    // steppers / remove (délégation)
    if (lines) lines.addEventListener('click', function (e) {
      var t = e.target.closest('[data-inc],[data-dec],[data-rm]'); if (!t || !window.MCCart) return;
      if (t.hasAttribute('data-inc')) MCCart.inc(t.getAttribute('data-inc'));
      else if (t.hasAttribute('data-dec')) MCCart.dec(t.getAttribute('data-dec'));
      else if (t.hasAttribute('data-rm')) MCCart.remove(t.getAttribute('data-rm'));
    });
    render();
    return { open: function () { set(true); }, close: function () { set(false); }, render: render };
  }

  /* ---------- Recherche (barre repliable) ---------- */
  function initSearch() {
    var panel = $('#mc-search'); if (!panel) return;
    var btn = $('#mc-search-btn'), close = $('#mc-search-close'), input = panel.querySelector('input');
    function set(open) { panel.style.display = open ? 'block' : 'none'; if (open && input) input.focus(); }
    if (btn) btn.addEventListener('click', function () { set(panel.style.display === 'none' || !panel.style.display); });
    if (close) close.addEventListener('click', function () { set(false); });
    if (input) input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { var v = input.value.trim(); location.href = 'boutique.html' + (v ? ('?q=' + encodeURIComponent(v)) : ''); }
    });
  }

  /* ---------- Ajout panier / favoris (délégation globale) ---------- */
  function initShopActions() {
    document.addEventListener('click', function (e) {
      var add = e.target.closest('[data-add]');
      if (add) {
        var p = MC.byId(add.getAttribute('data-add'));
        if (p && window.MCCart) { MCCart.add({ id: p.id, name: p.name, price: p.price, tint: p.tint, old: p.old }); toast(p.name + ' ajouté au panier'); }
        return;
      }
      var w = e.target.closest('[data-wish]');
      if (w) {
        var pw = MC.byId(w.getAttribute('data-wish'));
        if (pw && window.MCWish) {
          var on = MCWish.toggle({ id: pw.id, name: pw.name, price: pw.price, tint: pw.tint });
          w.classList.toggle('is-on', on);
          w.textContent = on ? '❤️' : '🤍';
          toast(on ? 'Ajouté aux favoris' : 'Retiré des favoris');
        }
      }
    });
  }

  /* ---------- Carrousel de bannières (accueil) ---------- */
  function initHero() {
    var track = $('#mc-hero-track'); if (!track) return;
    var slides = track.children.length; if (slides < 2) return;
    var dotsWrap = $('#mc-hero-dots');
    var i = 0, paused = false, timer;
    function go(n) {
      i = (n + slides) % slides;
      track.style.transform = 'translateX(-' + (i * 100) + '%)';
      if (dotsWrap) $$('.mc-dot', dotsWrap).forEach(function (d, k) { d.style.width = k === i ? '26px' : '9px'; d.style.background = k === i ? '#fff' : 'rgba(255,255,255,.55)'; });
    }
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      for (var k = 0; k < slides; k++) {
        var d = document.createElement('button');
        d.className = 'mc-dot'; d.setAttribute('aria-label', 'Bannière ' + (k + 1));
        d.style.cssText = 'height:10px;border-radius:999px;transition:width .3s;border:none;cursor:pointer';
        (function (idx) { d.addEventListener('click', function () { go(idx); }); })(k);
        dotsWrap.appendChild(d);
      }
    }
    var hero = $('#mc-hero');
    if (hero) { hero.addEventListener('mouseenter', function () { paused = true; }); hero.addEventListener('mouseleave', function () { paused = false; }); }
    timer = setInterval(function () { if (!paused) go(i + 1); }, 4800);
    go(0);
  }

  /* ---------- Init ---------- */
  function init() {
    initCountdown();
    initMenu();
    cartApi = initCart();
    initSearch();
    initShopActions();
    initHero();
    updateBadges();
    window.addEventListener('mc-cart-change', function () { updateBadges(); if (cartApi) cartApi.render(); });
    window.addEventListener('mc-wish-change', updateBadges);
    window.addEventListener('storage', function () { updateBadges(); if (cartApi) cartApi.render(); });
    window.MCui.openCart = function () { if (cartApi) cartApi.open(); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
