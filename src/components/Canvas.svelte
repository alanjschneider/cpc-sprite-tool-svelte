<script>
  import { onMount } from "svelte";
  import { FORMAT_8X8 } from "../constants/ouputFormats";
  import { bindClick, LEFT_CLICK } from "../services/mouse";
  import { toHex } from "../services/utils";
  import COLORS from "../constants/colors";
  import Pixel from "../models/Pixel.js";

  const CANVAS_SIZE = 600;
  const PIXEL_GAP = 1;
  const SPRITE_SIZE_PX = 8;
  const PIXEL_SIZE = CANVAS_SIZE / SPRITE_SIZE_PX;

  export let actualColor = COLORS.BLUE;

  let canvas;
  let ctx;
  let sprite;

  onMount(main);

  function main() {
    bindClick(LEFT_CLICK, (point, target) => {
      if (target !== canvas) return;

      const pixel = getPixelByPoint(point, sprite);

      if (pixel === null) return;

      pixel.color = actualColor;

      clearContext(ctx);
      renderSprite(ctx, sprite);
    });

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    ctx = canvas.getContext("2d");
    sprite = createEmptySprite();

    clearContext(ctx);
    renderSprite(ctx, sprite);
  }

  export function clearCanvas() {
    sprite = createEmptySprite();
    clearContext(ctx);
    renderSprite(ctx, sprite);
  }

  export function getAssemblySprite() {
    const colorCodes = getColorCodes(sprite);
    return colorCodesToAssembly(colorCodes, "sprite", FORMAT_8X8);
  }

  function clearContext(ctx) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function renderSprite(ctx, sprite) {
    for (let i = 0; i < sprite.length; i++) {
      const pixel = sprite[i];
      pixel.render(ctx);
    }
  }

  function createEmptySprite() {
    const sprite = [];
    const PIXEL_COUNT = SPRITE_SIZE_PX * SPRITE_SIZE_PX;

    for (let i = 0; i < PIXEL_COUNT; i++) {
      let x = (i % SPRITE_SIZE_PX) * PIXEL_SIZE;
      let y = ~~(i / SPRITE_SIZE_PX) * PIXEL_SIZE;
      const pixel = new Pixel(x, y, PIXEL_SIZE, COLORS.BLUE, PIXEL_GAP);
      sprite.push(pixel);
    }

    return sprite;
  }

  function getPixelByPoint(point, sprite) {
    for (let i = 0; i < sprite.length; i++) {
      const pixel = sprite[i];
      if (pixel.intersectsWithPoint(point)) return pixel;
    }

    return null;
  }

  function getColorCodes(sprite) {
    const colorCodes = [];

    for (let i = 0; i < sprite.length; i += 4) {
      let colorCode = 0;

      colorCode += sprite[i].color.bitmask << 3;
      colorCode += sprite[i + 1].color.bitmask << 2;
      colorCode += sprite[i + 2].color.bitmask << 1;
      colorCode += sprite[i + 3].color.bitmask;

      colorCodes.push(toHex(colorCode));
    }

    return colorCodes;
  }

  function colorCodesToAssembly(colorCodes, spriteName, format) {
    let assembly = format.replace("name", spriteName);

    for (let i = 0; i < colorCodes.length; i++) {
      assembly = assembly.replace("n", colorCodes[i]);
    }

    return assembly;
  }
</script>

<canvas bind:this={canvas} />
