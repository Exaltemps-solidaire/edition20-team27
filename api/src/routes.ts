// Routage de l'API (voir docs/contrat-api.md), testable sans démarrer de serveur : il reçoit la
// requête déjà lue, le store et la configuration. Le proxy d'entrée envoie /api/... à ce service
// sans retirer le préfixe : les routes métier sont sous /api/v1/... ; /health et /sante à la racine.
import { createHash, timingSafeEqual } from "node:crypto";
import {
  DUREES_INSCRIPTION, ETAPE_MAX, ETAPES_FORMATION, FORMATS, STATUTS, etatMoi, finInscription, fusionnerMissions, inscriptionEnCours,
  lireIdParticipant, missionDuCatalogue, proposerMissions, semaineValide, suiviParticipant, validerProfil, validerRetour,
} from "./domaine.ts";
import type { Dossier, EtapeFormation, FormatRdv, StatutMission } from "./domaine.ts";
import type { Store } from "./store.ts";

export type Requete = {
  methode: string;
  url: string;
  entetes: Record<string, string | string[] | undefined>;
  corps?: unknown;
};
export type Reponse = { statut: number; corps?: unknown };
export type Config = { accompagnanteCode?: string; accesLibre?: boolean };

const erreur = (statut: number, message: string): Reponse => ({ statut, corps: { erreur: message } });
const PAS_LANCE = erreur(409, "questionnaire pas encore lancé");

function entete(req: Requete, nom: string): string | undefined {
  const v = req.entetes[nom];
  return Array.isArray(v) ? v[0] : v;
}

function champ(corps: unknown, nom: string): unknown {
  return typeof corps === "object" && corps !== null ? (corps as Record<string, unknown>)[nom] : undefined;
}

// Comparaison en temps constant : on compare des empreintes de même longueur.
function codeValide(fourni: string, attendu: string): boolean {
  const a = createHash("sha256").update(fourni).digest();
  const b = createHash("sha256").update(attendu).digest();
  return timingSafeEqual(a, b);
}

async function routesParticipante(req: Requete, chemin: string, store: Store): Promise<Reponse | null> {
  const estMoi = chemin === "/api/v1/moi" || chemin.startsWith("/api/v1/moi/");
  if (!estMoi && chemin !== "/api/v1/meteo") return null;

  const id = lireIdParticipant(entete(req, "x-participant"));
  if (!id) return erreur(400, "en-tête X-Participant manquant ou invalide (UUID attendu)");
  const { methode, corps } = req;

  if (methode === "GET" && chemin === "/api/v1/moi") {
    return { statut: 200, corps: etatMoi(await store.lire(id)) };
  }

  // Recommencer le scénario de test : efface le dossier de cette persona et ses retours.
  if (methode === "DELETE" && chemin === "/api/v1/moi") {
    await store.supprimer(id);
    return { statut: 200, corps: etatMoi(null) };
  }

  if (methode === "PUT" && chemin === "/api/v1/moi/profil") {
    const profil = validerProfil(corps);
    if (typeof profil === "string") return erreur(400, profil);
    const actuel = await store.lire(id);
    const dossier: Dossier = {
      id,
      participant: {
        ...profil,
        etape: actuel?.participant.etape ?? 0,
        formatRdv: actuel?.participant.formatRdv ?? null,
        formationsValidees: actuel?.participant.formationsValidees ?? [],
        lanceLe: actuel?.participant.lanceLe ?? new Date().toISOString(),
      },
      missions: fusionnerMissions(actuel?.missions ?? [], proposerMissions(profil)),
    };
    await store.enregistrer(dossier);
    return { statut: 200, corps: etatMoi(dossier) };
  }

  const mission = /^\/api\/v1\/moi\/missions\/(\d+)$/.exec(chemin);
  if (methode === "PUT" && mission) {
    const dossier = await store.lire(id);
    if (!dossier) return PAS_LANCE;
    const statut = champ(corps, "statut");
    if (!(STATUTS as readonly unknown[]).includes(statut)) return erreur(400, "statut doit valoir open, yes, no ou done");
    const cible = dossier.missions.find((m) => m.id === Number(mission[1]));
    if (!cible) return erreur(404, "mission absente de ta liste");
    // Itération 10 : « Je tente » sur une mission récurrente s'accompagne d'une durée d'inscription.
    const dureeMois = champ(corps, "dureeMois");
    if (dureeMois !== undefined) {
      if (!(DUREES_INSCRIPTION as readonly unknown[]).includes(dureeMois)) return erreur(400, "dureeMois doit valoir 1, 3 ou 6");
      if (statut !== "yes" || !missionDuCatalogue(cible.id)?.recurrence) {
        return erreur(400, "dureeMois ne s'utilise qu'avec statut yes sur une mission récurrente");
      }
      cible.inscriteJusquau = finInscription(new Date(), dureeMois as number);
    }
    if (statut === "open" || statut === "no") cible.inscriteJusquau = null; // annuler efface l'inscription
    cible.statut = statut as StatutMission;
    await store.enregistrer(dossier);
    return { statut: 200, corps: etatMoi(dossier) };
  }

  const dispo = /^\/api\/v1\/moi\/missions\/(\d+)\/disponibilite$/.exec(chemin);
  if (methode === "POST" && dispo) {
    const semaine = champ(corps, "semaine");
    const disponible = champ(corps, "disponible");
    if (!semaineValide(semaine)) return erreur(400, "semaine attendue au format AAAA-Www");
    if (typeof disponible !== "boolean") return erreur(400, "disponible doit être un booléen");
    const dossier = await store.lire(id);
    if (!dossier) return PAS_LANCE;
    const cible = dossier.missions.find((m) => m.id === Number(dispo[1]));
    if (!cible) return erreur(404, "mission absente de ta liste");
    if (!missionDuCatalogue(cible.id)?.recurrence || !inscriptionEnCours(cible, new Date())) {
      return erreur(409, "pas d'inscription en cours sur cette mission récurrente");
    }
    await store.enregistrerDisponibilite(id, cible.id, semaine, disponible);
    cible.disponibilites = { ...cible.disponibilites, [semaine]: disponible };
    return { statut: 201, corps: etatMoi(dossier) };
  }

  if (methode === "PUT" && chemin === "/api/v1/moi/format") {
    const dossier = await store.lire(id);
    if (!dossier) return PAS_LANCE;
    const format = champ(corps, "format");
    if (!(FORMATS as readonly unknown[]).includes(format)) return erreur(400, "format doit valoir visio ou local");
    dossier.participant.formatRdv = format as FormatRdv;
    await store.enregistrer(dossier);
    return { statut: 200, corps: etatMoi(dossier) };
  }

  if (methode === "POST" && chemin === "/api/v1/meteo") {
    const retour = validerRetour(corps);
    if (typeof retour === "string") return erreur(400, retour);
    const dossier = await store.lire(id);
    const faite = dossier?.missions.some((m) => m.id === retour.missionId && m.statut === "done");
    if (!faite) return erreur(409, "la mission n'est pas terminée");
    await store.ajouterRetour(id, { ...retour, recuLe: new Date().toISOString() });
    return { statut: 201, corps: { ok: true } };
  }

  return { statut: 404 };
}

async function routesAccompagnante(req: Requete, chemin: string, store: Store, config: Config): Promise<Reponse | null> {
  if (!chemin.startsWith("/api/v1/accompagnante/")) return null;
  // Fermé par défaut. Le PRD de la version de test demande « pas de connexion » (écran « Qui êtes-vous ? ») :
  // ce mode s'active explicitement avec ACCOMPAGNANTE_ACCES_LIBRE=1, réservé aux données d'exemple.
  if (!config.accesLibre) {
    if (!config.accompagnanteCode) return erreur(503, "accès accompagnante non configuré");
    const auth = /^Bearer (.+)$/.exec(entete(req, "authorization") ?? "");
    if (!auth || !codeValide(auth[1], config.accompagnanteCode)) return erreur(401, "code accompagnante invalide");
  }

  if (req.methode === "GET" && chemin === "/api/v1/accompagnante/participants") {
    const tous = await store.lister();
    return { statut: 200, corps: tous.map(({ dossier, retours }) => suiviParticipant(dossier, retours)) };
  }

  // Chemin de formation : la chargée valide (ou dévalide) une étape de formation.
  const formation = /^\/api\/v1\/accompagnante\/participants\/([^/]+)\/formations$/.exec(chemin);
  if (req.methode === "PUT" && formation) {
    const nom = champ(req.corps, "formation");
    const validee = champ(req.corps, "validee");
    if (!(ETAPES_FORMATION as readonly unknown[]).includes(nom) || typeof validee !== "boolean") {
      return erreur(400, "formation (tronc-commun, moderation, pair-aidance) et validee (booléen) attendus");
    }
    const id = lireIdParticipant(formation[1]);
    const dossier = id ? await store.lire(id) : null;
    if (!dossier) return erreur(404, "participante inconnue");
    const actuelles = new Set(dossier.participant.formationsValidees ?? []);
    if (validee) actuelles.add(nom as EtapeFormation);
    else actuelles.delete(nom as EtapeFormation);
    dossier.participant.formationsValidees = ETAPES_FORMATION.filter((f) => actuelles.has(f));
    await store.enregistrer(dossier);
    return { statut: 200, corps: { ok: true, formationsValidees: dossier.participant.formationsValidees } };
  }

  const etape = /^\/api\/v1\/accompagnante\/participants\/([^/]+)\/etape$/.exec(chemin);
  if (req.methode === "PUT" && etape) {
    const valeur = champ(req.corps, "etape");
    if (!Number.isInteger(valeur) || (valeur as number) < 0 || (valeur as number) > ETAPE_MAX) {
      return erreur(400, `etape doit être un entier de 0 à ${ETAPE_MAX}`);
    }
    const id = lireIdParticipant(etape[1]);
    const dossier = id ? await store.lire(id) : null;
    if (!dossier) return erreur(404, "participante inconnue");
    dossier.participant.etape = valeur as number;
    await store.enregistrer(dossier);
    return { statut: 200, corps: { ok: true } };
  }

  return { statut: 404 };
}

export async function router(req: Requete, store: Store, config: Config): Promise<Reponse> {
  const chemin = new URL(req.url, "http://api").pathname;
  if (req.methode === "GET" && (chemin === "/health" || chemin === "/sante")) {
    return { statut: 200, corps: { status: "ok" } };
  }
  return (
    (await routesParticipante(req, chemin, store)) ??
    (await routesAccompagnante(req, chemin, store, config)) ??
    { statut: 404 }
  );
}
