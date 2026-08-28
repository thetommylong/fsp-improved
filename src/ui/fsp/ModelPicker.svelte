<script lang="ts">
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 thetommylong

  import { fetchModels, getModel, setModel } from "../../sdk/openai";
  import type { ModelInfo } from "../../sdk/types";

  let {
    open = false,
    onclose,
  }: { open?: boolean; onclose: () => void } = $props();

  let models = $state<ModelInfo[]>([]);
  let loading = $state(false);
  let error = $state("");
  let currentModel = $state(getModel());

  $effect(() => {
    if (open && models.length === 0) {
      loadModels();
    }
  });

  async function loadModels() {
    loading = true;
    error = "";
    try {
      models = await fetchModels();
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      loading = false;
    }
  }

  function select(modelId: string) {
    setModel(modelId);
    currentModel = modelId;
    onclose();
  }
</script>

{#if open}
  <div class="picker-overlay" role="dialog" aria-label="Select model">
    <div class="picker">
      <div class="picker-header">
        <span class="picker-title">Select Model</span>
        <button class="picker-close" aria-label="Close" onclick={onclose}>
          <span class="material-symbols-rounded" aria-hidden="true">close</span>
        </button>
      </div>

      <div class="picker-body">
        {#if loading}
          <div class="picker-status">Loading models...</div>
        {:else if error}
          <div class="picker-status error">{error}</div>
          <button class="picker-retry" onclick={loadModels}>Retry</button>
        {:else if models.length === 0}
          <div class="picker-status">No models found</div>
        {:else}
          <div class="model-list">
            {#each models as model (model.id)}
              <button
                class="model-item"
                class:selected={model.id === currentModel}
                onclick={() => select(model.id)}
              >
                <span class="model-id">{model.id}</span>
                {#if model.owned_by}
                  <span class="model-owner">{model.owned_by}</span>
                {/if}
                {#if model.id === currentModel}
                  <span class="material-symbols-rounded model-check" aria-hidden="true"
                    >check</span
                  >
                {/if}
              </button>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}
