"use client";

import { useState, type ReactNode } from "react";
import { MESSAGES_METEO } from "@/lib/activ";
import type { Meteo, MissionProposee } from "@/lib/api";
import { CercleCoche, Nuage, Pluie, Soleil } from "./Icones";

const CHOIX: { valeur: Meteo; libelle: string; icone: ReactNode }[] = [
  { valeur: "soleil", libelle: "Ça m'a fait du bien", icone: <Soleil couleur="#B5651D" taille={38} epaisseur={1.8} /> },
  { valeur: "nuage", libelle: "Mitigé", icone: <Nuage couleur="#4A4E5E" taille={38} epaisseur={1.8} /> },
  { valeur: "pluie", libelle: "C'était trop", icone: <Pluie couleur="#2F33A8" taille={38} epaisseur={1.8} /> },
];

type Props = {
  /** `null` : la météo est encore verrouillée (aucune mission faite). */
  mission: MissionProposee | null;
  onEnvoyer: (missionId: number, meteo: Meteo, mot: string) => Promise<void>;
  onVoirMissions: () => void;
  onRetour: () => void;
};

export function MeteoEcran({ mission, onEnvoyer, onVoirMissions, onRetour }: Props) {
  const [meteo, setMeteo] = useState<Meteo | null>(null);
  const [mot, setMot] = useState("");
  const [envoi, setEnvoi] = useState<"idle" | "en-cours" | "envoye">("idle");

  if (!mission) {
    return (
      <div className="centre">
        <Soleil couleur="#9EA2B3" taille={64} epaisseur={1.6} />
        <h1>Ta météo arrive bientôt</h1>
        <p className="m">Après ta première mission, tu pourras dire en un clic comment ça s&apos;est passé. Sarah s&apos;en servira pour ajuster ton rythme.</p>
        <button className="btn" onClick={onVoirMissions}>
          Voir mes missions
        </button>
      </div>
    );
  }

  if (envoi === "envoye" && meteo) {
    return (
      <div className="centre">
        <CercleCoche />
        <h1>Merci, c&apos;est envoyé</h1>
        <p className="m">{MESSAGES_METEO[meteo]}</p>
        <button className="btn" onClick={onRetour}>
          Retour à ma feuille de route
        </button>
      </div>
    );
  }

  async function envoyer() {
    if (!meteo || !mission || envoi === "en-cours") return;
    setEnvoi("en-cours");
    try {
      await onEnvoyer(mission.id, meteo, mot.trim());
      setEnvoi("envoye");
    } catch {
      setEnvoi("idle");
    }
  }

  return (
    <>
      <div>
        <p className="m">Mission : {mission.titre.toLowerCase()}</p>
        <h1>Comment ça s&apos;est passé ?</h1>
        <p className="m">Un clic suffit. Il n&apos;y a pas de mauvaise réponse.</p>
      </div>
      <div className="wxs" role="group" aria-label="Ma météo">
        {CHOIX.map((c) => (
          <button key={c.valeur} className="wx" aria-pressed={meteo === c.valeur} onClick={() => setMeteo(c.valeur)}>
            {c.icone}
            {c.libelle}
          </button>
        ))}
      </div>
      <label htmlFor="mot">Un mot pour ton accompagnante ? (facultatif)</label>
      <textarea id="mot" rows={3} maxLength={500} placeholder="Ce qui t'a aidée, ce qui a été difficile…" value={mot} onChange={(e) => setMot(e.target.value)} />
      <p className="ok">Seule Sarah, ton accompagnante, voit ta réponse. Elle s&apos;en sert pour ajuster le rythme de tes missions.</p>
      <button className="btn" disabled={!meteo || envoi === "en-cours"} onClick={envoyer}>
        {envoi === "en-cours" ? "Envoi…" : "Envoyer"}
      </button>
    </>
  );
}
