import type { Event } from "../../../engine/kernel";

export const WORLD_WIDTH = 10;
export const WORLD_HEIGHT = 10;

export type WorldTerrain = "Dirt";

export interface WorldCell {
  x: number;
  y: number;
  terrain: WorldTerrain;
}

export type WorldGrid = WorldCell[][];

export interface WorldSnapshot {
  width: number;
  height: number;
  cells: WorldGrid;
}

export type WorldGeneratedEvent = Event & {
  type: "WorldGenerated";
  payload: WorldSnapshot;
};

export const WORLD_EVENTS = {
  Generated: "WorldGenerated" as const
};

const DEFAULT_TERRAIN: WorldTerrain = "Dirt";

export function createFilledGrid(): WorldGrid {
  return Array.from({ length: WORLD_HEIGHT }, (_row, y) =>
    Array.from({ length: WORLD_WIDTH }, (_col, x) => ({ x, y, terrain: DEFAULT_TERRAIN }))
  );
}

export { DEFAULT_TERRAIN };
