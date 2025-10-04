import { Room, Server } from "colyseus";
import { ArraySchema, Schema, type } from "@colyseus/schema";

import { Kernel } from "../../../engine/kernel";
import {
  WORLD_EVENTS,
  WorldGeneratedEvent,
  WorldSnapshot
} from "../shared/world";
import { createWorldSnapshot, initWorld } from "./logic";

export class WorldCellState extends Schema {
  @type("number") declare x: number;
  @type("number") declare y: number;
  @type("string") declare terrain: string;

  constructor(x = 0, y = 0, terrain = "Empty") {
    super();
    this.x = x;
    this.y = y;
    this.terrain = terrain;
  }
}

export class WorldRowState extends Schema {
  @type([WorldCellState])
  declare cells: ArraySchema<WorldCellState>;

  constructor() {
    super();
    this.cells = new ArraySchema<WorldCellState>();
  }
}

export class WorldState extends Schema {
  @type("number")
  declare width: number;

  @type("number")
  declare height: number;

  @type([WorldRowState])
  declare rows: ArraySchema<WorldRowState>;

  constructor(snapshot: WorldSnapshot = createWorldSnapshot()) {
    super();
    this.width = snapshot.width;
    this.height = snapshot.height;
    this.rows = new ArraySchema<WorldRowState>();
  }
}

export class WorldRoom extends Room<WorldState> {
  private kernel: Kernel | undefined;

  onCreate(): void {
    this.kernel = new Kernel();
    initWorld(this.kernel);

    this.setState(new WorldState());
    this.applyWorld(this.generateWorld());

    this.onMessage("regenerate", () => {
      const snapshot = this.generateWorld();
      this.applyWorld(snapshot);
    });
  }

  private generateWorld(): WorldSnapshot {
    if (!this.kernel) {
      return createWorldSnapshot();
    }

    const events = this.kernel.dispatch({ type: "GenerateWorld", payload: {} });
    const worldEvent = events.find((evt): evt is WorldGeneratedEvent => evt.type === WORLD_EVENTS.Generated);
    return worldEvent?.payload ?? createWorldSnapshot();
  }

  private applyWorld(snapshot: WorldSnapshot): void {
    const { width, height, cells } = snapshot;
    this.state.width = width;
    this.state.height = height;

    this.state.rows.splice(0, this.state.rows.length);

    cells.forEach((row) => {
      const rowState = new WorldRowState();
      rowState.cells.splice(0, rowState.cells.length);
      row.forEach((cell) => {
        rowState.cells.push(new WorldCellState(cell.x, cell.y, cell.terrain));
      });
      this.state.rows.push(rowState);
    });
  }
}

export function registerWorldRoom(server: Server): void {
  server.define("world", WorldRoom);
}
