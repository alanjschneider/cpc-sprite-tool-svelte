import { type Point } from "services/mouse";
import { type Color } from "constants/colors";

export default class Pixel {
  public x: number;
  public y: number;
  private size: number;
  private color: Color;
  private padding: number;

  constructor(
    x: number,
    y: number,
    size: number,
    color: Color,
    padding: number = 0
  ) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color;
    this.padding = padding;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = this.color.code;
    const x = this.x + this.padding;
    const y = this.y + this.padding;
    const size = this.size - this.padding * 2;
    ctx.fillRect(x, y, size, size);
  }

  intersectsWithPoint(point: Point): boolean {
    if (point.x > this.x + this.size || point.x < this.x) return false;
    if (point.y > this.y + this.size || point.y < this.y) return false;
    return true;
  }

  getColor(): Color {
    return this.color;
  }

  setColor(color: Color): void {
    this.color = color;
  }
}
