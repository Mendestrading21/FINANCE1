# Correspondance Notion → Finance

Ce document décrit les règles. Les valeurs, identifiants et liens des sources personnelles restent dans l’import privé.

| Source observée | Destination | Règle de conservation |
| --- | --- | --- |
| Patrimoine / comptes | Mes comptes | Nom, établissement, devise explicite, valeur et provenance ; date du solde inconnue conservée nulle. **Constat 17/09/2026 : aucune base « Patrimoine » actuellement accessible dans Budget 2026 ne fournit ce registre** — l’une est un journal de mouvements (dépôts/retraits/transferts, sans compte ni devise), l’autre est vide. Cette correspondance reste à construire manuellement ou via une autre source ; ne pas la déduire automatiquement des bases observées. |
| Revenus 2026 | Mon mois | Montant et mois budgétaire ; aucune réception confirmée sans preuve de règlement. Les libellés peuvent provenir de plateformes ou d’activités distinctes (courtage, autre activité) ; ne pas supposer qu’une ligne est un revenu personnel sans vérifier sa source. |
| Factures | Mon mois ou informations à rapprocher | Distinguer consommation, épargne, investissement et transfert ; symboles de statut ambigus conservés inconnus. |
| Entrée Sortie / mois | Période `budgetMonth` | Le mois n’invente pas une date journalière. Une date de paiement confirmée reste distincte. |
| Abonnements | Informations à vérifier, puis récurrences | Montant et rythme conservés ; aucun échéancier automatique sans début/jour confirmés. |
| Mouvements de Capital | Élément à rapprocher | Deux comptes et devise/montants nécessaires pour devenir un transfert du modèle (`accountId` et `destinationAccountId`) ; **en l’absence de tout champ compte/devise dans le schéma actuellement observé, ces lignes restent des éléments à rapprocher manuellement, même lorsqu’une date existe** — elles ne deviennent jamais un revenu ou une dépense par défaut. |
| Trading / Mes Actifs / Positions Suivie | Investissements ou revue | Seules les détentions prouvées (quantité et date d’acquisition) peuvent devenir des positions ; une watchlist ou une ligne sans quantité/prix/devise/date ne devient pas un actif, quel que soit son statut affiché. **« Mes Actifs », « Performances 2026 » et les vues en colonnes de la page Trading sont des vues différentes d’une même base sous-jacente** : un import doit les traiter comme une seule source, jamais comme des sources indépendantes, pour ne pas compter deux fois la même ligne. |
| Reçus / documents accessibles | Documents | Lien/source conservés ; pièce téléchargée seulement si effectivement accessible et appropriée. |
| Réserves et projets explicitement décrits | Épargne et projets | Réserve liée à un compte ; jamais ajoutée au patrimoine une deuxième fois. |

L’import affiche un aperçu avant enregistrement, reste idempotent par identifiants et met les conflits en revue. Il ne remplace pas les modifications manuelles. Les champs vides restent nuls ; les éléments incomplets demeurent visibles. La date d’extraction ne remplace jamais la date métier.

Rapprochement du 17 septembre 2026 (sources accessibles, sans valeurs privées) : voir `docs/STATUS.md` pour l’état résumé. Le détail chiffré (comptages, identifiants Notion) reste hors Git, dans un rapport privé distinct.
