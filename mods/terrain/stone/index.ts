import type { TerrainRegistry } from "@mods/world/shared/terrain";

export const STONE_TERRAIN_ID = "terrain.stone" as const;

export function registerStoneTerrain(registry: TerrainRegistry): void {
  registry.register({
    id: STONE_TERRAIN_ID,
    name: "Stone",
    texturePath: "mods/terrain/stone/textures/stone.png",
    color: 0x505050
  });
}
