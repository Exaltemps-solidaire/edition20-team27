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

## Retours métier du 2026-11-18 (version 2 signalée à PM Lab)

- **Temps restant annoncé** : 45 minutes. Une itération = ~10 min de codage + ~5 min de publication + ~10 min de test → **une itération pleine et une courte**, la fin sert à stabiliser le pitch.
- **Progression (retour 9)** : déjà livrée (Sarah valide le passage d'étape depuis son espace) ; ce n'est plus un écart.
- ✂️ **Hors du temps restant** : missions récurrentes (inscription pour une durée + rappel hebdomadaire de disponibilité, retour 5). Il faut un modèle de récurrence, des confirmations par semaine et un écran côté Sarah : bien au-delà de 10 minutes. Première tâche du prochain build.

## Itération 8 : comprendre l'engagement avant de se lancer (retour 2)

- **Dans le périmètre** : un écran entre l'accueil et les 5 questions : le rôle d'ACTIV', ce qu'est l'engagement (respecter les missions choisies ; pause et sortie restent libres), un encart « Je m'engage » à cocher, un encart « Ce que L'BURN t'apporte en retour ». Le choix est enregistré et visible par Sarah.
- **Hors périmètre** : signature, relance, blocage si la case n'est pas cochée (« sans pression »).
- **Critères d'acceptation** :
  - Étant donné l'accueil, quand Camille clique « Commencer », alors elle voit l'écran d'engagement avant la question 1.
  - Étant donné cet écran, quand elle coche « Je m'engage » (ou non) et continue, alors son choix est enregistré avec son point de départ.
  - Étant donné ce lancement, quand Sarah ouvre son espace, alors elle voit si Camille s'est engagée.
- **Codage estimé** : 10 minutes. **Fichiers prévus** : `components/Onboarding.tsx`, `lib/activ.ts`, `api/src/domaine.ts`, `api/src/store-pg.ts`, `app/accompagnante/page.tsx`.
- **Tests prévus** : validation du profil avec `engagement` (API), brouillon → profil (front).
- **Bilan** : fait, codé en parallèle des itérations 9-10 (sous-agent). **Revu sur retour de l'équipe (17 h 08)** : la sensibilisation devient 4 étapes dans l'onboarding (le rôle d'ACTIV' ; la formation en trois temps ; s'engager : un an au plus, pause et sortie libres ; la réciprocité), puis le récapitulatif porte la case « Je m'engage » (facultative) et la case **« J'accepte les conditions d'utilisation »** (obligatoire pour lancer), avec les conditions lisibles sur place. Contenus tirés de la passation, sauf la réciprocité et les conditions, marquées « à valider avec l'association ». API : champ `engagement` du profil (`domaine.ts`), colonne `participants.engagement` (`store-pg.ts`, `ALTER TABLE … IF NOT EXISTS`). Espace de Sarah : ligne « Engagement ». Tests : `domaine.test.ts` (validation, absent = false), `FilActiv.test.tsx` (parcours avec la case cochée).

## Itération 9 : une formation préalable signalée sur la fiche mission (retour 5)

- **Dans le périmètre** : un champ « formation requise » sur les missions du catalogue ; la fiche affiche « Formation requise avant de commencer : … » et le chemin pour y accéder. Deux missions exemples tirées du retour : « Tenir la permanence de parole du jeudi matin » et « Écoute téléphonique ».
- **Critères d'acceptation** :
  - Étant donné une mission qui exige une formation, quand elle est proposée, alors sa fiche affiche la formation et le chemin pour la suivre.
  - Étant donné « éviter le téléphone », quand les missions sont calculées, alors l'écoute téléphonique n'est jamais proposée.
- **Codage estimé** : 5 minutes. **Fichiers prévus** : `api/src/domaine.ts`, `components/Missions.tsx`, `lib/api.ts`.
- **Tests prévus** : proposition avec et sans « éviter le téléphone ».
- **Bilan** : _à remplir._

## Itération 11 : le chemin de formation, validé petit à petit (retour équipe, 17 h 08)

- **Dans le périmètre** : dans « Ma feuille de route », « Mon chemin de formation » avec les trois temps de la passation (tronc commun en vidéo ; formation modération, qui ouvre ateliers, missions et modération ; pair-aidance en option, qui ouvre permanences, groupes de parole et écoutes), une barre d'avancement et ce que l'habilitation ouvre. Sarah valide chaque étape depuis son espace.
- **Critères d'acceptation** :
  - Étant donné une BURN'ette lancée, quand elle ouvre son parcours, alors elle voit son chemin de formation et sa prochaine étape.
  - Étant donné l'espace de Sarah, quand elle coche « Tronc commun », alors l'étape passe « Validée par Sarah » chez la BURN'ette.
- **Bilan** : fait. `PUT /api/v1/accompagnante/participants/:id/formations`, colonne `participants.formations_validees` ; `lib/formation.ts`, `components/CheminFormation.tsx`, cases dans `app/accompagnante/page.tsx`. Tests : `formation.test.ts`, `routes.test.ts`. Le PRD mettait ce suivi hors périmètre : l'équipe l'a réintégré.

## Itération 12 : la direction artistique de L'Burn (effet « waouh » du pitch)

- **Bilan** : fait par un sous-agent, en parallèle. Palette relevée sur lesburn-ettes.com (rouge `#dc3129`, saumon, rose poudré, crème), titres en Archivo Black, texte en Libre Franklin, boutons en pilule. Rouge assombri en `#c42b24` pour le texte (contraste AA) ; couleur de soutien prune ajoutée (absente du site). Seulement des valeurs CSS, aucune classe renommée.

## Itération 13 : la permanence du jeudi apparaît dans les propositions

- **Constat** : avec la règle « score puis durée », la permanence (120 min) n'arrivait jamais dans les 2 propositions, donc la récurrence n'était pas démontrable.
- **Critère d'acceptation** : étant donné une BURN'ette au local, avec du temps, une énergie qui n'est pas basse et l'envie « être avec d'autres personnes », quand ses missions sont calculées, alors la permanence du jeudi fait partie des 2 propositions.
- **Bilan** : fait. Règle de variété dans `proposerMissions` (`api/src/domaine.ts`) : une mission récurrente éligible qui correspond à une envie prend la 2e place ; jamais en énergie basse (effort moyen exclu). Tests : `domaine.test.ts` (variété), attentes mises à jour dans `routes.test.ts`. ⚠️ Règle choisie pour la démo, à valider avec l'équipe.

## À venir

- Missions récurrentes : inscription pour une durée (ex. 6 mois) et rappel hebdomadaire de disponibilité.
- Sarah ajuste les missions d'une BURN'ette (retour 9).
- Faire valider ce découpage et les écarts par les cadreurs (tour de test PM Lab).
- Corriger les dates de la maquette (année 2026) avec l'équipe.
- Décider si l'écran de la chargée garde le changement d'étape (hors périmètre du PRD).
- Démo Playwright `e2e/demo.spec.ts` : rejouer le cas passant Camille → Sarah.
