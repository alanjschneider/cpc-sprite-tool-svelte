<script lang="ts">
  import Output from "./components/Output.svelte";
  import Canvas from "./components/Canvas.svelte";
  import Palette from "./components/Palette.svelte";

  let canvas = null;
  let value = "";
  let actualColor;

  function handleColorChange(event: CustomEvent) {
    actualColor = event.detail.color;
  }

  function generateCode(): void {
    if (canvas === null) return;
    value = canvas.getAssemblySprite();
  }

  function clearSprite(): void {
    if (canvas === null) return;
    canvas.clearCanvas();
  }
</script>

<div id="main">
  <Canvas bind:this={canvas} {actualColor} />
  <div id="right">
    <Palette on:colorChange={handleColorChange} />
    <button on:click={clearSprite}>Clear sprite</button>
    <button on:click={generateCode}>Generate code</button>
    <Output {value} />
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
