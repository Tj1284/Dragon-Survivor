export class Pool<T> {
  private readonly free: T[] = [];
  private active = 0;
  private created = 0;

  constructor(private readonly create: () => T, private readonly reset: (item: T) => void) {}

  acquire(): T {
    this.active++;
    const item = this.free.pop();
    if (item !== undefined) return item;
    this.created++;
    return this.create();
  }

  release(item: T): void {
    this.reset(item);
    this.active--;
    this.free.push(item);
  }

  get activeCount(): number { return this.active; }
  /** Total objects ever created; should stop growing once the pool is warm. */
  get createdCount(): number { return this.created; }
}
