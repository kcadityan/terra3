export const CommandTypes = {
  RawInput: "input.raw",
  ControlInput: "input.control",
  GenerateWorld: "world.generate",
  SpawnRequest: "entity.spawn-request",
  DespawnRequest: "entity.despawn-request"
} as const;

export type CommandType = (typeof CommandTypes)[keyof typeof CommandTypes];

export interface RawInputCommand {
  type: typeof CommandTypes.RawInput;
  payload: {
    actorId: string;
    kind: string;
    data?: unknown;
  };
}

export interface ControlInputCommand {
  type: typeof CommandTypes.ControlInput;
  payload: {
    actorId: string;
    controllerId: string;
    kind: string;
    data?: unknown;
  };
}

export interface GenerateWorldCommand {
  type: typeof CommandTypes.GenerateWorld;
  payload: {
    seed?: number;
  };
}

export interface SpawnRequestCommand {
  type: typeof CommandTypes.SpawnRequest;
  payload: {
    at?: { x: number; y: number };
    kind: string;
    ownerId?: string;
    entityId?: string;
  };
}

export interface DespawnRequestCommand {
  type: typeof CommandTypes.DespawnRequest;
  payload: {
    entityId: string;
    reason: string;
  };
}

export type KnownCommand =
  | RawInputCommand
  | ControlInputCommand
  | GenerateWorldCommand
  | SpawnRequestCommand
  | DespawnRequestCommand;

export const EventTypes = {
  BlockSet: "world.block-set",
  BlockChanged: "world.block-changed",
  EntitySpawned: "entity.spawned",
  EntityMoved: "entity.moved",
  EntityDespawned: "entity.despawned",
  ToolUsedOnBlock: "tool.used-on-block",
  AbilityUsed: "ability.used",
  ItemGranted: "inventory.item-granted",
  ItemConsumed: "inventory.item-consumed",
  DamageProposed: "combat.damage-proposed",
  DamageApplied: "combat.damage-applied",
  ModuleErrored: "kernel.module-errored"
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

export interface BlockSetEvent {
  type: typeof EventTypes.BlockSet;
  payload: {
    position: { x: number; y: number };
    material: string;
  };
}

export interface BlockChangedEvent {
  type: typeof EventTypes.BlockChanged;
  payload: {
    position: { x: number; y: number };
    from: string;
    to: string;
  };
}

export interface EntitySpawnedEvent {
  type: typeof EventTypes.EntitySpawned;
  payload: {
    entityId: string;
    kind: string;
    position: { x: number; y: number };
    ownerId?: string;
  };
}

export interface EntityMovedEvent {
  type: typeof EventTypes.EntityMoved;
  payload: {
    entityId: string;
    from: { x: number; y: number };
    to: { x: number; y: number };
    cause: string;
  };
}

export interface EntityDespawnedEvent {
  type: typeof EventTypes.EntityDespawned;
  payload: {
    entityId: string;
    reason: string;
  };
}

export interface ToolUsedOnBlockEvent {
  type: typeof EventTypes.ToolUsedOnBlock;
  payload: {
    toolId: string;
    byEntityId: string;
    position: { x: number; y: number };
    toolKind: string;
  };
}

export interface AbilityUsedEvent {
  type: typeof EventTypes.AbilityUsed;
  payload: {
    entityId: string;
    ability: string;
    args?: unknown;
  };
}

export interface ItemGrantedEvent {
  type: typeof EventTypes.ItemGranted;
  payload: {
    toEntityId: string;
    item: string;
    quantity: number;
  };
}

export interface ItemConsumedEvent {
  type: typeof EventTypes.ItemConsumed;
  payload: {
    fromEntityId: string;
    item: string;
    quantity: number;
  };
}

export interface DamageProposedEvent {
  type: typeof EventTypes.DamageProposed;
  payload: {
    targetId: string;
    sourceId: string;
    amount: number;
    kind: string;
  };
}

export interface DamageAppliedEvent {
  type: typeof EventTypes.DamageApplied;
  payload: {
    targetId: string;
    amount: number;
    hpAfter: number;
  };
}

export interface ModuleErroredEvent {
  type: typeof EventTypes.ModuleErrored;
  payload: {
    module: string;
    commandType: string;
    message: string;
  };
}

export type KnownEvent =
  | BlockSetEvent
  | BlockChangedEvent
  | EntitySpawnedEvent
  | EntityMovedEvent
  | EntityDespawnedEvent
  | ToolUsedOnBlockEvent
  | AbilityUsedEvent
  | ItemGrantedEvent
  | ItemConsumedEvent
  | DamageProposedEvent
  | DamageAppliedEvent
  | ModuleErroredEvent;
