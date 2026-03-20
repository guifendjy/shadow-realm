import setAttr from "../../utils/setAttributeSmart.js";
export default function disablePlugin(P) {
  P.directive("s-disabled", ({ el, expression, execute }) => {
    const result = execute(expression);
    setAttr(el, "disabled", Boolean(result));
  });
}
