import assert from "node:assert/strict";
import { MapSchema } from "@colyseus/schema";

import { Kernel, type Command, type Event } from "../engine/kernel";
import { CommandTypes, EventTypes } from "../engine/shared/contracts";
import {
  createDefaultWorldPlan,
  GOLD_DEPOSITS,
  AIR_LAYERS,
  DIRT_LAYERS,
  GRASS_LAYER,
  PLAYER_SURFACE_ROW
} from "../engine/world/plan/defaultPlan";
import { WORLD_WIDTH, WORLD_HEIGHT } from "../mods/world/shared/world";
import { createTerrainRegistry } from "../mods/world/shared/terrain";
import { createWorldService } from "../mods/world/server";
import { registerBaseTerrain } from "../mods/terrain";
import { AIR_TERRAIN_ID } from "../mods/terrain/air";
import { GRASS_TERRAIN_ID } from "../mods/terrain/grass";
import { DIRT_TERRAIN_ID } from "../mods/terrain/dirt";
import { STONE_TERRAIN_ID } from "../mods/terrain/stone";
import { GOLD_TERRAIN_ID } from "../mods/terrain/gold";
import { initPlayerModule, createPlayerController } from "../mods/player/server";

interface TestCase {
  name: string;
  fn: () => void | Promise<void>;
}

const tests: TestCase[] = [];

function test(name: string, fn: () => void | Promise<void>) {
  tests.push({ name, fn });
}

type DraftFactory = (command: Command) => { type: string; payload: unknown; meta?: Record<string, unknown> }[];

function registerMineHandler(kernel: Kernel, handler?: DraftFactory) {
  kernel.register(
    "Mine",
    handler ?? ((cmd: Command) => [{ type: "Mined", payload: { player: (cmd.payload as { player: string }).player, ore: (cmd.payload as { ore: string }).ore } }])
  );
}

test("dispatch wraps handler output with metadata", () => {
  const kernel = new Kernel();
  registerMineHandler(kernel);

  const events = kernel.dispatch({ type: "Mine", payload: { player: "Dia", ore: "gold" } });

  assert.equal(events.length, 1);
  const [event] = events;
  assert.equal(event.type, "Mined");
  assert.equal((event.payload as { ore: string }).ore, "gold");
  assert.ok(event.meta.aggId.length > 0);
  assert.equal(event.meta.seq, 1);
  assert.ok(event.meta.ts <= Date.now());
  assert.equal(event.meta.cause?.commandType, "Mine");
});

test("dispatch records events in log with increasing sequence", () => {
  const kernel = new Kernel();
  registerMineHandler(kernel);

  kernel.dispatch({ type: "Mine", payload: { player: "Dia", ore: "silver" } });
  kernel.dispatch({ type: "Mine", payload: { player: "Dia", ore: "iron" } });

  const log = kernel.getLog();
  assert.equal(log.length, 2);
  assert.equal(log[0].meta.seq, 1);
  assert.equal(log[1].meta.seq, 2);
});

test("dispatching unknown command produces no events", () => {
  const kernel = new Kernel();
  const events = kernel.dispatch({ type: "Unknown", payload: {} });
  assert.deepEqual(events, []);
  assert.deepEqual(kernel.getLog(), []);
});

test("most recent register wins", () => {
  const kernel = new Kernel();
  registerMineHandler(kernel, () => [{ type: "Legacy", payload: {} }]);
  registerMineHandler(kernel, () => [{ type: "Replacement", payload: {} }]);

  const [event] = kernel.dispatch({ type: "Mine", payload: {} });
  assert.equal(event.type, "Replacement");
});

test("failed handler is isolated and yields no events", () => {
  const kernel = new Kernel();
  registerMineHandler(kernel, () => {
    throw new Error("boom");
  });

  const events = kernel.dispatch({ type: "Mine", payload: {} });
  assert.deepEqual(events, []);
  assert.deepEqual(kernel.getLog(), []);
});

test("subscribers receive published events", () => {
  const kernel = new Kernel();
  registerMineHandler(kernel);

  let received: Event | undefined;
  kernel.subscribe("Mined", (evt) => {
    received = evt;
  });

  kernel.dispatch({ type: "Mine", payload: { player: "Dia", ore: "gold" } });
  assert.equal(received?.type, "Mined");
});

test("world generator emits block events aligned with plan", () => {
  const kernel = new Kernel();
  const terrainRegistry = createTerrainRegistry();
  registerBaseTerrain(terrainRegistry);

  const worldService = createWorldService({
    terrainRegistry,
    planProvider: () => createDefaultWorldPlan(terrainRegistry)
  });

  worldService.registerRuntime(kernel);

  const events = kernel.dispatch({ type: CommandTypes.GenerateWorld, payload: {} });
  assert.equal(events.length, WORLD_WIDTH * WORLD_HEIGHT);

  const paletteIds = terrainRegistry.all().map((def) => def.id);
  const goldSet = new Set(GOLD_DEPOSITS.map(({ x, y }) => `${x},${y}`));
  const stoneStart = GRASS_LAYER + 1 + DIRT_LAYERS;

  events.forEach((event) => {
    assert.equal(event.type, EventTypes.BlockSet);
    const payload = event.payload as { position: { x: number; y: number }; material: string };
    const {
      position: { x, y },
      material
    } = payload;

    assert.ok(paletteIds.includes(material));

    const key = `${x},${y}`;
    if (goldSet.has(key)) {
      assert.equal(material, GOLD_TERRAIN_ID);
      return;
    }

    if (y < AIR_LAYERS) {
      assert.equal(material, AIR_TERRAIN_ID);
    } else if (y === GRASS_LAYER) {
      assert.equal(material, GRASS_TERRAIN_ID);
    } else if (y < stoneStart) {
      assert.equal(material, DIRT_TERRAIN_ID);
    } else {
      assert.equal(material, STONE_TERRAIN_ID);
    }
  });
});

test("player runtime preserves surface rules", async () => {
  const playerApi = initPlayerModule({
    config: {
      worldWidth: WORLD_WIDTH,
      surfaceY: PLAYER_SURFACE_ROW,
      jumpHeight: 2,
      jumpDurationMs: 15
    }
  });

  const PlayerStateCtor = playerApi.stateCtor;
  const players = new MapSchema<InstanceType<typeof PlayerStateCtor>>();
  const runtime = playerApi.createRoomRuntime();

  const spawned = runtime.spawn(players, "client-1");
  assert.equal(spawned.x, 0);
  assert.equal(spawned.y, PLAYER_SURFACE_ROW);

  runtime.move(players, "client-1", 1);
  assert.equal(players.get("client-1")?.x, 1);

  runtime.jump(players, "client-1");
  assert.equal(players.get("client-1")?.isJumping, true);

  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(players.get("client-1")?.y, PLAYER_SURFACE_ROW);

  runtime.dispose();
});

test("player controller routes through kernel and updates state", () => {
  const kernel = new Kernel();
  const playerApi = initPlayerModule({
    config: {
      worldWidth: WORLD_WIDTH,
      surfaceY: PLAYER_SURFACE_ROW,
      jumpHeight: 2,
      jumpDurationMs: 15
    }
  });

  const PlayerStateCtor = playerApi.stateCtor;
  const players = new MapSchema<InstanceType<typeof PlayerStateCtor>>();
  const controller = createPlayerController({
    runtime: kernel,
    manager: playerApi.createRoomRuntime(),
    players
  });

  controller.register();

  controller.spawn({ entityId: "player-1", kind: "player", ownerId: "player-1" });
  const spawnEvent = kernel.getLog().find((event) => event.type === EventTypes.EntitySpawned);
  assert.ok(spawnEvent, "expected spawn event");
  assert.ok(players.has("player-1"));

  controller.control({ actorId: "player-1", controllerId: "player-1", kind: "move", data: { direction: 1 } });
  const moveEvent = kernel
    .getLog()
    .filter((event) => event.type === EventTypes.EntityMoved)
    .pop();
  assert.ok(moveEvent, "expected move event");
  assert.equal(players.get("player-1")?.x, 1);

  controller.despawn({ entityId: "player-1", reason: "cleanup" });
  const despawnEvent = kernel
    .getLog()
    .filter((event) => event.type === EventTypes.EntityDespawned)
    .pop();
  assert.ok(despawnEvent, "expected despawn event");
  assert.equal(players.has("player-1"), false);
});

async function run() {
  let failures = 0;

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`[pass] ${name}`);
    } catch (err) {
      failures += 1;
      console.error(`[fail] ${name}`);
      console.error(err instanceof Error ? err.stack ?? err.message : err);
    }
  }

  if (failures > 0) {
    console.error(`${failures} test(s) failed.`);
    process.exit(1);
  }

  console.log(`${tests.length} test(s) passed.`);
}

void run();
