import createHandler from "../utils/createHandler.js";
import { EVENT_LISTENER_PREFIX } from "../globals.js";
import cleanupAttribute from "../utils/cleanupAttribute.js";
import findAttributesByPattern from "../utils/createTreeWalkerFromRoot.js";
import getTokenFromExpression from "../utils/getTokenFromExpression.js";

export default function getAndAttachEventListener($reactives) {
  const $events = new Map();

  $reactives.forEach(({ EL_STATE }, el) => {
    const results = findAttributesByPattern(el, {
      prefix: EVENT_LISTENER_PREFIX,
    });
    $events.set(EL_STATE, results);
  });

  $events.forEach((RESULTS, EL_STATE) => {
    RESULTS.forEach(
      ({ VALUE: EXPRESSION, RAW_ATTRIBUTE, ELEMENT, HTML_ATTRIBUTE }) => {
        const tokens = getTokenFromExpression(EXPRESSION);
        const isInScope = tokens.some((tk) =>
          !tk.startsWith("$store") ? true : tk in EL_STATE.__SCOPE,
        );

        if (isInScope) {
          // this would help me avoid duplicate listeners
          const SCOPE = EL_STATE.__SCOPE;
          const handlerFunction = createHandler(EXPRESSION, SCOPE);
          ELEMENT.addEventListener(HTML_ATTRIBUTE, handlerFunction);
          cleanupAttribute(ELEMENT, RAW_ATTRIBUTE);
        }
      },
    );
  });
}
