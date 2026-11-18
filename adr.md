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
