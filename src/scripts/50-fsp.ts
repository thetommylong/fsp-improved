// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 thetommylong

import { mount } from "svelte";
import { isTokenExpired, getTokenPayload } from "../api";
import { site } from "../site";
import Fsp from "../ui/Fsp.svelte";
import fspCss from "../ui/fsp/fsp.css?inline";

const TOKEN_POLL_MS = 250;
const TOKEN_WAIT_MS = 60_000;

function waitForValidToken(): Promise<string | null> {
  return new Promise((resolve) => {
    const startedAt = Date.now();

    const timer = setInterval(() => {
      const payload = getTokenPayload();
      if (payload && !isTokenExpired(payload)) {
        clearInterval(timer);
        resolve(payload.userId as string);
        return;
      }
      if (Date.now() - startedAt > TOKEN_WAIT_MS) {
        clearInterval(timer);
        resolve(null);
      }
    }, TOKEN_POLL_MS);
  });
}

export default function () {
  if (site !== "fsp") return;

  void waitForValidToken().then((userId) => {
    if (!userId) return;
    boot(userId);
  });
}

function boot(userId: string) {
  const start = () => {
    const host = document.createElement("div");
    host.id = "fsp-qol-root";

    document.body.replaceChildren(host);

    window.stop();

    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = fspCss;
    shadow.append(style);

    mount(Fsp, { target: shadow, props: { userId } });

    void Promise.allSettled([
      document.fonts.load('400 16px "Open Sans"'),
      document.fonts.load('600 16px "Open Sans"'),
      document.fonts.load('400 16px "Inter"'),
      document.fonts.load('600 16px "Inter"'),
    ]);
  };

  if (document.body) {
    start();
  } else {
    document.addEventListener("DOMContentLoaded", start);
  }
}
