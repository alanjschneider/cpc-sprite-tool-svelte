<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import copyIcon from "../icons/copy.svg";
  import IconButton from "./IconButton.svelte";
  import Button from "./Button.svelte";
  import CopyIcon from "./icons/CopyIcon.svelte";

  export let value: string;
  const dispatch = createEventDispatcher();

  function handleClick() {
    dispatch("copy", value);
  }
</script>

<div id="container">
  <textarea cols="32" rows="16" readonly>{value}</textarea>
  <div id="overlay">
    <Button on:click={handleClick}><CopyIcon slot="icon" /></Button>
    <!-- <IconButton icon={copyIcon} on:click={handleClick} /> -->
  </div>
</div>

<style>
  @font-face {
    font-family: "amstrad";
    src: url(./cpc464.ttf) format("truetype");
    font-weight: normal;
    font-style: normal;
  }

  #container {
    position: relative;
  }

  #overlay {
    position: absolute;
    right: 5px;
    top: 5px;
  }

  textarea {
    cursor: default;
    background-color: #000080;
    color: #ff0;
    resize: none;
    font-size: 20px;
    font-family: "amstrad";
    border: none;
    padding: 16px;
  }

  textarea:active {
    outline: none;
  }
</style>
