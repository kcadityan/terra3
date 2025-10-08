import type { Server } from "colyseus";

import type { WorldAPI } from "@engine/shared/tokens";
import { registerWorldRoom, type WorldRoomDependencies } from "./room";

export { createWorldService, type TerrainPlan, type WorldModuleDependencies } from "./logic";

export type WorldModuleDeps = WorldRoomDependencies;

export function initWorldModule(deps: WorldModuleDeps): WorldAPI {
  return {
    register(server: Server) {
      registerWorldRoom(server, deps);
    }
  };
}

export type { WorldRoomDependencies };
