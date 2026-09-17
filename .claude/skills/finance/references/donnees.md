# Données, Notion et rapprochement

## Sources et périmètre

Lire les espaces demandés « Budgets 2026 », « Bourse / Investissement », puis les pages directement liées aux comptes, dépenses, reçus et documents comptables. Relever les propriétés, relations, sous-pages et états accessibles ; paginer jusqu’au bout lorsque l’API pagine. Documenter une page inaccessible au lieu de conclure qu’elle est vide. La lecture n’autorise pas l’édition de Notion.

L’inventaire privé conserve les identifiants de pages, URL de provenance, dates, unités, intitulés bruts et niveau de confiance. La documentation Git ne contient que les schémas, règles de correspondance et statistiques non sensibles nécessaires. Si un fichier de correspondance réel existe dans `docs/`, le consulter ; vérifier qu’il ne divulgue aucun montant ou identifiant privé.

Les résumés de conversation servent à retrouver une source, pas à renseigner le coffre. Une information donnée directement par l’utilisateur peut être enregistrée comme source utilisateur avec sa date et ses limites, sans la rebaptiser donnée Notion.

## Modèle commun

| Entité | Rôle et relation |
| --- | --- |
| Compte | Identité, devise, type, établissement ; porte des observations de solde |
| Observation de solde | Montant, devise, date observée, source ; ne remplace pas l’historique |
| Opération | Revenu, dépense ou transfert ; statut, dates, compte et source |
| Récurrence | Règle et versions ; génère des occurrences, jamais des paiements fictifs |
| Objectif / réserve | Cible et affectations liées aux comptes ; pas un actif additionnel |
| Position | Compte, instrument, type d’actif, quantité, valorisation et date |
| Taux de change | Paire, sens, valeur, date, source |
| Document | Pièce liée à une ou plusieurs opérations ; métadonnées et contenu privés |
| Lot d’import | Source, date, version, clés stables, résultat et anomalies |

Chaque page consomme ces entités et les calculs partagés. Ne pas créer un second total ou un second formulaire métier indépendant pour le dashboard.

## Import fiable

1. Conserver les fichiers bruts hors du dépôt dans l’espace privé prévu. Limiter noms de fichiers et logs aux informations nécessaires.
2. Examiner schéma et volume avant transformation. Valider types, dates, devises, références entre objets et limites de taille. Refuser un format inconnu avec une erreur explicite.
3. Présenter le rapprochement : reconnus, nouveaux, doublons, conflits, inconnus et exclus. Préserver libellé brut et provenance dans les données privées.
4. Utiliser un identifiant stable de source pour l’idempotence. Une seconde importation identique n’ajoute aucun doublon. Un changement de la même source crée une mise à jour explicite ou un conflit ; ne pas écraser une correction manuelle plus récente.
5. Appliquer le lot de façon atomique après validation et sauvegarde récupérable. Un échec ne doit pas laisser un demi-import ni annoncer « enregistré ».
6. Contrôler des totaux par devise, statut, mois et type avant/après. Les totaux source peuvent être des formules ou cumuls : vérifier leur périmètre avant de les comparer aux lignes.
7. Garder un reçu d’import privé et un résumé technique sans valeurs privées dans l’état de livraison.

Ne pas marquer toutes les dépenses « payées » en l’absence d’un statut vérifié. Ne pas transformer un montant annuel en mensualité constatée. Ne pas inventer le compte payeur ou la devise à partir du seul pays de l’utilisateur. Sans date de solde, afficher « date non renseignée » et exclure les indicateurs qui exigent une date.

## CSV et documents

Les imports CSV doivent gérer guillemets, séparateurs et encodage du format annoncé. Une simple séparation par virgule n’est pas un import CSV général. Tant qu’un format n’est pas supporté, fournir un modèle précis ou le refuser ; ne pas annoncer tous les exports bancaires comme compatibles.

Pour un export destiné à un tableur, neutraliser les cellules interprétables comme formules sans altérer l’archive financière d’origine. Un PDF scanné ou un OCR produit des candidats à vérifier ; il ne justifie pas un paiement confirmé. Vérifier MIME réel, taille, rattachement et ouverture de la pièce, puis sa présence après restauration.

## Accès Notion et synchronisations

Un accès temporaire du présent environnement ne garantit pas que Claude ou l’application y auront accès. Conserver une procédure de réimport avec accès existant ou export local, sans copier de jeton dans Git. Pas de secret Notion dans le JavaScript livré au navigateur.

Le mode initial est local : coffre chiffré dans le navigateur et transfert manuel de sauvegardes chiffrées entre appareils. **Ce n’est pas une synchronisation automatique.** Les conflits entre deux copies modifiées doivent être explicités avant tout remplacement.

Une synchronisation cloud future nécessite serveur privé identifié, authentification, contrôles d’accès, politique de conflits, journal, reprises sur erreur et restauration testée. Une connexion bancaire nécessite la vérification des établissements et pays réellement couverts ; ne pas promettre une synchronisation suisse d’après une annonce « Europe ». Garder la saisie manuelle utilisable.
