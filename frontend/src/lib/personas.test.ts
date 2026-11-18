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

  it("envoie toujours l'identifiant de Camille côté BURN'ette", () => {
    expect(participantIdCourant(stockageMemoire())).toBe(PERSONAS[0].participantId);
  });
});
