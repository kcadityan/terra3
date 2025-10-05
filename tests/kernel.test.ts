import assert from "node:assert/strict";
import { Kernel, Command, Event } from "../engine/kernel";
import { createDefaultWorldPlan } from "../engine/world/plan/defaultPlan";
import { registerBaseTerrain } from "../mods/terrain";
import { GRASS_TERRAIN_ID } from "../mods/terrain/grass";
import { DIRT_TERRAIN_ID } from "../mods/terrain/dirt";
import { STONE_TERRAIN_ID } from "../mods/terrain/stone";
import { GOLD_TERRAIN_ID } from "../mods/terrain/gold";
import { createTerrainRegistry } from "../mods/world/shared/terrain";
import { createWorldService } from "../mods/world/server";

type TestCase = { name: string; fn: () => void | Promise<void> };

const tests: TestCase[] = [];

function test(name: string, fn: () => void | Promise<void>) {
  tests.push({ name, fn });
}

function createKernelWithMineHandler() {
  const kernel = new Kernel();
  kernel.register("Mine", (cmd: Command): Event[] => [
    { type: "Mined", v: 1, payload: { player: cmd.payload.player, ore: cmd.payload.ore } }
  ]);
  return kernel;
}

test("dispatch returns handler output", () => {
  const kernel = createKernelWithMineHandler();
  const events = kernel.dispatch({ type: "Mine", payload: { player: "Dia", ore: "gold" } });

  assert.equal(events.length, 1);
  assert.deepEqual(events[0], { type: "Mined", v: 1, payload: { player: "Dia", ore: "gold" } });
});

test("dispatch records events in world log", () => {
  const kernel = createKernelWithMineHandler();
  kernel.dispatch({ type: "Mine", payload: { player: "Dia", ore: "silver" } });
  kernel.dispatch({ type: "Mine", payload: { player: "Dia", ore: "iron" } });

  const log = kernel.getLog();
  assert.equal(log.length, 2);
  assert.deepEqual(log[0], { type: "Mined", v: 1, payload: { player: "Dia", ore: "silver" } });
  assert.deepEqual(log[1], { type: "Mined", v: 1, payload: { player: "Dia", ore: "iron" } });
});

test("dispatching unregistered command yields empty events", () => {
  const kernel = new Kernel();
  const events = kernel.dispatch({ type: "Unknown", payload: { player: "Dia" } });

  assert.deepEqual(events, []);
  assert.deepEqual(kernel.getLog(), []);
});

test("register overwrites prior handler for same command", () => {
  const kernel = new Kernel();
  kernel.register("Mine", () => [{ type: "Legacy", v: 1, payload: {} }]);
  kernel.register("Mine", () => [{ type: "Replacement", v: 2, payload: {} }]);

  const events = kernel.dispatch({ type: "Mine", payload: {} });
  assert.deepEqual(events, [{ type: "Replacement", v: 2, payload: {} }]);
  assert.deepEqual(kernel.getLog(), [{ type: "Replacement", v: 2, payload: {} }]);
});

test("world module uses terrain registry and plan to generate grid", () => {
  const kernel = new Kernel();
  const terrainRegistry = createTerrainRegistry();
  registerBaseTerrain(terrainRegistry);

  const worldService = createWorldService({
    terrainRegistry,
    planProvider: () => createDefaultWorldPlan(terrainRegistry)
  });

  worldService.registerKernel(kernel);

  const events = kernel.dispatch({ type: "GenerateWorld", payload: {} });
  assert.equal(events.length, 1);

  const world = events[0];
  assert.equal(world.type, "WorldGenerated");
  assert.equal(world.v, 1);
  assert.equal(world.payload.width, 10);
  assert.equal(world.payload.height, 10);
  assert.equal(world.payload.cells.length, 10);

  const paletteIds = world.payload.palette.map((entry: unknown) => (entry as { id: string }).id);
  [GRASS_TERRAIN_ID, DIRT_TERRAIN_ID, STONE_TERRAIN_ID, GOLD_TERRAIN_ID].forEach((id) => {
    assert.ok(
      paletteIds.includes(id),
      `expected palette to contain terrain '${id}' but only had ${paletteIds.join(", ")}`
    );
  });

  world.payload.cells.forEach((row: unknown, y: number) => {
    assert.ok(Array.isArray(row));
    assert.equal((row as unknown[]).length, 10);
    (row as unknown[]).forEach((terrainId: unknown, x: number) => {
      assert.equal(typeof terrainId, "string");

      if (y === 0) {
        assert.equal(terrainId, GRASS_TERRAIN_ID);
      } else if (y <= 2) {
        assert.equal(terrainId, DIRT_TERRAIN_ID);
      } else {
        if (
          (x === Math.floor(10 * 0.3) && y === Math.floor(10 * 0.6)) ||
          (x === Math.floor(10 * 0.5) && y === Math.floor(10 * 0.7)) ||
          (x === Math.floor(10 * 0.7) && y === Math.floor(10 * 0.8))
        ) {
          assert.equal(terrainId, GOLD_TERRAIN_ID);
        } else {
          assert.equal(terrainId, STONE_TERRAIN_ID);
        }
      }
    });
  });
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
