"use client";

import { useEffect, useRef, useState } from "react";
import {
  ETAPES,
  LIBELLES_ETAPE,
  MESSAGES_METEO,
  MISSIONS_INITIALES,
  changerStatut,
  missionsAChoisir,
  recevoirDetails,
  texteHero,
  type Meteo,
  type Mission,
} from "@/lib/activ";

type Ecran = "parcours" | "missions" | "infos" | "meteo";

const Coche = ({ taille = 16 }: { taille?: number }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M5 12l5 5 9-10" />
  </svg>
);

const Soleil = ({ couleur = "currentColor", taille = 22 }: { couleur?: string; taille?: number }) => (
  <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" />
  </svg>
);

const CHOIX_METEO: { valeur: Meteo; libelle: string; icone: React.ReactNode }[] = [
  { valeur: "soleil", libelle: "Ça m'a fait du bien", icone: <Soleil couleur="#B5651D" taille={38} /> },
  {
    valeur: "nuage",
    libelle: "Mitigé",
    icone: (
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#4A4E5E" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <path d="M7 19h10a4 4 0 000-8 5 5 0 00-9.6 1.5A3.3 3.3 0 007 19z" />
      </svg>
    ),
  },
  {
    valeur: "pluie",
    libelle: "C'était trop",
    icone: (
      <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="#2F33A8" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <path d="M7 15h10a4 4 0 000-8 5 5 0 00-9.6 1.5A3.3 3.3 0 007 15z" />
        <path d="M8 18l-1 2M12 18l-1 2M16 18l-1 2" />
      </svg>
    ),
  },
];

export default function FilActiv() {
  const [ecran, setEcran] = useState<Ecran>("parcours");
  const [etapeOuverte, setEtapeOuverte] = useState(2);
  const [missions, setMissions] = useState<Mission[]>(MISSIONS_INITIALES);
  const [infosVues, setInfosVues] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [missionMeteo, setMissionMeteo] = useState<Mission | null>(MISSIONS_INITIALES[2]);
  const [meteo, setMeteo] = useState<Meteo | null>(null);
  const [mot, setMot] = useState("");
  const [envoi, setEnvoi] = useState<"idle" | "en-cours" | "envoye">("idle");
  const minuteurToast = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const ecranRef = useRef<HTMLElement>(null);

  const restantes = missionsAChoisir(missions);

  useEffect(() => () => clearTimeout(minuteurToast.current), []);

  function afficherToast(message: string) {
    setToast(message);
    clearTimeout(minuteurToast.current);
    minuteurToast.current = setTimeout(() => setToast(null), 2200);
  }

  function aller(id: Ecran) {
    setEcran(id);
    if (id === "infos") setInfosVues(true);
    ecranRef.current?.scrollTo({ top: 0 });
  }

  function tenter(id: number) {
    setMissions((ms) => changerStatut(ms, id, "yes"));
    setTimeout(() => {
      setMissions((ms) => recevoirDetails(ms, id));
      afficherToast("Sarah t'a envoyé les détails de ta mission.");
    }, 1500);
  }

  function ouvrirMeteo(id: number) {
    const m = missions.find((x) => x.id === id);
    if (!m) return;
    if (m.statut === "yes") setMissions((ms) => changerStatut(ms, id, "done"));
    setMissionMeteo(m);
    setMeteo(null);
    setMot("");
    setEnvoi("idle");
    aller("meteo");
  }

  async function envoyer() {
    if (!meteo || !missionMeteo || envoi === "en-cours") return;
    setEnvoi("en-cours");
    try {
      const rep = await fetch("/api/v1/meteo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ missionId: missionMeteo.id, meteo, mot: mot.trim() }),
      });
      if (!rep.ok) throw new Error(String(rep.status));
      setEnvoi("envoye");
    } catch {
      setEnvoi("idle");
      afficherToast("L'envoi n'a pas marché. Réessaie dans un instant.");
    }
  }

  return (
    <div className="stage">
      <div className="phone">
        {ecran === "parcours" && (
          <section className="scr" ref={ecranRef}>
            <div>
              <p className="m">Bonjour Camille</p>
              <h1>Ma feuille de route</h1>
              <p className="m">Programme ACTIV&apos; · à ton rythme</p>
            </div>
            <div className="hero">
              <small>TU ES ICI</small>
              <h2>Étape 3 · Se tester en mission</h2>
              <p className="hero-txt">{texteHero(restantes)}</p>
              <button className="btn w" onClick={() => aller("missions")}>
                Voir mes missions
              </button>
            </div>
            <ol className="steps">
              {ETAPES.map((e, i) => (
                <li key={e.titre}>
                  <button className={`step ${e.statut}`} aria-expanded={etapeOuverte === i} onClick={() => setEtapeOuverte(etapeOuverte === i ? -1 : i)}>
                    <span className="dot">{e.statut === "done" ? <Coche /> : i + 1}</span>
                    <span>
                      <b>
                        {i + 1} · {e.titre}
                      </b>
                      <span className="s">{LIBELLES_ETAPE[e.statut]}</span>
                      {etapeOuverte === i && <span className="det">{e.detail}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </section>
        )}

        {ecran === "missions" && (
          <section className="scr" ref={ecranRef}>
            <div>
              <h1>Mes missions</h1>
              <p className="m">Des petits essais, sans pression. « Pas cette semaine » est un vrai choix.</p>
            </div>
            <div className="col">
              {missions.map((m) => (
                <CarteMission
                  key={m.id}
                  mission={m}
                  onTenter={() => tenter(m.id)}
                  onRefuser={() => setMissions((ms) => changerStatut(ms, m.id, "no"))}
                  onAnnuler={() => setMissions((ms) => changerStatut(ms, m.id, "open"))}
                  onMeteo={() => ouvrirMeteo(m.id)}
                  onAgenda={() => afficherToast("Ajouté à ton agenda.")}
                />
              ))}
            </div>
          </section>
        )}

        {ecran === "infos" && (
          <section className="scr" ref={ecranRef}>
            <div>
              <h1>Le fil d&apos;infos</h1>
              <p className="m">Tout ce que l&apos;équipe partage, au même endroit. Plus besoin de fouiller tes mails ou Facebook.</p>
            </div>
            <article className="card row">
              <div className="date">
                <span>jeu.</span>
                <b>20</b>
              </div>
              <div>
                <p className="kind">Rendez-vous</p>
                <h2 className="h-card">Atelier collectif · 14 h</h2>
                <p className="m">Au local de l&apos;association</p>
                <button className="link" onClick={() => afficherToast("Ajouté à ton agenda.")}>
                  Ajouter à mon agenda
                </button>
              </div>
            </article>
            <article className="card">
              <p className="kind doc">Document</p>
              <h2 className="h-card">Le livret ACTIV&apos;</h2>
              <p className="m">Les étapes, les contacts, la charte du groupe.</p>
              <button className="link" onClick={() => afficherToast("Le livret s'ouvrira ici.")}>
                Ouvrir le livret
              </button>
            </article>
            <article className="card">
              <p className="kind equipe">Message de l&apos;équipe</p>
              <h2 className="h-card">Pas d&apos;atelier le 11 décembre</h2>
              <p className="m">Le local est fermé ce jour-là. Les missions de la semaine restent ouvertes.</p>
              <p className="auteur">Sarah, accompagnante · hier</p>
            </article>
          </section>
        )}

        {ecran === "meteo" && (
          <section className="scr" ref={ecranRef}>
            {envoi !== "envoye" ? (
              <>
                <div>
                  <p className="m">Mission : {(missionMeteo?.titre ?? "").toLowerCase()}</p>
                  <h1>Comment ça s&apos;est passé ?</h1>
                  <p className="m">Un clic suffit. Il n&apos;y a pas de mauvaise réponse.</p>
                </div>
                <div className="wxs" role="group" aria-label="Ma météo">
                  {CHOIX_METEO.map((c) => (
                    <button key={c.valeur} className="wx" aria-pressed={meteo === c.valeur} onClick={() => setMeteo(c.valeur)}>
                      {c.icone}
                      {c.libelle}
                    </button>
                  ))}
                </div>
                <label htmlFor="mot">Un mot pour ton accompagnante ? (facultatif)</label>
                <textarea id="mot" rows={3} maxLength={500} placeholder="Ce qui t'a aidée, ce qui a été difficile…" value={mot} onChange={(e) => setMot(e.target.value)} />
                <p className="ok">Seule Sarah, ton accompagnante, voit ta réponse. Elle s&apos;en sert pour ajuster le rythme de tes missions.</p>
                <button className="btn" disabled={!meteo || envoi === "en-cours"} onClick={envoyer}>
                  {envoi === "en-cours" ? "Envoi…" : "Envoyer"}
                </button>
              </>
            ) : (
              <div className="done">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#2F7D6D" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M7 12l3.5 3.5L17 9" />
                </svg>
                <h1>Merci, c&apos;est envoyé</h1>
                <p className="m">{meteo ? MESSAGES_METEO[meteo] : ""}</p>
                <button className="btn" onClick={() => aller("parcours")}>
                  Retour à ma feuille de route
                </button>
              </div>
            )}
          </section>
        )}

        <div className={`toast${toast ? " on" : ""}`} role="status">
          {toast}
        </div>

        <nav aria-label="Navigation principale">
          <Onglet id="parcours" courant={ecran} aller={aller} libelle="Parcours">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 19l5-14 6 10 5-7" />
            </svg>
          </Onglet>
          <Onglet id="missions" courant={ecran} aller={aller} libelle="Missions" pastille={restantes}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <rect x="4" y="5" width="16" height="14" rx="3" />
              <path d="M8 10h8M8 14h5" />
            </svg>
          </Onglet>
          <Onglet id="infos" courant={ecran} aller={aller} libelle="Infos" pastille={infosVues ? 0 : 1}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8" />
              <path d="M10 20a2 2 0 004 0" />
            </svg>
          </Onglet>
          <Onglet id="meteo" courant={ecran} aller={aller} libelle="Météo">
            <Soleil />
          </Onglet>
        </nav>
      </div>
      <p className="cap">Fil ACTIV&apos; pour L&apos;Burn. Prénoms, étapes et missions sont des exemples.</p>
    </div>
  );
}

function Onglet({
  id,
  courant,
  aller,
  libelle,
  pastille = 0,
  children,
}: {
  id: Ecran;
  courant: Ecran;
  aller: (id: Ecran) => void;
  libelle: string;
  pastille?: number;
  children: React.ReactNode;
}) {
  return (
    <button className="tab" aria-current={courant === id ? "page" : undefined} onClick={() => aller(id)}>
      {children}
      {libelle}
      {pastille > 0 && <span className="badge">{pastille}</span>}
    </button>
  );
}

function CarteMission({
  mission: m,
  onTenter,
  onRefuser,
  onAnnuler,
  onMeteo,
  onAgenda,
}: {
  mission: Mission;
  onTenter: () => void;
  onRefuser: () => void;
  onAnnuler: () => void;
  onMeteo: () => void;
  onAgenda: () => void;
}) {
  if (m.statut === "done") {
    return (
      <div className="ok">
        <strong>Déjà faite :</strong> {m.titre}
        {m.id === 3 ? " (lundi)" : ""}
        <br />
        <button className="link" onClick={onMeteo}>
          Donner ma météo
        </button>
      </div>
    );
  }
  if (m.statut === "no") {
    return (
      <div className="soft">
        « {m.titre} » : pas cette semaine, c&apos;est noté. Elle reviendra plus tard.
        <br />
        <button className="link" onClick={onAnnuler}>
          Annuler
        </button>
      </div>
    );
  }
  const entete = (
    <>
      <div className="tags">
        <span className="tag t">{m.duree}</span>
        <span className="tag e">{m.effort}</span>
        <span className="tag">{m.mode}</span>
      </div>
      <h2>{m.titre}</h2>
      <p className="m">Objectif : {m.objectif}</p>
    </>
  );
  if (m.statut === "yes") {
    return (
      <article className="card">
        {entete}
        {m.detailsRecus ? (
          <div className="msg">
            <p className="who">
              <span className="av" aria-hidden="true">
                S
              </span>
              Sarah, ton accompagnante · à l&apos;instant
            </p>
            <p className="msg-txt">Merci d&apos;avoir choisi cette mission ! Voici tout ce qu&apos;il te faut :</p>
            <dl>
              {(m.details ?? []).map(([k, v]) => (
                <div key={k} className="dl-row">
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <p className="msg-note">Si le jour même ça ne va pas, préviens-moi, sans te justifier. Ce n&apos;est pas un échec.</p>
            <button className="link" onClick={onAgenda}>
              Ajouter à mon agenda
            </button>
          </div>
        ) : (
          <p className="soft" aria-live="polite">
            C&apos;est noté ! Sarah t&apos;envoie les détails…
          </p>
        )}
        <p className="m small">Après la mission, tu pourras donner ta météo.</p>
        <div className="two">
          <button className="btn" onClick={onMeteo}>
            Mission faite
          </button>
          <button className="btn o" onClick={onAnnuler}>
            Annuler
          </button>
        </div>
      </article>
    );
  }
  return (
    <article className="card">
      {entete}
      <div className="two">
        <button className="btn" onClick={onTenter}>
          Je tente
        </button>
        <button className="btn o" onClick={onRefuser}>
          Pas cette semaine
        </button>
      </div>
    </article>
  );
}
