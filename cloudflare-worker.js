/* =============================================================================
   My Candy's — Cloudflare Worker (backend sécurisé)
   -----------------------------------------------------------------------------
   Le pont entre le site (GitHub Pages) et les services : Brevo (emails/contacts)
   + Firebase Realtime Database (enregistrements) + SumUp (paiement en ligne).
   Aucune clé secrète dans le site : tout passe par ce Worker (secrets dans Cloudflare).

   ROUTES :
     GET  /health           → test de vie
     GET  /catalog          → surcharges catalogue (public)
     POST /catalog          → écrit une surcharge (admin, Bearer ADMIN_KEY)
     GET  /admin/data       → dump newsletter/messages/orders (admin)
     POST /newsletter       → { email }
     POST /contact          → { name, email, message }
     POST /order            → (LEGACY) commande sans paiement
     POST /create-checkout  → { items:[{id,qty,name}], shipping, customer, promo }
                              → recalcule le montant CÔTÉ SERVEUR, crée la session Stripe Checkout
                                INTÉGRÉE (embedded, CB + Apple Pay + Google Pay), enregistre la
                                commande "en_attente_paiement"
                              → renvoie { clientSecret, sessionId, publishableKey, reference, amount }
                                (le site monte le formulaire de paiement sur la page, sans redirection)
     POST /stripe/verify    → { session_id, reference } → interroge Stripe ; si payé, finalise
                                la commande + email client (idempotent) — appelé à la fin du paiement
     POST /stripe/webhook   → événement Stripe signé (checkout.session.completed) → finalise
                                (filet si le client ferme l'onglet avant la confirmation)

   VARIABLES (Cloudflare → Settings → Variables and Secrets) :
     BREVO_API_KEY (secret) · BREVO_LIST_ID · SENDER_EMAIL · SENDER_NAME · TO_EMAIL
     FIREBASE_DB_URL · FIREBASE_SECRET (secret) · ADMIN_KEY (secret) · ALLOW_ORIGIN (opt)
     VAPID_PRIVATE_JWK (secret) — notifications push
     >>> À AJOUTER pour le paiement Stripe :
     STRIPE_SECRET_KEY      (secret)  clé secrète Stripe (sk_test_… puis sk_live_…)
     STRIPE_WEBHOOK_SECRET  (secret)  secret de signature du webhook (whsec_…)
     STRIPE_PUBLISHABLE_KEY (var)     clé publique Stripe (pk_test_… puis pk_live_…) — envoyée au site
   ============================================================================= */

/* Prix de BASE (source de vérité serveur, tiré de products.js). Le prix facturé =
   override Firebase /catalog/{id}.price s'il existe, sinon ce prix de base.
   ⚠️ Garder synchro si tu changes un prix dans products.js. */
const BASE_PRICES = {
  'prime-blue': 3.49,
  'prime-ice': 3.49,
  'prime-lemon': 3.49,
  'prime-moon': 3.49,
  'prime-straw': 3.49,
  'takis-fuego': 4.90,
  'takis-blue': 4.90,
  'takis-nitro': 4.90,
  'takis-guaca': 5.20,
  'monster-ultra-red': 3.49,
  'monster-ruby': 4.99,
  'monster-hawaiian': 4.99,
  'monster-punk': 4.99,
  'monster-razz': 4.99,
  'fanta-grape-jp': 3.49,
  'fanta-peach-jp': 3.79,
  'fanta-litchi': 2.29,
  'fanta-pasteque': 2.29,
  'fanta-pomme': 2.19,
  'fanta-berry': 1.99,
  'fanta-fraise': 1.99,
  'fanta-ananas': 2.09,
  'coca-cherry': 1.69,
  'coca-vanille': 1.49,
  'coca-lemon': 1.69,
  'coca-peche-china': 2.29,
  'coca-fraise-china': 2.29,
  'redbull-blue': 2.49,
  'redbull-peach': 2.49,
  'redbull-pink': 2.49,
  'redbull-sakura': 2.49,
  'redbull-sudachi': 2.49,
  'redbull-ginger': 3.59,
  'redbull-tonic': 3.59,
  'capri-monster': 2.29,
  'capri-cola': 0.89,
  'capri-mango': 0.79,
  'capri-safari': 0.89,
  'capri-dragon': 0.89,
  'capri-elec-mango': 2.29,
  'oasis-cassis': 2.09,
  'oasis-summer': 3.49,
  'oasis-citrus': 2.00,
  'nestea-pear': 2.19,
  'nestea-lychee': 1.29,
  'nestea-mango': 2.09,
  'nestea-straw': 2.00,
  'starbucks-lime': 4.39,
  'starbucks-peach': 4.39,
  'popcorn-twix': 3.49,
  'popcorn-oreo': 3.49,
  'popcorn-snickers': 3.49,
  'popcorn-mm': 3.49,
  'werther-popcorn': 6.19,
  'werther-bites': 5.89,
  'drpepper-cherry': 2.19,
  'lipton-raspberry': 2.39,
  'lipton-watermelon': 2.29,
  'lipton-tropical': 1.79,
  'lipton-kombucha': 3.39,
  'estathe-vert': 2.29,
  'estathe-peche': 4.99,
  'estathe-lemon': 2.09,
  'bergen-pb': 2.69,
  'bergen-pistache': 2.49,
  'popin-choco': 2.99,
  'popin-straw': 2.99,
  'ifri-lemon': 0.69,
  'ifri-orange': 0.69,
  'ifri-tropical': 0.69,
  'selecto': 2.49,
  'sprite-tropical': 2.19,
  'sprite-sour': 2.39,
  'mtndew-spark': 2.49,
  'mtndew-pitch': 2.49,
  'kinder-schoko': 5.90,
  'kinder-joy': 3.20,
  'kinder-cards': 2.50,
  'sourpatch': 3.59,
  'sourpatch-blue': 3.59,
  'skittles-fruits': 3.79,
  'skittles-tropical': 3.79,
  'skittles-berry': 3.79,
  'skittles-giants': 3.79,
  'skittles-crazy-sours': 3.79,
  'skittles-squishy': 3.79,
  'chupa-madz': 4.69,
  'chupa-coco': 3.19,
  'ring-pop': 1.49,
  'oreo-bday': 4.50,
  'samyang': 2.29,
  'chamoy': 12.90,
  'hershey': 3.20,
  'nerds': 4.69,
  'poptarts': 5.50,
  'mochi': 5.90,
  'calypso-island': 1.99,
  'calypso-original': 3.19,
  'calypso-ocean': 3.39,
  'calypso-kiwi': 3.39,
  'calypso-strawberry': 3.39,
  'calypso-melon': 3.39,
  'cheetos-poulet': 2.49,
  'cheetos-steak': 2.49,
  'cheetos-sweet-chili': 2.49,
  'cheetos-crevette': 3.49,
  'takis-chrunchies-blue': 3.49,
  'salt-chip-challenge': 9.99,
  'hot-chip-challenge': 9.99,
  'takis-chrunchies-red': 3.49,
  'glace-kinder-takis-fuego': 3.49,
  'glace-sp-eculos-takis-blue-heat': 3.49,
  'glace-oasis': 2.50,
  'mars-glac-e': 1.50,
  'mister-freez': 0.50,
  'glace-twister': 2.00,
  'werther-s-original-salted-caramel': 5.99,
  'glace-fus-ee': 2.00,
  'werther-s-original-classic': 5.99,
  'pop-in-cola': 3.99,
  'pop-in-caramel': 3.99,
  'netflix-popcorn': 5.99,
  'candy-pop-twix': 7.99,
  'candy-pop-snickers': 7.99,
  'candy-pop-oreo': 7.99,
  'candy-pop-m-ms': 7.99,
  'candy-pop-mini-oreo': 2.99,
  'candy-pop-mini-snickers': 2.99,
  'candy-pop-mini-m-ms': 2.99,
  'beef-jerry-original': 3.49,
  'beef-jerry-teriyaki': 3.49,
  'pop-in-tutti-frutti': 3.99,
  'werther-s-original-crunchy-140g': 4.99,
  'lion-peanut': 1.49,
  'snickers': 1.49,
  'mars': 1.49,
  'reese-s-white': 2.99,
  'twix': 1.49,
  'lion-brownie-style': 1.49,
  'buldak-carbonara': 3.19,
  'twix-white': 1.49,
  'snickers-creamy': 1.49,
  'buldak-spicy': 3.19,
  'lion-white': 1.49,
  'buldak-cheese': 3.19,
  'samyang-quattro-cheese-80g': 3.49,
  'samyang-rose-cup-80g': 3.49,
  'hot-chip-challenge-2-5g': 9.99,
  'lays-frite': 2.99,
  'twix-salted-caramel': 1.49,
  'takis-crispi': 3.49,
  'lays-nouilles': 3.49,
  'pringles-mingles-sharp-white': 3.49,
  'frosty-drump-70g': 6.50,
  'frosty-burger-100g': 6.50,
  'sponge-bob-panda-60g': 3.99,
  'cheetos-poulet-25g-1-50-cheetos-steak-25g': 1.50,
  'giotto-momenti-cooki-cream': 6.99,
  'giotto-momenti-haselnuss-154g': 6.99,
  'kellogs-frosted-flakes-strawberry-350g': 8.99,
  'donut-cacao-37g': 2.49,
  'crunchiz-loops-n-hoops-375g': 3.99,
  'crunchiz-choco-pops-375g': 3.99,
  'smash-sweet-salty-crispy': 3.49,
  'crunchiz-classic-flakes-375g': 3.99,
  'palomitas-caramelo-30g': 1.50,
  'b-lue-watermelon-smoothie-50cl': 3.50,
  'b-lue-orange-50cl': 3.50,
  'dr-pepper-cherry-33cl': 2.50,
  'fanta-peche-blanche-33cl': 2.50,
  'frizzy-pazzy-fraise-7g': 0.50,
  'perlerz-gummy-mango': 2.99,
  'skittles-citrus': 2.50,
  'rolli-gum': 1.49,
  'skittles-squishy-cloudz-sour-70g': 2.50,
  'haribo-roulette-cola-24g': 0.99,
  'perlerz-gummy-grape': 2.99,
  'frosty-bites-freeze-dried-candy': 3.49,
  'candy-vendor-15g': 2.49,
  'frosty-bites-freeze-candy-40g': 3.49,
  'push-pop-15g': 1.99,
  'fruits-gummy-strawberry-65g': 2.99,
  'ring-pop-10g': 0.99,
  'skittles-wild-berry-flavour-109g': 2.50,
  'juicy-drop-pop-26g': 2.79,
  'so-sour-slim-30g': 1.99,
  'kitkat-crunchy-funky': 1.99,
  'twix-snickerdoodle': 3.49,
  'kitkat-lemon': 2.49,
  'kitkat-churros': 2.49,
  'twix-torta-de-sabor-morango-40g': 3.49,
  'kitkat-cherry-vanilla': 2.49,
  'twix-triplo-choco': 3.49,
  'kitkat-salted-caramel-cheescake-41-5g': 2.49,
  'barre-evasion-noisettes-feuillantine-14g': 1.99,
  'arabian-sweet-white-chocolat-duba-i-pistache': 14.99,
  'tablette-evasion-clats-de-biscuit-150g': 5.50,
  'tablette-momenti-evasion-chocolat-djazair-100g': 7.99,
  'arabian-sweet-chocolat-duba-i-pistache-200g': 14.99,
  'arabian-sweet-chocolat-duba-i-pistache-100g': 8.99,
  'tablette-evasion-caramel-creme': 5.50,
  'the-taste-of-dubai-coco': 5.99,
  'arabian-sweet-chocolat-duba-i-bueno-200g': 14.99,
  'arabian-sweet-chocolat-duba-i-bueno-100g': 8.99,
  'tablette-moment-evasion-cara-ibe-100g': 7.99,
  'buenos-dias-cr-eme-coconut-55g': 1.99,
  'pepero-choco-cookie': 2.99,
  'buenos-dias-cr-eme-speculos-55g': 1.99,
  'toffifee-caramel-choco': 4.49,
  'pepero-strawberry': 2.99,
  'pepero-crunchy': 2.99,
  'kinder-milkredible-chocolate-48-6g': 4.99,
  'buenos-dias-cr-eme-noisettes-55g': 1.99,
  'buenos-dias-cr-eme-fraise-55g': 1.99,
  'buenos-dias-cr-eme-pistache-55g': 1.99,
  'pickle-in-a-pouch-sour': 3.49,
  'toffifee-white-choco': 4.49,
  'pickle-in-a-pouch-hot': 3.49,
  'niklnip-87g': 6.99,
  'pickle-in-a-pouch-garlic': 3.49,
  'peelerz-gummy-pineapple-65g': 2.99,
  'nerds-grappe-strawberry-46g': 1.99,
  'nerds-watermelon-chery-46g': 1.99,
  'airheads-watermelon-15g': 0.99,
  'kinder-kornetti-cioccolato': 8.49,
  'prestige-apple-gummy-sour-strawberry-100g': 2.49,
  'airheads-sour-blue-blast-15g': 0.99,
  'airheads-sour-watermelon-punch-15g': 0.99,
  'candy-fizz-trio-21g': 1.99,
  'capri-sun-fruit-mix': 5.99,
  'juicy-drop-gummies-xtreme-57g': 3.49,
  'maltersers-white': 2.99,
  'happy-choice-45g': 1.99,
  'tablette-moment-caramel-cr-eme-150g': 5.50,
  'biscoff-breadsticks': 3.99,
  'mars-protein-low-sugar-57g': 3.49,
  'tablette-moment-eclat-de-biscuit-150g': 5.50,
  'nutymax-pistachio-cream-44g': 2.49,
  'oreo-toffee-crunch-275-55g': 4.99,
  'kitkat-cookie-dough-41-5g': 2.49,
  'sour-shok-chewy-blast': 1.99,
  'snickers-protein': 3.49,
  'oreo-cake': 0.99,
  'mr-beast-feastable-cookie-cream-60g': 6.99,
  'chupa-chups-fr-ooze-pop': 1.99,
  'chips-deluxe-minis-m-ms-45g': 3.49,
  'lay-s-piment-70g': 3.49,
  'lay-s-italien-red-meat-70g': 3.49,
  'extr-eme-buldak-zzaldduk-80g': 3.49,
  'twix-cookie-dough-38-6g': 3.49,
  'twix-cookie-cream-77-1g': 5.99,
  'snickers-maracuja-brazil': 2.49,
  'snickers-berry-whip': 2.49,
  'snickers-duplo-choco': 2.49,
  'snickers-bianco': 2.49,
  'twix-wafer-rolls': 2.49,
  'nutymax-wafer-with-pistachio-cream-42g': 2.49,
  'snickers-p-ecan': 2.49,
  'snickers-wafer-rolls-24g': 2.49,
  'bergen-cookies-candy-floos-128g': 2.99,
  'tablette-story-pistache': 6.99,
  'bergen-cookies-bubble-gum-128g': 2.99,
  'angel-hair-180g': 14.99,
  'candy-fruit-130g': 8.00,
  'cookies-whites-pistache': 2.99,
  'bergen-cookies-brownie-128g': 2.99,
  'santabubu': 8.99,
  'candy-fruit': 15.00,
  'cookies-obsession-12g': 2.99,
  'chocobubu': 8.99,
  'pop-in-chiken-chocolat': 3.99,
  'gupperz-gummy-liquid-filled-popperz': 3.99,
  'gupperz-gummy-liquid-filled-popperz-42g': 3.99,
  'van-holten-s-slaps': 2.99,
  'bertie-bott-s-beans': 4.99,
  'm-m-s-honey-roasted-peanut-49g': 3.49,
  'gupperz-gummy-liquid-filled-popperz-72g': 3.99,
  'fresquito-kfc': 1.19,
  'roll-ups-roules-tropique-exotique-141g': 6.99,
  'reese-s-choco-lava-big-cup': 3.49,
  'kinder-bueno-dark': 1.99,
  'm-m-s-pop-d-caramel': 11.99,
  'nerds-drink-mix-16-2g': 3.99,
  'roll-ups-roules-sour-141g': 6.99,
  'twinkies-cookie-dough-88g': 4.49,
  'm-m-s-cookie-dough': 4.99,
  'm-m-s-brownie-brittle': 7.99,
  'brets-fromage-du-jura': 3.49,
  'brets-sel-vinaigre': 3.49,
  'soda-spray-60ml': 1.99,
  'brets-ch-evre-piment-d-espelette': 3.49,
  'lays-3d-fromage': 1.99,
  'frizzy-pazzy-cola': 0.50,
  'brets-sauce-curry': 3.49,
  'lays-3d-paprika-85g': 1.99,
  'sour-potty': 1.99,
  'cry-baby-sour-mini-drinks-79g': 3.49,
  'pringles-tokidoki': 3.49,
  'pringles-hot-spicy': 3.49,
  'pringles-cucumber-sea-salt-110g': 3.49,
  'caprice-caramel': 7.99,
  'pringles-spiced-chiken': 3.49,
  'pringles-lime-tart-110g': 3.49,
  'pringles-black-pepper-parmesan': 3.49,
  'el-morjen': 14.99,
  'pringles-crayfish-flavor': 3.49,
  'pringles-stax-creamy-onion-90g': 3.49,
  'pringles-stax-mustard-avocado-90g': 3.49,
  'takis-crisps-blue-heats-155-92': 3.99,
  'kitkat-crunchy-white': 1.99,
  'kitkat-crunchy-peanut': 1.99,
  'neards-grappe-strawberry': 2.99,
  'kinder-bueno': 1.99,
  'kinder-creamy': 1.99,
  'oreo-wajer-roll-vanille': 2.79,
  'kinder-maxi': 1.99,
  'kinder-schoko-bon-crispy': 6.99,
  'reese-os-oreo': 3.49,
  'mr-beast-festable-creamy-chocolate-40g': 3.99,
  'kinder-country': 1.99,
  'oreo-wajer-roll-choco': 2.79,
  'kinder-pane-cioc': 7.49,
  'mr-beast-festable-creamy-peanut-40g': 3.99,
  'kinder-milkredible-white-48-6g': 4.99,
  'kinder-crispy': 2.49,
  'ferrero-hanuta-riegel': 4.99,
  'kinder-bueno-white': 1.99,
  'kinder-kornetti-cream-latte': 8.49,
  'lipton-kombucha-mango-passion-fruit-25cl': 2.00,
  'l-selecto-25cl': 3.00,
  'l-hawa-i-caraibe-25cl': 3.00,
  'ice-tea-past-eque-menthe-33cl': 1.50,
  'oasis-pomme-cassis-framboise-33cl': 1.50,
  'oasis-ice-tea-33cl': 1.50,
  'l-schweppes-grenadine-25cl': 3.00,
  'hawa-i-fraise-25cl': 3.00,
  'hamoud-25cl': 3.00,
  'l-12-00-l-ifruit-20cl': 2.50,
  'l-ifruit-25cl': 3.00,
  'l-12-00-l-ice-tea-p-eche-33cl': 1.50,
  'l-oasis-fraise-framboise-33cl': 1.50,
  'l-coca-cola-33cl': 1.50,
  'l-fusetea-past-eque-33cl': 2.00,
  'ice-tea-framboise-33cl': 1.50,
  'oasis-pomme-poire-33cl': 1.50,
  'l-coca-cola-cherry-33cl': 1.50,
  'l-fusetea-fraise-melon-33cl': 2.00,
  'l-fusetea-mangue-ananas-33cl': 2.00,
  'l-60-61-l-ice-tea-tropical-33cl': 1.50,
  'l-red-bull-cereja-25cl': 3.50,
  'l-red-bull-citron-25cl': 3.50,
  'l-red-bull-pomelo-25cl': 3.50,
  'red-bull-ananas-orange-25cl': 3.50,
  'l-red-bull-pamplemousse-25cl': 3.50,
  'l-red-bull-curuba-25cl': 3.50,
  'l-red-bull-pomme-raisin-25cl': 3.50,
  'l-red-bull-caf-e-25cl': 3.50,
  'l-red-bull-past-eque-25cl': 2.50,
  'l-red-bull-cerise-sakura-25cl': 3.50,
  'l-red-bull-berry-cor-ee-25cl': 3.50,
  'l-red-bull-a-a-i-cor-ee-25cl': 3.50,
  'l-red-bull-plus-25cl': 3.50,
  'l-red-bull-gingembre-25cl': 2.50,
  'l-red-bull-organics-p-eche-33cl': 3.80,
  'l-coca-cola-z-ero-33cl': 1.50,
  'l-coca-cola-peche-blanche-33cl': 2.50,
  'l-lorina-limonade-en-verre-20cl': 2.50,
  'l-estath-e-peche-en-verre-20cl': 2.50,
  'l-red-bull-organics-black-berry-33cl': 3.80,
  'l-red-bull-organics-gimgembre-25cl': 3.80,
  'l-coca-cola-lemon-33cl': 1.50,
  'l-red-bull-organics-cola-33cl': 3.80,
  'l-red-bull-organics-tonic-water-25cl': 3.80,
  'l-coca-cola-japon-33cl': 2.50,
  'l-coca-cola-fraise-33cl': 1.50,
  'l-coca-cola-en-verre-20cl': 2.50,
  'coca-cola-allu-30cl': 3.50,
  'l-estath-e-limone-en-verre-20cl': 2.50,
  'l-fanta-pomme-japon-50cl': 3.50,
  'l-red-bull-classique-25cl': 2.50,
  'l-takis-blue-heat': 4.99,
  'red-bull-coco-a-ai-25cl': 2.50,
  'l-10-l-red-bull-past-eque-25cl': 2.50,
  'l-selecto-33cl': 2.50,
  'l-schweppes-grenadine-24cl': 2.00,
  'l-slim-litchi-24cl': 2.00,
  'nesquik-chocolat-41cl': 4.99,
  'b-lue-raisin-50cl': 3.50,
  'l-fanta-japon-ananas-33cl': 2.50,
  'l-slim-pomme-33cl': 2.50,
  'l-schweppes-peche-24cl': 2.00,
  'l-dz-power-25cl': 2.00,
  'l-nesquik-fraise-banane-41cl': 4.99,
  'l-b-lue-fraise-50cl': 3.50,
  'l-b-lue-litchi-50cl': 3.50,
  'l-fanta-japon-jasmin-33cl': 2.50,
  'l-fanta-litchi-33cl': 2.50,
  'l-slim-orange-33cl': 2.50,
  'l-apla-24cl': 2.00,
  'l-poms-33cl': 2.50,
  'l-sprite-framboise-citron-33cl': 2.50,
  'l-b-lue-citron-50cl': 3.50,
  'l-b-lue-chinoise-orange-60cl': 3.50,
  'l-fanta-japon-pomme-verte-33cl': 2.50,
  'l-fanta-red-apple-33cl': 2.50,
  'l-fanta-poire-33cl': 2.50,
  'l-fanta-japon-past-eque-33cl': 2.50,
  'l-sprite-chine-menthe-citron-33cl': 2.50,
  'pepsi-cherry-33cl': 2.50,
  'pepsi-agrumes-japon-33cl': 2.50,
  'l-mountain-dew-tropical-33cl': 2.50,
  'l-calypso-berry-bloom-33cl': 2.50,
  'l-fanta-prune-japonaise-25cl': 2.50,
  'l-fanta-raisin-33cl': 2.50,
  'l-fanta-lychee-japon-33cl': 2.50,
  'l-fanta-melon-japon-33cl': 2.50,
  'l-pepsi-citron-chinois-33cl': 2.50,
  'l-pepsi-citron-vert-33cl': 2.50,
  'l-mountain-dew-pineapple-33cl': 2.50,
  'l-calypso-blood-orange-33cl': 2.50,
  'l-fanta-pamplemousse-ananas-33cl': 2.50,
  'l-fanta-ananas-33cl': 2.50,
  'fanta-berry-33cl': 2.50,
  'l-fanta-peach-33cl': 2.50,
  'l-7-58-l-pepsi-mango-33cl': 2.50,
  'l-mountain-dew-orange-33cl': 2.50,
  'l-calypso-apple-oasis-33cl': 2.50,
  'l-schweppes-p-eche-25cl': 3.00,
  'l-biscoff-lotus': 7.99,
  'frosty-drump-choco': 6.00,
  'glace-banane': 12.00,
  'pot-glace-nutella': 8.99,
  'tromp-e-l-oeil-fraise-90g': 7.50,
  'jack-pot-candy-machine-30g': 1.99,
  'fries-crunch-pop': 6.00,
  'steak-shaped': 6.00,
  'glace-trompe-l-oeil-ananas-75g': 6.50,
  'frosty-drump-vanille-70g': 6.00,
  'glace-trompe-l-oeil-raisin': 6.50,
  'mini-oreo': 7.99,
  'b-pop': 1.99,
  'glace-oreo': 2.50,
  'tromp-e-l-oeil-pistache-90g': 7.50,
  'cry-baby-mini-drinks': 6.99,
  'frite-lay-s': 2.99,
  'pipas-mexicaine-1-kinder-brioss': 1.00,
  'el-mordjene-butter-cream': 19.99,
  'cookies-peanut-butter': 2.99,
  'lamo-os-chocolat': 14.99,
  'mr-bite-pixel-28g': 0.80,
  'dreamy-40g-1-99-mochi-maple-pancake': 2.49,
  'el-mordjene': 17.99,
  'kinder-tris': 6.99,
  'lamo-os-mangue-80g': 7.99,
  'pepero-fraise': 2.99,
  'snickers-xtreme': 2.49,
  'pop-tarts-sundae': 2.99,
  'flipz': 3.49,
  'bueno-dias': 5.99,
  'chocolat-dubai-coconut-90g': 4.99,
  'noix-de-p-ecan': 7.99,
  'lion-black-white': 1.99,
  'pop-tarts-s-mores': 2.99,
  'iconiksweet-fraise': 4.99,
  'kinder-maxi-king': 1.50,
  'boule-magique-original': 0.50,
  'mammouth-ball': 2.99,
  'nerds-juicy-gummy': 3.49,
  'laffy-taffy-pasteque-42g': 1.49,
  'tubble-color-blue-35g': 1.49,
  'kinder-choco-fresh': 4.99,
  'boule-magique-pica': 0.50,
  'nerds-rope-very-berry-26g': 2.49,
  'nerds-gummy-cluster': 3.49,
  'laffy-taffy-fraise-42g': 1.49,
  'tubble-color-red-35g': 1.49,
  'push-pop-flip-in': 2.49,
  'snickers-boule-magique-cola': 0.50,
  'nerds-grape-strawberry-46g': 1.99,
  'nerds-rope-rainbow-26g': 2.49,
  'bubble-n-roll-58g': 2.49,
  'p-elerez-gummy-peach': 2.99,
  'lu-barquettes-fraise-120g': 3.49,
  'hitchies-blue-ball-125g': 3.49,
  'monstre-munich-ketchup-85g': 2.99,
  'trompe-l-oeil-pistache-100g-7-99-hitchies-blue': 2.99,
  'hitchies-mix-ball-125g': 3.49,
  'lutti-roll-up-29g': 1.99,
  'glace-stath-e-p-eche': 2.50,
  'glace-stath-e-citron-10-cable-usb-c': 9.99,
  'glace-stath-e-citron': 2.50,
  'cable-usb-c-lightning': 9.99,
  'chargeur-secteur-usb-a-c': 18.99,
  'cable-usb-c': 9.99,
  'chargeur-secteur-usb-a': 14.99,
  'kit-chargeur-secteur-usb-a-c': 24.99,
  'kit-chargeur-secteur-usb-a-lightning': 24.99,
  'couteur-jack-3-5-14-99-couteur-type-c': 14.99,
  'couteur-jack-3-5': 14.99,
  'cheetos-fromage': 2.99,
  'cheetos-crunchy-fromage': 2.99,
  'poulet-frit-spicy': 9.99,
  'kinder-bueno-cr-eme-glac-ee-285g': 8.99,
  'corn-dog-mozzarella-saucisse-vollaile-400g': 9.99,
  'corn-dog-saucisse-volaille-400g': 9.99,
  'poulet-frit-soja-miel-350g': 9.99,
  'gummy-shake-snack': 2.99,
  'pop-in-chicken-chocolate-50g': 3.49,
  'mjcare-on-mask-22g': 2.99,
  'hershey-s-cookies-n-cr-eme-43g': 2.00,
  'lay-s-ondul-ees-poulet-thym-120g': 2.50,
  'bergen-red-velvet-cookies-128g': 2.50,
  'pickle-puffed-snacks-big-papa-50g': 2.99,
  'lay-s-barbecue': 3.49,
  'cheetos-pizza': 2.99,
  'brets-camembert-125g': 3.49,
  'brets-carbonara-125g': 3.49,
  'cheetos-pelotazos-futebolas-130g': 2.99,
  'takis-fuego-130g': 5.99,
  'takis-intense-nacho-130g': 5.99,
  'lay-s-poulet-au-thym-inspiration-france-120g': 3.49,
  'pringles-tomate': 3.49,
  'buldak-hot-chiken': 3.19,
  'pringles-queijo': 3.49,
  'pringles-churrasco': 3.49,
  'pringles-spicy-mayo': 3.49,
  '34-90kg-pringles-pizza-marguerita-105g': 3.49,
  'pringles-galinha-caipira-gostinho-brazuca-100g': 3.49,
  'pringles-all-dressed-150g': 3.99,
  'pringles-everything-bagel-150g': 3.99,
  'pringles-chili-lime-156g': 3.99,
  'pringles-smoky-cheddar-150g': 3.99,
  'flipz-peanut-butter-90g': 3.49,
  'brets-miel-moutarde-40g': 2.50,
  'hosties-cinnamonrolls': 9.99,
  'bergen-cookies-white-chocolate-red-velvet': 9.99,
  'hostess-danish-blueberry-cream-cheese-468g': 9.99,
  'pringles-loaded-potato-skins': 3.99,
  'hostess-raspberry-zingers': 9.99,
  'm-m-s-peanut': 2.99,
  'm-m-s-pretzel-80g': 2.99,
  'm-m-s-peanut-butter-144-6g': 3.49,
  'kitkat-41-5g': 3.49,
  'milka': 2.50,
  'pringles-miel-moutarde-150g': 3.99,
  'bounty-wafer-rolls': 9.99,
  'pickle-in-a-pouch-garlic-joe': 3.49,
  'reese-s-strawberry-pb-j-79g': 9.99,
  'pickle-in-a-pouch-big-papa': 3.42,
  'crunch-snack': 9.99,
  'c-er-eales-lucky-charms': 9.99,
  'pickle-in-a-pouch-extreme-sour': 3.42,
  'caprisun-monster-alarm-147g': 3.80,
  'kinder-schoko-bons-crispy-22-4g': 2.00,
  'mini-mochi-fraise': 2.99,
  'cerdan-pies-fruits-des-bois': 2.99,
  'cerdan-pies-cola-20g': 2.99,
  'push-pop-dipperz-strawberry-12g': 2.99,
  'bliss-caramel-sea-salt-pretzel-43g': 2.99,
  'chick-n-gum-21g': 2.99,
  'pop-tarts-cinnamon-roll': 2.99,
  'harry-potter-berti-bott-s': 2.99,
  'fresquito-dip-lick-kfc-17g': 2.99,
  'mr-bite-pixel-30g': 2.99,
  'pop-tarts-blueberry': 2.99,
  'harry-potter-chocolat-frog-15g': 2.99,
  'flutes': 2.99,
  'nerds-fruits': 2.99,
  'nerds-gummy-clusters-very-berry': 2.99,
  'nerds-gummy-clusters-berry-punch-rush': 4.50,
  'big-chewy-nerds': 2.99,
  'nerds-rope-tropical-26g': 0.99,
  'pr-sour-splash': 2.99,
  'frosty-bites-freeze-dried-candy-sour-pebbles': 3.49,
  'frosty-bites-freeze-dried-candy-gummy-hamburger': 3.49,
  'kellogg-s-miel-pops': 2.99,
  'granola': 2.99,
  'granola-cookies-daim': 2.99,
  'milka-choco-sticks': 2.99,
  'lu-petit-colier-scholiertje-120g': 2.99,
  'frosty-bites-freeze-dried-candy-gummy-watermelon': 3.49,
  'frosty-bites-freeze-dried-candy-gummy-pineapple': 3.49,
  'chocapic': 4.99,
  'granola-cookies-amandes-caram-elis-ees-184g': 2.99,
  'milka-choco-p-epites': 2.99,
  'milka-choc-choc': 2.99,
  'palmito-caram-elis-ee': 2.99,
  '87-25kg-prince-chocolat-300g': 2.99,
  'granola-cookies-noisettes': 2.99,
  'milka-choco-cake': 2.99,
  'st-michel-120g': 2.49,
  'kinder-happy-hippo-biscuit-103-5g': 4.50,
  'kinder-crunch-cookies': 3.99,
  'nutella-b-ready-x15': 8.99,
  'glace-snickers': 1.99,
  'glace-raffaello': 2.99,
  'kinder-d-elice': 1.99,
  '87-25kg-nutella-biscuits': 4.99,
  'nutella-b-ready-x6': 4.99,
  'estath-e-ice-p-eche-350g': 8.99,
  'glace-snickers-caramel': 1.99,
  'glace-mars': 1.99,
  'corn-dogs-original': 9.99,
  'kinder-tronky-90g': 4.50,
  'kinder-kinderini': 5.99,
  'nutella-mini': 1.99,
  '87-25kg-nutella-go': 2.99,
  'estath-e-ice-citron-350g': 8.99,
  'glace-twix': 1.99,
  'glace-frosty-golden': 5.99,
  'frosty-pocket-citron': 2.99,
  '87-25kg-frosty-pocket-fraise': 2.99,
  'frosty-pocket-dracula': 2.99,
  'frosty-pocket': 2.99,
  'pastilove-pistachio-raspberry-130g': 7.99,
  'mister-frutz': 9.99,
  'mister-nutz': 9.99,
  'dr-bombay-peanut-butter': 8.99,
  'solero-bon-bon-strawberry-twist': 7.99,
  'dr-bombay-salted-caramel-waffle-sundaze': 8.99,
  '13-96-l-red-bull-coco-a-a-i-250ml': 3.50,
  '13-96-l-red-bull-energy-sparkling-pomelo-250ml': 3.50,
  '13-96-l-red-bull-energy-sparkling-pineapple-250ml': 3.50,
  'red-bull-energy-drink-summer-berry-250ml': 3.50,
  '19-96-l-cantabile-pomme-190ml': 2.99,
  '15-73-l-fresh-mangue-230ml': 2.99,
  '13-00-l-tropico-orange-ananas-33cl': 1.50,
  '13-96-l-red-bull-tonic-water-250ml': 3.50,
  '19-96-l-cantabile-past-eque-230ml': 2.99,
  'fresh-p-eche-230ml-13-00-l': 2.99,
  '13-00-l-tropico-fraise-kiwi-33cl': 1.50,
  '13-96-l-cantabile-citron-190ml': 2.99,
  '15-73-l-fresh-past-eque-230ml': 2.99,
  '13-00-l-fresh-blueberry-230ml': 2.99,
  '13-00-l-cara-ibos-litchi-33cl': 2.50,
  '11-20-l-calypso-island-wave-lemonade-473ml': 3.50,
  '10-l-fanta-pamplemousse-500ml': 2.50,
  '7-l-lipton-kamboucha-framboise-250ml': 2.50,
  '11-20-l-calypso-ocean-blue-lemonade-473ml': 3.50,
  '11-20-l-calypso-kiwi-lemonade-473ml': 3.50,
  '75-75-l-coca-cola-cherry-500ml': 2.50,
  '5-l-nesquik-vanilla-414ml-4-5-9-66-l': 2.50,
  '6-l-pago-p-eche-33cl': 2.50,
  '6-l-oasis-tropical-50cl': 2.50,
  '6-l-pago-fraise-33cl': 2.50,
  'lipton-p-eche-50cl': 2.50,
  '6-l-oasispomme-poire-50cl': 2.50,
  'oasis-tropical-2l': 3.50,
  'oasis-fraise-framboise-2l': 3.50,
  'lipton-p-eche-1-5l': 3.50,
  'oasis-pomme-cassis-framboise-2l': 3.50,
  'fanta-orange-1-5l': 3.50,
  'oasis-ice-t-ea-mangue-passion-1-5l': 3.50,
  'selecto-1-5l': 3.50,
  'coca-cola-classic-1l': 3.50,
  'coca-cola-citron-1-25l': 3.50,
  'coca-cola-z-ero-33cl': 1.50,
  'orangina-33cl': 1.50,
  'poulet-frit-crunchy': 9.99,
  'pipas-sal-ee': 0.80,
  'pipas-mexicaine-40g': 0.80,
  'schweppes-agrumes-33cl': 1.50,
  '87-25kg-poulet-frit-soja-miel-350g': 9.99,
  'tromp-e-l-oeil-fraise-75g': 6.50,
  'frizzy-pazzy-bubble-gum': 0.50,
  'frosty-burger': 6.50,
  'fanta-past-eque-33cl': 2.50,
  'pepsi-pomelo-bamboo-33cl': 2.50,
  'coca-cola-ch-erie-float-33cl': 2.50,
  '10-00-l-coca-cola-fraise-33cl': 2.50,
  '87-25kg-pepsi-pomelo-bamboo-33cl': 2.50,
  'fanta-pomme-rouge-33cl': 1.50,
  'fanta-prune-33cl': 2.50,
  'dr-pepper-cr-eme-fraise-33cl': 1.50,
  'pepsi-cr-eme-fraise-33cl': 2.50,
  'pipas-tostadas': 0.80,
  'pipas-cocteleo-chilli-40g': 0.80,
  'paille-sucre-acide-33cl': 0.10,
  'chips-hot-nut-9-99-hershey-s-cookies-40g': 2.80,
  'kool-aid-pineapple-13-laffy-taffy-23g': 0.99,
  'bliss-43g': 2.49,
  '14-l-fanta-fruit-punch-33cl': 1.50,
  'coca-cola-ch-erie-1-25l': 3.00,
  '6-l-corn-dog-mozzarella-original-400g': 9.99,
  '87-25kg-pop-in-cola': 3.99,
  'palomitas-choco-blanco': 1.50,
  'push-pop-15g-2-ring-pop-10g': 0.99,
  'red-bull-peche-fraise-25cl': 2.50,
  'l-hitchies-blue': 2.99,
  'hitchies-sour-mix-100g': 2.99,
  '11-96-l-reese-os-oreo': 5.99,
  'candy-pop-mini-twix': 2.99,
  'kitkat-white-41-5g': 2.49,
  'reese-s-42g': 9.99,
  'snickers-p-e-de-moleque-42g': 2.49,
  'snickers-peanut-brownie-45g': 2.49,
  'm-m-s-peanut-butter-jelly-46g': 3.49,
  'mini-mochi-vanille': 2.99,
  'lay-s-sabor-queso-curado-queijo-curado-140g': 3.49,
  'monstre-munich-original-85g': 2.99,
  'brets-cheddar-jalapeno-125g': 3.49,
  'cheetos-hands-barbecue-75g': 2.99,
  'box-blue': 29.90,
  'box-pink': 29.90,
  'box-hot': 32.90,
  'box-anti-gaspi': 24.90,
  'box-mega': 59.90
};
/* Frais de port (identiques à checkout) : coût de base + seuil de gratuité. */
const SHIP = { relais: { cost: 4.90, free: 39 }, domicile: { cost: 6.90, free: 59 } };
function shipCost(mode, sub) { const m = SHIP[mode] || SHIP.relais; return sub >= m.free ? 0 : m.cost; }
function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}
function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) }
  });
}
function isEmail(e) { return typeof e === 'string' && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.trim()); }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function money(n) { return (Number(n) || 0).toFixed(2).replace('.', ',') + ' €'; }
function str(s, max) { return String(s == null ? '' : s).trim().slice(0, max || 120); }
function rand6() { return String(Math.floor(100000 + Math.random() * 900000)); }

/* ---- Firebase Realtime Database (REST, authentifié par FIREBASE_SECRET) ---- */
function fbUrl(env, path) {
  const auth = env.FIREBASE_SECRET ? ('?auth=' + encodeURIComponent(env.FIREBASE_SECRET)) : '';
  return env.FIREBASE_DB_URL.replace(/\/+$/, '') + '/' + path + '.json' + auth;
}
async function fbPush(env, path, obj) {
  if (!env.FIREBASE_DB_URL) return null;
  const r = await fetch(fbUrl(env, path), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) });
  try { return await r.json(); } catch (e) { return null; } // { name: "<pushId>" }
}
async function fbSet(env, path, obj) {
  if (!env.FIREBASE_DB_URL) return null;
  const r = await fetch(fbUrl(env, path), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) });
  try { return await r.json(); } catch (e) { return null; }
}
async function fbPatch(env, path, obj) {
  if (!env.FIREBASE_DB_URL) return null;
  const r = await fetch(fbUrl(env, path), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) });
  try { return await r.json(); } catch (e) { return null; }
}
async function fbGet(env, path) {
  if (!env.FIREBASE_DB_URL) return null;
  const r = await fetch(fbUrl(env, path));
  try { return await r.json(); } catch (e) { return null; }
}

/* ---- Anti-spam : limite de débit par IP (compteur glissant dans Firebase) ----
   Renvoie true si l'IP a dépassé `max` requêtes sur `windowSec` secondes.
   L'IP est HASHÉE avant stockage (RGPD) et jamais conservée en clair.
   Fail-open : la moindre erreur => on n'bloque pas (on ne pénalise jamais un vrai client). */
async function rateLimited(env, request, bucket, max, windowSec) {
  try {
    if (!env.FIREBASE_DB_URL) return false;
    const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('X-Forwarded-For') || 'anon';
    let h = 2166136261; for (let i = 0; i < ip.length; i++) { h ^= ip.charCodeAt(i); h = (h * 16777619) >>> 0; }
    const key = 'ratelimit/' + bucket + '/' + h.toString(36);
    const now = Date.now();
    const rec = (await fbGet(env, key)) || {};
    if (rec.reset && now < rec.reset) {
      if ((rec.count || 0) >= max) return true; // fenêtre en cours + quota atteint => bloqué
      await fbPatch(env, key, { count: (rec.count || 0) + 1 });
    } else {
      await fbSet(env, key, { count: 1, reset: now + windowSec * 1000 }); // nouvelle fenêtre
    }
    return false;
  } catch (e) { return false; }
}

/* ---- Stripe Checkout INTÉGRÉ (formulaire de paiement sur le site : CB + Apple Pay + Google Pay) ---- */
// Crée une session Checkout en mode "embedded" (iframe sur le site, sans redirection).
// Les moyens de paiement (carte, wallets) sont ceux activés dans le dashboard Stripe.
async function stripeCreateSession(env, { reference, order, couponId }) {
  const p = [];
  p.push(['ui_mode', 'embedded_page']); // valeur exigée par la version d'API Stripe du compte (⚠️ PAS 'embedded' qui est refusé) — formulaire intégré + Apple Pay/Google Pay auto
  p.push(['mode', 'payment']);
  p.push(['redirect_on_completion', 'never']);
  p.push(['client_reference_id', reference]);
  p.push(['metadata[reference]', reference]);
  p.push(['locale', 'fr']);
  p.push(['adaptive_pricing[enabled]', 'false']); // pas de choix de devise (CHF, etc.) → EUR uniquement
  if (order.customer && order.customer.email) p.push(['customer_email', order.customer.email]);
  let i = 0;
  for (const l of order.items) {
    p.push(['line_items[' + i + '][price_data][currency]', 'eur']);
    p.push(['line_items[' + i + '][price_data][product_data][name]', l.name]);
    p.push(['line_items[' + i + '][price_data][unit_amount]', String(Math.round(l.price * 100))]);
    p.push(['line_items[' + i + '][quantity]', String(l.qty)]);
    i++;
  }
  if (order.shippingCost > 0) {
    p.push(['line_items[' + i + '][price_data][currency]', 'eur']);
    p.push(['line_items[' + i + '][price_data][product_data][name]', 'Livraison (' + (order.shipping === 'domicile' ? 'à domicile' : 'point relais') + ')']);
    p.push(['line_items[' + i + '][price_data][unit_amount]', String(Math.round(order.shippingCost * 100))]);
    p.push(['line_items[' + i + '][quantity]', '1']);
    i++;
  }
  if (couponId) p.push(['discounts[0][coupon]', couponId]);
  const bodyStr = p.map(function (kv) { return encodeURIComponent(kv[0]) + '=' + encodeURIComponent(kv[1]); }).join('&');
  const r = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + env.STRIPE_SECRET_KEY, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: bodyStr
  });
  try { return await r.json(); } catch (e) { return null; }
}
// Coupon « montant fixe » à usage unique pour appliquer exactement la remise calculée côté serveur.
async function stripeCreateCoupon(env, amountOffCents) {
  const bodyStr = 'amount_off=' + amountOffCents + '&currency=eur&duration=once&max_redemptions=1&name=' + encodeURIComponent('Reduction My Candys');
  const r = await fetch('https://api.stripe.com/v1/coupons', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + env.STRIPE_SECRET_KEY, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: bodyStr
  });
  try { return await r.json(); } catch (e) { return null; }
}
async function stripeGetSession(env, id) {
  const r = await fetch('https://api.stripe.com/v1/checkout/sessions/' + encodeURIComponent(id), {
    headers: { 'Authorization': 'Bearer ' + env.STRIPE_SECRET_KEY }
  });
  try { return await r.json(); } catch (e) { return null; }
}
// Vérifie la signature d'un webhook Stripe (HMAC-SHA256 sur "<t>.<raw>").
async function verifyStripeSig(raw, sigHeader, secret) {
  if (!secret || !sigHeader) return false;
  const parts = {};
  sigHeader.split(',').forEach(function (kv) { const i = kv.indexOf('='); if (i > 0) { const k = kv.slice(0, i).trim(); (parts[k] = parts[k] || []).push(kv.slice(i + 1).trim()); } });
  const t = parts.t && parts.t[0];
  const v1 = parts.v1 || [];
  if (!t || !v1.length) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(t + '.' + raw));
  const bytes = new Uint8Array(mac);
  let hex = ''; for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
  return v1.some(function (sig) { return sig === hex; });
}

/* ---- Brevo : contact (newsletter) ---- */
async function brevoAddContact(env, email, attributes) {
  return fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', 'accept': 'application/json' },
    body: JSON.stringify({
      email: email.trim(),
      updateEnabled: true,
      listIds: env.BREVO_LIST_ID ? [Number(env.BREVO_LIST_ID)] : undefined,
      attributes: attributes || undefined
    })
  });
}
/* ---- Brevo : email transactionnel ---- */
async function brevoSendEmail(env, { toEmail, toName, subject, html, replyTo }) {
  return fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': env.BREVO_API_KEY, 'Content-Type': 'application/json', 'accept': 'application/json' },
    body: JSON.stringify({
      sender: { email: env.SENDER_EMAIL, name: env.SENDER_NAME || "My Candy's" },
      to: [{ email: toEmail, name: toName || undefined }],
      replyTo: replyTo ? { email: replyTo } : undefined,
      subject,
      htmlContent: html
    })
  });
}

/* ===== WEB PUSH — notifications « nouvelle commande » au gérant (comme Blade Society) =====
   Clé publique VAPID en clair (elle est publique). Clé privée = variable Cloudflare VAPID_PRIVATE_JWK. */
const VAPID_PUBLIC = 'BAr4-ARxYqECbfUR34jmYYDy9d_vV02ERaI4AFyuAGhbljREhyLG1fhng6feKRSd-gNilsYUEIPI2CuAvAFSvao';
function _b64url(buf) { var a = new Uint8Array(buf), b = ''; for (var i = 0; i < a.length; i++) b += String.fromCharCode(a[i]); return btoa(b).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function _utf8(s) { return new TextEncoder().encode(s); }
async function vapidJWT(env, aud) {
  var enc = function (o) { return _b64url(_utf8(JSON.stringify(o))); };
  var signingInput = enc({ typ: 'JWT', alg: 'ES256' }) + '.' + enc({ aud: aud, exp: Math.floor(Date.now() / 1000) + 43200, sub: 'mailto:hello@mycandys.fr' });
  var key = await crypto.subtle.importKey('jwk', JSON.parse(env.VAPID_PRIVATE_JWK), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']);
  var sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, _utf8(signingInput));
  return signingInput + '.' + _b64url(sig);
}
async function sendPush(env, sub) {
  try {
    var jwt = await vapidJWT(env, new URL(sub.endpoint).origin);
    var r = await fetch(sub.endpoint, { method: 'POST', headers: { 'TTL': '86400', 'Authorization': 'vapid t=' + jwt + ', k=' + VAPID_PUBLIC } });
    return r.status; // 201 = OK ; 404/410 = abonnement expiré
  } catch (e) { return 0; }
}
async function notifyNewOrder(env) {
  if (!env.VAPID_PRIVATE_JWK) return;
  try {
    var subs = await fbGet(env, 'push_subs');
    if (!subs) return;
    var list = Object.keys(subs).map(function (k) { return subs[k]; }).filter(function (s) { return s && s.endpoint; });
    await Promise.all(list.map(function (s) { return sendPush(env, s); }));
  } catch (e) {}
}

/* Prénom seul (jamais le nom complet dans les emails) — 1er mot, capitalisé. */
function firstName(n) {
  n = String(n || '').trim(); if (!n) return '';
  var f = n.split(/[\s]+/)[0];
  return f.charAt(0).toUpperCase() + f.slice(1);
}
/* En-tête logo des emails — URL absolue (obligatoire en email ; le domaine est en ligne). */
function logoHdr() {
  return '<div style="text-align:center;padding:4px 0 16px"><img src="https://mycandys.fr/assets/logo.png" alt="My Candy\'s" width="150" style="width:150px;max-width:62%;height:auto"></div>';
}
/* URL d'image absolue pour les emails (les data: ne s'affichent pas dans Gmail → ignorées). */
function imgAbs(src) { src = String(src || ''); if (!src || /^data:/i.test(src)) return ''; if (/^https?:/i.test(src)) return src; return 'https://mycandys.fr/' + src.replace(/^\//, ''); }
/* Lignes produits AVEC photo pour les emails (photo + nom × qté + prix). */
function itemRowsHtml(o) {
  return (o.items || []).map(function (l) {
    var im = imgAbs(l.img);
    var cell = im
      ? '<img src="' + im + '" width="44" height="44" style="border-radius:8px;object-fit:contain;background:#fff;border:1px solid #F0DCE8;display:block">'
      : '<div style="width:44px;height:44px;border-radius:8px;background:#FFF1F8;text-align:center;line-height:44px;font-size:20px">🍬</div>';
    return '<tr>' +
      '<td style="padding:7px 0;width:52px;vertical-align:middle">' + cell + '</td>' +
      '<td style="padding:7px 10px;vertical-align:middle;font-size:14px">' + esc(l.name) + '<span style="color:#8A6076"> × ' + (l.qty || 1) + '</span></td>' +
      '<td style="padding:7px 0;text-align:right;vertical-align:middle;font-size:14px;white-space:nowrap">' + money((l.price || 0) * (l.qty || 1)) + '</td>' +
    '</tr>';
  }).join('');
}
function orderEmailHtml(o) {
  var ship = o.shippingCost ? money(o.shippingCost) : 'Offerte';
  return '<div style="font-family:Arial,sans-serif;color:#2A0A1C;max-width:520px;margin:auto">' + logoHdr() +
    '<h2 style="color:#E01784">Merci pour ta commande ! 🍬</h2>' +
    '<p>Paiement bien reçu. On prépare ton colis avec soin.</p>' +
    '<p style="font-size:13px;color:#8A6076">Commande <b>' + esc(o.reference || '') + '</b></p>' +
    '<table style="width:100%;border-collapse:collapse">' + itemRowsHtml(o) +
    '<tr><td colspan="2" style="padding-top:10px;border-top:1px solid #eee;font-size:14px">Livraison</td><td style="padding-top:10px;border-top:1px solid #eee;text-align:right;font-size:14px">' + ship + '</td></tr>' +
    '<tr><td colspan="2" style="padding-top:8px;font-size:15px"><b>Total payé</b></td>' +
    '<td style="padding-top:8px;text-align:right;font-size:15px"><b>' + money(o.total) + '</b></td></tr></table>' +
    '<p style="color:#8A6076;font-size:13px">Comme certains produits sont réapprovisionnés à la commande, ' +
    'compte quelques jours de préparation. Tu recevras ton <b>numéro de suivi</b> par email dès l\'expédition. 💌</p>' +
    '<p style="text-align:center;margin:22px 0 6px"><a href="https://mycandys.fr/suivi-commande" style="background:#E01784;color:#fff;text-decoration:none;font-weight:700;padding:12px 24px;border-radius:12px;display:inline-block">Suivre ma commande →</a></p>' +
    '</div>';
}

/* Email « colis expédié » — vrai numéro de suivi + lien direct pré-rempli vers la page de suivi. */
function shippingEmailHtml(o, tracking, carrier) {
  var CARRIERS = { laposte: 'Colissimo / La Poste', mondialrelay: 'Mondial Relay', chronopost: 'Chronopost', ups: 'UPS', dhl: 'DHL', autre: 'Transporteur' };
  var cname = CARRIERS[carrier] || 'Transporteur';
  var link = 'https://mycandys.fr/suivi-commande?num=' + encodeURIComponent(tracking || '') + (carrier ? '&carrier=' + encodeURIComponent(carrier) : '');
  var items = itemRowsHtml(o);
  return '<div style="font-family:Arial,sans-serif;color:#2A0A1C;max-width:520px;margin:auto">' + logoHdr() +
    '<h2 style="color:#E01784">Ton colis est en route ! 🚚</h2>' +
    '<p>Bonne nouvelle : ta commande <b>' + esc(o.reference || '') + '</b> vient d\'être expédiée.</p>' +
    '<table style="width:100%;border-collapse:collapse;font-size:14px;margin:10px 0">' +
    '<tr><td style="padding:6px 0;color:#8A6076">Transporteur</td><td style="padding:6px 0;text-align:right"><b>' + esc(cname) + '</b></td></tr>' +
    '<tr><td style="padding:6px 0;color:#8A6076">N° de suivi</td><td style="padding:6px 0;text-align:right"><b>' + esc(tracking || '') + '</b></td></tr></table>' +
    '<p style="text-align:center;margin:18px 0 6px"><a href="' + link + '" style="background:#E01784;color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:12px;display:inline-block">Suivre mon colis →</a></p>' +
    (items ? '<p style="font-size:13px;color:#8A6076;margin:20px 0 6px">📦 Ton colis contient :</p><table style="width:100%;border-collapse:collapse">' + items + '</table>' : '') +
    '<p style="color:#8A6076;font-size:13px">Le suivi peut mettre 24-48 h à s\'activer, le temps que le transporteur scanne ton colis. Merci pour ta confiance et régale-toi ! 🍬</p></div>';
}

/* Email de bienvenue newsletter — code -10% (BIENVENUE10) valable sur la 1re commande. */
function welcomeEmailHtml() {
  return '<div style="font-family:Arial,sans-serif;color:#2A0A1C">' + logoHdr() +
    '<h2 style="color:#E01784">Bienvenue chez My Candy\'s ! 🍬</h2>' +
    '<p>Merci de rejoindre la famille ! Tu seras au premier rang pour les <b>nouveautés</b>, les <b>drops</b> et les <b>méga-promos</b>.</p>' +
    '<p>Et comme promis, voici ton cadeau de bienvenue :</p>' +
    '<div style="text-align:center;margin:20px 0"><div style="display:inline-block;border:2px dashed #FF2E9A;border-radius:14px;padding:16px 28px"><div style="font-size:13px;color:#8A6076">-10% sur ta 1re commande</div><div style="font-size:26px;font-weight:800;color:#E01784;letter-spacing:1px">BIENVENUE10</div></div></div>' +
    '<p style="text-align:center;margin:22px 0 6px"><a href="https://mycandys.fr/boutique" style="background:#E01784;color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:12px;display:inline-block">Je découvre la boutique →</a></p>' +
    '<p style="color:#8A6076;font-size:12.5px">Code à saisir au moment du paiement. À très vite ! 💌</p></div>';
}

/* Email de relance client (bouton « Relancer » du back-office) — code -10% TAGADA10. */
function relanceEmailHtml(name) {
  return '<div style="font-family:Arial,sans-serif;color:#2A0A1C">' + logoHdr() +
    '<h2 style="color:#E01784">Tu nous manques' + (name ? ', ' + esc(firstName(name)) : '') + ' ! 🍬</h2>' +
    '<p>Ça fait un moment… De nouveaux snacks viraux viennent d\'arriver chez My Candy\'s, et on t\'a gardé une petite douceur :</p>' +
    '<div style="text-align:center;margin:20px 0"><div style="display:inline-block;border:2px dashed #FF2E9A;border-radius:14px;padding:16px 28px"><div style="font-size:13px;color:#8A6076">-10% sur ta prochaine commande</div><div style="font-size:26px;font-weight:800;color:#E01784;letter-spacing:1px">TAGADA10</div></div></div>' +
    '<p style="text-align:center;margin:22px 0 6px"><a href="https://mycandys.fr/boutique" style="background:#E01784;color:#fff;text-decoration:none;font-weight:700;padding:13px 26px;border-radius:12px;display:inline-block">Je reviens faire le plein →</a></p>' +
    '<p style="color:#8A6076;font-size:12.5px">Code à saisir au paiement. À très vite ! 💌</p></div>';
}

/* Finalise une commande si le paiement SumUp est bien PAID. Idempotent. */
// Finalise une commande DÉJÀ vérifiée payée (webhook Stripe ou retour vérifié). Idempotent.
async function finalizeOrder(env, reference, paymentIntent) {
  const order = await fbGet(env, 'orders/' + reference);
  if (!order) return { ok: false, error: 'order_not_found' };
  if (order.paid) return { ok: true, already: true, reference: reference, total: order.total };

  await fbPatch(env, 'orders/' + reference, {
    paid: true, status: 'nouvelle',
    payment_intent: paymentIntent || null,
    paidTs: Date.now()
  });
  order.paid = true;
  // Compteur d'utilisation du code promo (uniquement sur commande PAYÉE)
  if (order.promo) {
    try {
      const pk = 'promos/' + encodeURIComponent(String(order.promo).toUpperCase());
      const cur = await fbGet(env, pk);
      await fbPatch(env, pk, { uses: ((cur && parseInt(cur.uses, 10)) || 0) + 1 });
    } catch (e) {}
  }
  if (isEmail(order.customer && order.customer.email)) {
    await brevoSendEmail(env, {
      toEmail: order.customer.email, toName: firstName(order.customer.name),
      subject: "Ta commande My Candy's 🍬 — " + reference, html: orderEmailHtml(order)
    });
  }
  await notifyNewOrder(env); // 🔔 notification push au gérant (logiciel de gestion)
  return { ok: true, reference: reference, total: order.total };
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allow = env.ALLOW_ORIGIN || origin || '*';

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(allow) });

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '') || '/';

    if (path === '/' || path === '/health') {
      return json({ ok: true, service: 'my-candys-api' }, 200, allow);
    }

    // --- Console admin : lecture protégée (Authorization: Bearer <ADMIN_KEY>) ---
    if (path === '/admin/data') {
      const auth = request.headers.get('Authorization') || '';
      if (!env.ADMIN_KEY || auth !== ('Bearer ' + env.ADMIN_KEY)) {
        return json({ ok: false, error: 'unauthorized' }, 401, allow);
      }
      const parts = await Promise.all([fbGet(env, 'newsletter'), fbGet(env, 'messages'), fbGet(env, 'orders'), fbGet(env, 'promos')]);
      return json({ ok: true, newsletter: parts[0], messages: parts[1], orders: parts[2], promos: parts[3] }, 200, allow);
    }

    // --- Catalogue : lecture publique des surcharges ---
    if (path === '/catalog' && request.method === 'GET') {
      const cat = await fbGet(env, 'catalog');
      return json({ ok: true, overrides: cat || {} }, 200, allow);
    }

    // --- Webhook Stripe (body BRUT requis pour la signature → traité avant le parse JSON) ---
    if (path === '/stripe/webhook' && request.method === 'POST') {
      const raw = await request.text();
      const okSig = await verifyStripeSig(raw, request.headers.get('stripe-signature') || '', env.STRIPE_WEBHOOK_SECRET);
      if (!okSig) return json({ ok: false, error: 'bad_signature' }, 400, allow);
      let evt = {}; try { evt = JSON.parse(raw); } catch (e) {}
      if (evt.type === 'checkout.session.completed' || evt.type === 'checkout.session.async_payment_succeeded') {
        const s = (evt.data && evt.data.object) || {};
        const ref = (s.metadata && s.metadata.reference) || s.client_reference_id;
        if (ref && s.payment_status === 'paid') { try { await finalizeOrder(env, ref, s.payment_intent); } catch (e) {} }
      }
      return json({ ok: true }, 200, allow);
    }

    if (request.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405, allow);

    let body = {};
    try { body = await request.json(); } catch (e) {}
    if (body && body.website) return json({ ok: true }, 200, allow); // honeypot anti-bot

    try {
      if (path === '/newsletter') {
        const email = (body.email || '').trim();
        if (!isEmail(email) || email.length > 254) return json({ ok: false, error: 'email_invalide' }, 400, allow);
        if (await rateLimited(env, request, 'nl', 5, 3600)) return json({ ok: false, error: 'trop_de_requetes' }, 429, allow);
        await brevoAddContact(env, email, { SOURCE: 'site-newsletter' });
        await fbPush(env, 'newsletter', { email: email, ts: Date.now() });
        // Email de bienvenue automatique (avec le code -10% BIENVENUE10)
        try { await brevoSendEmail(env, { toEmail: email, subject: "Bienvenue chez My Candy's 🍬 — ton code -10%", html: welcomeEmailHtml() }); } catch (e) {}
        return json({ ok: true }, 200, allow);
      }

      if (path === '/contact') {
        const name = (body.name || '').trim().slice(0, 80);
        const email = (body.email || '').trim();
        const message = (body.message || '').trim();
        if (!isEmail(email) || email.length > 254 || !message || message.length > 3000) return json({ ok: false, error: 'champs_invalides' }, 400, allow);
        if (await rateLimited(env, request, 'ct', 5, 3600)) return json({ ok: false, error: 'trop_de_requetes' }, 429, allow);
        const html = '<div style="font-family:Arial,sans-serif;color:#2A0A1C">' +
          '<h3 style="color:#E01784">Nouveau message — site My Candy\'s</h3>' +
          '<p><b>De :</b> ' + esc(name) + ' &lt;' + esc(email) + '&gt;</p>' +
          '<p style="white-space:pre-wrap;border-left:3px solid #FF2E9A;padding-left:12px">' + esc(message) + '</p></div>';
        await brevoSendEmail(env, { toEmail: env.TO_EMAIL, subject: 'Contact site — ' + (name || email), html: html, replyTo: email });
        await fbPush(env, 'messages', { name: name, email: email, message: message, ts: Date.now() });
        return json({ ok: true }, 200, allow);
      }

      // Fidélité : le client atteint un palier → e-mail avec son code de réduction unique
      if (path === '/loyalty') {
        const email = (body.email || '').trim();
        const pct = parseInt(body.pct, 10);
        const code = String(body.code || '').slice(0, 32);
        const first = str(body.firstName, 40);
        const pts = parseInt(body.pts, 10) || 0;
        if (!isEmail(email) || email.length > 254 || [5, 10, 15].indexOf(pct) < 0) return json({ ok: false, error: 'champs_invalides' }, 400, allow);
        // garde anti-spam : le code doit correspondre au calcul serveur (même hash que le site)
        let h = 2166136261; const s = email + '|' + pct;
        for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
        const expected = 'MCFID' + pct + '-' + ('000' + h.toString(36).toUpperCase()).slice(-4);
        if (code !== expected) return json({ ok: false, error: 'code_invalide' }, 400, allow);
        if (await rateLimited(env, request, 'ly', 12, 3600)) return json({ ok: false, error: 'trop_de_requetes' }, 429, allow);
        const tierName = pct === 15 ? 'Platine 💎' : (pct === 10 ? 'Or 🥇' : 'Argent 🥈');
        const html = '<div style="font-family:Arial,sans-serif;color:#2A0A1C;max-width:520px;margin:auto">' + logoHdr() +
          '<div style="text-align:center;margin:0 0 8px"><span style="display:inline-block;background:#FFF1F8;color:#E01784;font-weight:800;font-size:12px;letter-spacing:.5px;padding:5px 12px;border-radius:999px">🎁 PALIER ' + tierName + '</span></div>' +
          '<h2 style="color:#E01784;margin:0 0 6px;text-align:center">Bravo ' + esc(firstName(first)) + ' ! 🎉</h2>' +
          '<p style="font-size:15px;line-height:1.6;text-align:center">Tu viens d\'atteindre <b>' + pts + ' points</b> de fidélité My Candy\'s — tu débloques <b>-' + pct + '% sur ta prochaine commande.</b></p>' +
          '<p style="font-size:14px;margin:18px 0 8px;text-align:center">Ton code de réduction personnel :</p>' +
          '<div style="font-family:monospace;font-size:22px;font-weight:800;letter-spacing:2px;color:#E01784;background:#FFF1F8;border:2px dashed #F3A9D0;border-radius:12px;padding:14px;text-align:center">' + esc(code) + '</div>' +
          '<p style="font-size:13px;color:#8A6076;margin-top:14px;text-align:center">À saisir dans le champ « Code promo » au moment du paiement. Un seul code par commande. Merci de faire partie du club ! 🍬</p></div>';
        await brevoSendEmail(env, { toEmail: email, toName: first, subject: 'Ta récompense fidélité : -' + pct + '% 🎁', html: html });
        await fbPush(env, 'loyalty', { email: email, pct: pct, pts: pts, code: code, ts: Date.now() });
        return json({ ok: true }, 200, allow);
      }

      // Vérif d'un code promo pour l'aperçu du checkout — ne révèle jamais la liste, un code à la fois.
      if (path === '/promo/check') {
        if (await rateLimited(env, request, 'pc', 30, 3600)) return json({ ok: false, error: 'trop_de_requetes' }, 429, allow);
        const code = str(body.code, 32).toUpperCase();
        if (!code) return json({ ok: false }, 200, allow);
        const managed = (await fbGet(env, 'promos')) || {};
        let pct = null;
        const mp = managed[code];
        if (mp && typeof mp === 'object' && mp.active !== false && !isNaN(Number(mp.pct)) && Number(mp.pct) > 0) pct = Number(mp.pct);
        const FIXED = { 'CANDYSUMMER26': 26, 'BIENVENUE10': 10, 'TAGADA10': 10 };
        if (pct == null && FIXED[code] != null) pct = FIXED[code];
        return pct != null ? json({ ok: true, pct: pct }, 200, allow) : json({ ok: false }, 200, allow);
      }

      // ------------------------- PAIEMENT STRIPE -------------------------

      if (path === '/create-checkout') {
        const items = Array.isArray(body.items) ? body.items : [];
        const shipping = (body.shipping === 'domicile') ? 'domicile' : 'relais';
        const c = body.customer || {};
        if (!items.length) return json({ ok: false, error: 'panier_vide' }, 400, allow);
        if (!isEmail(c.email)) return json({ ok: false, error: 'email_invalide' }, 400, allow);
        if (!env.STRIPE_SECRET_KEY) return json({ ok: false, error: 'stripe_non_configure' }, 500, allow);

        // Prix qui font autorité = base products.js + overrides Firebase.
        const ov = (await fbGet(env, 'catalog')) || {};
        let sub = 0; const lines = [];
        for (const it of items) {
          const id = str(it.id, 60);
          const qty = Math.max(1, Math.min(99, parseInt(it.qty, 10) || 1));
          const o = ov[id] || {};
          if (o.deleted || o.available === false) return json({ ok: false, error: 'produit_indisponible', id: id }, 400, allow);
          const basePrice = BASE_PRICES[id];
          // prix = override console (Firebase) s'il existe, sinon prix de base products.js
          const price = (o.price != null && !isNaN(o.price)) ? Number(o.price) : basePrice;
          if (price == null || isNaN(price)) return json({ ok: false, error: 'produit_inconnu', id: id }, 400, allow);
          sub += price * qty;
          var imgv = (o.img || str(it.img, 400) || ''); if (/^data:/i.test(imgv)) imgv = '';
          lines.push({ id: id, name: (o.name || str(it.name, 80) || id), price: round2(price), qty: qty, img: imgv || null });
        }
        sub = round2(sub);
        // Codes promo (source de vérité serveur) : codes gérés (console → Firebase) + codes fixes historiques + code fidélité MCFIDxx-XXXX validé contre l'e-mail
        let discount = 0, promoCode = '';
        const promo = str(body.promo, 32).toUpperCase();
        const managedPromos = (await fbGet(env, 'promos')) || {};
        const FIXED_PROMOS = { 'CANDYSUMMER26': 26, 'BIENVENUE10': 10, 'TAGADA10': 10 };
        let promoPct = null;
        const mpr = managedPromos[promo];
        if (mpr && typeof mpr === 'object' && mpr.active !== false && !isNaN(Number(mpr.pct)) && Number(mpr.pct) > 0) promoPct = Number(mpr.pct);
        if (promoPct == null && FIXED_PROMOS[promo] != null) promoPct = FIXED_PROMOS[promo];
        if (promoPct != null) {
          discount = round2(sub * promoPct / 100); promoCode = promo;
        } else if (promo) {
          const m = promo.match(/^MCFID(5|10|15)-[A-Z0-9]{4}$/);
          if (m) {
            const pctP = parseInt(m[1], 10);
            let h = 2166136261; const s = str(c.email, 254) + '|' + pctP;
            for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
            const expected = 'MCFID' + pctP + '-' + ('000' + h.toString(36).toUpperCase()).slice(-4);
            if (promo === expected) { discount = round2(sub * pctP / 100); promoCode = promo; }
          }
        }
        const ship = shipCost(shipping, sub);
        const total = round2(sub - discount + ship);
        if (total <= 0) return json({ ok: false, error: 'montant_invalide' }, 400, allow);

        const reference = 'MC-' + rand6();
        const customer = {
          email: str(c.email, 254), name: (str(c.first, 60) + ' ' + str(c.last, 60)).trim(),
          first: str(c.first, 60), last: str(c.last, 60), tel: str(c.tel, 30),
          addr: str(c.addr, 160), addr2: str(c.addr2, 160), zip: str(c.zip, 16),
          city: str(c.city, 80), country: str(c.country, 60)
        };
        const order = {
          reference: reference, items: lines, customer: customer, shipping: shipping,
          subtotal: sub, discount: discount, promo: promoCode, shippingCost: ship, total: total,
          status: 'en_attente_paiement', paid: false, ts: Date.now()
        };
        await fbSet(env, 'orders/' + reference, order);

        // Remise → coupon Stripe "montant fixe" à usage unique (applique EXACTEMENT la remise calculée serveur)
        let couponId = null;
        if (discount > 0) {
          const coup = await stripeCreateCoupon(env, Math.round(discount * 100));
          if (coup && coup.id) couponId = coup.id;
        }
        const session = await stripeCreateSession(env, { reference: reference, order: order, couponId: couponId });
        if (!session || !session.client_secret) {
          return json({ ok: false, error: 'stripe_checkout_failed', detail: session && session.error && session.error.message }, 502, allow);
        }
        return json({ ok: true, clientSecret: session.client_secret, sessionId: session.id, publishableKey: env.STRIPE_PUBLISHABLE_KEY || '', reference: reference, amount: total }, 200, allow);
      }

      // Vérification au retour de Stripe (page de confirmation) : on interroge Stripe et on finalise si payé.
      if (path === '/stripe/verify') {
        const sessionId = str(body.session_id, 120);
        const reference = str(body.reference, 90);
        if (!sessionId) return json({ ok: false, error: 'params_manquants' }, 400, allow);
        const s = await stripeGetSession(env, sessionId);
        if (!s || !s.id) return json({ ok: false, error: 'session_introuvable' }, 404, allow);
        const ref = (s.metadata && s.metadata.reference) || s.client_reference_id;
        if (reference && ref && reference !== ref) return json({ ok: false, error: 'reference_mismatch' }, 400, allow);
        if (s.payment_status !== 'paid') return json({ ok: false, status: s.payment_status || 'unpaid' }, 402, allow);
        const res = await finalizeOrder(env, ref, s.payment_intent);
        return json(res, res.ok ? 200 : 402, allow);
      }

      if (path === '/order') {
        // LEGACY : commande sans paiement (conservée pour compat ; le flux SumUp la remplace).
        const order = {
          items: Array.isArray(body.items) ? body.items : [],
          customer: body.customer || {},
          total: body.total || 0,
          status: 'nouvelle', paid: false, ts: Date.now()
        };
        const res = await fbPush(env, 'orders', order);
        if (isEmail(order.customer.email)) {
          await brevoSendEmail(env, {
            toEmail: order.customer.email, toName: firstName(order.customer.name),
            subject: "Ta commande My Candy's 🍬", html: orderEmailHtml(order)
          });
        }
        return json({ ok: true, orderId: res && res.name }, 200, allow);
      }

      if (path === '/order/ship') {
        // Back-office : marque une commande expédiée + n° de suivi → email au client. (protégé ADMIN_KEY)
        const auth = request.headers.get('Authorization') || '';
        if (!env.ADMIN_KEY || auth !== ('Bearer ' + env.ADMIN_KEY)) return json({ ok: false, error: 'unauthorized' }, 401, allow);
        const reference = str(body.reference, 90);
        const tracking = str(body.tracking, 80);
        const carrier = str(body.carrier, 20);
        if (!reference || !tracking) return json({ ok: false, error: 'params_manquants' }, 400, allow);
        const order = await fbGet(env, 'orders/' + reference);
        if (!order) return json({ ok: false, error: 'order_not_found' }, 404, allow);
        await fbPatch(env, 'orders/' + reference, { status: 'expediee', tracking: tracking, carrier: carrier || null, shippedTs: Date.now() });
        order.reference = order.reference || reference;
        let mailed = false;
        if (isEmail(order.customer && order.customer.email)) {
          try {
            await brevoSendEmail(env, {
              toEmail: order.customer.email, toName: firstName(order.customer.name),
              subject: "Ton colis My Candy's est parti ! 🚚 — " + reference, html: shippingEmailHtml(order, tracking, carrier)
            });
            mailed = true;
          } catch (e) {}
        }
        return json({ ok: true, reference: reference, mailed: mailed }, 200, allow);
      }

      if (path === '/order/status') {
        // Back-office : change le statut interne d'une commande (en cours / traitée). (protégé ADMIN_KEY)
        const auth = request.headers.get('Authorization') || '';
        if (!env.ADMIN_KEY || auth !== ('Bearer ' + env.ADMIN_KEY)) return json({ ok: false, error: 'unauthorized' }, 401, allow);
        const reference = str(body.reference, 90);
        const status = str(body.status, 20);
        if (!reference || ['nouvelle', 'en_traitement', 'traitee'].indexOf(status) < 0) return json({ ok: false, error: 'params_invalides' }, 400, allow);
        const order = await fbGet(env, 'orders/' + reference);
        if (!order) return json({ ok: false, error: 'order_not_found' }, 404, allow);
        await fbPatch(env, 'orders/' + reference, { status: status });
        return json({ ok: true, reference: reference, status: status }, 200, allow);
      }

      if (path === '/push/subscribe') {
        // Le gérant active les notifications depuis le logiciel de gestion → on stocke son abonnement. (protégé ADMIN_KEY)
        const auth = request.headers.get('Authorization') || '';
        if (!env.ADMIN_KEY || auth !== ('Bearer ' + env.ADMIN_KEY)) return json({ ok: false, error: 'unauthorized' }, 401, allow);
        if (!body || !body.endpoint) return json({ ok: false, error: 'sub_invalide' }, 400, allow);
        let h = 2166136261; const s = String(body.endpoint); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
        await fetch(fbUrl(env, 'push_subs/' + h.toString(36)), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        return json({ ok: true }, 200, allow);
      }

      if (path === '/client/relance') {
        // Back-office : relance un client par email (code -10% TAGADA10). (protégé ADMIN_KEY)
        const auth = request.headers.get('Authorization') || '';
        if (!env.ADMIN_KEY || auth !== ('Bearer ' + env.ADMIN_KEY)) return json({ ok: false, error: 'unauthorized' }, 401, allow);
        const email = str(body.email, 254); const name = str(body.name, 80);
        if (!isEmail(email)) return json({ ok: false, error: 'email_invalide' }, 400, allow);
        let mailed = false;
        try { await brevoSendEmail(env, { toEmail: email, toName: firstName(name), subject: "On t'a gardé -10% chez My Candy's 🍬", html: relanceEmailHtml(name) }); mailed = true; } catch (e) {}
        return json({ ok: true, mailed: mailed }, 200, allow);
      }

      if (path === '/catalog') {
        // écriture protégée : surcharge produit depuis l'admin
        const auth = request.headers.get('Authorization') || '';
        if (!env.ADMIN_KEY || auth !== ('Bearer ' + env.ADMIN_KEY)) return json({ ok: false, error: 'unauthorized' }, 401, allow);
        const id = (body.id || '').trim();
        if (!id) return json({ ok: false, error: 'id_manquant' }, 400, allow);
        const patch = {};
        if (body.cat !== undefined) patch.cat = String(body.cat).slice(0, 40);
        if (body.name !== undefined) patch.name = String(body.name).slice(0, 80);
        if (body.tint !== undefined) patch.tint = String(body.tint).slice(0, 40);
        if (body['new'] !== undefined) patch['new'] = !!body['new'];
        if (body.brand !== undefined) patch.brand = (body.brand === null || body.brand === '') ? null : String(body.brand).slice(0, 40);
        if (body.price !== undefined) { const pr = Number(body.price); if (!isNaN(pr) && pr >= 0 && pr < 10000) patch.price = Math.round(pr * 100) / 100; }
        if (body.desc !== undefined) patch.desc = String(body.desc).slice(0, 600);
        if (body.stock !== undefined) { const st = parseInt(body.stock, 10); patch.stock = isNaN(st) ? null : Math.max(0, Math.min(999999, st)); }
        if (body.available !== undefined) patch.available = !!body.available;
        if (body.img !== undefined) { const im = String(body.img || ''); if (im === '') patch.img = null; else if (im.length < 900000) patch.img = im; }
        if (body.old !== undefined) { if (body.old === null || body.old === '') patch.old = null; else { const od = Number(body.old); if (!isNaN(od) && od >= 0 && od < 10000) patch.old = Math.round(od * 100) / 100; } }
        if (body.sub !== undefined) patch.sub = (body.sub === null || body.sub === '') ? null : String(body.sub).slice(0, 40);
        // Champs spécifiques aux box mystères
        if (body.box !== undefined) patch.box = !!body.box;
        if (body.ribbon !== undefined) patch.ribbon = (body.ribbon === null || body.ribbon === '') ? '' : String(body.ribbon).slice(0, 40);
        if (body.pop !== undefined) patch.pop = !!body.pop;
        if (body.worth !== undefined) patch.worth = (body.worth === null || body.worth === '') ? '' : String(body.worth).slice(0, 120);
        if (body.reviews !== undefined) { const rv = parseInt(body.reviews, 10); if (!isNaN(rv)) patch.reviews = Math.max(0, Math.min(999999, rv)); }
        if (body.deleted !== undefined) patch.deleted = !!body.deleted;
        await fetch(fbUrl(env, 'catalog/' + encodeURIComponent(id)), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
        return json({ ok: true }, 200, allow);
      }

      if (path === '/promos') {
        // Gestion des codes de réduction depuis la console (protégé ADMIN_KEY)
        const auth = request.headers.get('Authorization') || '';
        if (!env.ADMIN_KEY || auth !== ('Bearer ' + env.ADMIN_KEY)) return json({ ok: false, error: 'unauthorized' }, 401, allow);
        const code = String(body.code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32);
        if (!code) return json({ ok: false, error: 'code_manquant' }, 400, allow);
        const key = 'promos/' + encodeURIComponent(code);
        if (body.deleted) { await fetch(fbUrl(env, key), { method: 'DELETE' }); return json({ ok: true, deleted: code }, 200, allow); }
        const pct = parseInt(body.pct, 10);
        if (isNaN(pct) || pct < 1 || pct > 90) return json({ ok: false, error: 'pct_invalide' }, 400, allow);
        // PATCH préserve le compteur "uses" existant
        const patch = { pct: pct, note: String(body.note || '').slice(0, 80), active: body.active === false ? false : true };
        await fetch(fbUrl(env, key), { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
        return json({ ok: true, code: code }, 200, allow);
      }

      return json({ ok: false, error: 'not_found' }, 404, allow);
    } catch (err) {
      return json({ ok: false, error: 'server_error' }, 500, allow);
    }
  }
};

/* -----------------------------------------------------------------------------
   NOTE DMARC (leçon LinkedIA) : envoyer un email "depuis" une adresse @gmail.com
   via Brevo échoue (DMARC → différé/spam). Pour /contact et les confirmations :
   - idéal : SENDER_EMAIL sur un vrai domaine (SPF/DKIM Brevo configurés), ex hello@mycandys.fr
   - sinon : repli Web3Forms OU garder le mailto.
   ----------------------------------------------------------------------------- */
