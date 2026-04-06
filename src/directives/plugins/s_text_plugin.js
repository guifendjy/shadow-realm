// s-text plugin
/**
 * Text Plugin for Shadow Realm
 * Registers a custom directive that sets the text content of an element
 * @param {Object} Realm - The Realm instance to register the directive on
 * @returns {void}
 */
export default function TextPlugin(Realm) {
  Realm.directive("s-text", ({ el, execute, expression, context }) => {
    el.textContent = execute(expression);
  });
}
