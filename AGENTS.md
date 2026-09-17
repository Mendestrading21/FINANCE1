# Finance1 — instructions communes

Ce dépôt porte **Finance**, l’application personnelle de budget et de patrimoine d’Elio. La demande initiale du 17 septembre 2026 autorise son développement et la publication du code dans Finance1. Les permissions effectives de l’environnement et les protections GitHub restent applicables.

## Entrée

Lire `.claude/skills/finance/SKILL.md`, `docs/STATUS.md` s’il existe et `docs/PLAN.md`, puis les références utiles au lot. `DEMARRER_CLAUDE.md` est le point d’entrée humain. Ne pas appliquer les choix d’un autre dépôt nommé Finances-, Budget ou Vertex.

## Règles non négociables du projet

- Données personnelles, sources Notion brutes, reçus, sauvegardes et secrets hors Git ; fixtures et captures versionnées fictives et identifiées.
- Inconnu distinct de zéro ; ancien distinct d’actuel ; prévu distinct de reçu/payé.
- Transferts internes exclus des revenus/dépenses ; compte d’investissement et positions jamais additionnés deux fois.
- Un modèle et des calculs partagés entre les six pages. Une saisie ne doit pas produire des copies divergentes.
- Noir/graphite, bleu-violet et verre discret ; interface française, lisible sur iPhone/iPad/Windows.
- Conserver React/TypeScript/Vite ; changement de version pour une raison vérifiable, pas une migration d’architecture gratuite. Le lockfile et la politique d’installation font foi.
- Préserver les travaux existants et l’historique. Pas de force-push, désactivation de protections ni nouvelle permission globale.

## Travail en équipe

Les neuf rôles sont définis dans `.claude/agents/`. Le coordinateur peut déléguer des tâches bornées et indépendantes. Attribuer les fichiers avant édition et relire indépendamment calculs, import, migration, chiffrement, sauvegardes et accès. L’auteur ne signe pas sa propre revue.

## Vérifier et terminer

Lire les commandes du `package.json` courant ; respecter le gestionnaire et le lockfile du dépôt. Vérifier typecheck, tests utiles et build, puis les parcours/captures concernés. Ne pas annoncer une commande qui n’a pas été exécutée.

Maintenir `docs/STATUS.md` avec état réel, preuves et prochaine action. Publier le code autorisé après revue et contrôles ; un commit publié ne signifie pas que l’application web est déployée. Un accès manquant se décrit précisément pendant que le travail indépendant continue.
