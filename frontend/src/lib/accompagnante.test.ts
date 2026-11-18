import { describe, expect, it } from "vitest";
import {
  compterPluiesRecentes,
  formaterDate,
  trierParticipants,
  typeErreurHttp,
  type RetourMeteo,
  type SuiviParticipant,
} from "./accompagnante";

const MAINTENANT = new Date("2026-11-18T10:00:00");

function participante(id: string, lanceLe: string, retours: RetourMeteo[] = []): SuiviParticipant {
  return {
    id,
    prenom: id,
    energie: "bas",
    temps: 30,
    lieux: ["chez-moi"],
    envies: [],
    eviter: [],
    mot: "",
    etape: 0,
    formatRdv: null,
    lanceLe,
    missions: [],
    retours,
  };
}

const retour = (meteo: RetourMeteo["meteo"], recuLe: string): RetourMeteo => ({
  missionId: 2,
  titreMission: "Relire l'affiche du prochain événement",
  meteo,
  mot: "",
  recuLe,
});

describe("espace accompagnante", () => {
  it("ne compte que les retours « pluie » de moins de 14 jours", () => {
    const liste = [
      participante("Anne", "2026-11-01T09:00:00", [
        retour("pluie", "2026-11-17T09:00:00"),
        retour("soleil", "2026-11-16T09:00:00"),
        retour("pluie", "2026-10-01T09:00:00"), // trop ancien
      ]),
      participante("Bea", "2026-11-10T09:00:00", [retour("pluie", "2026-11-18T08:00:00")]),
    ];
    expect(compterPluiesRecentes(liste, MAINTENANT)).toBe(2);
  });

  it("met d'abord celles à recontacter, puis la plus récemment lancée, sans modifier la liste", () => {
    const liste = [
      participante("Recente", "2026-11-15T09:00:00"),
      participante("APluie", "2026-11-01T09:00:00", [retour("pluie", "2026-11-17T09:00:00")]),
      participante("Ancienne", "2026-10-01T09:00:00"),
    ];
    expect(trierParticipants(liste, MAINTENANT).map((p) => p.id)).toEqual(["APluie", "Recente", "Ancienne"]);
    expect(liste[0].id).toBe("Recente");
  });

  it("formate les dates en relatif puis en fr-FR, et traduit les statuts HTTP", () => {
    expect(formaterDate("2026-11-18T07:00:00", MAINTENANT)).toBe("aujourd'hui");
    expect(formaterDate("2026-11-17T22:00:00", MAINTENANT)).toBe("hier");
    expect(formaterDate("2026-11-15T09:00:00", MAINTENANT)).toBe("il y a 3 jours");
    expect(formaterDate("2026-10-02T09:00:00", MAINTENANT)).toBe("2 octobre 2026");
    expect(typeErreurHttp(401)).toBe("code-incorrect");
    expect(typeErreurHttp(503)).toBe("non-configure");
  });
});
