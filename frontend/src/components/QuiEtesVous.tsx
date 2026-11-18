"use client";

import { PERSONAS, type Persona } from "@/lib/personas";

/** Écran « Qui êtes-vous ? » du PRD : on choisit la persona qu'on incarne, sans connexion. */
export function QuiEtesVous({ onChoisir }: { onChoisir: (p: Persona) => void }) {
  return (
    <div className="stage">
      <div className="phone">
        <section className="scr">
          <div>
            <p className="m">Fil ACTIV&apos; · version de test</p>
            <h1>Qui êtes-vous ?</h1>
            <p className="m">Choisis la personne que tu incarnes. Tu pourras en changer à tout moment avec le bouton en haut de l&apos;écran.</p>
          </div>
          <div className="opts" role="group" aria-label="Personas">
            {PERSONAS.map((p) => (
              <button key={p.id} className="persona" onClick={() => onChoisir(p)}>
                <span className="av" aria-hidden="true">
                  {p.nom[0]}
                </span>
                <span>
                  <b>{p.nom}</b>
                  <span className="persona-role">{p.role}</span>
                  <span className="persona-desc">{p.description}</span>
                </span>
              </button>
            ))}
          </div>
          <p className="soft">Pas de compte ni de mot de passe dans cette version : les données sont des exemples.</p>
        </section>
      </div>
    </div>
  );
}

/** Bandeau au-dessus de l'écran : persona incarnée, changement de rôle, remise à zéro du scénario. */
export function BandeauPersona({
  persona,
  onChanger,
  onRecommencer,
}: {
  persona: Persona;
  onChanger: () => void;
  onRecommencer?: () => void;
}) {
  return (
    <div className="bandeau" role="region" aria-label="Persona incarnée">
      <span>
        Tu incarnes <b>{persona.nom}</b> · {persona.role}
      </span>
      <span className="bandeau-actions">
        {onRecommencer && (
          <button className="link" onClick={onRecommencer}>
            Recommencer le scénario
          </button>
        )}
        <button className="link" onClick={onChanger}>
          Changer de rôle
        </button>
      </span>
    </div>
  );
}
