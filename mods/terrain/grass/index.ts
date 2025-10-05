import type { TerrainRegistry } from "../../world/shared/terrain";

export const GRASS_TERRAIN_ID = "terrain.grass" as const;

export function registerGrassTerrain(registry: TerrainRegistry): void {
  registry.register({
    id: GRASS_TERRAIN_ID,
    name: "Grass",
    texturePath: "mods/terrain/grass/textures/grass.png",
    color: 0x3a9d23
  });
}
