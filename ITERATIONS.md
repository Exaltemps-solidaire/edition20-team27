# Itérations — Fil ACTIV' (L'BURN, squad TDFCFD)

- **Source du plan** : le plan du PRD (`passation/cadrage/7-prd.md`, section « Le plan », 5 étapes), précédé de l'écran « Qui êtes-vous ? » exigé par la section « Les utilisateurs : pas de connexion ». `cadrage/6-plan-de-livraison.md` et `5-hypotheses.md` sont vides (« _Pas encore produit._ ») : les critères d'acceptation reprennent la « valeur mesurée » de chaque étape du PRD.
- **Temps restant annoncé** : ~60 minutes, à la question posée le 2026-11-18 (premier plan).
- **Durée du tour de test PM Lab** : 10 minutes (valeur par défaut).
- **Traçabilité** PRD → spec → ticket → code → tests : `docs/tracabilite.md`. Contrat d'API : `docs/contrat-api.md`.

## ⚠️ Reconstitué après coup

Ce plan a été **remis dans l'ordre a posteriori** (reverse engineering) : l'itération 1 a été codée avant la récupération de la passation, et les itérations 2 à 7 ont été codées **en un seul lot**, en parallèle par trois agents (API, écran BURN'ette, écran chargée de remobilisation), puis intégrées et publiées ensemble. Le budget de 10 minutes de codage par itération **n'a pas été respecté** (environ 45 minutes pour le lot) et il n'y a eu qu'un tour de test au lieu de six. Chaque bilan ci-dessous dit ce qui a été livré et où, pour que les cadreurs testent ticket par ticket.

## Hors périmètre (PRD, « Hors périmètre »)

Création du profil par la chargée (back-office), validation des pitchs et créneaux, formation et habilitation, activités extérieures, communauté et chat, parcours BBA/BIB/Sentinelle, connexion/inscription/mot de passe (remplacés par « Qui êtes-vous ? »).

---

## Itération 1 : le squelette publié avec la maquette cliquable

- **Dans le périmètre** : services `api/` et `frontend/` selon le gabarit, `.env.example`, `DEPLOIEMENT.md`, `podman-compose.yml`, écrans de la maquette v1 (feuille de route, missions, infos, météo).
- **Critères d'acceptation** :
  - Étant donné l'URL publique, quand je l'ouvre, alors la feuille de route s'affiche et `/health`, `/sante` répondent 200.
- **Hypothèse couverte** : aucune (fichier vide).
- **Bilan** : fait, commit `e40928f`, avant la passation. Données en dur, retours météo en mémoire. Tests : 7.

## Itération 2 : on peut dire qui on est, et en changer

- **Dans le périmètre** : écran « Qui êtes-vous ? » au lancement, une persona par rôle du scénario (Camille, BURN'ette en remobilisation ; Sarah, chargée de remobilisation), bouton permanent « Changer de rôle ».
- **Hors périmètre** : authentification, autres personas (directrice d'antenne, bénévole, pair-aidante).
- **Critères d'acceptation** :
  - Étant donné que j'ouvre l'application, quand elle charge, alors je vois « Qui êtes-vous ? » avec Camille et Sarah.
  - Étant donné que je choisis Camille, quand je valide, alors j'arrive sur son parcours ; Sarah, sur l'espace de suivi.
  - Étant donné que je suis dans l'application, quand je clique « Changer de rôle », alors je reviens à « Qui êtes-vous ? ».
- **Bilan** : fait. `frontend/src/lib/personas.ts`, `frontend/src/components/QuiEtesVous.tsx`, `frontend/src/app/page.tsx`, bandeau dans `app/accompagnante/page.tsx`. Ajout : « Recommencer le scénario » (`DELETE /api/v1/moi`) pour que chaque testeur reparte de l'accueil. Tests : `personas.test.ts` (3).

## Itération 3 : accueil, 5 questions, feuille de route à l'étape 1 (PRD, plan 1)

- **Dans le périmètre** : message d'accueil, prénom, 5 questions (énergie, temps, lieux, envies, à éviter), mot libre pour l'accompagnante, « Je reviendrai plus tard », récapitulatif, lancement ; feuille de route à l'étape 1 « Accueil et rencontre » avec le premier rendez-vous ; « Modifier mes réponses ».
- **Critères d'acceptation** (valeur mesurée : le profil de départ est transmis sans échange manuel) :
  - Étant donné Camille à sa première visite, quand elle répond aux 5 questions et lance son parcours, alors elle arrive à l'étape 1 et ses réponses sont enregistrées en base.
  - Étant donné ce lancement, quand Sarah ouvre son espace, alors elle voit le point de départ et le mot de Camille.
  - Étant donné Camille déjà lancée, quand elle revient, alors elle retrouve directement sa feuille de route.
- **Bilan** : fait. API `PUT /api/v1/moi/profil` + Postgres (`api/src/domaine.ts`, `store-pg.ts`), front `components/Onboarding.tsx`, `Parcours.tsx`. Tests : validation du profil (`domaine.test.ts`), parcours onboarding (`FilActiv.test.tsx`).

## Itération 4 : 2 missions adaptées au profil (PRD, plan 2)

- **Critères d'acceptation** (valeur mesurée : un choix sans justification ni relance) :
  - Étant donné un profil lancé, quand Camille ouvre « Mes missions », alors 2 missions compatibles s'affichent avec « Proposée pour toi : … ».
  - Étant donné une mission, quand elle choisit « Je tente » ou « Pas cette semaine », alors le choix est enregistré sans question ni relance, et annulable.
  - Étant donné un changement de réponses, quand elle les met à jour, alors les propositions sont recalculées sans perdre les missions choisies ou faites.
- **Bilan** : fait. `proposerMissions`, `fusionnerMissions` (`api/src/domaine.ts`), `PUT /api/v1/moi/missions/:id`, `components/Missions.tsx`. Tests : filtres, tri, « pourquoi », fusion (`domaine.test.ts`).

## Itération 5 : les détails de mission de l'accompagnante (PRD, plan 3)

- **Critères d'acceptation** (valeur mesurée : toutes les infos pratiques sans email) :
  - Étant donné « Je tente », quand le choix est fait, alors le message de Sarah affiche quand, où, avec qui, rôle, quoi apporter, pause, et le rappel « annuler le jour même n'est pas un échec ».
  - Étant donné une mission datée, quand Camille clique « Ajouter à mon agenda », alors un fichier `.ics` est téléchargé.
- **Bilan** : fait. `components/Missions.tsx`, `lib/ics.ts`. Tests : `ics.test.ts`. ⚠️ Les jours de semaine de la maquette (« jeu. 20 », « mardi 25 nov. ») sont ceux de 2025 : à corriger dans le contenu avec l'équipe.

## Itération 6 : la météo post-mission, signal à la chargée (PRD, plan 4)

- **Critères d'acceptation** (valeur mesurée : la chargée reçoit la météo et ajuste sans échange manuel) :
  - Étant donné aucune mission faite, quand Camille ouvre « Météo », alors l'écran indique qu'elle arrive après la première mission.
  - Étant donné une mission faite, quand elle choisit ☀️ / ⛅ / 🌧️ (+ mot facultatif) et envoie, alors la météo est enregistrée.
  - Étant donné une météo 🌧️, quand Sarah ouvre son espace, alors la participante est signalée « À recontacter ».
- **Bilan** : fait. `POST /api/v1/meteo` (409 si mission pas faite), `components/MeteoEcran.tsx`, `app/accompagnante/page.tsx`, `lib/accompagnante.ts`. Tests : `routes.test.ts`, `accompagnante.test.ts`.

## Itération 7 : le fil d'infos (PRD, plan 5)

- **Critères d'acceptation** (valeur mesurée : une information trouvée sans email ni Facebook) :
  - Étant donné l'onglet « Infos », quand Camille l'ouvre, alors rendez-vous, livret et messages de l'équipe sont au même endroit.
  - Étant donné le message d'accueil de Sarah (étape 1), quand Camille choisit visio ou local, alors son choix est enregistré et visible par Sarah.
- **Bilan** : fait. `components/Infos.tsx`, `components/Livret.tsx`, `PUT /api/v1/moi/format`. Le livret affiche les 5 étapes ; contacts et charte « bientôt ici » (rien d'inventé).

## À venir

- Faire valider ce découpage et les écarts par les cadreurs (tour de test PM Lab).
- Corriger les dates de la maquette (année 2026) avec l'équipe.
- Décider si l'écran de la chargée garde le changement d'étape (hors périmètre du PRD).
- Démo Playwright `e2e/demo.spec.ts` : rejouer le cas passant Camille → Sarah.
