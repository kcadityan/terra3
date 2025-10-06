import { Client as ColyseusClient, Room } from "colyseus.js";

import type { TerrainDefinition, TerrainId } from "../shared/terrain";
import type { WorldStateView } from "../shared/world";
import type { PlayerSnapshot } from "@mods/player/shared/player";

type WorldStateMessage = {
  width: number;
  height: number;
  rows: Array<{
    cells: Array<string>;
  }>;
  palette: Array<TerrainDefinition>;
  players?: Map<string, PlayerSnapshot> | Record<string, PlayerSnapshot>;
};

type Listener = (snapshot: WorldStateView) => void;

export class WorldClient {
  private readonly client: ColyseusClient;
  private room: Room<WorldStateMessage> | undefined;
  private listeners = new Set<Listener>();

  constructor(endpoint: string) {
    this.client = new ColyseusClient(endpoint);
  }

  async connect(): Promise<void> {
    this.room = await this.client.joinOrCreate<WorldStateMessage>("world");
    this.room.onStateChange((state) => {
      const snapshot = this.fromState(state);
      this.listeners.forEach((listener) => listener(snapshot));
    });
  }

  onWorldUpdate(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  regenerateWorld(): void {
    this.room?.send("regenerate");
  }

  move(direction: -1 | 1): void {
    this.room?.send("player:move", { direction });
  }

  jump(): void {
    this.room?.send("player:jump");
  }

  private fromState(state: WorldStateMessage): WorldStateView {
    const players: PlayerSnapshot[] = [];
    const collection = state.players as unknown;
    if (collection && typeof (collection as { forEach?: unknown }).forEach === "function") {
      (collection as { forEach: (cb: (value: PlayerSnapshot) => void) => void }).forEach((player) => {
        players.push({ ...player });
      });
    } else if (collection && typeof collection === "object") {
      Object.values(collection as Record<string, PlayerSnapshot>).forEach((player) => {
        players.push({ ...player });
      });
    }

    return {
      width: state.width,
      height: state.height,
      cells: state.rows.map((row) => row.cells.map((terrainId) => terrainId as TerrainId)),
      palette: state.palette.map((entry) => ({
        id: entry.id,
        name: entry.name,
        texturePath: entry.texturePath,
        color: entry.color
      })),
      players
    };
  }
}
