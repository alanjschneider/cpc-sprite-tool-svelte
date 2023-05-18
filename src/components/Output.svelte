<script lang="ts">
  export let value: string;
</script>

<textarea cols="32" rows="16">{value}</textarea>

<style>
  @font-face {
    font-family: "amstrad";
    src: url(./cpc464.ttf) format("truetype");
    font-weight: normal;
    font-style: normal;
  }

  textarea {
    background-color: #000080;
    color: #ff0;
    resize: none;
    font-size: 20px;
    font-family: "amstrad";
    border: none;
    padding: 16px;
  }
</style>
