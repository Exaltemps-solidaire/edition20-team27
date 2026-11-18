import { describe, expect, it } from "vitest";
import { avancement, habilitation, statutsChemin } from "./formation";

describe("chemin de formation", () => {
  it("marque les étapes validées, la première restante en cours, le reste à venir", () => {
    expect(statutsChemin([])).toEqual(["now", "next", "next"]);
    expect(statutsChemin(["tronc-commun"])).toEqual(["done", "now", "next"]);
    expect(statutsChemin(["tronc-commun", "moderation", "pair-aidance"])).toEqual(["done", "done", "done"]);
  });

  it("dit ce que les formations validées ouvrent, et l'avancement", () => {
    expect(habilitation(["tronc-commun"])).toMatch(/Chaque étape/);
    expect(habilitation(["tronc-commun", "moderation"])).toMatch(/ateliers et les missions/);
    expect(habilitation(["tronc-commun", "moderation", "pair-aidance"])).toMatch(/tout le parcours/);
    expect(avancement(["tronc-commun", "moderation"])).toBe(67);
  });
});
