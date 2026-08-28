<script lang="ts">
  // SPDX-License-Identifier: AGPL-3.0-only
  // Copyright (C) 2026 thetommylong

  import type { AgentEvent } from "../../sdk";
  import { marked } from "marked";
  import DOMPurify from "dompurify";

  let { event }: { event: AgentEvent } = $props();

  const expandedState = new WeakMap<AgentEvent, boolean>();

  function isExpanded(event: AgentEvent): boolean {
    return expandedState.get(event) ?? false;
  }

  function toggleExpanded(event: AgentEvent): void {
    expandedState.set(event, !(expandedState.get(event) ?? false));
  }

  function handleKeydown(event: AgentEvent, e: KeyboardEvent): void {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleExpanded(event);
    }
  }

  function getSanitizedHTML(content: string): string {
    const html = marked.parse(content) as string;
    return DOMPurify.sanitize(html);
  }
</script>

{#if event.type === "message"}
  {#if event.role === "user"}
    <div class="msg user">
      <div class="bubble">{@html getSanitizedHTML(event.content ?? "")}</div>
    </div>
  {:else if event.role === "assistant"}
    <div class="msg assistant">
      <div class="bubble">{@html getSanitizedHTML(event.content ?? "")}</div>
    </div>
  {/if}
{:else if event.type === "tool_call"}
  <div class="msg system">
    <div
      class="bubble tool-call"
      role="button"
      tabindex="0"
      onclick={() => toggleExpanded(event)}
      onkeydown={(e) => handleKeydown(event, e)}
    >
      <span class="material-symbols-rounded" aria-hidden="true">build</span>
      <span class="tc-name">{event.toolName}</span>
      {#if event.toolArgs}
        {#if isExpanded(event)}
          <span class="tc-args">{JSON.stringify(event.toolArgs)}</span>
        {:else}
          <span class="tc-args">{JSON.stringify(event.toolArgs).slice(0, 80)}{event.toolArgs && JSON.stringify(event.toolArgs).length > 80 ? "..." : ""}</span>
        {/if}
      {/if}
    </div>
  </div>
{:else if event.type === "tool_result"}
  <div class="msg system">
    <div
      class="bubble tool-result"
      class:error={event.error}
      role="button"
      tabindex="0"
      onclick={() => toggleExpanded(event)}
      onkeydown={(e) => handleKeydown(event, e)}
    >
      <span class="material-symbols-rounded" aria-hidden="true">
        {event.error ? "error" : "check_circle"}
      </span>
      <span class="tr-text">
        {#if isExpanded(event)}
          {event.content ?? ""}
        {:else}
          {(event.content ?? "").slice(0, 200)}{(event.content ?? "").length > 200 ? "..." : ""}
        {/if}
      </span>
    </div>
  </div>
{:else if event.type === "error"}
  <div class="msg system">
    <div class="bubble error-msg">{event.content}</div>
  </div>
{/if}
