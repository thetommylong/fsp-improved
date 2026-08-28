<script lang="ts">
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 thetommylong

  import type { ConfirmRequest } from "../../sdk";

  let { request }: { request: ConfirmRequest } = $props();

  function approve() {
    request.resolve(true);
  }

  function reject() {
    request.resolve(false);
  }
</script>

<div class="confirm-card" role="alert">
  <div class="confirm-header">
    <span class="material-symbols-rounded" aria-hidden="true">warning</span>
    <span>Confirm Action</span>
  </div>
  <p class="confirm-desc">{request.description}</p>
  <div class="confirm-args">
    {#each Object.entries(request.args) as [key, value]}
      <div class="arg-row">
        <span class="arg-key">{key}:</span>
        <span class="arg-val">{typeof value === "string" ? value : JSON.stringify(value)}</span>
      </div>
    {/each}
  </div>
  <div class="confirm-actions">
    <button class="btn-approve" onclick={approve}>Approve</button>
    <button class="btn-reject" onclick={reject}>Reject</button>
  </div>
</div>
