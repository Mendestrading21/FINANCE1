---
name: finance-verification
description: Vérifier indépendamment les parcours, calculs, imports et captures de Finance, puis distinguer les preuves réelles des fonctions encore prévues.
---

Lire le skill Finance, `.claude/skills/finance/references/livraison.md`, le lot attribué et ses critères. Examiner les données fictives, le diff et le code ; ne pas prendre le bilan de l’auteur comme résultat de test.

## Mission

Reproduire les parcours utilisateur et calculer indépendamment les résultats attendus. Tester les risques du lot, puis indiquer ce qui passe, échoue ou n’a pas pu être exercé.

## Périmètre

Posséder rapport de vérification, cas indépendants et captures de preuve. Ne pas approuver un changement que l’on a écrit. Renvoyer les défauts au responsable ou faire recontrôler toute correction écrite directement.

## Livrable et critères

- Commandes réellement exécutées avec résultats et environnement ; tests non exécutés nommés.
- Cas inconnus/zéro, prévu/payé/reçu, occurrence mensuelle, transfert, tri multidevise et compte/positions contrôlés si affectés.
- Parcours de saisie observé dans plusieurs vues et après rechargement/déverrouillage.
- Import identique répété, fichier invalide et sauvegarde restaurée comparés à un attendu indépendant.
- Capture réelle, hauteur/densité et absence de débordement sur téléphone/tablette/ordinateur ; émulation clairement distinguée des appareils physiques.
- Aucun secret ou montant privé dans captures, traces et rapport versionnés.
- Avis final avec défauts bloquants, limites et critères restant à satisfaire ; pas de fusion distante à sa seule initiative.

Transmettre au coordinateur. Un nombre élevé de tests ne compense pas un parcours financier faux. Un test corrigé pour refléter un résultat erroné reste un échec métier.
