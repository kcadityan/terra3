import { Kernel, Command, Event } from "./kernel";

export function initGold(kernel: Kernel) {
  kernel.register("MineGold", (cmd: Command): Event[] => [
    { type: "GoldMined", v: 1, payload: { player: cmd.payload.player, grams: 1 } }
  ]);
}

export function extendGold(kernel: Kernel) {
  kernel.register("SmeltGold", (cmd: Command): Event[] => [
    { type: "GoldSmelted", v: 1, payload: { player: cmd.payload.player, bars: 1 } }
  ]);
}
