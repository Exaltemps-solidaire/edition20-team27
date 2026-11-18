// Service api du gabarit : écoute sur PORT (8081 par défaut), journaux sur la sortie standard.
// Lancé directement par Node (suppression des types TypeScript), sans étape de compilation.
import { createServer } from "node:http";
import { router } from "./routes.ts";

const port = Number(process.env.PORT ?? 8081);
const CORPS_MAX = 10_000;

const serveur = createServer(async (req, res) => {
  const repondre = (statut: number, corps?: unknown) => {
    if (corps === undefined) res.writeHead(statut).end();
    else res.writeHead(statut, { "Content-Type": "application/json" }).end(JSON.stringify(corps));
  };

  let corps: unknown;
  if (req.method === "POST") {
    let brut = "";
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

  const { statut, corps: sortie } = router(req.method ?? "GET", req.url ?? "/", corps);
  // Le mot de la personne n'est jamais journalisé : seule son accompagnante doit le lire.
  if (statut === 201) console.log(`api : retour météo reçu (mission ${(corps as { missionId: number }).missionId})`);
  repondre(statut, sortie);
});

serveur.listen(port, () => console.log(`api : à l'écoute sur le port ${port}`));

// Arrêt propre : le conteneur reçoit SIGTERM, on termine les requêtes en cours avant de sortir.
for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    console.log(`api : ${signal} reçu, arrêt`);
    serveur.close(() => process.exit(0));
  });
}
