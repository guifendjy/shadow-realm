import setAttr from "../../utils/setAttributeSmart.js";

const MEMO = new WeakMap(); // memoize results to limit DOM paint

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
export default function StylePlugin(Realm) {
  Realm.directive("s-style", ({ el, expression, execute }) => {
    const result = execute(expression);

    if (result instanceof Object) {
      setAttr(el, "style", result);
      return;
    }

    const styles =
      MEMO.get(el) ||
      (result
        ? result
            .trim()
            .split(/;/)
            .filter((s) => s)
        : []);

    if (!MEMO.has(el)) MEMO.set(el, styles);

    if (result) {
      styles.forEach((style) => {
        const [prop, val] = style.split(":").map((s) => s.trim());
        el.style.setProperty(prop, val);
      });
    } else {
      styles.forEach((style) => {
        const [prop] = style.split(":").map((s) => s.trim());
        el.style.removeProperty(prop);
      });
      MEMO.delete(el);
    }
  });
}
