# Avancement, vérification et livraison

## Lots et état

Lire le plan puis choisir le prochain lot utile selon les dépendances et le code. Ne pas recommencer l’audit complet à chaque session si ses sources restent valides. Pour chaque lot, maintenir : objectif, propriétaire, fichiers, prérequis, critères, statut, preuve et prochaine action.

| Statut | Preuve requise |
| --- | --- |
| Prévu | Résultat et critères écrits ; aucun fonctionnement supposé |
| Développé | Code présent et parcours identifié ; limites explicites |
| Testé | Vérification réellement exécutée, environnement et résultat conservés |
| Livré | Commit publié et, si concerné, version de l’application déployée puis contrôlée |
| Bloqué | Dépendance absente précise, travail indépendant terminé, condition de reprise |

Un commit GitHub est une livraison du code. Il n’atteste pas qu’un site est accessible, qu’un import privé a été installé sur les appareils de l’utilisateur ou qu’une CI distante est passée. Nommer séparément ces résultats.

## Coordination et revue

Avant délégation, attribuer des fichiers sans chevauchement et un livrable borné. Réunir les conclusions dans `docs/STATUS.md` et, si utile, un rapport de revue technique sans données privées. Aucun quota d’agents, de tests ou de lots n’est un objectif en soi.

Changements sensibles : import/rapprochement, calculs, devises, transferts, valorisations, chiffrement, migration, sauvegarde, authentification et exposition de données. Un autre agent examine le diff et des cas représentatifs avant publication. Si un défaut est corrigé par le relecteur lui-même, le coordinateur fait contrôler ce nouveau changement par un second regard ou marque la limite de revue.

## Vérification proportionnée

1. Lire les scripts de `package.json` et employer le gestionnaire associé au lockfile. Installer avec verrouillage reproductible et politiques existantes.
2. Exécuter typecheck, tests métier et build pour le lot livré. Ajouter des cas aux règles nouvelles qui peuvent changer un montant, perdre des données ou accorder un accès.
3. Vérifier les parcours réels avec Playwright lorsque disponible : création/déverrouillage du coffre, ajout d’un compte, revenu prévu puis reçu, dépense prévue puis payée, transfert, solde daté, objectif, sauvegarde/restauration et import répété. Ne pas déclarer un parcours testé s’il n’a pas été exécuté.
4. Vérifier les formats téléphone, tablette et ordinateur. Tester clavier, focus, erreurs, contenu vide et absence de débordement. WebKit émulé n’équivaut pas à un iPhone physique.
5. Produire une capture réelle de chaque étape majeure. Stocker uniquement la démonstration fictive dans les preuves versionnées, avec date/route/viewport/navigateur. Supprimer ou conserver hors Git les captures contenant des données personnelles.

Le navigateur doit lire les résultats de la persistance et des calculs, pas uniquement trouver un bouton. Une sauvegarde est vérifiée en restaurant puis comparant les entités et totaux ; le téléchargement seul ne suffit pas. Tester aussi un fichier corrompu et s’assurer que l’état précédent reste disponible.

## Publication et reprise

Relire le diff final, les fichiers suivis et le statut Git. Ne pas inclure exports, secrets, captures privées, dépendances installées ni build contenant des données intégrées. Préserver l’historique et les protections : pas de force-push, pas de réécriture d’un travail utilisateur et pas de contournement de CI.

Avec publication GitHub autorisée, publier le code revu sur la branche demandée ou une branche de travail adaptée aux règles du dépôt ; fusionner seulement si autorisé et si les conditions sont remplies. Vérifier le commit distant et donner le lien réel. Si les outils distants manquent, conserver une version locale vérifiée et dire précisément ce qui n’a pas été publié.

Avant de terminer, mettre à jour `docs/STATUS.md` avec date, branche, fichiers, commandes et résultats réellement vus, preuves visuelles, import privé réalisé ou non, publication et limites. Identifier la prochaine action utile et son critère de fin. Ne jamais recopier un ancien total de tests, SHA, URL ou état CI sans vérification.
