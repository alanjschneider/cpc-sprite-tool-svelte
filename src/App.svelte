<script lang="ts">
  import { type Color } from "constants/colors";
  import Output from "./components/Output.svelte";
  import Canvas from "./components/Canvas.svelte";
  import Palette from "./components/Palette.svelte";
  import Button from "./components/Button.svelte";
  import Select from "./components/Select.svelte";

  let canvas = null;
  let value = "";
  let actualColor: Color;

  const options = [
    { value: 0, text: "4x4" },
    { value: 1, text: "8x8", selected: true },
    { value: 2, text: "16x16" },
  ];

  let size = options[1].value;

  function generateCode(): void {
    if (canvas === null) return;
    value = canvas.getAssemblySprite();
  }

  function clearSprite(): void {
    if (canvas === null) return;
    canvas.clearCanvas();
  }

  function copyCode(event: CustomEvent): void {
    navigator.clipboard.writeText(event.detail);
  }
</script>

<div id="main">
  <div id="left">
    <Select bind:value={size} {options} label="Sprite size" />
    <Canvas bind:this={canvas} bind:size {actualColor} />
  </div>
  <div id="right">
    <Palette bind:color={actualColor} />
    <Button on:click={clearSprite}>Clear sprite</Button>
    <Button on:click={generateCode}>Generate code</Button>
    <Output {value} on:copy={copyCode} />
  </div>
</div>

<style>
  #main {
    display: flex;
    justify-content: space-around;
  }

  #right {
    display: flex;
    flex-direction: column;
    justify-content: space-around;
  }
</style>
