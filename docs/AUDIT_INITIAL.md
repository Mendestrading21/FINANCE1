# État réellement constaté — 17 septembre 2026

Dépôt cible vérifié : `Mendestrading21/FINANCE1`, privé, branche `main`, commit de départ `a6303d5ce1182f3f46ce170fa55f5470817ec68e`.

Il contenait un traqueur d’habitudes React/Vite/TypeScript, et non un tableau financier. Aucun modèle de comptes, moteur budgétaire, import Notion, coffre chiffré, backend ou synchronisation n’était présent. Aucune instruction AGENTS/CLAUDE ni skill dans l’arbre initial. Le stockage `habitudes.v1` n’est pas repris ou effacé par Finance.

## Réutilisation

- Conserver React, TypeScript, Vite et les scripts de développement.
- Conserver le prototype et ses tests dans `legacy/habitudes/`, sans l’intégrer au domaine financier.
- Construire un modèle financier et une validation d’import dédiés ; ne pas réutiliser le stockage qui masquait les erreurs d’écriture.
- Mettre à jour les dépendances affectées par des avis officiels vérifiés. Le lockfile initial référençait une dépendance publiée trop récemment pour la politique active ; résolution régénérée avec une version antérieure vérifiée, sans assouplir la politique.

## Références visuelles

Six images fournies, dont deux variantes identiques du tableau vert. Retenir les surfaces noires/graphite, les widgets arrondis, les chiffres nets, une navigation vitrée et une répartition lisible. Adapter les accents au bleu/violet demandé. Aucun montant, logo tiers ou écran boursier de ces images ne sert de donnée réelle. Logo et pictogrammes originaux en SVG ; police système iPhone puis Segoe UI sur Windows.

## Notion

La source active Budget 2026 a été distinguée des copies archivées. Comptes, revenus, factures, mois, abonnements et mouvements de capital sont des ensembles distincts. La page Trading est la correspondance retrouvée du besoin Bourse/Investissement ; une liste de suivi n’est pas une preuve de position détenue. Les identifiants, liens privés, valeurs et extraits sont conservés dans le fichier d’import privé, hors dépôt.

Limites observées : quota des requêtes SQL Notion atteint ; les vues et les lectures de pages accessibles ont servi à compléter l’analyse. La couverture exacte et les anomalies sont documentées dans le rapport privé. Une source liée non accessible reste signalée, sans contenu inventé.

## Capture

`captures/00-existant-habitudes.png` : rendu réel du prototype initial, sans données personnelles. Les captures Finance suivantes utilisent exclusivement la démonstration étiquetée fictive.
