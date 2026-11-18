// Écran « Qui êtes-vous ? » (PRD, « Les utilisateurs : pas de connexion ») : une persona par rôle
// du scénario, avec des données d'exemple. Le choix est gardé dans localStorage.

export type PersonaId = "camille" | "sarah";

export type Persona = {
  id: PersonaId;
  nom: string;
  role: string;
  description: string;
  /** Écran d'arrivée de la persona. */
  chemin: "/" | "/accompagnante";
  /** Identifiant envoyé à l'API dans X-Participant (BURN'ette uniquement). */
  participantId?: string;
};

export const PERSONAS: Persona[] = [
  {
    id: "camille",
    nom: "Camille",
    role: "La BURN'ette en remobilisation",
    description: "Elle vient d'entrer dans ACTIV' : point de départ, missions, météo, fil d'infos.",
    chemin: "/",
    participantId: "c0a1e000-0000-4000-8000-000000000001",
  },
  {
    id: "sarah",
    nom: "Sarah",
    role: "La chargée de remobilisation",
    description: "Elle reçoit les réponses et les météos, et suit les BURN'ettes.",
    chemin: "/accompagnante",
  },
];

export const CLE_PERSONA = "filactiv.persona";

export function personaParId(id: string | null | undefined): Persona | null {
  return PERSONAS.find((p) => p.id === id) ?? null;
}

export function lirePersona(stockage: Pick<Storage, "getItem"> | null = sansErreur(() => localStorage)): Persona | null {
  return personaParId(sansErreur(() => stockage?.getItem(CLE_PERSONA)));
}

export function ecrirePersona(id: PersonaId | null, stockage: Pick<Storage, "setItem" | "removeItem"> | null = sansErreur(() => localStorage)) {
  sansErreur(() => (id ? stockage?.setItem(CLE_PERSONA, id) : stockage?.removeItem(CLE_PERSONA)));
}

export const CLE_PARTICIPANT = "filactiv.participant";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Identifiant de la BURN'ette incarnée. Une par appareil : plusieurs testeurs peuvent incarner
 * Camille en même temps sans s'écraser (constat du tour de test : une Camille partagée se faisait
 * écraser). Créé au premier passage et gardé dans localStorage ; repli sur l'identifiant fixe.
 */
export function participantIdCourant(
  stockage: Pick<Storage, "getItem" | "setItem"> | null = sansErreur(() => localStorage),
  nouvelId: () => string = uuidAleatoire,
): string {
  const existant = sansErreur(() => stockage?.getItem(CLE_PARTICIPANT));
  if (existant && UUID.test(existant)) return existant;
  const id = sansErreur(nouvelId);
  if (!id || !UUID.test(id)) return PERSONAS[0].participantId!;
  sansErreur(() => stockage?.setItem(CLE_PARTICIPANT, id));
  return id;
}

/** UUID v4 ; `crypto.randomUUID` n'existe qu'en contexte sécurisé, d'où le repli. */
function uuidAleatoire(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const o = crypto.getRandomValues(new Uint8Array(16));
  o[6] = (o[6] & 0x0f) | 0x40;
  o[8] = (o[8] & 0x3f) | 0x80;
  const h = Array.from(o, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function sansErreur<T>(f: () => T): T | null {
  try {
    return f();
  } catch {
    return null; // stockage indisponible (navigation privée stricte, rendu statique)
  }
}
