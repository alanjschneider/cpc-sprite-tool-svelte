export default function Pixel(x, y, size, color, padding = 0) {
  this.x = x;
  this.y = y;
  this.size = size;
  this.color = color;
  this.padding = padding;
}

Pixel.prototype.render = function (ctx) {
  ctx.fillStyle = this.color.code;
  const x = this.x + this.padding;
  const y = this.y + this.padding;
  const size = this.size - this.padding * 2;
  ctx.fillRect(x, y, size, size);
};

Pixel.prototype.intersectsWithPoint = function (point) {
  if (point.x > this.x + this.size || point.x < this.x) return false;
  if (point.y > this.y + this.size || point.y < this.y) return false;
  return true;
};
