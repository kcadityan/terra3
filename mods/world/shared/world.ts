import type { Event } from "../../../engine/kernel";
import type { TerrainDefinition, TerrainId } from "./terrain";

export const WORLD_WIDTH = 10;
export const WORLD_HEIGHT = 10;

export interface WorldSnapshot {
  width: number;
  height: number;
  cells: TerrainId[][];
  palette: TerrainDefinition[];
}

export type WorldGeneratedEvent = Event & {
  type: "WorldGenerated";
  payload: WorldSnapshot;
};

export const WORLD_EVENTS = {
  Generated: "WorldGenerated" as const
};
