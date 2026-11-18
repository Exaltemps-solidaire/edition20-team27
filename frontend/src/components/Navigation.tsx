"use client";

import type { ReactNode } from "react";
import { Carte, Chemin, Cloche, Soleil } from "./Icones";

export type Ecran = "parcours" | "missions" | "infos" | "meteo";

type Props = { courant: Ecran; aller: (e: Ecran) => void; pastilleMissions: number; pastilleInfos: number };

export function Navigation({ courant, aller, pastilleMissions, pastilleInfos }: Props) {
  const onglet = (id: Ecran, libelle: string, icone: ReactNode, pastille = 0) => (
    <button className="tab" aria-current={courant === id ? "page" : undefined} onClick={() => aller(id)}>
      {icone}
      {libelle}
      {pastille > 0 && <span className="badge">{pastille}</span>}
    </button>
  );
  return (
    <nav aria-label="Navigation principale">
      {onglet("parcours", "Parcours", <Chemin />)}
      {onglet("missions", "Missions", <Carte />, pastilleMissions)}
      {onglet("infos", "Infos", <Cloche />, pastilleInfos)}
      {onglet("meteo", "Météo", <Soleil />)}
    </nav>
  );
}
