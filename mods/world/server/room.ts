import { Room, Server } from "colyseus";
import type { Client } from "colyseus";
import { ArraySchema, Schema, type, MapSchema } from "@colyseus/schema";

import type { KernelFactory, PlayerAPI, PlayerRoomRuntime, CommandRuntime } from "@engine/shared/tokens";
import { CommandTypes, EventTypes } from "@engine/shared/contracts";
import type { Command } from "@engine/kernel";
import type { ControlInputCommand, DespawnRequestCommand, SpawnRequestCommand } from "@engine/shared/contracts";
import type { WorldSnapshot } from "../shared/world";
import { createPlayerController, PlayerState, type PlayerController } from "@mods/player/server";
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

export function createWorldStateClass(playerStateCtor: typeof PlayerState) {
  class WorldState extends Schema {
    @type("number") declare width: number;
    @type("number") declare height: number;
    @type([WorldRowState]) declare rows: ArraySchema<WorldRowState>;
    @type([TerrainDefinitionState]) declare palette: ArraySchema<TerrainDefinitionState>;
    @type({ map: playerStateCtor }) declare players: MapSchema<PlayerState>;

    constructor(snapshot: WorldSnapshot) {
      super();
      this.width = snapshot.width;
      this.height = snapshot.height;
      this.rows = new ArraySchema<WorldRowState>();
      this.palette = new ArraySchema<TerrainDefinitionState>();
      this.players = new MapSchema<PlayerState>();
    }
  }

  return WorldState;
}

export interface WorldRoomDependencies extends WorldModuleDependencies {
  players: PlayerAPI<PlayerState>;
  createRuntime: KernelFactory;
}

export function createWorldRoomClass(deps: WorldRoomDependencies) {
  const { players, createRuntime, terrainRegistry, planProvider } = deps;
  const service = createWorldService({ terrainRegistry, planProvider });
  const WorldState = createWorldStateClass(players.stateCtor as typeof PlayerState);
  type RoomState = InstanceType<typeof WorldState>;
  type PlayerRuntime = PlayerRoomRuntime<PlayerState>;

  return class WorldRoom extends Room<RoomState> {
    private runtime: CommandRuntime | undefined;
    private readonly playerRuntime: PlayerRuntime = players.createRoomRuntime();
    private playerController: PlayerController<PlayerState> | undefined;

    onCreate(): void {
      this.runtime = createRuntime();
      service.registerRuntime(this.runtime);

      const snapshot = this.generateWorld();
      this.setState(new WorldState(snapshot));
      this.applyWorld(snapshot);

      if (this.runtime) {
        this.playerController = createPlayerController({
          runtime: this.runtime,
          manager: this.playerRuntime,
          players: this.state.players
        });
        this.playerController.register();
      }

      this.onMessage("regenerate", () => {
        const latest = this.generateWorld();
        this.applyWorld(latest);
      });

      this.onMessage("player:move", (client, message: { direction: -1 | 1 }) => {
        if (!message || (message.direction !== -1 && message.direction !== 1)) {
          return;
        }
        this.playerController?.control({
          actorId: client.sessionId,
          controllerId: client.sessionId,
          kind: "move",
          data: { direction: message.direction }
        });
      });

      this.onMessage("player:jump", (client) => {
        this.playerController?.control({
          actorId: client.sessionId,
          controllerId: client.sessionId,
          kind: "jump"
        });
      });
    }

    onJoin(client: Client): void {
      this.playerController?.spawn({
        entityId: client.sessionId,
        kind: "player",
        ownerId: client.sessionId
      });
    }

    onLeave(client: Client): void {
      this.playerController?.despawn({ entityId: client.sessionId, reason: "left-room" });
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

      const command: Command = {
        type: CommandTypes.GenerateWorld,
        payload: {},
        meta: { aggId: "world:bootstrap" }
      };

      const events = this.runtime.dispatch(command);
      if (events.length === 0) {
        return service.generateSnapshot();
      }

      const base = service.generateSnapshot();
      const cells = base.cells.map((row) => row.slice());

      events
        .filter((evt) => evt.type === EventTypes.BlockSet)
        .forEach((evt) => {
          const payload = evt.payload as { position: { x: number; y: number }; material: string };
          const { x, y } = payload.position;
          if (cells[y] && cells[y][x] !== undefined) {
            cells[y][x] = payload.material;
          }
        });

      return {
        ...base,
        cells
      };
    }
  };
}

export function registerWorldRoom(server: Server, deps: WorldRoomDependencies): void {
  const WorldRoom = createWorldRoomClass(deps);
  server.define("world", WorldRoom);
}
