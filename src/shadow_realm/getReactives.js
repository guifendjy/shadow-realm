import { STATE_DATA_ATTR } from "../globals.js";
import { stripBrackets } from "../utils/strip.js";
import cleanupAttribute from "../utils/cleanupAttribute.js";
import createWalkerFromNodeV2 from "../utils/createTreeWalkerFromRoot.js";
import parseExpressionCtx from "../utils/parseExpressionCtx.js";

export default function getReactives(root, $reactives, context) {
  // PARENT_ELEMENT: Node | null;
  // ELEMENT: Node;
  // RAW_ATTRIBUTE: any;
  // HTML_ATTRIBUTE: any;
  // VALUE: any;
  const results = createWalkerFromNodeV2(root, {
    target: stripBrackets(STATE_DATA_ATTR),
  });

  // if no state is declared then set those defaults
  if (!results.length) {
    const EL_STATE = context ?? {
      primitives: {},
      signals: {},
      functions: {},
      __PARENT_SCOPE: null,
    };
    $reactives.set(root, { EL_STATE });
    return;
  }

  results.forEach(
    ({ ELEMENT: el, RAW_ATTRIBUTE, VALUE: expression, PARENT_ELEMENT }) => {
      // parseExpressionCtx the state from the attribute

      const RAW_STATE = parseExpressionCtx(expression);
      // poplutate the tree.
      RAW_STATE.__PARENT_SCOPE =
        context ?? $reactives.get(PARENT_ELEMENT)?.EL_STATE ?? null; // save the parent state in the current state this while I can cascade update the tree.

      // saves a proxy and parent if any.
      $reactives.set(el, { EL_STATE: RAW_STATE });

      // cleanup
      cleanupAttribute(el, RAW_ATTRIBUTE);
    },
  );
}
