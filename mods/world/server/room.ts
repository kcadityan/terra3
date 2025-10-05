import { Room, Server } from "colyseus";
import { ArraySchema, Schema, type } from "@colyseus/schema";

import { Kernel } from "../../../engine/kernel";
import { WORLD_EVENTS, type WorldSnapshot } from "../shared/world";
import type { WorldModuleDependencies } from "./logic";
import { createWorldService } from "./logic";

export class TerrainDefinitionState extends Schema {
  @type("string") declare id: string;
  @type("string") declare name: string;
  @type("string") declare texturePath: string;
  @type("number") declare color: number;
}

export class WorldRowState extends Schema {
  @type(["string"]) declare cells: ArraySchema<string>;

  constructor() {
    super();
    this.cells = new ArraySchema<string>();
  }
}

export class WorldState extends Schema {
  @type("number") declare width: number;
  @type("number") declare height: number;
  @type([WorldRowState]) declare rows: ArraySchema<WorldRowState>;
  @type([TerrainDefinitionState]) declare palette: ArraySchema<TerrainDefinitionState>;

  constructor(snapshot: WorldSnapshot) {
    super();
    this.width = snapshot.width;
    this.height = snapshot.height;
    this.rows = new ArraySchema<WorldRowState>();
    this.palette = new ArraySchema<TerrainDefinitionState>();
  }
}

export function createWorldRoomClass(deps: WorldModuleDependencies) {
  return class WorldRoom extends Room<WorldState> {
    private kernel: Kernel | undefined;
    private readonly service = createWorldService(deps);

    onCreate(): void {
      this.kernel = new Kernel();
      this.service.registerKernel(this.kernel);

      const snapshot = this.generateWorld();
      this.setState(new WorldState(snapshot));
      this.applyWorld(snapshot);

      this.onMessage("regenerate", () => {
        const latest = this.generateWorld();
        this.applyWorld(latest);
      });
    }

    private applyWorld(snapshot: WorldSnapshot): void {
      this.state.width = snapshot.width;
      this.state.height = snapshot.height;

      this.state.rows.splice(0, this.state.rows.length);
      snapshot.cells.forEach((row) => {
        const rowState = new WorldRowState();
        rowState.cells.splice(0, rowState.cells.length);
        row.forEach((terrainId) => {
          rowState.cells.push(terrainId);
        });
        this.state.rows.push(rowState);
      });

      this.state.palette.splice(0, this.state.palette.length);
      snapshot.palette.forEach((def) => {
        const entry = new TerrainDefinitionState();
        entry.id = def.id;
        entry.name = def.name;
        entry.texturePath = def.texturePath;
        entry.color = def.color;
        this.state.palette.push(entry);
      });
    }
    
    private generateWorld(): WorldSnapshot {
      if (!this.kernel) {
        return this.service.generateSnapshot();
      }

      const events = this.kernel.dispatch({ type: "GenerateWorld", payload: {} });
      const worldEvent = events.find((evt) => evt.type === WORLD_EVENTS.Generated);
      return worldEvent?.payload ?? this.service.generateSnapshot();
    }
  };
}

export function registerWorldRoom(server: Server, deps: WorldModuleDependencies): void {
  const WorldRoom = createWorldRoomClass(deps);
  server.define("world", WorldRoom);
}
