export default class BudgetQueue {
  #tasks = [];
  #isProcessing = false;

  add(task) {
    this.#tasks.push(task);
    if (!this.#isProcessing) {
      this.#isProcessing = true;
      // Start immediately in the current execution loop to prevent initial flicker
      this.#process();
    }
  }

  #process() {
    // 1. Calculate dynamic batch size.
    // We want to process at least 20% of the remaining tasks,
    // but no less than 40 and no more than 200 at once.
    const totalPending = this.#tasks.length;
    const dynamicBatch = Math.min(
      Math.max(Math.ceil(totalPending * 0.2), 40),
      200,
    );

    const currentBatch = this.#tasks.splice(0, dynamicBatch);

    for (const task of currentBatch) {
      try {
        task();
      } catch (e) {
        console.error("@shadow-realm: Init error", e);
      }
    }

    if (this.#tasks.length > 0) {
      // Use MessageChannel for a high-priority macrotask yield
      const { port1, port2 } = new MessageChannel();
      port1.onmessage = () => this.#process();
      port2.postMessage(null);
    } else {
      this.#isProcessing = false;
    }
  }
}
