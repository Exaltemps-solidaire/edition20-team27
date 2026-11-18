// Interface de stockage et implémentation en mémoire (tests, développement sans DB_HOST).
// L'implémentation Postgres est dans store-pg.ts.
import type { Dossier, RetourMeteo } from "./domaine.ts";

export type Store = {
  /** Dossier d'une participante, ou null si elle n'a pas encore lancé son questionnaire. */
  lire(id: string): Promise<Dossier | null>;
  /** Crée ou remplace le dossier (participante + liste ordonnée de ses missions). */
  enregistrer(dossier: Dossier): Promise<void>;
  ajouterRetour(participantId: string, retour: RetourMeteo): Promise<void>;
  /** Efface le dossier, ses missions et ses retours (recommencer le scénario de test). */
  supprimer(id: string): Promise<void>;
  /** Tous les dossiers, la participante lancée le plus récemment d'abord, avec leurs retours. */
  lister(): Promise<{ dossier: Dossier; retours: RetourMeteo[] }[]>;
  fermer(): Promise<void>;
};

export function creerStoreMemoire(): Store {
  const dossiers = new Map<string, Dossier>();
  const retours = new Map<string, RetourMeteo[]>();
  return {
    async lire(id) {
      const d = dossiers.get(id);
      return d ? structuredClone(d) : null;
    },
    async enregistrer(dossier) {
      dossiers.set(dossier.id, structuredClone(dossier));
    },
    async ajouterRetour(participantId, retour) {
      const liste = retours.get(participantId) ?? [];
      liste.push({ ...retour });
      retours.set(participantId, liste);
    },
    async supprimer(id) {
      dossiers.delete(id);
      retours.delete(id);
    },
    async lister() {
      return [...dossiers.values()]
        .sort((a, b) => b.participant.lanceLe.localeCompare(a.participant.lanceLe))
        .map((d) => ({ dossier: structuredClone(d), retours: structuredClone(retours.get(d.id) ?? []) }));
    },
    async fermer() {},
  };
}
