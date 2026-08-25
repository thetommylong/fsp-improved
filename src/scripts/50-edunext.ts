// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 thetommylong

import { mount } from "svelte";
import EdunextPanel from "../ui/EdunextPanel.svelte";
import "../styles/catppuccin.css";
import { notify } from "../notifications";
import { createLogger } from "../log";
import { getSecret } from "../secrets";
import { site } from "../site";

const log = createLogger("edunext");
const GEMINI_MODEL = "gemini-3.5-flash-lite";

function waitForAssistantResponse(): Promise<void> {
  return new Promise((resolve) => {
    if (
      !document.querySelector(".streaming-indicator") &&
      !document.querySelector(".chat-pending-placeholder")
    ) {
      return resolve();
    }

    let observer: MutationObserver | null = null;

    const cleanup = () => {
      observer?.disconnect();
      observer = null;
    };

    observer = new MutationObserver(() => {
      if (
        !document.querySelector(".streaming-indicator") &&
        !document.querySelector(".chat-pending-placeholder")
      ) {
        cleanup();
        resolve();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Safety timeout - disconnect after 60 seconds
    setTimeout(cleanup, 60000);
  });
}

function sendMessage(text: string): Promise<boolean> {
  const textarea = document.querySelector(
    "textarea.w-md-editor-text-input",
  ) as HTMLTextAreaElement | null;
  if (!textarea) return Promise.resolve(false);

  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    "value",
  )?.set;

  if (!nativeInputValueSetter) {
    log.error("Failed to get native input value setter");
    return Promise.resolve(false);
  }

  nativeInputValueSetter.call(textarea, text);
  textarea.selectionStart = textarea.selectionEnd = text.length;

  textarea.dispatchEvent(
    new InputEvent("input", {
      bubbles: true,
      cancelable: true,
      inputType: "insertText",
      data: text,
    }),
  );

  return new Promise((resolve) => {
    setTimeout(() => {
      const sendBtn = document.querySelector(
        ".w-send-btn",
      ) as HTMLElement | null;
      if (sendBtn) {
        sendBtn.click();
        resolve(true);
      } else {
        resolve(false);
      }
    }, 50);
  });
}

function getLatestAssistantResponse(): string {
  const assistantMessages = document.querySelectorAll(
    ".message-container.message-assistant",
  );
  if (assistantMessages.length === 0) return "";
  const latest = assistantMessages[assistantMessages.length - 1];
  const clone = latest.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll("style, script, .chat-pending-placeholder, .katex-mathml")
    .forEach((el) => el.remove());

  let text = clone.innerText;
  text = text.replace(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    "",
  );
  text = text.replace(/[0-9a-f]{24}/gi, "");
  return text.replace(/^[ \t]*[\r\n]/gm, "").trim();
}

function askGemini(promptText: string): Promise<string | null> {
  const apiKey = getSecret("gemini_api_key");
  if (!apiKey) return Promise.resolve(null);

  return new Promise((resolve) => {
    GM_xmlhttpRequest({
      method: "POST",
      url: `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      data: JSON.stringify({
        model: GEMINI_MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant for high school students. Rules: 1. Output ONLY the exact required answer format requested by the prompt (e.g., 'Trả lời: [answer]'). 2. NEVER include chatty thoughts, conversational filler, explanations, or self-commentary.",
          },
          { role: "user", content: promptText },
        ],
        temperature: 0.0,
      }),
      onload(response) {
        try {
          const data = JSON.parse(response.responseText) as {
            choices: { message: { content: string } }[];
          };
          resolve(data.choices[0].message.content.trim());
        } catch {
          resolve(null);
        }
      },
      onerror() {
        resolve(null);
      },
    });
  });
}

export async function runAutopilot(): Promise<void> {
  if (!getSecret("gemini_api_key")) {
    notify("No Gemini API key found", "error");
    log.warn("bro i have no key");
    return;
  }

  notify("Autopilot started", "info");
  log.log("ok running");

  const startBtn = document.querySelector(
    ".start-learning-prompt__button",
  ) as HTMLElement | null;
  if (startBtn) {
    notify("Clicked start button", "success");
    log.log("alr clicking the start btn");
    startBtn.click();
    await new Promise((r) => setTimeout(r, 2000));
  }

  await waitForAssistantResponse();
  let currentText = getLatestAssistantResponse();
  log.log(currentText);

  if (
    currentText.toLowerCase().includes("sẵn sàng") ||
    currentText.includes("chào") ||
    currentText.length < 150
  ) {
    log.log("yep got it ahh");
    await sendMessage("Sẵn sàng");
    await new Promise((r) => setTimeout(r, 2000));
  }

  const maxSteps = 30;
  for (let step = 0; step < maxSteps; step++) {
    await waitForAssistantResponse();
    currentText = getLatestAssistantResponse();
    log.log(`running turn ${step + 1}`);
    log.log(currentText);

    if (
      /\d+\/\d+/.test(currentText) ||
      currentText.includes("Hoàn thành") ||
      currentText.includes("Kết quả")
    ) {
      notify("Autopilot completed!", "success");
      log.log("done");
      break;
    }

    if (
      currentText.includes("chuyển sang phần tiếp theo") ||
      currentText.includes("sẵn sàng chưa")
    ) {
      log.log('"yep got it ahhh"');
      await sendMessage("Sẵn sàng");
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }

    log.log("asking our boy for the answer");
    const answer = await askGemini(currentText);
    log.log(answer);

    if (!answer) {
      notify("Got no answer, retrying...", "error");
      log.warn("got nothing, retrying...");
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }

    notify("Got answer", "success");
    await new Promise((r) => setTimeout(r, 1500));
    await sendMessage(answer);
    await new Promise((r) => setTimeout(r, 2000));
  }

  log.log("done!");
}

unsafeWindow.notify = notify;

function mountUI() {
  const target = document.createElement("div");
  document.body.append(target);

  mount(EdunextPanel, { target });
}

export default function () {
  if (site !== "edunext") return;

  const _addEventListener = EventTarget.prototype.addEventListener;

  window.addEventListener(
    "keydown",
    (event: KeyboardEvent) => {
      const isCmdOrCtrl = event.ctrlKey || event.metaKey;
      const key = event.key.toLowerCase();

      if (
        event.key === "F12" ||
        (isCmdOrCtrl && event.shiftKey && ["i", "j", "c"].includes(key)) ||
        (isCmdOrCtrl && key === "u") ||
        (isCmdOrCtrl && key === "v")
      ) {
        event.stopImmediatePropagation();
      }
    },
    true,
  );

  window.addEventListener(
    "paste",
    (event: ClipboardEvent) => {
      event.stopImmediatePropagation();
    },
    true,
  );
  EventTarget.prototype.addEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ) {
    if (type === "contextmenu" || type === "keydown") {
      const safeListener = function (this: EventTarget, event: Event) {
        if (event instanceof KeyboardEvent) {
          const isCmdOrCtrl = event.ctrlKey || event.metaKey;
          const key = event.key.toLowerCase();

          if (
            event.key === "F12" ||
            (isCmdOrCtrl &&
              event.shiftKey &&
              ["i", "j", "c"].includes(key.toLowerCase())) ||
            (isCmdOrCtrl && key.toLowerCase() === "u") ||
            (isCmdOrCtrl && key.toLowerCase() === "v")
          ) {
            return;
          }
        } else if (type === "contextmenu") {
          return;
        }

        if (typeof listener === "function") {
          return listener.call(this, event);
        } else if (listener && typeof listener.handleEvent === "function") {
          return listener.handleEvent.call(listener, event);
        }
      };

      return _addEventListener.call(
        this,
        type,
        safeListener as EventListener,
        options,
      );
    }

    return _addEventListener.call(this, type, listener, options);
  };

  if (document.body) {
    mountUI();
  } else {
    document.addEventListener("DOMContentLoaded", mountUI);
  }
}
