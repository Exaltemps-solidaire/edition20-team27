"use client";

import { LIBELLES_LIEU, dureeLisible } from "@/lib/activ";
import type { MissionProposee, StatutMission } from "@/lib/api";

type Props = {
  missions: MissionProposee[];
  /** Missions dont les détails de Sarah sont « en route » (effet de 1,5 s après « Je tente »). */
  enAttente: Set<number>;
  onStatut: (id: number, statut: StatutMission) => void;
  onFaite: (id: number) => void;
  onMeteo: (id: number) => void;
  onAgenda: (m: MissionProposee) => void;
  onModifier: () => void;
};

export function Missions({ missions, enAttente, onStatut, onFaite, onMeteo, onAgenda, onModifier }: Props) {
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
              onStatut={(s) => onStatut(m.id, s)}
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
  onFaite,
  onMeteo,
  onAgenda,
}: {
  mission: MissionProposee;
  detailsEnRoute: boolean;
  onStatut: (s: StatutMission) => void;
  onFaite: () => void;
  onMeteo: () => void;
  onAgenda: () => void;
}) {
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
  return (
    <article className="card">
      {entete}
      <div className="two">
        <button className="btn" onClick={() => onStatut("yes")}>
          Je tente
        </button>
        <button className="btn o" onClick={() => onStatut("no")}>
          Pas cette semaine
        </button>
      </div>
    </article>
  );
}
