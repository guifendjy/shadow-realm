import evaluator from "./evaluateExpression.js";
import createContext from "./createContext.js";

export default function parseExpressionCtx(
  expression,
  parentContext,
  _stateResolver,
) {
  if (!expression?.trim()) return createContext({}, parentContext);
  const parsed = evaluator(expression, _stateResolver);
  return createContext(parsed, parentContext);
}
