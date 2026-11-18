import { describe, expect, it } from "vitest";
import {
  charge, etatMoi, finInscription, fusionnerMissions, lireIdParticipant, MOT_MAX, prochainJour, proposerMissions, semaineIso,
  validerProfil, validerRetour,
} from "./domaine.ts";
import type { Dossier, MissionStockee, Profil } from "./domaine.ts";

const base: Profil = { prenom: "Camille", energie: "pret", temps: 120, lieux: ["local", "chez-moi"], envies: [], eviter: [], mot: "", engagement: false, cgu: false };
const ids = (p: Partial<Profil>) => proposerMissions({ ...base, ...p }).map((m) => m.id);

describe("proposerMissions", () => {
  it("trie par envies correspondantes puis par durée et explique pourquoi", () => {
    expect(proposerMissions({ ...base, lieux: ["local"], envies: ["contact"] })).toEqual([
      { id: 1, pourquoi: ["au local", "tient dans ton temps", "être avec d'autres personnes"] },
      { id: 7, pourquoi: ["au local", "tient dans ton temps", "être avec d'autres personnes"] },
    ]);
    expect(ids({ lieux: ["chez-moi"] })).toEqual([2, 6]);
    expect(ids({ lieux: ["chez-moi"], envies: ["organisation"] })).toEqual([4, 2]);
  });

  it("filtre par lieu, temps et énergie basse (léger et 60 min au plus)", () => {
    expect(ids({ temps: 30, lieux: ["local"] })).toEqual([]);
    expect(proposerMissions({ ...base, energie: "bas", temps: 240, lieux: ["local"], envies: ["contact"] })).toEqual([
      { id: 3, pourquoi: ["au local", "tient dans ton temps", "effort léger"] },
    ]);
  });

  it("écarte ce qui est à éviter (groupe, écrans, délais)", () => {
    expect(ids({ lieux: ["local"], envies: ["contact"], eviter: ["groupe"] })).toEqual([3]);
    expect(proposerMissions({ ...base, temps: 30, lieux: ["chez-moi"], envies: ["ecrit"], eviter: ["ecrans"] })).toEqual([
      { id: 6, pourquoi: ["de chez moi", "tient dans ton temps", "écrire, relire"] },
    ]);
    expect(ids({ temps: 30, lieux: ["chez-moi"], envies: ["ecrit"], eviter: ["delais"] })).toEqual([6]);
  });
});

describe("fusionnerMissions", () => {
  it("garde yes/done, retire open/no non proposées, ajoute les nouvelles en open", () => {
    const actuelles: MissionStockee[] = [
      { id: 1, statut: "yes", pourquoi: ["ancien"] },
      { id: 5, statut: "no", pourquoi: ["ancien"] },
      { id: 3, statut: "open", pourquoi: ["ancien"] },
      { id: 4, statut: "done", pourquoi: ["ancien"] },
    ];
    expect(fusionnerMissions(actuelles, [{ id: 3, pourquoi: ["nouveau"] }, { id: 6, pourquoi: ["nouveau"] }])).toEqual([
      { id: 1, statut: "yes", pourquoi: ["ancien"] },
      { id: 3, statut: "open", pourquoi: ["nouveau"] },
      { id: 4, statut: "done", pourquoi: ["ancien"] },
      { id: 6, statut: "open", pourquoi: ["nouveau"] },
    ]);
  });
});

describe("validerProfil", () => {
  it("nettoie un profil valide", () => {
    expect(validerProfil({ ...base, prenom: "  Camille ", lieux: ["local", "local"], mot: " salut " })).toEqual({
      ...base, lieux: ["local"], mot: "salut",
    });
  });

  it("refuse les profils invalides", () => {
    expect(validerProfil(null)).toMatch(/corps/);
    expect(validerProfil({ ...base, prenom: "   " })).toMatch(/prenom/);
    expect(validerProfil({ ...base, prenom: "x".repeat(41) })).toMatch(/prenom/);
    expect(validerProfil({ ...base, energie: "haut" })).toMatch(/energie/);
    expect(validerProfil({ ...base, temps: 60 })).toMatch(/temps/);
    expect(validerProfil({ ...base, lieux: [] })).toMatch(/lieux/);
    expect(validerProfil({ ...base, envies: ["sport"] })).toMatch(/envies/);
    expect(validerProfil({ ...base, eviter: ["bruit"] })).toMatch(/eviter/);
    expect(validerProfil({ ...base, engagement: "oui" })).toMatch(/engagement/);
    expect(validerProfil({ ...base, mot: "x".repeat(MOT_MAX + 1) })).toMatch(/mot/);
  });
});

describe("validerRetour et lireIdParticipant", () => {
  it("valide un retour météo", () => {
    expect(validerRetour({ missionId: 1, meteo: "pluie" })).toEqual({ missionId: 1, meteo: "pluie", mot: "" });
    expect(validerRetour({ missionId: 1, meteo: "orage" })).toMatch(/meteo/);
    expect(validerRetour({ missionId: 0, meteo: "nuage" })).toMatch(/missionId/);
  });

  it("n'accepte qu'un UUID", () => {
    expect(lireIdParticipant("0F8FAD5B-D9CB-469F-A165-70867728950E")).toBe("0f8fad5b-d9cb-469f-a165-70867728950e");
    expect(lireIdParticipant("abc")).toBeNull();
    expect(lireIdParticipant(undefined)).toBeNull();
  });
});

describe("engagement (itération 8)", () => {
  it("enregistre la case « Je m'engage », facultative : absente vaut false", () => {
    expect(validerProfil({ ...base, engagement: true })).toMatchObject({ engagement: true });
    const sansEngagement: Record<string, unknown> = { ...base };
    delete sansEngagement.engagement;
    expect(validerProfil(sansEngagement)).toMatchObject({ engagement: false });
  });
});

describe("formation préalable (itération 9)", () => {
  it("n'écarte l'écoute téléphonique que si on évite le téléphone", () => {
    const chezMoiContact: Partial<Profil> = { lieux: ["chez-moi"], envies: ["contact"] };
    expect(ids(chezMoiContact)).toContain(8);
    expect(ids({ ...chezMoiContact, eviter: ["telephone"] })).not.toContain(8);
  });

  it("expose la formation requise dans etatMoi (null si aucune)", () => {
    const dossier: Dossier = {
      id: "x", participant: { ...base, etape: 0, formatRdv: null, formationsValidees: [], lanceLe: "2026-11-18T10:00:00.000Z" },
      missions: [{ id: 8, statut: "open", pourquoi: [] }, { id: 2, statut: "open", pourquoi: [] }],
    };
    const [ecoute, affiche] = etatMoi(dossier).missions;
    expect(ecoute.formation).toEqual({ id: "pair-aidance", nom: "Pair-aidance", chemin: expect.stringContaining("onglet Parcours") });
    expect(affiche.formation).toBeNull();
  });
});

describe("missions récurrentes (itération 10)", () => {
  it("calcule la semaine ISO, y compris aux changements d'année", () => {
    expect(semaineIso(new Date("2026-11-18T12:00:00Z"))).toBe("2026-W47");
    expect(semaineIso(new Date("2027-01-01T12:00:00Z"))).toBe("2026-W53");
    expect(semaineIso(new Date("2024-12-30T12:00:00Z"))).toBe("2025-W01");
  });

  it("calcule la fin d'inscription (maintenant + N mois) et le prochain jeudi", () => {
    const maintenant = new Date("2026-11-18T09:00:00.000Z"); // un mercredi
    expect(finInscription(maintenant, 1)).toBe("2026-12-18T09:00:00.000Z");
    expect(finInscription(maintenant, 6)).toBe("2027-05-18T09:00:00.000Z");
    expect(prochainJour("jeudi", maintenant)?.toISOString().slice(0, 10)).toBe("2026-11-19");
    expect(prochainJour("mercredi", maintenant)?.toISOString().slice(0, 10)).toBe("2026-11-18");
    expect(prochainJour("inconnu", maintenant)).toBeNull();
  });

  it("n'affiche le rappel et la disponibilité que pendant l'inscription", () => {
    const maintenant = new Date("2026-11-18T09:00:00.000Z");
    const mission = (m: Partial<MissionStockee>): MissionStockee => ({ id: 7, statut: "yes", pourquoi: [], ...m });
    const etat = (m: MissionStockee) =>
      etatMoi({ id: "x", participant: { ...base, etape: 0, formatRdv: null, formationsValidees: [], lanceLe: "" }, missions: [m] }, maintenant).missions[0];
    const inscrite = mission({ inscriteJusquau: "2027-05-18T09:00:00.000Z", disponibilites: { "2026-W47": false } });
    expect(etat(inscrite)).toMatchObject({
      recurrence: { jour: "jeudi", horaire: "9 h 30 → 11 h 30" }, rappel: { semaine: "2026-W47", date: "2026-11-19" },
      disponibiliteSemaine: false,
    });
    expect(etat(mission({ inscriteJusquau: "2026-11-01T00:00:00.000Z" }))).toMatchObject({ rappel: null, disponibiliteSemaine: null });
    expect(etat(mission({ statut: "open", inscriteJusquau: null }))).toMatchObject({ rappel: null, inscriteJusquau: null });
  });
});

describe("variété des propositions (itération 13)", () => {
  it("fait une place à une mission récurrente qui correspond à une envie, jamais en énergie basse", () => {
    const local = { ...base, lieux: ["local" as const], temps: 240 as const, envies: ["contact" as const] };
    expect(ids(local)).toContain(7);
    expect(ids({ ...local, energie: "bas" })).not.toContain(7);
    expect(ids({ ...local, envies: ["manuel"] })).not.toContain(7);
  });
});

describe("charge (sur-engagement)", () => {
  const maintenant = new Date("2026-11-18T09:00:00.000Z");
  const dossier = (temps: Profil["temps"], missions: MissionStockee[]): Dossier => ({
    id: "x", participant: { ...base, temps, etape: 0, formatRdv: null, formationsValidees: [], lanceLe: "2026-03-01T10:00:00.000Z" }, missions,
  });

  it("additionne les missions choisies (yes) et reste sous le temps disponible", () => {
    const d = dossier(120, [
      { id: 2, statut: "yes", pourquoi: [] }, { id: 4, statut: "yes", pourquoi: [] },
      { id: 1, statut: "done", pourquoi: [] }, { id: 3, statut: "open", pourquoi: [] },
    ]);
    expect(charge(d, maintenant)).toEqual({
      minutesEngagees: 75, minutesDisponibles: 120, surEngagement: false, finEngagement: "2027-03-01T10:00:00.000Z",
    });
  });

  it("signale le sur-engagement au-delà du temps donné", () => {
    const d = dossier(30, [{ id: 1, statut: "yes", pourquoi: [] }]);
    expect(charge(d, maintenant)).toMatchObject({ minutesEngagees: 90, minutesDisponibles: 30, surEngagement: true });
  });

  it("compte une mission récurrente seulement tant que son inscription court", () => {
    const enCours = dossier(120, [{ id: 7, statut: "yes", pourquoi: [], inscriteJusquau: "2027-02-18T09:00:00.000Z" }, { id: 2, statut: "yes", pourquoi: [] }]);
    expect(charge(enCours, maintenant)).toMatchObject({ minutesEngagees: 150, surEngagement: true });
    const finie = dossier(120, [{ id: 7, statut: "yes", pourquoi: [], inscriteJusquau: "2026-11-01T00:00:00.000Z" }]);
    expect(charge(finie, maintenant)).toMatchObject({ minutesEngagees: 0, surEngagement: false });
  });
});
