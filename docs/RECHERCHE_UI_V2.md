# Recherche UI et outils — amélioration V2

Revue du 18 septembre 2026. Les métadonnées de maintenance viennent des dépôts GitHub au moment de la revue ; elles peuvent évoluer. Les licences citées décrivent le code ou les icônes, pas automatiquement les marques représentées.

## Applications de référence

| Projet                                                    | Ce qui aide Finance                                                               | État observé                                        | Licence  | Décision                                                                                                             |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------- |
| [Actual Budget](https://github.com/actualbudget/actual)   | Application locale, budget mensuel, récurrences, vitesse et propriété des données | TypeScript, actif le 17 septembre 2026, non archivé | MIT      | Référence principale pour mois/récurrences et simplicité ; ne pas reprendre son modèle sans adaptation au patrimoine |
| [Ghostfolio](https://github.com/ghostfolio/ghostfolio)    | Hiérarchie portefeuille, allocation et patrimoine                                 | TypeScript, actif le 18 septembre 2026, non archivé | AGPL-3.0 | Référence de présentation ; ne pas copier du code dans Finance sans analyser les obligations AGPL                    |
| [Firefly III](https://github.com/firefly-iii/firefly-iii) | Comptes, transactions multidevises, récurrences et import                         | PHP, actif le 18 septembre 2026, non archivé        | AGPL-3.0 | Référence fonctionnelle, pas base technique React                                                                    |
| [Maybe](https://github.com/maybe-finance/maybe)           | Cartes de patrimoine et identité visuelle                                         | Archivé depuis 2025                                 | AGPL-3.0 | Inspiration historique uniquement ; aucune dépendance ni code repris                                                 |

Actual Budget documente une approche locale et centrée sur la confidentialité. Firefly III confirme l’intérêt de séparer comptes, transactions, récurrences et taux. La [comparaison communautaire Reddit consultée](https://www.reddit.com/r/selfhosted/comments/18kihwr/firefly_iii_vs_actual_budget/) oppose surtout richesse fonctionnelle et simplicité d’usage ; elle ne remplace ni les tests ni les sources officielles. Les recherches X n’ont pas fourni de résultat technique suffisamment vérifiable pour choisir un outil.

## Icônes et identités

| Projet                                                                                     | Qualités                                                                     | Licence / limite                                      | Décision                                                                             |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [Lucide](https://github.com/lucide-icons/lucide) / [React](https://lucide.dev/guide/react) | Composants SVG React typés, personnalisables et importables individuellement | ISC ; certains pictogrammes Feather sous MIT          | **Candidat retenu** pour les icônes sémantiques, après mesure du bundle              |
| [Tabler Icons](https://github.com/tabler/tabler-icons)                                     | Très grand catalogue cohérent sur grille 24 px                               | MIT                                                   | Excellent second choix ; ne pas l’installer avec Lucide                              |
| [Fluent UI System Icons](https://github.com/microsoft/fluentui-system-icons)               | Bonne cohérence Windows et nombreuses variantes                              | MIT                                                   | Référence Windows, écartée pour éviter de mélanger les familles                      |
| [Simple Icons](https://github.com/simple-icons/simple-icons)                               | SVG de marques et provenance communautaire                                   | CC0-1.0 ; les droits de marque ne sont pas abandonnés | Source facultative pour une marque vérifiée ; registre local et fallback obligatoire |

Le logo de l’application reste original. Une icône Lucide, Tabler ou une marque existante ne devient pas le logo Finance.

## Composants, cartes et graphiques

| Projet                                                     | Atout                                                               | Coût d’intégration                                                                   | Décision                                                                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| [Radix Primitives](https://github.com/radix-ui/primitives) | Comportements accessibles, non stylés et adoptables progressivement | Dépendances nouvelles et migration de composants interactifs                         | Intégrer uniquement pour un dialogue, menu ou infobulle dont l’implémentation actuelle échoue réellement |
| [shadcn/ui](https://github.com/shadcn-ui/ui)               | Exemples de cartes composables et accessibles                       | Écosystème Tailwind et copie de composants ; changement important pour le CSS actuel | Inspiration de structure seulement, pas de migration générale                                            |
| [Tremor](https://github.com/tremorlabs/tremor)             | Cartes de dashboard et composants analytiques                       | Tailwind et langage visuel plus générique                                            | Inspiration ponctuelle, non retenu comme socle                                                           |
| [Recharts](https://github.com/recharts/recharts)           | Graphiques React/D3, TypeScript, nombreux types                     | Dépendance et travail d’accessibilité ; graphiques actuels déjà légers               | Conserver les SVG internes ; réévaluer seulement pour une interaction impossible à maintenir proprement  |
| [Unovis](https://github.com/f5/unovis)                     | Visualisation modulaire multi-framework                             | Plus large que le besoin actuel                                                      | Non retenu pour la V2                                                                                    |
| [TanStack Table](https://github.com/TanStack/table)        | Tri et tableaux headless robustes                                   | Surdimensionné pour les listes compactes actuelles                                   | Fonctions de tri métier internes ; réévaluer avec de grands volumes et colonnes configurables            |

## Choix pour Finance

1. Conserver React, TypeScript, Vite, CSS et le coffre actuels.
2. Construire la page Abonnements et les tris dans le domaine avant la finition visuelle.
3. Utiliser les cartes compactes et listes avec le CSS existant ; aucun passage à Tailwind.
4. Adopter Lucide React seulement si l’audit de bundle et de licence est satisfaisant ; sinon étendre le composant SVG interne.
5. Garder les graphiques SVG actuels et leur lecture textuelle.
6. Héberger localement toute identité d’établissement et nettoyer les SVG.
7. Mesurer chaque dépendance et supprimer celle qui ne réduit pas un risque ou une dette réelle.

## Vérifications avant intégration

- version exacte résolue et compatibilité React 19 ;
- licence et notices conservées ;
- dépôt non archivé et activité récente ;
- audit du paquet et de ses dépendances transitives ;
- différence de bundle construite ;
- imports statiques et absence de CDN ;
- clavier, lecteur d’écran, contraste et mouvement réduit ;
- capture et test réels du parcours qui justifie l’outil.

Sources officielles complémentaires : [licence Lucide](https://lucide.dev/license), [documentation Radix](https://www.radix-ui.com/primitives/docs/overview/introduction), [guide Recharts](https://recharts.github.io/en-US/guide/), [site Actual Budget](https://actualbudget.org/) et [documentation Firefly III](https://docs.firefly-iii.org/).
