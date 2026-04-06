import Signal from "./Signal.js";

/**
 * Creates a reactive context container for a Realm.
 * * DESIGN PHILOSOPHY:
 * We separate state into three distinct buckets (primitives, signals, functions).
 * to not create any leaks when creating proxies. because we use a chain proxy approach to resolve state in a particular context.
 * This allows the Evaluator Proxy to stay lean while the Signal system handles
 * fine-grained reactivity.
 */

//NOTE: that's what a R.store(...) or a R.state(...) is, same as state declared in html with the `s-state` directive.
// it is mean to seperate concerns. signals are used to subscibe registered directives used in on a node.
export default function createContext(raw_state = {}, parentContext = null) {
  const primitives = {};
  const signals = {};
  const functions = {};

  /**
   * 1. CLASSIFICATION PHASE
   */
  for (const [key, value] of Object.entries(raw_state)) {
    if (typeof value === "function") {
      functions[key] = value;
    } else {
      signals[key] = new Signal(value);
      primitives[key] = value;
    }
  }

  /**
   * 2. SCOPED INHERITANCE
   * Creates a sub-context that inherits this context as its parent.
   */
  const extendContext = (props) => {
    // We pass the current return object as the parentContext
    return createContext(props, context);
  };

  // The context object itself
  const context = {
    primitives,
    signals,
    functions,
    extendContext,
    __PARENT_SCOPE: parentContext,
  };

  return context;
}
