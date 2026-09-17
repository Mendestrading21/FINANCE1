# Finance — état de reprise

Mise à jour : 17 septembre 2026. Ce fichier décrit les faits vérifiés. Le plan définit les travaux futurs ; il ne constitue pas une preuve de livraison.

## État des lots

| Lot | État | Résultat et limite |
| --- | --- | --- |
| Audit de Finance1 | Terminé | Le dépôt contenait un traqueur d’habitudes. Son code est conservé dans `legacy/habitudes/` ; Finance réutilise React, TypeScript et Vite. |
| Audit Notion | Terminé pour les sources accessibles | Budget 2026 actif, comptes, factures, revenus, abonnements et espace Trading examinés. Couverture et ambiguïtés détaillées dans le rapport privé séparé. Aucun secret ni identifiant personnel dans Git. |
| Modèle et calculs | Développés et testés | Montants exacts, inconnus explicites, dates métier distinctes de l’import, transferts neutres, valorisation du compte ou de ses composantes. |
| Coffre | Développé et testé | Chiffrement local, verrouillage, sauvegarde et restauration. Aucun serveur ni partage automatique entre appareils. |
| Six pages et saisie | Développées et testées en navigateur | Pages liées, opérations, soldes datés, récurrences, objectifs, positions, documents, imports et sauvegardes. |
| Import Notion privé | Préparé et testé dans un coffre temporaire | Import, réimport sans doublon, export comparé et réouverture vérifiés. Le fichier privé doit être importé dans le coffre choisi par l’utilisateur ; aucun coffre permanent n’a été installé sur ses appareils. |
| Skill et agents | Réalisés et relus | Skill Finance, cinq références, neuf agents spécialisés, `AGENTS.md`, `CLAUDE.md` et point d’entrée simple. |
| Publication GitHub | Livrée et vérifiée | Code publié sur `main` de `Mendestrading21/FINANCE1`, commit `c0d90a1e1fc67b2cc85eacb9f0e764aa575c015d`. Arbre Git distant identique aux fichiers vérifiés, historique conservé, skill relu depuis GitHub. CI distante réussie. |
| Hébergement et appareils physiques | À réaliser | Aucun hébergement HTTPS ni domaine n’est configuré. Pas d’essai sur iPhone, iPad ou Windows physiques. |
| Synchronisation bancaire ou cloud | Prévue, non développée | Nécessite une cible privée, des accès et une politique de conflits. Le mode livré utilise des sauvegardes chiffrées transférées manuellement. |

## Données et vérité financière

La correspondance publique est dans [CORRESPONDANCE_NOTION.md](CORRESPONDANCE_NOTION.md). L’import conserve les liens, identifiants et dates d’extraction dans le fichier privé. Un mois budgétaire n’invente pas une date de paiement. Les soldes sans date, règlements ambigus et détentions non prouvées ne deviennent pas des valeurs actuelles.

Le rapprochement reste nécessaire avant de pouvoir donner un patrimoine ou un disponible complet : confirmer les soldes datés, les règlements, les comptes de destination des virements, les récurrences et les positions réellement détenues. Une information importée puis modifiée porte une indication de modification manuelle.

**Audit Notion du 17 septembre 2026 (sources accessibles, sans valeurs privées) :** aucune base « Patrimoine » de Budget 2026 ne fournit actuellement de registre de comptes exploitable (établissement/devise/valeur) ; « Mouvements de Capital » (91 lignes, 64 % sans date) ne peut pas devenir des transferts du modèle en l’état (aucun champ compte/devise) et reste à rapprocher manuellement. Les 17 lignes de la base de positions (vue sous plusieurs noms : « Mes Actifs », « Performances 2026 ») n’ont aucune quantité, prix, devise ni date d’achat renseignés : aucune position prouvée à ce jour, conformément à la règle « une watchlist ne devient pas un actif ». Le quota Notion (requêtes de bases) a de nouveau été atteint en cours d’audit, comme lors de la session précédente. Aucun fichier d’import privé n’était joint à cette session ; l’import réel reste bloqué tant qu’Elio ne le fournit pas. Détails complets (identifiants, schémas) dans un rapport privé hors Git.

## Preuves

| Contrôle exécuté | Résultat |
| --- | --- |
| `pnpm run typecheck` | Réussi après le dernier correctif métier. |
| `pnpm run test` | 68 tests réussis dans quatre fichiers ; dernière exécution par le relecteur indépendant. |
| `pnpm run build` | Réussi ; application et cache hors ligne construits, sans donnée privée. |
| `pnpm run test:e2e` | Deux parcours réussis : coffre/saisie/verrouillage ; navigation/six pages/masquage/captures/import CSV et réimport sans doublon. Aucune erreur JavaScript relevée. |
| `pnpm audit --json` | Aucune vulnérabilité signalée pour le lockfile contrôlé. |
| Validation du skill | Validateur officiel `quick_validate.py` réussi ; missions et scénarios relus indépendamment. |

La [revue indépendante](REVUE_INDEPENDANTE.md) détaille les contre-exemples, corrections et limites. L’audit des dépendances ne remplace pas un audit de sécurité de l’application. Le runtime navigateur de cette session utilise Chromium 138 fourni par `@sparticuz/chromium` ; la CI est configurée pour installer le Chromium de Playwright. Les résultats de la session ne préjugent pas de cette exécution distante.

**Preuve distante distincte :** le workflow [Finance verification — 35276381751](https://github.com/Mendestrading21/FINANCE1/actions/runs/35276381751) a terminé avec succès sur le commit applicatif ci-dessus : installation figée, TypeScript, tests, build, Chromium Playwright, parcours navigateur, audit et captures en artefact. Le présent ajout documentaire consigne ce résultat après sa vérification ; un changement ultérieur doit être revérifié.

L’import réel a passé un parcours privé distinct : deux imports identiques, absence de libellés en clair dans le stockage, comparaison après export, verrouillage et déverrouillage, aucune erreur JavaScript. Le coffre de test a été supprimé ; aucune capture contenant des finances personnelles n’a été produite.

## Captures réelles

| Capture | Ce qu’elle prouve |
| --- | --- |
| [00 — Existant](captures/00-existant-habitudes.png) | Traqueur initial avant les modifications. |
| [01 — Coffre](captures/01-coffre-desktop.png) | Écran réel de création de l’espace privé. |
| [02 — Ordinateur](captures/02-finance-desktop.png) | Tableau de bord à 1 440 px de large. |
| [03 — Tablette](captures/03-finance-ipad.png) | Tableau de bord à 834 px de large. |
| [04 — Téléphone](captures/04-finance-iphone.png) | Tableau de bord à 390 px de large. |
| [05 — Projets](captures/05-projets-iphone.png) | Épargne et projets au format téléphone. |

Toutes les captures de Finance utilisent la démonstration explicitement fictive. Il s’agit de rendus Chromium avec dimensions adaptées, sans validation Safari/WebKit ni appareil physique.

## Prochain travail concret

1. Choisir et configurer un hébergement statique HTTPS pour l’application ; le coffre reste local tant qu’une synchronisation privée n’est pas développée. Vérifier CSP, cache et absence de fichiers privés dans le build.
2. Ouvrir Finance sur les appareils, créer le coffre avec une phrase choisie par l’utilisateur, importer le fichier privé puis conserver une sauvegarde chiffrée et vérifier sa restauration.
3. Rapprocher les informations signalées avec les relevés et sources, sans remplacer les inconnus par zéro.
4. Vérifier les parcours sur Safari iPhone/iPad et Edge Windows, puis décider si la synchronisation privée est nécessaire.

Lire [DEMARRER_CLAUDE.md](../DEMARRER_CLAUDE.md) pour reprendre. Toute nouvelle session commence par le dépôt et les accès réels ; elle ne reprend pas un total de tests ou une publication comme une preuve valable après de nouvelles modifications.
