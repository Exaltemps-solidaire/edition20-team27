// Stockage Postgres (dépendance pg). Le schéma est créé au démarrage s'il n'existe pas.
import pg from "pg";
import type { Dossier, Energie, EtapeFormation, FormatRdv, Lieu, Envie, Eviter, Meteo, RetourMeteo, StatutMission, Temps } from "./domaine.ts";
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
-- Itération 8 : case « Je m'engage » de l'écran de sensibilisation
ALTER TABLE participants ADD COLUMN IF NOT EXISTS engagement boolean NOT NULL DEFAULT false;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS cgu boolean NOT NULL DEFAULT false;
ALTER TABLE participants ADD COLUMN IF NOT EXISTS formations_validees text[] NOT NULL DEFAULT '{}';
`;

// Itération 10 : inscription à une mission récurrente et réponses au rappel hebdomadaire.
export const SCHEMA_RECURRENCE = `
ALTER TABLE missions_participant ADD COLUMN IF NOT EXISTS inscrite_jusquau timestamptz;
CREATE TABLE IF NOT EXISTS disponibilites (
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  mission_id     integer NOT NULL,
  semaine        text NOT NULL,
  disponible     boolean NOT NULL,
  repondu_le     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (participant_id, mission_id, semaine)
);
`;

export type ConfigPg = { host: string; port: number; database?: string; user?: string; password?: string };

type LigneParticipant = {
  id: string; prenom: string; energie: Energie; temps: Temps; lieux: Lieu[]; envies: Envie[]; eviter: Eviter[];
  mot: string; etape: number; format_rdv: FormatRdv | null; lance_le: Date; engagement: boolean; cgu: boolean; formations_validees: EtapeFormation[];
};
type LigneMission = {
  participant_id: string; mission_id: number; statut: StatutMission; pourquoi: string[]; inscrite_jusquau: Date | null;
};
type LigneDispo = { participant_id: string; mission_id: number; semaine: string; disponible: boolean };
const COLONNES_MISSION = "participant_id, mission_id, statut, pourquoi, inscrite_jusquau";
const COLONNES_DISPO = "participant_id, mission_id, semaine, disponible";
type LigneRetour = { participant_id: string; mission_id: number; meteo: Meteo; mot: string; recu_le: Date };

function versDossier(p: LigneParticipant, missions: LigneMission[], dispos: LigneDispo[] = []): Dossier {
  return {
    id: p.id,
    participant: {
      prenom: p.prenom, energie: p.energie, temps: p.temps, lieux: p.lieux, envies: p.envies, eviter: p.eviter, mot: p.mot,
      engagement: p.engagement, cgu: p.cgu, formationsValidees: p.formations_validees ?? [], etape: p.etape, formatRdv: p.format_rdv, lanceLe: p.lance_le.toISOString(),
    },
    missions: missions.map((m) => ({
      id: m.mission_id, statut: m.statut, pourquoi: m.pourquoi,
      inscriteJusquau: m.inscrite_jusquau ? m.inscrite_jusquau.toISOString() : null,
      disponibilites: Object.fromEntries(
        dispos.filter((d) => d.mission_id === m.mission_id).map((d) => [d.semaine, d.disponible]),
      ),
    })),
  };
}

export async function creerStorePg(config: ConfigPg): Promise<Store> {
  const pool = new pg.Pool({ ...config, max: 5 });
  // Une connexion inactive qui tombe ne doit pas arrêter le processus.
  pool.on("error", (err) => console.error(`api : erreur du pool Postgres : ${err.message}`));
  await pool.query(SCHEMA);
  await pool.query(SCHEMA_RECURRENCE);

  return {
    async lire(id) {
      const p = await pool.query<LigneParticipant>("SELECT * FROM participants WHERE id = $1", [id]);
      if (p.rowCount === 0) return null;
      const [m, d] = await Promise.all([
        pool.query<LigneMission>(`SELECT ${COLONNES_MISSION} FROM missions_participant WHERE participant_id = $1 ORDER BY ordre`, [id]),
        pool.query<LigneDispo>(`SELECT ${COLONNES_DISPO} FROM disponibilites WHERE participant_id = $1`, [id]),
      ]);
      return versDossier(p.rows[0], m.rows, d.rows);
    },

    async enregistrer(dossier) {
      const { participant: p } = dossier;
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(
          `INSERT INTO participants (id, prenom, energie, temps, lieux, envies, eviter, mot, etape, format_rdv, lance_le, engagement, cgu, formations_validees)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
           ON CONFLICT (id) DO UPDATE SET prenom = $2, energie = $3, temps = $4, lieux = $5, envies = $6, eviter = $7,
             mot = $8, etape = $9, format_rdv = $10, engagement = $12, cgu = $13, formations_validees = $14`,
          [dossier.id, p.prenom, p.energie, p.temps, p.lieux, p.envies, p.eviter, p.mot, p.etape, p.formatRdv, p.lanceLe, p.engagement, p.cgu, p.formationsValidees ?? []],
        );
        await client.query("DELETE FROM missions_participant WHERE participant_id = $1", [dossier.id]);
        for (const [ordre, m] of dossier.missions.entries()) {
          await client.query(
            `INSERT INTO missions_participant (participant_id, mission_id, statut, pourquoi, ordre, inscrite_jusquau)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [dossier.id, m.id, m.statut, m.pourquoi, ordre, m.inscriteJusquau ?? null],
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

    async enregistrerDisponibilite(participantId, missionId, semaine, disponible) {
      await pool.query(
        `INSERT INTO disponibilites (participant_id, mission_id, semaine, disponible, repondu_le) VALUES ($1, $2, $3, $4, now())
         ON CONFLICT (participant_id, mission_id, semaine) DO UPDATE SET disponible = $4, repondu_le = now()`,
        [participantId, missionId, semaine, disponible],
      );
    },

    async supprimer(id) {
      // missions_participant et retours_meteo suivent par ON DELETE CASCADE.
      await pool.query("DELETE FROM participants WHERE id = $1", [id]);
    },

    async lister() {
      const [p, m, r, d] = await Promise.all([
        pool.query<LigneParticipant>("SELECT * FROM participants ORDER BY lance_le DESC"),
        pool.query<LigneMission>(`SELECT ${COLONNES_MISSION} FROM missions_participant ORDER BY participant_id, ordre`),
        pool.query<LigneRetour>("SELECT participant_id, mission_id, meteo, mot, recu_le FROM retours_meteo ORDER BY recu_le DESC, id DESC"),
        pool.query<LigneDispo>(`SELECT ${COLONNES_DISPO} FROM disponibilites`),
      ]);
      return p.rows.map((ligne) => ({
        dossier: versDossier(
          ligne,
          m.rows.filter((x) => x.participant_id === ligne.id),
          d.rows.filter((x) => x.participant_id === ligne.id),
        ),
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
