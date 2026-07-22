/* My Candy's — habillage commun injecté (barre promo, header+nav+menus, drawers, footer, toast).
   Se charge AVANT app.js. Chaque page pose <body data-nav="..."> pour surligner l'onglet actif. */
(function () {
  var NAV = (document.body.getAttribute('data-nav') || '');
  var act = function (key) { return NAV === key ? ' mc-navlink--active' : ''; };

  var TOP = '' +
  '<div class="mc-count">' +
    '<div class="mc-count-in">' +
      '<div style="text-align:center">' +
        '<div class="mc-promo">-26% sur <span>TOUT</span> le site + Livraison Offerte*</div>' +
        '<div class="mc-fine">*Sauf Box/Pack, Anti-Gaspi et Pick\'n\'Mix · En point relais dès 39€ d\'achat</div>' +
      '</div>' +
      '<div class="mc-timer">' +
        '<div class="mc-tcell"><div class="mc-td" id="cd-h">24</div><div class="mc-tl">HRS</div></div>' +
        '<span class="mc-tsep">:</span>' +
        '<div class="mc-tcell"><div class="mc-td" id="cd-m">00</div><div class="mc-tl">MINS</div></div>' +
        '<span class="mc-tsep">:</span>' +
        '<div class="mc-tcell"><div class="mc-td" id="cd-s">00</div><div class="mc-tl">SECS</div></div>' +
      '</div>' +
      '<div class="mc-code">CODE : Candysummer26</div>' +
    '</div>' +
  '</div>' +
  '<header class="mc-header">' +
    '<div class="mc-head">' +
      '<button id="mc-burger" class="mc-burger" title="Menu" aria-label="Ouvrir le menu"><span></span><span></span><span></span></button>' +
      '<a href="index.html" class="mc-logo"><img src="assets/logo.png" alt="My Candy\'s" width="160" height="54"></a>' +
      '<div class="mc-actions">' +
        '<button id="mc-search-btn" class="mc-act" title="Recherche"><span>🔍</span><span class="mc-lbl">Recherche</span></button>' +
        '<span class="mc-fr">🇫🇷 FR</span>' +
        '<a href="compte.html" class="mc-act" title="Mon compte"><span>👤</span><span class="mc-lbl">Compte</span></a>' +
        '<a href="favoris.html" class="mc-act" title="Favoris"><span>🤍</span><span class="mc-lbl">Favoris</span><span id="wish-badge" class="mc-wbadge">0</span></a>' +
        '<button id="mc-cart-btn" class="mc-cartbtn" title="Panier"><span>🛒</span><span class="mc-lbl">Panier</span><span id="cart-badge" class="mc-cbadge">0</span></button>' +
      '</div>' +
    '</div>' +
    '<div id="mc-search" class="mc-search" style="display:none">' +
      '<div class="mc-searchpill"><span style="font-size:19px;opacity:.55">🔍</span><input type="search" placeholder="Rechercher un bonbon, un soda, une marque..." aria-label="Recherche"><button id="mc-search-close" title="Fermer" style="color:#8A6076;font-size:18px;padding:2px 6px">✕</button></div>' +
    '</div>' +
    '<nav class="mc-navwrap"><div class="mc-row mc-nav">' +
      '<a href="boutique.html?c=mini-prix" class="mc-navlink mc-navlink--red' + act('mini-prix') + '">Mini Prix 🪙</a>' +
      '<a href="boutique.html?c=bestsellers" class="mc-navlink' + act('bestsellers') + '">Bestsellers 🩷</a>' +
      '<a href="boutique.html?c=nouveautes" class="mc-navlink' + act('nouveautes') + '">Nouveautés ⭐</a>' +
      '<a href="boutique.html?c=promos" class="mc-navlink' + act('promos') + '">Promos ⚡</a>' +
      '<a href="mystery-box.html" class="mc-navlink' + act('mystery') + '">Mystery Box 📦</a>' +
      '<a href="index.html#tiktok" class="mc-navlink">TikTok 🔥</a>' +
      '<a href="boutique.html?c=squishy" class="mc-navlink mc-navlink--purple' + act('squishy') + '">Squishy 🌈</a>' +
      '<div class="mc-drop">' +
        '<a href="boutique.html?c=sucres" class="mc-navlink' + act('sucres') + '">Sucrés ▾</a>' +
        '<div class="mc-dropmenu" style="min-width:640px">' +
          '<div class="mc-dropcol"><div>🍬 Bonbons</div><a href="boutique.html?c=sucres">Bonbons US</a><a href="boutique.html?c=sucres">Chewing-gum &amp; sucettes</a><a href="boutique.html?c=sucres">Chamallow</a><a href="boutique.html?c=sucres">Barbe à papa</a><a href="boutique.html?c=sucres" class="mc-seeall">Voir tout →</a></div>' +
          '<div class="mc-dropcol"><div>🍿 Snacks sucrés</div><a href="boutique.html?c=sucres">Pop-corn</a><a href="boutique.html?c=sucres">Biscuits</a><a href="boutique.html?c=sucres">Gelées</a><a href="boutique.html?c=sucres">Mochi</a><a href="boutique.html?c=sucres" class="mc-seeall">Voir tout →</a></div>' +
          '<div class="mc-dropcol"><div>🍫 Chocolats</div><a href="boutique.html?c=sucres">Chocolats intl</a><a href="boutique.html?c=sucres">Barres chocolatées</a><a href="boutique.html?c=sucres">Beurre de cacahuète</a><a href="boutique.html?c=sucres">Chocolat de Dubaï ✨</a><a href="boutique.html?c=sucres" class="mc-seeall">Voir tout →</a></div>' +
        '</div>' +
      '</div>' +
      '<div class="mc-drop">' +
        '<a href="boutique.html?c=sales" class="mc-navlink' + act('sales') + '">Salés ▾</a>' +
        '<div class="mc-dropmenu" style="min-width:560px">' +
          '<div class="mc-dropcol"><div>🌶️ Snacks salés</div><a href="boutique.html?c=sales">Chips &amp; crackers</a><a href="boutique.html?c=sales">Takis &amp; snacks épicés</a><a href="boutique.html?c=sales">Beef jerky</a><a href="boutique.html?c=sales" class="mc-seeall">Voir tout →</a></div>' +
          '<div class="mc-dropcol"><div>🍜 Cuisine</div><a href="boutique.html?c=sales">Ramen &amp; nouilles</a><a href="boutique.html?c=sales">Cuisine américaine</a></div>' +
          '<div class="mc-dropcol"><div>🥫 Sauces</div><a href="boutique.html?c=sales">Sauces &amp; dips</a><a href="boutique.html?c=sales">Salsa</a><a href="boutique.html?c=sales">Chamoy</a></div>' +
        '</div>' +
      '</div>' +
      '<div class="mc-drop">' +
        '<a href="boutique.html?c=boissons" class="mc-navlink' + act('boissons') + '">Boissons ▾</a>' +
        '<div class="mc-dropmenu" style="min-width:520px">' +
          '<div class="mc-dropcol"><div>🥤 Boissons</div><a href="boutique.html?c=boissons">Énergisantes (Prime, Monster)</a><a href="boutique.html?c=boissons">Sodas viraux</a><a href="boutique.html?c=boissons">Boissons asiatiques</a><a href="boutique.html?c=boissons">Thé glacé</a></div>' +
          '<div class="mc-dropcol"><div style="color:#0FA9B8">🧊 Frais</div><a href="boutique.html?c=boissons">Slushies</a><a href="boutique.html?c=boissons">Eaux aromatisées</a><a href="boutique.html?c=boissons">Jus de fruits</a><a href="boutique.html?c=boissons">Bubble tea</a></div>' +
        '</div>' +
      '</div>' +
      '<div class="mc-drop">' +
        '<a href="boutique.html?c=asie" class="mc-navlink' + act('asie') + '">Asie ▾</a>' +
        '<div class="mc-dropmenu" style="min-width:340px">' +
          '<div class="mc-dropcol"><div>🍡 Produits asiatiques</div><a href="boutique.html?c=asie">Ramen</a><a href="boutique.html?c=asie">Boissons asiatiques</a><a href="boutique.html?c=asie">Mochi</a><a href="boutique.html?c=asie">Mogu Mogu</a><a href="boutique.html?c=asie" class="mc-seeall">Voir tout →</a></div>' +
        '</div>' +
      '</div>' +
      '<a href="boutique.html?c=anti-gaspi" class="mc-navlink mc-navlink--green' + act('anti-gaspi') + '">Anti-Gaspi ♻️</a>' +
      '<div class="mc-drop">' +
        '<a href="marques.html" class="mc-navlink' + act('marques') + '">Top Marques ▾</a>' +
        '<div class="mc-dropmenu mc-dropmenu--right" style="min-width:420px;display:block">' +
          '<div style="font-weight:700;font-size:14px;color:#E01784;margin-bottom:14px">🏆 Vos marques préférées</div>' +
          '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px 26px;font-size:13.5px">' +
            '<a href="boutique.html?b=Prime" style="color:#4A2A3A">Prime</a><a href="boutique.html?b=Takis" style="color:#4A2A3A">Takis</a><a href="boutique.html?b=Monster" style="color:#4A2A3A">Monster</a>' +
            '<a href="boutique.html?b=Fanta" style="color:#4A2A3A">Fanta</a><a href="boutique.html?b=Kinder" style="color:#4A2A3A">Kinder</a><a href="boutique.html?b=Samyang" style="color:#4A2A3A">Samyang</a>' +
            '<a href="marques.html" style="color:#4A2A3A">Oreo</a><a href="marques.html" style="color:#4A2A3A">Reese\'s</a><a href="marques.html" style="color:#4A2A3A">Pop-Tarts</a>' +
          '</div>' +
          '<a href="marques.html" style="display:inline-block;margin-top:14px;color:#E01784;font-weight:600;font-size:13.5px">Toutes nos marques →</a>' +
        '</div>' +
      '</div>' +
    '</div></nav>' +
  '</header>';

  var BOTTOM = '' +
  '<footer class="mc-footer">' +
    '<div class="mc-foot">' +
      '<div class="mc-fbrand">' +
        '<div class="mc-fbrand-logo"><img src="assets/logo.png" alt="My Candy\'s"></div>' +
        '<p>Retrouve tout le meilleur des snacks viraux du monde — bonbons US, sodas TikTok, éditions limitées — dans ton épicerie du monde en ligne. Franchise née à Lyon. 🍬</p>' +
        '<div class="mc-fsocial"><a href="https://www.tiktok.com/@my.candys.lyon" target="_blank" rel="noopener" title="TikTok">🎵</a><a href="#" title="Instagram">📸</a><a href="#" title="Facebook">📘</a></div>' +
      '</div>' +
      '<div class="mc-fcol"><div class="mc-fcol-title">Besoin d\'aide ?</div><div class="mc-fcol-links"><a href="infos.html?p=faq">FAQ</a><a href="infos.html?p=livraison">Livraison &amp; retours</a><a href="compte.html">Suivi de commande</a><a href="infos.html?p=contact">Nous contacter</a></div></div>' +
      '<div class="mc-fcol"><div class="mc-fcol-title">La marque</div><div class="mc-fcol-links"><a href="infos.html?p=about">Qui sommes-nous ?</a><a href="infos.html?p=boutiques">Nos boutiques</a><a href="infos.html?p=franchise">Devenir franchisé</a><a href="marques.html">Nos marques</a></div></div>' +
      '<div class="mc-fcol"><div class="mc-fcol-title">Boutique</div><div class="mc-fcol-links"><a href="boutique.html?c=bestsellers">Bestsellers</a><a href="boutique.html?c=nouveautes">Nouveautés</a><a href="boutique.html?c=promos">Promos</a><a href="mystery-box.html">Mystery Box</a></div></div>' +
    '</div>' +
    '<div class="mc-fbarwrap"><div class="mc-fbar"><div>© 2026 My Candy\'s — Tous droits réservés.</div><div class="mc-fpay"><span>VISA</span><span>Mastercard</span><span> Pay</span><span>G Pay</span><span>PayPal</span></div></div></div>' +
  '</footer>' +
  '<div id="mc-menu-ov" class="mc-ov"></div>' +
  '<aside id="mc-menu" class="mc-drawer">' +
    '<div class="mc-menu-head"><a href="index.html"><img src="assets/logo.png" alt="My Candy\'s"></a><button id="mc-menu-close" class="mc-menu-close" title="Fermer">✕</button></div>' +
    '<div class="mc-menu-body">' +
      '<div class="mc-menu-sec"><div class="mc-menu-sectitle">🔥 Le top</div><a href="boutique.html?c=mini-prix" class="mc-menu-link">Mini Prix</a><a href="boutique.html?c=bestsellers" class="mc-menu-link">Bestsellers</a><a href="boutique.html?c=nouveautes" class="mc-menu-link">Nouveautés</a><a href="boutique.html?c=promos" class="mc-menu-link">Promos</a></div>' +
      '<div class="mc-menu-div"></div>' +
      '<div class="mc-menu-sec"><div class="mc-menu-sectitle">🍬 Gourmandises</div><a href="boutique.html?c=sucres" class="mc-menu-link">Sucrés</a><a href="boutique.html?c=sales" class="mc-menu-link">Salés</a><a href="boutique.html?c=boissons" class="mc-menu-link">Boissons</a><a href="boutique.html?c=asie" class="mc-menu-link">Asie</a></div>' +
      '<div class="mc-menu-div"></div>' +
      '<div class="mc-menu-sec"><div class="mc-menu-sectitle">🎁 Exclus</div><a href="mystery-box.html" class="mc-menu-link">Mystery Box</a><a href="boutique.html?c=squishy" class="mc-menu-link">Squishy</a><a href="boutique.html?c=anti-gaspi" class="mc-menu-link">Anti-Gaspi</a><a href="index.html#tiktok" class="mc-menu-link">TikTok</a></div>' +
      '<div class="mc-menu-div"></div>' +
      '<div class="mc-menu-sec"><div class="mc-menu-sectitle">🏆 Marques</div><a href="boutique.html?b=Prime" class="mc-menu-link">Prime</a><a href="boutique.html?b=Takis" class="mc-menu-link">Takis</a><a href="boutique.html?b=Monster" class="mc-menu-link">Monster</a><a href="marques.html" class="mc-menu-link mc-menu-link--all">Toutes les marques →</a></div>' +
    '</div>' +
    '<div class="mc-menu-foot"><a href="compte.html"><span>👤</span> Compte</a><a href="favoris.html"><span>🤍</span> Favoris</a></div>' +
  '</aside>' +
  '<div id="mc-cart-ov" class="mc-ov"></div>' +
  '<aside id="mc-cart" class="mc-drawer">' +
    '<div class="mc-cart-head"><div>Ton panier <span id="mc-cart-count"></span></div><button id="mc-cart-close" class="mc-cart-close" title="Fermer">✕</button></div>' +
    '<div class="mc-free"><div class="mc-free-msg" id="mc-free-msg">Plus que 39,00 € pour la livraison offerte</div><div class="mc-free-track"><div class="mc-free-bar" id="mc-free-bar"></div></div></div>' +
    '<div class="mc-cart-body">' +
      '<div class="mc-cart-empty" id="mc-cart-empty"><div class="big">🛒</div><div class="t">Ton panier est vide</div><div style="font-size:14px;margin-top:6px">Ajoute tes snacks viraux préférés !</div><button id="mc-cart-continue">Continuer mes achats</button></div>' +
      '<div id="mc-cart-lines"></div>' +
    '</div>' +
    '<div class="mc-cart-foot" id="mc-cart-foot">' +
      '<div class="mc-cart-promo"><input placeholder="Code promo" aria-label="Code promo"><button>OK</button></div>' +
      '<div class="mc-cart-subrow"><span>Sous-total</span><span id="mc-cart-sub">0,00 €</span></div>' +
      '<a href="checkout.html" class="mc-cart-pay">Passer au paiement →</a>' +
      '<div class="mc-cart-secure">🔒 Paiement sécurisé · CB, Apple Pay, PayPal</div>' +
    '</div>' +
  '</aside>' +
  '<div id="mc-toast" class="mc-toast"></div>';

  document.body.insertAdjacentHTML('afterbegin', TOP);
  document.body.insertAdjacentHTML('beforeend', BOTTOM);
})();
