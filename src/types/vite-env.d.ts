// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 thetommylong

/// <reference types="svelte" />
/// <reference types="vite/client" />
/// <reference types="vite-plugin-monkey/client" />
/// <reference types="vite-plugin-monkey/global" />
/// <reference types="vite-plugin-monkey/style" />

export {};

declare global {
  const __BUILD__: { commit: string; version: string };
  interface Window {
    __devtoolsPatchActive?: boolean;
    notify?: (message: string, type?: "info" | "success" | "error") => void;
  }
}
