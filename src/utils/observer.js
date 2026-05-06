// @ts-ignore
/**@internal */
let LIFE_CYCLE_REGISTRY = {
  registry: new Map(),

  register(o = { element, onMount }) {
    const { element, onMount } = o;
    if (this.registry.has(element)) return;

    this.initializeObservers();

    const record = {
      element,
      onMount,
      onUnmount: null,
      state: "IDLE", // MOUNTED | MOUNTING | UNMOUNTED | UNMOUNTING
      debounceTimer: null,
    };

    this.registry.set(element, record);
    this.intersectionObserver.observe(element);
  },

  handleIntersection(entries) {
    entries.forEach((entry) => {
      const record = this.registry.get(entry.target);
      if (!record) return;

      // Use isIntersecting for stability, or a lower threshold for "unmounting"
      const isVisible = entry.isIntersecting && entry.intersectionRatio > 0.8;

      if (isVisible && record.state !== "MOUNTED") {
        this.executeMount(record);
      } else if (!isVisible && record.state === "MOUNTED") {
        // Add a micro-delay to ensure it's not a flicker from an animation frame
        clearTimeout(record.debounceTimer);

        record.debounceTimer = setTimeout(() => {
          if (!entry.isIntersecting) this.executeUnmount(record);
        }, 100);
      }
    });
  },

  executeMount(record) {
    record.state = "MOUNTING";
    const cleanup = record.onMount(record.element);
    if (typeof cleanup === "function") record.onUnmount = cleanup;
    record.state = "MOUNTED";
  },

  executeUnmount(record) {
    if (record.onUnmount) {
      record.state = "UNMOUNTING";
      record.onUnmount();
      record.onUnmount = null;
    }
    record.state = "IDLE";
  },

  initializeObservers() {
    if (this.intersectionObserver) return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      { threshold: [0, 0.95] }, // Track both "gone" and "fully there"
    );

    // this removes it entirely
    this.mutationObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.removedNodes) {
          if (this.registry.has(node)) {
            const record = this.registry.get(node);
            this.executeUnmount(record);
            this.intersectionObserver.unobserve(node);
            this.registry.delete(node);
          }
        }
      }
    });

    this.mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });
  },
};

export default LIFE_CYCLE_REGISTRY;
