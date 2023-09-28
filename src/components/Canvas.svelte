<script lang="ts">
  import { onMount } from "svelte";
  import { FORMAT_8X8, FORMAT_4X4, FORMAT_16X16 } from "constants/ouputFormats";
  import { bindClick, MOUSE_BUTTONS, type Point } from "services/mouse";
  import { toHex } from "services/utils";
  import COLORS from "constants/colors";
  import Pixel from "models/Pixel.js";

  const CANVAS_SIZE = 600;
  const PIXEL_GAP = 1;

  const sizes = [
    { spriteSize: 4, pixelSize: CANVAS_SIZE / 4, format: FORMAT_4X4 },
    { spriteSize: 8, pixelSize: CANVAS_SIZE / 8, format: FORMAT_8X8 },
    { spriteSize: 16, pixelSize: CANVAS_SIZE / 16, format: FORMAT_16X16 },
  ];

  export let size = 1;
  export let actualColor = COLORS.BLUE;

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let sprite: Pixel[];

  onMount(main);

  // Using (size !== undefined) only to simulate a $derived
  $: ctx && size !== undefined && clearCanvas();

  function main() {
    bindClick(MOUSE_BUTTONS.LEFT, (point: Point, target: HTMLElement) => {
      if (target !== canvas) return;

      const pixel = getPixelByPoint(point, sprite);

      if (pixel === null) return;

      pixel.setColor(actualColor);

      clearContext(ctx);
      renderSprite(ctx, sprite);
    });

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    ctx = canvas.getContext("2d");
    clearCanvas();
  }

  export function clearCanvas() {
    sprite = createEmptySprite();
    clearContext(ctx);
    renderSprite(ctx, sprite);
  }

  export function getAssemblySprite() {
    const colorCodes = getColorCodes(sprite);
    return colorCodesToAssembly(colorCodes, "sprite", sizes[size].format);
  }

  function clearContext(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function renderSprite(ctx: CanvasRenderingContext2D, sprite: Pixel[]) {
    for (let i = 0; i < sprite.length; i++) {
      const pixel = sprite[i];
      pixel.render(ctx);
    }
  }

  function createEmptySprite() {
    const sprite = [];
    const PIXEL_COUNT = sizes[size].spriteSize * sizes[size].spriteSize;

    for (let i = 0; i < PIXEL_COUNT; i++) {
      let x = (i % sizes[size].spriteSize) * sizes[size].pixelSize;
      let y = ~~(i / sizes[size].spriteSize) * sizes[size].pixelSize;
      const pixel = new Pixel(
        x,
        y,
        sizes[size].pixelSize,
        COLORS.BLUE,
        PIXEL_GAP
      );
      sprite.push(pixel);
    }

    return sprite;
  }

  function getPixelByPoint(point: Point, sprite: Pixel[]) {
    for (let i = 0; i < sprite.length; i++) {
      const pixel = sprite[i];
      if (pixel.intersectsWithPoint(point)) return pixel;
    }

    return null;
  }

  function getColorCodes(sprite: Pixel[]): string[] {
    const colorCodes = [];

    for (let i = 0; i < sprite.length; i += 4) {
      let colorCode = 0;

      colorCode += sprite[i].getColor().bitmask << 3;
      colorCode += sprite[i + 1].getColor().bitmask << 2;
      colorCode += sprite[i + 2].getColor().bitmask << 1;
      colorCode += sprite[i + 3].getColor().bitmask;

      colorCodes.push(toHex(colorCode));
    }

    return colorCodes;
  }

  function colorCodesToAssembly(
    colorCodes: string[],
    spriteName: string,
    format: string
  ) {
    let assembly = format.replace("name", spriteName);

    for (let i = 0; i < colorCodes.length; i++) {
      assembly = assembly.replace("n", colorCodes[i]);
    }

    return assembly;
  }
</script>

<canvas bind:this={canvas} />
