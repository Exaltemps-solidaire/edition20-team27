import { describe, expect, it } from "vitest";
import { MOT_MAX, retours, router, validerRetour } from "./routes.ts";

describe("router", () => {
  it("répond 200 sur les deux routes de santé", () => {
    expect(router("GET", "/health").statut).toBe(200);
    expect(router("GET", "/sante?x=1").statut).toBe(200);
  });

  it("répond 404 sur une route inconnue ou une méthode non prévue", () => {
    expect(router("GET", "/api/v1/inconnue").statut).toBe(404);
    expect(router("POST", "/health").statut).toBe(404);
  });

  it("enregistre un retour météo valide et refuse un corps invalide", () => {
    const avant = retours.length;
    expect(router("POST", "/api/v1/meteo", { missionId: 3, meteo: "soleil", mot: "  merci " }).statut).toBe(201);
    expect(retours.length).toBe(avant + 1);
    expect(retours.at(-1)).toMatchObject({ missionId: 3, meteo: "soleil", mot: "merci" });
    expect(router("POST", "/api/v1/meteo", { missionId: 3, meteo: "orage" }).statut).toBe(400);
    expect(router("POST", "/api/v1/meteo", undefined).statut).toBe(400);
  });
});

describe("validerRetour", () => {
  it("accepte l'absence de mot et refuse un mot trop long", () => {
    expect(validerRetour({ missionId: 1, meteo: "pluie" })).toEqual({ missionId: 1, meteo: "pluie", mot: "" });
    expect(validerRetour({ missionId: 1, meteo: "nuage", mot: "x".repeat(MOT_MAX + 1) })).toMatch(/limité/);
    expect(validerRetour({ missionId: 0, meteo: "nuage" })).toMatch(/missionId/);
  });
});
