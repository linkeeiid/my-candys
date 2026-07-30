/* My Candy's — catalogue partagé (source unique de vérité) + helpers d'affichage.
   Utilisé par toutes les pages. Aucune dépendance. */
window.MC = window.MC || {};
(function () {
  var T = {
    blue:   'linear-gradient(135deg,#CFF3FF,#7FD8F0)',
    orange: 'linear-gradient(135deg,#FFD9C4,#FF9E7A)',
    pink:   'linear-gradient(135deg,#FFE3F1,#FF9ED8)',
    green:  'linear-gradient(135deg,#E6FFCF,#B6F07F)',
    yellow: 'linear-gradient(135deg,#FFEFC2,#FFC94D)',
    purple: 'linear-gradient(135deg,#F3E6FF,#C9A0FF)',
    red:    'linear-gradient(135deg,#FFE0DB,#FF9E93)',
    cyan:   'linear-gradient(135deg,#DEF7FA,#8FE6F0)',
    brown:  'linear-gradient(135deg,#EAD9C6,#C9A47A)'
  };
  MC.T = T;

  // cat = catégorie d'affichage (filtre boutique) ; asie = drapeau secondaire (nav "Asie")
  MC.PRODUCTS = [
    { id:'prime-blue',   name:'Prime Blue Raspberry',      brand:'Prime',   price:3.49, old:4.90, reviews:540, nouveau:false, best:true,  tint:T.blue,   cat:'Sodas' },
    { id:'prime-ice',    name:'Prime Ice Pop',             brand:'Prime',   price:3.49, old:null, reviews:212, nouveau:false, best:true,  tint:T.cyan,   cat:'Sodas' },
    { id:'prime-lemon',  name:'Prime Lemon Lime',          brand:'Prime',   price:3.49, old:null, reviews:98,  nouveau:false, best:false, tint:T.green,  cat:'Sodas' },
    { id:'prime-moon',   name:'Prime Meta Moon',           brand:'Prime',   price:3.49, old:null, reviews:44,  nouveau:true,  best:false, tint:T.purple, cat:'Sodas' },
    { id:'prime-straw',  name:'Prime Strawberry Banana',   brand:'Prime',   price:3.49, old:null, reviews:76,  nouveau:false, best:false, tint:T.pink,   cat:'Sodas' },
    { id:'takis-fuego',  name:'Takis Fuego',               brand:'Takis',   price:4.90, old:null, reviews:301, nouveau:false, best:true,  tint:T.orange, cat:'Snacks' },
    { id:'takis-blue',   name:'Takis Blue Heat',           brand:'Takis',   price:4.90, old:null, reviews:120, nouveau:true,  best:false, tint:T.blue,   cat:'Snacks' },
    { id:'takis-nitro',  name:'Takis Nitro',               brand:'Takis',   price:4.90, old:null, reviews:88,  nouveau:false, best:false, tint:T.red,    cat:'Snacks' },
    { id:'takis-guaca',  name:'Takis Guacamole',           brand:'Takis',   price:5.20, old:6.50, reviews:65,  nouveau:false, best:false, tint:T.green,  cat:'Snacks' },
    { id:'monster-ultra-red', name:'Monster Ultra Red',              brand:'Monster', price:3.49, old:null, reviews:190, nouveau:false, best:true,  tint:T.red,    cat:'Sodas', img:'assets/products/monster-ultra-red.png', desc:"Monster Ultra Red : l'énergie Monster sans sucre, avec un goût de fruits rouges pétillant et léger. Le boost qui a vraiment du goût. ⚡" },
    { id:'monster-ruby',      name:'Monster Ultra Fantasy Ruby Red', brand:'Monster', price:4.99, old:null, reviews:44,  nouveau:true,  best:false, tint:T.red,    cat:'Sodas', img:'assets/products/monster-ruby.png', desc:"Monster Ultra Fantasy Ruby Red : édition acidulée aux fruits rouges intenses, zéro sucre. Design de fou, énergie au top. 💎" },
    { id:'monster-hawaiian',  name:'Monster Ultra Blue Hawaiian',    brand:'Monster', price:4.99, old:null, reviews:60,  nouveau:false, best:false, tint:T.cyan,   cat:'Sodas', img:'assets/products/monster-hawaiian.png', desc:"Monster Ultra Blue Hawaiian : saveur cocktail exotique bleu, sans sucre. Un boost aux airs de vacances. 🌺" },
    { id:'monster-punk',      name:'Monster Ultra Punk Punch',       brand:'Monster', price:4.99, old:null, reviews:33,  nouveau:true,  best:false, tint:T.purple, cat:'Sodas', img:'assets/products/monster-punk.png', desc:"Monster Ultra Punk Punch : un punch fruité électrique, zéro sucre, pour l'énergie sans la culpabilité. 🤘" },
    { id:'monster-razz',      name:'Monster Red White Blue Razz',    brand:'Monster', price:4.99, old:null, reviews:51,  nouveau:false, best:false, tint:T.blue,   cat:'Sodas', img:'assets/products/monster-razz.jpg', desc:"Monster Ultra Red White Blue Razz : édition US framboise bleue, acidulée et sans sucre. L'énergie aux couleurs américaines. 🇺🇸" },
    { id:'fanta-grape-jp', name:'Fanta Raisin (Japon)',       brand:'Fanta', price:3.49, old:null, reviews:73,  nouveau:false, best:true,  tint:T.purple, cat:'Sodas', asie:true, img:'assets/products/fanta-grape-jp.jpg', desc:"Import direct du Japon : le Fanta au raisin noir, ultra-fruité et pétillant, dans sa bouteille culte qu'on s'arrache sur TikTok. Sucré, gourmand, à servir bien frais. 🍇" },
    { id:'fanta-peach-jp', name:'Fanta Pêche Blanche (Japon)',brand:'Fanta', price:3.79, old:null, reviews:64,  nouveau:true,  best:false, tint:T.pink,   cat:'Sodas', asie:true, img:'assets/products/fanta-peach-jp.png', desc:"La pépite japonaise : un Fanta à la pêche blanche délicat et parfumé, tout en douceur. Édition rare, parfaite fraîche ou sur glace. 🍑" },
    { id:'fanta-litchi',   name:'Fanta Litchi',               brand:'Fanta', price:2.29, old:null, reviews:51,  nouveau:true,  best:false, tint:T.pink,   cat:'Sodas', asie:true, img:'assets/products/fanta-litchi.png', desc:"Le litchi comme en Asie : floral, juteux et rafraîchissant. Un Fanta exotique introuvable en grande surface, coup de cœur assuré. 🌸" },
    { id:'fanta-pasteque', name:'Fanta Pastèque',             brand:'Fanta', price:2.29, old:null, reviews:88,  nouveau:false, best:true,  tint:T.green,  cat:'Sodas', asie:true, img:'assets/products/fanta-pasteque.png', desc:"Goût pastèque juteux et estival dans un Fanta pétillant venu d'Asie. Le soda de l'été, sucré et désaltérant à souhait. 🍉" },
    { id:'fanta-pomme',    name:'Fanta Pomme',                brand:'Fanta', price:2.19, old:null, reviews:37,  nouveau:false, best:false, tint:T.red,    cat:'Sodas', img:'assets/products/fanta-pomme.png', desc:"Un Fanta pomme rouge croquant et acidulé, importé d'Égypte. Pétillant, franc et rafraîchissant : le twist qu'on ne trouve pas ici. 🍎" },
    { id:'fanta-berry',    name:'Fanta Berry',                brand:'Fanta', price:1.99, old:null, reviews:120, nouveau:false, best:false, tint:T.pink,   cat:'Sodas', img:'assets/products/fanta-berry.jpg', desc:"Un mix de fruits rouges pétillant et gourmand. Le Fanta Berry, doux et fruité, qui plaît à tous les coups. 🫐" },
    { id:'fanta-fraise',   name:'Fanta Fraise',               brand:'Fanta', price:1.99, old:null, reviews:44,  nouveau:false, best:false, tint:T.pink,   cat:'Sodas', img:'assets/products/fanta-fraise.webp', desc:"Le bon goût de fraise sucrée dans un Fanta bien pétillant. Simple, efficace, parfait bien frais pour toute la famille. 🍓" },
    { id:'fanta-ananas',   name:'Fanta Ananas',               brand:'Fanta', price:2.09, old:null, reviews:29,  nouveau:true,  best:false, tint:T.yellow, cat:'Sodas', asie:true, img:'assets/products/fanta-ananas.jpg', desc:"Une explosion d'ananas tropical et ensoleillé. Ce Fanta exotique t'emmène direct sur la plage à chaque gorgée. 🍍" },
    { id:'coca-cherry',       name:'Coca-Cola Cherry',          brand:'Coca-Cola', price:1.69, old:null, reviews:210, nouveau:false, best:true,  tint:T.red,    cat:'Sodas', img:'assets/products/coca-cherry.png', desc:"Le Coca-Cola cerise, un classique culte : la pétillance du Coca rehaussée d'une touche de cerise gourmande. Encore meilleur bien frais. 🍒" },
    { id:'coca-vanille',      name:'Coca-Cola Vanille',         brand:'Coca-Cola', price:1.49, old:null, reviews:88,  nouveau:false, best:false, tint:T.brown,  cat:'Sodas', img:'assets/products/coca-vanille.jpg', desc:"Coca-Cola vanille : le mariage parfait du cola et d'une vanille douce et crémeuse. Un goût rétro-américain qu'on adore. 🥤" },
    { id:'coca-lemon',        name:'Coca-Cola Lemon',           brand:'Coca-Cola', price:1.69, old:null, reviews:64,  nouveau:false, best:false, tint:T.yellow, cat:'Sodas', img:'assets/products/coca-lemon.png', desc:"Coca-Cola citron : le peps du cola avec un zeste de citron acidulé. Rafraîchissant et pétillant, l'édition qui réveille. 🍋" },
    { id:'coca-peche-china',  name:'Coca-Cola Pêche (Chine)',   brand:'Coca-Cola', price:2.29, old:null, reviews:41,  nouveau:true,  best:false, tint:T.pink,   cat:'Sodas', asie:true, img:'assets/products/coca-peche-china.png', desc:"Édition chinoise rare : un Coca-Cola parfumé à la pêche, doux et fruité. Le twist asiatique qu'on ne trouve pas en supermarché. 🍑" },
    { id:'coca-fraise-china', name:'Coca-Cola Fraise (Chine)',  brand:'Coca-Cola', price:2.29, old:null, reviews:33,  nouveau:false, best:false, tint:T.red,    cat:'Sodas', asie:true, img:'assets/products/coca-fraise-china.png', desc:"Import de Chine : Coca-Cola à la fraise, sucré et gourmand. Une édition collector à découvrir absolument. 🍓" },
    { id:'kinder-bueno', name:'Kinder Bueno USA',          brand:'Kinder',  price:2.20, old:null, reviews:88,  nouveau:false, best:true,  tint:T.brown,  cat:'Chocolats' },
    { id:'kinder-schoko',name:'Kinder Schoko-Bons',        brand:'Kinder',  price:5.90, old:null, reviews:44,  nouveau:false, best:false, tint:T.brown,  cat:'Chocolats' },
    { id:'kinder-joy',   name:'Kinder Joy Minecraft',      brand:'Kinder',  price:3.20, old:null, reviews:12,  nouveau:true,  best:false, tint:T.yellow, cat:'Chocolats' },
    { id:'kinder-cards', name:'Kinder Cards',              brand:'Kinder',  price:2.50, old:3.20, reviews:60,  nouveau:false, best:false, tint:T.orange, cat:'Chocolats' },
    { id:'sourpatch',    name:'Sour Patch Kids',           brand:null,      price:3.90, old:null, reviews:150, nouveau:false, best:true,  tint:T.green,  cat:'Bonbons' },
    { id:'oreo-bday',    name:'Oreo Birthday Cake',        brand:null,      price:4.50, old:null, reviews:31,  nouveau:true,  best:false, tint:T.cyan,   cat:'Chocolats' },
    { id:'samyang',      name:'Samyang Hot Chicken',       brand:'Samyang', price:2.29, old:null, reviews:36,  nouveau:false, best:true,  tint:T.red,    cat:'Snacks', asie:true },
    { id:'chamoy',       name:'Chamoy Pickle Kit',         brand:null,      price:12.90,old:null, reviews:98,  nouveau:false, best:true,  tint:T.pink,   cat:'Épicé' },
    { id:'hershey',      name:"Hershey's Cookies'n'Creme", brand:null,      price:3.20, old:null, reviews:74,  nouveau:false, best:false, tint:T.brown,  cat:'Chocolats' },
    { id:'nerds',        name:'Nerds Gummy Clusters',      brand:null,      price:4.20, old:null, reviews:22,  nouveau:true,  best:true,  tint:T.purple, cat:'Bonbons' },
    { id:'poptarts',     name:'Pop-Tarts Frosted',         brand:null,      price:5.50, old:6.90, reviews:64,  nouveau:false, best:false, tint:T.pink,   cat:'Snacks' },
    { id:'mochi',        name:'Mochi Glacé Matcha',        brand:null,      price:5.90, old:null, reviews:45,  nouveau:true,  best:false, tint:T.green,  cat:'Desserts', asie:true },
    { id:'calypso-island',     name:'Calypso Island Wave',     brand:'Calypso', price:1.99, old:null, reviews:51,  nouveau:false, best:true,  tint:T.cyan,   cat:'Sodas', img:'assets/products/calypso-island.jpg', desc:"La limonade américaine Calypso Island Wave : un mélange tropical de fruits avec ses vrais morceaux au fond. Ultra rafraîchissante et généreuse. 🏝️" },
    { id:'calypso-original',   name:'Calypso Lemonade Original',brand:'Calypso', price:3.19, old:null, reviews:40,  nouveau:false, best:false, tint:T.yellow, cat:'Sodas', img:'assets/products/calypso-original.jpg', desc:"Calypso Original : la vraie limonade à l'ancienne, citronnée et gourmande, avec des morceaux de citron. Le goût ensoleillé de la Californie. 🍋" },
    { id:'calypso-ocean',      name:'Calypso Ocean Blue',      brand:'Calypso', price:3.39, old:null, reviews:28,  nouveau:true,  best:false, tint:T.blue,   cat:'Sodas', img:'assets/products/calypso-ocean.jpg', desc:"Calypso Ocean Blue : une limonade bleue fruitée et acidulée, aussi belle que bonne. Le shot de fraîcheur qui fait le buzz. 🌊" },
    { id:'calypso-kiwi',       name:'Calypso Kiwi Lemonade',   brand:'Calypso', price:3.39, old:null, reviews:22,  nouveau:false, best:false, tint:T.green,  cat:'Sodas', img:'assets/products/calypso-kiwi.jpg', desc:"Calypso Kiwi : une limonade au kiwi douce-acidulée, pleine de peps et de morceaux de fruit. Exotique et désaltérante. 🥝" },
    { id:'calypso-strawberry', name:'Calypso Strawberry',      brand:'Calypso', price:3.39, old:null, reviews:34,  nouveau:false, best:false, tint:T.pink,   cat:'Sodas', img:'assets/products/calypso-strawberry.jpg', desc:"Calypso Fraise : une limonade à la fraise sucrée et fruitée, gorgée de morceaux. Gourmande et rafraîchissante à souhait. 🍓" },
    { id:'calypso-melon',      name:'Calypso Triple Melon',    brand:'Calypso', price:3.39, old:null, reviews:19,  nouveau:true,  best:false, tint:T.green,  cat:'Sodas', img:'assets/products/calypso-melon.jpg', desc:"Calypso Triple Melon : trois melons réunis dans une limonade juteuse et estivale. Le combo parfait pour l'été. 🍈" }
  ];

  MC.BOXES = [
    { id:'box-s',   name:'Mystery Box S',   price:14.90, old:19.90, reviews:406,  nouveau:false, tint:T.pink,   box:true },
    { id:'box-m',   name:'Mystery Box M',   price:24.90, old:34.90, reviews:1011, nouveau:false, tint:T.cyan,   box:true },
    { id:'box-xxl', name:'Mystery Box XXL', price:49.90, old:69.90, reviews:284,  nouveau:false, tint:T.purple, box:true }
  ];

  MC.money = function (n) { return n.toFixed(2).replace('.', ',') + ' €'; };

  MC.byId = function (id) {
    return MC.PRODUCTS.concat(MC.BOXES).filter(function (p) { return p.id === id; })[0] || null;
  };

  // badge promo/nouveau (comme le design)
  MC.badge = function (p) {
    if (p.old) { return { text: '-' + Math.round((p.old - p.price) / p.old * 100) + '%', bg: '#E23A2E', color: '#fff' }; }
    if (p.nouveau) { return { text: 'NOUVEAU', bg: '#2A0A1C', color: '#fff' }; }
    return null;
  };

  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  MC.esc = esc;

  // Carte produit (HTML) — utilisée par les carrousels Accueil et la grille Boutique.
  MC.card = function (p) {
    var b = MC.badge(p);
    var wished = (window.MCWish && MCWish.has(p.id));
    return '' +
      '<article class="mc-prod" data-id="' + esc(p.id) + '">' +
        '<a href="produit.html?id=' + encodeURIComponent(p.id) + '" class="mc-prod-imglink" aria-label="' + esc(p.name) + '">' +
          '<div class="mc-prod-img" style="background:' + (p.img ? '#fff' : p.tint) + '">' +
            (p.img ? '<img class="mc-prod-photo" src="' + esc(p.img) + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async">' : '<div class="mc-stripes"></div>') +
            '<div class="mc-price">' + MC.money(p.price) + '</div>' +
            (b ? '<span class="mc-badge" style="background:' + b.bg + ';color:' + b.color + '">' + b.text + '</span>' : '') +
          '</div>' +
        '</a>' +
        '<button class="mc-heart' + (wished ? ' is-on' : '') + '" data-wish="' + esc(p.id) + '" title="Ajouter aux favoris" aria-label="Ajouter aux favoris">' + (wished ? '❤️' : '🤍') + '</button>' +
        '<div class="mc-prod-body">' +
          '<a href="produit.html?id=' + encodeURIComponent(p.id) + '" class="mc-pname">' + esc(p.name) + '</a>' +
          '<div class="mc-stars"><span>★★★★★</span><span>(' + p.reviews + ')</span></div>' +
          (p.old ? '<div class="mc-old">' + MC.money(p.old) + '</div>' : '') +
        '</div>' +
        '<button class="mc-add" data-add="' + esc(p.id) + '" title="Ajouter au panier" aria-label="Ajouter au panier">+</button>' +
      '</article>';
  };

  // Marques défilantes (marquee) du bas de l'accueil — chaque logo est cliquable.
  // href = filtre marque si on la vend en catalogue, sinon catégorie du produit.
  // href = filtre marque (chaque logo mène à sa propre marque). "Monster Energy"
  // pointe sur le nom catalogue "Monster". Les marques pas encore au catalogue
  // affichent un message "bientôt" dans la boutique.
  MC.LOGOS = [
    { name:'Coca-Cola',     src:'assets/logos/coca.png',       href:'boutique.html?b=Coca-Cola' },
    { name:'Takis',         src:'assets/logos/takis.png',      href:'boutique.html?b=Takis' },
    { name:'Monster Energy',src:'assets/logos/monster.webp',   href:'boutique.html?b=Monster' },
    { name:'Fanta',         src:'assets/logos/fanta.png',      href:'boutique.html?b=Fanta' },
    { name:'Kinder',        src:'assets/logos/kinder.png',     href:'boutique.html?b=Kinder' },
    { name:'Pringles',      src:'assets/logos/pringles.png',   href:'boutique.html?b=Pringles' },
    { name:'Red Bull',      src:'assets/logos/redbull.png',    href:'boutique.html?b=Red%20Bull' },
    { name:'KitKat',        src:'assets/logos/kitkat.png',     href:'boutique.html?b=KitKat' },
    { name:'7 Up',          src:'assets/logos/7up.png',        href:'boutique.html?b=7%20Up' },
    { name:"Reese's",       src:'assets/logos/reeses.png',     href:"boutique.html?b=Reese's" },
    { name:'Samyang',       src:'assets/logos/samyang.png',    href:'boutique.html?b=Samyang' },
    { name:'Calypso',       src:'assets/logos/calypso.png',    href:'boutique.html?b=Calypso' },
    { name:'Feastables',    src:'assets/logos/feastables.png', href:'boutique.html?b=Feastables' },
    { name:"Jack Link's",   src:'assets/logos/jacklinks.png',  href:"boutique.html?b=Jack%20Link's" }
  ];
})();
