export type { Command, Event, EventMeta, CommandMeta, KernelRuntime, EventDraft } from "./types";

import type {
  Command,
  CommandHandler,
  Event,
  EventDraft,
  EventListener,
  EventMeta,
  KernelRuntime
} from "./types";

class EventLog {
  private readonly events: Event[] = [];

  append(events: Event[]): void {
    this.events.push(...events);
  }

  all(): Event[] {
    return [...this.events];
  }
}

type ListenerMap = Map<string, Set<EventListener>>;

function normaliseListeners(map: ListenerMap, eventType: string): Set<EventListener> {
  if (!map.has(eventType)) {
    map.set(eventType, new Set<EventListener>());
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return map.get(eventType)!;
}

export class Kernel implements KernelRuntime {
  private readonly log = new EventLog();
  private readonly handlers = new Map<string, CommandHandler>();
  private readonly listeners: ListenerMap = new Map();
  private readonly wildcardListeners = new Set<EventListener>();
  private readonly aggregateSequences = new Map<string, number>();

  register(type: string, handler: CommandHandler): void {
    this.handlers.set(type, handler);
  }

  dispatch(command: Command): Event[] {
    const handler = this.handlers.get(command.type);
    if (!handler) {
      return [];
    }

    let drafts: EventDraft[];
    try {
      drafts = handler(command);
    } catch (error) {
      // handler failure is isolated; no events emitted
      return [];
    }

    const events = drafts.map((draft) => this.finaliseEvent(command, draft));
    this.log.append(events);
    this.publish(events);
    return events;
  }

  subscribe(eventType: string | "*", listener: EventListener): () => void {
    if (eventType === "*") {
      this.wildcardListeners.add(listener);
      return () => this.wildcardListeners.delete(listener);
    }

    const listeners = normaliseListeners(this.listeners, eventType);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  getLog(): Event[] {
    return this.log.all();
  }

  private publish(events: Event[]): void {
    events.forEach((event) => {
      const listeners = this.listeners.get(event.type);
      listeners?.forEach((listener) => listener(event));
      this.wildcardListeners.forEach((listener) => listener(event));
    });
  }

  private finaliseEvent(command: Command, draft: EventDraft): Event {
    const aggId = draft.meta?.aggId ?? command.meta?.aggId ?? draft.type;
    const seq = this.nextSequence(aggId);
    const ts = draft.meta?.ts ?? Date.now();
    const cause = {
      commandType: command.type,
      commandMeta: command.meta
    };

    const meta: EventMeta = {
      aggId,
      seq,
      ts,
      cause
    };

    return {
      type: draft.type,
      payload: draft.payload,
      meta
    };
  }

  private nextSequence(aggId: string): number {
    const current = this.aggregateSequences.get(aggId) ?? 0;
    const next = current + 1;
    this.aggregateSequences.set(aggId, next);
    return next;
  }
}
