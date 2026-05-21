# Veille scientifique collaborative

Page personnelle de veille, alimentée automatiquement par un agent. Ce n’est pas un gestionnaire de bibliographie : pour conserver un article, enregistrez-le dans Zotero.

## Objectif

Centraliser les nouveautés utiles pour votre thème (articles, conférences, labos, industrie…) sans passer des heures à fouiller les sources. L’agent prospecte pour vous ; vous triez, notez et gardez ce qui compte ailleurs.

## Fonctionnement

À chaque **run** de veille, l’agent :

- cherche sur une **fenêtre glissante de 6 mois** ;
- s’appuie sur votre **prompt** et vos **pistes de sources** (bases, éditeurs, conférences, journaux, labos, entreprises…) — sans s’y limiter strictement : il garde de l’**autonomie** dans la prospection ;
- met à jour la **base de données**, le **résumé du run** et la liste des **sources scannées** ;
- insère les nouveaux résultats avec une **note par défaut de 5/10** et évite les **doublons** (URL / titre).

Les **notes** (0 à 10) sur les articles déjà présents orientent les prochains runs : ce que vous avez jugé pertinent ou non influence ce que l’agent privilégie ensuite.

Le site (GitHub Pages + Supabase) affiche vos onglets et se met à jour après chaque run.

## Ce qu’il faut faire

1. **Configurer votre onglet** — Rédiger le prompt de veille et ajouter vos pistes de sources, puis sauvegarder.
2. **Parcourir les nouveaux articles** — Les entrées non lues sont marquées **new**.
3. **Marquer comme lu** — Cliquer sur l’icône **new** une fois l’article lu, pour repérer facilement les suivants.
4. **Noter la pertinence** — Ajuster la note (0–10) : cela guide les prochains résultats.
5. **Archiver hors page** — Si un article est pertinent, l’enregistrer dans **Zotero**, puis le **supprimer** de votre page. Même supprimé, il reste en base (note + anti-doublon).
6. **Donner vos retours** — Vos remarques améliorent le système (prompt, sources, qualité des runs).

## Stack (résumé)

- Frontend : HTML / CSS / JavaScript (GitHub Pages)
- Données : Supabase (PostgreSQL, temps réel)

## Déploiement

Site : [https://rastafouille.github.io/](https://rastafouille.github.io/)
