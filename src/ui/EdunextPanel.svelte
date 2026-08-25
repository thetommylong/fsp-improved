<script lang="ts">
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 thetommylong

  import { getSecret, setSecret } from "../secrets";
  import { runAutopilot } from "../scripts/50-edunext";
  import { createLogger } from "../log";
  import { applyTheme, theme } from "../theme.svelte";

  const log = createLogger("EdunextPanel");

  $effect(() => {
    void theme.flavor;
    void theme.accent;
    applyTheme();
  });

  let visible = $state(true);
  let apiKey = $state(getSecret("gemini_api_key") ?? "");
  let running = $state(false);
  let statusMessage = $state("");

  let dragging = $state(false);
  let dragOffsetX = $state(0);
  let dragOffsetY = $state(0);
  let dragStartX = 0;
  let dragStartY = 0;
  let initialOffsetX = 0;
  let initialOffsetY = 0;

  $effect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        visible = !visible;
      }
    }
    document.addEventListener("keydown", onKeydown);
    return () => document.removeEventListener("keydown", onKeydown);
  });

  function saveKey() {
    if (apiKey.trim()) {
      setSecret("gemini_api_key", apiKey.trim());
      statusMessage = "API key saved.";
      log.log(statusMessage);
    }
  }

  async function start() {
    if (running) return;
    running = true;
    statusMessage = "Autopilot running...";
    try {
      await runAutopilot();
      statusMessage = "Autopilot completed.";
    } catch (err) {
      statusMessage = "Autopilot error.";
      log.error(statusMessage, err);
    } finally {
      running = false;
    }
  }

  function startDrag(e: PointerEvent) {
    if (e.button !== 0) return;
    dragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    initialOffsetX = dragOffsetX;
    initialOffsetY = dragOffsetY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onDrag(e: PointerEvent) {
    if (!dragging) return;
    dragOffsetX = initialOffsetX + (e.clientX - dragStartX);
    dragOffsetY = initialOffsetY + (e.clientY - dragStartY);
  }

  function stopDrag() {
    dragging = false;
  }
</script>

<div
  class="panel"
  class:hidden={!visible}
  role="dialog"
  aria-label="Edunext Autopilot"
  aria-hidden={!visible}
  tabindex={visible ? 0 : -1}
  style="transform: translate({dragOffsetX}px, {dragOffsetY}px)"
>
  <div
    class="header"
    class:dragging
    role="group"
    aria-label="Drag to move panel"
    onpointerdown={startDrag}
    onpointermove={onDrag}
    onpointerup={stopDrag}
  >
    <span class="title">Edunext Autopilot</span>
  </div>

  <div class="body">
    <label for="apiKey">Gemini API Key</label>
    <div class="row">
      <input
        id="apiKey"
        type="password"
        placeholder="AIza..."
        bind:value={apiKey}
      />
      <button onclick={saveKey}>Save</button>
    </div>

    <button class="start" disabled={running || !apiKey} onclick={start}>
      {running ? "Running..." : "Start Autopilot"}
    </button>

    <p class="hint" id="hint">
      Press <kbd>Ctrl+Shift+F</kbd> to toggle
    </p>

    <footer class="about">
      <span class="about-name">fsp-quality-of-life</span>
      <span class="about-detail">
        v{__BUILD__.version} · {__BUILD__.commit}
      </span>
      <a
        class="about-link"
        href="https://github.com/thetommylong/fsp-improved/blob/main/LICENSE"
        target="_blank"
        rel="noreferrer"
      >
        AGPL-3.0-only
      </a>
    </footer>

    <div class="sr-only" aria-live="assertive" aria-atomic="true">
      {statusMessage}
    </div>
  </div>
</div>

<style>
  .panel {
    position: fixed;
    bottom: 16px;
    right: 16px;
    width: 300px;
    background: var(--panel-bg);
    color: var(--panel-text);
    border: 1px solid var(--panel-border);
    border-radius: 12px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    z-index: 2147483;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.25);
    transition: opacity 0.2s ease, transform 0.2s ease;
    will-change: transform;
  }

  .panel.hidden {
    opacity: 0;
    pointer-events: none;
    visibility: hidden;
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--panel-border);
    cursor: grab;
    user-select: none;
  }

  .header.dragging {
    cursor: grabbing;
  }

  .title {
    font-size: 14px;
    font-weight: 600;
    color: var(--panel-text);
  }

  .body {
    padding: 12px 16px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  label {
    display: block;
    font-size: 12px;
    font-weight: 500;
    color: var(--panel-subtext);
    margin-bottom: 4px;
  }

  .row {
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    width: 100%;
  }

  input {
    flex: 1;
    padding: 6px 10px;
    border: 1px solid var(--panel-border);
    border-radius: 6px;
    background: var(--panel-input-bg);
    color: var(--panel-text);
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s ease;
  }

  input:focus-visible {
    border-color: var(--panel-accent);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--panel-accent) 30%, transparent);
  }

  button {
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    background: var(--panel-surface);
    color: var(--panel-text);
    cursor: pointer;
    font-size: 13px;
    transition: background 0.15s ease;
  }

  button:hover {
    background: var(--panel-border);
  }

  button:focus-visible {
    outline: 2px solid var(--panel-accent);
    outline-offset: 2px;
  }

  .start {
    width: 100%;
    padding: 8px 12px;
    background: var(--panel-accent);
    color: var(--panel-bg);
    font-weight: 600;
    border-radius: 6px;
  }

  .start:hover:not(:disabled) {
    background: var(--panel-accent-hover);
  }

  .start:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .hint {
    margin: 12px 0 0;
    font-size: 11px;
    color: var(--panel-overlay);
    text-align: center;
  }

  kbd {
    padding: 1px 5px;
    border: 1px solid var(--panel-kbd-border);
    border-radius: 3px;
    background: var(--panel-kbd-bg);
    font-size: 11px;
    font-family: inherit;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .about {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 10px;
  }

  .about-name {
    font-size: 12px;
    font-weight: 600;
    color: var(--panel-text);
  }

  .about-detail {
    font-size: 11px;
    color: var(--panel-subtext);
  }

  .about-link {
    font-size: 11px;
    color: var(--panel-accent);
    text-decoration: none;
  }

  .about-link:hover {
    text-decoration: underline;
  }
</style>
