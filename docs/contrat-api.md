# Contrat API — Fil ACTIV' v2

Toutes les routes métier sont sous `/api/v1`, en JSON, appelées en **chemin relatif** par le front (même origine). Les erreurs renvoient `{ "erreur": "<message en français>" }`.

## Identité : l'écran « Qui êtes-vous ? » (PRD, « Les utilisateurs : pas de connexion »)

Pas de connexion, de compte ni de mot de passe. Au lancement, le front affiche « Qui êtes-vous ? » et on choisit la persona qu'on incarne, une par rôle du scénario :

| Persona | Rôle | Identifiant (UUID fixe) |
|---|---|---|
| Camille | La BURN'ette en remobilisation | `c0a1e000-0000-4000-8000-000000000001` |
| Sarah | La chargée de remobilisation | — (écran accompagnante) |

Le choix est gardé dans `localStorage` (`filactiv.persona`) ; un bouton en haut de l'écran permet d'en changer à tout moment. Côté BURN'ette, l'identifiant est envoyé dans l'en-tête **`X-Participant: <uuid>`** sur toutes les routes `/api/v1/moi*` et `/api/v1/meteo`. En-tête absent ou pas un UUID → `400`.

## Types

```ts
type Energie = "bas" | "varie" | "pret";
type Temps = 30 | 120 | 240;                 // minutes par semaine
type Lieu = "chez-moi" | "local";
type Envie = "contact" | "manuel" | "creatif" | "organisation" | "ecrit";
type Eviter = "groupe" | "telephone" | "ecrans" | "delais";
type StatutMission = "open" | "yes" | "no" | "done";
type Meteo = "soleil" | "nuage" | "pluie";
type FormatRdv = "visio" | "local";

type Profil = {
  prenom: string;          // 1 à 40 caractères après trim
  energie: Energie;
  temps: Temps;
  lieux: Lieu[];           // au moins 1
  envies: Envie[];         // 0 ou plus
  eviter: Eviter[];        // 0 ou plus
  mot: string;             // 0 à 500 caractères, pour Sarah
};

type Participant = Profil & {
  etape: number;           // 0..4, index dans les 5 étapes du parcours ; 0 au lancement, avancée par Sarah
  formatRdv: FormatRdv | null;
  lanceLe: string;         // ISO
};

type MissionProposee = {
  id: number;
  titre: string;
  duree: number;           // minutes
  effort: "léger" | "moyen";
  lieu: Lieu;
  avec: string;            // "En binôme", "Seule", "En petit groupe"
  objectif: string;
  details: [string, string][];
  pourquoi: string[];      // ex. ["au local", "tient dans ton temps", "effort léger", "être avec d'autres personnes"]
  statut: StatutMission;
};

type EtatMoi = {
  participant: Participant | null;   // null tant que le questionnaire n'est pas lancé
  missions: MissionProposee[];       // [] si participant null
  meteoDeverrouillee: boolean;       // true dès qu'au moins une mission est "done"
};
```

## Routes de la participante (en-tête `X-Participant` obligatoire)

| Méthode | Route | Corps | Réponse |
|---|---|---|---|
| GET | `/api/v1/moi` | — | `200 EtatMoi` |
| DELETE | `/api/v1/moi` | — | `200 EtatMoi` vide : recommence le scénario de test (efface dossier, missions, retours) |
| PUT | `/api/v1/moi/profil` | `Profil` | `200 EtatMoi` (crée ou met à jour, recalcule les propositions) ; `400` si invalide |
| PUT | `/api/v1/moi/missions/:id` | `{ statut: StatutMission }` | `200 EtatMoi` ; `404` si la mission n'est pas dans sa liste ; `409` si pas encore lancé |
| PUT | `/api/v1/moi/format` | `{ format: FormatRdv }` | `200 EtatMoi` ; `409` si pas encore lancé |
| POST | `/api/v1/meteo` | `{ missionId: number, meteo: Meteo, mot?: string }` | `201 { ok: true }` ; `400` si invalide ; `409` si la mission n'est pas `done` pour cette participante |

### Propositions de missions (règle métier)

Catalogue fixe de 6 missions (ids 1 à 6, textes de la maquette). Une mission est **éligible** si :
- son lieu est dans `lieux` ;
- sa durée ≤ `temps` ;
- si `energie = "bas"` : effort `léger` **et** durée ≤ 60 ;
- si `eviter` contient `groupe` : pas de tag `contact` ; `ecrans` : pas de tag `ecran` ; `delais` : pas de tag `delai`.

Score = nombre de tags dans `envies`. Tri : score décroissant, puis durée croissante. On propose les **2 premières**.
`pourquoi` = [lieu en minuscules, "tient dans ton temps", ("effort léger" si énergie basse), libellés des envies correspondantes en minuscules].

Quand le profil change : les missions `yes` ou `done` sont **conservées** ; les `open`/`no` qui ne sont plus proposées sont retirées ; les nouvelles proposées sont ajoutées en `open`.

## Routes de l'accompagnante

**Fermé par défaut** : en-tête `Authorization: Bearer <code>` exigé, le code étant `ACCOMPAGNANTE_CODE` (variable d'env, jamais dans le dépôt) ; code absent côté serveur → `503`, code faux → `401`.
Pour la version de test du PRD (« pas de connexion »), la variable **`ACCOMPAGNANTE_ACCES_LIBRE=1`** ouvre ces routes sans en-tête. Elle n'est posée que sur la VM de démo, avec des données d'exemple.

| Méthode | Route | Corps | Réponse |
|---|---|---|---|
| GET | `/api/v1/accompagnante/participants` | — | `200 SuiviParticipant[]`, la plus récente d'abord |
| PUT | `/api/v1/accompagnante/participants/:id/etape` | `{ etape: 0..4 }` | `200 { ok: true }` ; `404` si inconnue |

```ts
type SuiviParticipant = Participant & {
  id: string;
  missions: { id: number; titre: string; statut: StatutMission }[];
  retours: { missionId: number; titreMission: string; meteo: Meteo; mot: string; recuLe: string }[]; // plus récent d'abord
};
```

## Santé

`GET /health` et `GET /sante` → `200 { status: "ok" }` (inchangé).
