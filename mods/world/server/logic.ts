import { Kernel, Command } from "@engine/kernel";
import type { TerrainRegistry, TerrainId } from "../shared/terrain";
import { WORLD_EVENTS, WORLD_HEIGHT, WORLD_WIDTH, type WorldSnapshot } from "../shared/world";

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

  function registerKernel(kernel: Kernel) {
    kernel.register("GenerateWorld", (_cmd: Command) => [
      {
        type: WORLD_EVENTS.Generated,
        v: 1,
        payload: generateSnapshot()
      }
    ]);
  }

  return {
    registerKernel,
    generateSnapshot
  };
}
