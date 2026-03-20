export default function markdownRendering(R) {
  /* <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>  */
  R.directive("s-markdown", ({ el, expression, execute }) => {
    const markdownInput = execute(expression);
    el.innerHTML = marked.parse(markdownInput);
  });
}
