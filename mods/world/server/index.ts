import { Kernel, Command, Event } from "../../../engine/kernel";

const WORLD_WIDTH = 10;
const WORLD_HEIGHT = 10;

export function initWorld(kernel: Kernel) {
  kernel.register("GenerateWorld", (_cmd: Command): Event[] => [
    {
      type: "WorldGenerated",
      v: 1,
      payload: {
        width: WORLD_WIDTH,
        height: WORLD_HEIGHT,
        cells: createEmptyCells()
      }
    }
  ]);
}

function createEmptyCells() {
  return Array.from({ length: WORLD_HEIGHT }, () =>
    Array.from({ length: WORLD_WIDTH }, () => ({ terrain: "Empty" as const }))
  );
}
