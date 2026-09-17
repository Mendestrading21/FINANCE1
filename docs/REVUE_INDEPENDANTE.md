# Revue indépendante — Finance

Date : 17 septembre 2026. Relecteur distinct des auteurs du moteur, du coffre, de l’interface et du skill. Aucun changement du code applicatif ni mutation distante réalisé par le relecteur.

## Périmètre et méthode

Lecture du modèle, des calculs, de la validation et du rapprochement, du coffre, de l’import CSV, des formulaires, des graphiques et des chemins asynchrones de l’application. Lecture du skill maître, de ses cinq références, des neuf missions et des points d’entrée Claude/Codex. Relecture des captures réelles de démonstration sur ordinateur et téléphone.

Les reproductions utilisent exclusivement des données fictives. Le jeu financier privé et les pièces réelles n’ont pas été lus ni reproduits dans cette revue. La vérification des sources Notion et de l’import réel relève du rapport privé et des contrôles distincts du coordinateur.

## Constats corrigés et contrôlés

| Constat initial | Conséquence | Résolution vérifiée |
| --- | --- | --- |
| Deux soldes saisis le même jour conservaient le premier | Une actualisation n’apparaissait pas dans les totaux | Dernière observation de la même date retenue ; reproduction indépendante réussie |
| Un mois sans données donnait zéro | Absence confondue avec zéro constaté | Résultats inconnus sans couverture ; reproduction indépendante réussie |
| Les engagements explicites du mois précédent étaient ignorés du disponible | Disponible surestimé | Engagements non réglés conservés ; reproduction indépendante réussie |
| Confirmer un paiement pouvait faire augmenter le disponible sans nouveau solde | Paiement retiré des engagements alors que le solde était inchangé | Disponible inconnu lorsque le rapprochement du même jour est ambigu ; reproduction indépendante réussie |
| Les informations en attente de rapprochement n’affectaient pas les projections | Projection présentée comme complète malgré des sources incertaines | Revue en attente rend projection et disponible inconnus ; reproduction indépendante réussie |
| Une collision d’identifiant entre deux sources pouvait rattacher de nouveaux enfants au mauvais compte | Mauvaise attribution d’opérations malgré un conflit parent | Identité ID/source ambiguë rejetée atomiquement ; reproduction indépendante réussie |
| Des nombres individuellement sûrs pouvaient produire un total hors précision après persistance | Un import accepté pouvait empêcher le rendu du coffre | Borne cumulative avant persistance, conversions comprises ; rejet reproduit |
| La borne de change ignorait l’arrondi séparé de plusieurs composantes | Dépassement possible malgré une conversion globale sûre | Marge par composante ajoutée avec cas indépendant de sept comptes |
| Une sauvegarde ou lecture de fichier achevée après verrouillage pouvait remettre les données à l’écran | Verrouillage contourné par une fin de tâche asynchrone | Génération de session capturée au rendu et vérifiée avant/après mutation ; chemins relus |
| Modifier un objet importé pouvait dater implicitement une valeur inconnue d’aujourd’hui | Date inventée | Valeurs nulles conservées lors d’une édition ; mois budgétaire distinct conservé ; formulaires relus |
| Les opérations prévues ou sans date n’étaient pas toutes modifiables | Corrections quotidiennes bloquées | Édition des opérations persistées et liste des opérations sans période ; interface relue |
| Une valeur Notion modifiée manuellement conservait une provenance non qualifiée | Lien source pouvant laisser croire que le montant modifié provenait encore de Notion | Indication de modification manuelle, identifiant et lien d’origine conservés ; code relu |
| Les dialogues n’avaient pas de nom accessible | Contexte insuffisant au lecteur d’écran | Titres reliés par `aria-labelledby` ; code relu |
| Les marges multiplicatives du graphique échouaient avec un patrimoine négatif | Échelle inversée ou points hors cadre | Marges additives ; calcul relu |
| Le tableau de bord affirmait un rapprochement non calculé | Capacité surestimée | Libellé limité aux valeurs datées connues et à l’absence de double comptage |
| Un règlement confirmé sans date était attribué au mois de budget | Mois budgétaire confondu avec mois d’encaissement/paiement | Ligne conservée visible mais exclue des agrégats réalisés ; disponible rendu inconnu si concerné ; reproduction indépendante réussie |

## Contrôles indépendants exécutés

Un script temporaire a compilé les modules métier hors du dépôt et vérifié douze scénarios avec résultats attendus calculés séparément : dernière observation du même jour, mois vide, neutralité des transferts, valorisation totale/détaillée, solde sans date, change absent, projection bloquée par une revue, paiement sans nouveau solde, engagement en retard, réimport identique, saisie décimale stricte et doublon de source. **Douze scénarios sur douze réussis.**

Les collisions d’identité et les dépassements cumulatifs ont ensuite été reproduits séparément puis leur rejet a été vérifié après correction. Le contre-exemple de change à sept composantes a été communiqué à l’auteur, ajouté aux tests de régression et son rejet avant persistance revérifié indépendamment. Le cas d’un paiement confirmé sans date, avec mois budgétaire connu, ne crée plus de cash mensuel attribué arbitrairement ; le cas positif d’une prévision dont seul le mois est connu reste pris en charge.

Exécution indépendante finale, après ces corrections : **`pnpm test` : 68 tests réussis dans 4 fichiers**, puis **`pnpm run typecheck` : réussi**, code de sortie 0 pour la commande complète. Cette exécution inclut moteur, validation, coffre et CSV. Les preuves de build et de parcours navigateur sont consignées séparément dans `docs/STATUS.md`.

## Coffre et import CSV

Le coffre utilise le vrai Web Crypto dans les tests : clé AES non extractible, nouveau nonce à chaque sauvegarde, métadonnées authentifiées, mauvaise phrase et chiffré altéré refusés, validation avant remplacement, conservation de la valeur précédente sur erreur quota et refus d’une ancienne session après modification du coffre. La comparaison et l’écriture utilisent Web Locks lorsque disponible ; la limite du contrôle optimiste sans Web Locks est documentée.

L’import CSV a été relu dans son format effectivement pris en charge : UTF-8, virgule ou point-virgule, champs entre guillemets et multiligne, en-têtes contrôlés, identifiant externe stable, montants exacts, statut vide inconnu, date vide nulle, références vérifiées, transferts avec deux comptes et montants des deux devises. Il ne prétend pas importer tout format bancaire. Un montant absent provoque un rejet explicite ; il ne devient jamais zéro. Les formules restent du texte dans les libellés et sont rejetées comme montants.

## Mise à l’épreuve du skill

| Situation fictive | Chemin suivi dans les instructions | Résultat attendu |
| --- | --- | --- |
| CSV contenant prévu, payé, statut vide, date vide et montant absent | Données → import fiable/CSV ; calculs → dates et statuts ; données-sync → validation | Prévu et confirmé restent distincts ; statut/date inconnus préservés ; montant absent refusé ; aperçu et rapprochement avant persistance |
| Transfert de CHF vers EUR | Calculs → transferts/devises ; patrimoine → périmètre | Deux comptes et deux montants ; aucun revenu/dépense créé ; absence de taux de valorisation signalée |
| Compte d’investissement avec total et positions | Calculs/patrimoine → autorité de valorisation | Total du compte ou cash plus positions, sans addition des deux méthodes |
| Appareil ou session sans accès Notion | Skill → périmètre autorisé ; Notion → critères ; livraison → statut bloqué | Travail indépendant poursuivi ; procédure d’export/import préparée ; aucun import réel inventé ni permission contournée |
| Publication Git sans hébergement configuré | Livraison → preuves par statut ; entrée Claude | Livraison du code distinguée d’une application déployée et de données installées sur les appareils |

Les missions ont des livrables et critères distincts ; les changements sensibles demandent un autre auteur pour la revue. Les chemins vers les références ont été rendus explicites. Les références décrivent aussi des exigences futures : elles renvoient au code et à l’état réel avant d’annoncer une fonction livrée.

## Vérification visuelle et limites

Captures `02-finance-desktop.png`, `04-finance-iphone.png` et `05-projets-iphone.png` examinées : direction noir/graphite et bleu-violet cohérente, données fictives signalées, hiérarchie des montants et dates présentes, navigation accessible. Aucun débordement horizontal apparent dans ces images. Les captures complètes conservent la barre mobile fixe à sa position dans le premier viewport ; il s’agit d’un effet normal de capture pleine page.

Les styles incluent focus visible, commandes principales de 44 px minimum, réduction des animations/transparences et marges de sécurité mobiles. Cela ne constitue pas un audit complet au lecteur d’écran ni une validation sur iPhone, iPad ou Windows physiques. Le coordinateur exécute les parcours navigateur et conserve leurs résultats séparément.

Le fonctionnement reste local, avec transfert manuel de sauvegarde chiffrée. Les données du navigateur peuvent être effacées et les pièces jointes sont soumises à son quota. Une date de solde au jour ne permet pas toujours un rapprochement intrajournalier : le disponible doit alors rester inconnu. Les fonctions prévues ne doivent pas être décrites comme livrées.

## Conclusion du périmètre relu

Les défauts bloquants identifiés dans cette revue ont été corrigés et les derniers cas reproduits avec succès. Aucun défaut bloquant connu ne reste ouvert dans le périmètre examiné. Le coordinateur doit encore vérifier les preuves de build/publication au moment de livrer ; cette revue ne prouve ni un déploiement web, ni une CI distante, ni une validation sur appareils physiques ou une installation des données sur les appareils de l’utilisateur.
