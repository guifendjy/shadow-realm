/**
 * ValuePlugin - Registers a custom directive for binding values to DOM elements
 * @param {Object} Realm - The realm/framework object that provides directive registration
 * @returns {void}
 *
 * @description
 * Registers the "s-value" directive which sets the value attribute of an element
 * by executing the provided expression and binding its result to the element's value property.
 *
 * @example
 * // Usage in template:
 * // <input s-value="userInput" />
 */
export default function ValuePlugin(Realm) {
  Realm.directive("s-value", ({ el, expression, execute }) => {
    el.value = execute(expression);
  });
}
