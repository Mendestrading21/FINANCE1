# Plan d’amélioration V2

Ce plan transforme les demandes du 18 septembre 2026 en lots vérifiables. Au moment de sa création, tous les lots ci-dessous sont **prévus** : la présence de ce document ou du skill ne signifie pas qu’ils sont développés.

## Lots et dépendances

| Lot                             | Résultat utilisateur                                                           | Dépendance            | Critère de fin                                                                                                     | Auteur / revue                                 |
| ------------------------------- | ------------------------------------------------------------------------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| V2.0 — Base et mesure           | État actuel reproductible, captures et budgets de taille/hauteur               | HEAD propre           | Audit confirmé sur site publié ; captures fictives de référence ; aucun fichier privé                              | Coordinateur / vérification                    |
| V2.1 — Modèle récurrent         | Abonnements distingués des autres charges sans perdre l’historique             | V2.0                  | Migration pure/idempotente après déchiffrement, ancien coffre intact sur échec et restauration antérieure vérifiée | Abonnements + données / calculs, sécurité      |
| V2.2 — Mois et statuts          | Janvier–Décembre lisibles ; payé/reçu/pas encore payé selon le mois            | V2.1                  | Une occurrence change une fois, persiste et met à jour les vues liées                                              | Abonnements + frontend / calculs, vérification |
| V2.3 — Page Abonnements         | Abonnements actifs, coût du mois, payé, restant, prochaine échéance, pause/fin | V2.1–2                | Page accessible sur trois formats, totaux exacts, filtres et états vides                                           | Abonnements + designer / vérification          |
| V2.4 — Tri partagé              | Comptes et valeurs classés du plus gros au plus petit quand comparables        | V2.0                  | Tri exact multidevise, groupe `À valoriser`, ordre stable et tests                                                 | Calculs + patrimoine / vérification            |
| V2.5 — Cartes compactes         | Davantage d’information utile à l’écran avec moins de hauteur                  | V2.2–4                | Cinq comptes usuels visibles à 1 000 px ; cibles tactiles 44 px ; aucun débordement                                | Designer + frontend / vérification             |
| V2.6 — Icônes et établissements | Chaque section se reconnaît vite ; identités propres et privées                | V2.5                  | Une famille d’icônes, registre local, SVG nettoyés, fallback et licences                                           | Identité / designer, sécurité                  |
| V2.7 — Logo Finance             | Signe original cohérent du favicon à l’écran d’accueil                         | V2.6                  | SVG, favicon, 192/512, maskable et Apple contrôlés à plusieurs tailles                                             | Identité / designer, sécurité                  |
| V2.8 — Livraison                | Version testée, capturée, publiée et contrôlée                                 | Tous les lots retenus | Typecheck, tests, build, E2E, CI, Pages et reprise Claude documentés                                               | Coordinateur / vérification indépendante       |

## Parcours de référence

1. Choisir `Février 2027` sans ouvrir de calendrier quotidien.
2. Voir les abonnements dus ce mois, classés par coût, avec les devises non comparables clairement séparées.
3. Marquer une dépense comme payée avec une date visible ; constater les totaux de la cohorte d’échéances sur Abonnements et le flux réalisé sur Mon mois.
4. Marquer un revenu comme reçu ; constater le vocabulaire adapté et l’absence de double entrée.
5. Corriger un statut sans perdre le reçu ou la provenance.
6. Régler le 2 mars une charge due en février : février reste soldé avec la date tardive, le débit apparaît dans le flux de mars et l’échéance de mars reste distincte.
7. Actualiser un compte ; voir la liste se réordonner d’après la valeur comparable, avec sa date de solde.
8. Recharger, verrouiller/déverrouiller, exporter/restaurer ; retrouver les mêmes occurrences et classements.

## Décisions de présentation

- Navigation : septième page `Abonnements`, icône de répétition/calendrier récurrent. Sur mobile elle peut rester dans `Plus` si quatre entrées principales maximisent la lisibilité.
- Comptes : liste compacte, compte primaire, établissement secondaire, montant et date visibles, détails repliés.
- Abonnements : vue liste, puis tuiles de synthèse compactes ; pas une grille de grandes cartes par service.
- Mois : noms français avec année séparée ; la valeur interne reste `YYYY-MM`.
- Tri : montant décroissant par défaut pour comptes/abonnements/répartitions ; date croissante pour les échéances.
- Valorisation : chaque liste affiche la mesure triée, sa devise et une date commune ; une valeur sans taux commun rejoint `À valoriser`.
- Actions : texte visible sur l’action principale ; icône seule réservée aux actions secondaires connues.

## Contrôles obligatoires

- Unitaires : migration, occurrences, historique de montant, mois limites, statuts, tris, devises, inconnus.
- Intégration : coffre et export V1 déchiffrés dans leur format d’origine, validation avant/après, migration exécutée deux fois, sauvegarde antérieure restaurée, échec sans écriture, reçu lié.
- Navigateur : 390 × 844, 834 × 1112 et 1 440 × 1 000 ; clavier, focus, vide, erreur, montant long et texte masqué.
- Visuel : captures fictives avant/après avec même jeu de données ; hauteur et nombre de lignes mesurés.
- Publication : diff privé, lockfile, licences, CI et URL Pages contrôlés sur le commit livré.

## Conditions d’arrêt

Un lot s’arrête si la restauration vérifiée de la sauvegarde antérieure est impossible, si un total devient ambigu, si une donnée privée apparaît dans le diff ou si l’absence d’un taux/date impose d’inventer une valeur. Corriger ou isoler le blocage avant de poursuivre la finition qui dépend de ce lot. Ne pas appeler « réversible » une migration qui ne fournit ni restauration exacte ni rétro-migration testée.
