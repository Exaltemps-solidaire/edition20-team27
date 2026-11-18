import { beforeEach, describe, expect, it } from "vitest";
import { router } from "./routes.ts";
import type { Config } from "./routes.ts";
import { creerStoreMemoire } from "./store.ts";
import type { Store } from "./store.ts";

const ID = "0f8fad5b-d9cb-469f-a165-70867728950e";
const CODE = "code-de-test";
const profil = { prenom: "Camille", energie: "pret", temps: 120, lieux: ["local"], envies: ["contact"], eviter: [], mot: "Bonjour Sarah" };

let store: Store;
let config: Config;
const appel = (methode: string, url: string, corps?: unknown, entetes: Record<string, string> = { "x-participant": ID }) =>
  router({ methode, url, entetes, corps }, store, config);
const sarah = (methode: string, url: string, corps?: unknown, code = CODE) =>
  appel(methode, url, corps, { authorization: `Bearer ${code}` });

beforeEach(() => {
  store = creerStoreMemoire();
  config = { accompagnanteCode: CODE };
});

describe("router", () => {
  it("répond 200 sur les routes de santé et 404 ailleurs", async () => {
    expect((await appel("GET", "/health")).statut).toBe(200);
    expect((await appel("GET", "/sante?x=1")).statut).toBe(200);
    expect((await appel("GET", "/api/v1/inconnue")).statut).toBe(404);
    expect((await appel("POST", "/health")).statut).toBe(404);
  });

  it("exige un en-tête X-Participant UUID", async () => {
    expect((await appel("GET", "/api/v1/moi", undefined, {})).statut).toBe(400);
    expect((await appel("GET", "/api/v1/moi", undefined, { "x-participant": "pas-un-uuid" })).statut).toBe(400);
  });

  it("parcours complet : profil, mission faite, météo, suivi par l'accompagnante", async () => {
    expect((await appel("GET", "/api/v1/moi")).corps).toEqual({ participant: null, missions: [], meteoDeverrouillee: false });
    expect((await appel("PUT", "/api/v1/moi/missions/1", { statut: "done" })).statut).toBe(409);
    expect((await appel("PUT", "/api/v1/moi/format", { format: "visio" })).statut).toBe(409);
    expect((await appel("PUT", "/api/v1/moi/profil", { ...profil, temps: 45 })).statut).toBe(400);

    const lance = await appel("PUT", "/api/v1/moi/profil", profil);
    expect(lance.statut).toBe(200);
    const etat = lance.corps as { participant: { etape: number; formatRdv: null }; missions: { id: number; statut: string; pourquoi: string[] }[] };
    expect(etat.participant).toMatchObject({ prenom: "Camille", etape: 0, formatRdv: null });
    expect(etat.missions.map((m) => [m.id, m.statut])).toEqual([[1, "open"], [5, "open"]]);
    expect(etat.missions[0]).toMatchObject({ titre: "Accueillir les nouvelles à l'atelier du jeudi", duree: 90, effort: "léger", avec: "En binôme" });

    expect((await appel("POST", "/api/v1/meteo", { missionId: 1, meteo: "soleil" })).statut).toBe(409);
    expect((await appel("PUT", "/api/v1/moi/missions/3", { statut: "yes" })).statut).toBe(404);
    expect((await appel("PUT", "/api/v1/moi/missions/1", { statut: "fini" })).statut).toBe(400);
    const fait = await appel("PUT", "/api/v1/moi/missions/1", { statut: "done" });
    expect(fait.corps).toMatchObject({ meteoDeverrouillee: true });
    expect((await appel("PUT", "/api/v1/moi/format", { format: "visio" })).corps).toMatchObject({ participant: { formatRdv: "visio" } });

    expect((await appel("POST", "/api/v1/meteo", { missionId: 1, meteo: "orage" })).statut).toBe(400);
    expect((await appel("POST", "/api/v1/meteo", { missionId: 5, meteo: "soleil" })).statut).toBe(409);
    expect(await appel("POST", "/api/v1/meteo", { missionId: 1, meteo: "soleil", mot: " ça m'a fait du bien " })).toEqual({ statut: 201, corps: { ok: true } });

    // Profil changé : la mission faite reste, la 5 (open) part, la 3 arrive.
    const change = await appel("PUT", "/api/v1/moi/profil", { ...profil, envies: ["manuel"], eviter: ["groupe"] });
    expect((change.corps as typeof etat).missions.map((m) => [m.id, m.statut])).toEqual([[1, "done"], [3, "open"]]);
    expect((change.corps as typeof etat).participant).toMatchObject({ formatRdv: "visio" });

    const suivi = await sarah("GET", "/api/v1/accompagnante/participants");
    expect(suivi.statut).toBe(200);
    expect(suivi.corps).toEqual([
      expect.objectContaining({
        id: ID, prenom: "Camille", mot: "Bonjour Sarah", etape: 0,
        missions: [{ id: 1, titre: "Accueillir les nouvelles à l'atelier du jeudi", statut: "done" }, { id: 3, titre: "Trier les dons de vêtements", statut: "open" }],
        retours: [expect.objectContaining({ missionId: 1, titreMission: "Accueillir les nouvelles à l'atelier du jeudi", meteo: "soleil", mot: "ça m'a fait du bien" })],
      }),
    ]);

    expect(await sarah("PUT", `/api/v1/accompagnante/participants/${ID}/etape`, { etape: 2 })).toEqual({ statut: 200, corps: { ok: true } });
    expect((await appel("GET", "/api/v1/moi")).corps).toMatchObject({ participant: { etape: 2 } });
    expect((await sarah("PUT", `/api/v1/accompagnante/participants/${ID}/etape`, { etape: 5 })).statut).toBe(400);
    expect((await sarah("PUT", "/api/v1/accompagnante/participants/1b4e28ba-2fa1-11d2-883f-0016d3cca427/etape", { etape: 1 })).statut).toBe(404);
  });

  it("ferme l'accès accompagnante par défaut, l'ouvre seulement sur option explicite", async () => {
    expect((await sarah("GET", "/api/v1/accompagnante/participants", undefined, "faux")).statut).toBe(401);
    expect((await appel("GET", "/api/v1/accompagnante/participants", undefined, {})).statut).toBe(401);
    expect((await sarah("GET", "/api/v1/accompagnante/participants")).corps).toEqual([]);
    config = {};
    expect((await appel("GET", "/api/v1/accompagnante/participants", undefined, {})).statut).toBe(503);
    config = { accesLibre: true };
    expect((await appel("GET", "/api/v1/accompagnante/participants", undefined, {})).statut).toBe(200);
  });

  it("recommence le scénario : DELETE /moi efface le dossier", async () => {
    await appel("PUT", "/api/v1/moi/profil", profil);
    expect((await appel("DELETE", "/api/v1/moi")).corps).toMatchObject({ participant: null, missions: [] });
    expect((await appel("GET", "/api/v1/moi")).corps).toMatchObject({ participant: null });
  });
});
