import { MapSchema, Schema, type } from "@colyseus/schema";

import type { PlayerRoomRuntime } from "@engine/shared/tokens";
import type { PlayerSnapshot, PlayerId } from "../shared/player";

export class PlayerState extends Schema {
  @type("string") declare id: PlayerId;
  @type("string") declare name: string;
  @type("number") declare x: number;
  @type("number") declare y: number;
  @type("boolean") declare isJumping: boolean;
  @type("string") declare facing: "left" | "right";

  constructor(snapshot: PlayerSnapshot) {
    super();
    this.id = snapshot.id;
    this.name = snapshot.name;
    this.x = snapshot.x;
    this.y = snapshot.y;
    this.isJumping = snapshot.isJumping;
    this.facing = snapshot.facing;
  }
}

export interface PlayerModuleDependencies {
  worldWidth: number;
  surfaceY?: number;
  jumpHeight?: number;
  jumpDurationMs?: number;
}

export type PlayerManager = PlayerRoomRuntime<PlayerState>;

export function createPlayerRuntime(deps: PlayerModuleDependencies): PlayerManager {
  const {
    worldWidth,
    surfaceY = 0,
    jumpHeight = 1,
    jumpDurationMs = 500
  } = deps;

  const standingRow = surfaceY;

  let nextSpawnIndex = 0;
  const jumpTimers = new Map<PlayerId, NodeJS.Timeout>();

  function spawn(players: MapSchema<PlayerState>, clientId: PlayerId): PlayerState {
    const spawnX = nextSpawnIndex % worldWidth;
    nextSpawnIndex += 1;

    const snapshot: PlayerSnapshot = {
      id: clientId,
      name: `Player ${nextSpawnIndex}`,
      x: spawnX,
      y: standingRow,
      isJumping: false,
      facing: "right"
    };

    const state = new PlayerState(snapshot);
    players.set(clientId, state);
    return state;
  }

  function remove(players: MapSchema<PlayerState>, clientId: PlayerId): void {
    const timer = jumpTimers.get(clientId);
    if (timer) {
      clearTimeout(timer);
      jumpTimers.delete(clientId);
    }
    players.delete(clientId);
  }

  function move(players: MapSchema<PlayerState>, clientId: PlayerId, direction: -1 | 1): void {
    const player = players.get(clientId);
    if (!player) return;

    const newX = Math.max(0, Math.min(worldWidth - 1, player.x + direction));
    player.x = newX;
    player.facing = direction < 0 ? "left" : "right";
  }

  function land(players: MapSchema<PlayerState>, clientId: PlayerId): void {
    const player = players.get(clientId);
    if (!player) return;
    player.y = standingRow;
    player.isJumping = false;
    jumpTimers.delete(clientId);
  }

  function jump(players: MapSchema<PlayerState>, clientId: PlayerId): void {
    const existingTimer = jumpTimers.get(clientId);
    if (existingTimer) {
      return; // ignore double jump until landing
    }

    const player = players.get(clientId);
    if (!player) return;

    player.y = Math.max(0, standingRow - jumpHeight);
    player.isJumping = true;

    const timer = setTimeout(() => {
      land(players, clientId);
    }, jumpDurationMs);

    jumpTimers.set(clientId, timer);
  }

  function dispose(): void {
    jumpTimers.forEach((timeout) => clearTimeout(timeout));
    jumpTimers.clear();
  }

  return {
    spawn,
    remove,
    move,
    jump,
    dispose
  };
}
