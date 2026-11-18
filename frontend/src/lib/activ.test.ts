import { describe, expect, it } from "vitest";
import { MISSIONS_INITIALES, changerStatut, missionsAChoisir, recevoirDetails, texteHero } from "./activ";

describe("missions du Fil ACTIV'", () => {
  it("compte les missions encore à choisir, et « Pas cette semaine » compte comme un choix", () => {
    expect(missionsAChoisir(MISSIONS_INITIALES)).toBe(2);
    const apres = changerStatut(MISSIONS_INITIALES, 2, "no");
    expect(missionsAChoisir(apres)).toBe(1);
    expect(MISSIONS_INITIALES[1].statut).toBe("open"); // la liste d'origine n'est pas modifiée
  });

  it("ne livre les détails que si la mission est toujours choisie", () => {
    const choisie = changerStatut(MISSIONS_INITIALES, 1, "yes");
    expect(recevoirDetails(choisie, 1)[0].detailsRecus).toBe(true);
    const annulee = changerStatut(choisie, 1, "open");
    expect(recevoirDetails(annulee, 1)[0].detailsRecus).toBe(false);
  });

  it("adapte le texte du bandeau au nombre de missions restantes", () => {
    expect(texteHero(2)).toBe("2 missions à choisir cette semaine. Tu décides.");
    expect(texteHero(1)).toBe("1 mission à choisir cette semaine. Tu décides.");
    expect(texteHero(0)).toMatch(/choix de la semaine sont faits/);
  });
});
