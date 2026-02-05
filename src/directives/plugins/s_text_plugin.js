// s-text plugin
import setAttr from "../../utils/setAttributeSmart.js";
/**
 * Text Plugin for Shadow Realm
 * Registers a custom directive that sets the text content of an element
 * @param {Object} Realm - The Realm instance to register the directive on
 * @returns {void}
 */
export default function TextPlugin(Realm) {
  Realm.directive("s-text", ({ el, value, execute, expression }) => {
    // setAttr(el, "textContent", value);
    el.textContent = execute(expression);
  });
}
