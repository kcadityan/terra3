import { Kernel } from "./engine/kernel";
import { initGold, extendGold } from "./mods/gold/server";
import { initWorld } from "./mods/world/server";

const kernel = new Kernel();
initGold(kernel);
extendGold(kernel);
initWorld(kernel);

// Try dispatching
kernel.dispatch({ type: "MineGold", payload: { player: "Ashok" } });
kernel.dispatch({ type: "SmeltGold", payload: { player: "Ashok" } });
kernel.dispatch({ type: "GenerateWorld", payload: {} });

console.log("WorldLog:", kernel.getLog());
