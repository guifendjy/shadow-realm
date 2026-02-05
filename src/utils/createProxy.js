import { helpers, WHITELIST } from "../globals.js";
import R from "../directives/directiveRegitry.js";
import { STORE_MARKER } from "../globals.js";

export default function createProxy(TEMP_STATE) {
  return new Proxy(
    // Combine state and helpers
    Object.assign({}, TEMP_STATE.primitives, TEMP_STATE.functions),
    {
      set(target, prop, val) {
        if (prop === STORE_MARKER) return R._storeResolver;

        if (prop in helpers) {
          helpers[prop] = val;
        }
        if (prop in target) {
          const signal = TEMP_STATE.signals[prop];
          signal.value = val;
        }

        return true;
      },
      get(target, prop) {
        if (prop === STORE_MARKER) return R._storeResolver;

        if (prop in helpers) return helpers[prop]; // feed helpers in the scope
        if (prop in TEMP_STATE.signals) return TEMP_STATE.signals[prop].value;
        if (prop in TEMP_STATE.functions) return TEMP_STATE.functions[prop]; // seems to work without binding it to the LOCAL PROXY
      },
      // IMPORTANT: 'with' checks 'has' to see if it should intercept the variable
      has(_, prop) {
        if (WHITELIST.includes(prop)) return false; // Let the engine look at window here.
        return true; // Trap everything else
      },
    },
  );
}
