import { Kernel } from "./engine/kernel";
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
kernel.dispatch({ type: "MineGold", payload: { player: "Ashok" } });
kernel.dispatch({ type: "SmeltGold", payload: { player: "Ashok" } });
kernel.dispatch({ type: "GenerateWorld", payload: {} });

console.log("WorldLog:", kernel.getLog());
