import { Room, Server } from "colyseus";
import type { Client } from "colyseus";
import { ArraySchema, Schema, type, MapSchema } from "@colyseus/schema";

import { Kernel } from "@engine/kernel";
import { WORLD_EVENTS, type WorldSnapshot } from "../shared/world";
import type { WorldModuleDependencies } from "./logic";
import { createWorldService } from "./logic";
import type { PlayerManager } from "@mods/player/server";
import { PlayerState } from "@mods/player/server";

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
  @type({ map: PlayerState }) declare players: MapSchema<PlayerState>;

  constructor(snapshot: WorldSnapshot) {
    super();
    this.width = snapshot.width;
    this.height = snapshot.height;
    this.rows = new ArraySchema<WorldRowState>();
    this.palette = new ArraySchema<TerrainDefinitionState>();
    this.players = new MapSchema<PlayerState>();
  }
}

export interface WorldRoomDependencies extends WorldModuleDependencies {
  createPlayerManager: () => PlayerManager;
}

export function createWorldRoomClass(deps: WorldRoomDependencies) {
  return class WorldRoom extends Room<WorldState> {
    private kernel: Kernel | undefined;
    private readonly service = createWorldService(deps);
    private readonly playerManager = deps.createPlayerManager();

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

      this.onMessage("player:move", (client, message: { direction: -1 | 1 }) => {
        if (!message || (message.direction !== -1 && message.direction !== 1)) {
          return;
        }
        this.playerManager.move(this.state.players, client.sessionId, message.direction);
      });

      this.onMessage("player:jump", (client) => {
        this.playerManager.jump(this.state.players, client.sessionId);
      });
    }

    onJoin(client: Client): void {
      this.playerManager.spawn(this.state.players, client.sessionId);
    }

    onLeave(client: Client): void {
      this.playerManager.remove(this.state.players, client.sessionId);
    }

    onDispose(): void {
      this.playerManager.dispose();
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

export function registerWorldRoom(server: Server, deps: WorldRoomDependencies): void {
  const WorldRoom = createWorldRoomClass(deps);
  server.define("world", WorldRoom);
}
