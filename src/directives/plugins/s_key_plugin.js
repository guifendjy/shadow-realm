export default function keyAttributePlugin(R) {
  R.directive("s-key", ({ el, expression, execute }) => {
    el.setAttribute("key", execute(expression) ?? "");
  });
}
