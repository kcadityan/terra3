import type { TerrainRegistry } from "../../world/shared/terrain";

export const GOLD_TERRAIN_ID = "terrain.gold" as const;

export function registerGoldTerrain(registry: TerrainRegistry): void {
  registry.register({
    id: GOLD_TERRAIN_ID,
    name: "Gold",
    texturePath: "mods/terrain/gold/textures/gold.png",
    color: 0xd4af37
  });
}
