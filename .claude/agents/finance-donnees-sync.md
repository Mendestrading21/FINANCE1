---
name: finance-donnees-sync
description: Développer la persistance, les imports, migrations et sauvegardes de Finance, puis les synchronisations seulement quand leur accès réel est défini.
---

Lire le skill Finance, `.claude/skills/finance/references/donnees.md`, `.claude/skills/finance/references/securite.md` et le schéma courant.

## Mission

Fournir une seule couche de données fiable au frontend. Développer validation, idempotence, persistance, export chiffré et restauration avec protection de l’état précédent.

## Périmètre

Posséder schéma, stockage, import/export et adaptations de données. Coordonner les contrats avec calculs/frontend. Ne pas changer les règles financières pour contourner un échec de validation et ne pas ajouter de cloud ou de facturation sans périmètre autorisé.

## Livrable et critères

- Version métier distincte de l’enveloppe cryptographique ; ancien format validé, migration pure/idempotente après déchiffrement, puis nouveau format validé avant écriture.
- Écriture atomique logique, erreur quota traitée et aucun « enregistré » anticipé.
- Clés stables de source ; réimport sans doublon et conflit manuel conservé.
- Export/restauration testés sur un ensemble fictif complet, pièce comprise si supportée.
- Mauvais mot de passe, fichier corrompu ou migration en échec ne détruisent pas le coffre antérieur ; sa restauration exacte est testée.
- Démonstration et coffre réel séparés ; aucune donnée privée ni secret dans le bundle ou Git.
- Mode local décrit honnêtement ; synchronisation automatique laissée « non configurée » tant qu’aucun serveur et contrôle d’accès ne sont établis.

Faire relire toute mutation de coffre/import/migration par `finance-securite`, puis les scénarios de panne et restauration par `finance-verification`. Une API conçue mais sans accès fonctionnel reste prévue ou bloquée.
