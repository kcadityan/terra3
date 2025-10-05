import type { Event } from "../../../engine/kernel";
import type { TerrainDefinition, TerrainId } from "./terrain";
import type { PlayerSnapshot } from "../../player/shared/player";

export const WORLD_WIDTH = 20;
export const WORLD_HEIGHT = 16;

export interface WorldSnapshot {
  width: number;
  height: number;
  cells: TerrainId[][];
  palette: TerrainDefinition[];
}

export interface WorldStateView extends WorldSnapshot {
  players: PlayerSnapshot[];
}

export type WorldGeneratedEvent = Event & {
  type: "WorldGenerated";
  payload: WorldSnapshot;
};

export const WORLD_EVENTS = {
  Generated: "WorldGenerated" as const
};
