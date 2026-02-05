import { BINDING_PREFIX } from "../globals.js";
import TextPlugin from "./plugins/s_text_plugin.js";
import ShowPlugin from "./plugins/s_show_plugin.js";
import EffectPlugin from "./plugins/s_effect_plugin.js";
import ValuePlugin from "./plugins/s_value_plugin.js";
import ClassPlgugin from "./plugins/s_class_plugin.js";
import StylePlugin from "./plugins/s_style_plugin.js";
import scrollTextPlugin from "./plugins/s_text_scroll_plugin.js";
import upperCaseEffectPlugin from "./plugins/s-effect-upper.js";
import makeReative from "../utils/makeStateReactive.js";
import createProxy from "../utils/createProxy.js";

// NOTE: these directives gets called everytime the state(any property used in or as a ternary expressi) the element depends on changes
/**
 * Registry class for managing global directives with plugin support.
 *
 * @class R
 * @example
 * R.directive('s-if', handler);
 * R.use(pluginFn);
 */

/**
 * Static storage for registered global directives.
 * @static
 * @type {Object}
 */

/**
 * Registers and executes a plugin function.
 * @static
 * @param {Function} pluginFn - Plugin function that receives the class
 * @returns {R} The class instance for method chaining
 */

/**
 * Registers a global directive with validation.
 * @static
 * @param {string} name - Directive name (must start with binding prefix)
 * @param {Function} handler - Directive handler function
 * @throws {Error} If directive name doesn't start with required prefix
 */
export default class R {
  // Static storage for global directives
  static _globalDirectives = {};
  static _stores = {}; //stores
  static _states = {}; // states

  static store(name, callback) {
    const store_schema = makeReative(callback()); // this is the signals
    store_schema._PROXY = createProxy(store_schema); // this is the proxy that will direct it where it need to get or set.
    this._stores[name] = store_schema;
  }

  static _storeResolver = new Proxy(this._stores, {
    get(target, key) {
      if (!(key in target)) return undefined;
      if (key in target) return target[key]._PROXY;
      console.warn(`Store "${key}" does not exist.`);
      return {};
    },
  });

  static state(name, callback) {
    this._states[name] = function (...args) {
      return callback(...args);
    };
  }

  static _stateResolver = new Proxy(this._states, {
    get(target, key) {
      if (!(key in target)) return undefined;
      if (key in target) return target[key];
      console.warn(`State "${key}" does not exist.`);
      return {};
    },
  });

  // The Plugin API
  static use(pluginFn) {
    // A plugin is just a function that receives the class
    pluginFn(this);
    return this; // Allow chaining
  }

  // Method to add directives globally
  static directive(name, handler) {
    if (!name.startsWith(BINDING_PREFIX)) {
      throw new Error(`Directive name must start with <'${BINDING_PREFIX}'>`);
    }
    this._globalDirectives[name] = handler;
  }
}

// apply plugins
R.use(TextPlugin)
  .use(ShowPlugin)
  .use(EffectPlugin)
  .use(ValuePlugin)
  .use(ClassPlgugin)
  .use(StylePlugin)
  .use(scrollTextPlugin)
  .use(upperCaseEffectPlugin);
