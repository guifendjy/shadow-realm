/**
 * shadow_realm.d.ts
 * Type declarations for the Shadow Realm reactive DOM framework.
 */

// ─────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────

/** Raw state object passed when declaring reactive state. */
export type RawState = Record<string, any>;

/** The reactive context created from a raw state object. */
export interface ReactiveContext {
  /** Creates a child context that inherits this one as its parent scope. */
  extendContext(props: RawState): ReactiveContext;
}


// ─────────────────────────────────────────────
// DIRECTIVE HANDLER
// ─────────────────────────────────────────────

/** Arguments passed to every directive handler function. */
export interface DirectiveArgs {
  /** The DOM element the directive is attached to. */
  el: HTMLElement;
  /** The raw attribute value string (the expression). */
  expression: string;
  /**
   * The new signal value when a reactive dependency changed.
   * `null` when the directive has no reactive tokens (static call).
   */
  value: any;
  /** The raw reactive context of the element. */
  context: ReactiveContext;
  /**
   * Evaluates an expression string against the element's full proxy scope,
   * traversing the parent scope chain as needed.
   *
   * @param expression - A JavaScript expression string.
   * @returns The evaluated result, or `null` on error.
   */
  execute(expression: string): any;
}

/** A directive handler function registered via `Shadow.directive`. */
export type DirectiveHandler = (args: DirectiveArgs) => void;


// ─────────────────────────────────────────────
// PLUGIN
// ─────────────────────────────────────────────

/**
 * The type of the Shadow registry class itself (the static constructor side).
 * Use this when you need to type a reference to `Shadow` as a value —
 * for example, when storing it in a variable or passing it to a function.
 *
 * @example
 * function inspect(registry: ShadowConstructor) {
 *   registry.store('demo', () => ({ count: 0 }));
 * }
 */
export type ShadowConstructor = typeof Shadow;

/**
 * A plugin is a function that receives the Shadow registry class and
 * registers one or more directives on it.
 *
 * @example
 * const MyPlugin: PluginFn = (Shadow) => {
 *   Shadow.directive('s-tooltip', ({ el, execute, expression }) => {
 *     el.title = execute(expression);
 *   });
 * };
 */
export type PluginFn = (Shadow: ShadowConstructor) => void;


// ─────────────────────────────────────────────
// SHADOW (R) — GLOBAL REGISTRY
// ─────────────────────────────────────────────

/**
 * The global static registry for directives, stores, plugins, and refs.
 * Shared across all `Realm` instances.
 *
 * @example
 * import { Shadow } from './shadow_realm.js';
 *
 * Shadow.store('cart', () => ({ items: [], total: 0 }));
 * Shadow.directive('s-tooltip', ({ el, execute, expression }) => {
 *   el.title = execute(expression);
 * });
 */
export declare class Shadow {
  /**
   * Registers an element reference under the given name.
   * Prefer the `s-ref` directive for declarative usage.
   *
   * @param name  - The ref identifier used to retrieve the element via `$refs`.
   * @param value - The DOM element to register.
   */
  static $refs(name: string, value: Element): void;

  /**
   * Registers a global reactive store accessible from any Realm via `$store`.
   *
   * @param name     - The store name used in `$store.<name>.<property>` expressions.
   * @param callback - Factory function returning the initial state object.
   *
   * @example
   * Shadow.store('auth', () => ({ user: null, isLoggedIn: false }));
   */
  static store(name: string, callback: () => RawState): void;

  /**
   * Registers a named, reusable state factory.
   *
   * @param name     - The factory name.
   * @param callback - Function that receives arguments and returns initial state.
   *
   * @example
   * Shadow.state('counter', (start = 0) => ({ count: start }));
   */
  static state(name: string, callback: (...args: any[]) => RawState): void;

  /**
   * Registers a plugin. A plugin is a function that receives the Shadow class
   * and calls `Shadow.directive()` on it.
   *
   * @param pluginFn - The plugin function.
   * @returns The Shadow class, allowing chaining.
   *
   * @example
   * Shadow.use(MyPlugin).use(AnotherPlugin);
   */
  static use(pluginFn: PluginFn): typeof Shadow;

  /**
   * Registers a reactive directive.
   * The handler is invoked once immediately (on init) and again whenever
   * a reactive dependency in the expression changes.
   *
   * @param name    - Directive name. Must start with `"s-"`.
   * @param handler - Handler function called on each reactive update.
   *
   * @throws {Error} If the name does not start with `"s-"`.
   *
   * @example
   * Shadow.directive('s-tooltip', ({ el, expression, execute }) => {
   *   el.title = execute(expression);
   * });
   */
  static directive(name: `s-${string}`, handler: DirectiveHandler): void;
}


// ─────────────────────────────────────────────
// REALM
// ─────────────────────────────────────────────

/**
 * Per-element reactive controller.
 *
 * Scans its root element subtree for `s-state`, `s-*` directives, `on:*`
 * event listeners, and `s-effect` attributes, then activates them on
 * `.initialize()`.
 *
 * @example
 * const realm = new Realm(document.querySelector('#app'));
 * realm.initialize();
 */
export declare class Realm {
  /**
   * @param root    - Root DOM element. Defaults to `document.body`.
   * @param context - An existing `ReactiveContext` to inherit as the parent
   *                  scope (e.g. from a parent Realm). Defaults to `null`.
   */
  constructor(root?: HTMLElement, context?: ReactiveContext | null);

  /** The root DOM element this Realm manages. */
  readonly root: HTMLElement;

  /**
   * The injected parent context, if any.
   * When provided, expressions in this Realm can access state from the parent.
   */
  readonly context: ReactiveContext | null;

  /** `true` after `initialize()` has been called successfully. */
  readonly ready: boolean;

  /**
   * Activates all bindings, attaches event listeners, and runs effects.
   * Calling this more than once is safe — subsequent calls are no-ops.
   *
   * @returns The Realm instance for method chaining.
   */
  initialize(): this;

  /**
   * Tears down the Realm:
   * - Removes all DOM event listeners.
   * - Unsubscribes all signal bindings.
   * - Runs effect cleanup functions.
   * - Clears all internal state maps.
   * - Resets `ready` to `false`.
   *
   * Call this before removing the root element from the DOM.
   */
  destroy(): void;
}


// ─────────────────────────────────────────────
// MODULE EXPORTS
// ─────────────────────────────────────────────

export { Realm as default };
export type { ShadowConstructor };