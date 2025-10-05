import { WORLD_HEIGHT, WORLD_WIDTH } from "../../../mods/world/shared/world";
import type { TerrainId, TerrainRegistry } from "../../../mods/world/shared/terrain";
import { AIR_TERRAIN_ID } from "../../../mods/terrain/air";
import { GRASS_TERRAIN_ID } from "../../../mods/terrain/grass";
import { DIRT_TERRAIN_ID } from "../../../mods/terrain/dirt";
import { STONE_TERRAIN_ID } from "../../../mods/terrain/stone";
import { GOLD_TERRAIN_ID } from "../../../mods/terrain/gold";

export const AIR_LAYERS = 4;
export const DIRT_LAYERS = 4;
export const GRASS_LAYER = AIR_LAYERS;
export const PLAYER_SURFACE_ROW = AIR_LAYERS - 1;

export const GOLD_DEPOSITS: Array<{ x: number; y: number }> = [
  { x: Math.floor(WORLD_WIDTH * 0.25), y: Math.floor(WORLD_HEIGHT * 0.6) },
  { x: Math.floor(WORLD_WIDTH * 0.45), y: Math.floor(WORLD_HEIGHT * 0.7) },
  { x: Math.floor(WORLD_WIDTH * 0.6), y: Math.floor(WORLD_HEIGHT * 0.75) },
  { x: Math.floor(WORLD_WIDTH * 0.8), y: Math.floor(WORLD_HEIGHT * 0.85) }
];

export function createDefaultWorldPlan(registry: TerrainRegistry): TerrainId[][] {
  registry.require(AIR_TERRAIN_ID);
  registry.require(GRASS_TERRAIN_ID);
  registry.require(DIRT_TERRAIN_ID);
  registry.require(STONE_TERRAIN_ID);
  registry.require(GOLD_TERRAIN_ID);

  const plan: TerrainId[][] = [];
  const stoneStart = GRASS_LAYER + 1 + DIRT_LAYERS;

  for (let y = 0; y < WORLD_HEIGHT; y += 1) {
    const row: TerrainId[] = [];
    for (let x = 0; x < WORLD_WIDTH; x += 1) {
      if (y < AIR_LAYERS) {
        row.push(AIR_TERRAIN_ID);
      } else if (y === GRASS_LAYER) {
        row.push(GRASS_TERRAIN_ID);
      } else if (y < stoneStart) {
        row.push(DIRT_TERRAIN_ID);
      } else {
        row.push(STONE_TERRAIN_ID);
      }
    }
    plan.push(row);
  }

  GOLD_DEPOSITS.forEach(({ x, y }) => {
    if (plan[y] && plan[y][x]) {
      plan[y][x] = GOLD_TERRAIN_ID;
    }
  });

  return plan;
}
