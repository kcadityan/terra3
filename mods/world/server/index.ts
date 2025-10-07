import type { Schema } from "@colyseus/schema";
import type { Server } from "colyseus";

import type { WorldAPI } from "@engine/shared/tokens";
import { registerWorldRoom, type WorldRoomDependencies } from "./room";

export { createWorldService, type TerrainPlan, type WorldModuleDependencies } from "./logic";

export type WorldModuleDeps<TPlayerState extends Schema = Schema> = WorldRoomDependencies<TPlayerState>;

export function initWorldModule<TPlayerState extends Schema = Schema>(
  deps: WorldModuleDeps<TPlayerState>
): WorldAPI {
  return {
    register(server: Server) {
      registerWorldRoom(server, deps);
    }
  };
}

export type { WorldRoomDependencies };
