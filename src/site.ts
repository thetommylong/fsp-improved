// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 thetommylong

export type SiteType = "edunext" | "fsp" | "unknown";

const HOST = window.location.hostname;

export const site: SiteType = (() => {
  if (HOST.includes("edunext")) return "edunext";
  if (HOST.includes("fsp")) return "fsp";
  return "unknown";
})();
