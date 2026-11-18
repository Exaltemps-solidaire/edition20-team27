import { describe, expect, it } from "vitest";
import { ATELIER_COLLECTIF, creneauDepuisDetails, echapperTexte, genererIcs, replier } from "./ics";

const MAINTENANT = new Date("2026-11-18T09:00:00Z");

describe("génération du fichier agenda", () => {
  it("produit l'atelier collectif du 20 novembre 2026, 14 h–16 h, heure de Paris", () => {
    const ics = genererIcs(ATELIER_COLLECTIF, MAINTENANT);
    expect(ics).toContain("DTSTART;TZID=Europe/Paris:20261120T140000\r\n");
    expect(ics).toContain("DTEND;TZID=Europe/Paris:20261120T160000\r\n");
    expect(ics).toContain("LOCATION:Au local de l'association\r\n");
    expect(ics).toContain("DTSTAMP:20261118T090000Z\r\n");
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
  });

  it("échappe les caractères spéciaux et replie les lignes longues à 75 octets", () => {
    expect(echapperTexte("Quand, où; avec\nqui")).toBe("Quand\\, où\\; avec\\nqui");
    const longue = "DESCRIPTION:" + "é".repeat(100);
    const repliee = replier(longue);
    for (const l of repliee.split("\r\n")) expect(new TextEncoder().encode(l).length).toBeLessThanOrEqual(75);
    expect(repliee.split("\r\n").map((l, i) => (i ? l.slice(1) : l)).join("")).toBe(longue);
  });

  it("ne trouve un créneau que si la date est précise dans les détails", () => {
    expect(creneauDepuisDetails([["Quand", "Jeudi 20 nov., 13 h 45 → 15 h 15"]], MAINTENANT)).toEqual({
      debut: { annee: 2026, mois: 11, jour: 20, heure: 13, minute: 45 },
      fin: { annee: 2026, mois: 11, jour: 20, heure: 15, minute: 15 },
    });
    expect(creneauDepuisDetails([["Quand", "Mercredi 26 nov., 10 h → 11 h"]], MAINTENANT)?.fin.heure).toBe(11);
    expect(creneauDepuisDetails([["Quand", "Quand tu veux cette semaine"]], MAINTENANT)).toBeNull();
    expect(creneauDepuisDetails([["Où", "Au local"]], MAINTENANT)).toBeNull();
    // une date de janvier vue en novembre est l'année suivante
    expect(creneauDepuisDetails([["Quand", "Lundi 12 janv., 9 h → 10 h"]], MAINTENANT)?.debut.annee).toBe(2027);
  });
});
