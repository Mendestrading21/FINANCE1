# Finance — état de reprise

Mise à jour : 18 septembre 2026 (lots V2.1, V2.2-statuts et V2.4-tri livrés). Ce fichier décrit les faits vérifiés. Le plan V2 décrit le travail suivant ; il ne constitue pas une preuve que ces améliorations sont déjà dans l’application au-delà de ce qui est explicitement marqué développé/testé ci-dessous.

## Lot V2.1 — Modèle récurrent (développé et testé le 18 septembre 2026)

`Recurrence` porte désormais un champ requis `recurrenceType` (`subscription`/`bill`/`income`/`saving`/`other`), cohérent avec `kind` (`income` exactement quand `kind === "income"`, validé). Un ancien coffre ou export version 1 est migré vers la version 2 de façon pure et idempotente (`src/domain/migration.ts`) avant la validation stricte : la classification `income` suit `kind`, `subscription` ne s’applique qu’à la catégorie exactement `Abonnements`, toute autre dépense migre en `other` — à vérifier, aucune classification n’est devinée. Une entrée déjà classée n’est jamais reclassée. L’enveloppe chiffrée du coffre (`vault.ts`) n’est pas touchée : sa version crypto reste un identifiant séparé de la version des données métier.

L’éditeur de récurrence a un nouveau champ « Nature », cohérent avec le type revenu/dépense choisi : basculer Type (Revenu ↔ Dépense) plusieurs fois avant d’enregistrer ne perd jamais un choix de Nature déjà fait côté dépense (`expenseRecurrenceType` distinct de l’affichage forcé « Revenu récurrent »).

Relu indépendamment par l’agent `finance-verification` (distinct de l’auteur), en deux passes. Défauts réels trouvés et corrigés avant que la PR ne sorte du brouillon :

1. La migration remplaçait silencieusement un champ `recurrences` corrompu (absent ou non tableau) par une liste vide au lieu de laisser la validation rejeter le fichier — corrigé, avec test de régression dédié.
2. Le champ « Nature » de l’éditeur de récurrence était un `<select>` non contrôlé dont les options changeaient avec Type : un aller-retour Dépense → Revenu → Dépense sans toucher à Nature perdait silencieusement un choix explicite (ex. « Charge ») au profit du premier choix de la nouvelle liste (« Abonnement »), y compris en modification d’une récurrence existante. Corrigé en dérivant l’affichage de deux états distincts (choix côté dépense conservé séparément, jamais écrasé par le forçage « Revenu récurrent ») ; scénario de non-régression ajouté dans `tests/finance.spec.ts` (bascule de Type puis relecture après enregistrement).

**Anomalie de processus notée par la relecture, corrigée pour la suite :** le premier commit de ce lot avait été publié (poussé, PR ouverte) avant que le verdict de la revue indépendante soit rendu, alors que le skill exige la relecture avant publication. La PR est restée en brouillon pendant toute la correction ; les deux défauts ci-dessus ont été corrigés et republiés avant toute demande de sortie de brouillon.

Preuves (recomptées après les deux corrections) : `pnpm run typecheck` (0 erreur), `pnpm run test` (**93/93**, 6 fichiers — un chiffre antérieur de 97/97 annoncé dans un commit précédent était faux, corrigé ici), `pnpm run build` (réussi), `pnpm audit --audit-level high` (aucune vulnérabilité). `pnpm run test:e2e` : les 4 scénarios passent rejoués individuellement (`--workers=1 -g "<nom>"`), y compris le nouveau scénario de non-régression Type/Nature ; en parallèle, Chromium single-process reste intermittent dans ce bac à sable — limite déjà documentée ci-dessous, pas une régression de ce lot. Code publié sur `claude/finance-app-completion-k86h7n`, PR #5 (brouillon) vers `main`.

**Toujours prévu, non développé :** V2.2 (mois lisibles, statuts payé/reçu, cohorte d’échéances vs flux réalisé), V2.3 (page Abonnements), V2.4–V2.8 (tri partagé, cartes compactes, icônes/établissements, logo, livraison finale). Aucune capture dédiée à ce lot : le champ « Nature » n’a pas modifié les captures existantes (tableau de bord, projets) au-delà d’un nouveau rendu du même jeu de données fictif.

## Lot V2.2 (volet statuts uniquement) — développé et testé le 18 septembre 2026

Seul le volet « statuts payé/reçu explicites » du lot V2.2 est traité ici. **Le sélecteur de mois français (Janvier–Décembre) et la distinction cohorte d’échéances / flux réalisé restent entièrement prévus, non développés.**

Le bouton icône générique « Confirmer » est remplacé par une action texte sensible au type (« Marquer payé »/« Marquer reçu »/« Marquer réglé ») qui ouvre l’éditeur pré-rempli à `settled`/aujourd’hui au lieu d’écrire silencieusement au clic : la date de règlement reste visible et modifiable avant validation (`EditorSpec.transaction` préremplit le formulaire même pour une occurrence virtuelle pas encore persistée). Une correction « Remettre à payer/recevoir/régler », limitée aux occurrences liées à une récurrence, repasse le statut à prévu, restaure la date d’échéance et consigne l’ancienne date de règlement dans `source.note` au lieu de l’effacer (confirmation explicite requise ; identifiant de transaction inchangé, un reçu déjà joint reste lié). Les libellés « Payé »/« Reçu »/« Pas encore payé »/« Pas encore reçu » remplacent « Confirmé »/« Prévu » dans les lignes d’opération et le champ État de l’éditeur.

Relu indépendamment par l’agent `finance-verification` **avant tout push** (mais après un premier commit local — la relecture a noté que cette nuance de séquencement restait à corriger : commiter aussi après verdict, pas seulement différer le push). Deux défauts réels trouvés et corrigés avant publication :

1. `Editor.tsx` : la précédence de préremplissage était inversée (`data.transactions.find(...) ?? spec.transaction`) — l’ancien enregistrement persisté gagnait sur l’intention explicite de « Marquer payé » dès que la transaction existait déjà (le cas courant, pas seulement une occurrence jamais matérialisée). Corrigé (`spec.transaction ?? data.transactions.find(...)`) ; régression confirmée par contrôle négatif (le nouveau test e2e échoue sans le correctif, rejoué manuellement) puis test e2e dédié.
2. `index.css` : le nouveau bouton texte, plus large que l’ancienne icône seule, faisait s’effondrer `.row-main` à 390 px (une lettre par ligne, hauteur de page passée de 3711 px à 5602 px sur l’Accueil) car `min-width:0` empêchait tout déclenchement de retour à la ligne. Corrigé par un plancher de largeur sur `.row-main` et `flex-wrap` sur `.row` ; confirmé par inspection visuelle réelle des captures régénérées (390/834/1440 px, Accueil et Mon mois) — l’assertion automatisée `scrollWidth` existante ne détectait pas ce défaut (débordement vertical, pas horizontal).

Preuves : `pnpm run typecheck` (0 erreur), `pnpm run test` (**93/93**, inchangé — ce lot est uniquement UI), `pnpm run build` (réussi), les 4 scénarios `test:e2e` rejoués individuellement, dont le nouveau scénario couvrant le cycle marquer payé → remettre à payer → marquer payé de nouveau (occurrence de récurrence et opération ponctuelle). Captures 390/834/1440 px inspectées visuellement après correction, pas seulement testées automatiquement.

## Lot V2.4 (fonction de tri seule) — développé et testé le 18 septembre 2026

Seule la fonction de tri est traitée ici ; **son câblage dans les pages (Mes comptes, futures pages Abonnements/Investissements) reste prévu, non développé** — `rankAccounts` existe mais aucune page ne l’appelle encore, donc `docs/AUDIT_UI_V2.md` (« `data.accounts.slice(0,3)` suit l’ordre d’insertion ») reste un défaut visible tel quel dans l’application actuelle.

`accountValue()` est extrait du corps de `wealthSummary` sans changement de comportement (101/101 tests, dont tous ceux de patrimoine déjà existants, passent sans modification), exposant la valeur comparable d’un compte et sa date de valorisation. `rankByValue<T>` est une fonction générique de tri décroissant avec regroupement « À valoriser » pour tout élément sans valeur et date de valorisation communes, clé secondaire stable pour les égalités, qui ne normalise jamais elle-même une mesure (un montant annuel brut n’est pas transformé en équivalent mensuel — c’est à l’appelant de fournir des valeurs déjà comparables). `rankAccounts` l’applique aux comptes.

Preuves : `pnpm run typecheck` (0 erreur), `pnpm run test` (**101/101**, 8 nouveaux tests : ordre décroissant, dette, absence de taux commun, zéro, composantes incomplètes, égalités, non-normalisation annuel/mensuel, élément valorisé mais non daté), `pnpm run build` (réussi). Travail disjoint des fichiers du lot V2.2 (`finance.ts`/`finance.test.ts` seulement), commité séparément.

## État réel

| Élément                           | État                                                          | Résultat et limite                                                                                                                                                                                                                            |
| --------------------------------- | ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Audit du dépôt                    | Terminé                                                       | Finance est une PWA React 19, TypeScript et Vite. L’ancien traqueur reste archivé dans `legacy/`. Le dépôt canonique public est `Mendestrading21/Finances`.                                                                                   |
| Audit Notion                      | Terminé pour les sources accessibles lors de l’import initial | Budgets, comptes, factures, revenus, abonnements et espace Trading ont été rapprochés. Les données et ambiguïtés privées restent hors Git.                                                                                                    |
| Modèle, calculs et coffre         | Développés et testés sur la version actuelle                  | Montants exacts, inconnus explicites, dates distinctes, transferts neutres, coffre chiffré local, sauvegarde et restauration. Pas de serveur ni de synchronisation automatique entre appareils.                                               |
| Application actuelle              | Livrée : six pages                                            | Vue d’ensemble, Mon mois, Mes comptes, Épargne et projets, Investissements, Documents et réglages. La page Abonnements et les nouveaux états mensuels sont encore **prévus**.                                                                 |
| Amélioration V2                   | V2.1 développé et testé ; V2.2 (statuts) et V2.4 (fonction de tri) partiels ; reste spécifié, non développé | V2.1, le volet statuts de V2.2 et la fonction `rankAccounts` de V2.4 livrés, voir ci-dessus. Mois lisibles, cohorte d’échéances/flux réalisé, câblage du tri dans les pages, page Abonnements, densité, icônes, établissements et nouveau logo restent **prévus**. |
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
| V2.1 livré             | PR #5 (brouillon) vers `main`, dernier commit de `claude/finance-app-completion-k86h7n` ; contrôles locaux détaillés dans la section « Lot V2.1 » ci-dessus. |
| V2.2 (statuts) livré   | Même PR #5, mêmes contrôles ; détail dans la section « Lot V2.2 » ci-dessus. |
| V2.4 (fonction de tri) livré | Même PR #5, mêmes contrôles ; détail dans la section « Lot V2.4 » ci-dessus. |

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

V2.1 (modèle des récurrences et migration), le volet statuts de V2.2 et la fonction de tri de V2.4 sont livrés. Reste à faire, dans l’ordre du plan :

1. **Finir V2.2** : sélecteur de mois en français (Janvier–Décembre, année séparée), puis la distinction cohorte d’échéances / flux réalisé dans le moteur (`src/domain/finance.ts`).
2. **Câbler V2.4** : appeler `rankAccounts` sur la page Mes comptes (répond au constat encore visible de `docs/AUDIT_UI_V2.md`).
3. **V2.3 — page Abonnements**, une fois V2.2 complet.
4. V2.5–V2.8 (densité, icônes/établissements, logo, livraison finale).

Chaque lot suivant n’est terminé qu’avec tests ciblés, parcours navigateur, captures fictives, relecture indépendante, CI distante et site publié vérifiés.

Lire [DEMARRER_CLAUDE.md](../DEMARRER_CLAUDE.md) pour lancer Claude. Une nouvelle session commence par le dépôt et les accès réels ; elle ne reprend jamais un état historique comme preuve actuelle.
