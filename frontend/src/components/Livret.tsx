"use client";

import { useEffect, useRef } from "react";
import { ETAPES } from "@/lib/activ";

/** Le livret ACTIV' en fenêtre modale (dialog natif : focus piégé, Échap pour fermer). */
export function Livret({ onFermer }: { onFermer: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open && typeof d.showModal === "function") d.showModal();
    return () => d?.close();
  }, []);

  return (
    <dialog ref={ref} className="livret" aria-labelledby="livret-titre" onClose={onFermer}>
      <div className="col">
        <p className="kind doc">Document</p>
        <h1 id="livret-titre">Le livret ACTIV&apos;</h1>
        <p className="m">Ton parcours en 5 étapes. Chacune prend le temps qu&apos;il lui faut : c&apos;est toi qui donnes le rythme, avec Sarah.</p>
        <ol className="livret-etapes">
          {ETAPES.map(([titre, detail], i) => (
            <li key={titre}>
              <h2 className="h-card">
                {i + 1} · {titre}
              </h2>
              <p className="m">{detail}</p>
            </li>
          ))}
        </ol>
        <p className="soft">Contacts et charte du groupe : bientôt ici, l&apos;équipe les complète.</p>
        <button className="btn" autoFocus onClick={onFermer}>
          Fermer le livret
        </button>
      </div>
    </dialog>
  );
}
