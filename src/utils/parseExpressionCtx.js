import evaluator from "./evaluateExpression.js";
import createContext from "./createContext.js";

export default function parseExpressionCtx(
  expression,
  parentContext,
  _stateResolver,
) {
  //note: this allows you to declare empty state. because directives only gets picked up if there is a scope for it.
  if (!expression?.trim()) return createContext({}, parentContext); 
  const parsed = evaluator(expression, _stateResolver);
  return createContext(parsed, parentContext);
}
