export default function () {
  const _addEventListener = EventTarget.prototype.addEventListener;

  EventTarget.prototype.addEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ) {
    if (type === "contextmenu" || type === "keydown") {
      const safeListener = function (this: EventTarget, event: Event) {
        if (event instanceof KeyboardEvent) {
          const isCmdOrCtrl = event.ctrlKey || event.metaKey;
          const key = event.key.toLowerCase();

          if (
            event.key === "F12" ||
            (isCmdOrCtrl && event.shiftKey && ["i", "j", "c"].includes(key)) ||
            (isCmdOrCtrl && key === "u") ||
            (isCmdOrCtrl && key === "v")
          ) {
            return;
          }
        } else if (type === "contextmenu") {
          return;
        }

        if (typeof listener === "function") {
          return listener.call(this, event);
        } else if (listener && typeof listener.handleEvent === "function") {
          return listener.handleEvent.call(listener, event);
        }
      };

      return _addEventListener.call(
        this,
        type,
        safeListener as EventListener,
        options,
      );
    }

    return _addEventListener.call(this, type, listener, options);
  };
}
