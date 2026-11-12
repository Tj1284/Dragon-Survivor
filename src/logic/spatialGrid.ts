/** Uniform grid for radius queries. Buckets are reused across clear() to avoid garbage. */
export class SpatialGrid {
  private readonly cells = new Map<number, number[]>();
  private readonly used: number[][] = [];
  private readonly xs = new Map<number, number>();
  private readonly ys = new Map<number, number>();

  constructor(private readonly cellSize: number) {}

  private key(cx: number, cy: number): number {
    return (cx * 73856093) ^ (cy * 19349663);
  }

  clear(): void {
    for (const bucket of this.used) bucket.length = 0;
    this.used.length = 0;
    this.xs.clear();
    this.ys.clear();
  }

  insert(id: number, x: number, y: number): void {
    const k = this.key(Math.floor(x / this.cellSize), Math.floor(y / this.cellSize));
    let bucket = this.cells.get(k);
    if (!bucket) { bucket = []; this.cells.set(k, bucket); }
    if (bucket.length === 0) this.used.push(bucket);
    bucket.push(id);
    this.xs.set(id, x);
    this.ys.set(id, y);
  }

  queryRadius(x: number, y: number, r: number, out: number[]): number[] {
    out.length = 0;
    const r2 = r * r;
    const minX = Math.floor((x - r) / this.cellSize), maxX = Math.floor((x + r) / this.cellSize);
    const minY = Math.floor((y - r) / this.cellSize), maxY = Math.floor((y + r) / this.cellSize);
    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const bucket = this.cells.get(this.key(cx, cy));
        if (!bucket) continue;
        for (const id of bucket) {
          const dx = this.xs.get(id)! - x, dy = this.ys.get(id)! - y;
          if (dx * dx + dy * dy <= r2 && !out.includes(id)) out.push(id);
        }
      }
    }
    return out;
  }
}
