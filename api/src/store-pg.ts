// Stockage Postgres (dépendance pg). Le schéma est créé au démarrage s'il n'existe pas.
import pg from "pg";
import type { Dossier, Energie, FormatRdv, Lieu, Envie, Eviter, Meteo, RetourMeteo, StatutMission, Temps } from "./domaine.ts";
import type { Store } from "./store.ts";

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS participants (
  id          uuid PRIMARY KEY,
  prenom      text NOT NULL,
  energie     text NOT NULL,
  temps       integer NOT NULL,
  lieux       text[] NOT NULL,
  envies      text[] NOT NULL,
  eviter      text[] NOT NULL,
  mot         text NOT NULL DEFAULT '',
  etape       integer NOT NULL DEFAULT 0,
  format_rdv  text,
  lance_le    timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS missions_participant (
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  mission_id     integer NOT NULL,
  statut         text NOT NULL,
  pourquoi       text[] NOT NULL,
  ordre          integer NOT NULL,
  PRIMARY KEY (participant_id, mission_id)
);
CREATE TABLE IF NOT EXISTS retours_meteo (
  id             bigserial PRIMARY KEY,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  mission_id     integer NOT NULL,
  meteo          text NOT NULL,
  mot            text NOT NULL DEFAULT '',
  recu_le        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS retours_meteo_participant ON retours_meteo (participant_id, recu_le DESC);
`;

export type ConfigPg = { host: string; port: number; database?: string; user?: string; password?: string };

type LigneParticipant = {
  id: string; prenom: string; energie: Energie; temps: Temps; lieux: Lieu[]; envies: Envie[]; eviter: Eviter[];
  mot: string; etape: number; format_rdv: FormatRdv | null; lance_le: Date;
};
type LigneMission = { participant_id: string; mission_id: number; statut: StatutMission; pourquoi: string[] };
type LigneRetour = { participant_id: string; mission_id: number; meteo: Meteo; mot: string; recu_le: Date };

function versDossier(p: LigneParticipant, missions: LigneMission[]): Dossier {
  return {
    id: p.id,
    participant: {
      prenom: p.prenom, energie: p.energie, temps: p.temps, lieux: p.lieux, envies: p.envies, eviter: p.eviter, mot: p.mot,
      etape: p.etape, formatRdv: p.format_rdv, lanceLe: p.lance_le.toISOString(),
    },
    missions: missions.map((m) => ({ id: m.mission_id, statut: m.statut, pourquoi: m.pourquoi })),
  };
}

export async function creerStorePg(config: ConfigPg): Promise<Store> {
  const pool = new pg.Pool({ ...config, max: 5 });
  // Une connexion inactive qui tombe ne doit pas arrêter le processus.
  pool.on("error", (err) => console.error(`api : erreur du pool Postgres : ${err.message}`));
  await pool.query(SCHEMA);

  return {
    async lire(id) {
      const p = await pool.query<LigneParticipant>("SELECT * FROM participants WHERE id = $1", [id]);
      if (p.rowCount === 0) return null;
      const m = await pool.query<LigneMission>(
        "SELECT participant_id, mission_id, statut, pourquoi FROM missions_participant WHERE participant_id = $1 ORDER BY ordre",
        [id],
      );
      return versDossier(p.rows[0], m.rows);
    },

    async enregistrer(dossier) {
      const { participant: p } = dossier;
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(
          `INSERT INTO participants (id, prenom, energie, temps, lieux, envies, eviter, mot, etape, format_rdv, lance_le)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
           ON CONFLICT (id) DO UPDATE SET prenom = $2, energie = $3, temps = $4, lieux = $5, envies = $6, eviter = $7,
             mot = $8, etape = $9, format_rdv = $10`,
          [dossier.id, p.prenom, p.energie, p.temps, p.lieux, p.envies, p.eviter, p.mot, p.etape, p.formatRdv, p.lanceLe],
        );
        await client.query("DELETE FROM missions_participant WHERE participant_id = $1", [dossier.id]);
        for (const [ordre, m] of dossier.missions.entries()) {
          await client.query(
            "INSERT INTO missions_participant (participant_id, mission_id, statut, pourquoi, ordre) VALUES ($1, $2, $3, $4, $5)",
            [dossier.id, m.id, m.statut, m.pourquoi, ordre],
          );
        }
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    },

    async ajouterRetour(participantId, retour: RetourMeteo) {
      await pool.query(
        "INSERT INTO retours_meteo (participant_id, mission_id, meteo, mot, recu_le) VALUES ($1, $2, $3, $4, $5)",
        [participantId, retour.missionId, retour.meteo, retour.mot, retour.recuLe],
      );
    },

    async supprimer(id) {
      // missions_participant et retours_meteo suivent par ON DELETE CASCADE.
      await pool.query("DELETE FROM participants WHERE id = $1", [id]);
    },

    async lister() {
      const [p, m, r] = await Promise.all([
        pool.query<LigneParticipant>("SELECT * FROM participants ORDER BY lance_le DESC"),
        pool.query<LigneMission>("SELECT participant_id, mission_id, statut, pourquoi FROM missions_participant ORDER BY participant_id, ordre"),
        pool.query<LigneRetour>("SELECT participant_id, mission_id, meteo, mot, recu_le FROM retours_meteo ORDER BY recu_le DESC, id DESC"),
      ]);
      return p.rows.map((ligne) => ({
        dossier: versDossier(ligne, m.rows.filter((x) => x.participant_id === ligne.id)),
        retours: r.rows
          .filter((x) => x.participant_id === ligne.id)
          .map((x) => ({ missionId: x.mission_id, meteo: x.meteo, mot: x.mot, recuLe: x.recu_le.toISOString() })),
      }));
    },

    async fermer() {
      await pool.end();
    },
  };
}
