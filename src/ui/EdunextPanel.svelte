<script lang="ts">
  import { getSecret, setSecret } from "../secrets";
  import { runAutopilot } from "../scripts/50-edunext";
  import { createLogger } from "../log";

  const log = createLogger("EdunextPanel");

  let apiKey = $state(getSecret("gemini_api_key") ?? "");
  let running = $state(false);

  function saveKey() {
    if (apiKey.trim()) {
      setSecret("gemini_api_key", apiKey.trim());
      log.log("API key saved.");
    }
  }

  async function start() {
    if (running) return;
    running = true;
    try {
      await runAutopilot();
    } catch (err) {
      log.error("Autopilot error:", err);
    } finally {
      running = false;
    }
  }
</script>

<div class="panel">
  <h2>Edunext Autopilot</h2>

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

  <p class="hint">You can also press <kbd>F2</kbd> to start.</p>
</div>

<style>
  .panel {
    position: fixed;
    bottom: 16px;
    right: 16px;
    width: 300px;
    background: #1a1a2e;
    color: #e0e0e0;
    border: 1px solid #333;
    border-radius: 12px;
    padding: 16px;
    font-family: system-ui, sans-serif;
    font-size: 14px;
    z-index: 99999;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4);
  }

  h2 {
    margin: 0 0 12px;
    font-size: 16px;
    color: #fff;
  }

  label {
    font-size: 12px;
    color: #aaa;
  }

  .row {
    display: flex;
    gap: 6px;
    margin-bottom: 12px;
  }

  input {
    flex: 1;
    padding: 6px 8px;
    border: 1px solid #444;
    border-radius: 6px;
    background: #0f0f23;
    color: #e0e0e0;
    font-size: 13px;
    outline: none;
  }

  input:focus {
    border-color: #6c63ff;
  }

  button {
    padding: 6px 12px;
    border: none;
    border-radius: 6px;
    background: #333;
    color: #e0e0e0;
    cursor: pointer;
    font-size: 13px;
  }

  button:hover {
    background: #444;
  }

  .start {
    width: 100%;
    padding: 8px;
    background: #6c63ff;
    color: #fff;
    font-weight: 600;
    margin-top: 4px;
  }

  .start:hover:not(:disabled) {
    background: #5a52d5;
  }

  .start:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .hint {
    margin: 8px 0 0;
    font-size: 11px;
    color: #777;
    text-align: center;
  }

  kbd {
    padding: 1px 5px;
    border: 1px solid #555;
    border-radius: 3px;
    background: #222;
    font-size: 11px;
  }
</style>
