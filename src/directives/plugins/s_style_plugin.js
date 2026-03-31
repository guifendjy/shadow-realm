import setAttr from "../../utils/setAttributeSmart.js";

/**
 * StylePlugin - Handles dynamic style binding for elements using s-style directive
 * @param {Object} Realm - The reactive framework realm instance
 * @returns {void}
 *
 * @description
 * Registers an s-style directive that applies styles to elements.
 * Supports both object notation {prop: value} and string notation "prop: value; prop2: value2"
 *
 * @example
 * s-state="{color: 'red'}" -> this can be updated.
 * <!-- Object style -->
 * <div s-style="{ color: color, fontSize: '12px' }"></div>
 *
 * <!-- String style -->
 * <div s-style="'color: red; font-size: 12px'"></div>
 */
const MEMO = new WeakMap(); // memoize results to limit DOM paint
export default function StylePlugin(Realm) {
  Realm.directive("s-style", ({ el, expression, execute }) => {
    const result = execute(expression);
    const prev = MEMO.get(el);
    if (prev === result) return; // No change if same reference

    // Helper to convert style to object
    function toStyleObject(style) {
      if (typeof style === "object" && style !== null) return style;
      if (typeof style === "string") {
        const obj = {};
        style.split(";").forEach((part) => {
          const [prop, val] = part.split(":").map((s) => s.trim());
          if (prop && val) {
            const camelProp = prop.replace(/-([a-z])/g, (_, letter) =>
              letter.toUpperCase(),
            );
            obj[camelProp] = val;
          }
        });
        return obj;
      }
      return {};
    }

    const newStyles = toStyleObject(result);
    const prevStyles = prev ? toStyleObject(prev) : {};

    // Apply new or changed properties
    for (const prop in newStyles) {
      if (newStyles[prop] !== prevStyles[prop]) {
        el.style[prop] = newStyles[prop];
      }
    }

    // Remove properties no longer present
    for (const prop in prevStyles) {
      if (!(prop in newStyles)) {
        el.style[prop] = "";
      }
    }

    MEMO.set(el, result);
  });
}
