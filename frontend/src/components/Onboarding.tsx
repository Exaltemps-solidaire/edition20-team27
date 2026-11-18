"use client";

import { useEffect, useRef, useState } from "react";
import { QUESTIONS, choisirOption, prenomValide, questionValide, valeurRecap, versProfil, type Brouillon } from "@/lib/activ";
import type { Profil } from "@/lib/api";
import { CheminEtapes } from "./Icones";

type Props = {
  initial: Brouillon;
  /** Vrai quand la participante modifie ses réponses après le lancement. */
  dejaLance: boolean;
  onLancer: (profil: Profil) => Promise<void>;
  onPlusTard: () => void;
  onFermer: () => void;
};

export function Onboarding({ initial, dejaLance, onLancer, onPlusTard, onFermer }: Props) {
  const [b, setB] = useState<Brouillon>(initial);
  const [etape, setEtape] = useState(dejaLance ? 1 : 0);
  const [envoi, setEnvoi] = useState(false);
  const ecran = useRef<HTMLElement>(null);
  const titre = useRef<HTMLHeadingElement>(null);
  const n = QUESTIONS.length;

  useEffect(() => {
    if (ecran.current) ecran.current.scrollTop = 0;
    if (etape > 0) titre.current?.focus();
  }, [etape]);

  async function lancer() {
    const profil = versProfil(b);
    if (!profil || envoi) return;
    setEnvoi(true);
    try {
      await onLancer(profil);
    } finally {
      setEnvoi(false);
    }
  }

  const retour = (
    <button className="link" onClick={() => setEtape(etape - 1)}>
      ← Retour
    </button>
  );

  if (etape === 0) {
    return (
      <section className="scr" ref={ecran}>
        <CheminEtapes />
        <p className="m">Bonjour,</p>
        <h1>Bienvenue dans le Fil ACTIV&apos;</h1>
        <p className="intro">
          Sarah, ton accompagnante, t&apos;a ouvert l&apos;accès. Ici, tu trouveras ton parcours, tes missions et toutes les infos de L&apos;Burn, au même endroit.
        </p>
        <label htmlFor="prenom">Comment veux-tu qu&apos;on t&apos;appelle ?</label>
        <input
          id="prenom"
          type="text"
          autoComplete="given-name"
          maxLength={40}
          placeholder="Ton prénom"
          value={b.prenom}
          onChange={(e) => setB({ ...b, prenom: e.target.value })}
        />
        <p className="ok">Avant de commencer : 5 petites questions pour que les missions s&apos;adaptent à toi. Environ 2 minutes. Tu pourras tout changer plus tard.</p>
        <div className="spacer" />
        <button className="btn" disabled={!prenomValide(b.prenom)} onClick={() => setEtape(1)}>
          Commencer
        </button>
        {dejaLance ? (
          <button className="btn o" onClick={onFermer}>
            Revenir à ma feuille de route
          </button>
        ) : (
          <button className="btn o" onClick={onPlusTard}>
            Je reviendrai plus tard
          </button>
        )}
      </section>
    );
  }

  if (etape <= n) {
    const q = QUESTIONS[etape - 1];
    const v = b[q.k];
    const vide = Array.isArray(v) && v.length === 0;
    return (
      <section className="scr" ref={ecran}>
        <div className="prog" role="progressbar" aria-valuemin={0} aria-valuemax={n} aria-valuenow={etape} aria-label="Progression">
          <span style={{ width: `${(etape / n) * 100}%` }} />
        </div>
        {retour}
        <p className="m">
          Question {etape} sur {n}
        </p>
        <h1 ref={titre} tabIndex={-1}>
          {q.titre}
        </h1>
        <p className="m">{q.aide}</p>
        <div className={`opts${q.multi ? " multi" : ""}`} role="group" aria-label={q.titre}>
          {q.options.map(([valeur, libelle]) => (
            <button
              key={valeur}
              className="opt"
              aria-pressed={Array.isArray(v) ? v.includes(valeur) : v === valeur}
              onClick={() => setB(choisirOption(b, q, valeur))}
            >
              {libelle}
            </button>
          ))}
        </div>
        <div className="spacer" />
        <button className="btn" disabled={!questionValide(q, b)} onClick={() => setEtape(etape + 1)}>
          {q.optionnelle && vide ? "Passer" : "Continuer"}
        </button>
      </section>
    );
  }

  return (
    <section className="scr" ref={ecran}>
      <div className="prog" aria-hidden="true">
        <span style={{ width: "100%" }} />
      </div>
      {retour}
      <h1 ref={titre} tabIndex={-1}>
        Ton point de départ
      </h1>
      <p className="m">Vérifie, puis lance ton parcours. Seule Sarah voit ces réponses.</p>
      <dl className="recap">
        <dt>Prénom</dt>
        <dd>{b.prenom.trim()}</dd>
        {QUESTIONS.map((q) => (
          <div key={q.k} className="dl-row">
            <dt>{q.court}</dt>
            <dd>{valeurRecap(q, b)}</dd>
          </div>
        ))}
      </dl>
      <label htmlFor="motS">Un mot pour Sarah ? (facultatif)</label>
      <textarea
        id="motS"
        rows={2}
        maxLength={500}
        placeholder="Ce que tu aimerais qu'elle sache…"
        value={b.mot}
        onChange={(e) => setB({ ...b, mot: e.target.value })}
      />
      <p className="soft">
        Ensuite : Sarah reçoit tes réponses et te propose un premier rendez-vous. Tes premières missions, adaptées à tes réponses, apparaissent tout de suite.
      </p>
      <button className="btn" disabled={envoi || !versProfil(b)} onClick={lancer}>
        {envoi ? "Envoi…" : dejaLance ? "Mettre à jour mes réponses" : "Lancer mon parcours"}
      </button>
    </section>
  );
}
