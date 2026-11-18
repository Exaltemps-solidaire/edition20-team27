// Données et règles du Fil ACTIV' : fonctions pures, testables sans navigateur.

export type StatutEtape = "done" | "now" | "next";
export type Etape = { titre: string; statut: StatutEtape; detail: string };

export type StatutMission = "open" | "yes" | "no" | "done";
export type Mission = {
  id: number;
  titre: string;
  duree: string;
  effort: string;
  mode: string;
  objectif: string;
  statut: StatutMission;
  detailsRecus?: boolean;
  details?: [string, string][];
};

export type Meteo = "soleil" | "nuage" | "pluie";

export const ETAPES: Etape[] = [
  { titre: "Accueil et rencontre", statut: "done", detail: "Premier rendez-vous avec ton accompagnante et présentation du groupe." },
  { titre: "Faire le point sur mes envies", statut: "done", detail: "Ce qui te ressource, ce que tu veux éviter, ton rythme." },
  { titre: "Se tester en mission", statut: "now", detail: "Des missions courtes, choisies par toi, pour reprendre confiance pas à pas." },
  { titre: "Construire mon projet", statut: "next", detail: "Transformer ce que tu as appris en missions en un projet concret." },
  { titre: "Je m'envole", statut: "next", detail: "La sortie du programme, avec un suivi léger si tu le souhaites." },
];

export const LIBELLES_ETAPE: Record<StatutEtape, string> = {
  done: "Terminé",
  now: "En cours",
  next: "À venir",
};

export const MISSIONS_INITIALES: Mission[] = [
  {
    id: 1,
    titre: "Accueillir les nouvelles à l'atelier du jeudi",
    duree: "1 h 30",
    effort: "Effort léger",
    mode: "En binôme",
    objectif: "Reprendre confiance dans le contact. Tu es avec Léa, qui l'a déjà fait.",
    statut: "open",
    details: [
      ["Quand", "Jeudi 20 nov., 13 h 45 → 15 h 15"],
      ["Où", "Au local, salle du rez-de-chaussée"],
      ["Avec qui", "Léa t'attend à l'entrée, elle te montre tout"],
      ["Ton rôle", "Dire bonjour, proposer un café, montrer où s'installer"],
      ["À apporter", "Rien, juste toi"],
      ["Pause", "Tu peux sortir quand tu veux, la cuisine est au calme"],
    ],
  },
  {
    id: 2,
    titre: "Relire l'affiche du prochain événement",
    duree: "30 min",
    effort: "Effort léger",
    mode: "De chez moi",
    objectif: "Remettre un pied dans une tâche concrète, à ton heure.",
    statut: "open",
    details: [
      ["Quand", "Quand tu veux avant vendredi 18 h"],
      ["Où", "De chez toi"],
      ["Le fichier", "Le brouillon de l'affiche est dans le fil d'infos"],
      ["Ton rôle", "Repérer les fautes et ce qui n'est pas clair"],
      ["Retour", "Une réponse rapide à Sarah suffit, même 2 lignes"],
      ["Pause", "Pas de durée imposée : 30 min, c'est une estimation"],
    ],
  },
  {
    id: 3,
    titre: "Tenir le stand café",
    duree: "2 h",
    effort: "Effort moyen",
    mode: "Au local",
    objectif: "Faite lundi.",
    statut: "done",
  },
];

export const MESSAGES_METEO: Record<Meteo, string> = {
  soleil: "Super ! Sarah verra que cette mission t'a fait du bien.",
  nuage: "Merci pour ton honnêteté. Sarah en tiendra compte pour la suite.",
  pluie: "Merci de l'avoir dit. Sarah va te recontacter pour alléger le rythme, sans aucune pression.",
};

/** Renvoie une nouvelle liste où la mission `id` a le statut donné ; les autres sont inchangées. */
export function changerStatut(missions: Mission[], id: number, statut: StatutMission): Mission[] {
  return missions.map((m) => (m.id === id ? { ...m, statut, detailsRecus: statut === "yes" ? m.detailsRecus : false } : m));
}

/** Marque les détails comme reçus, seulement si la mission est toujours choisie. */
export function recevoirDetails(missions: Mission[], id: number): Mission[] {
  return missions.map((m) => (m.id === id && m.statut === "yes" ? { ...m, detailsRecus: true } : m));
}

/** Nombre de missions encore à choisir cette semaine. */
export function missionsAChoisir(missions: Mission[]): number {
  return missions.filter((m) => m.statut === "open").length;
}

/** Texte du bandeau « Tu es ici » selon le nombre de missions restant à choisir. */
export function texteHero(restantes: number): string {
  if (restantes <= 0) return "Tes choix de la semaine sont faits. Bravo d'avoir choisi pour toi.";
  return `${restantes} mission${restantes > 1 ? "s" : ""} à choisir cette semaine. Tu décides.`;
}
