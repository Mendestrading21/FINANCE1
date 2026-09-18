# Finance — état de reprise

Mise à jour : 18 septembre 2026. Ce fichier décrit les faits vérifiés. Le plan V2 décrit le travail suivant ; il ne constitue pas une preuve que ces améliorations sont déjà dans l’application.

## État réel

| Élément                           | État                                                          | Résultat et limite                                                                                                                                                                                                                            |
| --------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Audit du dépôt                    | Terminé                                                       | Finance est une PWA React 19, TypeScript et Vite. L’ancien traqueur reste archivé dans `legacy/`. Le dépôt canonique public est `Mendestrading21/Finances`.                                                                                   |
| Audit Notion                      | Terminé pour les sources accessibles lors de l’import initial | Budgets, comptes, factures, revenus, abonnements et espace Trading ont été rapprochés. Les données et ambiguïtés privées restent hors Git.                                                                                                    |
| Modèle, calculs et coffre         | Développés et testés sur la version actuelle                  | Montants exacts, inconnus explicites, dates distinctes, transferts neutres, coffre chiffré local, sauvegarde et restauration. Pas de serveur ni de synchronisation automatique entre appareils.                                               |
| Application actuelle              | Livrée : six pages                                            | Vue d’ensemble, Mon mois, Mes comptes, Épargne et projets, Investissements, Documents et réglages. La page Abonnements et les nouveaux états mensuels sont encore **prévus**.                                                                 |
| Amélioration V2                   | Spécifiée, non développée                                     | Audit UI, plan par lots, règles de mois, cohorte d’échéances, flux réalisé, tri, densité, icônes, établissements et nouveau logo sont prêts pour Claude. Aucun comportement applicatif V2 n’est déclaré livré par cette tranche documentaire. |
| Skill et agents                   | Livrés                                                        | Skill maître Finance, huit références et onze missions spécialisées, dont Abonnements et Identité visuelle.                                                                                                                                   |
| Publication GitHub                | Livrée                                                        | Branche `main` du dépôt public `Mendestrading21/Finances`. Toute nouvelle modification doit revérifier le HEAD, la CI et l’absence de données privées.                                                                                        |
| GitHub Pages                      | Livré et vérifié                                              | Site public disponible sur `https://mendestrading21.github.io/Finances/`. Le workflow Pages accepte les publications de `main` et un lancement manuel.                                                                                        |
| Appareils physiques               | Non testé                                                     | Les rendus Chromium 390 px, 834 px et ordinateur existent ; aucun essai physique Safari iPhone/iPad ou Edge Windows n’est prouvé.                                                                                                             |
| Synchronisation bancaire ou cloud | Prévue, non développée                                        | Elle exige une cible privée, des accès et une politique de conflits. Le mode actuel utilise des sauvegardes chiffrées transférées manuellement.                                                                                               |

## Vérité financière

La correspondance publique est dans [CORRESPONDANCE_NOTION.md](CORRESPONDANCE_NOTION.md). L’import conserve source et date dans le fichier privé. Un mois budgétaire n’invente pas une date de règlement. Les soldes sans date, règlements ambigus et détentions non prouvées ne deviennent pas des valeurs actuelles.

La V2 devra distinguer la **cohorte d’échéances** et le **flux réalisé**. Une charge due en février et payée en mars est soldée dans la cohorte de février, mais son débit appartient au flux de mars. Les transferts internes restent neutres et un compte d’investissement ne s’additionne pas à ses positions lorsqu’ils représentent la même valeur.

Le rapprochement des données personnelles reste nécessaire avant d’affirmer un patrimoine complet : confirmer les soldes datés, règlements, comptes de destination, récurrences et positions détenues. Une information importée puis modifiée garde une indication de modification manuelle.

## Preuves vérifiées avant la tranche V2

| Contrôle               | Résultat observé                                                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Référence applicative  | `main` au commit `c305f89348acf7d854515efc60e9e377ca5f583d` avant la publication de ce skill V2.                                                                   |
| CI applicative         | Workflow `Finance verification` 35316300782 terminé avec succès sur cette référence.                                                                               |
| GitHub Pages           | Workflow 35317840296 terminé avec succès ; site public ouvert et démonstration affichée.                                                                           |
| Validation du skill V2 | Validateur officiel `quick_validate.py` réussi ; liens locaux et format Prettier contrôlés.                                                                        |
| Relecture V2           | Forward-test indépendant effectué sur migration, occurrence, mois de règlement, tri multidevise, logos et ordre des lots ; ambiguïtés corrigées avant publication. |

Ces preuves n’attestent pas encore l’implémentation de la V2. Les totaux de tests, SHA et exécutions doivent être relus après chaque nouveau changement. La [revue indépendante](REVUE_INDEPENDANTE.md) décrit les contrôles de l’application initiale et leurs limites.

## Captures existantes

| Capture                                             | Ce qu’elle prouve                  |
| --------------------------------------------------- | ---------------------------------- |
| [00 — Existant](captures/00-existant-habitudes.png) | Traqueur initial avant Finance.    |
| [01 — Coffre](captures/01-coffre-desktop.png)       | Création réelle de l’espace privé. |
| [02 — Ordinateur](captures/02-finance-desktop.png)  | Tableau de bord à 1 440 px.        |
| [03 — Tablette](captures/03-finance-ipad.png)       | Tableau de bord à 834 px.          |
| [04 — Téléphone](captures/04-finance-iphone.png)    | Tableau de bord à 390 px.          |
| [05 — Projets](captures/05-projets-iphone.png)      | Épargne et projets sur téléphone.  |

Toutes les captures utilisent la démonstration fictive. Elles ne prouvent ni Safari/WebKit ni un appareil physique. Chaque lot visuel V2 devra ajouter ses propres captures après développement.

## Prochaine action

Exécuter [PLAN_AMELIORATION_V2.md](PLAN_AMELIORATION_V2.md) dans l’ordre : établir les mesures de référence, faire évoluer le modèle et sa migration, implémenter les mois et statuts, ajouter Abonnements, puis seulement compacter et enrichir l’interface. Le premier lot n’est terminé qu’avec tests ciblés, parcours navigateur, captures fictives, relecture indépendante, CI distante et site publié vérifiés.

Lire [DEMARRER_CLAUDE.md](../DEMARRER_CLAUDE.md) pour lancer Claude. Une nouvelle session commence par le dépôt et les accès réels ; elle ne reprend jamais un état historique comme preuve actuelle.
