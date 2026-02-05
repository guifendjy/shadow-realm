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

  constructor(root = document.body) {
    if (!root)
      throw new Error(
        "@shadow-realm can only be used in a browser environment",
      );
    this.root = root;
    this.initialize = this.initialize.bind(this);
  }

  initialize() {
    // 1.
    getReactives(this.root, this.#reactives);
    // 2.
    getEffects(this.#reactives, this.#effects);
    // 3.
    getBindings(this.#reactives, this.#bindings);
    // 4.
    initializeBindings(this.#bindings, Realm);
    // 5.
    getEventListenerFromAttribute(this.#reactives);
    // 6.
    triggerEffects(this.#effects);
  }
}
