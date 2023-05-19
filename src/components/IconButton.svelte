<script>
  import { createEventDispatcher } from "svelte";

  export let icon;
  const dispatch = createEventDispatcher();

  function handleClick() {
    dispatch("click");
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<img
  on:click={handleClick}
  width="16"
  height="16"
  src={icon}
  alt="An icon representing the copy to clipboard action"
/>

<style>
  img {
    padding: 5px;
    border-radius: 5px;
    background-color: #000;
    opacity: 0.6;
    border: 1px solid #222;
  }

  img:hover {
    border: 1px solid #444;
    opacity: 0.9;
  }

  img:active {
    transform: scale(0.9);
  }
</style>
