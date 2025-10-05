import type { TerrainRegistry } from "../../world/shared/terrain";

export const DIRT_TERRAIN_ID = "terrain.dirt" as const;

export function registerDirtTerrain(registry: TerrainRegistry): void {
  registry.register({
    id: DIRT_TERRAIN_ID,
    name: "Dirt",
    texturePath: "mods/terrain/dirt/textures/dirt.png",
    color: 0x6b4f2a
  });
}
