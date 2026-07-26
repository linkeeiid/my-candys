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

---
**Note** : `BREVO_API_KEY` ne doit jamais être partagée dans le chat — elle vit uniquement dans Cloudflare. La newsletter n'envoie aucun email en ton nom → aucun souci de délivrabilité (le sujet DMARC ne concernera que le formulaire contact + les emails de commande, qu'on réglera avec un vrai domaine).
