import type { EtapeFormation } from "@/lib/api";
import { CHEMIN_FORMATION, avancement, habilitation, statutsChemin } from "@/lib/formation";

const LIBELLE: Record<string, string> = { done: "Validée par Sarah", now: "Ta prochaine étape", next: "À venir" };

/** « Mon chemin de formation » : les trois temps de la passation, validés petit à petit par Sarah. */
export function CheminFormation({ validees = [] }: { validees?: EtapeFormation[] }) {
  const statuts = statutsChemin(validees);
  const pct = avancement(validees);
  return (
    <section className="card chemin" aria-labelledby="titre-chemin">
      <h2 id="titre-chemin" className="h-card">
        Mon chemin de formation
      </h2>
      <div className="prog" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Avancement de la formation">
        <span style={{ width: `${Math.max(pct, 4)}%` }} />
      </div>
      <ol className="steps">
        {CHEMIN_FORMATION.map((e, i) => (
          <li key={e.id} className={`step ${statuts[i]}`}>
            <span className="dot" aria-hidden="true">
              {statuts[i] === "done" ? "✓" : i + 1}
            </span>
            <span>
              <b>
                {e.titre}
                {e.option ? " (option)" : ""}
              </b>
              <span className="s">{LIBELLE[statuts[i]]}</span>
              <span className="det">
                {e.detail} {e.ouvre}
              </span>
            </span>
          </li>
        ))}
      </ol>
      <p className="ok">{habilitation(validees)}</p>
    </section>
  );
}
