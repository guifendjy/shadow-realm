export default function (R) {
  R.directive("s-ref", ({ el, expression }) => {
    if (!expression) return;
    R.$refs(expression, el);
  });
}
