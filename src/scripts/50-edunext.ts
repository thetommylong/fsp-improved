import { createLogger } from "../log";
import { getSecret } from "../secrets";

export const site = "edunext";

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
    const observer = new MutationObserver(() => {
      if (
        !document.querySelector(".streaming-indicator") &&
        !document.querySelector(".chat-pending-placeholder")
      ) {
        observer.disconnect();
        resolve();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
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
  )!.set!;

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
    .querySelectorAll("style, script, .chat-pending-placeholder")
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
              "You are a precise math assistant for high school students. Rules: 1. Output ONLY the exact required answer format requested by the prompt (e.g., 'Trả lời: [answer]'). 2. NEVER include chatty thoughts, conversational filler, explanations, or self-commentary.",
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
    log.warn(
      "No Gemini API key found! Set it via: GM_setValue('fsp:gemini_api_key', 'your-key')",
    );
    return;
  }

  log.log("Full Auto-Pilot Loop Activated!");

  const startBtn = document.querySelector(
    ".start-learning-prompt__button",
  ) as HTMLElement | null;
  if (startBtn) {
    log.log("Clicking 'Bắt đầu học'...");
    startBtn.click();
    await new Promise((r) => setTimeout(r, 2000));
  }

  await waitForAssistantResponse();
  let currentText = getLatestAssistantResponse();
  log.log("[Initial Scraped]:", currentText);

  if (
    currentText.toLowerCase().includes("sẵn sàng") ||
    currentText.includes("chào") ||
    currentText.length < 150
  ) {
    log.log("Responding with 'Sẵn sàng'...");
    await sendMessage("Sẵn sàng");
    await new Promise((r) => setTimeout(r, 2000));
  }

  const maxSteps = 30;
  for (let step = 0; step < maxSteps; step++) {
    await waitForAssistantResponse();
    currentText = getLatestAssistantResponse();
    log.log(`--- [Step ${step + 1}] ---`);
    log.log("Scraped:", currentText);

    if (
      /\d+\/\d+/.test(currentText) ||
      currentText.includes("Hoàn thành") ||
      currentText.includes("Kết quả")
    ) {
      log.log("Assignment finished/Rating detected! Stopping loop.");
      break;
    }

    if (
      currentText.includes("chuyển sang phần tiếp theo") ||
      currentText.includes("sẵn sàng chưa")
    ) {
      log.log("Detected transition prompt. Answering 'Sẵn sàng'...");
      await sendMessage("Sẵn sàng");
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }

    log.log("Asking Gemini for the math answer...");
    const answer = await askGemini(currentText);
    log.log("Gemini Answer:", answer);

    if (!answer) {
      log.warn("Got empty answer, retrying...");
      await new Promise((r) => setTimeout(r, 2000));
      continue;
    }

    await new Promise((r) => setTimeout(r, 1500));
    await sendMessage(answer);
    await new Promise((r) => setTimeout(r, 2000));
  }

  log.log("Auto-pilot loop completed!");
}
