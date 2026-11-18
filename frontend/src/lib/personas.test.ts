import { describe, expect, it } from "vitest";
import { CLE_PERSONA, PERSONAS, ecrirePersona, lirePersona, participantIdCourant, personaParId } from "./personas";

function stockageMemoire() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

describe("personas « Qui êtes-vous ? »", () => {
  it("propose une persona par rôle du scénario, et seule la BURN'ette a un identifiant d'API", () => {
    expect(PERSONAS.map((p) => p.role)).toEqual(["La BURN'ette en remobilisation", "La chargée de remobilisation"]);
    expect(personaParId("camille")?.participantId).toMatch(/^[0-9a-f-]{36}$/);
    expect(personaParId("sarah")?.participantId).toBeUndefined();
    expect(personaParId("inconnue")).toBeNull();
  });

  it("garde le choix, permet d'en changer et de l'effacer", () => {
    const s = stockageMemoire();
    expect(lirePersona(s)).toBeNull();
    ecrirePersona("sarah", s);
    expect(s.getItem(CLE_PERSONA)).toBe("sarah");
    expect(lirePersona(s)?.nom).toBe("Sarah");
    ecrirePersona(null, s);
    expect(lirePersona(s)).toBeNull();
  });

  it("crée une BURN'ette par appareil et la garde, avec repli sur l'identifiant fixe", () => {
    const s = stockageMemoire();
    const id = participantIdCourant(s, () => "11111111-2222-4333-8444-555555555555");
    expect(id).toBe("11111111-2222-4333-8444-555555555555");
    expect(participantIdCourant(s, () => "autre")).toBe(id);
    expect(participantIdCourant(stockageMemoire(), () => "pas-un-uuid")).toBe(PERSONAS[0].participantId);
  });
});
