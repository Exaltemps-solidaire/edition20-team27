"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { BROUILLON_VIDE, avecStatut, brouillonDepuis, missionPourMeteo, missionsAChoisir } from "@/lib/activ";
import { api, type DureeInscription, type EtatMoi, type FormatRdv, type Meteo, type MissionProposee, type Profil, type StatutMission } from "@/lib/api";
import { ATELIER_COLLECTIF, creneauDepuisDetails, genererIcs } from "@/lib/ics";
import { telechargerFichier } from "@/lib/telecharger";
import { Infos } from "@/components/Infos";
import { Livret } from "@/components/Livret";
import { MeteoEcran } from "@/components/MeteoEcran";
import { Missions } from "@/components/Missions";
import { Navigation, type Ecran } from "@/components/Navigation";
import { Onboarding } from "@/components/Onboarding";
import { Parcours } from "@/components/Parcours";

const ECHEC = "Ça n'a pas marché. Réessaie dans un instant.";

export function AppParticipante({ bandeau }: { bandeau?: ReactNode }) {
  const [etat, setEtat] = useState<EtatMoi | null>(null);
  const [chargement, setChargement] = useState<"en-cours" | "erreur" | "ok">("en-cours");
  const [edition, setEdition] = useState(false);
  const [ecran, setEcran] = useState<Ecran>("parcours");
  const [infosVues, setInfosVues] = useState(false);
  const [livret, setLivret] = useState(false);
  const [enAttente, setEnAttente] = useState<Set<number>>(() => new Set());
  const [missionMeteoId, setMissionMeteoId] = useState<number | null>(null);
  const [formatEnCours, setFormatEnCours] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const minuteurs = useRef<ReturnType<typeof setTimeout>[]>([]);
  const minuteurToast = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const etatRef = useRef<EtatMoi | null>(null);
  const ecranRef = useRef<HTMLElement>(null);

  useEffect(() => {
    etatRef.current = etat;
  }, [etat]);

  const charger = useCallback(async () => {
    try {
      setEtat(await api.moi());
      setChargement("ok");
    } catch {
      setChargement("erreur");
    }
  }, []);

  useEffect(() => {
    // premier chargement de l'état de la participante (setState après l'appel réseau)
    void (async () => {
      await charger();
    })();
    const ts = minuteurs.current;
    return () => {
      ts.forEach(clearTimeout);
      clearTimeout(minuteurToast.current);
    };
  }, [charger]);

  function afficherToast(message: string) {
    setToast(message);
    clearTimeout(minuteurToast.current);
    minuteurToast.current = setTimeout(() => setToast(null), 2400);
  }

  function aller(id: Ecran) {
    setEcran(id);
    if (id === "infos") setInfosVues(true);
    if (ecranRef.current) ecranRef.current.scrollTop = 0;
  }

  /** Mise à jour optimiste, puis état renvoyé par l'API ; en cas d'échec, retour à l'état précédent. */
  async function muter(optimiste: EtatMoi | null, action: () => Promise<EtatMoi>): Promise<boolean> {
    const avant = etatRef.current;
    if (optimiste) setEtat(optimiste);
    try {
      setEtat(await action());
      return true;
    } catch {
      setEtat(avant);
      afficherToast(ECHEC);
      return false;
    }
  }

  async function lancer(profil: Profil) {
    const encore = Boolean(etat?.participant);
    try {
      setEtat(await api.enregistrerProfil(profil));
    } catch {
      afficherToast("L'envoi n'a pas marché. Tes réponses sont gardées, réessaie dans un instant.");
      return;
    }
    setEdition(false);
    setMissionMeteoId(null);
    aller("parcours");
    afficherToast(encore ? "Tes réponses sont à jour. Tes missions ont été ajustées." : "C'est parti ! Sarah a reçu tes réponses.");
  }

  function changerStatut(id: number, statut: StatutMission, dureeMois?: DureeInscription) {
    if (!etat) return;
    setEnAttente((s) => {
      const n = new Set(s);
      if (statut === "yes") n.add(id);
      else n.delete(id);
      return n;
    });
    if (statut === "yes") {
      minuteurs.current.push(
        setTimeout(() => {
          setEnAttente((s) => {
            const n = new Set(s);
            n.delete(id);
            return n;
          });
          if (etatRef.current?.missions.find((m) => m.id === id)?.statut === "yes") afficherToast("Sarah t'a envoyé les détails de ta mission.");
        }, 1500),
      );
    }
    void muter(avecStatut(etat, id, statut), () => api.changerStatut(id, statut, dureeMois));
  }

  /** Rappel hebdomadaire d'une mission récurrente (itération 10) : aucune justification demandée. */
  async function repondreDisponibilite(id: number, semaine: string, disponible: boolean) {
    if (await muter(null, () => api.repondreDisponibilite(id, semaine, disponible))) {
      afficherToast(disponible ? "Merci, c'est noté !" : "C'est noté. Prends soin de toi cette semaine.");
    }
  }

  function missionFaite(id: number) {
    if (!etat) return;
    void muter(avecStatut(etat, id, "done"), () => api.changerStatut(id, "done"));
    setMissionMeteoId(id);
    aller("meteo");
  }

  function donnerMeteo(id: number) {
    setMissionMeteoId(id);
    aller("meteo");
  }

  async function envoyerMeteo(missionId: number, meteo: Meteo, mot: string) {
    try {
      await api.envoyerMeteo(missionId, meteo, mot);
    } catch (e) {
      afficherToast("L'envoi n'a pas marché. Réessaie dans un instant.");
      throw e;
    }
  }

  async function choisirFormat(format: FormatRdv) {
    if (!etat?.participant || formatEnCours) return;
    setFormatEnCours(true);
    const ok = await muter({ ...etat, participant: { ...etat.participant, formatRdv: format } }, () => api.choisirFormat(format));
    setFormatEnCours(false);
    if (ok) afficherToast(`Sarah a reçu ton choix : ${format === "visio" ? "visio" : "local"}.`);
  }

  function agendaAtelier() {
    telechargerFichier("atelier-collectif-activ.ics", genererIcs(ATELIER_COLLECTIF));
    afficherToast("Le fichier agenda est téléchargé. Ouvre-le pour l'ajouter.");
  }

  function agendaMission(m: MissionProposee) {
    const creneau = creneauDepuisDetails(m.details);
    if (!creneau) {
      afficherToast("Pas de date fixe pour celle-ci : tu choisis le moment qui te va, rien ne presse.");
      return;
    }
    const lieu = m.details.find(([k]) => k.toLowerCase() === "où")?.[1];
    telechargerFichier(
      `mission-${m.id}.ics`,
      genererIcs({ uid: `mission-${m.id}-${creneau.debut.annee}${creneau.debut.mois}${creneau.debut.jour}@filactiv`, titre: m.titre, ...creneau, lieu, description: `Objectif : ${m.objectif}` }),
    );
    afficherToast("Le fichier agenda est téléchargé. Ouvre-le pour l'ajouter.");
  }

  const participant = etat?.participant ?? null;
  const missions = etat?.missions ?? [];
  const restantes = missionsAChoisir(missions);

  let contenu: ReactNode;
  if (chargement === "en-cours") {
    contenu = (
      <section className="scr">
        <div className="centre" role="status">
          <p className="m">Un instant, on prépare ton fil…</p>
        </div>
      </section>
    );
  } else if (chargement === "erreur" || !etat) {
    contenu = (
      <section className="scr">
        <div className="centre">
          <h1>Le fil est un peu lent</h1>
          <p className="m">On n&apos;arrive pas à joindre le Fil ACTIV&apos; pour le moment. Ce n&apos;est pas de ta faute : vérifie ta connexion, puis réessaie.</p>
          <button
            className="btn"
            onClick={() => {
              setChargement("en-cours");
              void charger();
            }}
          >
            Réessayer
          </button>
        </div>
      </section>
    );
  } else if (!participant || edition) {
    contenu = (
      <Onboarding
        key={participant ? "edition" : "nouveau"}
        initial={participant ? brouillonDepuis(participant) : BROUILLON_VIDE}
        dejaLance={Boolean(participant)}
        onLancer={lancer}
        onPlusTard={() => afficherToast("Pas de souci. Ton lien reste valable, reviens quand tu veux.")}
        onFermer={() => setEdition(false)}
      />
    );
  } else {
    const missionMeteo = etat.meteoDeverrouillee || missions.some((m) => m.statut === "done") ? missionPourMeteo(missions, missionMeteoId) : null;
    contenu = (
      <>
        <section className="scr" ref={ecranRef}>
          {ecran === "parcours" && (
            <Parcours participant={participant} restantes={restantes} onVoirMissions={() => aller("missions")} onModifier={() => setEdition(true)} />
          )}
          {ecran === "missions" && (
            <Missions
              missions={missions}
              enAttente={enAttente}
              onStatut={changerStatut}
              onDisponibilite={(id, semaine, disponible) => void repondreDisponibilite(id, semaine, disponible)}
              onFaite={missionFaite}
              onMeteo={donnerMeteo}
              onAgenda={agendaMission}
              onModifier={() => setEdition(true)}
            />
          )}
          {ecran === "infos" && (
            <Infos
              afficherBienvenue={participant.etape === 0}
              formatRdv={participant.formatRdv}
              formatEnCours={formatEnCours}
              onFormat={choisirFormat}
              onAgendaAtelier={agendaAtelier}
              onLivret={() => setLivret(true)}
            />
          )}
          {ecran === "meteo" && (
            <MeteoEcran
              key={missionMeteo?.id ?? "verrou"}
              mission={missionMeteo}
              onEnvoyer={envoyerMeteo}
              onVoirMissions={() => aller("missions")}
              onRetour={() => {
                setMissionMeteoId(null);
                aller("parcours");
              }}
            />
          )}
        </section>
        <Navigation courant={ecran} aller={aller} pastilleMissions={restantes} pastilleInfos={infosVues ? 0 : 1} />
        {livret && <Livret onFermer={() => setLivret(false)} />}
      </>
    );
  }

  return (
    <div className="stage">
      {bandeau}
      <div className="phone">
        {contenu}
        <div className={`toast${toast ? " on" : ""}`} role="status">
          {toast}
        </div>
      </div>
      <p className="cap">Fil ACTIV&apos; pour L&apos;Burn · à ton rythme.</p>
    </div>
  );
}
