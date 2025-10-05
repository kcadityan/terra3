import type { TerrainRegistry } from "../world/shared/terrain";
import { registerDirtTerrain } from "./dirt";
import { registerStoneTerrain } from "./stone";
import { registerGrassTerrain } from "./grass";
import { registerGoldTerrain } from "./gold";

export function registerBaseTerrain(registry: TerrainRegistry): void {
  registerGrassTerrain(registry);
  registerDirtTerrain(registry);
  registerStoneTerrain(registry);
  registerGoldTerrain(registry);
}

export {
  registerDirtTerrain,
  registerStoneTerrain,
  registerGrassTerrain,
  registerGoldTerrain
};
