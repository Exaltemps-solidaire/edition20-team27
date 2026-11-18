// Libellés des missions récurrentes (itération 10) : rappel hebdomadaire et fin d'inscription.
import type { DureeInscription } from "./api";

export const DUREES_INSCRIPTION: readonly DureeInscription[] = [1, 3, 6];

/** « 19 novembre » pour une date AAAA-MM-JJ ou un instant ISO, lue en UTC comme côté API. */
export function dateLisible(date: string, avecAnnee = false): string {
  const d = new Date(date.length === 10 ? `${date}T00:00:00Z` : date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", ...(avecAnnee ? { year: "numeric" } : {}), timeZone: "UTC" });
}

/** Question du rappel hebdomadaire : « Jeudi 19 novembre : es-tu disponible ? ». */
export function questionRappel(jour: string, date: string): string {
  return `${jour.charAt(0).toUpperCase()}${jour.slice(1)} ${dateLisible(date)} : es-tu disponible ?`;
}

/** Disponibilité de la semaine, vue par Sarah. */
export function libelleDisponibilite(disponible: boolean | null | undefined): string {
  if (disponible === true) return "oui";
  if (disponible === false) return "pas cette semaine";
  return "pas encore répondu";
}
