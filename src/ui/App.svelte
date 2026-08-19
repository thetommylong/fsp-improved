<script lang="ts">
  import { site } from "../site";
  import EdunextPanel from "./EdunextPanel.svelte";
</script>

{#if site === "edunext"}
  <EdunextPanel />
{/if}
