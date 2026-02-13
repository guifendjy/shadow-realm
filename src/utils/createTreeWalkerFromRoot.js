// Tree Walker to find all elements with attributes starting with "s-"
import { stripPrefix, stripSuffix } from "./strip.js";
import uniqid from "./unniq.js";
/**
 * Creates a tree walker to find and extract elements with matching attributes from a DOM node.
 *
 * Traverses all elements within a given node and collects those with attributes matching
 * a specified pattern (prefix, suffix, or exact name). Strips the matching pattern from
 * attribute names and returns structured data about each match.
 *
 * @param {Element} el - The root DOM element to start traversing from
 * @param {Object} options - Configuration object for attribute matching
 * @param {string} [options.prefix=null] - Match attributes that start with this prefix
 * @param {string} [options.suffix=null] - Match attributes that end with this suffix
 * @param {string} [options.target=null] - Match attributes with this exact name
 *
 * @returns {Array<Object>} Array of matched elements with their attributes
 * @returns {Element} result[].ELEMENT - The DOM element containing the matched attribute
 * @returns {string} result[].RAW_ATTRIBUTE - The original attribute name
 * @returns {string} result[].HTML_ATTRIBUTE - The attribute name with pattern stripped
 * @returns {string} result[].VALUE - The attribute value
 *
 * @throws {Error} If neither prefix, suffix, nor target is provided
 * @throws {Error} If both target and prefix/suffix are provided simultaneously
 *
 * @example
 * // Find all data-* attributes
 * const matches = findAttributesByPattern(rootEl, { prefix: 'data-' });
 *
 * // Find specific attribute
 * const matches = findAttributesByPattern(rootEl, { target: 'aria-label' });
 */

export function createWalkerFromNode(
  el,
  options = { prefix: null, suffix: null, target: null },
) {
  if (!options.prefix && !options.target && !options.suffix) {
    throw new Error("Either prefix or target must be provided in options");
  }

  if (
    (options.prefix && options.target) ||
    (options.suffix && options.target)
  ) {
    throw new Error("Provide either prefix/suffix or target, not both");
  }

  const results = [];

  // Helper function to process attributes so we don't repeat code
  const processAttributes = (node) => {
    for (const attr of node.attributes) {
      if (
        (options.suffix && attr.name.endsWith(options.suffix)) ||
        (options.prefix && attr.name.startsWith(options.prefix)) ||
        (options.target && attr.name === options.target)
      ) {
        results.push({
          ID: uniqid("s_r_", 5),
          ELEMENT: node,
          RAW_ATTRIBUTE: attr.name,
          HTML_ATTRIBUTE: options.prefix
            ? stripPrefix(attr.name, options.prefix)
            : options.suffix
              ? stripSuffix(attr.name, options.suffix)
              : attr.name,
          VALUE: attr.value,
        });
      }
    }
  };

  // 1. Process the root element FIRST
  processAttributes(el);

  // 2. Now walk the children
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT);
  while (walker.nextNode()) {
    processAttributes(walker.currentNode);
  }

  return results;
}

export function createWalkerFromNodeV1(
  root,
  options = { prefix: null, suffix: null, target: null },
) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  const results = [];

  // This tracks the chain of [data-state] elements we are currently inside
  const realmStack = [];

  while (walker.nextNode()) {
    const el = walker.currentNode;

    // 1. MAINTAIN THE STACK
    // If the current element is NOT a descendant of the top of the stack,
    // it means we've moved out of that realm. Pop until we find a parent or hit bottom.
    while (
      realmStack.length > 0 &&
      !realmStack[realmStack.length - 1].contains(el)
    ) {
      realmStack.pop();
    }

    // 2. IDENTIFY REALMS
    // If this element defines a new state, it becomes the new "Current Realm"
    if (el.hasAttribute(options?.target)) {
      realmStack.push(el);
    }

    // 3. CAPTURE BINDINGS
    for (const attr of el.attributes) {
      if (
        (options.suffix && attr.name.endsWith(options.suffix)) ||
        (options.prefix && attr.name.startsWith(options.prefix)) ||
        (options.target && attr.name === options.target)
      ) {
        // Find the "Immediate Parent Realm"
        // If the current element IS a data-state, its parent is the one ABOVE it in the stack.
        // If it's just a regular element, its parent is the current top of the stack.
        const isStateNode = attr.name === options?.target;
        const parentIdx = isStateNode
          ? realmStack.length - 2
          : realmStack.length - 1;
        const parentElement = parentIdx >= 0 ? realmStack[parentIdx] : null;

        results.push({
          PARENT_ELEMENT: parentElement,
          ELEMENT: el,
          RAW_ATTRIBUTE: attr.name,
          HTML_ATTRIBUTE: options.prefix
            ? stripPrefix(attr.name, options.prefix)
            : options.suffix
              ? stripSuffix(attr.name, options.suffix)
              : attr.name,
          VALUE: attr.value,
        });
      }
    }
  }

  return results;
}

export default function createWalkerFromNodeV2(
  root,
  options = { prefix: null, suffix: null, target: null },
) {
  const results = [];
  const realmStack = [];

  // Helper to process a node's attributes
  const processNode = (node) => {
    // 1. Maintain Stack: If the current node isn't inside the last realm, pop.
    while (
      realmStack.length > 0 &&
      !realmStack[realmStack.length - 1].contains(node)
    ) {
      realmStack.pop();
    }

    // 2. Identify Realms: Does this element define a new boundary?
    const definesNewRealm = options.target && node.hasAttribute(options.target);
    if (definesNewRealm) {
      realmStack.push(node);
    }

    // 3. Process Attributes
    for (const attr of node.attributes) {
      const isMatch =
        (options.suffix && attr.name.endsWith(options.suffix)) ||
        (options.prefix && attr.name.startsWith(options.prefix)) ||
        (options.target && attr.name === options.target);

      if (isMatch) {
        // Determine the "Owner Realm"
        // If this element defines a state, the parent realm is the one above it in the stack.
        const isStateNode = options.target && attr.name === options.target;
        const parentIdx = isStateNode
          ? realmStack.length - 2
          : realmStack.length - 1;
        const parentElement = parentIdx >= 0 ? realmStack[parentIdx] : null;

        results.push({
          ID: uniqid("s_r_", 5),
          PARENT_ELEMENT: parentElement,
          ELEMENT: node,
          RAW_ATTRIBUTE: attr.name,
          HTML_ATTRIBUTE: options.prefix
            ? attr.name.slice(options.prefix.length) // more performant stripPrefix
            : options.suffix
              ? attr.name.slice(0, -options.suffix.length)
              : attr.name,
          VALUE: attr.value,
        });
      }
    }
  };

  // --- THE SYNCED WALK ---

  // 1. Manually process the root
  processNode(root);

  // 2. Walk the descendants
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  while (walker.nextNode()) {
    processNode(walker.currentNode);
  }

  return results;
}
