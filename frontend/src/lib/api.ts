// Client de l'API Fil ACTIV' côté participante (voir docs/contrat-api.md). Chemins relatifs uniquement.
import { participantIdCourant } from "./personas";

export type Energie = "bas" | "varie" | "pret";
export type Temps = 30 | 120 | 240;
export type Lieu = "chez-moi" | "local";
export type Envie = "contact" | "manuel" | "creatif" | "organisation" | "ecrit";
export type Eviter = "groupe" | "telephone" | "ecrans" | "delais";
export type StatutMission = "open" | "yes" | "no" | "done";
export type Meteo = "soleil" | "nuage" | "pluie";
export type FormatRdv = "visio" | "local";

export type Profil = {
  prenom: string;
  energie: Energie;
  temps: Temps;
  lieux: Lieu[];
  envies: Envie[];
  eviter: Eviter[];
  mot: string;
  /** Case « Je m'engage » de l'écran de sensibilisation (facultative). */
  engagement: boolean;
  /** Conditions d'utilisation acceptées en fin d'onboarding. */
  cgu: boolean;
};

export type EtapeFormation = "tronc-commun" | "moderation" | "pair-aidance";

export type Participant = Profil & {
  /** Étapes du chemin de formation validées par Sarah (absent = aucune). */
  formationsValidees?: EtapeFormation[];
  etape: number;
  formatRdv: FormatRdv | null;
  lanceLe: string;
};

export type MissionProposee = {
  id: number;
  titre: string;
  duree: number;
  effort: "léger" | "moyen";
  lieu: Lieu;
  avec: string;
  objectif: string;
  details: [string, string][];
  pourquoi: string[];
  statut: StatutMission;
  // Itérations 9 et 10 (facultatifs côté front : absents = null).
  formation?: { id: EtapeFormation; nom: string; chemin: string } | null;
  recurrence?: Recurrence | null;
  inscriteJusquau?: string | null;
  /** Réponse au rappel de la semaine du prochain créneau (null : pas encore répondu). */
  disponibiliteSemaine?: boolean | null;
  /** Rappel hebdomadaire : semaine ISO et date (AAAA-MM-JJ) du prochain créneau, si inscription en cours. */
  rappel?: { semaine: string; date: string } | null;
};

export type Recurrence = { jour: string; horaire: string };
export type DureeInscription = 1 | 3 | 6;

export type EtatMoi = {
  participant: Participant | null;
  missions: MissionProposee[];
  meteoDeverrouillee: boolean;
};

export class ErreurApi extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ErreurApi";
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** UUID v4 ; `crypto.randomUUID` n'existe qu'en contexte sécurisé (HTTPS ou localhost), d'où le repli. */
export function nouvelUuid(c: Pick<Crypto, "getRandomValues"> & { randomUUID?: () => string } = crypto): string {
  if (typeof c.randomUUID === "function") return c.randomUUID();
  const o = c.getRandomValues(new Uint8Array(16));
  o[6] = (o[6] & 0x0f) | 0x40;
  o[8] = (o[8] & 0x3f) | 0x80;
  const h = Array.from(o, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/**
 * Identifiant de la participante envoyé dans X-Participant. PRD : pas de connexion, on incarne une
 * persona choisie sur l'écran « Qui êtes-vous ? » ; son identifiant est fixe (voir lib/personas.ts).
 */
export function identifiantParticipant(stockage?: Pick<Storage, "getItem"> | null): string {
  const id = participantIdCourant(stockage);
  return UUID.test(id) ? id : nouvelUuid();
}

async function appel<T>(chemin: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const rep = await fetch(chemin, {
    method: init.method ?? "GET",
    headers: {
      "X-Participant": identifiantParticipant(),
      ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  });
  if (!rep.ok) {
    let message = `Erreur ${rep.status}`;
    try {
      const corps = (await rep.json()) as { erreur?: string };
      if (corps.erreur) message = corps.erreur;
    } catch {
      // corps non JSON : on garde le message générique
    }
    throw new ErreurApi(rep.status, message);
  }
  return (await rep.json()) as T;
}

export const api = {
  moi: () => appel<EtatMoi>("/api/v1/moi"),
  /** Recommencer le scénario de test : efface le dossier de la persona incarnée. */
  recommencer: () => appel<EtatMoi>("/api/v1/moi", { method: "DELETE" }),
  enregistrerProfil: (profil: Profil) => appel<EtatMoi>("/api/v1/moi/profil", { method: "PUT", body: profil }),
  changerStatut: (id: number, statut: StatutMission, dureeMois?: DureeInscription) =>
    appel<EtatMoi>(`/api/v1/moi/missions/${id}`, { method: "PUT", body: dureeMois ? { statut, dureeMois } : { statut } }),
  repondreDisponibilite: (id: number, semaine: string, disponible: boolean) =>
    appel<EtatMoi>(`/api/v1/moi/missions/${id}/disponibilite`, { method: "POST", body: { semaine, disponible } }),
  choisirFormat: (format: FormatRdv) => appel<EtatMoi>("/api/v1/moi/format", { method: "PUT", body: { format } }),
  envoyerMeteo: (missionId: number, meteo: Meteo, mot: string) =>
    appel<{ ok: true }>("/api/v1/meteo", { method: "POST", body: { missionId, meteo, ...(mot ? { mot } : {}) } }),
};
