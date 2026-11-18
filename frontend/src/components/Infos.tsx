"use client";

import type { FormatRdv } from "@/lib/api";

type Props = {
  afficherBienvenue: boolean;
  formatRdv: FormatRdv | null;
  formatEnCours: boolean;
  onFormat: (f: FormatRdv) => void;
  onAgendaAtelier: () => void;
  onLivret: () => void;
};

const LIBELLE_FORMAT: Record<FormatRdv, string> = { visio: "en visio", local: "au local" };

export function Infos({ afficherBienvenue, formatRdv, formatEnCours, onFormat, onAgendaAtelier, onLivret }: Props) {
  return (
    <>
      <div>
        <h1>Le fil d&apos;infos</h1>
        <p className="m">Tout ce que l&apos;équipe partage, au même endroit. Plus besoin de fouiller tes mails ou Facebook.</p>
      </div>
      {afficherBienvenue && (
        <article className="card">
          <p className="kind">Message de Sarah</p>
          <h2 className="h-card">Bienvenue dans ACTIV&apos; !</h2>
          <p className="m">
            J&apos;ai bien reçu tes réponses, merci. On se voit mardi 25 nov. à 10 h pour faire connaissance, au local ou en visio, comme tu préfères. Rien à préparer.
          </p>
          <div className="two" role="group" aria-label="Format du premier rendez-vous">
            <button className="btn o choix" aria-pressed={formatRdv === "visio"} disabled={formatEnCours} onClick={() => onFormat("visio")}>
              Je préfère la visio
            </button>
            <button className="btn o choix" aria-pressed={formatRdv === "local"} disabled={formatEnCours} onClick={() => onFormat("local")}>
              Je préfère le local
            </button>
          </div>
          {formatRdv && <p className="ok">C&apos;est noté : on se voit {LIBELLE_FORMAT[formatRdv]}. Tu peux changer d&apos;avis quand tu veux.</p>}
        </article>
      )}
      <article className="card row">
        <div className="date">
          <span>jeu.</span>
          <b>20</b>
        </div>
        <div>
          <p className="kind">Rendez-vous</p>
          <h2 className="h-card">Atelier collectif · 14 h</h2>
          <p className="m">Au local de l&apos;association</p>
          <button className="link" onClick={onAgendaAtelier}>
            Ajouter à mon agenda
          </button>
        </div>
      </article>
      <article className="card">
        <p className="kind doc">Document</p>
        <h2 className="h-card">Le livret ACTIV&apos;</h2>
        <p className="m">Les étapes, les contacts, la charte du groupe.</p>
        <button className="link" onClick={onLivret}>
          Ouvrir le livret
        </button>
      </article>
      <article className="card">
        <p className="kind equipe">Message de l&apos;équipe</p>
        <h2 className="h-card">Pas d&apos;atelier le 11 décembre</h2>
        <p className="m">Le local est fermé ce jour-là. Les missions de la semaine restent ouvertes.</p>
        <p className="auteur">Sarah, accompagnante · hier</p>
      </article>
    </>
  );
}
