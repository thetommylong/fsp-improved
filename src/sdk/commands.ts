// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 thetommylong

import type { AgentEvent } from "./types";
import {
  getBaseUrl,
  setBaseUrl,
  getApiKey,
  setApiKey,
  getModel,
  setModel,
  fetchModels,
} from "./openai";

export interface CommandResult {
  handled: boolean;
  events: AgentEvent[];
  clearChat?: boolean;
}

const HELP_TEXT = `Available commands:
  /models  — List and select available models
  /key     — Set your API key
  /url     — Set the API base URL
  /model   — Show or set the current model
  /clear   — Clear chat history
  /help    — Show this help`;

export async function handleCommand(input: string): Promise<CommandResult> {
  const trimmed = input.trim();
  if (!trimmed.startsWith("/")) {
    return { handled: false, events: [] };
  }

  const [command, ...rest] = trimmed.split(/\s+/);
  const arg = rest.join(" ");
  const cmd = command.toLowerCase();

  switch (cmd) {
    case "/help": {
      return {
        handled: true,
        events: [{ type: "message", content: HELP_TEXT, role: "assistant" }],
      };
    }

    case "/key": {
      if (!arg) {
        const current = getApiKey();
        return {
          handled: true,
          events: [
            {
              type: "message",
              content: current
                ? `API key is set (${current.slice(0, 4)}...${current.slice(-4)})`
                : "No API key set. Usage: /key <your-api-key>",
              role: "assistant",
            },
          ],
        };
      }
      setApiKey(arg);
      return {
        handled: true,
        events: [
          { type: "message", content: "API key saved.", role: "assistant" },
        ],
      };
    }

    case "/url": {
      if (!arg) {
        return {
          handled: true,
          events: [
            {
              type: "message",
              content: `Current base URL: ${getBaseUrl()}\nUsage: /url <new-base-url>`,
              role: "assistant",
            },
          ],
        };
      }
      setBaseUrl(arg);
      return {
        handled: true,
        events: [
          {
            type: "message",
            content: `Base URL set to: ${arg}`,
            role: "assistant",
          },
        ],
      };
    }

    case "/model": {
      if (!arg) {
        return {
          handled: true,
          events: [
            {
              type: "message",
              content: `Current model: ${getModel()}\nUsage: /model <model-id>`,
              role: "assistant",
            },
          ],
        };
      }
      setModel(arg);
      return {
        handled: true,
        events: [
          {
            type: "message",
            content: `Model set to: ${arg}`,
            role: "assistant",
          },
        ],
      };
    }

    case "/models": {
      try {
        const models = await fetchModels();
        if (models.length === 0) {
          return {
            handled: true,
            events: [
              {
                type: "message",
                content: "No models returned from API.",
                role: "assistant",
              },
            ],
          };
        }
        const current = getModel();
        const list = models
          .map((m) => `${m.id === current ? "● " : "  "}${m.id}`)
          .join("\n");
        return {
          handled: true,
          events: [
            {
              type: "message",
              content: `Available models (● = current):\n${list}\n\nUse /model <id> to switch.`,
              role: "assistant",
            },
          ],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          handled: true,
          events: [
            {
              type: "error",
              content: `Failed to fetch models: ${message}`,
              role: "assistant",
            },
          ],
        };
      }
    }

    case "/clear": {
      return {
        handled: true,
        events: [
          { type: "message", content: "Chat cleared.", role: "assistant" },
        ],
        clearChat: true,
      };
    }

    default: {
      return {
        handled: true,
        events: [
          {
            type: "message",
            content: `Unknown command: ${cmd}\n\n${HELP_TEXT}`,
            role: "assistant",
          },
        ],
      };
    }
  }
}
