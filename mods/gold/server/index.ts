import { Kernel, type Command, type EventDraft } from "@engine/kernel";
import { EventTypes } from "@engine/shared/contracts";

export function initGold(kernel: Kernel) {
  kernel.register("MineGold", (cmd: Command): EventDraft[] => [
    {
      type: EventTypes.ItemGranted,
      payload: {
        toEntityId: (cmd.payload as { player: string }).player,
        item: "gold",
        quantity: 1
      },
      meta: {
        aggId: `inventory:${(cmd.payload as { player: string }).player}`
      }
    }
  ]);
}

export function extendGold(kernel: Kernel) {
  kernel.register("SmeltGold", (cmd: Command): EventDraft[] => [
    {
      type: EventTypes.AbilityUsed,
      payload: {
        entityId: (cmd.payload as { player: string }).player,
        ability: "smelt-gold",
        args: { bars: 1 }
      },
      meta: {
        aggId: `entity:${(cmd.payload as { player: string }).player}`
      }
    }
  ]);
}
