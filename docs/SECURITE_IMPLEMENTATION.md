# Coffre privé Finance — implémentation

Le module `src/vault.ts` expose les fonctions utilisées par l’application : création, ouverture, sauvegarde, export et restauration. La donnée métier est validée par `validateData` à chaque écriture et après chaque déchiffrement. Aucune donnée financière réelle n’est incluse dans ce document ni dans les tests.

## Chiffrement et format

- Web Crypto natif dans un contexte sécurisé HTTPS ou localhost.
- PBKDF2 avec SHA-256, 600 000 itérations à la création ; seules 600 000 à 1 000 000 itérations entières sont acceptées à l’import. Ce plafond empêche qu’un fichier impose une dérivation arbitrairement coûteuse.
- Sel de 16 octets aléatoires par coffre ; AES-GCM 256 bits avec nonce aléatoire de 12 octets renouvelé pour chaque sauvegarde et étiquette d’authentification de 128 bits.
- La métadonnée de format, version, dérivation et chiffrement est authentifiée en données associées. L’enveloppe JSON ne contient que cette métadonnée et le contenu chiffré encodé en base64 canonique.
- La clé AES est non extractible. Elle reste en mémoire ; une `WeakMap` lui associe le sel, le nombre d’itérations et la dernière version chiffrée observée. Ni clé ni phrase secrète ne sont écrites dans le stockage.
- Une phrase d’au moins 12 caractères Unicode est exigée à la création ; maximum 1 024 unités UTF-16 pour limiter les entrées anormales. Une longue phrase unique reste nécessaire : le fichier chiffré permet des tentatives hors ligne.
- Les tableaux d’octets temporaires du mot de passe et du texte déchiffré sont remis à zéro. JavaScript ne garantit pas l’effacement des chaînes ou objets en mémoire ; la confidentialité après fermeture dépend aussi du navigateur et de l’appareil.

## Persistance et restauration

Une seule valeur `finance.vault.v1` est enregistrée dans `localStorage`. Elle contient exclusivement l’enveloppe chiffrée. Aucun export clair ni fichier temporaire n’est créé par ce module.

Une sauvegarde vérifie les données, chiffre entièrement, puis appelle une seule fois `setItem`. La garantie atomique de Web Storage conserve la valeur précédente lorsque l’écriture échoue, notamment sur dépassement de quota. Le module ne supprime jamais la valeur précédente avant l’écriture. Le quota réel du navigateur est souvent inférieur à la limite de fichier : une pièce jointe trop volumineuse peut être refusée proprement.

Une restauration valide l’enveloppe, dérive la clé, authentifie le chiffré, décode le JSON et valide le schéma métier avant de remplacer le coffre. Une mauvaise phrase, une altération ou une donnée métier invalide n’écrit rien. L’application demande explicitement à l’utilisateur de confirmer le remplacement d’un coffre présent.

Le fichier complet est limité à 25 000 000 octets. Le texte clair est borné pour que son encodage chiffré/base64 respecte cette limite. Les clés JSON, la version, l’algorithme, les itérations, les tailles du sel et du nonce, le contenu base64 et la taille du chiffré sont vérifiés avant la dérivation.

Une session conserve l’enveloppe qu’elle a ouverte et refuse une écriture si la valeur locale a changé. Ce contrôle détecte un onglet ou une restauration ayant remplacé le coffre ; l’utilisateur doit rouvrir la version récente. Si Web Locks est disponible, la comparaison et l’écriture sont effectuées sous un verrou exclusif partagé par les onglets Finance de la même origine. Sans Web Locks, le contrôle reste optimiste : éviter les éditions simultanées dans plusieurs onglets. Ce mécanisme ne synchronise pas plusieurs appareils. Une création ne remplace jamais un coffre existant.

## Limites et obligations d’intégration

- Le chiffrement protège les données persistées et les sauvegardes ; il ne protège pas une session ouverte contre un script malveillant exécuté dans la même origine, une extension hostile ou un appareil compromis.
- Une clé non extractible peut encore être utilisée par un script de la même origine tant que la session est ouverte. CSP, absence de scripts externes superflus, dépendances vérifiées et nettoyage des entrées restent nécessaires.
- Le verrouillage doit retirer les références aux données et à la clé de l’état de l’application. Il ne garantit pas un effacement physique de la mémoire du navigateur.
- La suppression des données du navigateur supprime le coffre local. Il n’existe ni récupération de phrase secrète ni synchronisation automatique. Exporter une sauvegarde chiffrée et vérifier sa restauration sur un autre appareil.
- Un import Finance JSON et un export JSON de l’application sont des fichiers en clair ; l’interface doit l’indiquer. Ils ne doivent jamais être commis, servis publiquement ou journalisés.
- Les reçus stockés dans le modèle métier sont inclus dans le même contenu chiffré. Les aperçus déchiffrés doivent être créés en mémoire puis révoqués à la fermeture.
- Aucun accès bancaire, secret Notion, serveur de synchronisation ou service tiers n’est fourni par le coffre.

## Vérifications

`src/vault.test.ts` utilise le vrai moteur Web Crypto du runtime Node et un stockage mémoire simulant Web Storage. Les cas couvrent chiffrement/ouverture/restauration, clé non extractible, nonce renouvelé, phrase incorrecte, altération, rejet des fichiers malformés ou surdimensionnés avant dérivation, quota épuisé avec nouvelle tentative, validation métier, session ancienne et stockage inaccessible. Les données de test sont entièrement fictives. L’exécution effective et ses résultats sont consignés dans l’état d’avancement global du projet ; ce document ne constitue pas à lui seul une preuve d’exécution.
