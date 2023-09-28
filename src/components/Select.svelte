<script>
  export let options = [];
  export let label = "";
  export let value;
</script>

<label for="select">{label}</label>
<select id="select" bind:value>
  {#each options as option}
    <option value={option.value}>{option.text}</option>
  {/each}
</select>

<style>
  label {
    color: #ff0;
    font-family: Verdana, Geneva, Tahoma, sans-serif;
  }
  select {
    border: 1px solid #ff0;
    background-color: #000080;
    color: #ff0;
    padding: 8px;
    font-size: 16px;
  }
</style>
