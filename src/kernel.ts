export type Command = { type: string; payload: any };
export type Event   = { type: string; v: number; payload: any };

export class WorldLog {
  private events: Event[] = [];
  append(evts: Event[]) { this.events.push(...evts); }
  getState() { return this.events; } // trivial replay
}

export class Kernel {
  private log = new WorldLog();
  private handlers: Record<string,(c:Command)=>Event[]> = {};

  register(type: string, h: (c:Command)=>Event[]) {
    this.handlers[type] = h;
  }

  dispatch(cmd: Command) {
    const evts = this.handlers[cmd.type]?.(cmd) ?? [];
    this.log.append(evts);
    return evts;
  }

  getLog() { return this.log.getState(); }
}
