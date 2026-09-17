# Finance — identité et parcours

## Intention et références

Les images fournies montrent une interface sombre, des cartes arrondies, des montants très lisibles, des anneaux et courbes, et une navigation basse vitrée. L’exemple WealthWave apporte le verre bleu-violet ; les exemples noirs et verts apportent la sobriété et la hiérarchie, pas une obligation de vert vif. Ne pas réutiliser leurs montants, marques ou courbes comme données réelles.

Direction : fond noir/graphite profond, surfaces légèrement distinctes, accents bleu et violet, verre surtout sur navigation et commandes. Les grandes zones de données restent suffisamment opaques pour conserver le contraste. Les halos restent petits et décoratifs, jamais derrière les chiffres.

## Système visuel

- Une grille d’espacement cohérente, cartes arrondies et peu de niveaux imbriqués. Un montant principal, un libellé clair et une date lisible par carte.
- Police système : `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` ; chiffres tabulaires. Utiliser la police d’iOS disponible sur l’appareil sans redistribuer une fonte Apple sous licence. Sur Windows, conserver les proportions avec Segoe UI.
- États hover, focus, actif, désactivé, attente et erreur explicites. Ne pas utiliser la couleur seule pour distinguer reçu/prévu, gain/perte ou erreur.
- Icônes cohérentes en tracé, taille et épaisseur ; les icônes seules ont un nom accessible. Un logo Finance original, lisible en monochrome et en petit format, se décline pour l’application et son manifeste.
- Logos d’établissements seulement si provenance et droit d’usage vérifiés. À défaut, monogramme neutre avec nom écrit ; ne pas le présenter comme logo officiel. Aucun chargement distant qui révèle la liste des établissements consultés.
- Respecter contraste, réduction des animations, préférence de transparence lorsque disponible et agrandissement du texte. Des cibles tactiles d’environ 44 px et un focus visible sont le minimum visé pour les commandes quotidiennes.

## Six pages reliées

| Page | Question principale | Actions prioritaires |
| --- | --- | --- |
| Vue d’ensemble | Où en sont mes finances et que dois-je regarder ? | Ajouter une opération, actualiser une donnée, ouvrir une échéance |
| Mon mois | Qu’est-ce qui est reçu, payé et encore prévu ? | Revenu, dépense, paiement, récurrence |
| Mes comptes | Où est l’argent, dans quelle devise et à quelle date ? | Ajouter un compte, actualiser un solde, transférer |
| Épargne et projets | Que reste-t-il à mettre de côté ? | Créer un objectif, affecter une somme existante |
| Investissements | Quelles sont mes positions et leurs comptes ? | Ajouter ou actualiser une position, consulter la répartition |
| Documents et réglages | Où sont mes pièces et comment récupérer mes données ? | Joindre, importer, sauvegarder, restaurer, verrouiller |

Sur mobile, garder la navigation courte : quelques entrées principales et un accès explicite aux autres pages. Sur iPad et Windows, exploiter la largeur par colonnes utiles et navigation latérale. Ne pas étirer un tableau d’ordinateur jusqu’à le rendre illisible sur iPhone. Les filtres de mois/devise restent visibles et appliqués de manière cohérente.

## Saisie quotidienne

Préremplir seulement les informations déductibles du contexte choisi : le compte ouvert, la devise de ce compte ou le mois sélectionné. Prévoir libellé, montant, date et statut avec champs avancés progressifs. Ne pas demander plusieurs fois la même information. Une fermeture accidentelle doit protéger une saisie non enregistrée importante.

La confirmation « enregistré » suit la réussite de persistance. Une erreur conserve le formulaire et explique comment reprendre. Une action n’apparaît active que si elle fonctionne ; sinon expliquer la capacité manquante dans le contexte utile. Les écrans vides guident vers une première saisie ; ils ne montrent pas un patrimoine zéro.

## Graphiques exacts et lisibles

| Graphique | Exigence |
| --- | --- |
| Évolution du patrimoine | Observations datées réelles, points manquants visibles, période et devise, distinction d’une projection |
| Répartition des actifs | Même périmètre que le total, catégories nommées, sous-total inconnu ou non converti indiqué |
| Revenus / dépenses | Reçu/payé distinct de prévu ; mêmes dates et devises que Mon mois |
| Progression de l’épargne | Affecté versus cible, sans additionner l’objectif au patrimoine |

Chaque graphique dispose d’un résumé ou tableau accessible et d’une lecture sans couleur. Ne pas tracer de fausse série pour remplir une zone vide. Les barres partent d’un zéro approprié ; les courbes affichent leur échelle. Les filtres réellement disponibles modifient les données, pas seulement l’état d’un bouton.

## Vérification visuelle

Capturer l’application réellement rendue à chaque étape importante sur formats téléphone, tablette et ordinateur. Les captures versionnées utilisent exclusivement une démonstration fictive identifiée. Indiquer viewport, navigateur, route, données et date de capture ; ne pas présenter une émulation comme un iPhone réel. Examiner débordements, clavier/focus, safe areas, longues valeurs, états vides et erreurs. Une image générée ou une référence de design n’est jamais une preuve d’interface livrée.
