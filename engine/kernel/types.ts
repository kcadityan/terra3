export interface CommandMeta {
  readonly issuedAt?: number;
  readonly correlationId?: string;
  readonly actorId?: string;
  readonly controllerId?: string;
  readonly aggId?: string;
}

export interface Command<TPayload = unknown> {
  readonly type: string;
  readonly payload: TPayload;
  readonly meta?: CommandMeta;
}

export interface EventCause {
  readonly commandType: string;
  readonly commandMeta?: CommandMeta;
}

export interface EventMeta {
  readonly aggId: string;
  readonly seq: number;
  readonly ts: number;
  readonly cause?: EventCause;
}

export interface Event<TPayload = unknown> {
  readonly type: string;
  readonly payload: TPayload;
  readonly meta: EventMeta;
}

export interface EventDraft<TPayload = unknown> {
  readonly type: string;
  readonly payload: TPayload;
  readonly meta?: Partial<EventMeta>;
}

export type CommandHandler = (command: Command) => EventDraft[];

export type EventListener = (event: Event) => void;

export interface KernelRuntime {
  register(type: string, handler: CommandHandler): void;
  dispatch(command: Command): Event[];
  subscribe(eventType: string | "*", listener: EventListener): () => void;
  getLog(): Event[];
}
