export type GazePoint = { x: number; y: number };

/** Exponential moving average — lower alpha = smoother, slower response. */
export class GazeFilter {
  private x: number | null = null;
  private y: number | null = null;

  constructor(private readonly alpha = 0.1) {}

  filter(point: GazePoint): GazePoint {
    if (this.x === null || this.y === null) {
      this.x = point.x;
      this.y = point.y;
      return { x: this.x, y: this.y };
    }

    this.x += this.alpha * (point.x - this.x);
    this.y += this.alpha * (point.y - this.y);
    return { x: this.x, y: this.y };
  }

  /** Current smoothed position without ingesting a new sample. */
  peek(): GazePoint | null {
    if (this.x === null || this.y === null) return null;
    return { x: this.x, y: this.y };
  }

  reset() {
    this.x = null;
    this.y = null;
  }
}
