<script lang="ts">
  import COLORS from "constants/colors";
  import { bindKey } from "services/keyboard";
  import { type Color } from "constants/colors";

  export let color: Color = COLORS.BLUE;
  let selected = 0; // BLUE

  $: color = getColorByValue(selected);

  // Color selection shortcuts
  bindKey("1", () => {
    selected = 0;
    color = COLORS.BLUE;
  });

  bindKey("2", () => {
    selected = 1;
    color = COLORS.YELLOW;
  });

  bindKey("3", () => {
    selected = 2;
    color = COLORS.CYAN;
  });

  bindKey("4", () => {
    selected = 3;
    color = COLORS.RED;
  });

  function getColorByValue(number: number) {
    return [COLORS.BLUE, COLORS.YELLOW, COLORS.CYAN, COLORS.RED][number];
  }

  // El problema del click en movimiento es porque se dispara el evento cuando ocurre un mouseup
  // Ademas en Firefox se comporta de manera distinta que en Chrome.
</script>

<div>
  <label for="blueradio" id="blue" class:selected={selected === 0} />
  <input
    id="blueradio"
    type="radio"
    name="selectedValue"
    bind:group={selected}
    value={0}
  />
  <label for="yellowradio" id="yellow" class:selected={selected === 1} />
  <input
    id="yellowradio"
    type="radio"
    name="selectedValue"
    bind:group={selected}
    value={1}
  />
  <label for="cyanradio" id="cyan" class:selected={selected === 2} />
  <input
    id="cyanradio"
    type="radio"
    name="selectedValue"
    bind:group={selected}
    value={2}
  />
  <label for="redradio" id="red" class:selected={selected === 3} />
  <input
    id="redradio"
    type="radio"
    name="selectedValue"
    bind:group={selected}
    value={3}
  />
</div>

<style>
  div {
    width: 100%;
    margin: 0;
    padding: 0;
    display: flex;
    list-style: none;
    justify-items: space-between;
  }

  input[type="radio"] {
    display: none;
  }

  .selected {
    border: 2px solid #fff;
  }

  #blue {
    width: 100px;
    height: 100px;
    background-color: #000080;
  }

  #yellow {
    width: 100px;
    height: 100px;
    background-color: #ff0;
  }

  #cyan {
    width: 100px;
    height: 100px;
    background-color: #0ff;
  }

  #red {
    width: 100px;
    height: 100px;
    background-color: #f00;
  }
</style>
