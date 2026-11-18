# Déploiement

Deux services, construits en images et lancés avec Podman sur la VM de l'équipe.

| Service | Port VM | Rôle |
|---|---|---|
| `frontend` | 8080 | Export statique Next.js servi par nginx |
| `api` | 8081 | API Node : `/health`, `/sante`, `POST /api/v1/meteo` |

La passerelle publique envoie `/api/*` sur 8081 et le reste sur 8080. Le front appelle l'API en chemin relatif.

## Construire et lancer

```bash
podman build -t localhost:5000/team27/api:dev api
podman build -t localhost:5000/team27/frontend:dev frontend
podman push localhost:5000/team27/api:dev
podman push localhost:5000/team27/frontend:dev
APP=team27 podman compose -f podman-compose.yml -p team27 up -d --force-recreate
```

## Vérifier

```bash
curl -s localhost:8080/health && curl -s localhost:8081/health
```

## Variables

Aucune variable obligatoire pour l'instant (voir `.env.example`). Les retours météo sont gardés en mémoire dans l'API : ils sont perdus au redémarrage du conteneur.
