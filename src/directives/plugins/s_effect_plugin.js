/**
 * Effect Plugin for Realm directive system
 * @param {Object} Realm - The Realm framework instance
 * @description Registers the 's-effect' directive which executes expressions as side effects.
 * Custom effects can be created using 's-effect-*' format via directive plugins.
 * Effects are executed immediately when the JavaScript loads (onMount).
 * @example
 * // In template: <div s-effect="callback()"></div>
 * // Custom effect: <div s-effect-custom="value"></div>
 */
export default function EffectPlugin(Realm) {
  // s-effect can be overridden but it can be the prefix for custom effects-> keep in mind effect runs soon as the js load(onMount).
  Realm.directive("s-effect", ({ expression, execute }) => {
    // s-effect-* => this format will allow you to run custom effects. by providing a directive plugin, via R.directive static method.
    execute(expression);
  });
}
