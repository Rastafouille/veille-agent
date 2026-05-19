# 📚 Veille Scientifique Collaborative

Plateforme collaborative de veille scientifique et technologique hébergée sur GitHub Pages.

## 🚀 Fonctionnalités

* 📰 Veille scientifique et presse
* 🤖 Onglets thématiques

  * Robotique d’investigation nucléaire
  * Mesure nucléaire
  * Numérique
* ⭐ Vote collaboratif sur les articles
* 🗑 Suppression d’articles non pertinents
* 🔑 Gestion collaborative des mots-clés
* 🔄 Synchronisation temps réel via Supabase
* 📅 Tri chronologique des publications
* 🌐 Sources scientifiques et industrielles

---

## 🏗 Architecture

```txt
GitHub Pages
    ↓
Frontend HTML / CSS / JS
    ↓
Supabase (PostgreSQL + Realtime)
```

---

## ⚙️ Stack technique

* HTML / CSS / JavaScript
* GitHub Pages
* Supabase
* PostgreSQL
* Realtime API


---

## 🗄 Base de données

### Table `articles`

| Champ        | Description        |
| ------------ | ------------------ |
| title        | Titre article      |
| category     | Domaine de veille  |
| type         | science / presse   |
| description  | Résumé             |
| link         | URL source         |
| stars        | Votes utilisateurs |
| hidden       | Article masqué     |
| published_at | Date publication   |

---

### Table `keywords`

| Champ    | Description |
| -------- | ----------- |
| category | Domaine     |
| keyword  | Mot-clé     |

---

## 🌐 Sources surveillées

* arXiv
* IEEE Xplore
* ScienceDirect
* HAL
* PubMed
* IAEA
* UKAEA
* World Nuclear News
* TechCrunch
* ScienceDaily

---

## 🤖 Intégration Agent Codex

L’agent hebdomadaire :

1. récupère les nouveaux articles
2. filtre via les keywords utilisateurs
3. génère résumés et métadonnées
4. met à jour Supabase
5. le site se met à jour automatiquement

---

## 📡 Déploiement

### GitHub Pages

Le site est servi via :

```txt
https://rastafouille.github.io/
```

---

