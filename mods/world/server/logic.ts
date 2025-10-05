import { Kernel, Command } from "../../../engine/kernel";
import {
  WORLD_EVENTS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  WorldSnapshot,
  createFilledGrid
} from "../shared/world";

export function initWorld(kernel: Kernel) {
  kernel.register("GenerateWorld", (_cmd: Command) => [
    {
      type: WORLD_EVENTS.Generated,
      v: 1,
      payload: createWorldSnapshot()
    }
  ]);
}

export function createWorldSnapshot(): WorldSnapshot {
  return {
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    cells: createFilledGrid()
  };
}
