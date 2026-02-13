import { BINDING_PREFIX } from "../globals.js";
import cleanupAttribute from "../utils/cleanupAttribute.js";
import createWalkerFromNodeV2 from "../utils/createTreeWalkerFromRoot.js";

export default function getBindings($reactives, $bindings) {
  if (!$reactives.size) return;

  $reactives.forEach(({ EL_STATE, PARENT_STATE }, root) => {
    const bindings = createWalkerFromNodeV2(root, {
      prefix: BINDING_PREFIX,
    });

    // get rid of HTLM_ATTRIBUTE it no longer used.
    bindings.forEach(({ ELEMENT, RAW_ATTRIBUTE, VALUE, HTML_ATTRIBUTE }) => {
      $bindings.add({
        ELEMENT,
        RAW_ATTRIBUTE,
        HTML_ATTRIBUTE,
        VALUE,
        EL_STATE,
        PARENT_STATE,
        UNBIND: [],
      });
      cleanupAttribute(ELEMENT, RAW_ATTRIBUTE);
    });
  });
}
