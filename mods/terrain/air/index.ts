import type { TerrainRegistry } from "../../world/shared/terrain";

export const AIR_TERRAIN_ID = "terrain.air" as const;

export function registerAirTerrain(registry: TerrainRegistry): void {
  registry.register({
    id: AIR_TERRAIN_ID,
    name: "Air",
    texturePath: "mods/terrain/air/textures/air.png",
    color: 0x87ceeb
  });
}
