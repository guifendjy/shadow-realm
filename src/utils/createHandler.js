import evaluator from "./evaluateExpression.js";

export default function createHandler(EXPRESSION, SCOPE, isEffect = false) {
  return (e) => {
    if (e) {
      SCOPE.$event = isEffect ? null : e;
      SCOPE.$target = isEffect ? e : e.target;
    }

    const func = evaluator(EXPRESSION, SCOPE);

    if (e) {
      SCOPE.$event = null;
      SCOPE.$target = null;
    }
    return func;
  };
}
