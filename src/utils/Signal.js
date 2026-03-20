/**
 * Lightweight observable Signal.
 *
 * - Holds a value and notifies subscribed observers when the value changes.
 * - Notifications are batched and delivered on a microtask (queueMicrotask).
 *
 * @template T
 */
export default class Signal {
  static #queue = new Set();
  static #scheduled = false;
  #observers = new Set();
  #currentValue;

  /**
   * Create a Signal.
   * @param {T | (() => T)} value Initial value or thunk that returns the initial value.
   */
  constructor(value) {
    this.#currentValue = typeof value === "function" ? value() : value;
  }

  /**
   * Update the signal's value.
   * @param {T} newVal
   */
  set value(newVal) {
    if (this.#currentValue === newVal) return;
    this.#currentValue = newVal;

    Signal.#queue.add(this);
    if (!Signal.#scheduled) {
      Signal.#scheduled = true;
      queueMicrotask(() => {
        this.#flushQueue();
      });
    }
  }

  /**
   * Get the current value.
   * @returns {T}
   */
  get value() {
    return this.#currentValue;
  }

  /**
   * Subscribe to value updates.
   * @param {(value: T) => void} callback
   * @returns {() => void} Unsubscribe function.
   */
  bind(callback) {
    if (!this.#observers.has(callback)) {
      this.#observers.add(callback);
      callback(this.value);
      return () => {
        this.#observers.delete(callback);
      };
    }
    return () => {};
  }

  /**
   * Create a derived signal computed from this signal.
   * @template U
   * @param {(v: T) => U} computed Mapping function.
   * @returns {Signal<U>}  <-- Fixed: Using Class name 'Signal' instead of SignalInstance
   */
  derived(computed) {
    const derivedSignal = new Signal(computed(this.value));
    this.bind((v) => {
      derivedSignal.value = computed(v);
    });
    return derivedSignal;
  }

  /**
   * Create a computed signal from multiple dependencies.
   * @template R
   * @param {(...args: any[]) => R} fn
   * @param {Array<Signal<any>>} dependencies
   * @returns {Signal<R>}
   */
  static computed(fn, dependencies) {
    const getDepValues = () => dependencies.map((dep) => dep.value);
    const out = new Signal(fn(...getDepValues()));
    dependencies.forEach((dep) => {
      dep.bind(() => {
        out.value = fn(...getDepValues());
      });
    });
    return out;
  }

  /** @private */
  #notify() {
    if (!this.#observers.size) return;
    this.#observers.forEach((callback) => callback(this.value));
  }

  /** @private */
  #flushQueue() {
    for (const sig of Signal.#queue) {
      sig.#notify();
    }
    Signal.#queue.clear();
    Signal.#scheduled = false;
  }
}
