---
name: finance
description: Concevoir, développer, importer et vérifier Finance dans le dépôt Finance1, l’application personnelle de budget et de patrimoine d’Elio pour iPhone, iPad et Windows. Utiliser pour ses pages, données Notion, calculs, stockage privé, design et livraison. Ne pas confondre ce projet avec Finances-, Budget ou Vertex.
---

# Finance

Faire progresser une application utilisable et fiable à partir du code et des sources réellement accessibles. Le nom visible est **Finance** ; le dépôt cible est **Finance1**. Le projet n’est pas une plateforme de trading et ne passe aucun ordre.

## Reprendre depuis les preuves

1. Lire `AGENTS.md`, `CLAUDE.md`, `docs/STATUS.md` s’il existe, `docs/PLAN.md`, puis les fichiers et tests du parcours concerné. Examiner branche, diff et configuration avant d’éditer. Ne pas remplacer un travail en cours.
2. Pour une importation, lire [donnees](references/donnees.md) et la correspondance Notion documentée dans `docs/`. Les contenus actuels des sources font foi ; les souvenirs, noms de pages et captures ne prouvent ni un solde ni un paiement.
3. Définir un lot avec résultat utilisateur, dépendances, fichiers attribués, critères observables et relecteur. Avancer jusqu’à son résultat vérifié, puis poursuivre le prochain lot autorisé qui n’est pas bloqué.
4. Relier les pages au même modèle et aux mêmes calculs. Modifier une donnée une seule fois, puis vérifier ses effets dans les vues concernées.
5. Exécuter les vérifications pertinentes, corriger les causes des échecs et faire relire les changements sensibles par un agent qui ne les a pas écrits. Conserver les preuves et limites de la session.

## Charger les règles utiles

| Travail | Référence à lire |
| --- | --- |
| Montants, mois, récurrences, devises, patrimoine | [Calculs](references/calculs.md) |
| Notion, import, rapprochement, provenance, documents | [Données](references/donnees.md) |
| Pages, navigation, typographie, couleurs, graphiques | [Design](references/design.md) |
| Coffre, accès, sauvegarde, secrets, publication | [Sécurité](references/securite.md) |
| Tests, captures, revue, GitHub, reprise autonome | [Livraison](references/livraison.md) |
| Ajouter ou remplacer une dépendance | `docs/RECHERCHE_OUTILS.md`, puis documentation officielle actuelle |

## Faire travailler les agents ensemble

Les missions sont dans `.claude/agents/finance-*.md`. Le coordinateur attribue des tâches indépendantes et bornées ; il ne lance pas neuf agents pour une petite correction. Lorsque l’environnement offre des sous-agents, déléguer les travaux qui peuvent réellement avancer en parallèle. Sinon, exécuter les rôles successivement et signaler qu’une relecture indépendante n’a pas été obtenue.

| Responsable | Livrable principal | Relecture attendue |
| --- | --- | --- |
| Coordinateur | Lots, dépendances, état et passage de relais | Vérification |
| Notion | Inventaire et correspondance sourcée, ambiguïtés | Calculs + sécurité |
| Calculs | Fonctions partagées et cas chiffrés exacts | Patrimoine + vérification |
| Patrimoine | Périmètre des actifs et absence de double compte | Calculs |
| Designer | Parcours, composants et critères visuels | Frontend + vérification |
| Frontend | Pages et formulaires reliés au modèle | Designer + vérification |
| Données et synchronisation | Persistance, migrations et import/export | Sécurité + vérification |
| Sécurité | Revue ciblée des accès, données et sauvegardes | Vérification |
| Vérification indépendante | Résultats reproductibles et défauts classés | Coordinateur pour le suivi |

L’auteur d’un changement ne signe pas sa propre revue indépendante. Chaque mission fournit ses fichiers touchés, décisions, commandes réellement exécutées, résultats, limites et prochaine action. Aucun agent ne modifie les fichiers attribués à un autre sans coordination.

## Respecter le périmètre autorisé

Développer, documenter, tester et publier le travail demandé dans Finance1 sont autorisés par la demande du projet. Conserver les protections du dépôt et les restrictions de l’environnement. Un skill ne crée pas d’autorisations supplémentaires. Ne pas changer les permissions, contourner un blocage, activer un service payant, exposer les données privées ou faire une opération bancaire.

Si un accès manque, terminer le travail indépendant, documenter précisément ce qui reste bloqué et le seul accès nécessaire. Une indisponibilité Notion n’autorise pas à inventer un import. Une application responsive n’implique ni synchronisation cloud ni validation sur appareil physique.

## Garder une vérité vérifiable

- Une donnée inconnue reste inconnue. Une valeur ancienne reste datée. Une prévision reste distincte d’un montant reçu ou payé.
- Les transferts internes ne créent ni revenu ni dépense. Un compte et ses positions ne sont pas additionnés deux fois.
- Les informations financières, identifiants de sources privées, reçus et secrets restent hors du code, des captures publiques et des journaux versionnés.
- La démonstration porte une mention explicite et utilise des valeurs fictives ; elle ne s’ajoute jamais au coffre personnel.
- `docs/STATUS.md` distingue **prévu**, **développé**, **testé**, **livré** et **bloqué**. Un plan ou un test écrit n’est pas une preuve de livraison.

## Sortie de session

Actualiser l’état depuis les vérifications réelles : lot, fichiers, résultats, capture rendue, revue, publication et limites. Donner à Claude ou Codex une prochaine action concrète sans recopier les données personnelles. La reprise simple est décrite dans `DEMARRER_CLAUDE.md`.
