import assert from "node:assert/strict";
import { Kernel, Command, Event } from "../engine/kernel";
import { initWorld } from "../mods/world/server";

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

test("world mod generates an empty 10x10 grid", () => {
  const kernel = new Kernel();
  initWorld(kernel);

  const events = kernel.dispatch({ type: "GenerateWorld", payload: {} });
  assert.equal(events.length, 1);

  const world = events[0];
  assert.equal(world.type, "WorldGenerated");
  assert.equal(world.v, 1);
  assert.equal(world.payload.width, 10);
  assert.equal(world.payload.height, 10);
  assert.equal(world.payload.cells.length, 10);
  world.payload.cells.forEach((row: unknown) => {
    assert.ok(Array.isArray(row));
    assert.equal((row as unknown[]).length, 10);
    (row as unknown[]).forEach((cell: unknown) => {
      assert.deepEqual(cell, { terrain: "Empty" });
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
