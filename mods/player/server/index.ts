import type { PlayerAPI } from "@engine/shared/tokens";

import { createPlayerRuntime, PlayerState } from "./logic";
import type { PlayerModuleDependencies, PlayerManager } from "./logic";
import { createPlayerController, type PlayerController } from "./control";

export interface PlayerModuleConfig extends PlayerModuleDependencies {}

export interface PlayerModuleDeps {
  config: PlayerModuleConfig;
}

export function initPlayerModule(deps: PlayerModuleDeps): PlayerAPI<PlayerState> {
  const { config } = deps;
  return {
    stateCtor: PlayerState,
    createRoomRuntime(): PlayerManager {
      return createPlayerRuntime(config);
    }
  };
}

export { PlayerState };
export { createPlayerController };
export type { PlayerModuleDependencies, PlayerManager, PlayerController };
