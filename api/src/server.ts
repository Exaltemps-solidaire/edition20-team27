// Service api : écoute sur PORT (8081 par défaut), journaux sur la sortie standard.
// Lancé directement par Node (suppression des types TypeScript), sans étape de compilation.
// Stockage Postgres si DB_HOST est défini, sinon en mémoire (développement).
import { createServer } from "node:http";
import { router } from "./routes.ts";
import { creerStoreMemoire } from "./store.ts";
import type { Store } from "./store.ts";

const port = Number(process.env.PORT ?? 8081);
const CORPS_MAX = 10_000;

async function creerStore(): Promise<Store> {
  if (!process.env.DB_HOST) {
    console.warn("api : DB_HOST absent, stockage EN MÉMOIRE (perdu au redémarrage)");
    return creerStoreMemoire();
  }
  const { creerStorePg } = await import("./store-pg.ts");
  const store = await creerStorePg({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  console.log("api : stockage Postgres prêt");
  return store;
}

const store = await creerStore();
const config = {
  accompagnanteCode: process.env.ACCOMPAGNANTE_CODE || undefined,
  accesLibre: process.env.ACCOMPAGNANTE_ACCES_LIBRE === "1",
};
if (config.accesLibre) console.warn("api : ⚠ ACCOMPAGNANTE_ACCES_LIBRE=1, routes accompagnante SANS authentification (version de test du PRD, données d'exemple uniquement)");
else if (!config.accompagnanteCode) console.warn("api : ACCOMPAGNANTE_CODE absent, les routes accompagnante répondent 503");

const serveur = createServer(async (req, res) => {
  const repondre = (statut: number, corps?: unknown) => {
    if (corps === undefined) res.writeHead(statut).end();
    else res.writeHead(statut, { "Content-Type": "application/json" }).end(JSON.stringify(corps));
  };

  try {
    let corps: unknown;
    if (req.method === "POST" || req.method === "PUT") {
      let brut = "";
      req.setEncoding("utf8"); // décode sans couper un caractère accentué entre deux morceaux
      for await (const morceau of req) {
        brut += morceau;
        if (brut.length > CORPS_MAX) return repondre(413, { erreur: "corps trop volumineux" });
      }
      try {
        corps = brut ? JSON.parse(brut) : undefined;
      } catch {
        return repondre(400, { erreur: "JSON invalide" });
      }
    }

    const { statut, corps: sortie } = await router(
      { methode: req.method ?? "GET", url: req.url ?? "/", entetes: req.headers, corps },
      store,
      config,
    );
    // Les mots des participantes ne sont jamais journalisés : seule leur accompagnante doit les lire.
    if (statut === 201) console.log(`api : retour météo reçu (mission ${(corps as { missionId: number }).missionId})`);
    repondre(statut, sortie);
  } catch (err) {
    console.error(`api : erreur interne sur ${req.method} ${new URL(req.url ?? "/", "http://api").pathname} : ${(err as Error).message}`);
    if (!res.headersSent) repondre(500, { erreur: "erreur interne" });
  }
});

serveur.listen(port, () => console.log(`api : à l'écoute sur le port ${port}`));

// Arrêt propre : le conteneur reçoit SIGTERM, on termine les requêtes en cours puis on ferme le pool.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    console.log(`api : ${signal} reçu, arrêt`);
    serveur.close(() => {
      store.fermer().finally(() => process.exit(0));
    });
  });
}
