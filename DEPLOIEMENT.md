# Déploiement

Deux services, construits en images et lancés avec Podman sur la VM de l'équipe, branchés sur la base Postgres de la plateforme.

| Service | Port VM | Rôle |
|---|---|---|
| `frontend` | 8080 | Export statique Next.js servi par nginx : `/` (participante), `/accompagnante` (Sarah) |
| `api` | 8081 | API Node + Postgres : `/health`, `/sante`, `/api/v1/...` (voir `docs/contrat-api.md`) |

La passerelle publique envoie `/api/*` sur 8081 et le reste sur 8080. Le front appelle l'API en chemin relatif.

## Prérequis (une fois)

1. Plateforme démarrée (voir `/srv/team27/CLAUDE.md`, étape 1).
2. Base créée : `podman exec postgres.internal psql -U postgres -c 'CREATE DATABASE team27;'`. Les tables sont créées par l'API au démarrage.
3. Secrets dans `/srv/team27/team27.env`, **hors du dépôt**, droits `600` :
   ```
   DB_PASSWORD=...
   ACCOMPAGNANTE_CODE=...
   ```
   `ACCOMPAGNANTE_CODE` est le code d'accès de l'écran `/accompagnante`. Le dépôt est public : ce fichier ne doit jamais y entrer.

## Déployer

```bash
./scripts/deployer.sh
```

Le script construit les deux images, les pousse sur le registre local, relance le compose avec les secrets chargés, puis attend que `/health` réponde sur 8080 et 8081.

## Variables de l'API

Voir `.env.example`. Sans `DB_HOST`, l'API garde les données en mémoire (développement local uniquement).
