"use client";

import { useState } from "react";
import { ETAPES, LIBELLES, LIBELLES_ETAPE, statutEtape, texteHero } from "@/lib/activ";
import type { Participant } from "@/lib/api";
import { Coche } from "./Icones";

type Props = {
  participant: Participant;
  restantes: number;
  onVoirMissions: () => void;
  onModifier: () => void;
};

export function Parcours({ participant: p, restantes, onVoirMissions, onModifier }: Props) {
  const courante = Math.min(Math.max(p.etape, 0), ETAPES.length - 1);
  const [ouverte, setOuverte] = useState(courante);

  return (
    <>
      <div>
        <p className="m">Bonjour {p.prenom}</p>
        <h1>Ma feuille de route</h1>
        <p className="m">Programme ACTIV&apos; · à ton rythme</p>
      </div>
      <div className="hero">
        <small>TU ES ICI</small>
        <h2>
          Étape {courante + 1} · {ETAPES[courante][0]}
        </h2>
        <p className="hero-txt">{texteHero(courante, restantes)}</p>
        <button className="btn w" onClick={onVoirMissions}>
          Voir mes missions
        </button>
      </div>
      <ol className="steps">
        {ETAPES.map(([titre, detail], i) => {
          const s = statutEtape(i, courante);
          return (
            <li key={titre} aria-current={s === "now" ? "step" : undefined}>
              <button className={`step ${s}`} aria-expanded={ouverte === i} onClick={() => setOuverte(ouverte === i ? -1 : i)}>
                <span className="dot">{s === "done" ? <Coche /> : i + 1}</span>
                <span>
                  <b>
                    {i + 1} · {titre}
                  </b>
                  <span className="s">{LIBELLES_ETAPE[s]}</span>
                  {ouverte === i && <span className="det">{detail}</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="card">
        <h2 className="h-card">Ton point de départ</h2>
        <div className="tags">
          <span className="tag t">{LIBELLES[p.energie]}</span>
          <span className="tag e">{LIBELLES[String(p.temps)]} / semaine</span>
          {p.lieux.map((l) => (
            <span key={l} className="tag">
              {LIBELLES[l]}
            </span>
          ))}
        </div>
        <button className="link" onClick={onModifier}>
          Modifier mes réponses
        </button>
      </div>
    </>
  );
}
