import { EventEmitter } from 'events';

type EventHandler<TPayload> = (payload: TPayload) => void;

class EventBus {
  private readonly emitter = new EventEmitter();

  publish<TPayload>(eventName: string, payload: TPayload): void {
    this.emitter.emit(eventName, payload);
  }

  subscribe<TPayload>(eventName: string, handler: EventHandler<TPayload>): void {
    this.emitter.on(eventName, handler as EventHandler<unknown>);
  }

  unsubscribe<TPayload>(eventName: string, handler: EventHandler<TPayload>): void {
    this.emitter.off(eventName, handler as EventHandler<unknown>);
  }
}

export default new EventBus();
