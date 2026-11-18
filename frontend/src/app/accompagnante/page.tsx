"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { dateLisible, libelleDisponibilite } from "@/lib/recurrence";
import {
  CLE_SESSION_CODE,
  ETAPES_PARCOURS,
  ErreurAccompagnante,
  LIBELLES_ENERGIE,
  LIBELLES_ENVIE,
  LIBELLES_EVITER,
  LIBELLES_FORMAT,
  LIBELLES_LIEU,
  LIBELLES_METEO,
  LIBELLES_STATUT,
  LIBELLES_TEMPS,
  changerEtape,
  chargerParticipants,
  compterPluiesRecentes,
  compterSurEngagements,
  estPluieRecente,
  formaterDate,
  libelle,
  libelleEtape,
  messageErreur,
  pluiesRecentes,
  pourcentageCharge,
  trierParticipants,
  type Charge,
  type Meteo,
  type StatutMission,
  type SuiviParticipant,
} from "@/lib/accompagnante";
import { ecrirePersona } from "@/lib/personas";
import { CHEMIN_FORMATION } from "@/lib/formation";
import { validerFormation } from "@/lib/accompagnante";
import styles from "./page.module.css";

/** Jeton envoyé quand l'API est en accès libre (PRD : pas de connexion) ; ignoré par le serveur dans ce mode. */
const ACCES_LIBRE = "acces-libre";

/** Retour à l'écran « Qui êtes-vous ? ». */
function changerDeRole() {
  ecrirePersona(null);
  window.location.assign("/");
}

type EtatEtape = { etat: "en-cours" | "ok" | "erreur"; message: string };

function lireCode(): string | null {
  try {
    return sessionStorage.getItem(CLE_SESSION_CODE);
  } catch {
    return null;
  }
}

function ecrireCode(code: string | null) {
  try {
    if (code) sessionStorage.setItem(CLE_SESSION_CODE, code);
    else sessionStorage.removeItem(CLE_SESSION_CODE);
  } catch {
    // stockage indisponible (navigation privée stricte) : la session tient en mémoire
  }
}

function messageDe(e: unknown): string {
  return e instanceof ErreurAccompagnante ? e.message : messageErreur("serveur");
}

const ICONES_METEO: Record<Meteo, React.ReactNode> = {
  soleil: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#B5651D" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" />
    </svg>
  ),
  nuage: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4A4E5E" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M7 19h10a4 4 0 000-8 5 5 0 00-9.6 1.5A3.3 3.3 0 007 19z" />
    </svg>
  ),
  pluie: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2F33A8" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
      <path d="M7 15h10a4 4 0 000-8 5 5 0 00-9.6 1.5A3.3 3.3 0 007 15z" />
      <path d="M8 18l-1 2M12 18l-1 2M16 18l-1 2" />
    </svg>
  ),
};

const CLASSE_STATUT: Record<StatutMission, string> = {
  open: styles.statutOpen,
  yes: styles.statutYes,
  no: styles.statutNo,
  done: styles.statutDone,
};

export default function Accompagnante() {
  const [code, setCode] = useState<string | null>(null);
  const [saisie, setSaisie] = useState("");
  const [erreurConnexion, setErreurConnexion] = useState<string | null>(null);
  const [connexionEnCours, setConnexionEnCours] = useState(false);
  const [participants, setParticipants] = useState<SuiviParticipant[] | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreurListe, setErreurListe] = useState<string | null>(null);
  const [etats, setEtats] = useState<Record<string, EtatEtape>>({});
  const [maintenant, setMaintenant] = useState(() => new Date());

  const deconnecter = useCallback((message: string | null = null) => {
    ecrireCode(null);
    setCode(null);
    setParticipants(null);
    setEtats({});
    setErreurListe(null);
    setErreurConnexion(message);
  }, []);

  const charger = useCallback(
    async (c: string) => {
      setChargement(true);
      setErreurListe(null);
      try {
        const liste = await chargerParticipants(c);
        setParticipants(liste);
        setMaintenant(new Date());
      } catch (e) {
        if (e instanceof ErreurAccompagnante && (e.type === "code-incorrect" || e.type === "non-configure")) {
          deconnecter(e.message);
        } else {
          setErreurListe(messageDe(e));
        }
      } finally {
        setChargement(false);
      }
    },
    [deconnecter],
  );

  // Reprise de session : le code vit dans sessionStorage, lu après le montage (page exportée en statique).
  // Sans code, on tente l'accès libre (PRD de la version de test, ACCOMPAGNANTE_ACCES_LIBRE=1 côté API) :
  // si le serveur refuse, on reste simplement sur l'écran de connexion.
  useEffect(() => {
    const enregistre = lireCode();
    queueMicrotask(() => {
      if (enregistre) {
        setCode(enregistre);
        void charger(enregistre);
        return;
      }
      chargerParticipants(ACCES_LIBRE).then(
        (liste) => {
          setCode(ACCES_LIBRE);
          setParticipants(liste);
          setMaintenant(new Date());
        },
        () => {},
      );
    });
  }, [charger]);

  async function entrer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const c = saisie.trim();
    if (!c) {
      setErreurConnexion("Saisis ton code d'accès.");
      return;
    }
    setConnexionEnCours(true);
    setErreurConnexion(null);
    try {
      const liste = await chargerParticipants(c);
      ecrireCode(c);
      setCode(c);
      setSaisie("");
      setParticipants(liste);
      setMaintenant(new Date());
    } catch (err) {
      setErreurConnexion(messageDe(err));
    } finally {
      setConnexionEnCours(false);
    }
  }

  async function modifierEtape(p: SuiviParticipant, etape: number) {
    if (!code || etape === p.etape) return;
    setEtats((s) => ({ ...s, [p.id]: { etat: "en-cours", message: "Enregistrement…" } }));
    try {
      await changerEtape(code, p.id, etape);
      setParticipants((liste) => liste?.map((x) => (x.id === p.id ? { ...x, etape } : x)) ?? null);
      setEtats((s) => ({ ...s, [p.id]: { etat: "ok", message: `Étape enregistrée : ${libelleEtape(etape)}` } }));
    } catch (err) {
      if (err instanceof ErreurAccompagnante && err.type === "code-incorrect") {
        deconnecter(err.message);
        return;
      }
      setEtats((s) => ({ ...s, [p.id]: { etat: "erreur", message: messageDe(err) } }));
    }
  }

  if (!code) {
    return (
      <main className={styles.page}>
        <div className={styles.connexion}>
          <p className={styles.marque}>Fil ACTIV&apos;</p>
          <h1>Espace accompagnante</h1>
          <p className="m">Saisis le code d&apos;accès qui t&apos;a été transmis pour suivre les participantes.</p>
          <form className={styles.formConnexion} onSubmit={entrer} noValidate>
            <label htmlFor="code-acces">Code d&apos;accès</label>
            <input
              id="code-acces"
              className={styles.champ}
              type="password"
              autoComplete="current-password"
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              aria-invalid={erreurConnexion ? true : undefined}
              aria-describedby={erreurConnexion ? "erreur-connexion" : undefined}
            />
            {erreurConnexion && (
              <p id="erreur-connexion" className={styles.erreur} role="alert">
                {erreurConnexion}
              </p>
            )}
            <button type="submit" className="btn" disabled={connexionEnCours}>
              {connexionEnCours ? "Vérification…" : "Entrer"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  const triees = participants ? trierParticipants(participants, maintenant) : [];
  const nbPluies = participants ? compterPluiesRecentes(participants, maintenant) : 0;
  const nbSurEngagements = participants ? compterSurEngagements(participants) : 0;

  return (
    <main className={styles.page}>
      <header className={styles.entete}>
        <div>
          <p className={styles.marque}>Fil ACTIV&apos; · Accompagnante</p>
          <h1>Suivi des participantes</h1>
        </div>
        <div className={styles.actions}>
          <button type="button" className="btn" onClick={() => void charger(code)} disabled={chargement}>
            {chargement ? "Actualisation…" : "Actualiser"}
          </button>
          {code !== ACCES_LIBRE && (
            <button type="button" className="btn o" onClick={() => deconnecter()}>
              Se déconnecter
            </button>
          )}
          <button type="button" className="btn o" onClick={changerDeRole}>
            Changer de rôle
          </button>
        </div>
      </header>
      <p className="m">
        Tu incarnes <b>Sarah</b> · La chargée de remobilisation
      </p>

      <p className={styles.srOnly} role="status">
        {chargement ? "Chargement de la liste…" : participants ? `Liste à jour : ${participants.length} participante(s).` : ""}
      </p>

      {erreurListe && (
        <p className={styles.erreur} role="alert">
          {erreurListe}
        </p>
      )}

      {participants && (
        <section aria-labelledby="titre-resume" className={styles.resume}>
          <h2 id="titre-resume" className={styles.srOnly}>
            Résumé
          </h2>
          <div className={styles.chiffre}>
            <b>{participants.length}</b>
            <span>{participants.length > 1 ? "participantes" : "participante"}</span>
          </div>
          <div className={`${styles.chiffre} ${nbPluies > 0 ? styles.chiffreAlerte : ""}`}>
            <b>{nbPluies}</b>
            <span>
              {nbPluies > 1 ? "retours « C'était trop » à traiter" : "retour « C'était trop » à traiter"}
              <small> (moins de 14 jours)</small>
            </span>
          </div>
          <div className={`${styles.chiffre} ${nbSurEngagements > 0 ? styles.chiffreAlerte : ""}`}>
            <b>{nbSurEngagements}</b>
            <span>
              {nbSurEngagements > 1 ? "BURN'ettes engagées au-delà de leur temps" : "BURN'ette engagée au-delà de son temps"}
            </span>
          </div>
        </section>
      )}

      {participants && participants.length === 0 && (
        <p className={`card ${styles.vide}`}>
          Aucune participante pour l&apos;instant. Partage le lien de l&apos;application pour qu&apos;elles lancent leur parcours.
        </p>
      )}

      {triees.length > 0 && (
        <section aria-labelledby="titre-liste">
          <h2 id="titre-liste" className={styles.titreListe}>
            Participantes
          </h2>
          <ul className={styles.liste}>
            {triees.map((p) => (
              <CarteParticipante
                key={p.id}
                p={p}
                maintenant={maintenant}
                etat={etats[p.id]}
                code={code}
                onEtape={(etape) => void modifierEtape(p, etape)}
              />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function CarteParticipante({
  p,
  maintenant,
  etat,
  code,
  onEtape,
}: {
  p: SuiviParticipant;
  maintenant: Date;
  etat: EtatEtape | undefined;
  code: string;
  onEtape: (etape: number) => void;
}) {
  const aRecontacter = pluiesRecentes(p, maintenant) > 0;
  const idSelect = `etape-${p.id}`;
  const idTitre = `prenom-${p.id}`;

  return (
    <li className={`${styles.carte} ${aRecontacter ? styles.carteAlerte : ""}`} aria-labelledby={idTitre}>
      <div className={styles.carteTete}>
        <div>
          <h3 id={idTitre} className={styles.prenom}>
            {p.prenom}
          </h3>
          <p className="m small">Parcours lancé {formaterDate(p.lanceLe, maintenant)}</p>
        </div>
        {(aRecontacter || p.charge?.surEngagement) && (
          <div className={styles.badges}>
            {aRecontacter && <span className={styles.badgeAlerte}>À recontacter</span>}
            {p.charge?.surEngagement && <span className={styles.badgeAlerte}>Au-delà de son temps</span>}
          </div>
        )}
      </div>

      {p.charge && <JaugeCharge charge={p.charge} />}

      <div className={styles.etape}>
        <label htmlFor={idSelect}>Étape actuelle</label>
        <select
          id={idSelect}
          className={styles.champ}
          value={p.etape}
          disabled={etat?.etat === "en-cours"}
          onChange={(e) => onEtape(Number(e.target.value))}
        >
          {ETAPES_PARCOURS.map((titre, i) => (
            <option key={titre} value={i}>
              {i + 1}. {titre}
            </option>
          ))}
        </select>
        <p
          role="status"
          className={etat?.etat === "erreur" ? styles.erreur : etat?.etat === "ok" ? styles.confirme : styles.enCours}
        >
          {etat?.message ?? ""}
        </p>
      </div>

      <div className={styles.grille}>
        <section>
          <h4 className={styles.sousTitre}>Point de départ</h4>
          <dl className={styles.dl}>
            <dt>Énergie</dt>
            <dd>{libelle(LIBELLES_ENERGIE, p.energie)}</dd>
            <dt>Temps / semaine</dt>
            <dd>{libelle(LIBELLES_TEMPS, p.temps)}</dd>
            <dt>Où</dt>
            <dd>{p.lieux.map((l) => libelle(LIBELLES_LIEU, l)).join(", ") || "—"}</dd>
            <dt>Envies</dt>
            <dd>{p.envies.map((x) => libelle(LIBELLES_ENVIE, x)).join(", ") || "Pas encore précisé"}</dd>
            <dt>À éviter</dt>
            <dd>{p.eviter.map((x) => libelle(LIBELLES_EVITER, x)).join(", ") || "Rien de signalé"}</dd>
            <dt>Engagement</dt>
            <dd>{p.engagement ? "S'est engagée à respecter ses missions" : "Case pas cochée"}</dd>
            <dt>Format de RDV</dt>
            <dd>{p.formatRdv ? libelle(LIBELLES_FORMAT, p.formatRdv) : "Pas encore choisi"}</dd>
            <dt>Formation</dt>
            <dd>
              <FormationsValidees p={p} code={code} />
            </dd>
          </dl>
        </section>

        <section>
          <h4 className={styles.sousTitre}>Son mot pour Sarah</h4>
          {p.mot.trim() ? (
            <blockquote className={styles.mot}>{p.mot}</blockquote>
          ) : (
            <p className="m small">Pas de mot.</p>
          )}

          <h4 className={styles.sousTitre}>Missions</h4>
          {p.missions.length === 0 ? (
            <p className="m small">Aucune mission proposée.</p>
          ) : (
            <ul className={styles.missions}>
              {p.missions.map((m) => (
                <li key={m.id}>
                  <span>
                    {m.titre}
                    {m.recurrence && m.inscriteJusquau && (
                      <small className="m small">
                        <br />
                        Inscrite jusqu&apos;au {dateLisible(m.inscriteJusquau, true)} · cette semaine : {libelleDisponibilite(m.disponibiliteSemaine)}
                      </small>
                    )}
                  </span>
                  <span className={`${styles.statut} ${CLASSE_STATUT[m.statut] ?? ""}`}>{libelle(LIBELLES_STATUT, m.statut)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section>
        <h4 className={styles.sousTitre}>Retours météo</h4>
        {p.retours.length === 0 ? (
          <p className="m small">Pas encore de retour.</p>
        ) : (
          <ul className={styles.retours}>
            {p.retours.map((r, i) => {
              const alerte = estPluieRecente(r, maintenant);
              return (
                <li key={`${r.missionId}-${r.recuLe}-${i}`} className={`${styles.retour} ${r.meteo === "pluie" ? styles.retourPluie : ""}`}>
                  <span className={styles.icone}>{ICONES_METEO[r.meteo]}</span>
                  <div className={styles.retourTexte}>
                    <p>
                      <b>{libelle(LIBELLES_METEO, r.meteo)}</b>
                      {alerte && <span className={styles.badgeAlerte}>À recontacter</span>}
                    </p>
                    <p className="m small">
                      {r.titreMission} · <time dateTime={r.recuLe}>{formaterDate(r.recuLe, maintenant)}</time>
                    </p>
                    {r.mot.trim() && <p className={styles.retourMot}>« {r.mot} »</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </li>
  );
}

type IdFormation = "tronc-commun" | "moderation" | "pair-aidance";

/** Chemin de formation : Sarah valide chaque étape ; la participante la voit dans son Parcours. */
function FormationsValidees({ p, code }: { p: SuiviParticipant; code: string }) {
  const [validees, setValidees] = useState<IdFormation[]>(p.formationsValidees ?? []);
  const [message, setMessage] = useState("");

  async function basculer(id: IdFormation, validee: boolean) {
    const avant = validees;
    setValidees(validee ? [...validees, id] : validees.filter((x) => x !== id));
    try {
      const r = await validerFormation(code, p.id, id, validee);
      setValidees(r.formationsValidees);
      setMessage(validee ? "Étape validée." : "Validation retirée.");
    } catch {
      setValidees(avant);
      setMessage("Ça n'a pas marché, réessaie.");
    }
  }

  return (
    <fieldset className={styles.formations}>
      <legend className={styles.srOnly}>Formations validées pour {p.prenom}</legend>
      {CHEMIN_FORMATION.map((e) => (
        <label key={e.id}>
          <input type="checkbox" checked={validees.includes(e.id)} onChange={(ev) => void basculer(e.id, ev.target.checked)} />{" "}
          {e.titre}
          {e.option ? " (option)" : ""}
        </label>
      ))}
      <span role="status" className="auteur">
        {message}
      </span>
    </fieldset>
  );
}

/** Jauge douce : minutes engagées par semaine sur le temps qu'elle a dit pouvoir donner. */
function JaugeCharge({ charge }: { charge: Charge }) {
  const fin = new Date(charge.finEngagement);
  return (
    <div className={styles.charge}>
      <p className={styles.chargeTexte}>
        <b>{charge.minutesEngagees} min engagées</b> / {charge.minutesDisponibles} min par semaine
      </p>
      <div className={styles.jauge} aria-hidden="true">
        <div
          className={`${styles.jaugeRemplie} ${charge.surEngagement ? styles.jaugeAuDela : ""}`}
          style={{ width: `${pourcentageCharge(charge)}%` }}
        />
      </div>
      {charge.surEngagement && (
        <p className={styles.chargeConseil}>Propose-lui d&apos;alléger : une pause est toujours possible.</p>
      )}
      {!Number.isNaN(fin.getTime()) && (
        <p className="m small">
          Engagement jusqu&apos;au {fin.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} (un an au plus)
        </p>
      )}
    </div>
  );
}
