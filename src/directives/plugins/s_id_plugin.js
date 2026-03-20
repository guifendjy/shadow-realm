export default function setIdPlugin(R) {
  R.directive("s-id", ({ el, expression, execute }) => {
    const res = execute(expression);
    if (res) el.id = res;
  });
}
