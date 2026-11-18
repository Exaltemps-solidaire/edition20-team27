// Routage de l'API, sans dépendance : une fonction pure, testable sans démarrer de serveur.
// Le proxy d'entrée envoie /api/... à ce service sans retirer le préfixe : les routes métier
// se déclarent donc sous /api/v1/... ; /health et /sante restent à la racine (port 8081).

export type Reponse = { statut: number; corps?: unknown };

const METEOS = ["soleil", "nuage", "pluie"] as const;
export type Meteo = (typeof METEOS)[number];
export type RetourMeteo = { missionId: number; meteo: Meteo; mot: string; recuLe: string };

export const MOT_MAX = 500;
const RETOURS_MAX = 1000;

// Stockage en mémoire (voir adr.md) : perdu au redémarrage du conteneur.
export const retours: RetourMeteo[] = [];

/** Valide le corps d'un retour météo. Renvoie le retour nettoyé, ou un message d'erreur. */
export function validerRetour(corps: unknown): Omit<RetourMeteo, "recuLe"> | string {
  if (typeof corps !== "object" || corps === null) return "corps JSON attendu";
  const { missionId, meteo, mot } = corps as Record<string, unknown>;
  if (!Number.isInteger(missionId) || (missionId as number) <= 0) return "missionId invalide";
  if (typeof meteo !== "string" || !(METEOS as readonly string[]).includes(meteo)) return "meteo doit valoir soleil, nuage ou pluie";
  if (mot !== undefined && typeof mot !== "string") return "mot doit être un texte";
  const texte = (mot ?? "").trim();
  if (texte.length > MOT_MAX) return `mot limité à ${MOT_MAX} caractères`;
  return { missionId: missionId as number, meteo: meteo as Meteo, mot: texte };
}

export function router(methode: string, url: string, corps?: unknown): Reponse {
  const chemin = new URL(url, "http://api").pathname;
  if (methode === "GET" && (chemin === "/health" || chemin === "/sante")) {
    return { statut: 200, corps: { status: "ok" } };
  }
  if (methode === "POST" && chemin === "/api/v1/meteo") {
    const retour = validerRetour(corps);
    if (typeof retour === "string") return { statut: 400, corps: { erreur: retour } };
    if (retours.length >= RETOURS_MAX) retours.shift();
    retours.push({ ...retour, recuLe: new Date().toISOString() });
    return { statut: 201, corps: { ok: true } };
  }
  return { statut: 404 };
}
