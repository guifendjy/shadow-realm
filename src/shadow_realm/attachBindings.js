import getTokensFromExpression from "../utils/getTokenFromExpression.js";
import evaluator from "../utils/evaluateExpression.js";
import R from "../directives/directiveRegitry.js";
import { STORE_MARKER } from "../globals.js";
import Signal from "../utils/Signal.js";
import findStateOwner from "../utils/findStateOwner.js";
import createProxyChain from "../utils/createProxyChain.js";

export default function initializeBindings($bindings) {
  if (!$bindings.size) return;

  $bindings.forEach(
    ({
      ELEMENT,
      RAW_ATTRIBUTE: DIRECTIVE_NAME,
      VALUE: EXPRESSION,
      EL_STATE,
      UNBIND,
    }) => {
      if (!R._globalDirectives[DIRECTIVE_NAME]) {
        console.error(ELEMENT);
        throw new Error(
          `Error: Invalid directives. use the R class to add directive: <${DIRECTIVE_NAME}>`,
        );
      }

      const TOKENS = getTokensFromExpression(EXPRESSION).filter(
        (v) => v.startsWith(STORE_MARKER) || findStateOwner(EL_STATE, v), // will only bind to token that are in state declared by user
      );

      // these too down there needs to be cleaned up using same code if both cases.
      // if no tokens just connect to R (directives then the can handle it as they wish)
      // not in state
      if (!TOKENS.length) {
        R._globalDirectives[DIRECTIVE_NAME]({
          el: ELEMENT,
          expression: EXPRESSION, // expression
          value: null,
          context: EL_STATE,
          execute: (expression) => {
            return evaluator(expression, createProxyChain(EL_STATE));
          },
        });
        return;
      } // don't do nothing -> this only for dynamic stuff not set initial state. the browser works best when setting initial values for class, style. etc...

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
              const unbind = signal.bind((newValue) => {
                R._globalDirectives[DIRECTIVE_NAME]({
                  el: ELEMENT,
                  expression: EXPRESSION, // expression
                  value: newValue,
                  context: EL_STATE,
                  execute: (expression) => {
                    return evaluator(expression, createProxyChain(EL_STATE));
                  },
                });
              });
              // save
              UNBIND.push(unbind);
            }
          }
        } else {
          const FOUND = findStateOwner(EL_STATE, token);
          const SIGNAL = FOUND?.signals[token];

          // signal is source of truth if there is not signal found then it's not in this scope.
          if (SIGNAL && SIGNAL instanceof Signal) {
            const unbind = SIGNAL.bind((newValue) => {
              R._globalDirectives[DIRECTIVE_NAME]({
                el: ELEMENT,
                expression: EXPRESSION, // expression
                value: newValue,
                context: EL_STATE,
                execute: (expression) => {
                  return evaluator(expression, createProxyChain(EL_STATE));
                },
              });
            });
            UNBIND.push(unbind);
          }
        }
      });
    },
  );
}
