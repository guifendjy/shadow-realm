import getReactives from "./getReactives.js";
import getEffects from "./getEffects.js";
import getEventListenerFromAttribute from "./getEventListners.js";
import initializeBindings from "./attachBindings.js";
import triggerEffects from "./triggerEffects.js";
import getBindings from "./getBindings.js";

/**
 * Realm - A reactive state management system for DOM elements
 *
 * Manages reactivity, bindings, and effects for a Shadow Realm instance.
 * Automatically initializes reactive properties, effects, and event listeners
 * on a given DOM root element.
 *
 * @class Realm
 *
 * @property {Map} #reactives - Internal map storing reactive properties and their values
 * @property {Set} #bindings - Internal set of data bindings between reactive properties and DOM elements
 * @property {Set} #effects - Internal set of side effects that trigger on reactive changes
 * @property {HTMLElement} root - The root DOM element to initialize reactivity on
 *
 * @constructor
 * @param {HTMLElement} [root=document.body] - The root DOM element for the Realm. Defaults to document.body
 * @throws {Error} Throws an error if no root element is provided (browser environment required)
 *
 * @method initialize
 * @description Initializes the Realm by:
 *   1. Scanning for reactive properties in the DOM
 *   2. Extracting effect declarations
 *   3. Collecting data bindings
 *   4. Setting up initial bindings
 *   5. Attaching event listeners from DOM attributes
 *   6. Triggering initial effects
 * @returns {void}
 */
export default class Realm {
  #reactives = new Map(); // $reactives
  #bindings = new Set();
  #effects = new Set();
  #eventListenerRegistry = new Set();

  constructor(root = document.body, context = null) {
    if (!root)
      throw new Error(
        "@shadow-realm can only be used in a browser environment",
      );
    this.root = root;
    this.context = context; // a parent context that can be from another Realm instance for example this way i can share data between the two.
    this.initialize = this.initialize.bind(this);
  }

  initialize() {
    // 1.
    getReactives(this.root, this.#reactives, this.context);
    // 1.1 - reverse reactives to help with scoping
    this.#reactives = new Map(Array.from(this.#reactives).reverse());

    // 2.
    getEffects(this.#reactives, this.#effects);
    // 3.
    getBindings(this.#reactives, this.#bindings);
    // 4.
    initializeBindings(this.#bindings);
    // 5.
    getEventListenerFromAttribute(this.#reactives, this.#eventListenerRegistry);
    // 6.
    triggerEffects(this.#effects);
    return this;
  }
  destroy() {
    console.group(`@shadow-realm: Destroying Realm at`, this.root);

    // 1. Remove Event Listeners (Disconnect 'nerves')
    if (this.#eventListenerRegistry.size > 0) {
      console.log(
        `Removing ${this.#eventListenerRegistry.size} event listeners...`,
      );
      this.#eventListenerRegistry.forEach((entry) => {
        if (Array.isArray(entry.REMOVE_LISTENER)) {
          entry.REMOVE_LISTENER.forEach((cleanup) => {
            if (typeof cleanup === "function") cleanup();
          });
        }
      });
      this.#eventListenerRegistry.clear();
    }

    // 2. Unbind Directives (Reset 'view')
    if (this.#bindings.size > 0) {
      console.log(`Unbinding ${this.#bindings.size} directives...`);
      this.#bindings.forEach((binding) => {
        if (Array.isArray(binding.UNBIND)) {
          binding.UNBIND.forEach((cleanup) => {
            if (typeof cleanup === "function") cleanup();
          });
        }
      });
      this.#bindings.clear();
    }

    // 3. Wipe the State Maps
    this.#reactives.clear();
    // 4.
    this.#effects.clear();

    // 5. Optional: Remove the root from DOM if it was a temporary fragment
    // this.root.remove();

    console.log("Realm destroyed successfully.");
    console.groupEnd();
  }
}
