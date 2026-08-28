<script lang="ts">
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 thetommylong

  import { createAgent } from "../../sdk";
  import type { AgentEvent, AgentContext, ConfirmRequest } from "../../sdk/types";
  import { isConfigured } from "../../sdk/openai";
  import ChatMessage from "./ChatMessage.svelte";
  import ConfirmCard from "./ConfirmCard.svelte";
  import ModelPicker from "./ModelPicker.svelte";

  let { agentContext }: { agentContext: AgentContext } = $props();

  let agent = $state(createAgent(agentContext));
  let messages = $state<AgentEvent[]>([]);
  let input = $state("");
  let sending = $state(false);
  let modelPickerOpen = $state(false);
  let confirmRequest = $state<ConfirmRequest | null>(null);
  let scrollEl: HTMLDivElement | undefined = $state();

  $effect(() => {
    if (!isConfigured()) {
      messages = [
        {
          type: "message",
          content:
            "Welcome! Set your API key first:\n\n/key <your-api-key>\n\nThen optionally:\n/url <custom-base-url>\n/model <model-id>",
          role: "assistant",
        },
      ];
    }
  });

  $effect(() => {
    // Depend on messages length to scroll when new messages arrive
    messages.length;
    if (scrollEl) {
      scrollEl.scrollTop = scrollEl.scrollHeight;
    }
  });

  async function send() {
    const text = input.trim();
    if (!text || sending) return;

    if (confirmRequest) return;

    input = "";
    sending = true;
    messages = [...messages, { type: "message", content: text, role: "user" }];

    await agent.send(
      text,
      (event) => {
        if (event.type === "confirm" && event.confirmRequest) {
          confirmRequest = event.confirmRequest;
          return;
        }
        if (event.type === "done") {
          sending = false;
          return;
        }
        messages = [...messages, event];
      },
      (req) =>
        new Promise<boolean>((resolve) => {
          confirmRequest = { ...req, resolve };
        }),
      () => {
        // Streaming deltas are applied to the shared message event object via deep reactivity.
      },
    );

    sending = false;
    confirmRequest = null;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function approveConfirm() {
    if (confirmRequest) {
      confirmRequest.resolve(true);
      confirmRequest = null;
    }
  }

  function rejectConfirm() {
    if (confirmRequest) {
      confirmRequest.resolve(false);
      confirmRequest = null;
    }
  }
</script>

<div class="chat-sidebar">
  <div class="chat-header">
    <span class="chat-title">AI Assistant</span>
    <div class="chat-actions">
      <button
        class="chat-icon-btn"
        aria-label="Select model"
        onclick={() => (modelPickerOpen = true)}
      >
        <span class="material-symbols-rounded" aria-hidden="true">smart_toy</span>
      </button>
      <button
        class="chat-icon-btn"
        aria-label="Clear chat"
        onclick={() => {
          agent.clear();
          messages = [];
        }}
      >
        <span class="material-symbols-rounded" aria-hidden="true">delete_sweep</span>
      </button>
    </div>
  </div>

  <div class="chat-messages" bind:this={scrollEl}>
    {#each messages as event, i (i)}
      {#if event.type === "confirm" && event.confirmRequest}
        <ConfirmCard request={event.confirmRequest} />
      {:else}
        <ChatMessage {event} />
      {/if}
    {/each}

{#if confirmRequest}
      <div class="confirm-inline">
        <ConfirmCard request={confirmRequest} />
      </div>
    {/if}

   </div>

  <div class="chat-input">
    <textarea
      placeholder="Ask about your portal data..."
      bind:value={input}
      onkeydown={handleKeydown}
      rows={1}
      disabled={sending}
    ></textarea>
    <button
      class="send-btn"
      aria-label="Send"
      onclick={send}
      disabled={sending || !input.trim()}
    >
      <span class="material-symbols-rounded" aria-hidden="true">arrow_upward</span>
    </button>
  </div>
</div>

<ModelPicker open={modelPickerOpen} onclose={() => (modelPickerOpen = false)} />
