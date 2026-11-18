import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppParticipante as FilActiv } from "@/components/AppParticipante";
import type { EtatMoi } from "@/lib/api";

const ACTIVE: EtatMoi = {
  participant: {
    prenom: "Camille",
    energie: "bas",
    temps: 120,
    lieux: ["local"],
    envies: [],
    eviter: [],
    mot: "",
    etape: 2,
    formatRdv: null,
    lanceLe: "2026-11-18T09:00:00Z",
  },
  missions: [
    {
      id: 3,
      titre: "Trier les dons de vêtements",
      duree: 60,
      effort: "léger",
      lieu: "local",
      avec: "En binôme",
      objectif: "Faire quelque chose de concret.",
      details: [["Quand", "Mercredi 26 nov., 10 h → 11 h"]],
      pourquoi: ["au local", "tient dans ton temps"],
      statut: "open",
    },
  ],
  meteoDeverrouillee: false,
};

function repondre(etat: EtatMoi) {
  const f = vi.fn(async () => new Response(JSON.stringify(etat), { status: 200, headers: { "Content-Type": "application/json" } }));
  vi.stubGlobal("fetch", f);
  return f;
}

afterEach(() => vi.unstubAllGlobals());

describe("écran de la participante", () => {
  it("ouvre le questionnaire tant que le parcours n'est pas lancé, et exige un prénom", async () => {
    const f = repondre({ participant: null, missions: [], meteoDeverrouillee: false });
    render(<FilActiv />);
    expect(await screen.findByRole("heading", { name: "Bienvenue dans le Fil ACTIV'" })).toBeInTheDocument();
    const commencer = screen.getByRole("button", { name: "Commencer" });
    expect(commencer).toBeDisabled();
    await userEvent.type(screen.getByLabelText("Comment veux-tu qu'on t'appelle ?"), "Camille");
    expect(commencer).toBeEnabled();
    const [, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>)["X-Participant"]).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("envoie le profil complet au lancement du parcours puis affiche l'app", async () => {
    const f = vi.fn(async (_url: string, init?: RequestInit) => {
      const etat = init?.method === "PUT" ? { ...ACTIVE, participant: { ...ACTIVE.participant!, etape: 0 } } : { participant: null, missions: [], meteoDeverrouillee: false };
      return new Response(JSON.stringify(etat), { status: 200 });
    });
    vi.stubGlobal("fetch", f);
    render(<FilActiv />);
    await userEvent.type(await screen.findByLabelText("Comment veux-tu qu'on t'appelle ?"), " Camille ");
    await userEvent.click(screen.getByRole("button", { name: "Commencer" }));
    await userEvent.click(screen.getByRole("button", { name: "Très basse, j'y vais tout doucement" }));
    await userEvent.click(screen.getByRole("button", { name: "Continuer" }));
    await userEvent.click(screen.getByRole("button", { name: "1 à 2 heures" }));
    await userEvent.click(screen.getByRole("button", { name: "Continuer" }));
    await userEvent.click(screen.getByRole("button", { name: "Au local de L'Burn" }));
    await userEvent.click(screen.getByRole("button", { name: "Continuer" }));
    await userEvent.click(screen.getByRole("button", { name: "Passer" }));
    await userEvent.click(screen.getByRole("button", { name: "Passer" }));
    await userEvent.click(screen.getByRole("button", { name: "Lancer mon parcours" }));
    expect(await screen.findByText("Bonjour Camille")).toBeInTheDocument();
    const [url, init] = f.mock.calls[1];
    expect(url).toBe("/api/v1/moi/profil");
    expect(JSON.parse(String(init?.body))).toEqual({ prenom: "Camille", energie: "bas", temps: 120, lieux: ["local"], envies: [], eviter: [], mot: "" });
    expect(screen.getByRole("status")).toHaveTextContent("C'est parti ! Sarah a reçu tes réponses.");
  });

  it("affiche la feuille de route à l'étape renvoyée par l'API, et les missions avec leurs raisons", async () => {
    repondre(ACTIVE);
    render(<FilActiv />);
    expect(await screen.findByText("Bonjour Camille")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Étape 3 · Se tester en mission" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Missions/ }));
    expect(screen.getByText("1 h")).toBeInTheDocument();
    expect(screen.getByText("Proposée pour toi : au local · tient dans ton temps")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Météo/ }));
    expect(screen.getByRole("heading", { name: "Ta météo arrive bientôt" })).toBeInTheDocument();
  });
});
