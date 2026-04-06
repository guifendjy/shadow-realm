import { STATE_DATA_ATTR } from "../globals.js";
import { stripBrackets } from "../utils/strip.js";
import cleanupAttribute from "../utils/cleanupAttribute.js";
import createWalkerFromNodeV2 from "../utils/createTreeWalkerFromRoot.js";
import parseExpressionCtx from "../utils/parseExpressionCtx.js";

export default function getReactives(
  root,
  $reactives,
  context = null, // from another realm(to extend this realm)
  stateResolver,
) {
  // PARENT_ELEMENT: Node | null;
  // ELEMENT: Node;
  // RAW_ATTRIBUTE: any;
  // HTML_ATTRIBUTE: any;
  // VALUE: any; => the EXPRESSION to parse.
  const results = createWalkerFromNodeV2(root, {
    target: stripBrackets(STATE_DATA_ATTR),
  });

  // init context at the root.
  const rootContext = context || {
    root: true,
    primitives: {},
    signals: {},
    functions: {},
    __PARENT_SCOPE: null,
  };
  $reactives.set(root, { EL_STATE: rootContext });

  // create the context tree.
  results.forEach(
    ({ ELEMENT: el, RAW_ATTRIBUTE, VALUE: expression, PARENT_ELEMENT }) => {
      // grab the parent context on the parent element if any
      const __PARENT_SCOPE = $reactives.get(PARENT_ELEMENT)?.EL_STATE ?? null;

      // create context for this element
      const ctx = parseExpressionCtx(expression, __PARENT_SCOPE, stateResolver);

      // save context for this element
      $reactives.set(el, { EL_STATE: ctx });

      // cleanup
      cleanupAttribute(el, RAW_ATTRIBUTE);
    },
  );
}
