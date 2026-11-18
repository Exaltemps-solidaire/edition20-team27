import { describe, expect, it } from "vitest";
import { fusionnerMissions, lireIdParticipant, MOT_MAX, proposerMissions, validerProfil, validerRetour } from "./domaine.ts";
import type { MissionStockee, Profil } from "./domaine.ts";

const base: Profil = { prenom: "Camille", energie: "pret", temps: 120, lieux: ["local", "chez-moi"], envies: [], eviter: [], mot: "" };
const ids = (p: Partial<Profil>) => proposerMissions({ ...base, ...p }).map((m) => m.id);

describe("proposerMissions", () => {
  it("trie par envies correspondantes puis par durée et explique pourquoi", () => {
    expect(proposerMissions({ ...base, envies: ["contact"] })).toEqual([
      { id: 1, pourquoi: ["au local", "tient dans ton temps", "être avec d'autres personnes"] },
      { id: 5, pourquoi: ["au local", "tient dans ton temps", "être avec d'autres personnes"] },
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
