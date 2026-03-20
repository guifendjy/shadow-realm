import { S_EFFECT_PREFIX } from "../globals.js";
import cleanupAttribute from "../utils/cleanupAttribute.js";
import createWalkerFromNodeV2 from "../utils/createTreeWalkerFromRoot.js";

/**
 * Processes reactive elements and registers their effect handlers.
 *
 * Extracts effect attributes from reactive elements, filters out duplicates,
 * and registers them in the effects collection with their associated state.
 *
 * Effects are designed to run once per element, unlike reactive values which
 * can be bound to multiple targets simultaneously. The filtering mechanism
 * ensures that duplicate effects are not registered by comparing against
 * previously discovered effects across all reactive elements. (it works in layers it ensure scope are properly assigned.)
 *
 * NOTE: we start grabing special attributes from state, so where-ever state is created with the [STATE_DATA_ATTR], it runs the same logic, at this layer. this way there is no need to manage scope relations.
 * effects and event listeners regardless, and should be instanciated once during initialization.
 *
 * @param {Map} $reactives - Map of reactive elements with their EL_STATE metadata
 * @param {Set} $effects - Collection to store processed effect objects
 * @returns {void}
 *
 * @example
 * getEffects(reactiveElementsMap, effectsSet);
 */
export default function getEffects($reactives, $effects) {
  if (!$reactives.size) return;

  let processed = new WeakMap();

  $reactives.forEach(({ EL_STATE }, el) => {
    const results = createWalkerFromNodeV2(el, { prefix: S_EFFECT_PREFIX });

    results.forEach(({ RAW_ATTRIBUTE, ELEMENT, VALUE: EXPRESSION }) => {
      if (!processed.has(ELEMENT) && processed.get(ELEMENT) != EXPRESSION) {
        // makes sure that it is unique
        // avoid registering same effect twice in different state logic.
        processed.set(ELEMENT, EXPRESSION);

        $effects.add({
          ELEMENT,
          RAW_ATTRIBUTE,
          VALUE: EXPRESSION,
          EL_STATE,
          EFFECT_CLEANUP: [],
        });
        cleanupAttribute(ELEMENT, RAW_ATTRIBUTE); // clean first here
      }
    });
  });

  processed = null;
}
