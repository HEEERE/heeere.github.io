type Handler<T = unknown> = (payload: T) => void;

export class EventBus<Events extends object> {
  private readonly handlers = new Map<keyof Events, Set<Handler>>();

  public on<K extends keyof Events>(event: K, handler: Handler<Events[K]>): () => void {
    const group = this.handlers.get(event) ?? new Set<Handler>();
    group.add(handler as Handler);
    this.handlers.set(event, group);
    return () => group.delete(handler as Handler);
  }

  public emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    this.handlers.get(event)?.forEach((handler) => handler(payload));
  }

  public clear(): void {
    this.handlers.clear();
  }
}
