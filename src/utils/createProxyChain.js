import { helpers, STORE_MARKER, WHITELIST } from "../globals.js";
import R from "../directives/directiveRegitry.js";
import findStateOwner from "./findStateOwner.js";

// FIXME: this is populated during event firing.
// before calling and handler they are set to this event and nullified right after for any subsequent events,
// the issue might arise when there are rapid firing of events

const eventDetailsShorthands = {
  $event: null,
  $target: null,
};

/**
 * Creates a proxy that traverses the __PARENT_SCOPE tree.
 * @param {Object} startState - The raw EL_STATE -> { primitives, signals, __SCOPE, __PARENT_SCOPE }object (not the proxy).
 */

export default function createProxyChain(startState) {
  return new Proxy(Object.assign({}, startState), {
    get(_, prop) {
      if (typeof prop == "symbol") return;

      if (prop.startsWith(STORE_MARKER)) return R._storeResolver;
      if (prop in helpers) return helpers[prop];
      if (prop in eventDetailsShorthands) return eventDetailsShorthands[prop];

      let current = startState;
      while (current) {
        // 1. Check if the property exists in this layer's signals or functions
        if (current.signals && prop in current.signals) {
          return current.signals[prop].value;
        }
        if (current.functions && prop in current.functions) {
          return current.functions[prop];
        }

        // 2. Move up to the raw parent state
        current = current.__PARENT_SCOPE;
      }

      // 3. Fallback to global eventDetailsShorthands or window if not found in the tree
      return undefined;
    },

    set(_, prop, val) {
      if (typeof prop == "symbol") return;

      if (prop.startsWith(STORE_MARKER)) return R._storeResolver;
      if (prop in helpers) helpers[prop] = val;
      if (prop in eventDetailsShorthands) eventDetailsShorthands[prop] = val;

      let current = startState;
      while (current) {
        if (current.signals && prop in current.signals) {
          current.signals[prop].value = val;
          return true;
        }
        current = current.__PARENT_SCOPE;
      }
      return true;
    },

    has(_, prop) {
      if (typeof prop == "symbol") return;
      if (prop.startsWith(STORE_MARKER)) return true;
      if (prop in helpers) return true;
      if (prop in eventDetailsShorthands) return true;

      const found = findStateOwner(startState, prop);

      if (found) return prop in found.signals || prop in found.functions;
      if (WHITELIST.includes(prop)) return false; // Let the engine look at window here.
    },
  });
}
