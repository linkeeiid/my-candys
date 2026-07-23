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
    { id:'monster-ultra',name:'Monster Ultra Paradise',    brand:'Monster', price:2.49, old:null, reviews:190, nouveau:false, best:true,  tint:T.green,  cat:'Sodas' },
    { id:'monster-mango',name:'Monster Mango Loco',        brand:'Monster', price:2.49, old:null, reviews:150, nouveau:false, best:false, tint:T.yellow, cat:'Sodas' },
    { id:'monster-pipe', name:'Monster Pipeline Punch',    brand:'Monster', price:2.49, old:null, reviews:77,  nouveau:true,  best:false, tint:T.orange, cat:'Sodas' },
    { id:'monster-zero', name:'Monster Zero Sugar',        brand:'Monster', price:2.49, old:2.99, reviews:210, nouveau:false, best:false, tint:T.cyan,   cat:'Sodas' },
    { id:'fanta-grape',  name:'Fanta Grape (USA)',         brand:'Fanta',   price:2.90, old:null, reviews:56,  nouveau:false, best:true,  tint:T.purple, cat:'Sodas' },
    { id:'fanta-pine',   name:'Fanta Pineapple',           brand:'Fanta',   price:2.90, old:null, reviews:33,  nouveau:true,  best:false, tint:T.yellow, cat:'Sodas' },
    { id:'fanta-berry',  name:'Fanta Berry',               brand:'Fanta',   price:2.90, old:null, reviews:120, nouveau:false, best:false, tint:T.pink,   cat:'Sodas' },
    { id:'fanta-peach',  name:'Fanta Peach (Japan)',       brand:'Fanta',   price:3.20, old:4.10, reviews:41,  nouveau:false, best:false, tint:T.orange, cat:'Sodas', asie:true },
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
    { id:'calypso',      name:'Calypso Island Wave',       brand:null,      price:3.40, old:null, reviews:51,  nouveau:false, best:false, tint:T.pink,   cat:'Sodas' }
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
          '<div class="mc-prod-img" style="background:' + p.tint + '">' +
            '<div class="mc-stripes"></div>' +
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
