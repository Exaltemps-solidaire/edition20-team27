// Chemin de formation (passation : « la formation se fait en trois temps »). Sarah valide chaque étape.
import type { EtapeFormation } from "./api";

export type EtapeChemin = { id: EtapeFormation; titre: string; detail: string; ouvre: string; option?: boolean };

export const CHEMIN_FORMATION: EtapeChemin[] = [
  {
    id: "tronc-commun",
    titre: "Tronc commun",
    detail: "En vidéo, à ton rythme : psychoéducation et fonctionnement de L'Burn.",
    ouvre: "La base de tout le parcours ACTIV'.",
  },
  {
    id: "moderation",
    titre: "Formation modération",
    detail: "Le cadre pour agir en sécurité, avec les autres.",
    ouvre: "Ouvre les ateliers, les missions et la modération de la communauté.",
  },
  {
    id: "pair-aidance",
    titre: "Pair-aidance",
    detail: "En option, 2 × 3 h.",
    ouvre: "Ouvre les permanences, les groupes de parole et les écoutes.",
    option: true,
  },
];

export type StatutChemin = "done" | "now" | "next";

/** Statut de chaque étape : validée, en cours (la première non validée), à venir. */
export function statutsChemin(validees: readonly EtapeFormation[]): StatutChemin[] {
  let courante = false;
  return CHEMIN_FORMATION.map((e) => {
    if (validees.includes(e.id)) return "done";
    if (!courante) {
      courante = true;
      return "now";
    }
    return "next";
  });
}

/** Ce que la participante peut faire selon ses formations validées (habilitation). */
export function habilitation(validees: readonly EtapeFormation[]): string {
  const base = validees.includes("tronc-commun") && validees.includes("moderation");
  if (base && validees.includes("pair-aidance")) return "Tu es habilitée pour tout le parcours : ateliers, missions, permanences et écoutes.";
  if (base) return "Tu es habilitée pour les ateliers et les missions. La pair-aidance reste ouverte si tu le souhaites.";
  return "Chaque étape validée par Sarah t'ouvre de nouvelles missions.";
}

/** Avancement en pourcentage (étapes validées / étapes du chemin). */
export function avancement(validees: readonly EtapeFormation[]): number {
  return Math.round((CHEMIN_FORMATION.filter((e) => validees.includes(e.id)).length / CHEMIN_FORMATION.length) * 100);
}
