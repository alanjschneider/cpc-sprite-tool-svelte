<script>
  export let value;
</script>

<button on:click>
  {value}
</button>

<style>
  button {
    border: 1px solid #ff0;
    background-color: #000080;
    padding: 7px;
    font-size: 20px;
    color: #ff0;
    border-radius: 2px;
  }

  button:active {
    transform: scale(0.98);
  }
</style>
