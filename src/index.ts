// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 thetommylong

import { createLogger } from "./log";
import { site } from "./site";

const log = createLogger("index");

if (site === "unknown") {
  log.log("no supported portal here — staying idle");
} else {
  console.log(
    `%c fsp-quality-of-life v${__BUILD__.version} (${__BUILD__.commit}) — AGPL-3.0-only`,
    "color:#cba6f7;font-weight:bold",
  );
  console.log("https://github.com/thetommylong/fsp-improved");

  const modules = import.meta.glob("./scripts/*.ts", { eager: true });

  async function initAll() {
    const tasks = Object.entries(modules).map(async ([path, mod]) => {
      const m = mod as Record<string, unknown>;

      const scriptSite = m.site as string | undefined;
      if (scriptSite && scriptSite !== site) return;

      if (typeof m.default === "function") {
        try {
          await (m.default as () => Promise<void>)();
          log.log(`loaded ${path}!`);
        } catch (err) {
          log.error(`failed to initialize ${path}:`, err);
        }
      }
    });

    await Promise.all(tasks);
    log.log("all modules initialized.");
  }

  void initAll();
}
