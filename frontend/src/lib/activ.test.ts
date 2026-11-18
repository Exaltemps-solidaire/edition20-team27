import { describe, expect, it } from "vitest";
import {
  BROUILLON_VIDE,
  QUESTIONS,
  avecStatut,
  choisirOption,
  dureeLisible,
  missionPourMeteo,
  missionsAChoisir,
  questionValide,
  statutEtape,
  texteHero,
  valeurRecap,
  versProfil,
} from "./activ";
import type { EtatMoi, MissionProposee } from "./api";

const mission = (id: number, statut: MissionProposee["statut"]): MissionProposee => ({
  id,
  titre: `Mission ${id}`,
  duree: 30,
  effort: "léger",
  lieu: "local",
  avec: "Seule",
  objectif: "",
  details: [],
  pourquoi: [],
  statut,
});

describe("questionnaire", () => {
  const [energie, , lieux, envies] = QUESTIONS;

  it("bloque une question obligatoire tant que rien n'est choisi, jamais une optionnelle", () => {
    expect(questionValide(energie, BROUILLON_VIDE)).toBe(false);
    expect(questionValide(energie, choisirOption(BROUILLON_VIDE, energie, "bas"))).toBe(true);
    expect(questionValide(lieux, BROUILLON_VIDE)).toBe(false);
    expect(questionValide(envies, BROUILLON_VIDE)).toBe(true);
  });

  it("bascule les choix multiples et remplace les choix simples", () => {
    let b = choisirOption(BROUILLON_VIDE, lieux, "local");
    b = choisirOption(b, lieux, "chez-moi");
    expect(b.lieux).toEqual(["local", "chez-moi"]);
    expect(choisirOption(b, lieux, "local").lieux).toEqual(["chez-moi"]);
    expect(choisirOption(choisirOption(b, energie, "bas"), energie, "pret").energie).toBe("pret");
    expect(valeurRecap(envies, b)).toBe("Rien de particulier");
    expect(valeurRecap(lieux, b)).toBe("Au local de L'Burn, De chez moi");
  });

  it("ne produit un profil que s'il est complet, avec prénom nettoyé et temps numérique", () => {
    const b = { ...BROUILLON_VIDE, prenom: "  Camille ", energie: "bas", temps: "120", lieux: ["local"] };
    expect(versProfil(b)).toEqual({ prenom: "Camille", energie: "bas", temps: 120, lieux: ["local"], envies: [], eviter: [], mot: "" });
    expect(versProfil({ ...b, prenom: "   " })).toBeNull();
    expect(versProfil({ ...b, lieux: [] })).toBeNull();
  });
});

describe("parcours et missions", () => {
  it("formate les durées comme la maquette", () => {
    expect(dureeLisible(30)).toBe("30 min");
    expect(dureeLisible(60)).toBe("1 h");
    expect(dureeLisible(90)).toBe("1 h 30");
  });

  it("situe chaque étape par rapport à l'étape courante", () => {
    expect([0, 1, 2, 3, 4].map((i) => statutEtape(i, 2))).toEqual(["done", "done", "now", "next", "next"]);
  });

  it("adapte le texte du bandeau à l'étape et aux missions restantes", () => {
    expect(texteHero(0, 2)).toBe(
      "Sarah a reçu tes réponses. Premier rendez-vous : mardi 25 nov., 10 h, au local ou en visio. 2 missions à choisir cette semaine. Tu décides.",
    );
    expect(texteHero(0, 0)).toBe("Sarah a reçu tes réponses. Premier rendez-vous : mardi 25 nov., 10 h, au local ou en visio.");
    expect(texteHero(2, 1)).toBe("1 mission à choisir cette semaine. Tu décides.");
    expect(texteHero(2, 0)).toMatch(/choix de la semaine sont faits/);
  });

  it("met à jour une mission sans toucher l'état d'origine et déverrouille la météo à la première mission faite", () => {
    const etat: EtatMoi = { participant: null, missions: [mission(1, "open"), mission(2, "yes")], meteoDeverrouillee: false };
    expect(missionsAChoisir(etat.missions)).toBe(1);
    const apres = avecStatut(etat, 2, "done");
    expect(apres.meteoDeverrouillee).toBe(true);
    expect(etat.missions[1].statut).toBe("yes");
    expect(missionsAChoisir(avecStatut(etat, 1, "no").missions)).toBe(0);
  });

  it("choisit la mission de la météo : celle demandée si elle est faite, sinon la dernière faite", () => {
    const ms = [mission(1, "done"), mission(2, "done"), mission(3, "yes")];
    expect(missionPourMeteo(ms, 1)?.id).toBe(1);
    expect(missionPourMeteo(ms, null)?.id).toBe(2);
    expect(missionPourMeteo(ms, 3)?.id).toBe(2);
    expect(missionPourMeteo([mission(1, "open")], null)).toBeNull();
  });
});
