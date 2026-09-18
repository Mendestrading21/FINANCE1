# Finance — état de reprise

Mise à jour : 18 septembre 2026 (lot V2.1 livré). Ce fichier décrit les faits vérifiés. Le plan V2 décrit le travail suivant ; il ne constitue pas une preuve que ces améliorations sont déjà dans l’application au-delà de ce qui est explicitement marqué développé/testé ci-dessous.

## Lot V2.1 — Modèle récurrent (développé et testé le 18 septembre 2026)

`Recurrence` porte désormais un champ requis `recurrenceType` (`subscription`/`bill`/`income`/`saving`/`other`), cohérent avec `kind` (`income` exactement quand `kind === "income"`, validé). Un ancien coffre ou export version 1 est migré vers la version 2 de façon pure et idempotente (`src/domain/migration.ts`) avant la validation stricte : la classification `income` suit `kind`, `subscription` ne s’applique qu’à la catégorie exactement `Abonnements`, toute autre dépense migre en `other` — à vérifier, aucune classification n’est devinée. Une entrée déjà classée n’est jamais reclassée. L’enveloppe chiffrée du coffre (`vault.ts`) n’est pas touchée : sa version crypto reste un identifiant séparé de la version des données métier.

L’éditeur de récurrence a un nouveau champ « Nature », cohérent avec le type revenu/dépense choisi.

Relu indépendamment par l’agent `finance-verification` (distinct de l’auteur), qui a mis en évidence un défaut réel avant publication : la migration remplaçait silencieusement un champ `recurrences` corrompu (absent ou non tableau) par une liste vide au lieu de laisser la validation rejeter le fichier — corrigé avant le commit, avec test de régression dédié.

Preuves : `pnpm run typecheck` (0 erreur), `pnpm run test` (97/97, dont 10 nouveaux tests sur la migration et le coffre), `pnpm run build` (réussi), `pnpm audit --audit-level high` (aucune vulnérabilité). `pnpm run test:e2e` : les 4 scénarios passent rejoués individuellement (`--workers=1 -g "<nom>"`) ; en parallèle, Chromium single-process reste intermittent dans ce bac à sable — limite déjà documentée ci-dessous, pas une régression de ce lot. Code publié sur `claude/finance-app-completion-k86h7n`, PR #5 (brouillon) vers `main`.

**Toujours prévu, non développé :** V2.2 (mois lisibles, statuts payé/reçu, cohorte d’échéances vs flux réalisé), V2.3 (page Abonnements), V2.4–V2.8 (tri partagé, cartes compactes, icônes/établissements, logo, livraison finale). Aucune capture dédiée à ce lot : le champ « Nature » n’a pas modifié les captures existantes (tableau de bord, projets) au-delà d’un nouveau rendu du même jeu de données fictif.

## État réel

| Élément                           | État                                                          | Résultat et limite                                                                                                                                                                                                                            |
| --------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Audit du dépôt                    | Terminé                                                       | Finance est une PWA React 19, TypeScript et Vite. L’ancien traqueur reste archivé dans `legacy/`. Le dépôt canonique public est `Mendestrading21/Finances`.                                                                                   |
| Audit Notion                      | Terminé pour les sources accessibles lors de l’import initial | Budgets, comptes, factures, revenus, abonnements et espace Trading ont été rapprochés. Les données et ambiguïtés privées restent hors Git.                                                                                                    |
| Modèle, calculs et coffre         | Développés et testés sur la version actuelle                  | Montants exacts, inconnus explicites, dates distinctes, transferts neutres, coffre chiffré local, sauvegarde et restauration. Pas de serveur ni de synchronisation automatique entre appareils.                                               |
| Application actuelle              | Livrée : six pages                                            | Vue d’ensemble, Mon mois, Mes comptes, Épargne et projets, Investissements, Documents et réglages. La page Abonnements et les nouveaux états mensuels sont encore **prévus**.                                                                 |
| Amélioration V2                   | V2.1 développé et testé ; V2.2–V2.8 spécifiés, non développés | V2.1 (classification des récurrences + migration version 1 → 2) livré, voir ci-dessus. Mois lisibles, statuts payé/reçu, cohorte d’échéances, flux réalisé, page Abonnements, tri, densité, icônes, établissements et nouveau logo restent **prévus**. |
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
| V2.1 livré             | PR #5 (brouillon) vers `main`, commit `953659c` sur `claude/finance-app-completion-k86h7n` ; contrôles locaux détaillés dans la section « Lot V2.1 » ci-dessus. |

Ces preuves n’attestent pas encore l’implémentation de la V2 au-delà de V2.1. Les totaux de tests, SHA et exécutions doivent être relus après chaque nouveau changement. La [revue indépendante](REVUE_INDEPENDANTE.md) décrit les contrôles de l’application initiale et leurs limites.

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

V2.1 (modèle des récurrences et migration) est livré. Poursuivre [PLAN_AMELIORATION_V2.md](PLAN_AMELIORATION_V2.md) avec **V2.2 — Mois et statuts** : sélecteur de mois en français (Janvier–Décembre, année séparée), actions `Marquer payé`/`Marquer reçu`/`Pas encore payé`/`Pas encore reçu` sur une occurrence, puis la distinction cohorte d’échéances / flux réalisé dans le moteur (`src/domain/finance.ts`). Chaque lot suivant n’est terminé qu’avec tests ciblés, parcours navigateur, captures fictives, relecture indépendante, CI distante et site publié vérifiés.

Lire [DEMARRER_CLAUDE.md](../DEMARRER_CLAUDE.md) pour lancer Claude. Une nouvelle session commence par le dépôt et les accès réels ; elle ne reprend jamais un état historique comme preuve actuelle.
