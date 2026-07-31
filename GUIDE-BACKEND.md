# Guide backend My Candy's — déploiement du Worker

Le fichier `cloudflare-worker.js` = le backend sécurisé (pont site ↔ Brevo ↔ Firebase).
On commence par la **newsletter** (100% débloquée). Contact/commandes/SumUp viendront après.

## 1) Récupérer une clé API Brevo
1. Va sur **app.brevo.com** (ton compte, celui de LinkedIA).
2. En haut à droite (nom du compte) → **SMTP & API** → onglet **API Keys** → **Generate a new API key**.
3. Nomme-la `my-candys` → **copie la clé** (tu la colleras dans Cloudflare à l'étape 3, PAS dans le chat).

## 2) Trouver l'ID de la liste newsletter Brevo
1. Brevo → **Contacts** → **Listes**.
2. Crée (ou choisis) une liste **« Newsletter My Candy's »**.
3. Note son **ID** (le petit numéro affiché, ex. `2` ou `3`).

## 3) Déployer le Worker sur Cloudflare
1. Va sur **dash.cloudflare.com** → **Workers & Pages** → **Create** → **Create Worker**.
2. Nomme-le **`my-candys-api`** → **Deploy** (ça crée un worker « hello world »).
3. **Edit code** → efface tout → **colle le contenu de `cloudflare-worker.js`** → **Deploy**.
4. Onglet **Settings** → **Variables and Secrets** → ajoute :

| Nom | Type | Valeur |
|---|---|---|
| `BREVO_API_KEY` | **Secret** | *(colle ta clé Brevo de l'étape 1)* |
| `BREVO_LIST_ID` | Text | *(l'ID de l'étape 2, ex. `2`)* |
| `FIREBASE_DB_URL` | Text | `https://my-candy-s-default-rtdb.europe-west1.firebasedatabase.app` |
| `ALLOW_ORIGIN` | Text | `https://linkeeiid.github.io` |
| `SENDER_EMAIL` | Text | *(pour + tard : expéditeur vérifié Brevo — laisse ton email pour l'instant)* |
| `SENDER_NAME` | Text | `My Candy's` |
| `TO_EMAIL` | Text | *(pour + tard : email de la boutique qui recevra contacts/commandes)* |

5. **Deploy** à nouveau pour appliquer les variables.
6. En haut de la page du Worker, copie son **URL** (type `https://my-candys-api.XXXX.workers.dev`) → **colle-la-moi dans le chat** (ce n'est pas un secret).

## 4) Test (je m'en occupe)
Une fois l'URL reçue, je branche la newsletter du site dessus et on teste : un email saisi sur le site doit apparaître dans ta liste Brevo + dans Firebase.

## 5) Activer la page de gestion (`gestion.html`)
La console lit les données **via le Worker** (protégé par mot de passe). Il faut donner au Worker un accès Firebase authentifié + un mot de passe admin.

1. **Secret Firebase** : Firebase Console → ⚙️ (Paramètres du projet) → onglet **Comptes de service** → section **Secrets de base de données** → **Afficher** → copie le secret.
   *(Si cette section n'existe pas sur ton projet récent, dis-le-moi : on passera par un « compte de service » à la place.)*
2. Sur **Cloudflare** (Worker → Settings → Variables and Secrets), ajoute 2 **Secrets** :
   - `FIREBASE_SECRET` = *(le secret Firebase de l'étape 1)*
   - `ADMIN_KEY` = *(un mot de passe fort que TU choisis — c'est celui pour entrer dans la page gestion)*
3. **Re-colle le contenu à jour de `cloudflare-worker.js`** dans le Worker (il a été mis à jour) → **Deploy**.
4. Ouvre **`gestion.html`** (sur le site en ligne) → entre ton `ADMIN_KEY` → tu vois inscrits newsletter + messages + (plus tard) commandes.

Le `ADMIN_KEY` reste entre toi et Cloudflare — ne me le donne pas.

## 6) Renforcement sécurité (à refaire une fois)
On a durci le backend — il faut re-appliquer 2 choses :
1. **Règles Firebase** : Firebase Console → **Realtime Database** → onglet **Règles** → colle le **nouveau** contenu de `firebase-rules.json` (plus aucune écriture publique : seul le Worker écrit via son secret) → **Publier**.
2. **Worker à jour** : Cloudflare → ton Worker `my-candys-api` → **Edit code** → efface tout → colle le contenu à jour de `cloudflare-worker.js` (validation anti-spam : limites de taille email/message) → **Deploy**.

*(Vérif : le formulaire newsletter du site doit toujours marcher — il passe par le Worker, pas en direct.)*

## 7) Statistiques de visites (Cloudflare Web Analytics — gratuit, sans cookie)
1. **dash.cloudflare.com** → menu **Analytics & Logs** → **Web Analytics** → **Add a site**.
2. Mets l'hostname **`linkeeiid.github.io`** → Cloudflare te donne un petit script avec un **token** (une longue chaîne dans `data-cf-beacon='{"token":"XXXXXXXX"}'`).
3. Copie **juste le token** (la valeur `XXXXXXXX`) → ouvre `chrome.js` → tout en bas, colle-le entre les guillemets de `var CF_TOKEN = '';` → `var CF_TOKEN = 'XXXXXXXX';`.
4. Pousse le site. Les visites apparaîtront dans Cloudflare → Web Analytics (aucun bandeau cookies nécessaire, c'est sans traceur).

## 8) Réseaux sociaux (footer)
Le footer pointe vers `tiktok.com/@my.candys.raphael`, `instagram.com/my.candys.lyon`, `snapchat.com/add/candy83700`. **Vérifie que ces @ sont les bons** (surtout Instagram/Snapchat, je les ai déduits du TikTok) et dis-moi si à corriger.

## 9) Connexion Google (bouton « Continuer avec Google »)
Le code est déjà en place (`chrome.js`). Il reste à créer un **ID client OAuth** (gratuit) et à le coller :
1. Va sur **https://console.cloud.google.com** → crée un projet (ex. « My Candy's »).
2. **APIs et services → Écran de consentement OAuth** → type **Externe** → renseigne le nom de l'app (« My Candy's »), ton e-mail d'assistance et de contact → les portées `email`, `profile`, `openid` sont **non sensibles** (aucune validation Google requise) → **Publier en production**.
3. **APIs et services → Identifiants → Créer des identifiants → ID client OAuth** → type **Application Web**.
4. Dans **Origines JavaScript autorisées**, ajoute : `https://linkeeiid.github.io` (mets aussi ton futur domaine perso si tu en as un). *(Pas besoin d'URI de redirection : le flux est un popup côté navigateur.)*
5. Copie l'**ID client** (finit par `.apps.googleusercontent.com`).
6. Dans **`chrome.js`**, colle-le : `var GOOGLE_CLIENT_ID = 'xxxx.apps.googleusercontent.com';` → pousse le fichier.

Tant que `GOOGLE_CLIENT_ID` est vide, le bouton reste en **mode démo**. Ça ne marche que sur le **site en ligne** (HTTPS + origine autorisée), pas en local `file://`. Apple reste en démo (Sign in with Apple = compte développeur Apple payant). La connexion Google enregistre nom + e-mail + photo dans le profil local `mcUserV1` (pas de compte serveur — cohérent avec la vitrine actuelle).

---
**Note** : `BREVO_API_KEY` ne doit jamais être partagée dans le chat — elle vit uniquement dans Cloudflare. La newsletter n'envoie aucun email en ton nom → aucun souci de délivrabilité (le sujet DMARC ne concernera que le formulaire contact + les emails de commande, qu'on réglera avec un vrai domaine).
