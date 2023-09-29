<button on:click>
  <span>
    <slot name="icon" />
  </span>
  {#if $$slots.icon && $$slots.default}
    <div id="spacer" />
  {/if}
  <span>
    <slot />
  </span>
</button>

<style>
  button {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    border: 1px solid #ff0;
    background-color: #000080;
    padding: 7px;
    font-size: 20px;
    color: #ff0;
    border-radius: 6px;
  }

  button:active {
    transform: scale(0.98);
  }

  #spacer {
    padding-left: 4px;
  }
</style>
