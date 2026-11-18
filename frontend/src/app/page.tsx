"use client";

import { useEffect, useState } from "react";
import { AppParticipante } from "@/components/AppParticipante";
import { BandeauPersona, QuiEtesVous } from "@/components/QuiEtesVous";
import { api } from "@/lib/api";
import { ecrirePersona, lirePersona, type Persona } from "@/lib/personas";

/**
 * Racine : écran « Qui êtes-vous ? » (PRD, pas de connexion), puis l'application de la persona choisie.
 * La BURN'ette reste ici ; la chargée de remobilisation part sur /accompagnante.
 */
export default function Racine() {
  // undefined : choix pas encore lu (localStorage n'existe qu'après le montage, la page est exportée en statique)
  const [persona, setPersona] = useState<Persona | null | undefined>(undefined);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    queueMicrotask(() => {
      const p = lirePersona();
      if (p && p.chemin !== "/") window.location.assign(p.chemin);
      else setPersona(p);
    });
  }, []);

  function choisir(p: Persona) {
    ecrirePersona(p.id);
    if (p.chemin !== "/") window.location.assign(p.chemin);
    else setPersona(p);
  }

  function changer() {
    ecrirePersona(null);
    setPersona(null);
  }

  async function recommencer() {
    try {
      await api.recommencer();
    } finally {
      setVersion((v) => v + 1); // remonte l'application : elle relit l'état (vide) depuis l'API
    }
  }

  if (persona === undefined) return <div className="stage" aria-busy="true" />;
  if (persona === null) return <QuiEtesVous onChoisir={choisir} />;
  return (
    <AppParticipante
      key={version}
      bandeau={<BandeauPersona persona={persona} onChanger={changer} onRecommencer={() => void recommencer()} />}
    />
  );
}
