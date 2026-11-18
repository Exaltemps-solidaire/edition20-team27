# Architecture Decision Record (ADR)

Journal des décisions d'architecture prises pendant le hackathon (dépendance nouvelle, stockage, pattern structurant).

Une entrée par décision, ajoutée à la fin, au format :

```
### AAAA-MM-JJ — <titre court>

- **Décision** : ce qui a été choisi
- **Contexte** : le problème à résoudre
- **Alternatives envisagées** : les autres options, et pourquoi elles sont écartées
- **Conséquences** : les compromis acceptés
```

Le fichier est un journal : on ajoute, on ne réécrit pas. Pour revenir sur une décision, une nouvelle entrée le dit explicitement.

---

## Décisions

## 2026-11-18 · Retours météo gardés en mémoire dans l'API

- **Décision** : `POST /api/v1/meteo` valide le retour (mission, météo parmi soleil/nuage/pluie, mot facultatif de 500 caractères au plus) et le garde dans un tableau en mémoire, plafonné à 1000 entrées. Le mot n'est jamais journalisé.
- **Contexte** : première version de la maquette Fil ACTIV' ; il faut que l'envoi marche de bout en bout, la consultation par l'accompagnante viendra après.
- **Alternatives** : Postgres de la plateforme (base `team27`), écarté pour cette itération faute de temps.
- **Conséquences** : les retours sont perdus à chaque redémarrage du conteneur `api` ; passer à Postgres avant d'ajouter l'écran de l'accompagnante.

## 2026-11-18 · Stockage Postgres, identité par en-tête X-Participant, code accompagnante en variable d'env

- **Décision** : l'API passe du tableau en mémoire à Postgres via la dépendance `pg` (tables `participants`, `missions_participant`, `retours_meteo`, créées au démarrage par `CREATE TABLE IF NOT EXISTS`). Le stockage est derrière une interface `Store` (mémoire pour les tests et le développement sans `DB_HOST`, Postgres sinon). La participante est identifiée par un UUID généré par le front et envoyé dans l'en-tête `X-Participant` ; l'accompagnante par `Authorization: Bearer <code>`, le code venant de la variable d'environnement `ACCOMPAGNANTE_CODE` (comparaison en temps constant, 503 s'il n'est pas défini). Revient sur l'entrée « Retours météo gardés en mémoire ».
- **Contexte** : l'écran de l'accompagnante doit lire les profils, missions et retours de toutes les participantes, et ces données doivent survivre aux redémarrages du conteneur.
- **Alternatives** : garder la mémoire (données perdues à chaque déploiement) ; comptes avec mot de passe (trop lourd pour le public visé et pour le temps du hackathon) ; ORM (dépendance plus lourde que `pg` pour trois tables).
- **Conséquences** : une dépendance de production (`pg`) et un `npm ci` dans l'image ; l'UUID dans `localStorage` est la seule clé de la participante (changer de navigateur = nouveau parcours, et quiconque connaît l'UUID lit le dossier) ; un seul code partagé pour l'accompagnante, à faire tourner en changeant la variable d'env. Sans `DB_HOST`, l'API tombe en mémoire avec un avertissement dans les journaux.
