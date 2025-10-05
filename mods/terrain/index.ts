import type { TerrainRegistry } from "../world/shared/terrain";
import { registerAirTerrain } from "./air";
import { registerDirtTerrain } from "./dirt";
import { registerStoneTerrain } from "./stone";
import { registerGrassTerrain } from "./grass";
import { registerGoldTerrain } from "./gold";

export function registerBaseTerrain(registry: TerrainRegistry): void {
  registerAirTerrain(registry);
  registerGrassTerrain(registry);
  registerDirtTerrain(registry);
  registerStoneTerrain(registry);
  registerGoldTerrain(registry);
}

export {
  registerAirTerrain,
  registerDirtTerrain,
  registerStoneTerrain,
  registerGrassTerrain,
  registerGoldTerrain
};
