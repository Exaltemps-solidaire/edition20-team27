import { describe, expect, it } from "vitest";
import { dateLisible, libelleDisponibilite, questionRappel } from "./recurrence";

describe("missions récurrentes (itération 10)", () => {
  it("formule le rappel hebdomadaire et la fin d'inscription", () => {
    expect(questionRappel("jeudi", "2026-11-19")).toBe("Jeudi 19 novembre : es-tu disponible ?");
    expect(dateLisible("2027-05-18T09:00:00.000Z", true)).toBe("18 mai 2027");
  });

  it("traduit la disponibilité de la semaine pour Sarah", () => {
    expect(libelleDisponibilite(true)).toBe("oui");
    expect(libelleDisponibilite(false)).toBe("pas cette semaine");
    expect(libelleDisponibilite(null)).toBe("pas encore répondu");
  });
});
