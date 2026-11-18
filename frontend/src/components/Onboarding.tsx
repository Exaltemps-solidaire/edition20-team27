"use client";

import { useEffect, useRef, useState } from "react";
import { QUESTIONS, choisirOption, prenomValide, questionValide, valeurRecap, versProfil, type Brouillon } from "@/lib/activ";
import type { Profil } from "@/lib/api";
import { CheminEtapes } from "./Icones";

/** Sensibilisation à l'engagement (retour métier 2), contenus tirés de la passation sauf mention. */
const DIAPOS_ENGAGEMENT: { surtitre: string; titre: string; texte: string; points: string[]; note?: string; ton?: string }[] = [
  {
    surtitre: "1 · Le rôle d'ACTIV'",
    titre: "ACTIV', c'est quoi ?",
    texte: "C'est avant tout un parcours de formation, avec une communauté autour. Tu t'y testes pas à pas, dans un cadre sécurisé.",
    points: [
      "Proposer et animer un atelier BURN'ettes, avec un pitch validé avant diffusion.",
      "Des missions ponctuelles : un article de blog, un salon auprès des entreprises…",
      "La modération de la communauté.",
    ],
  },
  {
    surtitre: "2 · Te former",
    titre: "Une formation en trois temps",
    texte: "Personne n'intervient sans formation, habilitation et supervision. Sarah valide chaque étape avec toi.",
    points: [
      "Le tronc commun, en vidéo : psychoéducation et fonctionnement de L'Burn.",
      "La formation modération : elle ouvre les ateliers, les missions et la modération.",
      "La pair-aidance, en option (2 × 3 h) : elle ouvre les permanences, groupes de parole et écoutes.",
    ],
    ton: "chemin",
  },
  {
    surtitre: "3 · S'engager",
    titre: "S'engager, à ton rythme",
    texte: "Quand tu choisis une mission, tu t'engages à la respecter : être là, ou prévenir Sarah si ça ne va pas.",
    points: ["Un an au plus.", "Une pause à tout moment.", "Une sortie libre, sans te justifier ni culpabiliser."],
  },
  {
    surtitre: "4 · La réciprocité",
    titre: "Ce que L'Burn t'apporte",
    texte: "Tu donnes de ton temps à l'association, et elle prend soin de toi en retour.",
    points: [
      "Une accompagnante, Sarah, qui suit ton rythme et que tu peux solliciter.",
      "Des formations reconnues, avant chaque mission qui en demande.",
      "Une communauté de BURN'ettes qui sont passées par là.",
      "Des missions que tu choisis, et que tu peux mettre en pause.",
    ],
    note: "Texte provisoire, à valider avec l'association.",
    ton: "reciproque",
  },
];

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
  // Itération 8 : écran de sensibilisation à l'engagement, entre l'accueil (étape 0) et la question 1.
  const [engagementOuvert, setEngagementOuvert] = useState(false);
  const [diapo, setDiapo] = useState(0);
  const [cguOuvertes, setCguOuvertes] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const ecran = useRef<HTMLElement>(null);
  const titre = useRef<HTMLHeadingElement>(null);
  const n = QUESTIONS.length;

  useEffect(() => {
    if (ecran.current) ecran.current.scrollTop = 0;
    if (etape > 0 || engagementOuvert) titre.current?.focus();
  }, [etape, engagementOuvert, diapo]);

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
    <button
      className="link"
      onClick={() => {
        if (etape === 1) {
          setEngagementOuvert(true);
          setDiapo(DIAPOS_ENGAGEMENT.length - 1);
        }
        setEtape(etape - 1);
      }}
    >
      ← Retour
    </button>
  );

  if (etape === 0 && engagementOuvert) {
    const d = DIAPOS_ENGAGEMENT[diapo];
    const derniere = diapo === DIAPOS_ENGAGEMENT.length - 1;
    return (
      <section className="scr" ref={ecran}>
        <div className="points" aria-label={`Étape ${diapo + 1} sur ${DIAPOS_ENGAGEMENT.length}`}>
          {DIAPOS_ENGAGEMENT.map((x, i) => (
            <span key={x.titre} className={i <= diapo ? "on" : ""} />
          ))}
        </div>
        <button className="link" onClick={() => (diapo === 0 ? setEngagementOuvert(false) : setDiapo(diapo - 1))}>
          ← Retour
        </button>
        <p className="m">{d.surtitre}</p>
        <h1 ref={titre} tabIndex={-1}>
          {d.titre}
        </h1>
        <p className="intro">{d.texte}</p>
        <div className={`card${d.ton ? ` ${d.ton}` : ""}`}>
          <ul className="puces">
            {d.points.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          {d.note && <p className="auteur">{d.note}</p>}
        </div>
        <div className="spacer" />
        <button
          className="btn"
          onClick={() => {
            if (derniere) setEtape(1);
            else setDiapo(diapo + 1);
          }}
        >
          {derniere ? "Répondre aux 5 questions" : "Continuer"}
        </button>
      </section>
    );
  }

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
        <button className="btn" disabled={!prenomValide(b.prenom)} onClick={() => {
            setDiapo(0);
            setEngagementOuvert(true);
          }}>
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
        <dt>Engagement</dt>
        <dd>{b.engagement ? "Je m'engage" : "Pas encore"}</dd>
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
      <label className="engage">
        <input type="checkbox" checked={b.engagement} onChange={(e) => setB({ ...b, engagement: e.target.checked })} />
        <span>Je m&apos;engage à respecter les missions que je choisis. (facultatif)</span>
      </label>
      <label className="engage">
        <input type="checkbox" checked={b.cgu} onChange={(e) => setB({ ...b, cgu: e.target.checked })} />
        <span>J&apos;ai lu et j&apos;accepte les conditions d&apos;utilisation du Fil ACTIV&apos;.</span>
      </label>
      <button className="link" aria-expanded={cguOuvertes} onClick={() => setCguOuvertes(!cguOuvertes)}>
        {cguOuvertes ? "Masquer les conditions" : "Lire les conditions d'utilisation"}
      </button>
      {cguOuvertes && (
        <div className="soft cgu">
          <ul className="puces">
            <li>Tes réponses, tes choix de missions et ta météo ne sont vus que par Sarah, ta chargée de remobilisation.</li>
            <li>Aucune donnée de santé n&apos;est demandée ni conservée. N&apos;écris dans les mots libres que ce que tu veux bien partager.</li>
            <li>Ton engagement dure un an au plus. Tu peux faire une pause ou sortir à tout moment, sans te justifier.</li>
            <li>Aucune intervention auprès d&apos;autres BURN&apos;ettes sans la formation et l&apos;habilitation prévues.</li>
            <li>Tu peux demander à Sarah de modifier ou d&apos;effacer tes données.</li>
          </ul>
          <p className="auteur">Version de test, à valider avec l&apos;association.</p>
        </div>
      )}
      <p className="soft">
        Ensuite : Sarah reçoit tes réponses et te propose un premier rendez-vous. Tes premières missions, adaptées à tes réponses, apparaissent tout de suite.
      </p>
      <button className="btn" disabled={envoi || !versProfil(b) || !b.cgu} onClick={lancer}>
        {envoi ? "Envoi…" : dejaLance ? "Mettre à jour mes réponses" : "Lancer mon parcours"}
      </button>
    </section>
  );
}
