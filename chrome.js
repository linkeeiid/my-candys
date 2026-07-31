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
        '<a href="compte.html" class="mc-act" data-account title="Mon compte"><span>👤</span><span class="mc-lbl">Compte</span></a>' +
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
            '<a href="boutique.html?b=Red%20Bull" style="color:#4A2A3A">Red Bull</a><a href="boutique.html?b=Kinder" style="color:#4A2A3A">Kinder</a><a href="boutique.html?b=Fanta" style="color:#4A2A3A">Fanta</a>' +
            '<a href="boutique.html?b=Pringles" style="color:#4A2A3A">Pringles</a><a href="boutique.html?b=Snickers" style="color:#4A2A3A">Snickers</a><a href="boutique.html?b=Coca-Cola" style="color:#4A2A3A">Coca-Cola</a>' +
            '<a href="boutique.html?b=Nerds" style="color:#4A2A3A">Nerds</a><a href="boutique.html?b=Twix" style="color:#4A2A3A">Twix</a><a href="boutique.html?b=KitKat" style="color:#4A2A3A">KitKat</a>' +
            '<a href="boutique.html?b=Cheetos" style="color:#4A2A3A">Cheetos</a><a href="boutique.html?b=Takis" style="color:#4A2A3A">Takis</a><a href="boutique.html?b=Oreo" style="color:#4A2A3A">Oreo</a>' +
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
        '<div class="mc-fsocial">' +
          '<a href="https://www.tiktok.com/@my.candys.lyon" target="_blank" rel="noopener" title="TikTok" aria-label="TikTok"><svg viewBox="0 0 24 24" width="20" height="20" fill="#fff" aria-hidden="true"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg></a>' +
          '<a href="https://www.instagram.com/my.candys.lyon" target="_blank" rel="noopener" title="Instagram" aria-label="Instagram"><svg viewBox="0 0 24 24" width="20" height="20" fill="#fff" aria-hidden="true"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/></svg></a>' +
          '<a href="https://www.snapchat.com/add/my.candys.lyon" target="_blank" rel="noopener" title="Snapchat" aria-label="Snapchat"><svg viewBox="0 0 24 24" width="21" height="21" fill="#fff" aria-hidden="true"><path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.061.075-.12.375-.166.57-.03.135-.075.36-.135.591-.075.3-.27.45-.585.45h-.03c-.135 0-.313-.031-.539-.075-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.135-.42-.135-.591-.046-.195-.135-.495-.166-.57-1.887-.284-2.92-.703-3.16-1.288-.03-.06-.045-.135-.045-.21-.015-.239.165-.464.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.104l-.048-.638c-.135-1.638-.3-3.68.27-4.995C7.851 1.076 11.008.793 11.998.793h.208z"/></svg></a>' +
        '</div>' +
      '</div>' +
      '<div class="mc-fcol"><div class="mc-fcol-title">Besoin d\'aide ?</div><div class="mc-fcol-links"><a href="infos.html?p=faq">FAQ</a><a href="infos.html?p=livraison">Livraison &amp; retours</a><a href="compte.html">Suivi de commande</a><a href="infos.html?p=contact">Nous contacter</a></div></div>' +
      '<div class="mc-fcol"><div class="mc-fcol-title">La marque</div><div class="mc-fcol-links"><a href="infos.html?p=about">Qui sommes-nous ?</a><a href="infos.html?p=boutiques">Nos boutiques</a><a href="infos.html?p=franchise">Devenir franchisé</a><a href="marques.html">Nos marques</a></div></div>' +
      '<div class="mc-fcol"><div class="mc-fcol-title">Boutique</div><div class="mc-fcol-links"><a href="boutique.html?c=bestsellers">Bestsellers</a><a href="boutique.html?c=nouveautes">Nouveautés</a><a href="boutique.html?c=promos">Promos</a><a href="mystery-box.html">Mystery Box</a></div></div>' +
    '</div>' +
    '<div class="mc-fbarwrap"><div class="mc-fbar"><div>© 2026 My Candy\'s — Tous droits réservés. · <a href="infos.html?p=mentions" style="color:#D9AEC4;text-decoration:underline">Mentions légales</a> · <a href="infos.html?p=cgv" style="color:#D9AEC4;text-decoration:underline">CGV</a> · <a href="infos.html?p=confidentialite" style="color:#D9AEC4;text-decoration:underline">Confidentialité</a></div><div class="mc-fpay"><span>VISA</span><span>Mastercard</span><span> Pay</span><span>G Pay</span><span>PayPal</span></div></div></div>' +
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
      '<div class="mc-menu-sec"><div class="mc-menu-sectitle">🏆 Marques</div><a href="boutique.html?b=Red%20Bull" class="mc-menu-link">Red Bull</a><a href="boutique.html?b=Kinder" class="mc-menu-link">Kinder</a><a href="boutique.html?b=Fanta" class="mc-menu-link">Fanta</a><a href="marques.html" class="mc-menu-link mc-menu-link--all">Toutes les marques →</a></div>' +
    '</div>' +
    '<div class="mc-menu-foot"><a href="compte.html" data-account><span>👤</span> Compte</a><a href="favoris.html"><span>🤍</span> Favoris</a></div>' +
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
  '<div id="mc-auth" class="mc-authov" role="dialog" aria-modal="true" aria-label="Mon compte">' +
    '<div class="mc-authbox">' +
      '<button class="mc-auth-x" id="mc-auth-x" aria-label="Fermer">✕</button>' +
      '<div id="mc-auth-forms">' +
        '<div class="mc-auth-head"><img src="assets/logo.png" alt="My Candy\'s"><h2 id="mc-auth-title">Bon retour ! 👋</h2><p id="mc-auth-sub">Connecte-toi pour accéder à ton espace My Candy\'s.</p></div>' +
        '<div class="mc-auth-social">' +
          '<button type="button" class="mc-authbtn mc-authbtn-google" data-social="Google"><svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg> Continuer avec Google</button>' +
          '<button type="button" class="mc-authbtn mc-authbtn-apple" data-social="Apple"><svg viewBox="0 0 384 512" fill="#fff" aria-hidden="true"><path d="M318.7 268.7c-.2-36.71 16.41-64.39 50.01-84.78-18.83-26.91-47.26-41.72-84.72-44.6-35.5-2.79-74.32 20.69-88.51 20.69-14.99 0-49.4-19.68-76.44-19.68C36.5 141.09 0 184.66 0 273.65c0 26.35 4.81 53.57 14.44 81.63 12.83 36.9 59.06 127.3 107.3 125.79 25.21-.6 43.04-17.9 75.85-17.9 31.83 0 48.34 17.9 76.44 17.9 48.68-.71 90.51-82.86 102.71-119.87-65.24-30.76-61.61-90.11-61.61-91.6zm-56.51-164.19c27.25-32.35 24.77-61.82 23.96-72.42-23.06 1.35-49.75 15.74-64.96 33.44-16.75 18.95-26.6 42.39-24.48 71.83 24.93 1.9 47.7-10.9 65.48-32.85z"/></svg> Continuer avec Apple</button>' +
        '</div>' +
        '<div class="mc-auth-or">ou</div>' +
        '<form id="mc-auth-login" novalidate>' +
          '<div class="mc-auth-field"><label for="mc-auth-login-email">Adresse e-mail</label><input class="mc-auth-input" id="mc-auth-login-email" type="email" autocomplete="email" placeholder="ton@email.com" required></div>' +
          '<div class="mc-auth-field"><label for="mc-auth-login-pass">Mot de passe</label><input class="mc-auth-input" id="mc-auth-login-pass" type="password" autocomplete="current-password" placeholder="••••••••" required></div>' +
          '<button class="mc-auth-cta" type="submit">Se connecter</button>' +
          '<p class="mc-auth-hint" id="mc-auth-hint-login"></p>' +
        '</form>' +
        '<form id="mc-auth-signup" novalidate hidden>' +
          '<div class="mc-auth-field"><label for="mc-auth-sig-first">Prénom</label><input class="mc-auth-input" id="mc-auth-sig-first" type="text" autocomplete="given-name" placeholder="Ton prénom" required></div>' +
          '<div class="mc-auth-field"><label for="mc-auth-sig-email">Adresse e-mail</label><input class="mc-auth-input" id="mc-auth-sig-email" type="email" autocomplete="email" placeholder="ton@email.com" required></div>' +
          '<div class="mc-auth-field"><label for="mc-auth-sig-pass">Mot de passe</label><input class="mc-auth-input" id="mc-auth-sig-pass" type="password" autocomplete="new-password" placeholder="8 caractères minimum" required minlength="8"></div>' +
          '<button class="mc-auth-cta" type="submit">Créer mon compte</button>' +
          '<p class="mc-auth-hint" id="mc-auth-hint-signup"></p>' +
        '</form>' +
        '<p class="mc-auth-switch" id="mc-auth-switch">Pas encore de compte ? <button type="button" data-mode="signup">Créer mon compte</button></p>' +
        '<div class="mc-auth-secure"><span>🔒</span> Connexion sécurisée · tes données restent privées</div>' +
      '</div>' +
      '<div id="mc-auth-me" hidden>' +
        '<div class="mc-authme-head"><div class="mc-authme-av" id="mc-authme-av">🍬</div><div style="min-width:0"><div class="mc-authme-hi" id="mc-authme-hi">Salut !</div><div class="mc-authme-mail" id="mc-authme-mail"></div></div></div>' +
        '<div class="mc-authme-stats"><div class="mc-authme-stat"><b id="mc-authme-pts">0</b><span>Points</span></div><div class="mc-authme-stat"><b id="mc-authme-ord">0</b><span>Commandes</span></div><div class="mc-authme-stat"><b id="mc-authme-wish">0</b><span>Favoris</span></div></div>' +
        '<div class="mc-authme-links"><a href="favoris.html"><span>🤍</span> Mes favoris <span>→</span></a><a href="infos.html?p=livraison"><span>📦</span> Suivi de commande <span>→</span></a><a href="boutique.html?c=bestsellers"><span>🛍️</span> Continuer mes achats <span>→</span></a><button class="mc-auth-logout" id="mc-auth-logout" type="button">Se déconnecter</button></div>' +
      '</div>' +
    '</div>' +
  '</div>' +
  '<div id="mc-toast" class="mc-toast"></div>';

  document.body.insertAdjacentHTML('afterbegin', TOP);
  document.body.insertAdjacentHTML('beforeend', BOTTOM);

  /* Cloudflare Web Analytics (mesure d'audience sans cookie).
     → Colle ton token entre les guillemets de CF_TOKEN (voir GUIDE-BACKEND.md). Vide = désactivé. */
  var CF_TOKEN = '';
  if (CF_TOKEN) {
    var _cf = document.createElement('script');
    _cf.defer = true;
    _cf.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    _cf.setAttribute('data-cf-beacon', JSON.stringify({ token: CF_TOKEN }));
    document.head.appendChild(_cf);
  }

  /* ---------- Méga-menus : sortis du header (sinon rognés/masqués par le contenu de page), positionnés en fixe sous leur déclencheur, ouverture au survol — fonctionne sur toutes les pages ---------- */
  (function () {
    // décos de hero (transform+filter → couche GPU qui passe par-dessus le menu) : on les masque via visibility pendant l'ouverture (l'animation floaty ne touche pas visibility)
    var decos = document.querySelectorAll('[class*="decor"]');
    function hideDecos(on) { Array.prototype.forEach.call(decos, function (d) { d.style.visibility = on ? 'hidden' : ''; }); }
    Array.prototype.forEach.call(document.querySelectorAll('.mc-drop'), function (drop) {
      var menu = drop.querySelector('.mc-dropmenu'), link = drop.querySelector('.mc-navlink');
      if (!menu || !link) return;
      document.body.appendChild(menu);            // sort du contexte d'empilement du header
      var t;
      function place() {
        var r = link.getBoundingClientRect();
        menu.style.top = r.bottom + 'px';
        if (menu.classList.contains('mc-dropmenu--right')) { menu.style.right = Math.max(8, window.innerWidth - r.right) + 'px'; menu.style.left = 'auto'; }
        else { menu.style.left = Math.max(8, Math.min(r.left, window.innerWidth - menu.offsetWidth - 8)) + 'px'; menu.style.right = 'auto'; }
      }
      function show() { clearTimeout(t); place(); hideDecos(true); menu.style.opacity = '1'; menu.style.visibility = 'visible'; menu.style.transform = 'translateY(0)'; }
      function hide() { t = setTimeout(function () { menu.style.opacity = '0'; menu.style.visibility = 'hidden'; menu.style.transform = 'translateY(-6px)'; hideDecos(false); }, 140); }
      drop.addEventListener('mouseenter', show);
      drop.addEventListener('mouseleave', hide);
      link.addEventListener('focus', show);
      menu.addEventListener('mouseenter', function () { clearTimeout(t); });
      menu.addEventListener('mouseleave', hide);
    });
  })();

  /* ---------- Modale « Mon compte » (connexion / inscription, partagée) ---------- */
  (function () {
    var UKEY = 'mcUserV1';
    var byId = function (i) { return document.getElementById(i); };
    var ov = byId('mc-auth'); if (!ov) return;
    var forms = byId('mc-auth-forms'), me = byId('mc-auth-me');
    var fLogin = byId('mc-auth-login'), fSignup = byId('mc-auth-signup');
    var title = byId('mc-auth-title'), sub = byId('mc-auth-sub'), sw = byId('mc-auth-switch');
    function readU() { try { return JSON.parse(localStorage.getItem(UKEY)); } catch (e) { return null; } }
    function writeU(u) { try { localStorage.setItem(UKEY, JSON.stringify(u)); } catch (e) {} }
    function clearU() { try { localStorage.removeItem(UKEY); } catch (e) {} }
    function toast(m) { if (window.MCui && MCui.toast) MCui.toast(m); }

    function renderMe(u) {
      byId('mc-authme-hi').textContent = 'Salut, ' + (u.firstName || 'toi') + ' 👋';
      byId('mc-authme-mail').textContent = u.provider ? ('Connecté via ' + u.provider) : (u.email || '');
      byId('mc-authme-av').textContent = ((u.firstName || '').trim().charAt(0) || '🍬').toUpperCase();
      byId('mc-authme-pts').textContent = (u.points != null ? u.points : 0);
      byId('mc-authme-ord').textContent = (u.orders != null ? u.orders : 0);
      byId('mc-authme-wish').textContent = (window.MCWish ? MCWish.count() : 0);
      forms.hidden = true; me.hidden = false;
    }
    function showMode(mode) {
      var login = mode === 'login';
      fLogin.hidden = !login; fSignup.hidden = login;
      title.textContent = login ? 'Bon retour ! 👋' : 'Rejoins le club 🎉';
      sub.innerHTML = login ? "Connecte-toi pour accéder à ton espace My Candy's."
                            : 'Crée ton compte et gagne <b style="color:#E01784">-10% sur ta 1ère commande</b>.';
      sw.innerHTML = login ? 'Pas encore de compte ? <button type="button" data-mode="signup">Créer mon compte</button>'
                           : 'Déjà membre ? <button type="button" data-mode="login">Se connecter</button>';
    }
    function showForms() { me.hidden = true; forms.hidden = false; showMode('login'); }
    function refresh() { var u = readU(); if (u && (u.email || u.provider)) renderMe(u); else showForms(); }

    function open() {
      var mc = byId('mc-menu-close'); if (mc) mc.click(); // ferme le menu mobile s'il est ouvert
      refresh();
      ov.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function close() { ov.classList.remove('open'); document.body.style.overflow = ''; }
    window.MCauth = { open: open, close: close };

    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-account]');
      if (a) { e.preventDefault(); open(); return; }
      if (!ov.contains(e.target)) return;
      var m = e.target.closest('[data-mode]'); if (m) { showMode(m.getAttribute('data-mode')); return; }
      var s = e.target.closest('[data-social]');
      if (s) {
        var prov = s.getAttribute('data-social');
        var u = readU() || {}; if (!u.firstName) u.firstName = 'toi';
        u.provider = prov; if (u.points == null) u.points = 50; if (u.orders == null) u.orders = 0;
        writeU(u); renderMe(u); toast('Connecté avec ' + prov + ' 🎉');
      }
    });
    byId('mc-auth-x').addEventListener('click', close);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov.classList.contains('open')) close(); });
    byId('mc-auth-logout').addEventListener('click', function () { clearU(); showForms(); toast('Tu es déconnecté'); });

    fLogin.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = (byId('mc-auth-login-email').value || '').trim();
      if (!email) { byId('mc-auth-login-email').focus(); return; }
      var name = email.split('@')[0].replace(/[._-]+/g, ' ').trim(); name = name.charAt(0).toUpperCase() + name.slice(1);
      var ex = readU();
      var u = (ex && ex.email === email) ? ex : { firstName: name || 'toi', email: email, points: 0, orders: 0 };
      writeU(u); renderMe(u); toast('Connexion réussie · content de te revoir !');
    });
    fSignup.addEventListener('submit', function (e) {
      e.preventDefault();
      var first = (byId('mc-auth-sig-first').value || '').trim();
      var email = (byId('mc-auth-sig-email').value || '').trim();
      var pass = (byId('mc-auth-sig-pass').value || '');
      if (!first) { byId('mc-auth-sig-first').focus(); return; }
      if (!email) { byId('mc-auth-sig-email').focus(); return; }
      if (pass.length < 8) { byId('mc-auth-hint-signup').textContent = "Choisis un mot de passe d'au moins 8 caractères."; byId('mc-auth-sig-pass').focus(); return; }
      var u = { firstName: first, email: email, points: 50, orders: 0 };
      writeU(u); renderMe(u); toast('Bienvenue ' + first + ' ! +50 points offerts 🎉');
    });
    window.addEventListener('mc-wish-change', function () { if (!me.hidden) byId('mc-authme-wish').textContent = (window.MCWish ? MCWish.count() : 0); });
  })();
})();
