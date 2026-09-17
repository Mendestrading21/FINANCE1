# Recherche et choix des outils Finance

Consultation : **17 septembre 2026**. Sources consultées : dépôts GitHub et documentations officielles ci-dessous, recherches publiques Reddit et X. Les décisions sont celles du projet Finance1 ; les numéros de version réellement résolus se vérifient dans son lockfile. Une bibliothèque étudiée n’est pas une bibliothèque installée.

## Point de départ constaté

Lors de l’examen initial, Finance1 contenait « Habitudes », un petit projet React 19 / TypeScript 5.7 / Vite 6 / Vitest 3 avec stockage `localStorage`. La réutilisation porte sur le socle web et les outils ; le moteur financier devait être développé. Aucun motif fonctionnel ne justifie de migrer vers Next.js, Angular, Rails ou une plateforme d’hébergement différente.

## Choix cohérent pour l’incrément initial

| Besoin | Retenu | Motif | Limite à suivre |
| --- | --- | --- | --- |
| Interface | React + TypeScript + CSS du projet | Socle déjà présent ; une UI responsive commune aux appareils | Tests de rendu requis ; le code web ne prouve pas un test physique iOS |
| Graphiques | SVG originaux et tableaux lisibles | Quatre familles de graphiques simples, données exactes et faible nombre de dépendances | Axes, légendes et navigation accessible restent à développer/tester explicitement |
| Icônes et logo | SVG originaux homogènes | Pas de dépendance ni chargement externe ; identité Finance spécifique | Monogrammes d’établissements clairement distincts de logos officiels |
| Données | Schéma TypeScript avec validation d’import et calculs communs | Un seul modèle, provenance conservée, idempotence | La qualité de validation se prouve par les cas invalides, pas par les types seuls |
| Coffre | Web Crypto, PBKDF2 SHA-256 600 000 itérations et AES-GCM ; ciphertext dans `localStorage` | Stockage local chiffré sans serveur supplémentaire | Clé mémoire, erreurs/quota et restauration à tester ; pas de cloud automatique |
| Sauvegarde | Export/import JSON chiffré et versionné | Copie récupérable et passage manuel entre appareils | Copies divergentes à rapprocher ; ne pas appeler cela « synchronisation » |
| Calculs et tests | Vitest 4.1.11, TypeScript et fonctions métier partagées | Continuité du projet avec correction de sécurité documentée | Tester des résultats indépendants, pas seulement la structure des fonctions |
| Parcours et captures | Playwright | Vérifier interactions, plusieurs moteurs et dimensions d’écran | Émulation distincte des appareils physiques ; les traces versionnées restent fictives |
| Build | Vite 6.4.3 | Correctif ciblé sans migration de framework | Garder serveur de développement privé et lockfile vérifié |

Ces choix sont adoptés pour le développement. Les fonctions réellement exécutées, leurs tests et leur publication sont consignés séparément dans `STATUS.md`.

## Bibliothèques comparées

Les licences indiquées ont été observées dans les dépôts ou pages officielles. Elles ne valent pas une autorisation générale d’utiliser un logo de marque. Les projets non intégrés restent des candidats ; leur compatibilité doit être validée avec les versions exactes avant tout ajout.

| Outil | Qualité / compatibilité pertinente | Maintenance observée | Licence observée | Décision |
| --- | --- | --- | --- | --- |
| [Recharts](https://github.com/recharts/recharts) | Composants React/SVG pour courbes, barres et anneaux ; `react-is` doit correspondre à la version React | [Releases](https://github.com/recharts/recharts/releases) : stable 3.10.1 affichée, datée du 25 juillet 2026 ; canary plus récente exclue du choix stable | MIT | Candidat si interactions/échelles deviennent complexes ; pas ajouté aux SVG simples initiaux |
| [Lucide](https://lucide.dev/guide/react) | Icônes React cohérentes ; alternative solide aux SVG internes | Documentation React et [dépôt](https://github.com/lucide-icons/lucide) disponibles ; aucune date de dernier commit extraite pendant cette revue | [ISC ; certains pictos hérités de Feather sous MIT](https://lucide.dev/license) | Référence visuelle ; non intégré à ce stade, conserver les notices si adopté |
| [shadcn/ui](https://github.com/shadcn-ui/ui) | Composants personnalisables ; l’adoption change les fichiers de composants et leur maintenance | Dépôt et documentation vivants, non affichés comme archivés ; date de dernier commit non collectée | MIT | Référence pour composition et états ; ne pas importer une collection entière pour quelques formulaires |
| [Radix Primitives](https://github.com/radix-ui/primitives) | Primitives React d’accessibilité ; utile pour dialogues/popovers complexes | Dépôt se présente comme maintenu par WorkOS ; date de dernier commit non collectée | MIT | Candidat ciblé si les composants natifs ne suffisent plus ; vérifier peer dependencies au moment d’intégrer |
| [idb](https://github.com/jakearchibald/idb) | Enveloppe Promise autour d’IndexedDB, sans service distant | Documentation et sources accessibles ; date de dernier commit non collectée | ISC | Candidat pour migration transactionnelle lorsque les reçus ou volumes dépassent le coffre initial |
| [Dexie](https://github.com/dexie/Dexie.js) | Requêtes et migrations IndexedDB plus riches ; davantage d’abstraction que nécessaire au premier lot | Organisation GitHub affichait mise à jour du dépôt le 10 septembre 2026 ; ne pas la confondre avec une date de release | Apache-2.0 | Référence, non retenu pour le premier coffre |
| [dexie-encrypted](https://dexie.org/docs/libs/dexie-encrypted) | Chiffrement transparent, indices conservés interrogeables : le périmètre de confidentialité demande examen | Dépôt de l’organisation affichait une mise à jour le 27 mars 2026 ; aucun audit cryptographique indépendant consulté | MIT affichée par l’organisation GitHub | Non retenu ; préférer les primitives natives avec format documenté et revue ciblée |
| [Zod](https://github.com/colinhacks/zod) | Schémas runtime et types, utile si la surface d’import grandit | Dépôt/documentation consultables ; pas de version figée sans test du projet | MIT | Candidat ; validation locale explicite pour l’incrément actuel |
| [Papa Parse](https://github.com/mholt/PapaParse) | CSV réels, guillemets et erreurs ; plus approprié qu’un simple split pour imports variés | Sources et documentation accessibles ; date de dernier commit non collectée | MIT | Prévu seulement si l’on étend les formats CSV ; ne pas annoncer sa présence |
| [Vitest](https://github.com/vitest-dev/vitest) | Tests TypeScript proches du build Vite ; existant à conserver | Correctif 4.1.11 explicitement documenté ; anciennes majeures 2/3 non corrigées selon l’avis officiel cité ci-dessous | MIT | Retenu, mise à niveau de sécurité justifiée |
| [Playwright](https://github.com/microsoft/playwright) | Chromium, Firefox et WebKit avec une API de tests ; captures et parcours | Dépôt et documentation officiels accessibles ; exécution réelle à consigner dans STATUS | Apache-2.0 | Retenu pour vérification ; versions et navigateurs du lockfile/environnement |

Ne pas confondre présence de tests dans un dépôt avec audit de sécurité de la version installée. Cette comparaison ne contient aucun classement fondé sur des étoiles ou un nombre de commits : ces indicateurs n’établissent ni confidentialité ni fiabilité financière.

## Applications de référence

| Projet | Ce qui est utile à Finance | Maintenance / licence observées | Décision |
| --- | --- | --- | --- |
| [Actual Budget](https://github.com/actualbudget/actual) | Saisie rapide, rapprochement, transferts liés, logique locale et imports ; documentation utile sur les états des opérations | Dépôt actuel non archivé, documentation active ; MIT | Référence fonctionnelle. Ne pas imposer son modèle d’enveloppes ni reprendre tout son moteur |
| [Ghostfolio](https://github.com/ghostfolio/ghostfolio) | Regroupement de positions, comptes et types d’actifs ; comparaison de parcours patrimoine | Dépôt non archivé, stack Angular/NestJS/Prisma ; AGPL-3.0 | Référence de produit, pas de code copié dans Finance1 |
| [Firefly III](https://github.com/firefly-iii/firefly-iii) | Organisation des opérations, transferts et rapprochement ; source d’idées de vérification | Dépôt non archivé, application complète ; AGPL-3.0 | Référence de comportement, pas une dépendance React ni du code à recopier |
| [Maybe](https://github.com/maybe-finance/maybe) | Présentation du patrimoine et navigation, uniquement comme référence historique | Dépôt archivé le 27 juillet 2025 selon sa bannière ; AGPL-3.0 | Non retenu comme base maintenue |

Les fonctionnalités des applications de référence n’appartiennent pas automatiquement à Finance. Leur code n’a pas été importé. La licence copyleft n’interdit pas de regarder un produit ; elle impose une analyse spécifique avant une éventuelle réutilisation de code, qui n’est pas nécessaire ici.

## Sécurité et maintien des versions

- **Vite :** l’avis [GHSA-fx2h-pf6j-xcff](https://github.com/vitejs/vite/security/advisories/GHSA-fx2h-pf6j-xcff), publié le 1er juin 2026, affecte la branche 6 jusqu’à 6.4.2 et cite 6.4.3 comme correctif. Il concerne la lecture de fichiers par un serveur de développement exposé dans les conditions Windows/NTFS décrites par l’auteur. L’avis [GHSA-p9ff-h696-f583](https://github.com/vitejs/vite/security/advisories/GHSA-p9ff-h696-f583), du 6 avril 2026, est corrigé dès 6.4.2. Le choix 6.4.3 résout ces correctifs ciblés sans justifier une migration vers une autre majeure.
- **Vitest :** l’avis [GHSA-82fw-gwwq-j7x9](https://github.com/vitest-dev/vitest/security/advisories/GHSA-82fw-gwwq-j7x9), publié le 18 août 2026, vise `vitest` et `@vitest/mocker` avant 4.1.11 dans les conditions d’exposition indiquées. Il précise que les majeures 2 et 3 ne recevront pas le correctif. La mise à jour vers 4.1.11 est donc retenue ; l’applicabilité de l’exposition ne doit pas être exagérée.
- **Politique du dépôt :** conserver les contrôles existants d’installation et le lockfile. Lors de l’installation du lot, `node-releases` 2.0.56 a été rejeté par la politique de fraîcheur ; la résolution transitive 2.0.55 a été retenue sans assouplir cette politique. Vérifier la résolution effective et le résultat d’audit dans les preuves de livraison.
- **Coffre :** utiliser l’API native [Web Crypto](https://www.w3.org/TR/webcrypto/) et sa [documentation navigateur](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt). L’usage d’AES-GCM ne dispense pas de la revue de gestion des clés, du format, du sel/IV, du verrouillage et de la restauration. Il ne protège pas les données affichées dans une page déverrouillée compromise.

Un audit npm sans alerte ne constitue pas une certification de l’application. Les correctifs des dépendances sont distincts des tests métier et des protections des données.

## Reddit et X : recherche effectuée et limites

Les recherches publiques ont notamment visé `site:reddit.com/r/selfhosted ghostfolio`, `Actual Budget Ghostfolio selfhosted` et `site:x.com actualbudget`, ainsi que des retours sur les dashboards React.

**Reddit :** des résultats indexés évoquaient « Thoughts on Actual (budgeting app)? » (10 juin 2024) et « Best self-hosted portfolio management tool for investments? » (19 septembre 2025). Les liens retournés renvoyaient vers la racine Reddit au lieu d’un fil exploitable ; l’ouverture de la [recherche r/selfhosted](https://www.reddit.com/r/selfhosted/search/?q=actual%20budget%20ghostfolio&restrict_sr=1) n’a pas fourni de contenu exploitable. Les commentaires n’ont donc pas été lus ni utilisés comme preuves. Aucune recommandation n’est présentée comme « approuvée par Reddit ».

**X :** les recherches publiques n’ont pas fourni de publication vérifiable. L’ouverture de [Actual Budget sur X](https://x.com/actualbudget) a retourné **403 Forbidden** et la [recherche publique](https://x.com/search?q=finance%20dashboard%20opensource&src=typed_query) était désactivée dans l’outil. Aucun post ni retour d’expérience X n’est prétendu consulté. Les décisions reposent sur le code existant, les références utilisateur et les sources officielles ci-dessus.

Ces limites ne sont pas remplacées par des citations inventées. Une recherche communautaire complémentaire pourra enrichir les idées sans invalider les vérifications officielles des outils.

## Quand réexaminer un choix

Ajouter une dépendance seulement pour une limite démontrée : requêtes transactionnelles/volume de documents pour IndexedDB, import CSV varié pour un parseur, interactions de graphiques complexes pour Recharts, composants accessibles complexes pour Radix. Avant intégration : vérifier licence, versions maintenues et avis de sécurité actuels, compatibilité React/Node/Vite, taille et dépendances transitives, puis exercer le parcours réellement amélioré.

La synchronisation bancaire/cloud reste à définir selon les établissements, pays, accès, hébergement et coûts réellement disponibles. Ne pas déduire une compatibilité suisse d’une mention commerciale « Europe ». La saisie manuelle et les sauvegardes doivent rester utilisables indépendamment de ces intégrations.
