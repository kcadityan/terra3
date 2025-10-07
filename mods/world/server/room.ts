import { Room, Server } from "colyseus";
import type { Client } from "colyseus";
import { ArraySchema, Schema, type, MapSchema } from "@colyseus/schema";

import type {
  KernelFactory,
  PlayerAPI,
  PlayerRoomRuntime,
  PlayerStateCtor,
  CommandRuntime
} from "@engine/shared/tokens";
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

export function createWorldStateClass<TPlayerState extends Schema>(
  playerStateCtor: PlayerStateCtor<TPlayerState>
) {
  class WorldState extends Schema {
    @type("number") declare width: number;
    @type("number") declare height: number;
    @type([WorldRowState]) declare rows: ArraySchema<WorldRowState>;
    @type([TerrainDefinitionState]) declare palette: ArraySchema<TerrainDefinitionState>;
    @type({ map: playerStateCtor }) declare players: MapSchema<TPlayerState>;

    constructor(snapshot: WorldSnapshot) {
      super();
      this.width = snapshot.width;
      this.height = snapshot.height;
      this.rows = new ArraySchema<WorldRowState>();
      this.palette = new ArraySchema<TerrainDefinitionState>();
      this.players = new MapSchema<TPlayerState>();
    }
  }

  return WorldState;
}

export interface WorldRoomDependencies<TPlayerState extends Schema = Schema>
  extends WorldModuleDependencies {
  players: PlayerAPI<TPlayerState>;
  createRuntime: KernelFactory;
}

export function createWorldRoomClass<TPlayerState extends Schema>(
  deps: WorldRoomDependencies<TPlayerState>
) {
  const { players, createRuntime, terrainRegistry, planProvider } = deps;
  const service = createWorldService({ terrainRegistry, planProvider });
  const WorldState = createWorldStateClass(players.stateCtor);
  type RoomState = InstanceType<typeof WorldState>;
  type PlayerRuntime = PlayerRoomRuntime<TPlayerState>;

  return class WorldRoom extends Room<RoomState> {
    private runtime: CommandRuntime | undefined;
    private readonly playerRuntime: PlayerRuntime = players.createRoomRuntime();

    onCreate(): void {
      this.runtime = createRuntime();
      service.registerRuntime(this.runtime);

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
        this.playerRuntime.move(this.state.players, client.sessionId, message.direction);
      });

      this.onMessage("player:jump", (client) => {
        this.playerRuntime.jump(this.state.players, client.sessionId);
      });
    }

    onJoin(client: Client): void {
      this.playerRuntime.spawn(this.state.players, client.sessionId);
    }

    onLeave(client: Client): void {
      this.playerRuntime.remove(this.state.players, client.sessionId);
    }

    onDispose(): void {
      this.playerRuntime.dispose();
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
      if (!this.runtime) {
        return service.generateSnapshot();
      }

      const events = this.runtime.dispatch({ type: "GenerateWorld", payload: {} });
      const worldEvent = events.find((evt) => evt.type === WORLD_EVENTS.Generated);
      return worldEvent?.payload ?? service.generateSnapshot();
    }
  };
}

export function registerWorldRoom<TPlayerState extends Schema>(
  server: Server,
  deps: WorldRoomDependencies<TPlayerState>
): void {
  const WorldRoom = createWorldRoomClass(deps);
  server.define("world", WorldRoom);
}
