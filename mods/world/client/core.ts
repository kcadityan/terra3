import { Client as ColyseusClient, Room } from "colyseus.js";

import type { WorldSnapshot } from "../shared/world";

type WorldStateMessage = {
  width: number;
  height: number;
  rows: Array<{
    cells: Array<{ x: number; y: number; terrain: string }>;
  }>;
};

type Listener = (snapshot: WorldSnapshot) => void;

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

  private fromState(state: WorldStateMessage): WorldSnapshot {
    return {
      width: state.width,
      height: state.height,
      cells: state.rows.map((row) =>
        row.cells.map((cell) => ({ x: cell.x, y: cell.y, terrain: cell.terrain as "Empty" }))
      )
    };
  }
}
