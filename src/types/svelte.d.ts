// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 thetommylong

declare module "*.svelte" {
  import type { Component } from "svelte";
  const component: Component;
  export default component;
}
