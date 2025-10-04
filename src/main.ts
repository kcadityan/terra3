import { Kernel } from "./kernel";
import { initGold, extendGold } from "./gold";

const kernel = new Kernel();
initGold(kernel);
extendGold(kernel);

// Try dispatching
kernel.dispatch({ type: "MineGold", payload: { player: "Ashok" } });
kernel.dispatch({ type: "SmeltGold", payload: { player: "Ashok" } });

console.log("WorldLog:", kernel.getLog());
