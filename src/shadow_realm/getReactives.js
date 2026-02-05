import { STATE_DATA_ATTR } from "../globals.js";
import { stripBrackets } from "../utils/strip.js";
import cleanupAttribute from "../utils/cleanupAttribute.js";
import evaluator from "../utils/evaluateExpression.js";
import createProxy from "../utils/createProxy.js";
import findAttributesByPattern from "../utils/createTreeWalkerFromRoot.js";
import makeReative from "../utils/makeStateReactive.js";
import R from "../directives/directiveRegitry.js";

export default function getReactives(root, $reactives) {
  // PARENT_ELEMENT: Node | null;
  // ELEMENT: Node;
  // RAW_ATTRIBUTE: any;
  // HTML_ATTRIBUTE: any;
  // VALUE: any;
  const results = findAttributesByPattern(root.parentElement ?? root, {
    target: stripBrackets(STATE_DATA_ATTR),
  });

  // if no state is declared then set those defaults
  if (!results.length) {
    const EL_STATE = {
      primitives: {},
      signals: {},
      functions: {},
    };
    EL_STATE.__SCOPE = createProxy(EL_STATE); // create an empty SCOPE HERE, the way if a store or a state is in js instead.
    $reactives.set(root, { EL_STATE });
    return;
  }

  results.forEach(
    ({ ELEMENT: el, RAW_ATTRIBUTE, VALUE: expression, PARENT_ELEMENT }) => {
      // parse the state from the attribute

      const RAW_STATE = parse(expression);
      // saves a proxy and parent if any.
      RAW_STATE.__SCOPE = createProxy(RAW_STATE);
      $reactives.set(el, { EL_STATE: RAW_STATE });

      // cleanup
      cleanupAttribute(el, RAW_ATTRIBUTE);
    },
  );
}

const parse = (expression) => {
  if (!expression?.trim()) return null;
  // A very safe but limited parser (No logic, just data) ==> R._stateResolver handles state that have been defined outside of a Realm.
  const result = evaluator(expression, R._stateResolver);
  return makeReative(result);
};
