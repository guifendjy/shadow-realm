import getReactives from "./getReactives.js";
import getEffects from "./getEffects.js";
import initializeBindings from "./attachBindings.js";
import triggerEffects from "./triggerEffects.js";
import getBindings from "./getBindings.js";
import getEventListeners from "./getEventListners.js";
import attachEventListeners from "./attachEventListeners.js";
import R from "../directives/index.js"; // registry deps

/**
 * Realm - A reactive state management system for DOM elements
 *
 * Manages reactivity, bindings, and effects for a Shadow Realm instance.
 * Automatically initializes reactive properties, effects, and event listeners
 * on a given DOM root element.
 *
 * @class Realm
 *
 * @property {HTMLElement} root - The root DOM element to initialize reactivity on
 * @property {object} context - A parent context that can be from another Realm instance to share data between realms
 * @property {boolean} ready - Flag indicating whether the Realm has been initialized
 *
 * @constructor
 * @param {HTMLElement} [root=document.body] - The root DOM element for the Realm. Defaults to document.body
 * @param {object} [context=null] - Optional parent context for sharing data between Realm instances
 *
 * @method initialize
 * @description Initializes the Realm by:
 *   1. Setting up initial bindings
 *   2. Attaching event listeners from DOM attributes
 *   3. Triggering initial effects
 *   Prevents multiple initializations with ready flag
 * @returns {Realm} Returns the Realm instance for method chaining
 *
 * @method destroy
 * @description Cleans up the Realm by:
 *   1. Removing all event listeners and executing cleanup functions
 *   2. Unbinding all directives and executing cleanup functions
 *   3. Clearing all effects and executing cleanup functions
 *   4. Clearing all reactive state
 *   5. Resetting the ready flag to false
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
    this.ready = false;

    // gather information about the reactive properties, effects, and bindings in the DOM
    getReactives(this.root, this.#reactives, this.context, R._stateResolver);
    this.#reactives = new Map(Array.from(this.#reactives).reverse());

    getEffects(this.#reactives, this.#effects);
    getBindings(this.#reactives, this.#bindings);
    getEventListeners(this.#reactives, this.#eventListenerRegistry);

    // Bind the initialize method to the instance to ensure correct 'this' context
    this.initialize = this.initialize.bind(this);
  }

  initialize() {
    if (this.ready) return;
    initializeBindings(this.#bindings, R);
    attachEventListeners(this.#eventListenerRegistry);
    triggerEffects(this.#effects, R);

    this.ready = true;
    return this;
  }
  destroy() {
    // 1. Remove Event Listeners (Disconnect 'nerves')
    if (this.#eventListenerRegistry.size > 0) {
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
      this.#bindings.forEach((binding) => {
        if (Array.isArray(binding.UNBIND)) {
          binding.UNBIND.forEach((cleanup) => {
            if (typeof cleanup === "function") cleanup();
          });
        }
      });
      this.#bindings.clear();
    }

    if (this.#effects.size > 0) {
      this.#effects.forEach((effect) => {
        if (Array.isArray(effect.EFFECT_CLEANUP)) {
          effect.EFFECT_CLEANUP.forEach((cleanup) => {
            if (typeof cleanup === "function") cleanup();
          });
        }
      });
      this.#effects.clear();
    }

    // 3. Wipe the State Maps
    this.#reactives.clear();
    this.ready = false;
  }
}
