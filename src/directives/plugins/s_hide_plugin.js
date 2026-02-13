/**
 * ShowPlugin - A directive plugin for conditional visibility control
 * @param {Object} Realm - The Realm framework instance
 * @returns {void}
 *
 * @description Registers an "s-show" directive that toggles element visibility
 * by setting the display style property based on expression evaluation.
 * When expression is truthy, display is set to "none"; otherwise, display is cleared.
 */
export default function hideTogglePlugin(Realm) {
  Realm.directive("s-hide", ({ el, expression, execute }) => {
    const result = execute(expression);
    if (result) {
      el.style.display = "";
    } else {
      el.style.display = "none";
    }
  });
}
