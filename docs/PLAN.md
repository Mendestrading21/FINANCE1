# Plan Finance

Ce plan décrit le résultat attendu et ses critères. Les statuts, tests, captures et publications réellement constatés sont dans `STATUS.md` ; une ligne de ce plan n’atteste pas une livraison.

## Ordre de travail et dépendances

| Lot | Résultat attendu | Dépendance | Critère de fin | Responsable / revue |
| --- | --- | --- | --- | --- |
| 0 — Existant et sources | Inventaire du code et mapping Notion réellement accessible | Accès en lecture | Sources reconnues, ambiguïtés/exclusions documentées sans valeurs privées dans Git | Notion + coordinateur / calculs, sécurité |
| 1 — Modèle et calculs | Comptes, observations, opérations, récurrences, objectifs, positions et provenance reliés | Lot 0, schéma | Inconnus conservés ; prévu/payé, transferts, devises et double compte vérifiés | Calculs + patrimoine / vérification |
| 2 — Coffre et reprise | Persistance chiffrée locale, verrouillage, sauvegarde et restauration | Schéma versionné | Mauvais mot de passe, corruption, quota et restauration testés sans destruction de l’état précédent | Données / sécurité, vérification |
| 3 — Identité et six pages | Dashboard, mois, comptes, projets, investissements, documents/réglages | Lots 1–2 | Navigation responsive, filtres communs, états incomplets clairs, captures réelles | Designer + frontend / vérification |
| 4 — Saisie quotidienne | Revenu, dépense, récurrence, solde, transfert et pièce | Lots 1–3 | Enregistrement confirmé, affichage cohérent entre pages, rechargement conservé | Frontend + données / calculs, vérification |
| 5 — Import privé vérifié | Données Notion transformées avec provenance et rapprochement | Lots 0–2 et accès actuel | Import idempotent, conflits explicites, totaux par devise/statut rapprochés, copie privée récupérable | Notion + données / sécurité, calculs |
| 6 — Vérification et GitHub | Code relu, preuves, skill maître, neuf agents et point Claude publiés | Lots réalisés | Typecheck/tests/build, parcours utiles, captures fictives, diff privé vérifié, commit distant confirmé | Coordinateur / vérification indépendante |
| 7 — Accès quotidien sur appareils | Hébergement adapté, installation et données accessibles selon le mode choisi | Cible d’hébergement et protections réelles | URL contrôlée, appareils/émulations distingués, méthode de transfert ou sync honnête | Frontend + sécurité / vérification |
| 8 — Synchronisation éventuelle | Synchronisation privée et connecteurs dont la couverture est prouvée | Besoin, accès et hébergement définis | Authentification, conflits, suppression, panne/reprise et restauration vérifiés | Données + sécurité / vérification |

Les lots indépendants peuvent avancer en parallèle ; ne pas importer des données réelles dans une persistance non vérifiée. Ne pas reporter une correction financière au profit d’effets visuels. Un lot bloqué par un accès n’empêche pas la progression des autres.

## Critères par page

| Page | Attendu vérifiable |
| --- | --- |
| Vue d’ensemble | Patrimoine et disponible distincts, dates et couverture, flux du mois, échéances et alertes utiles |
| Mon mois | Mois explicite, prévu/reçu et prévu/payé distincts, récurrences rapprochées, projection nommée |
| Mes comptes | Type, établissement, devise, solde observé et date ; actions d’actualisation et transfert |
| Épargne et projets | Cibles et affectations distinctes, progression, réserves sans actif fictif supplémentaire |
| Investissements | Positions par compte/plateforme/type, mode de valorisation exclusif, données absentes explicites |
| Documents et réglages | Pièces reliées, imports supportés annoncés précisément, sauvegarde/restauration et verrouillage |

## Socle retenu

Conserver React, TypeScript et Vite. L’interface utilise CSS et SVG originaux ; les graphiques sont accompagnés d’une lecture textuelle. Le coffre initial utilise Web Crypto et `localStorage` pour des volumes limités, avec transfert manuel de sauvegardes chiffrées. L’ajout d’IndexedDB ou d’un serveur privé dépend d’un besoin démontré. Le coffre local n’assure pas de synchronisation cloud.

Les correctifs de sécurité justifient Vite 6.4.3 et Vitest 4.1.11 ; le lockfile fournit les versions réellement installées. Playwright sert aux parcours et captures. Consulter `RECHERCHE_OUTILS.md` avant tout nouvel outil.

## Terminaison d’une session

Chaque session livre un incrément concret et un état de reprise. Consigner le lot traité, les décisions, tests réellement exécutés, captures, revue, publication éventuelle, données privées importées ou non et prochain critère. Une application « complète » n’est déclarée que lorsque tous les parcours attendus, le stockage privé, l’import réel et l’accès sur les appareils sont effectivement vérifiés.
