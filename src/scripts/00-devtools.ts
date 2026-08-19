declare const unsafeWindow: Window;

export default function () {
  if (unsafeWindow.__devtoolsPatchActive) return;
  unsafeWindow.__devtoolsPatchActive = true;

  const pw = unsafeWindow as unknown as Record<
    string,
    (...args: unknown[]) => unknown
  >;

  const _si = pw.setInterval as typeof setInterval;

  const noop = function () {};

  pw.setInterval = function (_fn: unknown, delay?: number) {
    return _si.call(unsafeWindow, noop, delay ?? 0);
  } as unknown as typeof setInterval;

  pw.close = noop;

  try {
    const lp = Object.getPrototypeOf(unsafeWindow.location);
    const ld = Object.getOwnPropertyDescriptor(lp, "href");
    if (ld && ld.set) {
      const hs = ld.set;
      Object.defineProperty(unsafeWindow.location, "href", {
        set(u: string) {
          if (/disable-devtool/i.test(u)) return;
          hs.call(unsafeWindow.location, u);
        },
        get() {
          return ld.get ? ld.get.call(unsafeWindow.location) : "";
        },
        configurable: true,
      });
    }
  } catch {
    // noop
  }

  try {
    const pageHistory = unsafeWindow.history;
    const _pushState = pageHistory.pushState.bind(pageHistory);
    pageHistory.pushState = function (
      state: unknown,
      title: string,
      url?: string | URL | null,
    ) {
      if (url && /disable-devtool/i.test(String(url))) return;
      return _pushState(state, title, url);
    };
    const _replaceState = pageHistory.replaceState.bind(pageHistory);
    pageHistory.replaceState = function (
      state: unknown,
      title: string,
      url?: string | URL | null,
    ) {
      if (url && /disable-devtool/i.test(String(url))) return;
      return _replaceState(state, title, url);
    };
  } catch {
    // noop
  }

  try {
    const _assign = unsafeWindow.location.assign.bind(unsafeWindow.location);
    Object.defineProperty(unsafeWindow.location, "assign", {
      value(url: string) {
        if (/disable-devtool/i.test(url)) return;
        return _assign(url);
      },
    });
  } catch {
    // noop
  }

  try {
    const ed = Object.getOwnPropertyDescriptor(Element.prototype, "innerHTML");
    if (ed && ed.set) {
      const es = ed.set;
      Object.defineProperty(Element.prototype, "innerHTML", {
        set(h: string) {
          if (/disable-devtool/i.test(h)) return;
          es.call(this, h);
        },
        get() {
          return ed.get ? ed.get.call(this) : "";
        },
        configurable: true,
      });
    }
  } catch {
    // noop
  }

  unsafeWindow.document.addEventListener(
    "keydown",
    function (e) {
      if (
        e.key === "F12" ||
        (e.ctrlKey &&
          e.shiftKey &&
          ["I", "J", "C", "i", "j", "c"].includes(e.key)) ||
        (e.ctrlKey && e.key === "U")
      ) {
        e.stopPropagation();
      }
    },
    true,
  );

  unsafeWindow.document.addEventListener(
    "contextmenu",
    function (e) {
      e.stopPropagation();
    },
    true,
  );
}
