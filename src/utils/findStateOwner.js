/**
 * Recursively searches up the raw state tree for a property.
 * Returns the entire raw state object that contains the key.
 */
export default function findStateOwner(currentState, key) {
  // 1. Safety check
  if (!currentState) return null;
  // 2. Check if the key exists in this specific layer's data
  // We check signals (for data) or functions
  const hasSignal = currentState.signals && key in currentState.signals;
  const hasFunction = currentState.functions && key in currentState.functions;
  if (hasSignal || hasFunction) {
    return currentState; // Found the owner!
  }
  // 3. If not found, move up to the raw parent
  // Note: We use __PARENT_SCOPE which points to the RAW state, not the Proxy
  return findStateOwner(currentState.__PARENT_SCOPE, key);
}

// 2nd optn
// let current = currentState;
// while (current) {
//   // 1. Check if the property exists in this layer's signals or functions
//   if (current.signals && key in current.signals) {
//     return current;
//   }
//   if (current.functions && key in current.functions) {
//     return current;
//   }

//   // 2. Move up to the raw parent state
//   current = current.__PARENT_SCOPE;
// }
// return current;
