/* My Candy's — couche stock NEUTRALISÉE.
   Décision client (2026-07-31) : PAS de gestion de stock en ligne. Tous les produits
   sont affichés "disponibles" ; le réappro est géré en boutique au fil des commandes.

   On garde l'objet window.MCStock (pour que app.js / produit.html continuent de
   marcher sans modification), mais SANS aucun appel réseau : tout est "disponible".
   → aucune connexion Firebase, aucun badge "épuisé", aucun blocage d'ajout au panier.

   Pour réactiver un vrai stock temps réel un jour : restaurer la version Firebase
   de ce fichier (disponible dans l'historique Git). */
window.MCStock = {
  LOW: 5,
  ready:   function () { return true; },
  all:     function () { return {}; },
  get:     function () { return null; },   // null = quantité inconnue => considéré disponible
  isKnown: function () { return false; },
  isOut:   function () { return false; },
  isLow:   function () { return false; }
};
