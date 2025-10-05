import { WORLD_HEIGHT, WORLD_WIDTH } from "../../../mods/world/shared/world";
import type { TerrainId, TerrainRegistry } from "../../../mods/world/shared/terrain";
import { GRASS_TERRAIN_ID } from "../../../mods/terrain/grass";
import { DIRT_TERRAIN_ID } from "../../../mods/terrain/dirt";
import { STONE_TERRAIN_ID } from "../../../mods/terrain/stone";
import { GOLD_TERRAIN_ID } from "../../../mods/terrain/gold";

export function createDefaultWorldPlan(registry: TerrainRegistry): TerrainId[][] {
  registry.require(GRASS_TERRAIN_ID);
  registry.require(DIRT_TERRAIN_ID);
  registry.require(STONE_TERRAIN_ID);
  registry.require(GOLD_TERRAIN_ID);

  const plan: TerrainId[][] = [];

  for (let y = 0; y < WORLD_HEIGHT; y += 1) {
    const row: TerrainId[] = [];
    for (let x = 0; x < WORLD_WIDTH; x += 1) {
      if (y === 0) {
        row.push(GRASS_TERRAIN_ID);
      } else if (y <= 2) {
        row.push(DIRT_TERRAIN_ID);
      } else {
        row.push(STONE_TERRAIN_ID);
      }
    }
    plan.push(row);
  }

  const goldDeposits: Array<{ x: number; y: number }> = [
    { x: Math.floor(WORLD_WIDTH * 0.3), y: Math.floor(WORLD_HEIGHT * 0.6) },
    { x: Math.floor(WORLD_WIDTH * 0.5), y: Math.floor(WORLD_HEIGHT * 0.7) },
    { x: Math.floor(WORLD_WIDTH * 0.7), y: Math.floor(WORLD_HEIGHT * 0.8) }
  ];

  goldDeposits.forEach(({ x, y }) => {
    if (plan[y] && plan[y][x]) {
      plan[y][x] = GOLD_TERRAIN_ID;
    }
  });

  return plan;
}
