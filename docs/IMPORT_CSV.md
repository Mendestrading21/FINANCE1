# Importer des opérations CSV dans Finance

L’import CSV permet de préparer des revenus, dépenses et virements dans un tableur. Il ne se connecte pas à la banque et ne modifie pas les soldes datés de vos comptes. Le résultat est présenté à l’import général de Finance pour rapprochement avant enregistrement dans le coffre.

Le modèle téléchargeable contient **une ligne explicitement fictive, à supprimer avant votre import réel**. Elle permet uniquement de comprendre le format.

## Format

- Fichier texte UTF-8, avec ou sans BOM, limité à **5 000 000 octets** et 50 000 opérations.
- Séparateur `;` ou `,`, unique pour l’en-tête. Les fins de ligne Windows et Unix sont acceptées.
- Les champs contenant le séparateur, un guillemet ou un retour à la ligne doivent être entourés de guillemets. Un guillemet interne s’écrit `""`.
- En-tête exact ci-dessous ; l’ordre peut changer. Les cinq premières colonnes sont obligatoires ; les six autres peuvent être absentes ou vides. Les colonnes inconnues et les en-têtes en doublon sont refusés.

```csv
externalId;label;kind;amount;currency;status;date;budgetMonth;accountId;destinationAccountId;destinationAmount
```

| Colonne | Valeur attendue |
| --- | --- |
| `externalId` | Identifiant stable et unique de l’opération, obligatoire. Exemple fictif : `banqueA-operation-001`. Utilisez lettres sans accent, chiffres, `_ : . @ / -`, maximum 196 caractères. Préfixez par la source ou le compte si les banques peuvent réutiliser le même numéro. |
| `label` | Intitulé lisible, obligatoire, maximum 300 caractères. |
| `kind` | `income` = revenu ; `expense` = dépense ; `transfer` = virement entre vos comptes. |
| `amount` | Montant positif ou nul dans la devise source. `1234.50`, `1’234.50` et `1 234,50` sont acceptés. Deux décimales maximum, aucun arrondi implicite. Le sens est défini par `kind`, pas par un signe négatif. |
| `currency` | Code à trois lettres majuscules, par exemple `CHF`, `EUR`, `USD`. Il doit correspondre à la devise du compte source s’il est renseigné. |
| `status` | `planned` = prévu ; `settled` = effectivement reçu/payé ; `unknown` = état inconnu. Une case vide reste `unknown`. |
| `date` | Date `YYYY-MM-DD` valide ; vide = date inconnue. La date d’import ne remplace jamais cette date. |
| `budgetMonth` | Mois `YYYY-MM`, utile si le mois est connu mais le jour ne l’est pas. Vide = mois absent. Une date précise, si renseignée, détermine le mois de l’opération dans les calculs. |
| `accountId` | Identifiant d’un compte existant dans Finance ; vide = compte non renseigné pour un revenu ou une dépense. Cet identifiant est visible dans un export Finance JSON. |
| `destinationAccountId` | Identifiant du compte destinataire d’un virement ; vide pour revenu/dépense. Un virement exige deux comptes existants distincts. |
| `destinationAmount` | Montant réellement reçu dans la devise du compte destinataire. Obligatoire pour un virement entre devises différentes. Dans la même devise, s’il est renseigné, il doit égaler `amount` ; les frais se saisissent séparément. |

Un montant absent est refusé : il n’est jamais transformé en zéro. Un statut inconnu n’est jamais transformé en paiement confirmé. Un compte inconnu doit être créé ou la référence retirée avant de réessayer ; l’import ne crée pas de compte supposé.

## Réimport et confidentialité

Finance transforme `externalId` en identifiant stable `csv:<externalId>` et conserve cette même identité dans la provenance. Réimporter le même fichier via le rapprochement général n’ajoute pas de doublon. Une ligne modifiée avec la même identité est proposée dans les éléments à vérifier ; elle n’écrase pas silencieusement la donnée existante. Un identifiant utilisé deux fois dans un même fichier fait échouer tout l’import et les numéros de ligne sont indiqués.

L’importeur ne persiste aucune donnée lui-même et ne modifie pas le jeu de données déjà ouvert. Il retourne un nouveau jeu validé, avec uniquement les comptes existants nécessaires aux références et les opérations du fichier. L’interface doit ensuite afficher l’aperçu et utiliser `mergeImport`, puis `saveVault` après confirmation de l’import.

Le CSV est un fichier en clair : gardez-le hors du dépôt GitHub et dans un emplacement privé. Finance n’exécute jamais une formule Excel ; les formules sont traitées comme des textes ordinaires dans les libellés et sont refusées dans les montants. Cette garantie concerne l’import dans Finance. Une éventuelle future exportation vers un tableur devra aussi neutraliser les cellules pouvant être interprétées comme formules.

## Vérifications

Les tests `src/importCsv.test.ts` couvrent le BOM, les deux séparateurs, les virgules décimales, les champs multiligne et guillemets, la conservation des inconnues, la précision monétaire, les dates invalides, les identifiants stables et doublons, le réimport sans duplication, les conflits conservés, les références de comptes, les virements entre devises, les fichiers trop volumineux et l’absence d’évaluation des formules. Les exemples de tests et du modèle sont fictifs.
