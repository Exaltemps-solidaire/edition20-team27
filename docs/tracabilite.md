# Traçabilité : du PRD au code

Chaîne suivie, dans l'ordre : **PRD** (`passation/cadrage/7-prd.md`, validé par le Maestro) → **spec** (écrans de `passation/cadrage/3-solution.md` + maquette, contrat `docs/contrat-api.md`) → **tickets** (les itérations de `ITERATIONS.md`) → **code et tests** → **version publiée**.

La passation n'est pas commitée (documents de l'association) : on cite ses sections, on ne la recopie pas.

## Exigences du PRD

| # | Exigence du PRD (section) | Spec | Ticket | Code | Tests |
|---|---|---|---|---|---|
| R1 | Pas de connexion : écran « Qui êtes-vous ? », une persona par rôle, bouton pour changer (« Les utilisateurs : pas de connexion ») | contrat-api « Identité » | It. 2 | `frontend/src/components/QuiEtesVous.tsx`, `frontend/src/lib/personas.ts` | `personas.test.ts` |
| R2 | Message d'accueil, 5 questions courtes, mot libre, « plus tard » (Plan 1, scénario 1-2) | maquette v2 onboarding ; `PUT /api/v1/moi/profil` | It. 3 | `frontend/src/components/` (onboarding), `api/src/domaine.ts` `validerProfil` | `domaine.test.ts` |
| R3 | Réponses transmises à la chargée, seule à les voir ; arrivée à l'étape 1 « Accueil et rencontre » avec le premier RDV (Plan 1, scénario 3) | `GET /api/v1/accompagnante/participants` | It. 3 | `api/src/routes.ts`, `frontend/src/app/accompagnante/` | `routes.test.ts` |
| R4 | 2 missions compatibles avec le profil, avec « Proposée pour toi : … » ; « Je tente » / « Pas cette semaine » sans justification ni relance (Plan 2, scénario 4) | contrat-api « Propositions de missions » | It. 4 | `api/src/domaine.ts` `proposerMissions`, `fusionnerMissions` | `domaine.test.ts` |
| R5 | Détails de l'accompagnante après « Je tente » : quand, où, avec qui, rôle, quoi apporter, pause, annulation sans échec (Plan 3, scénario 5) | `MissionProposee.details` | It. 5 | composant carte mission | — (affichage pur) |
| R6 | Météo en un clic ☀️ / ⛅ / 🌧️ + mot optionnel ; si 🌧️, signal à la chargée (Plan 4, scénario 6) | `POST /api/v1/meteo` ; écran accompagnante « À recontacter » | It. 6 | `api/src/routes.ts`, `frontend/src/lib/accompagnante.ts` | `routes.test.ts`, `accompagnante.test.ts` |
| R7 | Fil d'infos : rendez-vous, documents, messages de l'équipe au même endroit (Plan 5, scénario 7) | maquette v2 « Le fil d'infos » ; `PUT /api/v1/moi/format` | It. 7 | composants infos, `frontend/src/lib/ics.ts` | `ics.test.ts` |

## Règles de l'association respectées

| Règle (PRD « Les règles de l'association ») | Comment |
|---|---|
| L'engagement est un choix ; pause et sortie libres | « Pas cette semaine » et « Annuler » sans justification ; aucun compteur d'objectif |
| Les ACTIV' sont fragiles aussi | Missions filtrées par énergie et temps ; météo 🌧️ mise en avant pour la chargée |
| Chaque écran propose un petit pas | Une question par écran, un choix par carte |
| Les données de santé ne se stockent pas | On ne stocke que les réponses du point de départ, les choix de missions et la météo ; aucun diagnostic. ⚠️ Le mot libre peut en contenir : à valider avec l'association |

## Hors périmètre (PRD) et écarts assumés

- Création du profil par la chargée (back-office), formation/habilitation, activités extérieures, communauté/chat, BBA/BIB/Sentinelle : **non construits**.
- **Progression entre étapes** : hors périmètre du PRD. L'écran de la chargée permet pourtant de changer l'étape (choix de l'agent, simple `<select>`). ⚠️ À retirer si l'équipe veut s'en tenir strictement au PRD.
- **Lien SMS** : remplacé par l'écran « Qui êtes-vous ? », comme le PRD le demande pour cette version.
