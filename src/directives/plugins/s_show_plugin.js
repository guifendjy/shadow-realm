/**
 * Enhanced ShowPlugin
 * Handles original display style preservation and prevents layout thrashing.
 */
export default function showElementPlugin(Realm) {
  Realm.directive("s-show", ({ el, expression, execute }) => {
    // 1. Store the original display value once
    // This prevents setting a 'flex' container to 'block' accidentally.
    if (!el.hasOwnProperty("_originalDisplay")) {
      const currentDisplay = window.getComputedStyle(el).display;
      el._originalDisplay = currentDisplay === "none" ? "" : currentDisplay;
    }

    const toggle = (isVisible) => {
      // 2. Apply visibility without destroying the original layout intent
      el.style.display = isVisible ? el._originalDisplay : "none";

      // 3. Accessibility: Update aria-hidden for screen readers
      // NOTE: this triggers warning in case an element an element stays focus while aria-hidden is true
      // proposed solution
      // js`document.activeElement && el.contains(document.activeElement)`
      // if (isVisible) {
      //   el.removeAttribute("aria-hidden");
      // } else {
      //   el.setAttribute("aria-hidden", "true");
      // }
    };

    // 4. Initial Execution
    const result = execute(expression);
    toggle(!!result);
  });
}
