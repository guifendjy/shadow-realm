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

export default function findAttributesByPattern(
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
