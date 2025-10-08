import type { Command, EventDraft } from "@engine/kernel";
import type { CommandRuntime } from "@engine/shared/tokens";
import { CommandTypes, EventTypes } from "@engine/shared/contracts";
import type { TerrainRegistry, TerrainId } from "../shared/terrain";
import { WORLD_HEIGHT, WORLD_WIDTH, type WorldSnapshot } from "../shared/world";

export type TerrainPlan = TerrainId[][];

export interface WorldModuleDependencies {
  terrainRegistry: TerrainRegistry;
  planProvider: () => TerrainPlan;
}

export function createWorldService(deps: WorldModuleDependencies) {
  const { terrainRegistry, planProvider } = deps;

  function generateSnapshot(): WorldSnapshot {
    const plan = planProvider();
    if (plan.length !== WORLD_HEIGHT) {
      throw new Error(`Terrain plan expected ${WORLD_HEIGHT} rows, received ${plan.length}`);
    }

    plan.forEach((row, index) => {
      if (row.length !== WORLD_WIDTH) {
        throw new Error(
          `Terrain plan row ${index} expected length ${WORLD_WIDTH}, received ${row.length}`
        );
      }
    });

    return {
      width: WORLD_WIDTH,
      height: WORLD_HEIGHT,
      cells: plan,
      palette: terrainRegistry.all()
    };
  }

  function registerRuntime(runtime: CommandRuntime) {
    runtime.register(CommandTypes.GenerateWorld, (_cmd: Command) => {
      const snapshot = generateSnapshot();
      const events: EventDraft[] = [];

      snapshot.cells.forEach((row, y) => {
        row.forEach((material, x) => {
          events.push({
            type: EventTypes.BlockSet,
            payload: {
              position: { x, y },
              material
            },
            meta: {
              aggId: `block:${x},${y}`
            }
          });
        });
      });

      return events;
    });
  }

  return {
    registerRuntime,
    generateSnapshot
  };
}
