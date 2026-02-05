import { BINDING_PREFIX } from "../globals.js";
import cleanupAttribute from "../utils/cleanupAttribute.js";
import findAttributesByPattern from "../utils/createTreeWalkerFromRoot.js";

export default function getBindings($reactives, $bindings) {
  if (!$reactives.size) return;

  $reactives.forEach(({ EL_STATE }, el) => {
    const bindings = findAttributesByPattern(el, { prefix: BINDING_PREFIX });

    // get rid of HTLM_ATTRIBUTE it no longer used.
    bindings.forEach(({ ELEMENT, RAW_ATTRIBUTE, VALUE, HTML_ATTRIBUTE }) => {
      $bindings.add({
        ELEMENT,
        RAW_ATTRIBUTE,
        HTML_ATTRIBUTE,
        VALUE,
        EL_STATE,
      });
    });
  });

  $bindings.forEach(({ ELEMENT, RAW_ATTRIBUTE }) =>
    cleanupAttribute(ELEMENT, RAW_ATTRIBUTE),
  );
}
