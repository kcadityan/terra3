import { Kernel } from "./engine/kernel";
import { initGold, extendGold } from "./mods/gold/server";

const kernel = new Kernel();
initGold(kernel);
extendGold(kernel);

// Try dispatching
kernel.dispatch({ type: "MineGold", payload: { player: "Ashok" } });
kernel.dispatch({ type: "SmeltGold", payload: { player: "Ashok" } });

console.log("WorldLog:", kernel.getLog());
