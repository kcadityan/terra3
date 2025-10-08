import http from "http";
import express from "express";
import { Server } from "colyseus";

import { Kernel, type Event } from "@engine/kernel";
import { Container, token } from "@engine/shared/container";
import type {
  Clock,
  EventBus,
  KernelFactory,
  PlayerAPI,
  RNG,
  WorldAPI
} from "@engine/shared/tokens";
import { initWorldModule, type WorldModuleDeps } from "@mods/world/server";
import { createTerrainRegistry } from "@mods/world/shared/terrain";
import { WORLD_WIDTH } from "@mods/world/shared/world";
import { registerBaseTerrain } from "@mods/terrain";
import { createDefaultWorldPlan, PLAYER_SURFACE_ROW } from "@engine/world/plan/defaultPlan";
import { initPlayerModule, PlayerState, type PlayerModuleConfig } from "@mods/player/server";

export function createServer(port = Number(process.env.PORT ?? 2567)) {
  const app = express();
  const httpServer = http.createServer(app);
  const gameServer = new Server({ server: httpServer });

  const TOKENS = {
    EventBus: token<EventBus>("engine.eventBus"),
    Clock: token<Clock>("engine.clock"),
    RNG: token<RNG>("engine.rng"),
    KernelFactory: token<KernelFactory>("engine.kernelFactory"),
    PlayerAPI: token<PlayerAPI<PlayerState>>("mods.player.api"),
    WorldAPI: token<WorldAPI>("mods.world.api")
  } as const;

  const container = new Container();

  const eventBus: EventBus = (() => {
    const subscribers = new Set<(event: Event) => void>();
    return {
      publish(event) {
        subscribers.forEach((handler) => handler(event));
      },
      subscribe(handler) {
        subscribers.add(handler);
        return () => subscribers.delete(handler);
      }
    };
  })();

  container.provide(TOKENS.EventBus, eventBus);
  container.provide(TOKENS.Clock, { now: () => Date.now() } satisfies Clock);
  container.provide(TOKENS.RNG, { next: () => Math.random() } satisfies RNG);

  const kernelFactory: KernelFactory = () => new Kernel();
  container.provide(TOKENS.KernelFactory, kernelFactory);

  const terrainRegistry = createTerrainRegistry();
  registerBaseTerrain(terrainRegistry);

  const playerConfig: PlayerModuleConfig = {
    worldWidth: WORLD_WIDTH,
    surfaceY: PLAYER_SURFACE_ROW,
    jumpHeight: 2,
    jumpDurationMs: 350
  };

  const playerApi = initPlayerModule({ config: playerConfig });
  container.provide(TOKENS.PlayerAPI, playerApi);

  const worldDeps: WorldModuleDeps<PlayerState> = {
    terrainRegistry,
    planProvider: () => createDefaultWorldPlan(terrainRegistry),
    players: container.get(TOKENS.PlayerAPI),
    createRuntime: container.get(TOKENS.KernelFactory)
  };

  const worldApi = initWorldModule(worldDeps);
  container.provide(TOKENS.WorldAPI, worldApi);

  worldApi.register(gameServer);

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

  return { app, httpServer, gameServer, container, ready };
}

if (require.main === module) {
  createServer().ready.catch(() => {
    process.exitCode = 1;
  });
}
