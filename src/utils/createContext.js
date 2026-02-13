import Signal from "./Signal.js";

/**
 * Creates a reactive context container for a Realm.
 * * DESIGN PHILOSOPHY:
 * We separate state into three distinct buckets (primitives, signals, functions).
 * This allows the Evaluator Proxy to stay lean while the Signal system handles
 * fine-grained reactivity.
 */
export default function createContext(raw_state) {
  // Storage for the raw initial values (used as the base for the Proxy)
  const primitives = {};
  // Storage for reactive Signal instances
  const signals = {};
  // Storage for executable methods (actions)
  const functions = {};

  /**
   * 1. CLASSIFICATION PHASE
   * We iterate through the raw state to separate logic from data.
   */
  for (const [key, value] of Object.entries(raw_state)) {
    if (typeof value === "function") {
      functions[key] = value;
    } else {
      // Every data point becomes a reactive Signal
      signals[key] = new Signal(value);
      // Primitives are kept to provide 'keys' for the Proxy traps
      primitives[key] = value;
    }
  }

  /**
   * 2. EXTENSION (SCOPED INHERITANCE)
   * This is the core of the Realm architecture.
   * * WHY THIS DESIGN:
   * When a new Realm is created (e.g., inside an s-for or a nested component),
   * it must own its local state but "see" everything above it.
   * * Instead of merging objects (which breaks reactivity and uses more memory),
   * we point the child's __PARENT_SCOPE to the current context's raw objects.
   * * @param {Object} props - The local state for the new sub-realm.
   * @returns {Object} - A new context linked to this one as its parent.
   */
  const extendContext = (props) => {
    // Create the child context first
    const context = createContext(props);

    // Link the child to the parent's raw data structures.
    // This creates a linked-list of states that the Evaluator can traverse.
    context.__PARENT_SCOPE = { primitives, signals, functions, extendContext };

    return context;
  };

  return { primitives, signals, functions, extendContext };
}
