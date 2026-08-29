// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 thetommylong

import { FspLiveAdapter } from "./fsp-live";
import { MockAdapter } from "./mock";
import { site } from "../site";
import type { PortalAdapter } from "../sdk/adapter";

const ADAPTER_KEY = "portal:adapter";

function resolveAdapter(): PortalAdapter {
  const param = new URLSearchParams(window.location.search).get("adapter");
  if (param === "live") return new FspLiveAdapter();
  if (param === "mock") return new MockAdapter();

  const stored: string = GM_getValue(ADAPTER_KEY, "");
  if (stored === "live") return new FspLiveAdapter();
  if (stored === "mock") return new MockAdapter();

  return site === "fsp" ? new FspLiveAdapter() : new MockAdapter();
}

export function isMockForced(): boolean {
  return (
    new URLSearchParams(window.location.search).get("adapter") === "mock" ||
    GM_getValue<string>(ADAPTER_KEY, "") === "mock"
  );
}

class AdapterRuntime {
  adapter = $state<PortalAdapter>(resolveAdapter());

  setActive(name: "live" | "mock"): void {
    GM_setValue(ADAPTER_KEY, name);
    this.adapter = name === "live" ? new FspLiveAdapter() : new MockAdapter();
  }
}

export const runtime = new AdapterRuntime();
