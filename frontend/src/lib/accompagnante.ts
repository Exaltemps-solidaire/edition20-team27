// Espace accompagnante : types du contrat, libellés, tri, comptage et client fetch.
// Fonctions pures (hors client fetch), testables sans navigateur.

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
};

export type Participant = Profil & {
  etape: number;
  formatRdv: FormatRdv | null;
  lanceLe: string;
};

export type RetourMeteo = { missionId: number; titreMission: string; meteo: Meteo; mot: string; recuLe: string };

export type SuiviParticipant = Participant & {
  id: string;
  missions: { id: number; titre: string; statut: StatutMission }[];
  retours: RetourMeteo[];
};

// Les 5 étapes du parcours (index 0..4 côté API).
export const ETAPES_PARCOURS = [
  "Accueil et rencontre",
  "Faire le point sur mes envies",
  "Se tester en mission",
  "Construire mon projet",
  "Je m'envole",
] as const;

// Libellés repris du questionnaire de la maquette (constante Q).
export const LIBELLES_ENERGIE: Record<Energie, string> = {
  bas: "Très basse, j'y vais tout doucement",
  varie: "Ça varie beaucoup selon les jours",
  pret: "Je me sens prête à essayer des choses",
};
export const LIBELLES_TEMPS: Record<Temps, string> = {
  30: "Environ 30 minutes",
  120: "1 à 2 heures",
  240: "Une demi-journée",
};
export const LIBELLES_LIEU: Record<Lieu, string> = {
  "chez-moi": "De chez moi",
  local: "Au local de L'Burn",
};
export const LIBELLES_ENVIE: Record<Envie, string> = {
  contact: "Être avec d'autres personnes",
  manuel: "Faire de mes mains",
  creatif: "Créer, décorer",
  organisation: "Organiser, ranger",
  ecrit: "Écrire, relire",
};
export const LIBELLES_EVITER: Record<Eviter, string> = {
  groupe: "Les groupes, le monde",
  telephone: "Le téléphone",
  ecrans: "Les écrans",
  delais: "Les délais serrés",
};
export const LIBELLES_STATUT: Record<StatutMission, string> = {
  open: "À choisir",
  yes: "Choisie",
  no: "Pas cette semaine",
  done: "Faite",
};
export const LIBELLES_METEO: Record<Meteo, string> = {
  soleil: "Ça m'a fait du bien",
  nuage: "Mitigé",
  pluie: "C'était trop",
};
export const LIBELLES_FORMAT: Record<FormatRdv, string> = {
  visio: "En visio",
  local: "Au local",
};

/** Libellé lisible d'une valeur, ou la valeur brute si elle est inconnue (API plus récente que le front). */
export function libelle<K extends string | number>(table: Record<K, string>, valeur: K): string {
  return table[valeur] ?? String(valeur);
}

export function libelleEtape(etape: number): string {
  return ETAPES_PARCOURS[etape] ?? `Étape ${etape + 1}`;
}

/** Un retour « pluie » est « récent » s'il a moins de 14 jours : au-delà, Sarah l'a sans doute déjà traité. */
export const JOURS_RETOUR_RECENT = 14;
const MS_JOUR = 24 * 60 * 60 * 1000;

export function estPluieRecente(retour: RetourMeteo, maintenant: Date = new Date()): boolean {
  if (retour.meteo !== "pluie") return false;
  const recu = Date.parse(retour.recuLe);
  if (Number.isNaN(recu)) return false;
  return maintenant.getTime() - recu <= JOURS_RETOUR_RECENT * MS_JOUR;
}

export function pluiesRecentes(p: SuiviParticipant, maintenant: Date = new Date()): number {
  return p.retours.filter((r) => estPluieRecente(r, maintenant)).length;
}

export function compterPluiesRecentes(liste: SuiviParticipant[], maintenant: Date = new Date()): number {
  return liste.reduce((total, p) => total + pluiesRecentes(p, maintenant), 0);
}

/** Celles qui ont un retour « pluie » récent d'abord, puis la plus récemment lancée d'abord. Ne modifie pas la liste. */
export function trierParticipants(liste: SuiviParticipant[], maintenant: Date = new Date()): SuiviParticipant[] {
  return [...liste].sort((a, b) => {
    const urgenceA = pluiesRecentes(a, maintenant) > 0 ? 1 : 0;
    const urgenceB = pluiesRecentes(b, maintenant) > 0 ? 1 : 0;
    if (urgenceA !== urgenceB) return urgenceB - urgenceA;
    return (Date.parse(b.lanceLe) || 0) - (Date.parse(a.lanceLe) || 0);
  });
}

/** « aujourd'hui », « hier », « il y a 3 jours », puis date fr-FR au-delà d'une semaine. */
export function formaterDate(iso: string, maintenant: Date = new Date()): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "date inconnue";
  const debutJour = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const jours = Math.round((debutJour(maintenant) - debutJour(date)) / MS_JOUR);
  if (jours === 0) return "aujourd'hui";
  if (jours === 1) return "hier";
  if (jours > 1 && jours < 7) return `il y a ${jours} jours`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

// ---- Client fetch (chemins relatifs, même origine) ----

export const CLE_SESSION_CODE = "filactiv.accompagnante.code";

export type ErreurApi = "code-incorrect" | "non-configure" | "introuvable" | "reseau" | "serveur";

export class ErreurAccompagnante extends Error {
  constructor(public readonly type: ErreurApi, message: string) {
    super(message);
    this.name = "ErreurAccompagnante";
  }
}

export function messageErreur(type: ErreurApi): string {
  switch (type) {
    case "code-incorrect":
      return "Code incorrect.";
    case "non-configure":
      return "L'accès accompagnante n'est pas encore configuré sur le serveur.";
    case "introuvable":
      return "Cette participante est introuvable. Actualise la liste.";
    case "reseau":
      return "Le serveur ne répond pas. Vérifie ta connexion puis réessaie.";
    default:
      return "Une erreur est survenue côté serveur. Réessaie dans un instant.";
  }
}

export function typeErreurHttp(status: number): ErreurApi {
  if (status === 401) return "code-incorrect";
  if (status === 503) return "non-configure";
  if (status === 404) return "introuvable";
  return "serveur";
}

async function appeler<T>(chemin: string, code: string, init: RequestInit = {}): Promise<T> {
  let reponse: Response;
  try {
    reponse = await fetch(chemin, {
      ...init,
      headers: { ...init.headers, Authorization: `Bearer ${code}`, Accept: "application/json" },
      cache: "no-store",
    });
  } catch {
    throw new ErreurAccompagnante("reseau", messageErreur("reseau"));
  }
  if (!reponse.ok) {
    const type = typeErreurHttp(reponse.status);
    throw new ErreurAccompagnante(type, messageErreur(type));
  }
  return (await reponse.json()) as T;
}

export function chargerParticipants(code: string): Promise<SuiviParticipant[]> {
  return appeler<SuiviParticipant[]>("/api/v1/accompagnante/participants", code);
}

export function changerEtape(code: string, id: string, etape: number): Promise<{ ok: true }> {
  return appeler<{ ok: true }>(`/api/v1/accompagnante/participants/${encodeURIComponent(id)}/etape`, code, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ etape }),
  });
}
