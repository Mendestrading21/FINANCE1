# Finance — état de reprise

Mise à jour : 17 septembre 2026 (session de finalisation nocturne). Ce fichier décrit les faits vérifiés. Le plan définit les travaux futurs ; il ne constitue pas une preuve de livraison.

## Session nocturne du 17 septembre 2026 — résumé

Reprise depuis le commit `1f7727a`, travail réparti entre plusieurs agents spécialisés (coordinateur, notion, données/sync, designer, frontend ×2, calculs, vérification indépendante — un agent différent de chaque auteur). Cinq défauts réels corrigés (devise non déduite du compte, virement sans compte source obligatoire, sélecteur de position non filtré, accessibilité du sélecteur de type, compression du libellé à 390px), une protection ajoutée (refus par défaut de restaurer une sauvegarde plus ancienne, avec confirmation explicite), un bug de calcul corrigé (réécriture rétroactive du montant des récurrences non réglées). Revue indépendante finale : **livrable tel quel, aucun défaut bloquant résiduel**. Détail complet dans l'historique Git de la branche `claude/finance-app-completion-k86h7n` (chaque commit décrit son propre lot) et dans le résumé de fin de session transmis à l'utilisateur.

## État des lots

| Lot | État | Résultat et limite |
| --- | --- | --- |
| Audit de Finance1 | Terminé | Le dépôt contenait un traqueur d’habitudes. Son code est conservé dans `legacy/habitudes/` ; Finance réutilise React, TypeScript et Vite. |
| Audit Notion | Terminé pour les sources accessibles, rapproché le 17/09 au soir | Budget 2026 actif, comptes, factures, revenus, abonnements et espace Trading examinés à nouveau. Aucune base « Patrimoine » exploitable actuellement, « Mouvements de Capital » et la base de positions restent à rapprocher manuellement (détail plus bas). Aucun secret ni identifiant personnel dans Git. |
| Modèle et calculs | Développés et testés, corrigés le 17/09 au soir | Montants exacts, inconnus explicites, dates métier distinctes de l’import, transferts neutres, valorisation du compte ou de ses composantes. Un changement de montant de récurrence ne réécrit plus les occurrences non réglées passées (`amountEffectiveFrom`/`amountHistory`) ; limite : la date d'effet est toujours « aujourd'hui », pas de planification d'une hausse future depuis l'interface. |
| Coffre | Développé, durci et testé le 17/09 au soir | Chiffrement local, verrouillage, sauvegarde et restauration. Sauvegardes désormais datées (`savedAt`, authentifié) ; restauration d'une sauvegarde plus ancienne que le coffre présent refusée par défaut avec confirmation explicite pour l'outrepasser (coffre courant jamais touché en cas de refus ou d'annulation). Aucun serveur ni partage automatique entre appareils ; ce refus ne s'applique pas à un coffre/une sauvegarde au format antérieur à `savedAt`. |
| Six pages et saisie | Développées et testées en navigateur, fiabilisées et polies le 17/09 au soir | Pages liées, opérations, soldes datés, récurrences, objectifs, positions, documents, imports et sauvegardes. Les 8 parcours quotidiens (revenu, dépense, récurrence, solde, virement, objectif, position, reçu) vérifiés par clic réel, y compris par un relecteur indépendant sur les 4 les plus à risque. Cohérence visuelle revue sur les trois formats. |
| Import Notion privé | Préparé et testé dans un coffre temporaire (session antérieure) | Import, réimport sans doublon, export comparé et réouverture vérifiés. Le fichier privé doit être importé dans le coffre choisi par l’utilisateur ; aucun coffre permanent n’a été installé sur ses appareils. Aucun fichier privé joint à la session du 17/09 au soir. |
| Skill et agents | Réalisés et relus | Skill Finance, cinq références, neuf agents spécialisés, `AGENTS.md`, `CLAUDE.md` et point d’entrée simple. |
| Publication GitHub | Livrée et vérifiée | Code publié sur la branche `claude/finance-app-completion-k86h7n` de `Mendestrading21/FINANCE1`, PR #1 (brouillon), CI verte sur chaque commit poussé cette nuit. Historique conservé depuis `c0d90a1`. |
| Hébergement et appareils physiques | À réaliser | Aucun hébergement HTTPS ni domaine n’est configuré (détail et options plus bas). Pas d’essai sur iPhone, iPad ou Windows physiques, ni Safari/WebKit réel. |
| Synchronisation bancaire ou cloud | Prévue, non développée | Nécessite une cible privée, des accès et une politique de conflits. Le mode livré utilise des sauvegardes chiffrées transférées manuellement (détail plus bas). |

## Données et vérité financière

La correspondance publique est dans [CORRESPONDANCE_NOTION.md](CORRESPONDANCE_NOTION.md). L’import conserve les liens, identifiants et dates d’extraction dans le fichier privé. Un mois budgétaire n’invente pas une date de paiement. Les soldes sans date, règlements ambigus et détentions non prouvées ne deviennent pas des valeurs actuelles.

Le rapprochement reste nécessaire avant de pouvoir donner un patrimoine ou un disponible complet : confirmer les soldes datés, les règlements, les comptes de destination des virements, les récurrences et les positions réellement détenues. Une information importée puis modifiée porte une indication de modification manuelle.

**Audit Notion du 17 septembre 2026 (sources accessibles, sans valeurs privées) :** aucune base « Patrimoine » de Budget 2026 ne fournit actuellement de registre de comptes exploitable (établissement/devise/valeur) ; « Mouvements de Capital » (91 lignes, 64 % sans date) ne peut pas devenir des transferts du modèle en l’état (aucun champ compte/devise) et reste à rapprocher manuellement. Les 17 lignes de la base de positions (vue sous plusieurs noms : « Mes Actifs », « Performances 2026 ») n’ont aucune quantité, prix, devise ni date d’achat renseignés : aucune position prouvée à ce jour, conformément à la règle « une watchlist ne devient pas un actif ». Le quota Notion (requêtes de bases) a de nouveau été atteint en cours d’audit, comme lors de la session précédente. Aucun fichier d’import privé n’était joint à cette session ; l’import réel reste bloqué tant qu’Elio ne le fournit pas. Détails complets (identifiants, schémas) dans un rapport privé hors Git.

## Preuves

Chiffres de la session nocturne du 17 septembre 2026, vérifiés indépendamment (relecteur distinct de chaque auteur) sur le commit final `HEAD` de `claude/finance-app-completion-k86h7n` :

| Contrôle exécuté | Résultat |
| --- | --- |
| `pnpm run typecheck` | Réussi (`tsc -b --noEmit`, code de sortie 0). |
| `pnpm run test` | **82 tests réussis dans 5 fichiers** (`finance.test.ts`, `validation.test.ts`, `importCsv.test.ts`, `vault.test.ts`, `Editor.test.ts`). |
| `pnpm run build` | Réussi ; application et cache hors ligne construits, sans donnée privée. |
| `pnpm run test:e2e` | **4 scénarios réels réussis** : coffre/saisie/verrouillage ; captures/navigation/six pages/masquage/import CSV et réimport sans doublon ; les 8 parcours quotidiens (revenu, virement multi-devises, récurrence, position filtrée, reçu depuis une ligne) ; restauration d'une sauvegarde plus ancienne (refus, annulation neutre, confirmation explicite). Aucune erreur JavaScript relevée. Limite d'environnement documentée : dans ce bac à sable, Chromium en mode single-process devient intermittent dès 3 tests e2e simultanés (`--workers=1 --retries=1` stabilise le résultat) ; chaque test rejoué isolément passe systématiquement du premier coup — confirmé indépendamment, pas une régression fonctionnelle. La CI GitHub Actions n'utilise pas ce mode single-process. |
| `pnpm audit --audit-level high` | Aucune vulnérabilité signalée. |
| Validation du skill | Validateur officiel `quick_validate.py` réussi (session antérieure) ; missions et scénarios relus indépendamment. |

La [revue indépendante](REVUE_INDEPENDANTE.md) (session antérieure) détaille les contre-exemples, corrections et limites déjà couverts sur le moteur, le coffre, l'import CSV et le skill. Cette session nocturne a ajouté une seconde revue indépendante, ciblée sur les changements du soir (coffre/sauvegardes, design, 8 parcours, récurrences, Notion) : **verdict livrable, aucun défaut bloquant résiduel**, limites listées ci-dessous. L’audit des dépendances ne remplace pas un audit de sécurité de l’application.

**Preuve distante :** CI GitHub Actions (`Finance verification`) verte sur chaque commit poussé cette nuit sur `claude/finance-app-completion-k86h7n`, y compris le commit final — voir la PR #1. Historique CI antérieur : [run 35276381751](https://github.com/Mendestrading21/FINANCE1/actions/runs/35276381751) sur le commit `c0d90a1`.

L’import réel (session antérieure) a passé un parcours privé distinct : deux imports identiques, absence de libellés en clair dans le stockage, comparaison après export, verrouillage et déverrouillage, aucune erreur JavaScript. Le coffre de test a été supprimé ; aucune capture contenant des finances personnelles n’a été produite.

### Limites résiduelles honnêtes (session du 17/09 au soir)

- Aucun test Safari/WebKit réel ni appareil physique iPhone/iPad/Windows : uniquement Chromium émulé (1440/834/390 px).
- Le refus de restauration d'une sauvegarde plus ancienne ne protège pas un coffre ou une sauvegarde au format antérieur au champ `savedAt` (comportement testé et assumé, rétrocompatibilité volontaire).
- Aucune date d'effet différée n'est réglable pour un changement de montant de récurrence depuis l'interface (toujours « aujourd'hui »).
- Le quota Notion (requêtes de bases) a de nouveau été atteint en cours d'audit ; certaines vérifications de doublons (Factures, Revenus, Abonnements) n'ont pas pu être terminées.

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

## Hébergement (17 septembre 2026)

Aucune cible d'hébergement n'était configurée pour Finance1 au début de la nuit. `pnpm run build` produit un `dist/` statique, servable par n'importe quel hébergement HTTPS (CSP déjà injectée au build, service worker limité au shell applicatif, aucune donnée privée).

- **GitHub Pages — testé et confirmé bloqué (18/09/2026).** Un workflow `.github/workflows/pages.yml` (`actions/deploy-pages`, activation automatique) a été ajouté et exécuté deux fois sur ce dépôt. Résultat exact reçu de l'API GitHub : `Create Pages site failed. Error: Resource not accessible by integration`. Ce dépôt étant **privé**, GitHub Pages y est indisponible sur le forfait actuel — confirmé par ce test réel, pas supposé. Deux options pour débloquer, au choix d'Elio : rendre le dépôt public, ou passer sur un forfait GitHub payant (Pro/Team/Enterprise). Le workflow reste dans le dépôt, déclenchable manuellement (`workflow_dispatch`) une fois l'un des deux choisi — il fonctionnera alors sans autre changement.
- **Hébergeur statique tiers** (Netlify, Vercel, Cloudflare Pages…) : nécessite un compte créé par Elio et un token de déploiement à ajouter en secret GitHub — aucun de ces comptes n'existe dans ce dépôt ; en créer un est un service tiers hors du périmètre déjà autorisé sans confirmation explicite.
- Dans tous les cas : domaine personnalisé optionnel, à la charge d'Elio s'il le souhaite.

## Synchronisation entre appareils — ce qui est réellement possible

Le coffre est local au navigateur (Web Crypto + `localStorage`) ; il n'existe aucun serveur associé à l'application. Une application statique servie par un hébergement HTTPS (une fois choisi ci-dessus) n'ajoute **aucune** synchronisation automatique : appeler l'API Notion directement depuis le navigateur exposerait un jeton d'intégration au client, ce qui n'est pas sûr et n'est pas fait. Sans backend autorisé et configuré (hors périmètre de cette nuit — aucun service payant ni nouvelle connexion sans autorisation explicite), la seule synchronisation honnête entre iPhone, iPad et Windows reste la **sauvegarde chiffrée exportée puis restaurée manuellement** (déjà développée et durcie cette nuit : datation, refus par défaut d'une sauvegarde plus ancienne avec confirmation explicite pour l'outrepasser). Aucune synchronisation automatique n'est annoncée comme fonctionnelle.

## Prochain travail concret

1. **Décider d'une cible d'hébergement** (GitHub Pages sur dépôt privé nécessite un forfait payant ou de le rendre public ; sinon un hébergeur statique tiers avec un compte à créer) — décision qui revient à Elio, voir la section Hébergement ci-dessus. Une fois choisie : configurer le déploiement, vérifier CSP/cache/absence de fichiers privés dans le build (déjà en place côté code), puis contrôler l'URL obtenue.
2. Ouvrir Finance sur les appareils, créer le coffre avec une phrase choisie par l’utilisateur, importer le fichier privé (à fournir par Elio) puis conserver une sauvegarde chiffrée et vérifier sa restauration.
3. Rapprocher les informations signalées avec les relevés et sources, sans remplacer les inconnus par zéro : en particulier, aucune base « Patrimoine » de Budget 2026 ne fournit aujourd'hui de registre de comptes, et aucune position de la base « Mes Actifs »/« Performances 2026 » n'a de quantité/prix/devise/date prouvés.
4. Vérifier les parcours sur Safari iPhone/iPad et Edge Windows (appareils physiques ou émulateurs officiels), puis décider si la synchronisation privée est nécessaire.
5. Fusionner la PR #1 vers `main` une fois relue par Elio (actuellement en brouillon, CI verte).

Lire [DEMARRER_CLAUDE.md](../DEMARRER_CLAUDE.md) pour reprendre. Toute nouvelle session commence par le dépôt et les accès réels ; elle ne reprend pas un total de tests ou une publication comme une preuve valable après de nouvelles modifications.
