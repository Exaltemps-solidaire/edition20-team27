# Rétro du harnais — équipe 27, 18 novembre 2026

Bilan du harnais, pas du produit. **Fait majeur : la trace `.iterations/trace.jsonl` n'existe pas.** Le code a été écrit par un agent Claude Code tournant sur le poste du builder, qui travaillait sur la VM par SSH, et non par la session Claude de `~/app`. Les hooks (traceur, alarme du budget, vérification avant signal) et les permissions de `.claude/settings.json` n'ont donc jamais été dans la boucle. Les faits ci-dessous viennent de l'historique git, des bilans de `ITERATIONS.md` et des réponses de PM Lab.

## 1. Sur quoi travaille-t-il ? Le contexte
- **A servi** : le PRD (`passation/cadrage/7-prd.md`), une fois lu, a recadré tout le travail. Sa règle « pas de connexion, écran « Qui êtes-vous ? » » a été appliquée, et les noms des trois formations viennent de la passation.
- **A manqué** : la version 1 (`e40928f`, 15 h 59) a été codée **avant** la récupération de la passation, à partir d'une maquette seule. La DoR n'a pas été vérifiée : l'écran « Qui êtes-vous ? » manquait, et `CLE` et `URL_PUBLIQUE` semblaient absentes alors qu'elles étaient dans `/etc/hackathon/env`.

## 2. Comment doit-il travailler ? Règles et procédures
- **A servi** : `/recuperer-passation` et `/planifier-iterations`, lancés par la session de la VM (création de `ITERATIONS.md` à 16 h 17), et le format des itérations, repris pour tout le reste.
- **A manqué** : `/iteration` n'a jamais été utilisé. Les itérations 2 à 7 ont été codées en un seul lot, en parallèle par trois sous-agents, puis **découpées après coup**. Les règles de taille n'ont pas été tenues (un lot de 45 fichiers).

## 3. Que peut-il faire ? Les outils
- **A servi** : `scripts/signaler-version.sh` (versions 2 à 6) et `scripts/verifier-deployabilite.sh`, lancés avant chaque signal, sans aucune borne franchie.
- **A manqué** : Docker est absent (la VM a Podman), et Chromium aussi, donc `npm run demo` était impossible. L'allow-list parle de `docker compose`, qui n'existe pas sur cette machine.

## 4. Que ne peut-il pas faire ? Les habilitations
- **A servi** : rien d'observé côté harnais, puisqu'il était hors de la boucle. Les secrets sont restés hors du dépôt public (`/srv/team27/team27.env`, droits 600), et une revue de sécurité automatique hors harnais a fait refermer par défaut un accès accompagnante resté ouvert.
- **A manqué** : **toutes les bornes vivent dans la session Claude de la VM**. Un agent qui travaille d'ailleurs les contourne sans le vouloir. Les contrôles ont dû être refaits à la main avant chaque signal.

## 5. Quand a-t-il fini ? DoD et budget
- **A servi** : la DoD comme liste de contrôle. Chaque version a eu tests verts, contrat respecté, `/health` et `/sante` à 200 depuis l'URL publique, puis signal à PM Lab.
- **A manqué** : le budget de 10 minutes. Le lot 2-7 a pris environ 45 minutes, les itérations 8 à 16 de 5 à 15 minutes chacune, sans alarme puisque le hook n'était pas dans la boucle. `moteur_avance: false` à chacun des 5 signaux, sans explication côté harnais.

## 6. Que retient-on ? La trace
- **A servi** : les bilans de `ITERATIONS.md` (16 itérations) et `docs/tracabilite.md`, qui relie le PRD aux tickets puis aux tests.
- **A manqué** : la trace automatique, **rien d'observé**. Pas de compte d'actions, de refus ni de dépassements mesurés. Le tour de test a aussi révélé un défaut que seul un humain pouvait voir : deux testeurs incarnant Camille s'écrasaient (corrigé à l'itération 15).

---

- **La règle qui a manqué** : « Les vérifications avant signal vivent dans le script `signaler-version.sh` lui-même, pas seulement dans un hook de l'agent. » C'est une **borne** : elle tient quel que soit l'outil ou l'agent qui signale.
- **La borne de trop** : rien d'observé en pratique, puisque le harnais était hors de la boucle. L'allow-list `docker compose …` aurait gêné sur cette VM Podman sans rien protéger.
- **Ce que le builder emporte** : lire le PRD avant la première ligne de code, et placer les contrôles là où passe le travail réel, pas là où on l'imagine.
