import { MapSchema } from "@colyseus/schema";

import type { CommandRuntime, PlayerRoomRuntime } from "@engine/shared/tokens";
import { CommandTypes, EventTypes } from "@engine/shared/contracts";
import type {
  ControlInputCommand,
  DespawnRequestCommand,
  SpawnRequestCommand
} from "@engine/shared/contracts";
import type { EventDraft } from "@engine/kernel";

import { PlayerState } from "./logic";

export interface PlayerControllerDeps<TState extends PlayerState = PlayerState> {
  runtime: CommandRuntime;
  manager: PlayerRoomRuntime<TState>;
  players: MapSchema<TState>;
}

export interface PlayerController<TState extends PlayerState = PlayerState> {
  register(): void;
  spawn(payload: SpawnRequestCommand["payload"]): void;
  despawn(payload: DespawnRequestCommand["payload"]): void;
  control(payload: ControlInputCommand["payload"]): void;
}

export function createPlayerController<TState extends PlayerState = PlayerState>(
  deps: PlayerControllerDeps<TState>
): PlayerController<TState> {
  const { runtime, manager, players } = deps;

  function entityAgg(entityId: string): string {
    return `entity:${entityId}`;
  }

  function register(): void {
    runtime.register(CommandTypes.SpawnRequest, (command) => {
      const payload = command.payload as SpawnRequestCommand["payload"];
      const entityId = payload.entityId ?? payload.ownerId ?? payload.kind;
      const state = manager.spawn(players, entityId) as TState;
      return [
        entitySpawnedEvent(entityId, payload.kind, payload.ownerId, state)
      ];
    });

    runtime.register(CommandTypes.DespawnRequest, (command) => {
      const payload = command.payload as DespawnRequestCommand["payload"];
      const existing = players.get(payload.entityId);
      if (!existing) {
        return [];
      }
      manager.remove(players, payload.entityId);
      return [
        {
          type: EventTypes.EntityDespawned,
          payload: {
            entityId: payload.entityId,
            reason: payload.reason
          },
          meta: {
            aggId: entityAgg(payload.entityId)
          }
        }
      ];
    });

    runtime.register(CommandTypes.ControlInput, (command) => {
      const payload = command.payload as ControlInputCommand["payload"];
      const player = players.get(payload.actorId);
      if (!player) {
        return [];
      }

      if (payload.kind === "move") {
        const direction = Number((payload.data as { direction?: number } | undefined)?.direction);
        if (direction !== -1 && direction !== 1) {
          return [];
        }
        const from = { x: player.x, y: player.y };
        manager.move(players, payload.actorId, direction);
        const updated = players.get(payload.actorId);
        if (!updated) {
          return [];
        }
        return [entityMovedEvent(payload.actorId, from, { x: updated.x, y: updated.y }, "move")];
      }

      if (payload.kind === "jump") {
        const from = { x: player.x, y: player.y };
        manager.jump(players, payload.actorId);
        const updated = players.get(payload.actorId);
        if (!updated) {
          return [];
        }
        return [
          {
            type: EventTypes.AbilityUsed,
            payload: {
              entityId: payload.actorId,
              ability: "jump"
            },
            meta: {
              aggId: entityAgg(payload.actorId)
            }
          },
          entityMovedEvent(payload.actorId, from, { x: updated.x, y: updated.y }, "jump")
        ];
      }

      return [];
    });
  }

  function spawn(payload: SpawnRequestCommand["payload"]): void {
    runtime.dispatch({
      type: CommandTypes.SpawnRequest,
      payload,
      meta: {
        aggId: entityAgg(payload.entityId ?? payload.ownerId ?? payload.kind)
      }
    });
  }

  function despawn(payload: DespawnRequestCommand["payload"]): void {
    runtime.dispatch({
      type: CommandTypes.DespawnRequest,
      payload,
      meta: {
        aggId: entityAgg(payload.entityId)
      }
    });
  }

  function control(payload: ControlInputCommand["payload"]): void {
    runtime.dispatch({
      type: CommandTypes.ControlInput,
      payload,
      meta: {
        aggId: entityAgg(payload.actorId)
      }
    });
  }

  function entitySpawnedEvent(
    entityId: string,
    kind: string,
    ownerId: string | undefined,
    state: TState
  ): EventDraft {
    return {
      type: EventTypes.EntitySpawned,
      payload: {
        entityId,
        kind,
        position: { x: state.x, y: state.y },
        ownerId
      },
      meta: {
        aggId: entityAgg(entityId)
      }
    };
  }

  function entityMovedEvent(
    entityId: string,
    from: { x: number; y: number },
    to: { x: number; y: number },
    cause: string
  ): EventDraft {
    return {
      type: EventTypes.EntityMoved,
      payload: {
        entityId,
        from,
        to,
        cause
      },
      meta: {
        aggId: entityAgg(entityId)
      }
    };
  }

  return {
    register,
    spawn,
    despawn,
    control
  };
}
