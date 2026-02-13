import createHandler from "../utils/createHandler.js";
import { EVENT_LISTENER_PREFIX } from "../globals.js";
import cleanupAttribute from "../utils/cleanupAttribute.js";
import { createWalkerFromNode } from "../utils/createTreeWalkerFromRoot.js";
import createProxyChain from "../utils/createProxyChain.js";

export default function getAndAttachEventListener($reactives, $registry) {
  $reactives.forEach(({ EL_STATE }, root) => {
    const eventListeners = createWalkerFromNode(root, {
      prefix: EVENT_LISTENER_PREFIX,
    });

    eventListeners.forEach((ev) => {
      $registry.add({ ...ev, REMOVE_LISTENER: [], EL_STATE });
      cleanupAttribute(ev.ELEMENT, ev.RAW_ATTRIBUTE);
    });
  });

  $registry.forEach(
    ({
      VALUE: EXPRESSION,
      HTML_ATTRIBUTE,
      ELEMENT,
      EL_STATE,
      REMOVE_LISTENER,
    }) => {
      //       // this would help me avoid duplicate listeners
      const SCOPE = createProxyChain(EL_STATE);

      const handlerFunction = createHandler(EXPRESSION, SCOPE);
      ELEMENT.addEventListener(HTML_ATTRIBUTE, handlerFunction);

      const removeListener = () =>
        ELEMENT.removeEventListener(HTML_ATTRIBUTE, handlerFunction);

      REMOVE_LISTENER.push(removeListener);
    },
  );
}
