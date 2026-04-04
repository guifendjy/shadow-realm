import createHandler from "../utils/createHandler.js";
import createProxyChain from "../utils/createProxyChain.js";

export default function triggerEffects($effects, R) {
  if (!$effects.size) return;

  $effects.forEach(
    ({
      ELEMENT,
      RAW_ATTRIBUTE: DIRECTIVE_NAME,
      VALUE: EXPRESSION,
      EL_STATE,
      EFFECT_CLEANUP,
    }) => {
      if (R._globalDirectives[DIRECTIVE_NAME]) {
        R._globalDirectives[DIRECTIVE_NAME]({
          el: ELEMENT,
          expression: EXPRESSION, // expression
          execute: (expression) => {
            const handler = createHandler(
              expression,
              createProxyChain(EL_STATE, R),
              true,
            );
            const cleanup = handler(ELEMENT); // runs effect and pass elment to make $target available in the scope.
            if (typeof cleanup === "function") {
              EFFECT_CLEANUP.push(cleanup);
            }
          },
        });
      }
    },
  );
}
