# Audit de départ — amélioration V2

Date : 18 septembre 2026. Cible observée : `Mendestrading21/Finances`, branche `main`, commit `c305f89348acf7d854515efc60e9e377ca5f583d`, site GitHub Pages. Inspection du code et de la démonstration fictive publiée ; aucune donnée privée ouverte.

## État confirmé

- React 19, TypeScript, Vite, CSS et SVG internes ; aucune bibliothèque de composants, d’icônes ou de graphiques tierce installée.
- Six pages : Vue d’ensemble, Mon mois, Mes comptes, Épargne et projets, Investissements, Documents et réglages.
- Coffre local chiffré, imports, sauvegardes, opérations, récurrences et historique de montant présents.
- CI du HEAD réussie. Le workflow Pages déclenché manuellement a construit et déployé le même HEAD avec succès.

## Constats reproduits

| Demande                           | État observé                                                                                                                     | Conséquence                                                                                                 |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Cartes moins hautes               | Les cartes de compte utilisent 24 px de padding, 22 px de rayon et environ 323 px de hauteur dans la démonstration ordinateur    | Trois comptes occupent une grande partie de l’écran ; l’historique replié conserve encore beaucoup d’espace |
| Listes du plus gros au plus petit | `data.accounts.slice(0, 3)` et `data.accounts.map` suivent l’ordre d’insertion                                                   | La démonstration affiche 12 845 CHF, 36 500 CHF puis 48 150 CHF, donc pas l’ordre demandé                   |
| Icônes et établissements          | Le composant interne propose un petit vocabulaire ; l’établissement est un monogramme formé des deux premières lettres           | Identités peu distinctes et répétition du nom d’établissement                                               |
| Page Abonnements                  | Une seule récurrence `Abonnement musique` apparaît dans la carte `Charges récurrentes` de Mon mois                               | Pas de vue active/inactive, total, filtres, cadence ou prochain règlement dédiés                            |
| Mois lisibles                     | Le contrôle est un `input type="month"` dont la valeur canonique observée est `2026-09` ; le libellé `septembre 2026` est séparé | Le parcours reste technique et n’offre pas la rangée Janvier–Décembre demandée                              |
| Payé/reçu                         | Une opération prévue porte un bouton icône `Confirmer`; la fonction enregistre aujourd’hui et affiche `Paiement confirmé`        | Le mot ne distingue pas dépense payée et revenu reçu ; aucun retour explicite à `pas encore payé/reçu`      |
| Statut lié au mois                | Le moteur d’occurrences remplace déjà une occurrence virtuelle par une transaction persistée                                     | Bonne base à conserver ; l’interface doit agir sur l’occurrence, sans réécrire la récurrence                |
| Logo                              | Monogramme F et variantes PWA déjà présents                                                                                      | Base utilisable, mais identité encore générique et sans dossier de choix/contrôle multi-taille              |

## Risques à traiter avant la finition

1. Trier des comptes multidevises sans taux connu pourrait présenter un faux ordre. Il faut séparer `À valoriser`.
2. Transformer une charge récurrente en abonnement par simple nom de catégorie pourrait mal classer assurance, loyer ou impôt.
3. Passer un règlement à payé puis le remettre à prévu peut laisser un reçu orphelin ou effacer une preuve.
4. Modifier le montant d’une récurrence doit continuer à respecter l’historique daté ajouté lors de la session précédente.
5. Charger des logos de banques depuis un CDN exposerait les établissements consultés et rendrait le rendu dépendant d’un tiers.
6. Le dépôt est désormais public ; exports, sauvegardes, identifiants Notion et captures privées exigent un contrôle avant chaque commit.

## Conclusion de l’audit

L’application est une base fonctionnelle. La V2 doit rester une évolution ciblée : modèle des abonnements, sélecteur de mois, fonctions de tri, listes compactes, identité visuelle et logo. Une migration d’architecture ou un remplacement du coffre n’est pas justifié par ces demandes.
