import { mount } from "svelte";
import App from "../ui/App.svelte";

import { site } from "src/site";

function mountUI() {
  switch (site) {
    case "edunext":
      mount(App, {
        target: (() => {
          const el = document.createElement("div");
          document.body.append(el);
          return el;
        })(),
      });
      break;
    case "fsp":
    case "unknown":
  }
}

export default function () {
  if (document.body) {
    mountUI();
  } else {
    document.addEventListener("DOMContentLoaded", mountUI);
  }
}
