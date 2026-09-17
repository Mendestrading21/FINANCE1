# Correspondance Notion → Finance

Ce document décrit les règles. Les valeurs, identifiants et liens des sources personnelles restent dans l’import privé.

| Source observée | Destination | Règle de conservation |
| --- | --- | --- |
| Patrimoine / comptes | Mes comptes | Nom, établissement, devise explicite, valeur et provenance ; date du solde inconnue conservée nulle. |
| Revenus 2026 | Mon mois | Montant et mois budgétaire ; aucune réception confirmée sans preuve de règlement. |
| Factures | Mon mois ou informations à rapprocher | Distinguer consommation, épargne, investissement et transfert ; symboles de statut ambigus conservés inconnus. |
| Entrée Sortie / mois | Période `budgetMonth` | Le mois n’invente pas une date journalière. Une date de paiement confirmée reste distincte. |
| Abonnements | Informations à vérifier, puis récurrences | Montant et rythme conservés ; aucun échéancier automatique sans début/jour confirmés. |
| Mouvements de Capital | Transfert ou élément à rapprocher | Deux comptes et devise/montants nécessaires ; aucune inclusion dans revenus/dépenses par défaut. |
| Trading / Mes Actifs / Positions Suivie | Investissements ou revue | Seules les détentions prouvées peuvent devenir des positions ; une watchlist ne devient pas un actif. |
| Reçus / documents accessibles | Documents | Lien/source conservés ; pièce téléchargée seulement si effectivement accessible et appropriée. |
| Réserves et projets explicitement décrits | Épargne et projets | Réserve liée à un compte ; jamais ajoutée au patrimoine une deuxième fois. |

L’import affiche un aperçu avant enregistrement, reste idempotent par identifiants et met les conflits en revue. Il ne remplace pas les modifications manuelles. Les champs vides restent nuls ; les éléments incomplets demeurent visibles. La date d’extraction ne remplace jamais la date métier.
