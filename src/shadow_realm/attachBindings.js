import getTokensFromExpression from "../utils/getTokenFromExpression.js";
import evaluator from "../utils/evaluateExpression.js";
import R from "../directives/directiveRegitry.js";
import { STORE_MARKER } from "../globals.js";
import Signal from "../utils/Signal.js";

export default function initializeBindings($bindings) {
  if (!$bindings.size) return;

  $bindings.forEach(
    ({
      ELEMENT,
      RAW_ATTRIBUTE: DIRECTIVE_NAME,
      VALUE: EXPRESSION,
      EL_STATE,
    }) => {
      if (!R._globalDirectives[DIRECTIVE_NAME]) {
        console.error(ELEMENT);
        throw new Error(
          `Error: Invalid directives. use the R class to add directive: <${DIRECTIVE_NAME}>`,
        );
      }

      const TOKENS = getTokensFromExpression(EXPRESSION).filter(
        (v) => v in EL_STATE.__SCOPE, // will only bind to token that are in state declared by user
      );

      // these too down there needs to be cleaned up using same code if both cases.
      // if no tokens just connect to R (directives then the can handle it as they wish)
      if (!TOKENS.length) return; // don't do nothing -> this only for dynamic stuff not set initial state. the browser works best when setting initial values for class, style. etc...

      TOKENS.forEach((token) => {
        // handles stores
        if (token.startsWith(STORE_MARKER)) {
          // RealmInstance._stores
          const tks = token.split(".");
          const STORE_NAME = tks[1];
          const SIGNAL_NAME = tks.at(-1);

          const STORE = R._stores[STORE_NAME];

          if (STORE) {
            const signal = STORE.signals?.[SIGNAL_NAME];

            if (signal && signal instanceof Signal) {
              signal.bind((newValue) => {
                R._globalDirectives[DIRECTIVE_NAME]({
                  el: ELEMENT,
                  expression: EXPRESSION, // expression
                  value: newValue,
                  execute: (expression) => {
                    return evaluator(expression, EL_STATE.__SCOPE);
                  },
                });
              });
            }
          }
        } else if (token in EL_STATE.signals) {
          const SIGNAL = EL_STATE.signals[token];

          // signal is source of truth if there is not signal found then it's not in this scope.
          if (SIGNAL && SIGNAL instanceof Signal) {
            SIGNAL.bind((newValue) => {
              R._globalDirectives[DIRECTIVE_NAME]({
                el: ELEMENT,
                expression: EXPRESSION, // expression
                value: newValue,
                execute: (expression) => {
                  return evaluator(expression, EL_STATE.__SCOPE);
                },
              });
            });
          }
        }
      });
    },
  );
}
