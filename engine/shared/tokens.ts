import type { MapSchema, Schema } from "@colyseus/schema";
import type { Server } from "colyseus";

import type { Command, Event, EventDraft } from "@engine/kernel";
import type { PlayerId, PlayerSnapshot } from "@mods/player/shared/player";

export interface EventBus {
  publish(event: Event | Event[]): void;
  subscribe(eventType: string | "*", handler: (event: Event) => void): () => void;
}

export type CommandHandler = (command: Command) => EventDraft[];

export interface CommandRuntime {
  register(type: string, handler: CommandHandler): void;
  dispatch(command: Command): Event[];
  subscribe(eventType: string | "*", handler: (event: Event) => void): () => void;
  getLog(): Event[];
}

export interface Clock {
  now(): number;
}

export interface RNG {
  next(): number;
}

export type KernelFactory = () => CommandRuntime;

export type PlayerStateCtor<TState extends Schema = Schema> = (new (
  snapshot: PlayerSnapshot
) => TState) & typeof Schema;

export interface PlayerRoomRuntime<TState extends Schema = Schema> {
  spawn(players: MapSchema<TState>, clientId: PlayerId): TState;
  remove(players: MapSchema<TState>, clientId: PlayerId): void;
  move(players: MapSchema<TState>, clientId: PlayerId, direction: -1 | 1): void;
  jump(players: MapSchema<TState>, clientId: PlayerId): void;
  dispose(): void;
}

export interface PlayerAPI<TState extends Schema = Schema> {
  stateCtor: PlayerStateCtor<TState>;
  createRoomRuntime(): PlayerRoomRuntime<TState>;
}

export interface WorldAPI {
  register(server: Server): void;
}
