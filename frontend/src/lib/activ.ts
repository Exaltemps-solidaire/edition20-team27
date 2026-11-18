// Données et règles du Fil ACTIV' (côté participante) : fonctions pures, testables sans navigateur.
import type { EtatMoi, Lieu, Meteo, MissionProposee, Participant, Profil, StatutMission, Temps } from "./api";

export type StatutEtape = "done" | "now" | "next";

/** Les 5 étapes du parcours ACTIV' : [titre, description]. */
export const ETAPES: [string, string][] = [
  ["Accueil et rencontre", "Premier rendez-vous avec ton accompagnante et présentation du groupe."],
  ["Faire le point sur mes envies", "Ce qui te ressource, ce que tu veux éviter, ton rythme."],
  ["Se tester en mission", "Des missions courtes, choisies par toi, pour reprendre confiance pas à pas."],
  ["Construire mon projet", "Transformer ce que tu as appris en missions en un projet concret."],
  ["Je m'envole", "La sortie du programme, avec un suivi léger si tu le souhaites."],
];

export const LIBELLES_ETAPE: Record<StatutEtape, string> = {
  done: "Terminé",
  now: "En cours",
  next: "À venir",
};

/** Statut d'affichage de l'étape `i` quand la participante est à l'étape `courante`. */
export function statutEtape(i: number, courante: number): StatutEtape {
  return i < courante ? "done" : i === courante ? "now" : "next";
}

// ---------- Questionnaire ----------

export type CleQuestion = "energie" | "temps" | "lieux" | "envies" | "eviter";

export type Question = {
  k: CleQuestion;
  court: string;
  titre: string;
  aide: string;
  multi?: boolean;
  optionnelle?: boolean;
  options: [string, string][];
};

export const QUESTIONS: Question[] = [
  {
    k: "energie",
    court: "Énergie",
    titre: "Comment est ton énergie en ce moment ?",
    aide: "Il n'y a pas de bonne réponse. C'est juste pour ne pas te proposer trop, trop vite.",
    options: [
      ["bas", "Très basse, j'y vais tout doucement"],
      ["varie", "Ça varie beaucoup selon les jours"],
      ["pret", "Je me sens prête à essayer des choses"],
    ],
  },
  {
    k: "temps",
    court: "Temps / semaine",
    titre: "Combien de temps peux-tu donner par semaine ?",
    aide: "Une estimation. Tu pourras la changer quand tu veux.",
    options: [
      ["30", "Environ 30 minutes"],
      ["120", "1 à 2 heures"],
      ["240", "Une demi-journée"],
    ],
  },
  {
    k: "lieux",
    court: "Où",
    multi: true,
    titre: "Où te sens-tu bien pour une mission ?",
    aide: "Plusieurs choix possibles.",
    options: [
      ["chez-moi", "De chez moi"],
      ["local", "Au local de L'Burn"],
    ],
  },
  {
    k: "envies",
    court: "Envies",
    multi: true,
    optionnelle: true,
    titre: "Qu'est-ce qui te tente ?",
    aide: "Plusieurs choix possibles, ou aucun si tu ne sais pas encore.",
    options: [
      ["contact", "Être avec d'autres personnes"],
      ["manuel", "Faire de mes mains"],
      ["creatif", "Créer, décorer"],
      ["organisation", "Organiser, ranger"],
      ["ecrit", "Écrire, relire"],
    ],
  },
  {
    k: "eviter",
    court: "À éviter",
    multi: true,
    optionnelle: true,
    titre: "Y a-t-il des choses à éviter pour l'instant ?",
    aide: "Sarah en tiendra compte. Tu peux passer cette question.",
    options: [
      ["groupe", "Les groupes, le monde"],
      ["telephone", "Le téléphone"],
      ["ecrans", "Les écrans"],
      ["delais", "Les délais serrés"],
    ],
  },
];

/** Libellé lisible de chaque valeur de réponse ("bas" → "Très basse, …"). */
export const LIBELLES: Record<string, string> = Object.fromEntries(QUESTIONS.flatMap((q) => q.options));

export const LIBELLES_LIEU: Record<Lieu, string> = { "chez-moi": "De chez moi", local: "Au local" };

/** Réponses en cours de saisie : les choix simples sont `null` tant que rien n'est choisi. */
export type Brouillon = {
  prenom: string;
  energie: string | null;
  temps: string | null;
  lieux: string[];
  envies: string[];
  eviter: string[];
  mot: string;
  engagement: boolean;
  cgu: boolean;
};

export const BROUILLON_VIDE: Brouillon = { prenom: "", energie: null, temps: null, lieux: [], envies: [], eviter: [], mot: "", engagement: false, cgu: false };

export function brouillonDepuis(p: Participant | Profil): Brouillon {
  return {
    prenom: p.prenom,
    energie: p.energie,
    temps: String(p.temps),
    lieux: [...p.lieux],
    envies: [...p.envies],
    eviter: [...p.eviter],
    mot: p.mot,
    engagement: p.engagement ?? false,
    cgu: p.cgu ?? false,
  };
}

/** Le prénom saisi est-il acceptable (1 à 40 caractères après trim) ? */
export function prenomValide(prenom: string): boolean {
  const t = prenom.trim();
  return t.length >= 1 && t.length <= 40;
}

/** Peut-on passer à la question suivante ? Les questions optionnelles le permettent toujours. */
export function questionValide(q: Question, b: Brouillon): boolean {
  if (q.optionnelle) return true;
  const v = b[q.k];
  return Array.isArray(v) ? v.length > 0 : v !== null;
}

/** Applique un clic sur une option : bascule pour un choix multiple, remplace pour un choix simple. */
export function choisirOption(b: Brouillon, q: Question, valeur: string): Brouillon {
  const v = b[q.k];
  if (Array.isArray(v)) return { ...b, [q.k]: v.includes(valeur) ? v.filter((x) => x !== valeur) : [...v, valeur] };
  return { ...b, [q.k]: valeur };
}

/** Texte du récapitulatif pour une question. */
export function valeurRecap(q: Question, b: Brouillon): string {
  const v = b[q.k];
  if (Array.isArray(v)) return v.length ? v.map((k) => LIBELLES[k]).join(", ") : "Rien de particulier";
  return v ? LIBELLES[v] : "";
}

/** Convertit le brouillon en `Profil` du contrat, ou `null` s'il est incomplet. */
export function versProfil(b: Brouillon): Profil | null {
  const temps = Number(b.temps);
  if (!prenomValide(b.prenom) || !b.energie || ![30, 120, 240].includes(temps) || b.lieux.length === 0) return null;
  return {
    prenom: b.prenom.trim(),
    energie: b.energie as Profil["energie"],
    temps: temps as Temps,
    lieux: b.lieux as Profil["lieux"],
    envies: b.envies as Profil["envies"],
    eviter: b.eviter as Profil["eviter"],
    mot: b.mot.trim().slice(0, 500),
    engagement: b.engagement,
    cgu: b.cgu,
  };
}

// ---------- Missions ----------

/** Durée lisible : 30 → "30 min", 60 → "1 h", 90 → "1 h 30". */
export function dureeLisible(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const reste = minutes % 60;
  return `${Math.floor(minutes / 60)} h${reste ? ` ${reste}` : ""}`;
}

/** Nombre de missions encore à choisir cette semaine. */
export function missionsAChoisir(missions: MissionProposee[]): number {
  return missions.filter((m) => m.statut === "open").length;
}

/** Copie de l'état où la mission `id` a le statut donné (mise à jour optimiste). */
export function avecStatut(etat: EtatMoi, id: number, statut: StatutMission): EtatMoi {
  const missions = etat.missions.map((m) => (m.id === id ? { ...m, statut } : m));
  return { ...etat, missions, meteoDeverrouillee: etat.meteoDeverrouillee || missions.some((m) => m.statut === "done") };
}

/** Mission sur laquelle porte la météo : celle choisie si elle est faite, sinon la dernière faite. */
export function missionPourMeteo(missions: MissionProposee[], choisie: number | null): MissionProposee | null {
  const faites = missions.filter((m) => m.statut === "done");
  return faites.find((m) => m.id === choisie) ?? faites.at(-1) ?? null;
}

const PREMIER_RDV = "Sarah a reçu tes réponses. Premier rendez-vous : mardi 25 nov., 10 h, au local ou en visio.";

/** Texte du bandeau « Tu es ici ». */
export function texteHero(etape: number, restantes: number): string {
  const choix =
    restantes > 0
      ? `${restantes} mission${restantes > 1 ? "s" : ""} à choisir cette semaine. Tu décides.`
      : "Tes choix de la semaine sont faits. Bravo d'avoir choisi pour toi.";
  if (etape === 0) return restantes > 0 ? `${PREMIER_RDV} ${choix}` : PREMIER_RDV;
  return choix;
}

export const MESSAGES_METEO: Record<Meteo, string> = {
  soleil: "Super ! Sarah verra que cette mission t'a fait du bien.",
  nuage: "Merci pour ton honnêteté. Sarah en tiendra compte pour la suite.",
  pluie: "Merci de l'avoir dit. Sarah va te recontacter pour alléger le rythme, sans aucune pression.",
};
