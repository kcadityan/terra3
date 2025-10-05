import http from "http";
import express from "express";
import { Server } from "colyseus";

import { registerWorldRoom } from "../../mods/world/server/colyseus";
import { createTerrainRegistry } from "../../mods/world/shared/terrain";
import { registerBaseTerrain } from "../../mods/terrain";
import { createDefaultWorldPlan } from "../world/plan/defaultPlan";

export function createServer(port = Number(process.env.PORT ?? 2567)) {
  const app = express();
  const httpServer = http.createServer(app);
  const gameServer = new Server({ server: httpServer });

  const terrainRegistry = createTerrainRegistry();
  registerBaseTerrain(terrainRegistry);

  registerWorldRoom(gameServer, {
    terrainRegistry,
    planProvider: () => createDefaultWorldPlan(terrainRegistry)
  });

  const ready = gameServer
    .listen(port)
    .then(() => {
      console.log(`Colyseus server listening on ${port}`);
    })
    .catch((err: unknown) => {
      if ((err as NodeJS.ErrnoException)?.code === "EADDRINUSE") {
        console.error(
          `Port ${port} is already in use. Stop the other process or run with PORT=<newPort>.`
        );
      } else {
        console.error("Failed to start Colyseus server:", err);
      }
      throw err;
    });

  return { app, httpServer, gameServer, ready };
}

if (require.main === module) {
  createServer().ready.catch(() => {
    process.exitCode = 1;
  });
}
