import getTokensFromExpression from "../utils/getTokenFromExpression.js";
import evaluator from "../utils/evaluateExpression.js";
import { STORE_MARKER } from "../globals.js";
import Signal from "../utils/Signal.js";
import findStateOwner from "../utils/findStateOwner.js";
import createProxyChain from "../utils/createProxyChain.js";

// NOTE: directives should handle complex expression themselves. parse and execute (while looking at the provided context) to get the favoured result.
// complex expression could result in misaligned context.
// ex: s-class="functionCallFromAnyStateOrStore(varIncurrentScope, $store.storeName.VarInThisStore) && 'classToApplyWhenTrue' "

export default function initializeBindings($bindings, R) {
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

      const TOKENS = getTokensFromExpression(EXPRESSION).filter((token) => {
        if (token.startsWith(STORE_MARKER)) return true;
        const found = findStateOwner(EL_STATE, token);
        return found?.signals?.[token];
      });

      //Note: does not need a variable from state to apply value -> this sets static if no token was found.
      if (!TOKENS.length) {
        R._globalDirectives[DIRECTIVE_NAME]({
          el: ELEMENT,
          expression: EXPRESSION, // expression
          value: null,
          context: EL_STATE,
          execute: (expression) => {
            return evaluator(expression, createProxyChain(EL_STATE, R));
          },
        });
        return;
      }

      TOKENS.forEach((token) => {
        // handles stores
        if (token.startsWith(STORE_MARKER)) {
          // RealmInstance._stores
          const tks = token.split(".");
          const STORE_NAME = tks[1];
          const SIGNAL_NAME = tks.at(2); // rest of props will be inside of the signal. ex: $store.StoreName.signals: {..context, ...(props: SignalInstances)}
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
                    return evaluator(expression, createProxyChain(EL_STATE, R));
                  },
                });
              });
              // save to unbind later.
              UNBIND.push(unbind);
            }
          } else {
            console.log(`Error: store does not exist: ${STORE_NAME}`);
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
                  return evaluator(expression, createProxyChain(EL_STATE, R));
                },
              });
            });
            UNBIND.push(unbind);
          } else {
            console.error(
              `Error: token ${token} is not defined at: ${EL_STATE}`,
            );
          }
        }
      });
    },
  );
}
