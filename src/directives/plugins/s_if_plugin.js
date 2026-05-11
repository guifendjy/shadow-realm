import Realm from "../../index.js";
import uniqid from "../../utils/unniq.js";
import BudgetQueue from "../../utils/taskBudget.js";

const registry = new WeakMap();
const realmQueue = new BudgetQueue();

export default function conditionalRenderPlugin(R) {
  R.directive("s-if", ({ el, expression, execute, context }) => {
    if (el.tagName !== "TEMPLATE") {
      console.log(el);
      throw new Error(
        `Error: directive <s-if> can only be used on template elements. ${expression}`,
      );
    }

    if (el.content.childElementCount > 1) {
      console.warn(
        `Warning: <s-if> directive expects exactly one root element in the template. Found ${el.content.childElementCount}. Only the first element will be rendered.`,
        el,
      );
    }

    // 1. SETUP: Initialize the registry entry once
    if (!registry.has(el)) {
      const marker = document.createComment(uniqid("s-if", 5));

      el.replaceWith(marker);
      registry.set(el, {
        marker,
        realm: null,
        lastResult: null, // Track the toggle context
      });
    }

    const render = () => {
      const data = registry.get(el);
      const result = Boolean(execute(expression));

      // 2. GUARD: Only proceed if the condition actually changed
      if (result === data.lastResult) return;
      data.lastResult = result;

      if (result) {
        // 3. MOUNT: Expression became true

        const nodeTemplate = el.content.cloneNode(true); // Clone the fragment
        const container = nodeTemplate.firstElementChild;
        if (!container)
          return console.error(
            "Error: Template content is empty or invalid at s-if:",
            el,
          );

        // Initialize the Realm on the cloned content
        if (!data.realm) {
          data.realm = new Realm(container, context);
        }
        data.marker.after(data.realm.root);

        // 3. Accessibility: Update aria-hidden for screen readers
        // NOTE: this triggers warning in case an element an element
        //  stays focus while aria-hidden is true
        // This is a known issue and can be mitigated by ensuring
        // that focus is properly managed in the application.
        // if (
        //   isVisible &&
        //   document.activeElement &&
        //   !data.realm.root.contains(document.activeElement)
        // ) {
        //   data.realm.root.removeAttribute("aria-hidden");
        // } else {
        //   data.realm.root.setAttribute("aria-hidden", "true");
        // }
        if (!data.realm.ready) data.realm.initialize();
      } else {
        // 4. UNMOUNT: Expression became false
        if (data.realm) {
          data.realm.root.remove();
        }
      }
    };

    realmQueue.add(render);
  });
}
