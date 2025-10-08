import { Kernel } from "./engine/kernel";
import { CommandTypes, EventTypes } from "./engine/shared/contracts";
import { createDefaultWorldPlan } from "./engine/world/plan/defaultPlan";
import { initGold, extendGold } from "./mods/gold/server";
import { registerBaseTerrain } from "./mods/terrain";
import { createTerrainRegistry } from "./mods/world/shared/terrain";
import { createWorldService } from "./mods/world/server";

const kernel = new Kernel();
initGold(kernel);
extendGold(kernel);

const terrainRegistry = createTerrainRegistry();
registerBaseTerrain(terrainRegistry);

const worldService = createWorldService({
  terrainRegistry,
  planProvider: () => createDefaultWorldPlan(terrainRegistry)
});

worldService.registerRuntime(kernel);

// Try dispatching
kernel.dispatch({ type: "SmeltGold", payload: { player: "Ashok" } });
kernel.dispatch({ type: CommandTypes.GenerateWorld, payload: {} });

const worldEvents = kernel
  .getLog()
  .filter((event) => event.type === EventTypes.BlockSet)
  .slice(0, 5) // sample for brevity
  .map((event) => event.payload);

console.log("Sample block events:", worldEvents);
