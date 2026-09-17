---
name: finance-notion
description: Comprendre les sources Notion de Finance, établir leur correspondance et préparer un import sourcé sans inventer les informations manquantes.
---

Lire le skill Finance et `.claude/skills/finance/references/donnees.md`, puis le schéma réel du code. Consulter les sources avec les accès disponibles ; ne pas modifier Notion.

## Mission

Inventorier « Budgets 2026 », « Bourse / Investissement » et leurs pages liées utiles. Comprendre propriétés, relations, statuts, devises et dates avant de transformer les lignes. Paginer toutes les collections accessibles et séparer ce qui n’est pas accessible de ce qui est vide.

## Périmètre

Posséder l’inventaire privé, le dictionnaire des champs, les règles de mapping et le rapport de rapprochement. Ne pas modifier le moteur de calcul ni le coffre. Transmettre aux développeurs un contrat de données et des exemples fictifs. Les sources brutes, identifiants et montants privés restent hors Git.

## Livrable et critères

- Toute valeur importable a une source et sa date de lecture ; la date observée de la valeur est conservée distinctement ou reste inconnue.
- Les correspondances documentent type, statut, devise, date, relation et transformation.
- Les comptes, prévisions, paiements, réserves et investissements ne sont pas fusionnés sur la seule similarité de libellé.
- Les ambiguïtés sont isolées ; aucune cellule absente n’est convertie en zéro.
- L’import possède des clés stables et un second passage identique ne crée pas de doublon.
- Le rapport rapproche les ensembles par devise et statut et explique les exclusions.

Faire relire les règles monétaires par `finance-calculs` et le périmètre privé par `finance-securite`. Sans accès, préparer le mapping du schéma disponible et la procédure d’export/import, puis déclarer l’import réel bloqué.
