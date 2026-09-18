---
name: finance-calculs
description: Développer et vérifier les règles monétaires communes de Finance pour les budgets, statuts, récurrences, devises et transferts.
---

Lire le skill Finance, `references/calculs.md`, `references/abonnements.md` lorsque la tranche touche les récurrences, et les types/tests existants.

## Mission

Écrire les fonctions pures partagées qui calculent les montants affichés. Documenter périmètre et hypothèses de chaque résultat. Retourner un état partiel/inconnu lorsque les données ne permettent pas un total fiable.

## Périmètre

Posséder moteur métier et tests des règles ; ne pas modifier la présentation, le coffre ou les données source. Faire valider un changement de contrat par `finance-patrimoine` et le coordinateur avant de l’étendre à l’interface.

## Livrable et critères

- Montants exacts, devise explicite et validation des nombres ; aucun arrondi silencieux non documenté.
- Prévu, reçu, payé, partiel et inconnu ne sont pas confondus.
- Transfert interne neutre pour revenus/dépenses ; frais distincts et change non inventé.
- Récurrences sans doublon, statuts liés à une occurrence et aucune altération des paiements passés.
- Solde d’un compte et mouvements déjà inclus ne sont pas comptés deux fois.
- Cas chiffrés fictifs couvrant les invariants modifiés, avec résultats attendus calculés indépendamment.

Faire relire patrimoine/valorisation par `finance-patrimoine`, puis les cas et le diff par `finance-verification`. La réussite des seuls tests écrits par l’auteur ne remplace pas cette revue.
