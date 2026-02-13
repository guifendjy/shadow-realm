import R from "../directives/directiveRegitry.js";
import evaluator from "./evaluateExpression.js";
import createContext from "./createContext.js";

export default function parseExpressionCtx(expression) {
  if (!expression?.trim()) return createContext({}); // to avoid issues with empty states
  // A very safe but limited parser (No logic, just data) ==> R._stateResolver handles state that have been defined outside of a Realm.
  const result = evaluator(expression, R._stateResolver);
  return createContext(result);
}
