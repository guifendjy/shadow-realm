import createHandler from "../utils/createHandler.js";
import createProxyChain from "../utils/createProxyChain.js";

export default function attachEventListeners($registry, R) {
  $registry.forEach(
    ({
      VALUE: EXPRESSION,
      HTML_ATTRIBUTE,
      ELEMENT,
      EL_STATE,
      REMOVE_LISTENER,
    }) => {
      //       // this would help me avoid duplicate listeners
      const SCOPE = createProxyChain(EL_STATE, R);


      const handlerFunction = createHandler(EXPRESSION, SCOPE);
      ELEMENT.addEventListener(HTML_ATTRIBUTE, handlerFunction);
      const removeListener = () =>
        ELEMENT.removeEventListener(HTML_ATTRIBUTE, handlerFunction);
      REMOVE_LISTENER.push(removeListener);
    },
  );
}
