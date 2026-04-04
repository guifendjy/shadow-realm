import setAttr from "../../utils/setAttributeSmart.js";
const MEMO = new WeakMap(); // memoize results to limit DOM paint

/**
 * ClassPlugin - Directive plugin for dynamic class binding
 * @param {Object} Realm - The Realm instance to register the directive with
 * @description Registers an "s-class" directive that dynamically adds/removes CSS classes
 * based on expression evaluation. Supports both object and string class formats.
 * @example
 * // Object format: { className: boolean }
 * <div s-class="{ active: isActive }"></div>
 *
 * // String format: space-separated class names
 * <div s-class="'active inactive'"></div>
 */
export default function ClassPlugin(Realm) {
  Realm.directive("s-class", ({ el, expression, execute }) => {
    const result = execute(expression);
    const isObjectBinding = result && result.constructor === Object;

    if (isObjectBinding) {
      const previousClasses = MEMO.get(el) || [];
      previousClasses.forEach((cls) => el.classList.remove(cls));
      MEMO.delete(el);

      setAttr(el, "class", result);
      return;
    }

    const classes = typeof result === "string" ? result.trim().split(/\s+/) : [];

    classes.forEach((cls) => el.classList.add(cls));

    const previousClasses = MEMO.get(el) || [];
    previousClasses.forEach((cls) => {
      if (!classes.includes(cls)) el.classList.remove(cls);
    });

    MEMO.set(el, classes);
  });
}
