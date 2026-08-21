import { mount } from "svelte";
import { isTokenExpired, getTokenPayload } from "../api";
import { site } from "../site";
import Fsp from "../ui/Fsp.svelte";
import fspCss from "../ui/fsp/fsp.css?inline";

export default function () {
  if (site !== "fsp") return;

  const payload = getTokenPayload();
  if (!payload || isTokenExpired(payload)) return;

  const userId = payload.userId;
  if (typeof userId !== "string") return;

  const boot = () => {
    const host = document.createElement("div");
    host.id = "fsp-qol-root";

    document.body.replaceChildren(host);

    const shadow = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = fspCss;
    shadow.append(style);

    mount(Fsp, { target: shadow, props: { userId } });
  };

  if (document.body) {
    boot();
  } else {
    document.addEventListener("DOMContentLoaded", boot);
  }
}
