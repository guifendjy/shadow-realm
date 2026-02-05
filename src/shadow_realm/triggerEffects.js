import createHandler from "../utils/createHandler.js";
import R from "../directives/directiveRegitry.js";

export default function triggerEffects($effects) {
  if (!$effects.size) return;

  $effects.forEach(
    ({
      ELEMENT,
      RAW_ATTRIBUTE: DIRECTIVE_NAME,
      VALUE: EXPRESSION,
      EL_STATE: { __SCOPE },
    }) => {
      if (R._globalDirectives[DIRECTIVE_NAME]) {
        R._globalDirectives[DIRECTIVE_NAME]({
          el: ELEMENT,
          expression: EXPRESSION, // expression
          execute: (expression) => {
            const handler = createHandler(expression, __SCOPE, true);
            handler(ELEMENT); // runs effect and pass elment to make $target available in the scope.
          },
        });
      }
    },
  );
}
