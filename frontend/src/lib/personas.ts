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

/** Identifiant de la BURN'ette incarnée (Camille par défaut). */
export function participantIdCourant(stockage?: Pick<Storage, "getItem"> | null): string {
  const p = lirePersona(stockage);
  return p?.participantId ?? PERSONAS[0].participantId!;
}

function sansErreur<T>(f: () => T): T | null {
  try {
    return f();
  } catch {
    return null; // stockage indisponible (navigation privée stricte, rendu statique)
  }
}
