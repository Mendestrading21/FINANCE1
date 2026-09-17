# Démarrer Finance dans Claude ou Codex

Ouvrir le dépôt **Finance1** avec un environnement capable d’exécuter Node et les commandes du projet. Les fichiers d’agents décrivent les missions ; ils ne remplacent pas les outils ni les accès de cet environnement.

Copier cette instruction :

```text
Reprends Finance dans ce dépôt Finance1 depuis son état réel.

Lis AGENTS.md, CLAUDE.md, .claude/skills/finance/SKILL.md,
docs/STATUS.md s’il existe, puis docs/PLAN.md. Inspecte le code, le diff,
les scripts et le lockfile avant de décider quoi modifier.

Mon objectif est une application personnelle de budget et patrimoine sur
iPhone, iPad et Windows, noire/graphite avec accents bleu-violet et verre
discret, organisée en six pages reliées. Applique les références du skill
pour les données, calculs, design, sécurité et livraison.

Utilise les agents spécialisés pour les tâches indépendantes et la revue
des changements sensibles. Attribue les fichiers pour éviter les conflits.
Avance sur les lots autorisés jusqu’à leurs critères réels ; corrige les
causes des problèmes et conserve un état qui permet la reprise.

Vérifie les accès Notion avant de relire Budgets 2026, Bourse /
Investissement et les pages liées. Les données réelles et secrets restent
hors Git. Sans accès, termine le code et les vérifications possibles,
puis indique précisément ce qui empêche le réimport. N’invente aucun solde,
paiement, date, taux ou synchronisation.

Préserve les inconnus, sépare prévu et payé, exclue les transferts des
revenus/dépenses et évite le double compte patrimoine/positions.
Conserve un coffre privé, la saisie manuelle et les sauvegardes fiables.

La publication du code dans Finance1 est autorisée : prépare, relis,
teste, puis publie selon les protections du dépôt, sans force-push ni
contournement de permissions. Ne crée pas de service payant ou de
connexion bancaire. Ne confonds pas publication du code et mise en ligne
de l’application : vérifie une cible d’hébergement avant un déploiement.

À chaque étape majeure, produis une capture réelle de la démonstration
fictive sur les formats utiles. Termine par les résultats réellement
testés, la publication vérifiée, les limites et la prochaine action.
```

Le mode local conserve les données dans le navigateur choisi. Pour passer d’un appareil à l’autre, utiliser une sauvegarde chiffrée exportée puis restaurée. La synchronisation automatique doit être développée et configurée avant de pouvoir être annoncée.
