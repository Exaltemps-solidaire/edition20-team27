"use client";

import { useState } from "react";
import { LIBELLES_LIEU, dureeLisible } from "@/lib/activ";
import type { DureeInscription, MissionProposee, StatutMission } from "@/lib/api";
import { DUREES_INSCRIPTION, dateLisible, questionRappel } from "@/lib/recurrence";

type Props = {
  missions: MissionProposee[];
  /** Missions dont les détails de Sarah sont « en route » (effet de 1,5 s après « Je tente »). */
  enAttente: Set<number>;
  onStatut: (id: number, statut: StatutMission, dureeMois?: DureeInscription) => void;
  /** Réponse au rappel hebdomadaire d'une mission récurrente (itération 10). */
  onDisponibilite: (id: number, semaine: string, disponible: boolean) => void;
  onFaite: (id: number) => void;
  onMeteo: (id: number) => void;
  onAgenda: (m: MissionProposee) => void;
  onModifier: () => void;
};

export function Missions({ missions, enAttente, onStatut, onDisponibilite, onFaite, onMeteo, onAgenda, onModifier }: Props) {
  return (
    <>
      <div>
        <h1>Mes missions</h1>
        <p className="m">Des petits essais, sans pression. « Pas cette semaine » est un vrai choix.</p>
      </div>
      <div className="col">
        {missions.length === 0 ? (
          <div className="soft">Aucune mission ne correspond encore à tes réponses. Sarah t&apos;en proposera sur mesure lors de votre premier rendez-vous.</div>
        ) : (
          missions.map((m) => (
            <CarteMission
              key={m.id}
              mission={m}
              detailsEnRoute={enAttente.has(m.id)}
              onStatut={(s, duree) => onStatut(m.id, s, duree)}
              onDisponibilite={(semaine, disponible) => onDisponibilite(m.id, semaine, disponible)}
              onFaite={() => onFaite(m.id)}
              onMeteo={() => onMeteo(m.id)}
              onAgenda={() => onAgenda(m)}
            />
          ))
        )}
      </div>
      <button className="link" onClick={onModifier}>
        Modifier mes préférences
      </button>
    </>
  );
}

function CarteMission({
  mission: m,
  detailsEnRoute,
  onStatut,
  onDisponibilite,
  onFaite,
  onMeteo,
  onAgenda,
}: {
  mission: MissionProposee;
  detailsEnRoute: boolean;
  onStatut: (s: StatutMission, dureeMois?: DureeInscription) => void;
  onDisponibilite: (semaine: string, disponible: boolean) => void;
  onFaite: () => void;
  onMeteo: () => void;
  onAgenda: () => void;
}) {
  const [choixDuree, setChoixDuree] = useState(false);
  const semaine = m.rappel?.semaine ?? ""; // semaine ISO du prochain créneau, fournie par l'API
  if (m.statut === "done") {
    return (
      <div className="ok">
        <strong>Déjà faite :</strong> {m.titre}
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
        <button className="link" onClick={() => onStatut("open")}>
          Annuler
        </button>
      </div>
    );
  }
  const entete = (
    <>
      <div className="tags">
        <span className="tag t">{dureeLisible(m.duree)}</span>
        <span className="tag e">Effort {m.effort}</span>
        <span className="tag">{LIBELLES_LIEU[m.lieu] ?? m.lieu}</span>
        <span className="tag">{m.avec}</span>
      </div>
      <h2>{m.titre}</h2>
      <p className="m">Objectif : {m.objectif}</p>
      {m.pourquoi.length > 0 && <p className="why">Proposée pour toi : {m.pourquoi.join(" · ")}</p>}
      {m.formation && (
        <div className="soft">
          <strong>Formation requise avant de commencer : {m.formation.nom}</strong>
          <br />
          {m.formation.chemin}
        </div>
      )}
    </>
  );
  if (m.statut === "yes") {
    return (
      <article className="card">
        {entete}
        {detailsEnRoute ? (
          <p className="soft" aria-live="polite">
            C&apos;est noté ! Sarah t&apos;envoie les détails…
          </p>
        ) : (
          <div className="msg">
            <p className="who">
              <span className="av" aria-hidden="true">
                S
              </span>
              Sarah, ton accompagnante · à l&apos;instant
            </p>
            <p className="msg-txt">Merci d&apos;avoir choisi cette mission ! Voici tout ce qu&apos;il te faut :</p>
            <dl>
              {m.details.map(([k, v]) => (
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
        )}
        {m.recurrence && m.inscriteJusquau && (
          <p className="m small">Inscrite jusqu&apos;au {dateLisible(m.inscriteJusquau, true)}. Tu peux arrêter quand tu veux.</p>
        )}
        {m.recurrence && m.rappel && (
          <div className="soft" aria-live="polite">
            {m.disponibiliteSemaine == null ? (
              <>
                <p>{questionRappel(m.recurrence.jour, m.rappel.date)}</p>
                <div className="two">
                  <button className="btn" onClick={() => onDisponibilite(semaine, true)}>
                    Oui, je serai là
                  </button>
                  <button className="btn o" onClick={() => onDisponibilite(semaine, false)}>
                    Pas cette semaine
                  </button>
                </div>
              </>
            ) : (
              <>
                {m.disponibiliteSemaine
                  ? `C'est noté, on se retrouve ${m.recurrence.jour} ${dateLisible(m.rappel.date)}.`
                  : "Pas cette semaine, c'est noté. Prends soin de toi, rien à justifier."}
                <br />
                <button className="link" onClick={() => onDisponibilite(semaine, !m.disponibiliteSemaine)}>
                  Changer ma réponse
                </button>
              </>
            )}
          </div>
        )}
        <p className="m small">Après la mission, tu pourras donner ta météo.</p>
        <div className="two">
          <button className="btn" onClick={onFaite}>
            Mission faite
          </button>
          <button className="btn o" onClick={() => onStatut("open")}>
            Annuler
          </button>
        </div>
      </article>
    );
  }
  if (m.recurrence && choixDuree) {
    return (
      <article className="card">
        {entete}
        <p>
          Cette mission revient chaque {m.recurrence.jour} ({m.recurrence.horaire}). Pour combien de temps veux-tu t&apos;inscrire ?
        </p>
        <p className="m small">Sans engagement de résultat : tu peux arrêter quand tu veux.</p>
        <div className="two">
          {DUREES_INSCRIPTION.map((n) => (
            <button
              key={n}
              className="btn"
              onClick={() => {
                setChoixDuree(false);
                onStatut("yes", n);
              }}
            >
              {n} mois
            </button>
          ))}
        </div>
        <button className="link" onClick={() => setChoixDuree(false)}>
          Revenir
        </button>
      </article>
    );
  }
  return (
    <article className="card">
      {entete}
      <div className="two">
        {m.verrouillee ? (
          <button className="btn verrou" disabled title="Sarah débloque cette mission quand ta formation est validée">
            🔒 Après ta formation {m.formation?.nom}
          </button>
        ) : (
          <button className="btn" onClick={() => (m.recurrence ? setChoixDuree(true) : onStatut("yes"))}>
            Je tente
          </button>
        )}
        <button className="btn o" onClick={() => onStatut("no")}>
          Pas cette semaine
        </button>
      </div>
    </article>
  );
}
