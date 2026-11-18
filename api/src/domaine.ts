// Logique métier de Fil ACTIV' en fonctions pures (voir docs/contrat-api.md) : catalogue des
// missions, validation des corps, règle de proposition, fusion quand le profil change.

export const ENERGIES = ["bas", "varie", "pret"] as const;
export const TEMPS = [30, 120, 240] as const;
export const LIEUX = ["chez-moi", "local"] as const;
export const ENVIES = ["contact", "manuel", "creatif", "organisation", "ecrit"] as const;
export const EVITER = ["groupe", "telephone", "ecrans", "delais"] as const;
export const STATUTS = ["open", "yes", "no", "done"] as const;
export const METEOS = ["soleil", "nuage", "pluie"] as const;
export const FORMATS = ["visio", "local"] as const;
/** Chemin de formation (passation) : tronc commun, modération, pair-aidance (option). */
export const ETAPES_FORMATION = ["tronc-commun", "moderation", "pair-aidance"] as const;
export type EtapeFormation = (typeof ETAPES_FORMATION)[number];

export type Energie = (typeof ENERGIES)[number];
export type Temps = (typeof TEMPS)[number];
export type Lieu = (typeof LIEUX)[number];
export type Envie = (typeof ENVIES)[number];
export type Eviter = (typeof EVITER)[number];
export type StatutMission = (typeof STATUTS)[number];
export type Meteo = (typeof METEOS)[number];
export type FormatRdv = (typeof FORMATS)[number];

export type Profil = {
  prenom: string;
  energie: Energie;
  temps: Temps;
  lieux: Lieu[];
  envies: Envie[];
  eviter: Eviter[];
  mot: string;
  /** Case « Je m'engage » de l'écran de sensibilisation (facultative, sans pression). */
  engagement: boolean;
  /** Conditions d'utilisation acceptées à la fin de l'onboarding. */
  cgu: boolean;
};

export type Participant = Profil & {
  etape: number;
  formatRdv: FormatRdv | null;
  lanceLe: string;
  /** Étapes du chemin de formation validées par la chargée de remobilisation. */
  formationsValidees: EtapeFormation[];
};

/**
 * Mission telle que stockée pour une participante (le reste vient du catalogue).
 * Itération 10 : `inscriteJusquau` (mission récurrente acceptée pour une durée) et `disponibilites`
 * (réponse au rappel hebdomadaire, par semaine ISO « AAAA-Www »), tous deux facultatifs.
 */
export type MissionStockee = {
  id: number;
  statut: StatutMission;
  pourquoi: string[];
  inscriteJusquau?: string | null;
  disponibilites?: Record<string, boolean>;
};

/** Formation préalable à une mission : une étape du chemin de formation (ETAPES_FORMATION). */
export type Formation = { id: EtapeFormation; nom: string; chemin: string };
const PAIR_AIDANCE: Formation = {
  id: "pair-aidance", nom: "Pair-aidance", chemin: "Suis-la dans ton chemin de formation, onglet Parcours. Sarah valide chaque étape.",
};
export type Recurrence = { jour: string; horaire: string };
/** Rappel hebdomadaire d'une mission récurrente : semaine ISO concernée et date (AAAA-MM-JJ) du prochain créneau. */
export type Rappel = { semaine: string; date: string };
export const DUREES_INSCRIPTION = [1, 3, 6] as const;

/** Ce que le store garde pour une participante. Les missions sont dans l'ordre d'affichage. */
export type Dossier = { id: string; participant: Participant; missions: MissionStockee[] };

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
  formation: Formation | null;
  /** Itération 16 : vrai tant que la formation requise n'est pas validée par Sarah. */
  verrouillee: boolean;
  recurrence: Recurrence | null;
  inscriteJusquau: string | null;
  /** Réponse au rappel pour la semaine du prochain créneau (null : pas encore répondu). */
  disponibiliteSemaine: boolean | null;
  /** Rappel à afficher : mission récurrente acceptée et inscription en cours, sinon null. */
  rappel: Rappel | null;
};

export type EtatMoi = { participant: Participant | null; missions: MissionProposee[]; meteoDeverrouillee: boolean };

export type RetourMeteo = { missionId: number; meteo: Meteo; mot: string; recuLe: string };

export type SuiviParticipant = Participant & {
  id: string;
  missions: {
    id: number; titre: string; statut: StatutMission;
    recurrence: Recurrence | null; inscriteJusquau: string | null; disponibiliteSemaine: boolean | null;
  }[];
  retours: { missionId: number; titreMission: string; meteo: Meteo; mot: string; recuLe: string }[];
  charge: Charge;
};

/** Charge hebdomadaire d'une participante, comparée au temps qu'elle a dit pouvoir donner. */
export type Charge = { minutesEngagees: number; minutesDisponibles: number; surEngagement: boolean; finEngagement: string };

type MissionCatalogue = Omit<
  MissionProposee,
  "pourquoi" | "statut" | "formation" | "verrouillee" | "recurrence" | "inscriteJusquau" | "disponibiliteSemaine" | "rappel"
> & { tags: string[]; formation?: Formation; recurrence?: Recurrence };

export const PRENOM_MAX = 40;
export const MOT_MAX = 500;
export const ETAPE_MAX = 4;

// Libellés repris de la maquette (constantes LIEU et Q), utilisés en minuscules dans `pourquoi`.
const LIBELLE_LIEU: Record<Lieu, string> = { "chez-moi": "De chez moi", local: "Au local" };
const LIBELLE_ENVIE: Record<Envie, string> = {
  contact: "Être avec d'autres personnes",
  manuel: "Faire de mes mains",
  creatif: "Créer, décorer",
  organisation: "Organiser, ranger",
  ecrit: "Écrire, relire",
};

// Catalogue fixe : constante POOL de la maquette, textes repris tels quels.
export const CATALOGUE: readonly MissionCatalogue[] = [
  {
    id: 1, titre: "Accueillir les nouvelles à l'atelier du jeudi", duree: 90, effort: "léger", lieu: "local", avec: "En binôme",
    tags: ["contact"], objectif: "Reprendre confiance dans le contact. Tu es avec Léa, qui l'a déjà fait.",
    details: [["Quand", "Jeudi 20 nov., 13 h 45 → 15 h 15"], ["Où", "Au local, salle du rez-de-chaussée"], ["Avec qui", "Léa t'attend à l'entrée, elle te montre tout"], ["Ton rôle", "Dire bonjour, proposer un café, montrer où s'installer"], ["À apporter", "Rien, juste toi"], ["Pause", "Tu peux sortir quand tu veux, la cuisine est au calme"]],
  },
  {
    id: 2, titre: "Relire l'affiche du prochain événement", duree: 30, effort: "léger", lieu: "chez-moi", avec: "Seule",
    tags: ["ecrit", "ecran", "delai"], objectif: "Remettre un pied dans une tâche concrète, à ton heure.",
    details: [["Quand", "Quand tu veux avant vendredi 18 h"], ["Où", "De chez toi"], ["Le fichier", "Le brouillon de l'affiche est dans le fil d'infos"], ["Ton rôle", "Repérer les fautes et ce qui n'est pas clair"], ["Retour", "Une réponse rapide à Sarah suffit, même 2 lignes"], ["Pause", "Pas de durée imposée : 30 min, c'est une estimation"]],
  },
  {
    id: 3, titre: "Trier les dons de vêtements", duree: 60, effort: "léger", lieu: "local", avec: "En binôme",
    tags: ["manuel", "organisation"], objectif: "Faire quelque chose de concret avec tes mains, sans pression de résultat.",
    details: [["Quand", "Mercredi 26 nov., 10 h → 11 h"], ["Où", "Au local, réserve du fond"], ["Avec qui", "Nadia, bénévole, est là toute la matinée"], ["Ton rôle", "Trier par taille et par saison"], ["À apporter", "Rien, les gants sont fournis"], ["Pause", "Tu arrêtes quand tu veux"]],
  },
  {
    id: 4, titre: "Mettre à jour l'agenda partagé", duree: 45, effort: "léger", lieu: "chez-moi", avec: "Seule",
    tags: ["organisation", "ecran"], objectif: "Reprendre un rythme doux sur une tâche claire et cadrée.",
    details: [["Quand", "Quand tu veux cette semaine"], ["Où", "De chez toi, sur ordinateur ou téléphone"], ["Ton rôle", "Ajouter les 5 dates de décembre que je t'envoie"], ["Aide", "Un tuto de 2 minutes est dans le fil d'infos"], ["Pause", "Rien ne presse, fais-le en plusieurs fois si besoin"]],
  },
  {
    id: 5, titre: "Préparer les décorations de l'atelier", duree: 90, effort: "moyen", lieu: "local", avec: "En petit groupe",
    tags: ["creatif", "manuel", "contact"], objectif: "Retrouver le plaisir de créer avec d'autres.",
    details: [["Quand", "Samedi 29 nov., 14 h → 15 h 30"], ["Où", "Au local, grande salle"], ["Avec qui", "3 autres BURN'ettes et moi"], ["Ton rôle", "Découper, peindre ou accrocher : tu choisis"], ["À apporter", "Des vêtements qui ne craignent rien"], ["Pause", "Un coin calme est prévu à côté"]],
  },
  {
    id: 6, titre: "Écrire un mot d'accueil pour le livret", duree: 30, effort: "léger", lieu: "chez-moi", avec: "Seule",
    tags: ["ecrit", "creatif"], objectif: "Mettre en mots ce que tu aurais aimé entendre en arrivant.",
    details: [["Quand", "Avant fin novembre, sans urgence"], ["Où", "De chez toi, même sur papier"], ["Ton rôle", "Quelques lignes pour les futures BURN'ettes"], ["Envoi", "Une photo de ta feuille suffit"], ["Pause", "Si ça remue trop, tu peux laisser de côté"]],
  },
  // Itérations 9 et 10 : missions tirées des retours métier (textes à valider par l'équipe).
  {
    id: 7, titre: "Tenir la permanence de parole du jeudi matin", duree: 120, effort: "moyen", lieu: "local", avec: "En binôme avec une pair-aidante",
    tags: ["contact"], objectif: "Accueillir et écouter d'autres BURN'ettes, dans un cadre formé et supervisé.",
    formation: PAIR_AIDANCE,
    recurrence: { jour: "jeudi", horaire: "9 h 30 → 11 h 30" },
    details: [["Quand", "Chaque jeudi, 9 h 30 → 11 h 30"], ["Où", "Au local, salle d'écoute"], ["Avec qui", "Une pair-aidante formée, toujours à tes côtés"], ["Ton rôle", "Accueillir, écouter, orienter vers l'équipe"], ["Avant", "La formation pair-aidance"], ["Pause", "Tu peux passer la main à ta binôme à tout moment"]],
  },
  {
    id: 8, titre: "Écoute téléphonique", duree: 60, effort: "moyen", lieu: "chez-moi", avec: "Seule, avec un relais de l'équipe",
    tags: ["contact", "telephone"], objectif: "Offrir une oreille attentive par téléphone, à ton heure.",
    formation: PAIR_AIDANCE,
    details: [["Quand", "Un créneau d'1 h par semaine, que tu choisis"], ["Où", "De chez toi"], ["Avec qui", "Une personne de l'équipe joignable pendant ton créneau"], ["Ton rôle", "Écouter, rassurer, orienter"], ["Avant", "La formation pair-aidance"], ["Pause", "Tu peux raccrocher et passer le relais à l'équipe"]],
  },
];

export const NB_PROPOSITIONS = 2;

export function missionDuCatalogue(id: number): MissionCatalogue | undefined {
  return CATALOGUE.find((m) => m.id === id);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Identifiant de participante (en-tête X-Participant) normalisé en minuscules, ou null si invalide. */
export function lireIdParticipant(valeur: unknown): string | null {
  return typeof valeur === "string" && UUID.test(valeur.trim()) ? valeur.trim().toLowerCase() : null;
}

function dans<T extends string | number>(liste: readonly T[], valeur: unknown): valeur is T {
  return (liste as readonly unknown[]).includes(valeur);
}

/** Valide un tableau de valeurs autorisées (doublons retirés). `undefined` vaut []. */
function lireListe<T extends string>(liste: readonly T[], valeur: unknown): T[] | null {
  if (valeur === undefined) return [];
  if (!Array.isArray(valeur) || !valeur.every((v) => dans(liste, v))) return null;
  return [...new Set(valeur as T[])];
}

/** Valide le corps de PUT /moi/profil. Renvoie le profil nettoyé, ou un message d'erreur. */
export function validerProfil(corps: unknown): Profil | string {
  if (typeof corps !== "object" || corps === null || Array.isArray(corps)) return "corps JSON attendu";
  const c = corps as Record<string, unknown>;
  const prenom = typeof c.prenom === "string" ? c.prenom.trim() : "";
  if (prenom.length < 1 || prenom.length > PRENOM_MAX) return `prenom requis (1 à ${PRENOM_MAX} caractères)`;
  if (!dans(ENERGIES, c.energie)) return "energie doit valoir bas, varie ou pret";
  if (!dans(TEMPS, c.temps)) return "temps doit valoir 30, 120 ou 240";
  const lieux = lireListe(LIEUX, c.lieux);
  if (!lieux || lieux.length === 0) return "lieux : au moins un parmi chez-moi, local";
  const envies = lireListe(ENVIES, c.envies);
  if (!envies) return "envies invalides";
  const eviter = lireListe(EVITER, c.eviter);
  if (!eviter) return "eviter invalide";
  if (c.mot !== undefined && typeof c.mot !== "string") return "mot doit être un texte";
  const mot = ((c.mot as string | undefined) ?? "").trim();
  if (mot.length > MOT_MAX) return `mot limité à ${MOT_MAX} caractères`;
  if (c.engagement !== undefined && typeof c.engagement !== "boolean") return "engagement doit être un booléen";
  if (c.cgu !== undefined && typeof c.cgu !== "boolean") return "cgu doit être un booléen";
  return { prenom, energie: c.energie, temps: c.temps, lieux, envies, eviter, mot, engagement: c.engagement === true, cgu: c.cgu === true };
}

/** Valide le corps de POST /meteo. */
export function validerRetour(corps: unknown): Omit<RetourMeteo, "recuLe"> | string {
  if (typeof corps !== "object" || corps === null) return "corps JSON attendu";
  const { missionId, meteo, mot } = corps as Record<string, unknown>;
  if (!Number.isInteger(missionId) || (missionId as number) <= 0) return "missionId invalide";
  if (!dans(METEOS, meteo)) return "meteo doit valoir soleil, nuage ou pluie";
  if (mot !== undefined && typeof mot !== "string") return "mot doit être un texte";
  const texte = (mot ?? "").trim();
  if (texte.length > MOT_MAX) return `mot limité à ${MOT_MAX} caractères`;
  return { missionId: missionId as number, meteo, mot: texte };
}

/** Règle de proposition : filtres, score par envies, tri, 2 premières, avec leur `pourquoi`. */
export function proposerMissions(profil: Profil): { id: number; pourquoi: string[] }[] {
  const basse = profil.energie === "bas";
  const eligibles = CATALOGUE.filter((m) => {
    if (!profil.lieux.includes(m.lieu) || m.duree > profil.temps) return false;
    if (basse && (m.effort !== "léger" || m.duree > 60)) return false;
    if (profil.eviter.includes("groupe") && m.tags.includes("contact")) return false;
    if (profil.eviter.includes("ecrans") && m.tags.includes("ecran")) return false;
    if (profil.eviter.includes("delais") && m.tags.includes("delai")) return false;
    if (profil.eviter.includes("telephone") && m.tags.includes("telephone")) return false;
    return true;
  });
  const envies = (m: MissionCatalogue) => profil.envies.filter((e) => m.tags.includes(e));
  const triees = eligibles
    .map((m) => ({ m, correspondances: envies(m) }))
    .sort((a, b) => b.correspondances.length - a.correspondances.length || a.m.duree - b.m.duree);
  const retenues = triees.slice(0, NB_PROPOSITIONS);
  // Variété (retour métier, itération 13) : si une mission récurrente est éligible et correspond à au
  // moins une envie, elle prend la 2e place, pour qu'une BURN'ette puisse s'inscrire dans la durée.
  const recurrente = triees.find(({ m, correspondances }) => m.recurrence && correspondances.length > 0);
  if (recurrente && !retenues.includes(recurrente) && retenues.length === NB_PROPOSITIONS) {
    retenues[NB_PROPOSITIONS - 1] = recurrente;
  }
  return retenues
    .map(({ m, correspondances }) => ({
      id: m.id,
      pourquoi: [
        LIBELLE_LIEU[m.lieu].toLowerCase(),
        "tient dans ton temps",
        ...(basse ? ["effort léger"] : []),
        ...correspondances.map((e) => LIBELLE_ENVIE[e].toLowerCase()),
      ],
    }));
}

/**
 * Fusion quand le profil change : `yes`/`done` conservées, `open`/`no` retirées si elles ne sont
 * plus proposées, nouvelles propositions ajoutées à la fin en `open`. Le `pourquoi` des missions
 * encore proposées est recalculé.
 */
export function fusionnerMissions(actuelles: MissionStockee[], propositions: { id: number; pourquoi: string[] }[]): MissionStockee[] {
  const proposees = new Map(propositions.map((p) => [p.id, p.pourquoi]));
  const gardees = actuelles
    .filter((m) => m.statut === "yes" || m.statut === "done" || proposees.has(m.id))
    .map((m) => ({ ...m, pourquoi: proposees.get(m.id) ?? m.pourquoi }));
  const nouvelles = propositions
    .filter((p) => !gardees.some((m) => m.id === p.id))
    .map((p) => ({ id: p.id, statut: "open" as const, pourquoi: p.pourquoi }));
  return [...gardees, ...nouvelles];
}

export function meteoDeverrouillee(missions: MissionStockee[]): boolean {
  return missions.some((m) => m.statut === "done");
}

// --- Itération 10 : missions récurrentes, inscription pour une durée, rappel hebdomadaire ---

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const SEMAINE_ISO = /^\d{4}-W(0[1-9]|[1-4]\d|5[0-3])$/;

/** Semaine ISO 8601 (« AAAA-Www ») d'une date, calculée en UTC. */
export function semaineIso(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  t.setUTCDate(t.getUTCDate() + 4 - (t.getUTCDay() || 7)); // le jeudi de la même semaine porte l'année ISO
  const annee = t.getUTCFullYear();
  const numero = Math.ceil(((t.getTime() - Date.UTC(annee, 0, 1)) / 86_400_000 + 1) / 7);
  return `${annee}-W${String(numero).padStart(2, "0")}`;
}

export function semaineValide(valeur: unknown): valeur is string {
  return typeof valeur === "string" && SEMAINE_ISO.test(valeur);
}

/** Fin d'inscription à une mission récurrente : maintenant + N mois (date ISO). */
export function finInscription(maintenant: Date, mois: number): string {
  const d = new Date(maintenant.getTime());
  d.setUTCMonth(d.getUTCMonth() + mois);
  return d.toISOString();
}

/** Prochaine occurrence (aujourd'hui compris) d'un jour de la semaine, à minuit UTC ; null si jour inconnu. */
export function prochainJour(jour: string, maintenant: Date): Date | null {
  const cible = JOURS.indexOf(jour);
  if (cible < 0) return null;
  const ecart = (cible - maintenant.getUTCDay() + 7) % 7;
  return new Date(Date.UTC(maintenant.getUTCFullYear(), maintenant.getUTCMonth(), maintenant.getUTCDate() + ecart));
}

/** Inscription en cours : mission acceptée (`yes`) et date de fin pas encore passée. */
export function inscriptionEnCours(m: MissionStockee, maintenant: Date): boolean {
  return m.statut === "yes" && !!m.inscriteJusquau && new Date(m.inscriteJusquau).getTime() > maintenant.getTime();
}

/** Rappel hebdomadaire d'une mission récurrente et réponse déjà donnée pour sa semaine. */
function rappelDe(m: MissionStockee, recurrence: Recurrence | undefined, maintenant: Date) {
  const prochain = recurrence ? prochainJour(recurrence.jour, maintenant) : null;
  if (!prochain || !inscriptionEnCours(m, maintenant)) return { rappel: null, disponibiliteSemaine: null };
  const semaine = semaineIso(prochain);
  return { rappel: { semaine, date: prochain.toISOString().slice(0, 10) }, disponibiliteSemaine: m.disponibilites?.[semaine] ?? null };
}

/** La formation débloque la mission : verrouillée tant que l'étape requise n'est pas validée. */
export function missionVerrouillee(formation: { id: string } | null | undefined, validees: readonly string[] | undefined): boolean {
  return !!formation && !(validees ?? []).includes(formation.id);
}

export function etatMoi(dossier: Dossier | null, maintenant: Date = new Date()): EtatMoi {
  if (!dossier) return { participant: null, missions: [], meteoDeverrouillee: false };
  const missions = dossier.missions.flatMap((m) => {
    const c = missionDuCatalogue(m.id);
    if (!c) return [];
    const mission: MissionProposee = {
      id: c.id, titre: c.titre, duree: c.duree, effort: c.effort, lieu: c.lieu, avec: c.avec, objectif: c.objectif,
      details: c.details.map(([a, b]) => [a, b]), pourquoi: m.pourquoi, statut: m.statut,
      formation: c.formation ? { ...c.formation } : null,
      verrouillee: missionVerrouillee(c.formation, dossier.participant.formationsValidees),
      recurrence: c.recurrence ? { ...c.recurrence } : null,
      inscriteJusquau: m.inscriteJusquau ?? null,
      ...rappelDe(m, c.recurrence, maintenant),
    };
    return [mission];
  });
  return { participant: dossier.participant, missions, meteoDeverrouillee: meteoDeverrouillee(dossier.missions) };
}

/**
 * Minutes engagées par semaine : missions choisies (`yes`) pas encore faites ; une mission récurrente
 * ne compte que tant que son inscription court. Fin d'engagement : lancement + 1 an (« un an au plus »).
 */
export function charge(dossier: Dossier, maintenant: Date): Charge {
  const minutesEngagees = dossier.missions.reduce((total, m) => {
    const c = missionDuCatalogue(m.id);
    if (!c || m.statut !== "yes") return total;
    if (c.recurrence && !inscriptionEnCours(m, maintenant)) return total;
    return total + c.duree;
  }, 0);
  const minutesDisponibles = dossier.participant.temps;
  const fin = new Date(dossier.participant.lanceLe);
  fin.setUTCFullYear(fin.getUTCFullYear() + 1);
  return {
    minutesEngagees,
    minutesDisponibles,
    surEngagement: minutesEngagees > minutesDisponibles,
    finEngagement: Number.isNaN(fin.getTime()) ? "" : fin.toISOString(),
  };
}

export function suiviParticipant(dossier: Dossier, retours: RetourMeteo[], maintenant: Date = new Date()): SuiviParticipant {
  return {
    ...dossier.participant,
    id: dossier.id,
    missions: dossier.missions.map((m) => {
      const c = missionDuCatalogue(m.id);
      return {
        id: m.id, titre: c?.titre ?? "", statut: m.statut,
        recurrence: c?.recurrence ? { ...c.recurrence } : null,
        inscriteJusquau: m.inscriteJusquau ?? null,
        disponibiliteSemaine: rappelDe(m, c?.recurrence, maintenant).disponibiliteSemaine,
      };
    }),
    retours: [...retours]
      .sort((a, b) => b.recuLe.localeCompare(a.recuLe))
      .map((r) => ({ missionId: r.missionId, titreMission: missionDuCatalogue(r.missionId)?.titre ?? "", meteo: r.meteo, mot: r.mot, recuLe: r.recuLe })),
    charge: charge(dossier, maintenant),
  };
}
