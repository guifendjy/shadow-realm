import { helpers, REF_MARKER, STORE_MARKER, WHITELIST } from "../globals.js";
import findStateOwner from "./findStateOwner.js";

// HACK: this is populated during event firing.
// before calling and handler they are set to this event and nullified right after for any subsequent events,
// the issue might arise when there are rapid firing of events

//TODO: fix the hack and find a way to handle errors, when events gets
// triggered for example, because it does not seem to trigger errors
// if an variable is not defined.

const eventDetailsShorthands = {
  $event: null,
  $target: null,
};

/**
 * Creates a proxy that traverses the __PARENT_SCOPE tree.
 * @param {Object} startState - The raw EL_STATE -> { primitives, signals, __SCOPE, __PARENT_SCOPE } object (not the proxy).
 */

export default function createProxyChain(startState, R) {
  return new Proxy(Object.assign({}, startState), {
    get(_, prop) {
      if (typeof prop == "symbol") return;

      if (prop.startsWith(STORE_MARKER)) return R._storeResolver;

      if (prop in helpers) return helpers[prop];
      if (prop in eventDetailsShorthands) return eventDetailsShorthands[prop];
      if (prop === REF_MARKER) return R._refResolver;

      const found = findStateOwner(startState, prop);

      if (found) {
        if (prop in found.signals) return found.signals[prop].value;
        if (prop in found.functions) return found.functions[prop];
      }
      return undefined;
    },

    set(_, prop, val) {
      if (typeof prop == "symbol") return;

      if (prop.startsWith(STORE_MARKER)) return R._storeResolver;

      if (prop in helpers) helpers[prop] = val;
      if (prop in eventDetailsShorthands) eventDetailsShorthands[prop] = val;

      const found = findStateOwner(startState, prop);

      if (found) {
        if (prop in found.signals) {
          found.signals[prop].value = val;
        }
        if (prop in found.functions) {
          found.functions[prop] = val;
        }
      }

      return true;
    },

    has(_, prop) {
      if (typeof prop == "symbol") return;
      if (prop.startsWith(STORE_MARKER)) return true;
      if (prop in helpers) return true;
      if (prop in eventDetailsShorthands) return true;
      if (prop === REF_MARKER) return true;

      const found = findStateOwner(startState, prop);
      if (found) {
        return prop in found.signals || prop in found.functions;
      }
      if (WHITELIST.includes(prop)) return false;
    },
  });
}
