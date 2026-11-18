#!/usr/bin/env bash
# Construit, publie et relance les deux services de team27 sur la VM.
# Les secrets sont lus dans /srv/team27/team27.env (hors dépôt, droits 600) :
#   DB_PASSWORD=...
#   ACCOMPAGNANTE_CODE=...
set -euo pipefail
cd "$(dirname "$0")/.."

SECRETS=${SECRETS:-/srv/team27/team27.env}
[ -f "$SECRETS" ] || { echo "Fichier de secrets introuvable : $SECRETS" >&2; exit 1; }
set -a; . "$SECRETS"; set +a

podman build -t localhost:5000/team27/api:dev api
podman build -t localhost:5000/team27/frontend:dev frontend
podman push localhost:5000/team27/api:dev
podman push localhost:5000/team27/frontend:dev
APP=team27 podman compose -f podman-compose.yml -p team27 up -d --force-recreate

for i in $(seq 1 20); do
  curl -sf localhost:8081/health >/dev/null && curl -sf localhost:8080/health >/dev/null && { echo "Déployé : front et API répondent."; exit 0; }
  sleep 1
done
echo "Les services ne répondent pas : podman logs team27_api_1" >&2
exit 1
