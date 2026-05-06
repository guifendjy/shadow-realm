import createHandler from "../utils/createHandler.js";
import createProxyChain from "../utils/createProxyChain.js";
import { default as ObserverRegistry } from "../utils/observer.js";

export default function triggerEffects($effects, R) {
  if (!$effects.size) return;

  $effects.forEach(
    ({
      ELEMENT,
      RAW_ATTRIBUTE: DIRECTIVE_NAME,
      VALUE: EXPRESSION,
      EL_STATE,
    }) => {
      if (R._globalDirectives[DIRECTIVE_NAME]) {
        ObserverRegistry.register({
          element: ELEMENT,
          onMount(TARGET) {
            let cleanup;

            R._globalDirectives[DIRECTIVE_NAME]({
              el: TARGET,
              expression: EXPRESSION, // expression
              execute: (expression) => {
                const handler = createHandler(
                  expression,
                  createProxyChain(EL_STATE, R),
                  true,
                );

                cleanup = handler(TARGET); // runs effect and pass elment to make $target available in the scope.
              },
            });

            if (cleanup) return cleanup;
          },
        });
      }
    },
  );
}
